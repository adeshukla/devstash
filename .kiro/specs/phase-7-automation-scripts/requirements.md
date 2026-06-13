# Requirements Document

Phase 7: Automation Scripts (MDX Linter, Link Checker, Lighthouse CI)

## Introduction

Phase 7 adds the automation layer that protects content quality and performance
as DevStash grows. It delivers three automations named in the steering doc:

1. An **MDX frontmatter linter** that validates every blog post before commit/CI.
2. A **broken-link checker** that catches dead internal links (and optionally
   external ones) in blog content.
3. **Lighthouse CI** that gates performance, accessibility, SEO, and best
   practices on every PR and push to `main`.

It also wires the linter and link checker into the existing pre-commit hook and
GitHub Actions CI so they run automatically.

### Scope boundaries

- Only one new package is permitted: `@lhci/cli` as a devDependency (explicitly
  pre-approved for Phase 7 by the steering doc). No other new packages.
- Runnable scripts are authored as `.mjs` (ESM) so they run under plain `node`
  with no TypeScript runner — using already-installed `gray-matter` + Node
  built-ins (`fs`, global `fetch`).
- pnpm only. No `--turbopack` added to package.json. No folder-structure changes
  (scripts live in the existing `scripts/seo/`, `scripts/automation/` dirs).
- Indexing / Search Console pings are OUT of scope (they belong to Phase 8).
- Scripts are READ-ONLY: they never mutate content files.

### Severity model (applies to the linter and link checker)

- **ERROR** → structural / uniqueness / format problems that would break the app
  or routing. Any error makes the script exit non-zero (fails commit/CI).
- **WARNING** → SEO best-practice issues (e.g. description length, missing
  featured image). Warnings are reported but never fail the run. This matches
  the app's existing graceful handling and the current shipped content (which
  has long descriptions and not-yet-added images).

## Glossary

- **MDX frontmatter**: the YAML block at the top of each `content/blogs/*.mdx`
  file, parsed with `gray-matter`.
- **Internal link**: a link whose href starts with `/` (a route or a `/public`
  asset). **External link**: an `http(s)://` link to another origin.
- **Lighthouse CI (`@lhci/cli`)**: tooling that runs Lighthouse audits against a
  locally-served build and asserts category score thresholds.
- **CI**: the GitHub Actions pipeline in `.github/workflows/`.

## Requirements

### Requirement 1: MDX Frontmatter Linter

**User Story:** As the content owner, I want every blog post's frontmatter
validated automatically so that malformed or duplicate metadata never reaches
production.

#### Acceptance Criteria

1. THE system SHALL provide `scripts/seo/check-metadata.mjs`, runnable via a
   `lint:content` package script using `node`.
2. THE linter SHALL read every `content/blogs/*.mdx` and `*.md` file using
   `gray-matter` and validate each one.
3. THE linter SHALL emit an ERROR for any of: a missing required field (title,
   slug, description, author, createdAt, updatedAt, category, tags,
   featuredImage, readingTime, canonical, draft, featured); a duplicate slug
   across posts; a slug that is not lowercase kebab-case; a `category` not in the
   allowed `BlogCategory` set; `readingTime` that is not a positive integer;
   `tags` not an array of 2–5 items; `draft`/`featured` not booleans; a
   `canonical` that does not equal `https://devstash.me/blog/<slug>`.
4. THE linter SHALL emit a WARNING (never an error) for: a description outside
   130–160 chars; a `featuredImage` file that does not exist under `/public`.
5. WHEN at least one ERROR is found THEN the process SHALL exit non-zero; WHEN
   only warnings (or nothing) are found THEN it SHALL exit zero.
6. THE linter SHALL print a clear per-file report (file → errors/warnings) and a
   final summary count.
7. THE linter SHALL NOT modify any file.
8. WHEN run against the current repository content THEN it SHALL exit zero (the
   three existing posts are structurally valid; their long descriptions / missing
   images surface only as warnings).

### Requirement 2: Broken Link Checker

**User Story:** As the content owner, I want broken internal links in blog posts
caught automatically so that readers and crawlers never hit a 404.

#### Acceptance Criteria

1. THE system SHALL provide `scripts/automation/check-links.mjs`, runnable via a
   `check:links` package script using `node`.
2. THE checker SHALL extract links from all blog MDX content (markdown
   `[text](href)` links and anchor `href="..."` attributes).
3. THE checker SHALL build the set of valid internal routes from: the known
   static routes, all blog slugs, all project slugs, all blog category values,
   and all blog tags.
4. WHEN an internal link (href starting with `/`) targets a route THEN the
   checker SHALL verify it resolves to a known route; WHEN it targets an asset
   (e.g. `/images/...`, `/og/...`) THEN it SHALL verify the file exists under
   `/public`.
5. WHEN an internal link does not resolve THEN it SHALL be reported as an ERROR
   and the process SHALL exit non-zero.
6. THE checker SHALL skip `mailto:`, `tel:`, and pure `#anchor` links.
7. WHERE the `--external` flag is passed THEN the checker SHALL additionally
   issue HEAD/GET requests (via global `fetch`) to external URLs and report
   non-success responses; WITHOUT the flag external links SHALL be skipped so the
   default run is network-free and CI-stable.
8. THE checker SHALL NOT modify any file, and SHALL exit zero when no broken
   internal links are found.

### Requirement 3: Lighthouse CI

**User Story:** As the site owner, I want performance/SEO/accessibility gated in
CI so that regressions are blocked before merge.

#### Acceptance Criteria

1. THE system SHALL add `@lhci/cli` as a devDependency via `pnpm add -D`.
2. THE system SHALL provide a `lighthouserc.cjs` config that collects key URLs
   (home, `/blog`, `/projects`, `/about`) against a locally-served production
   build (`pnpm start`).
3. THE config SHALL assert minimum category scores of 0.9 for performance,
   accessibility, SEO, and best-practices.
4. THE system SHALL provide `.github/workflows/lighthouse.yml` that, on pull
   request and push to `main`, installs with pnpm, builds, and runs `lhci
autorun`, passing `LHCI_GITHUB_APP_TOKEN` from secrets.
5. THE workflow SHALL use pnpm (via `pnpm/action-setup`) consistent with the
   existing `ci.yml`, and set `NEXT_PUBLIC_SITE_URL` for the build.
6. THE config and workflow SHALL be valid (parseable) and not break the existing
   `ci.yml` pipeline.

### Requirement 4: CI & Pre-commit Integration

**User Story:** As a maintainer, I want the linter and link checker to run
automatically so that quality checks aren't forgotten.

#### Acceptance Criteria

1. THE `.husky/pre-commit` hook SHALL run the MDX linter (`lint:content`) in
   addition to the existing `lint-staged`.
2. THE existing `.github/workflows/ci.yml` SHALL gain steps (or a job) that run
   `lint:content` and `check:links` on push/PR.
3. THE package.json SHALL expose `lint:content` and `check:links` scripts (and
   may expose an `lhci`/Lighthouse helper script).
4. THE pre-commit addition SHALL be fast and SHALL NOT block commits for
   warning-level issues.

### Requirement 5: Quality Gate

**User Story:** As a maintainer, I want Phase 7 to keep the project green so that
nothing regresses.

#### Acceptance Criteria

1. WHEN `pnpm exec tsc --noEmit` runs THEN it SHALL report zero errors (the new
   `.mjs` scripts are outside the TS compilation set and must not introduce type
   errors anywhere).
2. WHEN `pnpm build` runs THEN it SHALL complete successfully.
3. WHEN `lint:content` and `check:links` run against current content THEN they
   SHALL exit zero.
4. ALL additions SHALL use pnpm only and SHALL NOT add packages other than
   `@lhci/cli`.
