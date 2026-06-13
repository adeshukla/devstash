# Design Document

Phase 9: Blog Admin Panel (local-only authoring tool)

## Overview

A password-protected `/admin` area and `/api/admin/*` routes let the owner
create/edit `content/blogs/*.mdx` files during local dev. The whole surface is
gated behind a single `isAdminEnabled()` check (`NODE_ENV !== 'production'`) so
it returns 404 in any deployed (production) runtime, plus an `iron-session`
auth gate. Writes are path-traversal-safe and produce frontmatter that passes
the existing validator and the Phase 7 linter.

### Security posture (defense in depth)

1. **Environment lockout** — `isAdminEnabled()` is checked first in every admin
   page and API route. In production it short-circuits to `notFound()` / 404.
2. **Auth gate** — `iron-session` encrypted cookie; protected routes require
   `session.isAdmin === true`.
3. **Constant-time password check** — `crypto.timingSafeEqual`.
4. **Path containment** — the write target is resolved and verified to stay
   inside `content/blogs/`.
5. **Server-only secrets** — `ADMIN_PASSWORD`, `SESSION_SECRET` read only in
   server modules; never `NEXT_PUBLIC_*`, never returned to the client.

## Architecture

```
lib/auth/
  ├─ adminEnabled.ts   isAdminEnabled(): boolean        (NODE_ENV !== 'production')
  └─ session.ts        getSession(), SessionData, sessionOptions (iron-session)

app/admin/                         (own layout — no public Navbar/Footer, noindex)
  ├─ layout.tsx        guards: isAdminEnabled() else notFound(); renders shell
  ├─ login/page.tsx    password form → POST /api/admin/login
  ├─ page.tsx          dashboard: list posts (getAllPosts(true)) + edit links
  ├─ new/page.tsx      <PostEditor mode="create" />
  └─ edit/[slug]/page.tsx  loads post → <PostEditor mode="edit" initial=... />

components/admin/PostEditor.tsx    'use client' form (Input/Textarea/Button)

app/api/admin/
  ├─ login/route.ts    POST: verify password (timing-safe) → set session
  ├─ logout/route.ts   POST: destroy session
  └─ posts/route.ts    POST create / PUT update  (auth + admin-enabled + fs write)

lib/markdown/writePost.ts   server-only: validate + path-safe write via gray-matter
```

## Components and Interfaces

### 1. `lib/auth/adminEnabled.ts`

```ts
// True only in local development. In any production runtime the admin is absent.
export function isAdminEnabled(): boolean {
  return process.env.NODE_ENV !== 'production'
}
```

### 2. `lib/auth/session.ts`

```ts
import 'server-only'
import { getIronSession, type SessionOptions } from 'iron-session'
import { cookies } from 'next/headers'

export interface SessionData {
  isAdmin?: boolean
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET ?? '',
  cookieName: 'devstash_admin',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production', // dev is http://localhost
    path: '/',
  },
}

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions)
}
```

> `import 'server-only'` guarantees the module (and the secret it reads) can
> never be bundled into client code. `iron-session` requires `password` length
> ≥ 32; if `SESSION_SECRET` is too short/missing, session creation throws — the
> login route catches this and returns a clear 500/“admin not configured”.

### 3. `app/admin/layout.tsx` (Server Component)

- First line: `if (!isAdminEnabled()) notFound()`.
- Reads the session; if not `isAdmin`, the dashboard/editor pages themselves
  redirect to `/admin/login` (the login page is exempt). Layout renders a minimal
  shell (title bar + logout button) using `ds-*` tokens; no public Navbar/Footer.
- Exports `metadata` with `robots: { index: false, follow: false }` (noindex).

Each protected page (`/admin`, `/admin/new`, `/admin/edit/[slug]`) calls
`getSession()` and `redirect('/admin/login')` when not authenticated. The login
page redirects to `/admin` if already authenticated.

### 4. `components/admin/PostEditor.tsx` (Client Component)

- Props: `{ mode: 'create' | 'edit'; initial?: PostFormValues }`.
- Fields: title, slug (auto-suggested from title via `slugify`, editable),
  description, category (`<select>` from `BLOG_CATEGORIES`), tags (comma input →
  string[]), featuredImage, readingTime (number; auto from body word count if
  blank), draft (checkbox), featured (checkbox), and the MDX body `<Textarea>`.
- Submits JSON to `POST` (create) or `PUT` (update) `/api/admin/posts`; shows
  field errors from a 400 and a success confirmation. Uses existing primitives.

### 5. `lib/markdown/writePost.ts` (server-only)

```ts
import 'server-only'
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { validateFrontmatter } from '@/lib/automation/utils'

const BLOGS_DIR = path.join(process.cwd(), 'content', 'blogs')
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function resolvePostPath(slug: string): string {
  if (!SLUG_RE.test(slug)) throw new Error('INVALID_SLUG')
  const target = path.join(BLOGS_DIR, `${slug}.mdx`)
  const root = path.resolve(BLOGS_DIR) + path.sep
  if (!path.resolve(target).startsWith(root)) throw new Error('PATH_TRAVERSAL')
  return target
}

export function writePost(frontmatter, body, { overwrite }) {
  const target = resolvePostPath(frontmatter.slug)
  const exists = fs.existsSync(target)
  if (!overwrite && exists) throw new Error('SLUG_EXISTS') // create → 409
  if (overwrite && !exists) throw new Error('NOT_FOUND') // update → 404
  validateFrontmatter(frontmatter, `${frontmatter.slug}.mdx`)
  fs.writeFileSync(target, matter.stringify(body, frontmatter), 'utf8')
  return target
}
```

### 6. `app/api/admin/posts/route.ts`

- `POST` (create) and `PUT` (update). Both: `if (!isAdminEnabled()) →
notFound()/404`; then `getSession()` → `if (!isAdmin) → 401`.
- Parse + zod-validate body → build a complete `BlogFrontmatter`:
  - `canonical = https://devstash.me/blog/<slug>`
  - create: `createdAt = updatedAt = today`; update: preserve existing
    `createdAt`, set `updatedAt = today`.
  - `readingTime` from input or computed via `readingTime(body)`.
- Call `writePost(...)`; map errors → status (`INVALID_SLUG`/`PATH_TRAVERSAL`/zod
  → 400, `SLUG_EXISTS` → 409, `NOT_FOUND` → 404). Return the slug on success.

### 7. `app/api/admin/login` & `logout`

- login `POST`: `if (!isAdminEnabled()) 404`. Read `{ password }`. Compare to
  `ADMIN_PASSWORD` with `crypto.timingSafeEqual` over equal-length buffers
  (hash both to fixed length first to avoid length leak). On match: set
  `session.isAdmin = true`, `save()`. On miss: 401 generic error.
- logout `POST`: destroy the session.

### 8. Edits to existing files

- `app/sitemap.ts`: unchanged behavior (admin routes are never added). Add a
  comment noting admin is intentionally excluded.
- `.env.example`: add `ADMIN_PASSWORD=` and `SESSION_SECRET=` with a note that
  `SESSION_SECRET` must be ≥ 32 chars and both are local-only/server-only.

## Data Models

```ts
interface SessionData {
  isAdmin?: boolean
}

interface PostFormValues {
  // editor ⇄ API payload
  title: string
  slug: string
  description: string
  category: BlogCategory
  tags: string[]
  featuredImage: string
  readingTime?: number
  draft: boolean
  featured: boolean
  body: string // MDX content (no frontmatter)
  createdAt?: string // present on edit
}
```

Persisted artifact: `content/blogs/<slug>.mdx` (frontmatter = `BlogFrontmatter`

- body). No DB.

## Correctness Properties

### Property 1: Production lockout

For every `/admin` and `/api/admin/*` route, when `NODE_ENV === 'production'`
the response is 404 and no auth check or filesystem write executes.

**Validates: Requirements 1.1, 1.2, 5.3**

### Property 2: Auth required

Any protected admin page when unauthenticated redirects to `/admin/login`, and
any protected `/api/admin/*` data/mutation route when unauthenticated returns
401 — no write occurs.

**Validates: Requirements 2.6, 5.3, 5.5**

### Property 3: Path containment

For any slug input, the write target either resolves to a path strictly inside
`content/blogs/` or the operation is rejected; no file outside that directory is
ever created or modified.

**Validates: Requirements 4.4, 5.4**

### Property 4: Well-formed output

Every post written by the API passes `validateFrontmatter` and the Phase 7 MDX
linter (required fields present, kebab slug, canonical correct).

**Validates: Requirements 4.2, 4.3, 4.6, 4.7**

### Property 5: No-overwrite on create

Creating with an existing slug never overwrites the existing file (returns 409);
update only targets an existing file.

**Validates: Requirements 4.5**

### Property 6: Secret confinement

`ADMIN_PASSWORD` and `SESSION_SECRET` appear only in `server-only` modules and
never in any client bundle or response body; the password check is constant-time.

**Validates: Requirements 1.3, 5.1, 5.2**

## Error Handling

- Missing `SESSION_SECRET`/`ADMIN_PASSWORD` in dev → login returns a clear
  "admin not configured" error; no session created (fail-safe).
- zod validation failure → 400 with field errors rendered by the editor.
- `SLUG_EXISTS` → 409; `NOT_FOUND` (update) → 404; `INVALID_SLUG`/`PATH_TRAVERSAL`
  → 400. All caught; no stack traces leaked to the client.
- All admin route handlers wrap fs work in try/catch and log server-side.

## Testing Strategy

Execution + gates (no test runner; per the no-new-packages rule beyond
iron-session):

1. `pnpm exec tsc --noEmit` → zero errors.
2. `pnpm build` → succeeds; admin routes compile.
3. Local dev manual checks (`pnpm dev` with `ADMIN_PASSWORD`/`SESSION_SECRET`
   set): wrong password rejected; correct password → dashboard; create a test
   post → file appears in `content/blogs`, then `pnpm lint:content` passes; edit
   bumps `updatedAt`; duplicate-slug create → 409; logout → protected routes
   redirect.
4. Production lockout check: build with `NODE_ENV=production` and confirm an
   `/api/admin/login` request returns 404 (reason through `isAdminEnabled`).
5. Path-traversal check: a slug like `../evil` is rejected (400), no file
   created outside `content/blogs`.
6. `pnpm check:links` + `pnpm lint:content` still green; delete any scratch test
   post afterward.

## Constraints Compliance

- One new package: `iron-session`. No others.
- Secrets server-only (`import 'server-only'`, no `NEXT_PUBLIC_`).
- Server Components by default; `PostEditor` is the only new client component.
- New files under `app/admin/`, `app/api/admin/`, `lib/auth/`,
  `lib/markdown/`, `components/admin/`. Public site untouched. `/admin` noindex +
  absent from sitemap. pnpm only; no `--turbopack`; `ds-*` tokens only.
