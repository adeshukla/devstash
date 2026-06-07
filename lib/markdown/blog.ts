// Server-only — uses Node.js 'fs'. Never import in Client Components.
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import type { BlogPost, BlogPostMeta, BlogFrontmatter, BlogCategory } from '@/types/blog'

const BLOGS_DIR = path.join(process.cwd(), 'content/blogs')

export function getAllPosts(includeDrafts = false): BlogPostMeta[] {
  if (!fs.existsSync(BLOGS_DIR)) return []

  const files = fs.readdirSync(BLOGS_DIR).filter((f) => f.endsWith('.mdx'))

  const posts = files.map((filename) => {
    const fullPath = path.join(BLOGS_DIR, filename)
    const raw = fs.readFileSync(fullPath, 'utf-8')
    const { data } = matter(raw)
    return data as BlogPostMeta
  })

  return posts
    .filter((post) => includeDrafts || !post.draft)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getPostBySlug(slug: string): BlogPost | null {
  const fullPath = path.join(BLOGS_DIR, `${slug}.mdx`)
  if (!fs.existsSync(fullPath)) return null

  const raw = fs.readFileSync(fullPath, 'utf-8')
  const { data, content } = matter(raw)
  const wordCount = content.split(/\s+/).filter(Boolean).length

  return {
    ...(data as BlogFrontmatter),
    content, // raw MDX string — rendered by next-mdx-remote in the page
    wordCount,
  }
}

export function getRelatedPosts(currentSlug: string, tags: string[], limit = 3): BlogPostMeta[] {
  return getAllPosts()
    .filter((post) => post.slug !== currentSlug)
    .filter((post) => post.tags.some((tag) => tags.includes(tag)))
    .slice(0, limit)
}

export function getPostsByCategory(category: BlogCategory): BlogPostMeta[] {
  return getAllPosts().filter((post) => post.category === category)
}

export function getPostsByTag(tag: string): BlogPostMeta[] {
  return getAllPosts().filter((post) => post.tags.includes(tag))
}

export function getAllCategories(): BlogCategory[] {
  return Array.from(new Set(getAllPosts().map((p) => p.category)))
}

export function getAllTags(): string[] {
  return Array.from(new Set(getAllPosts().flatMap((p) => p.tags)))
}

export function getFeaturedPosts(limit = 3): BlogPostMeta[] {
  return getAllPosts()
    .filter((post) => post.featured)
    .slice(0, limit)
}
