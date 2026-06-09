// lib/utils/toc.ts
import { type TOCItem } from '@/types/blog'

/**
 * Extracts h2 and h3 headings from raw MDX content.
 * IDs are generated to match rehype-slug's algorithm.
 */
export function extractTOC(content: string): TOCItem[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm
  const items: TOCItem[] = []
  let match: RegExpExecArray | null

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length as 2 | 3
    // Strip markdown formatting from text (bold, italic, inline code, links)
    const text = match[2]
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [text](url) → text
      .replace(/[`*_]/g, '') // backticks, bold/italic
      .trim()

    // Replicate rehype-slug ID generation
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    if (id) items.push({ id, text, level })
  }

  return items
}
