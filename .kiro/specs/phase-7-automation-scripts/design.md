# Design Document

Phase 7: Automation Scripts (MDX Linter, Link Checker, Lighthouse CI)

## Overview

Three automations plus their CI/pre-commit wiring. The two content scripts are
plain ESM (`.mjs`) so they run under `node` with zero TypeScript tooling, using
the already-installed `gray-matter` and Node built-ins. Lighthouse CI uses the
pre-approved `@lhci/cli` devDependency with a root `lighthouserc.cjs` and a
dedicated workflow. Nothing mutates content; everything is read-only and
deterministic.

### Why `.mjs` and not `.ts`

The project has no TypeScript script runner (`tsx`/`ts-node`) installed and the
"no new packages" rule blocks adding one. `.mjs` files are excluded from
`tsconfig` compilation, so they keep `pnpm exec tsc --noEmit` green while still
running directly via `node scripts/.../*.mjs`. The build plan itself references
`node scripts/automation/check-links.js`, confirming JS-runnable scripts are the
intended shape.

## Architecture

```
package.json scripts
  ├─ lint:content  → node scripts/seo/check-metadata.mjs
  ├─ check:links   → node scripts/automation/check-links.mjs [--external]
  └─ (lhci)        → lhci autorun (CI) / local helper

.husky/pre-commit        → pnpm lint-staged  +  pnpm lint:content
.github/workflows/ci.yml → typecheck → build  (+ content-checks job)
.github/workflows/lighthouse.yml → build + lhci autorun  (uses lighthouserc.cjs)
```

Both content scripts share the same source of truth for data by reading the
filesystem directly (no import of the `@/`-aliased TS libs, which `node` can't
resolve without a bundler):

- Blog posts: `content/blogs/*.{mdx,md}` via `gray-matter`.
- Projects: `content/projects/*.json` via `JSON.parse`.
- Valid categories: a small literal array mirrored from `types/blog.ts`
  (`BLOG_CATEGORIES`), with a comment pointing back to the source of truth.

## Components and Interfaces

### 1. `scripts/seo/check-metadata.mjs`

```js
// Pseudocode shape
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

const REQUIRED = [
  'title',
  'slug',
  'description',
  'author',
  'createdAt',
  'updatedAt',
  'category',
  'tags',
  'featuredImage',
  'readingTime',
  'canonical',
  'draft',
  'featured',
]
const CATEGORIES = [
  'automation',
  'frontend',
  'performance',
  'ai-workflows',
  'devtools',
  'tutorials',
  'career',
] // mirror of types/blog.ts BLOG_CATEGORIES
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

// For each file: parse frontmatter, collect {errors[], warnings[]}.
// Track slugs in a Map to detect duplicates (error).
// ERROR rules per Requirement 1.3; WARNING rules per 1.4.
// Print per-file report + summary; process.exit(errorCount > 0 ? 1 : 0)
```

Validation detail:

- Required field present = not `undefined`/`null`/empty-string (and for `tags`,
  a non-empty array).
- Duplicate slug: second occurrence of a slug already seen → error on that file.
- `canonical` must `=== 'https://devstash.me/blog/' + slug`.
- `featuredImage` existence: `fs.existsSync(path.join('public', img.replace(/^\//,'')))`
  → warning if missing.
- `description` length outside [130,160] → warning.

### 2. `scripts/automation/check-links.mjs`

```js
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

// 1. Build valid route set:
//    static = ['/', '/about','/projects','/blog','/resources','/tools',
//              '/contact','/privacy','/terms']
//    + '/blog/<slug>' for each post
//    + '/projects/<slug>' for each project json
//    + '/blog/category/<cat>' for each category present in posts
//    + '/blog/tag/<tag>' for each tag present in posts
// 2. Extract links from each post's raw body:
//    markdown:  /\[[^\]]*\]\(([^)\s]+)\)/g
//    html href: /href=["']([^"']+)["']/g
// 3. Classify: skip mailto:/tel:/#...; external = /^https?:\/\//;
//    internal = startsWith('/').
// 4. Internal asset (has a file extension under known asset dirs) → existsSync in /public.
//    Internal route → normalize (strip trailing slash, strip #hash/?query) → must be in route set.
// 5. --external flag → fetch(url,{method:'HEAD'}) with timeout; fall back to GET
//    on 405; report non-ok. Network errors on external = warning (flaky), not hard error.
// Exit non-zero if any internal link is broken.
```

### 3. `lighthouserc.cjs` (project root)

```js
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm start',
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/blog',
        'http://localhost:3000/projects',
        'http://localhost:3000/about',
      ],
      numberOfRuns: 1,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
}
```

`.cjs` is used (not `.js`) because the project may be treated as ESM by tooling;
`@lhci/cli` reads a CommonJS config reliably as `.cjs`.

### 4. `.github/workflows/lighthouse.yml`

Mirrors `ci.yml`'s pnpm setup:

```yaml
name: Lighthouse CI
on:
  push: { branches: [main] }
  pull_request: { branches: [main, dev] }
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
        env: { NEXT_PUBLIC_SITE_URL: https://devstash.me }
      - run: pnpm dlx @lhci/cli autorun   # or: pnpm exec lhci autorun
        env: { LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }} }
```

### 5. CI + pre-commit wiring

- `.husky/pre-commit`: append `pnpm lint:content` after `pnpm lint-staged`.
- `.github/workflows/ci.yml`: add a `content-checks` job (pnpm install →
  `pnpm lint:content` → `pnpm check:links`) running in parallel with typecheck.
- `package.json` scripts: `"lint:content"`, `"check:links"`, and an optional
  `"lhci": "lhci autorun"`.

## Data Models

No persistent models. In-memory only:

- `LintFinding { file: string, level: 'error'|'warning', message: string }`
- `LinkFinding { file: string, href: string, reason: string }`
- `RouteSet: Set<string>` of valid normalized internal paths.

## Correctness Properties

### Property 1: Error-gated exit

The linter (and link checker) exits non-zero **iff** at least one ERROR-level
finding exists; warning-only runs exit zero.

**Validates: Requirements 1.5, 2.5, 2.8**

### Property 2: Slug-uniqueness detection

Given any set of posts, the linter reports a duplicate-slug error iff two or more
posts share the same slug.

**Validates: Requirements 1.3**

### Property 3: Internal-link resolution soundness

For any internal link, the checker reports it broken iff the normalized target is
neither a member of the computed valid-route set nor an existing `/public` asset.

**Validates: Requirements 2.3, 2.4, 2.5**

### Property 4: Read-only / no mutation

Running either script leaves every file in `content/` and `public/` byte-for-byte
unchanged.

**Validates: Requirements 1.7, 2.8**

### Property 5: Network isolation by default

Without `--external`, the link checker performs no network I/O, so its result is
deterministic and CI-stable.

**Validates: Requirements 2.7**

## Error Handling

- Unparseable MDX / frontmatter → reported as a file-level ERROR (don't crash the
  whole run; continue to the next file, then exit non-zero).
- Missing `content/blogs` or `content/projects` dir → treat as empty, exit zero
  (no posts to check) rather than throwing.
- `--external` network failures → warnings, not hard errors (avoids flaky CI).
- Lighthouse server-start failures surface as `lhci` non-zero exit (expected CI
  behavior).

## Testing Strategy

Config/script work verified by execution and gates rather than a unit suite (no
test runner is installed, per the no-new-packages rule):

1. `pnpm exec tsc --noEmit` → zero errors (scripts are `.mjs`, excluded from TS).
2. `pnpm lint:content` → runs against the 3 existing posts, exits zero (warnings
   allowed for long descriptions / missing images).
3. Temporarily introduce a duplicate slug / bad canonical in a scratch check to
   confirm the linter exits non-zero (Property 1, 2), then revert.
4. `pnpm check:links` → exits zero on current content; a deliberately broken
   internal link in a scratch test exits non-zero (Property 3), then revert.
5. `pnpm build` → still succeeds.
6. Validate `lighthouserc.cjs` parses (`node -e "require('./lighthouserc.cjs')"`)
   and both workflow YAMLs are well-formed.

## Constraints Compliance

- Only `@lhci/cli` added (devDependency), pre-approved for Phase 7. No other
  packages.
- Runnable scripts are `.mjs` using installed `gray-matter` + Node built-ins.
- pnpm only; no `--turbopack`; scripts and workflows under existing dirs.
- Read-only scripts; no content mutation. TypeScript strict unaffected.
