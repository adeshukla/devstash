# Implementation Plan

## Overview

Implementation tasks for Phase 7 (Automation Scripts). Two read-only `.mjs`
content scripts (MDX linter, link checker), Lighthouse CI (`@lhci/cli` +
`lighthouserc.cjs` + workflow), and pre-commit/CI wiring. Constraints: only
`@lhci/cli` may be added; pnpm only; scripts are `.mjs` using installed
`gray-matter` + Node built-ins; read-only (no content mutation). Gates:
`pnpm exec tsc --noEmit` zero errors, `pnpm build` succeeds, `lint:content` and
`check:links` exit zero on current content.

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": ["1", "2", "3.1"],
      "rationale": "The MDX linter, link checker, and the @lhci/cli install are independent entry points."
    },
    {
      "wave": 2,
      "tasks": ["3.2", "3.3", "4"],
      "rationale": "Lighthouse config + workflow depend on @lhci/cli being installed (3.1); pre-commit/CI wiring depends on the scripts (1,2) existing and their package scripts."
    },
    {
      "wave": 3,
      "tasks": ["5"],
      "rationale": "Final gates run after all scripts, config, and wiring are in place."
    }
  ],
  "dependencies": {
    "3.2": ["3.1"],
    "3.3": ["3.1"],
    "4": ["1", "2"],
    "5": ["1", "2", "3.2", "3.3", "4"]
  }
}
```

## Tasks

- [x] 1. MDX frontmatter linter
  - Create `scripts/seo/check-metadata.mjs` (ESM, runnable via `node`). Read all
    `content/blogs/*.{mdx,md}` with `gray-matter`. Apply ERROR rules (missing
    required field, duplicate slug, non-kebab slug, invalid category, non-positive
    -integer readingTime, tags not 2–5, non-boolean draft/featured, canonical !=
    `https://devstash.me/blog/<slug>`) and WARNING rules (description outside
    130–160 chars, missing featuredImage in `/public`). Print a per-file report +
    summary; `process.exit(1)` only when errors exist. Never modify files. Handle
    a missing `content/blogs` dir as empty (exit 0).
  - Add a `"lint:content": "node scripts/seo/check-metadata.mjs"` script to package.json.
  - Verify: `pnpm lint:content` exits 0 on current content (3 posts; long
    descriptions / missing images appear as warnings only).
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8; Properties 1, 2, 4_

- [x] 2. Broken link checker
  - Create `scripts/automation/check-links.mjs` (ESM, runnable via `node`). Build
    the valid internal route set from static routes + blog slugs + project slugs +
    category values + tags. Extract markdown and `href` links from each post's
    body. Skip `mailto:`/`tel:`/`#` links. Validate internal routes against the set
    (normalize trailing slash / hash / query) and internal assets against `/public`
    via `fs.existsSync`. Report unresolved internal links as ERRORs and exit
    non-zero. Behind a `--external` flag, additionally `fetch` external URLs
    (HEAD, GET fallback) and report non-success as warnings (network errors =
    warning, never hard error). Never modify files.
  - Add a `"check:links": "node scripts/automation/check-links.mjs"` script.
  - Verify: `pnpm check:links` exits 0 on current content.
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8; Properties 1, 3, 4, 5_

- [x] 3. Lighthouse CI
- [x] 3.1 Install @lhci/cli
  - Run `pnpm add -D @lhci/cli` (the only new package permitted in Phase 7).
    Confirm it lands in devDependencies and the lockfile updates.
  - _Requirements: 3.1_
- [x] 3.2 Lighthouse config
  - Create `lighthouserc.cjs` at the project root: collect home, `/blog`,
    `/projects`, `/about` against `pnpm start`; assert minScore 0.9 for
    performance, accessibility, seo, best-practices; upload to
    temporary-public-storage. Confirm it parses:
    `node -e "require('./lighthouserc.cjs')"`.
  - _Requirements: 3.2, 3.3, 3.6_
- [x] 3.3 Lighthouse workflow
  - Create `.github/workflows/lighthouse.yml` mirroring `ci.yml`'s pnpm setup
    (`pnpm/action-setup` v3, node 20 with pnpm cache): on PR + push to main,
    install, `pnpm build` (with `NEXT_PUBLIC_SITE_URL`), then run lhci autorun with
    `LHCI_GITHUB_APP_TOKEN` from secrets. Ensure valid YAML.
  - _Requirements: 3.4, 3.5, 3.6_

- [x] 4. CI & pre-commit wiring
  - Append `pnpm lint:content` to `.husky/pre-commit` (after `pnpm lint-staged`).
  - Add a `content-checks` job to `.github/workflows/ci.yml` (pnpm install →
    `pnpm lint:content` → `pnpm check:links`) on push/PR, parallel to typecheck.
  - Confirm `lint:content` and `check:links` scripts exist in package.json (from
    tasks 1 & 2). Keep the addition fast and warning-tolerant.
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 5. Final verification gates
  - Run `pnpm exec tsc --noEmit` (zero errors — `.mjs` scripts excluded from TS).
    Run `pnpm lint:content` and `pnpm check:links` (both exit 0 on current
    content). Run `pnpm build` (succeeds). Validate `lighthouserc.cjs` parses and
    both workflow YAMLs are well-formed. Briefly sanity-check the linter's
    error path by confirming it would exit non-zero on a known-bad input
    (scratch test, then revert — no committed content changes).
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

## Notes

- Properties 1–5 from the design are verified via execution + the gates in
  task 5 (no test-runner package is added, per the constraint).
- `LHCI_GITHUB_APP_TOKEN` and the Lighthouse CI GitHub App are a manual setup
  step for Adesh; the workflow references the secret but the repo wiring is code.
- Indexing / Search Console pings are intentionally deferred to Phase 8.
