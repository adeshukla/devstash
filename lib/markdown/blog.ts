// lib/markdown/blog.ts
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { type BlogPost, type BlogCategory } from '@/types/blog'

const BLOGS_DIR = path.join(process.cwd(), 'content/blogs')

/**
 * Normalize a frontmatter `featuredImage` into a valid, public-relative URL —
 * or '' if it can't be resolved (callers then fall back to the generated
 * CategoryIllustration).
 *
 * Tolerates the common ways the path gets written by hand or by the admin
 * editor: a leading slash, a missing leading slash, or a `public/` prefix all
 * resolve to the same `/images/...` URL. This matters because next/image
 * throws when a local `src` doesn't start with a leading slash, so returning
 * the raw string unchanged (as this used to) turned a small typo into a
 * render-time crash on the blog list / homepage.
 *
 * External http(s) URLs return '' on purpose: no next/image remote host is
 * configured, so the illustration fallback is safer than a src next/image
 * would reject.
 */
function resolvePublicImage(imagePath: string): string {
  const raw = imagePath.trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return ''
  const normalized = raw.replace(/^\/+/, '').replace(/^public\//, '')
  const abs = path.join(process.cwd(), 'public', normalized)
  return fs.existsSync(abs) ? `/${normalized}` : ''
}

function parsePost(fileName: string): BlogPost | null {
  try {
    const filePath = path.join(BLOGS_DIR, fileName)
    const raw = fs.readFileSync(filePath, 'utf-8')
    const { data, content } = matter(raw)

    if (!data.title || !data.slug || !data.description) return null

    const wordCount = content.split(/\s+/).filter(Boolean).length
    const autoReadingTime = Math.max(1, Math.ceil(wordCount / 200))

    return {
      title: String(data.title),
      slug: String(data.slug),
      description: String(data.description),
      author: String(data.author ?? 'Adesh Shukla'),
      createdAt: String(data.createdAt ?? new Date().toISOString().split('T')[0]),
      updatedAt: String(data.updatedAt ?? data.createdAt ?? new Date().toISOString().split('T')[0]),
      category: (data.category ?? 'tutorials') as BlogCategory,
      tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
      // Only set if file actually exists in /public — falls back to gradient placeholder
      featuredImage: resolvePublicImage(String(data.featuredImage ?? '')),
      readingTime: typeof data.readingTime === 'number' ? data.readingTime : autoReadingTime,
      canonical: String(data.canonical ?? `https://devstash.me/blog/${data.slug}`),
      draft: Boolean(data.draft ?? false),
      featured: Boolean(data.featured ?? false),
      content,
    }
  } catch {
    return null
  }
}

export function getAllPosts(includeDrafts = false): BlogPost[] {
  if (!fs.existsSync(BLOGS_DIR)) return []

  return fs
    .readdirSync(BLOGS_DIR)
    .filter((f) => f.endsWith('.mdx') || f.endsWith('.md'))
    .map((f) => parsePost(f))
    .filter((post): post is BlogPost => post !== null)
    .filter((post) => includeDrafts || !post.draft)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getPostBySlug(slug: string): BlogPost | null {
  return getAllPosts(true).find((p) => p.slug === slug) ?? null
}

export function getRelatedPosts(currentSlug: string, limit = 3): BlogPost[] {
  const current = getPostBySlug(currentSlug)
  if (!current) return []

  return getAllPosts()
    .filter((p) => p.slug !== currentSlug)
    .map((p) => ({
      post: p,
      score:
        (p.category === current.category ? 3 : 0) +
        p.tags.filter((t) => current.tags.includes(t)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ post }) => post)
}

export function getPostsByCategory(category: BlogCategory): BlogPost[] {
  return getAllPosts().filter((p) => p.category === category)
}

export function getPostsByTag(tag: string): BlogPost[] {
  return getAllPosts().filter((p) => p.tags.includes(tag))
}

export function getAllCategories(): { category: BlogCategory; count: number }[] {
  const posts = getAllPosts()
  const counts = new Map<BlogCategory, number>()
  for (const post of posts) {
    counts.set(post.category, (counts.get(post.category) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
}

export function getAllTags(): { tag: string; count: number }[] {
  const posts = getAllPosts()
  const counts = new Map<string, number>()
  for (const post of posts) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
}

// ─── Tag indexability ────────────────────────────────────────────────────────
//
// A tag archive holding a single post is a near-duplicate of that post: same
// title, same description, one card. Indexing it splits relevance between two
// URLs competing for the same query and pads the index with thin pages. As of
// this change the majority of tags on the site have exactly one post, so the
// tag archives were the largest single block of URLs in the sitemap while
// carrying almost no unique content.
//
// Thin tag pages stay live and linked for human navigation — they're just
// marked noindex,follow and dropped from the sitemap, so link equity still
// flows through them to the posts.

export const MIN_POSTS_FOR_INDEXABLE_TAG = 2

/** Tags with enough posts for the archive to be worth indexing on its own. */
export function getIndexableTags(): { tag: string; count: number }[] {
  return getAllTags().filter(({ count }) => count >= MIN_POSTS_FOR_INDEXABLE_TAG)
}

/** Whether a single tag archive should be indexable (see above). */
export function isTagIndexable(tag: string): boolean {
  return getPostsByTag(tag).length >= MIN_POSTS_FOR_INDEXABLE_TAG
}

export function getFeaturedPosts(limit = 3): BlogPost[] {
  return getAllPosts()
    .filter((p) => p.featured)
    .slice(0, limit)
}
