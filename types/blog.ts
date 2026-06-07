export type BlogCategory =
  | 'automation'
  | 'frontend'
  | 'performance'
  | 'ai-workflows'
  | 'devtools'
  | 'tutorials'
  | 'career'

export type BlogTag = string

export interface BlogFrontmatter {
  title: string
  slug: string
  description: string
  author: string
  createdAt: string
  updatedAt: string
  category: BlogCategory
  tags: BlogTag[]
  featuredImage: string
  readingTime: number
  canonical: string
  draft: boolean
  featured: boolean
}

/** Full post — includes raw MDX content string */
export interface BlogPost extends BlogFrontmatter {
  content: string
  wordCount: number
}

/** Lightweight meta — for listing pages (no content string) */
export type BlogPostMeta = BlogFrontmatter
