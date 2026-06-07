import type { BlogFrontmatter } from '@/types/blog'

// ─── SLUG ─────────────────────────────────────────────────────────────

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ─── READING TIME ────────────────────────────────────────────────────

const WORDS_PER_MINUTE = 200

export function readingTime(content: string): number {
  const wordCount = content.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE))
}

// ─── FRONTMATTER VALIDATOR ────────────────────────────────────────────

const REQUIRED_FIELDS: (keyof BlogFrontmatter)[] = [
  'title',
  'slug',
  'description',
  'author',
  'createdAt',
  'updatedAt',
  'category',
  'tags',
  'featuredImage',
  'readingTime',
  'canonical',
  'draft',
  'featured',
]

export function validateFrontmatter(data: Partial<BlogFrontmatter>, filename: string): void {
  const missing = REQUIRED_FIELDS.filter(
    (field) => data[field] === undefined || data[field] === null
  )

  if (missing.length > 0) {
    throw new Error(
      `[validateFrontmatter] "${filename}" is missing required fields: ${missing.join(', ')}`
    )
  }

  if (data.description && data.description.length > 160) {
    console.warn(
      `[validateFrontmatter] "${filename}" description is ${data.description.length} chars (recommended: max 160)`
    )
  }

  if (data.tags && data.tags.length > 5) {
    console.warn(
      `[validateFrontmatter] "${filename}" has ${data.tags.length} tags (recommended: max 5)`
    )
  }
}

// ─── DATE HELPERS ─────────────────────────────────────────────────────

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function getRelativeTime(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}
