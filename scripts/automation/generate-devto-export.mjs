#!/usr/bin/env node
// scripts/automation/generate-devto-export.mjs
//
// Generates dev.to-ready Markdown exports from content/blogs/*.mdx, for the
// POSSE ("Post on Own Site, Syndicate Elsewhere") backlink strategy: DevStash
// stays the canonical source, dev.to gets a `canonical_url` front-matter field
// pointing back at it, so cross-posting earns a backlink with zero
// duplicate-content SEO risk. See dev.to's own docs on this front-matter field:
// https://dev.to/help/organizations/importing-your-organizations-content
//
// What this does that a plain copy-paste would not:
// - Strips the <Callout> JSX component (dev.to's renderer doesn't run React)
//   and rewrites it as a plain Markdown blockquote.
// - Rewrites site-relative links (/blog/..., /about, /lab/...) to absolute
//   devstash.me URLs — a relative link means nothing off-site.
// - Sanitizes tags for dev.to's actual rule: hyphens/case are silently
//   stripped on their end (`ai-workflows` -> `aiworkflows`), and only the
//   first 4 tags are kept.
// - Sets `published: false` always — this writes a DRAFT on dev.to's side;
//   review the import there and publish manually. This script never posts
//   anything itself, it only prepares the file.
//
// READ-ONLY on content/blogs/ — output goes to /devto-export/ (gitignored),
// never back into content/.
//
// Usage:
//   node scripts/automation/generate-devto-export.mjs              # all posts
//   node scripts/automation/generate-devto-export.mjs some-slug     # one post
//   node scripts/automation/generate-devto-export.mjs slug-a slug-b # a few

import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

const CWD = process.cwd()
const BLOG_DIR = path.join(CWD, 'content', 'blogs')
const OUT_DIR = path.join(CWD, 'devto-export')
const SITE_URL = 'https://devstash.me'

const CALLOUT_ICON = { info: 'ℹ️', tip: '💡', warning: '⚠️' }

function sanitizeTag(tag) {
  return tag.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function rewriteCallouts(body) {
  const calloutRe = /<Callout type="(\w+)"(?: title="([^"]*)")?>([\s\S]*?)<\/Callout>/g
  return body.replace(calloutRe, (_match, type, title, inner) => {
    const icon = CALLOUT_ICON[type] ?? 'ℹ️'
    const label = title ? `${icon} **${title}**` : icon
    const lines = inner
      .trim()
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    return [`> ${label}`, '>', ...lines.map((line) => `> ${line}`)].join('\n')
  })
}

function rewriteRelativeLinks(body) {
  // [text](/blog/slug) or [text](/about) etc. -> absolute devstash.me URL.
  // Leaves already-absolute (http/https/mailto) links untouched.
  return body.replace(/\]\((\/[^)]*)\)/g, (_match, relPath) => `](${SITE_URL}${relPath})`)
}

function buildDevToFrontmatter(fm, slug) {
  const tags = [...new Set(fm.tags.map(sanitizeTag).filter(Boolean))].slice(0, 4)
  const lines = [
    '---',
    `title: ${JSON.stringify(fm.title)}`,
    'published: false',
    `description: ${JSON.stringify(fm.description)}`,
    `tags: ${tags.join(', ')}`,
    `canonical_url: "${SITE_URL}/blog/${slug}"`,
    '---',
  ]
  return lines.join('\n')
}

function exportPost(filename) {
  const fullPath = path.join(BLOG_DIR, filename)
  const raw = fs.readFileSync(fullPath, 'utf8')
  const { data: fm, content } = matter(raw)

  if (fm.draft) {
    console.log(`  skip ${filename} (draft: true)`)
    return null
  }

  const body = rewriteRelativeLinks(rewriteCallouts(content.trim()))
  const output = `${buildDevToFrontmatter(fm, fm.slug)}\n\n${body}\n`

  fs.mkdirSync(OUT_DIR, { recursive: true })
  const outPath = path.join(OUT_DIR, `${fm.slug}.md`)
  fs.writeFileSync(outPath, output, 'utf8')
  return outPath
}

function main() {
  const requestedSlugs = process.argv.slice(2)
  const allFiles = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx'))

  const targetFiles =
    requestedSlugs.length === 0
      ? allFiles
      : allFiles.filter((f) => requestedSlugs.includes(f.replace(/\.mdx$/, '')))

  if (targetFiles.length === 0) {
    console.error('No matching posts found in content/blogs/.')
    process.exit(1)
  }

  console.log(`Exporting ${targetFiles.length} post(s) to ${path.relative(CWD, OUT_DIR)}/\n`)

  const written = []
  for (const file of targetFiles.sort()) {
    const outPath = exportPost(file)
    if (outPath) {
      written.push(outPath)
      console.log(`  ✓ ${path.relative(CWD, outPath)}`)
    }
  }

  console.log(
    `\n${written.length} file(s) written. Each has published: false and a canonical_url ` +
      `back to devstash.me — paste the body into dev.to's editor, review, then publish manually.`
  )
}

main()
