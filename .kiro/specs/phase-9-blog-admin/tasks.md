# Implementation Plan

## Overview

Implementation tasks for Phase 9 (Blog Admin Panel — local-only). Adds
`iron-session` auth, an `isAdminEnabled()` production lockout, a path-safe MDX
write helper, `/api/admin/*` routes, the `/admin` UI (dashboard, login, editor),
and env docs. Constraints: only `iron-session` may be added; secrets are
server-only (no `NEXT_PUBLIC_*`); admin is 404 in production; pnpm only; `ds-*`
tokens + existing UI primitives. Gates: `pnpm exec tsc --noEmit` zero errors,
`pnpm build` succeeds, `lint:content` + `check:links` exit 0.

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": ["1", "2", "6"],
      "rationale": "Install iron-session, the path-safe write helper (no iron-session dep), and the env-example update are independent entry points."
    },
    {
      "wave": 2,
      "tasks": ["3"],
      "rationale": "Auth foundations (adminEnabled + session) depend on iron-session being installed."
    },
    {
      "wave": 3,
      "tasks": ["4.1", "4.2", "5.1", "5.2", "5.3"],
      "rationale": "API routes and admin UI depend on the auth foundations (3); the posts API also depends on the write helper (1... task 2)."
    },
    {
      "wave": 4,
      "tasks": ["7"],
      "rationale": "Final gates run after all code is in place."
    }
  ],
  "dependencies": {
    "3": ["1"],
    "4.1": ["3"],
    "4.2": ["2", "3"],
    "5.1": ["3"],
    "5.2": ["3"],
    "5.3": ["3"],
    "7": ["2", "3", "4.1", "4.2", "5.1", "5.2", "5.3", "6"]
  }
}
```

## Tasks

- [ ] 1. Install iron-session
  - Run `pnpm add iron-session` (the only new package permitted in Phase 9).
    Confirm it lands in dependencies and the lockfile updates.
  - _Requirements: 2.1, 6.4_

- [ ] 2. Path-safe MDX write helper
  - Create `lib/markdown/writePost.ts` (server-only: `import 'server-only'`).
    Export `resolvePostPath(slug)` that validates kebab-case slug and guarantees
    the resolved path stays inside `content/blogs/` (reject `INVALID_SLUG` /
    `PATH_TRAVERSAL`), and `writePost(frontmatter, body, { overwrite })` that
    enforces create-vs-update existence (`SLUG_EXISTS` 409 / `NOT_FOUND` 404),
    runs `validateFrontmatter`, and writes via `gray-matter` `stringify`. Never
    writes outside the dir.
  - _Requirements: 4.3, 4.4, 4.5, 4.6, 5.4; Properties 3, 4, 5_

- [ ] 3. Auth foundations
  - Create `lib/auth/adminEnabled.ts` exporting `isAdminEnabled()` (`NODE_ENV !==
'production'`). Create `lib/auth/session.ts` (server-only) with `SessionData`,
    `sessionOptions` (iron-session; password from `SESSION_SECRET`; cookie
    `devstash_admin`, httpOnly, sameSite lax, secure in prod), and
    `getSession()` using `next/headers` cookies. Secrets read only here.
  - _Requirements: 1.3, 2.1, 5.2; Property 6_

- [ ] 4. Admin API routes
- [ ] 4.1 Login & logout
  - Create `app/api/admin/login/route.ts` (POST) and
    `app/api/admin/logout/route.ts` (POST). Both: `if (!isAdminEnabled()) → 404`.
    Login compares the submitted password to `ADMIN_PASSWORD` with
    `crypto.timingSafeEqual` (hash both to fixed length to avoid length leak);
    on match set `session.isAdmin = true` and save; on miss return 401 generic
    error; if secrets unconfigured, fail safe with a clear error. Logout destroys
    the session.
  - _Requirements: 2.3, 2.4, 2.5, 5.1, 5.3_
- [ ] 4.2 Posts create/update API
  - Create `app/api/admin/posts/route.ts` with POST (create) and PUT (update).
    Both: `if (!isAdminEnabled()) → 404`; then `getSession()` → `if (!isAdmin) →
401`. zod-validate the payload, build a complete `BlogFrontmatter`
    (`canonical = https://devstash.me/blog/<slug>`; create sets createdAt =
    updatedAt = today; update preserves createdAt, bumps updatedAt; readingTime
    from input or computed). Call `writePost`; map errors to 400/404/409. Return
    slug on success. No fs action before auth.
  - _Requirements: 4.1, 4.2, 4.7, 5.3; Properties 2, 4, 5_

- [ ] 5. Admin UI
- [ ] 5.1 Admin layout + dashboard
  - Create `app/admin/layout.tsx` (Server Component): `if (!isAdminEnabled())
notFound()`; export `metadata` with `robots noindex`; render a minimal shell
    (title bar + logout button calling `/api/admin/logout`) using `ds-*` tokens,
    no public Navbar/Footer. Create `app/admin/page.tsx` dashboard: redirect to
    `/admin/login` if not authenticated; else list `getAllPosts(true)` with
    title/slug/status and edit links + a "New post" link.
  - _Requirements: 1.1, 1.4, 3.1, 3.4, 2.6_
- [ ] 5.2 Login page
  - Create `app/admin/login/page.tsx`: `if (!isAdminEnabled()) notFound()`;
    redirect to `/admin` if already authenticated; render a password form
    (existing `Input`/`Button`) posting to `/api/admin/login`, showing a generic
    error on failure.
  - _Requirements: 2.2, 2.6_
- [ ] 5.3 Post editor + new/edit pages
  - Create `components/admin/PostEditor.tsx` (`'use client'`) with fields for all
    frontmatter (title, slug auto-suggested via `slugify`, description, category
    select from `BLOG_CATEGORIES`, tags, featuredImage, readingTime, draft,
    featured) + MDX body `Textarea`; submits JSON to POST/PUT `/api/admin/posts`;
    renders field errors + success. Create `app/admin/new/page.tsx` (create mode,
    auth-guarded) and `app/admin/edit/[slug]/page.tsx` (loads post via
    `getPostBySlug`, edit mode, auth-guarded, 404 if missing).
  - _Requirements: 3.2, 3.3, 3.5_

- [ ] 6. Env documentation
  - Update `.env.example`: add `ADMIN_PASSWORD=` and `SESSION_SECRET=` with a
    comment that both are server-only/local-only and `SESSION_SECRET` must be
    ≥ 32 chars. Do not add real values.
  - _Requirements: 2.1, 2.7, 5.2_

- [ ] 7. Final verification gates
  - Run `pnpm exec tsc --noEmit` (zero errors), `pnpm build` (succeeds),
    `pnpm lint:content` and `pnpm check:links` (exit 0). Reason through the
    production lockout (admin 404 when NODE*ENV=production) and confirm no
    `NEXT_PUBLIC*` reference to the secrets exists (grep). Report results.
  - _Requirements: 6.1, 6.2, 6.3, 6.4; Properties 1, 6_

## Notes

- Properties 1–6 are verified via execution + the gates in task 7 and the local
  manual checks described in design.md (no test-runner package is added).
- `iron-session` requires `SESSION_SECRET` ≥ 32 chars; the owner sets
  `ADMIN_PASSWORD` and `SESSION_SECRET` in `.env.local` for local authoring.
- The admin is intentionally inert in production (Vercel FS is read-only); posts
  authored locally are committed and pushed through Git.
