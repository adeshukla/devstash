#!/usr/bin/env node
// scripts/seo/check-metadata.mjs
//
// MDX frontmatter linter (Phase 7, Requirement 1).
//
// Reads every content/blogs/*.{mdx,md} file with gray-matter and validates the
// frontmatter against DevStash's blog schema. ERROR-level findings make the
// process exit non-zero (fails commit/CI); WARNING-level findings are reported
// but never affect the exit code.
//
// READ-ONLY: this script never modifies any file.
// Run via: node scripts/seo/check-metadata.mjs   (pnpm lint:content)

import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

// --- Constants -------------------------------------------------------------

const BLOG_DIR = path.join(process.cwd(), 'content', 'blogs')
const PUBLIC_DIR = path.join(process.cwd(), 'public')

const REQUIRED = [
  'title',
  'slug',
  'description',
  'author',
  'createdAt',
  'updatedAt',
  'category',
  'tags',
  // featuredImage is intentionally optional: when absent (or pointing at a
  // missing file) the blog card + post page fall back to a generated,
  // on-brand CategoryIllustration. Existence is still warned on below when set.
  'readingTime',
  'canonical',
  'draft',
  'featured',
]

// Mirror of types/blog.ts BLOG_CATEGORIES (source of truth lives there).
const CATEGORIES = [
  'automation',
  'frontend',
  'performance',
  'ai-workflows',
  'devtools',
  'tutorials',
  'career',
]

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const DESC_MIN = 130
const DESC_MAX = 160

// --- Minimal ANSI helpers (no dependency) ----------------------------------

const supportsColor = process.stdout.isTTY && !process.env.NO_COLOR
const paint = (code, s) => (supportsColor ? `\x1b[${code}m${s}\x1b[0m` : s)
const red = (s) => paint('31', s)
const yellow = (s) => paint('33', s)
const green = (s) => paint('32', s)
const dim = (s) => paint('2', s)
const bold = (s) => paint('1', s)

// --- Validation helpers -----------------------------------------------------

function isMissing(value, field) {
  if (value === undefined || value === null) return true
  if (field === 'tags') return !Array.isArray(value) || value.length === 0
  if (typeof value === 'string') return value.trim().length === 0
  return false
}

/**
 * Validate a single post's frontmatter.
 * Pushes findings into errors[] / warnings[]. Uses seenSlugs to detect dupes.
 */
function validate(data, { errors, warnings, seenSlugs }) {
  // Required fields present.
  for (const field of REQUIRED) {
    if (isMissing(data[field], field)) {
      errors.push(`missing required field: ${field}`)
    }
  }

  const slug = data.slug

  // Slug format + uniqueness (only if a non-empty slug string is present).
  if (typeof slug === 'string' && slug.trim().length > 0) {
    if (!KEBAB.test(slug)) {
      errors.push(`slug is not lowercase kebab-case: "${slug}"`)
    }
    if (seenSlugs.has(slug)) {
      errors.push(`duplicate slug: "${slug}" (already used in ${seenSlugs.get(slug)})`)
    }
    // Note: the caller registers the slug after validation so the *second*
    // occurrence is the one flagged.
  }

  // Category in allowed set.
  if (data.category !== undefined && !CATEGORIES.includes(data.category)) {
    errors.push(`category "${data.category}" not in allowed set: ${CATEGORIES.join(', ')}`)
  }

  // readingTime positive integer.
  if (data.readingTime !== undefined) {
    if (!Number.isInteger(data.readingTime) || data.readingTime <= 0) {
      errors.push(
        `readingTime must be a positive integer, got: ${JSON.stringify(data.readingTime)}`
      )
    }
  }

  // tags: array of 2-5 items.
  if (data.tags !== undefined) {
    if (!Array.isArray(data.tags)) {
      errors.push('tags must be an array')
    } else if (data.tags.length < 2 || data.tags.length > 5) {
      errors.push(`tags must have 2-5 items, got ${data.tags.length}`)
    }
  }

  // draft / featured booleans.
  for (const field of ['draft', 'featured']) {
    if (data[field] !== undefined && typeof data[field] !== 'boolean') {
      errors.push(`${field} must be a boolean, got: ${JSON.stringify(data[field])}`)
    }
  }

  // canonical must match exact pattern.
  if (typeof slug === 'string' && data.canonical !== undefined) {
    const expected = `https://devstash.me/blog/${slug}`
    if (data.canonical !== expected) {
      errors.push(`canonical must equal "${expected}", got "${data.canonical}"`)
    }
  }

  // --- WARNING rules (never affect exit code) ---

  // description length outside [130, 160].
  if (typeof data.description === 'string') {
    const len = data.description.length
    if (len < DESC_MIN || len > DESC_MAX) {
      warnings.push(`description length ${len} is outside ${DESC_MIN}-${DESC_MAX} chars`)
    }
  }

  // featuredImage file existence under /public. Normalize the same way
  // lib/markdown/blog.ts resolvePublicImage() does (tolerate a leading slash,
  // a missing one, or a `public/` prefix) so the linter agrees with what the
  // site will actually render. http(s) URLs are skipped — unsupported anyway.
  if (typeof data.featuredImage === 'string' && data.featuredImage.trim()) {
    const raw = data.featuredImage.trim()
    if (!/^https?:\/\//i.test(raw)) {
      const rel = raw.replace(/^\/+/, '').replace(/^public\//, '')
      const abs = path.join(PUBLIC_DIR, rel)
      if (!fs.existsSync(abs)) {
        warnings.push(`featuredImage not found under /public: ${data.featuredImage}`)
      }
    }
  }
}

// --- Main -------------------------------------------------------------------

function main() {
  // Missing content/blogs dir → treat as empty, exit 0.
  if (!fs.existsSync(BLOG_DIR)) {
    console.log(dim(`No content/blogs directory found at ${BLOG_DIR} — nothing to check.`))
    process.exit(0)
  }

  const files = fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith('.mdx') || f.endsWith('.md'))
    .sort()

  const seenSlugs = new Map() // slug -> first file that used it
  let errorCount = 0
  let warningCount = 0

  console.log(bold(`\nLinting ${files.length} blog file(s) in content/blogs\n`))

  for (const file of files) {
    const errors = []
    const warnings = []
    const abs = path.join(BLOG_DIR, file)

    let data
    try {
      const raw = fs.readFileSync(abs, 'utf8')
      data = matter(raw).data
    } catch (err) {
      // File-level ERROR; continue to the next file (don't crash the run).
      errors.push(`failed to parse frontmatter: ${err.message}`)
    }

    if (data) {
      validate(data, { errors, warnings, seenSlugs })
      // Register slug after validation so the 2nd+ occurrence is flagged.
      if (typeof data.slug === 'string' && data.slug.trim().length > 0) {
        if (!seenSlugs.has(data.slug)) seenSlugs.set(data.slug, file)
      }
    }

    errorCount += errors.length
    warningCount += warnings.length

    // Per-file report.
    if (errors.length === 0 && warnings.length === 0) {
      console.log(`${green('✓')} ${file}`)
    } else {
      const tag = errors.length > 0 ? red('✗') : yellow('!')
      console.log(`${tag} ${file}`)
      for (const e of errors) console.log(`    ${red('ERROR')}   ${e}`)
      for (const w of warnings) console.log(`    ${yellow('WARNING')} ${w}`)
    }
  }

  // Final summary.
  console.log('')
  const summary = `${errorCount} error(s), ${warningCount} warning(s) across ${files.length} file(s)`
  if (errorCount > 0) {
    console.log(red(bold(summary)))
    process.exit(1)
  } else {
    console.log(green(bold(summary)))
    process.exit(0)
  }
}

main()
