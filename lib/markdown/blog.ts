// lib/markdown/blog.ts
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { type BlogPost, type BlogCategory } from '@/types/blog'

const BLOGS_DIR = path.join(process.cwd(), 'content/blogs')

/** Returns the path only if the file actually exists in /public. */
function resolvePublicImage(imagePath: string): string {
  if (!imagePath) return ''
  const abs = path.join(process.cwd(), 'public', imagePath.replace(/^\//, ''))
  return fs.existsSync(abs) ? imagePath : ''
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

export function getFeaturedPosts(limit = 3): BlogPost[] {
  return getAllPosts()
    .filter((p) => p.featured)
    .slice(0, limit)
}
