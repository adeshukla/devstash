# Requirements Document

Phase 9: Blog Admin Panel (local-only authoring tool)

## Introduction

Phase 9 adds a password-protected `/admin` panel and an MDX file-write API that
lets the owner create and edit blog posts as real `content/blogs/*.mdx` files
during local development. Because Vercel's runtime filesystem is read-only
(writes would not persist), the entire admin surface is **disabled in
production** — it exists only to speed up local authoring; posts are then
committed and pushed through Git as usual.

### Chosen model (confirmed with owner)

- **Local-only authoring tool.** `/admin` and `/api/admin/*` are fully disabled
  (HTTP 404) when `NODE_ENV === 'production'`. They run only under `next dev`.
- **Auth:** single-password gate via `iron-session` (encrypted cookie). Login
  password from `ADMIN_PASSWORD`; cookie encrypted with `SESSION_SECRET`.
- **Persistence:** the write API writes `.mdx` files directly into
  `content/blogs/`. The owner reviews, commits, and pushes.

### Scope boundaries

- Exactly one new package: `iron-session` (pre-approved for Phase 9). No others.
- Secrets are server-only: `ADMIN_PASSWORD`, `SESSION_SECRET` — never
  `NEXT_PUBLIC_*`, never sent to the client.
- pnpm only; no `--turbopack`; Server Components by default; `ds-*` tokens and
  existing UI primitives (`Button`, `Input`, `Textarea`) only.
- New files under `app/admin/`, `app/api/admin/`, `lib/auth/`. No change to the
  public site's structure or behavior.
- `/admin` must never be indexed (noindex) and must not appear in the sitemap.
- Out of scope: production persistence, image uploads, multi-user/roles, a
  database. (Those are explicitly not this phase.)

## Glossary

- **iron-session**: library that stores an encrypted, signed session in an
  HTTP-only cookie; no server-side session store needed.
- **Admin-enabled**: the runtime condition under which the admin exists at all —
  true only in local dev (`NODE_ENV !== 'production'`).
- **Frontmatter**: the YAML block at the top of each MDX post, matching
  `BlogFrontmatter` in `types/blog.ts`.
- **Path traversal**: an attack where a crafted slug (e.g. `../../etc/x`) escapes
  the intended directory; the write API must prevent this.

## Requirements

### Requirement 1: Production Lockout

**User Story:** As the site owner, I want the admin completely absent in
production so that the live site exposes no auth or write surface.

#### Acceptance Criteria

1. WHEN `NODE_ENV === 'production'` THEN every `/admin` page route SHALL respond
   as not-found (404) and render no admin UI.
2. WHEN `NODE_ENV === 'production'` THEN every `/api/admin/*` route (including
   login) SHALL respond 404 and perform no auth or filesystem action.
3. WHERE the admin is disabled THEN no `ADMIN_PASSWORD`/`SESSION_SECRET` value
   SHALL be read into any client-visible output.
4. THE admin routes SHALL be excluded from `app/sitemap.ts` and SHALL carry
   `noindex` metadata regardless of environment.

### Requirement 2: Authentication

**User Story:** As the owner, I want a simple password login so that only I can
access the admin while developing.

#### Acceptance Criteria

1. THE system SHALL add `iron-session` and configure an encrypted session cookie
   (HTTP-only, `sameSite=lax`, `secure` when not on http) using `SESSION_SECRET`.
2. THE `/admin/login` route SHALL present a password form posting to
   `/api/admin/login`.
3. WHEN the submitted password equals `ADMIN_PASSWORD` (compared in constant
   time) THEN the session SHALL be marked authenticated and the user redirected
   to `/admin`.
4. WHEN the password is wrong THEN login SHALL fail with a generic error and no
   session SHALL be created.
5. THE `/api/admin/logout` route SHALL destroy the session.
6. WHEN an unauthenticated request hits a protected `/admin` page THEN it SHALL
   redirect to `/admin/login`; WHEN it hits a protected `/api/admin/*` data route
   THEN it SHALL return 401.
7. WHERE `ADMIN_PASSWORD` or `SESSION_SECRET` is unset in dev THEN the admin
   SHALL fail safe (login impossible / clear error) rather than allowing access.

### Requirement 3: Admin Panel UI

**User Story:** As the owner, I want a dashboard to list, create, and edit posts
so that authoring is faster than hand-writing files.

#### Acceptance Criteria

1. THE `/admin` dashboard SHALL list all posts (including drafts) with title,
   slug, status (draft/published), and an edit link.
2. THE `/admin/new` route SHALL provide a form for all required frontmatter
   fields plus the MDX body, using existing `Input`/`Textarea`/`Button`
   primitives and `ds-*` tokens.
3. THE `/admin/edit/[slug]` route SHALL load an existing post's frontmatter +
   body into the same form for editing.
4. THE admin SHALL have its own minimal layout (no public Navbar/Footer) and a
   logout control.
5. THE forms SHALL surface server validation errors clearly and confirm success.

### Requirement 4: MDX Write API

**User Story:** As the owner, I want create/update to write real MDX files so
that posts enter the normal file-based pipeline.

#### Acceptance Criteria

1. THE system SHALL provide `/api/admin/posts` supporting create (POST) and
   update (PUT), both requiring an authenticated session and admin-enabled.
2. THE API SHALL validate input (zod) and build frontmatter conforming to
   `BlogFrontmatter`; it SHALL reject invalid payloads with 400 and field errors.
3. THE API SHALL write the post to `content/blogs/<slug>.mdx` using `gray-matter`
   stringify, where `<slug>` is validated kebab-case.
4. THE API SHALL prevent path traversal: the resolved target path MUST stay
   inside `content/blogs/`; any slug resolving outside SHALL be rejected (400).
5. WHEN creating a post whose slug already exists THEN the API SHALL reject it
   (409) rather than overwrite; update (PUT) SHALL target an existing file.
6. THE written frontmatter SHALL pass `validateFrontmatter` and the Phase 7 MDX
   linter (`pnpm lint:content`).
7. THE API SHALL set `canonical` to `https://devstash.me/blog/<slug>` and default
   `createdAt`/`updatedAt` sensibly (preserve `createdAt` on update, bump
   `updatedAt`).

### Requirement 5: Security & Validation

**User Story:** As the owner, I want the admin to be safe-by-default so that even
locally it can't be abused or leak secrets.

#### Acceptance Criteria

1. THE password comparison SHALL be constant-time (e.g. `crypto.timingSafeEqual`)
   to avoid timing leaks.
2. `ADMIN_PASSWORD` and `SESSION_SECRET` SHALL never be referenced via
   `NEXT_PUBLIC_*` nor included in any client component or response body.
3. ALL `/api/admin/*` mutating routes SHALL verify admin-enabled AND an
   authenticated session before any filesystem action.
4. THE write API SHALL sanitize/validate the slug (kebab-case, no path
   separators, no `..`) before constructing any path.
5. THE admin pages and APIs SHALL not be reachable without authentication except
   the login page and the login POST.

### Requirement 6: Quality Gate

**User Story:** As a maintainer, I want Phase 9 to keep the project green so that
nothing regresses.

#### Acceptance Criteria

1. WHEN `pnpm exec tsc --noEmit` runs THEN it SHALL report zero errors (no
   `as any`/`@ts-ignore`).
2. WHEN `pnpm build` runs THEN it SHALL complete successfully (admin routes build
   but are inert in the production runtime).
3. WHEN `pnpm lint:content` and `pnpm check:links` run THEN they SHALL exit zero.
4. ALL additions SHALL use pnpm only and add no package other than
   `iron-session`.
