import 'server-only'

import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

import { validateFrontmatter } from '@/lib/automation/utils'
import type { BlogFrontmatter } from '@/types/blog'

// Absolute directory that every post write must stay inside.
const BLOGS_DIR = path.join(process.cwd(), 'content', 'blogs')

// Kebab-case slug: lowercase alphanumerics joined by single hyphens.
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Validate a slug and resolve it to a path that is guaranteed to live inside
 * `content/blogs/`. Throws `INVALID_SLUG` for a malformed slug and
 * `PATH_TRAVERSAL` if the resolved target escapes the blogs directory.
 */
export function resolvePostPath(slug: string): string {
  if (!SLUG_RE.test(slug)) throw new Error('INVALID_SLUG')

  const target = path.join(BLOGS_DIR, `${slug}.mdx`)
  const root = path.resolve(BLOGS_DIR) + path.sep
  if (!path.resolve(target).startsWith(root)) throw new Error('PATH_TRAVERSAL')

  return target
}

/**
 * Write a blog post to `content/blogs/<slug>.mdx`.
 *
 * - Create mode (`overwrite: false`): refuses to clobber an existing file
 *   (`SLUG_EXISTS`).
 * - Update mode (`overwrite: true`): requires the file to already exist
 *   (`NOT_FOUND`).
 *
 * Frontmatter is validated before any write and serialized with `gray-matter`.
 * The write target is always inside `content/blogs/`.
 */
export function writePost(
  frontmatter: BlogFrontmatter,
  body: string,
  opts: { overwrite: boolean }
): string {
  const target = resolvePostPath(frontmatter.slug)
  const exists = fs.existsSync(target)

  if (!opts.overwrite && exists) throw new Error('SLUG_EXISTS')
  if (opts.overwrite && !exists) throw new Error('NOT_FOUND')

  validateFrontmatter(frontmatter, `${frontmatter.slug}.mdx`)

  fs.writeFileSync(target, matter.stringify(body, frontmatter), 'utf8')

  return target
}
