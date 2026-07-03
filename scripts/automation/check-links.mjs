#!/usr/bin/env node
// scripts/automation/check-links.mjs
//
// Broken link checker (Phase 7, Requirement 2).
//
// Reads every content/blogs/*.{mdx,md} body with gray-matter, extracts markdown
// and HTML href links, and validates internal links against a computed set of
// valid routes (+ /public assets). Unresolved internal links are ERRORs and make
// the process exit non-zero. External links are skipped entirely UNLESS the
// `--external` CLI flag is present, in which case they are probed over the
// network (HEAD with GET fallback); external issues are reported but NEVER change
// the exit code.
//
// READ-ONLY: this script never modifies any file.
// Run via: node scripts/automation/check-links.mjs [--external]   (pnpm check:links)

import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

// --- Paths ------------------------------------------------------------------

const CWD = process.cwd()
const APP_DIR = path.join(CWD, 'app')
const BLOG_DIR = path.join(CWD, 'content', 'blogs')
const PROJECTS_DIR = path.join(CWD, 'content', 'projects')
const PUBLIC_DIR = path.join(CWD, 'public')

// --- CLI flags --------------------------------------------------------------

const CHECK_EXTERNAL = process.argv.slice(2).includes('--external')
const EXTERNAL_TIMEOUT_MS = 10_000

// --- Static routes, derived from the app/ directory (never hand-maintained) -

/**
 * Walk app/ and collect every route that resolves from a literal (non-dynamic)
 * page.{tsx,jsx,mdx}. Route groups ("(main)", "(lab)", etc.) are stripped, as
 * are api/ and any segment containing "[" (dynamic — those are enumerated
 * separately from content, e.g. blog/project slugs).
 */
function discoverStaticRoutes(dir = APP_DIR, segments = []) {
  const routes = []
  if (!fs.existsSync(dir)) return routes

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    if (entry.name === 'api') continue
    if (entry.name.includes('[')) continue

    const isGroup = entry.name.startsWith('(') && entry.name.endsWith(')')
    const nextSegments = isGroup ? segments : [...segments, entry.name]
    const childDir = path.join(dir, entry.name)

    const hasPage = ['page.tsx', 'page.jsx', 'page.mdx'].some((f) =>
      fs.existsSync(path.join(childDir, f))
    )
    if (hasPage) routes.push('/' + nextSegments.join('/'))

    routes.push(...discoverStaticRoutes(childDir, nextSegments))
  }

  return routes
}

const STATIC_ROUTES = ['/', ...discoverStaticRoutes()]

// --- Minimal ANSI helpers (no dependency) -----------------------------------

const supportsColor = process.stdout.isTTY && !process.env.NO_COLOR
const paint = (code, s) => (supportsColor ? `\x1b[${code}m${s}\x1b[0m` : s)
const red = (s) => paint('31', s)
const yellow = (s) => paint('33', s)
const green = (s) => paint('32', s)
const dim = (s) => paint('2', s)
const bold = (s) => paint('1', s)

// --- Helpers ----------------------------------------------------------------

function readDirFiles(dir, predicate) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir).filter(predicate).sort()
}

/**
 * Build the set of valid internal routes from static routes + blog slugs +
 * project slugs + blog categories + blog tags.
 * Returns { routes: Set<string>, posts: Array<{file, content}> }.
 */
function buildRouteSet() {
  const routes = new Set(STATIC_ROUTES)
  const posts = []

  // Blog posts → /blog/<slug>, plus collect categories + tags.
  const blogFiles = readDirFiles(BLOG_DIR, (f) => f.endsWith('.mdx') || f.endsWith('.md'))
  for (const file of blogFiles) {
    const abs = path.join(BLOG_DIR, file)
    let parsed
    try {
      parsed = matter(fs.readFileSync(abs, 'utf8'))
    } catch {
      // Unparseable file: still record it (empty body) so the run continues.
      posts.push({ file, content: '' })
      continue
    }

    const data = parsed.data || {}
    posts.push({ file, content: parsed.content || '' })

    const slug =
      typeof data.slug === 'string' && data.slug.trim()
        ? data.slug.trim()
        : file.replace(/\.(mdx|md)$/, '')
    routes.add(`/blog/${slug}`)

    if (typeof data.category === 'string' && data.category.trim()) {
      routes.add(`/blog/category/${data.category.trim()}`)
    }
    if (Array.isArray(data.tags)) {
      for (const tag of data.tags) {
        if (typeof tag === 'string' && tag.trim()) {
          routes.add(`/blog/tag/${tag.trim()}`)
        }
      }
    }
  }

  // Projects → /projects/<slug>.
  const projectFiles = readDirFiles(PROJECTS_DIR, (f) => f.endsWith('.json'))
  for (const file of projectFiles) {
    const abs = path.join(PROJECTS_DIR, file)
    let slug = file.replace(/\.json$/, '')
    try {
      const json = JSON.parse(fs.readFileSync(abs, 'utf8'))
      if (typeof json.slug === 'string' && json.slug.trim()) {
        slug = json.slug.trim()
      }
    } catch {
      // Fall back to filename-derived slug if JSON is invalid.
    }
    routes.add(`/projects/${slug}`)
  }

  return { routes, posts }
}

/**
 * Strip fenced code blocks (```...```) and inline code (`...`) so example
 * syntax like `href="your-hero-image.webp"` in a code sample isn't mistaken
 * for a real link.
 */
function stripCode(content) {
  return content.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '')
}

/**
 * Extract all candidate hrefs from a post body (markdown links + html href="").
 */
function extractLinks(content) {
  const hrefs = []
  const prose = stripCode(content)
  const markdown = /\[[^\]]*\]\(([^)\s]+)\)/g
  const htmlHref = /href=["']([^"']+)["']/g

  let m
  while ((m = markdown.exec(prose)) !== null) hrefs.push(m[1])
  while ((m = htmlHref.exec(prose)) !== null) hrefs.push(m[1])

  return hrefs
}

/**
 * Normalize an internal path: strip #hash and ?query, then strip a single
 * trailing slash (except for the root '/').
 */
function normalizeInternal(href) {
  let p = href.split('#')[0].split('?')[0]
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1)
  return p
}

/**
 * Does the path look like a static asset (has a file extension on its last
 * segment, e.g. /images/x.webp, /og/y.png, /file.pdf)?
 */
function looksLikeAsset(p) {
  const last = p.split('/').pop() || ''
  return /\.[a-z0-9]+$/i.test(last)
}

// --- External link probing --------------------------------------------------

async function probeExternal(url) {
  // Returns { ok: boolean, status?: number, networkError?: string }.
  const attempt = async (method) => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), EXTERNAL_TIMEOUT_MS)
    try {
      const res = await fetch(url, {
        method,
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'user-agent': 'devstash-link-checker' },
      })
      return { status: res.status }
    } finally {
      clearTimeout(timer)
    }
  }

  try {
    let { status } = await attempt('HEAD')
    // Some servers reject HEAD (405) or misbehave (501/403) — retry with GET.
    if (status === 405 || status === 501 || status === 403) {
      ;({ status } = await attempt('GET'))
    }
    return { ok: status < 400, status }
  } catch (err) {
    return { networkError: err?.message || String(err) }
  }
}

// --- Main -------------------------------------------------------------------

async function main() {
  // Missing content/blogs dir → nothing to check, exit 0.
  if (!fs.existsSync(BLOG_DIR)) {
    console.log(dim(`No content/blogs directory found at ${BLOG_DIR} — nothing to check.`))
    process.exit(0)
  }

  const { routes, posts } = buildRouteSet()

  console.log(bold(`\nChecking links in ${posts.length} blog file(s) in content/blogs`))
  console.log(
    dim(
      `${routes.size} valid internal route(s) computed • external checks: ${
        CHECK_EXTERNAL ? 'ON (--external)' : 'OFF'
      }\n`
    )
  )

  let internalErrors = 0
  let externalIssues = 0
  let filesWithFindings = 0

  // Collect external probes across all files, dedup by URL, run after reporting
  // internal results so default (network-free) runs stay fast & deterministic.
  const externalQueue = [] // { file, href }

  for (const { file, content } of posts) {
    const findings = [] // { level, href, reason }
    const hrefs = extractLinks(content)

    for (const href of hrefs) {
      // Skip mailto: / tel: / pure #anchor links.
      if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) {
        continue
      }

      // External links.
      if (/^https?:\/\//i.test(href)) {
        if (CHECK_EXTERNAL) externalQueue.push({ file, href })
        continue
      }

      // Internal links (must start with '/').
      if (href.startsWith('/')) {
        const norm = normalizeInternal(href)
        if (looksLikeAsset(norm)) {
          const abs = path.join(PUBLIC_DIR, norm.replace(/^\//, ''))
          if (!fs.existsSync(abs)) {
            findings.push({
              level: 'error',
              href,
              reason: `asset not found under /public (${path.join('public', norm.replace(/^\//, ''))})`,
            })
          }
        } else if (!routes.has(norm)) {
          findings.push({
            level: 'error',
            href,
            reason: 'route not found in valid route set',
          })
        }
        continue
      }

      // Other relative forms (e.g. "foo", "./bar") → warning, never crash.
      findings.push({
        level: 'warning',
        href,
        reason: 'unrecognized relative link form (not / , http(s):// , mailto:, tel:, #)',
      })
    }

    if (findings.length > 0) {
      filesWithFindings++
      console.log(`${red('✗')} ${file}`)
      for (const f of findings) {
        if (f.level === 'error') {
          internalErrors++
          console.log(`    ${red('ERROR')}   ${f.href} — ${f.reason}`)
        } else {
          console.log(`    ${yellow('WARNING')} ${f.href} — ${f.reason}`)
        }
      }
    } else {
      console.log(`${green('✓')} ${file}`)
    }
  }

  // Run external probes (only when --external was passed).
  if (CHECK_EXTERNAL && externalQueue.length > 0) {
    console.log(dim(`\nProbing ${externalQueue.length} external link(s)…`))
    // Dedup identical URLs to minimize requests.
    const byUrl = new Map()
    for (const item of externalQueue) {
      if (!byUrl.has(item.href)) byUrl.set(item.href, [])
      byUrl.get(item.href).push(item.file)
    }

    for (const [url, files] of byUrl) {
      const result = await probeExternal(url)
      if (result.networkError) {
        externalIssues++
        console.log(
          `    ${yellow('WARNING')} ${url} — network/timeout: ${result.networkError} ${dim(`(${files.join(', ')})`)}`
        )
      } else if (!result.ok) {
        externalIssues++
        console.log(
          `    ${yellow('WARNING')} ${url} — HTTP ${result.status} ${dim(`(${files.join(', ')})`)}`
        )
      } else {
        console.log(`    ${green('ok')} ${dim(`${result.status}`)} ${url}`)
      }
    }
  }

  // Summary.
  console.log('')
  const summary = `${internalErrors} broken internal link(s), ${externalIssues} external issue(s) across ${posts.length} file(s)`
  if (internalErrors > 0) {
    console.log(red(bold(summary)))
    process.exit(1)
  } else {
    console.log(green(bold(summary)))
    process.exit(0)
  }
}

main().catch((err) => {
  // Unexpected failure: report and exit non-zero (don't silently pass).
  console.error(red(`Unexpected error: ${err?.stack || err}`))
  process.exit(1)
})
