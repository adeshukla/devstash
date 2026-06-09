// types/blog.ts

export type BlogCategory =
  | 'automation'
  | 'frontend'
  | 'performance'
  | 'ai-workflows'
  | 'devtools'
  | 'tutorials'
  | 'career'

export const BLOG_CATEGORIES: { label: string; value: BlogCategory }[] = [
  { label: 'Automation', value: 'automation' },
  { label: 'Frontend', value: 'frontend' },
  { label: 'Performance', value: 'performance' },
  { label: 'AI Workflows', value: 'ai-workflows' },
  { label: 'Dev Tools', value: 'devtools' },
  { label: 'Tutorials', value: 'tutorials' },
  { label: 'Career', value: 'career' },
]

export interface BlogPost {
  title: string
  slug: string
  description: string
  author: string
  createdAt: string
  updatedAt: string
  category: BlogCategory
  tags: string[]
  featuredImage: string
  readingTime: number
  canonical: string
  draft: boolean
  featured: boolean
  content: string // raw MDX string — not in frontmatter, added by parsePost()
}

// Frontmatter shape used by lib/automation/utils.ts validateFrontmatter()
// All the same fields as BlogPost except the runtime-added 'content' string
export type BlogFrontmatter = Omit<BlogPost, 'content'>

export interface TOCItem {
  id: string
  text: string
  level: 2 | 3
}
