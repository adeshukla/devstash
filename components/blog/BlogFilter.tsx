// components/blog/BlogFilter.tsx
'use client'

import { useRouter, usePathname } from 'next/navigation'
import { type BlogCategory, BLOG_CATEGORIES } from '@/types/blog'
import { cn } from '@/lib/utils/cn'
import { CardTilt } from '@/components/ui/CardTilt'

interface BlogFilterProps {
  categories: { category: BlogCategory; count: number }[]
  tags: { tag: string; count: number }[]
  selectedCategory?: string
  selectedTag?: string
}

export function BlogFilter({ categories, tags, selectedCategory, selectedTag }: BlogFilterProps) {
  const router = useRouter()
  const pathname = usePathname()

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams()

    // Preserve the other param
    if (key !== 'category' && selectedCategory) params.set('category', selectedCategory)
    if (key !== 'tag' && selectedTag) params.set('tag', selectedTag)

    if (value) params.set(key, value)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  function clearAll() {
    router.push(pathname, { scroll: false })
  }

  const hasFilter = Boolean(selectedCategory || selectedTag)

  return (
    <div className="space-y-4">
      {/* Categories */}
      <div>
        <p className="text-ds-muted mb-2 text-xs font-semibold tracking-widest uppercase">
          Category
        </p>
        <div className="flex flex-wrap gap-2">
          <CardTilt>
            <button
              onClick={() => setParam('category', null)}
              aria-current={!selectedCategory ? 'true' : undefined}
              className={cn(
                'gradient-ring-hover rounded-full border px-3 py-1 text-sm transition-colors',
                !selectedCategory
                  ? 'border-ds-accent bg-ds-accent text-white'
                  : 'border-ds-border bg-ds-surface text-ds-muted hover:border-ds-border2 hover:text-ds-text'
              )}
            >
              All
            </button>
          </CardTilt>
          {BLOG_CATEGORIES.filter(({ value }) => categories.some((c) => c.category === value)).map(
            ({ label, value }) => {
              const count = categories.find((c) => c.category === value)?.count ?? 0
              return (
                <CardTilt key={value}>
                  <button
                    onClick={() => setParam('category', selectedCategory === value ? null : value)}
                    aria-current={selectedCategory === value ? 'true' : undefined}
                    className={cn(
                      'gradient-ring-hover rounded-full border px-3 py-1 text-sm transition-colors',
                      selectedCategory === value
                        ? 'border-ds-accent bg-ds-accent text-white'
                        : 'border-ds-border bg-ds-surface text-ds-muted hover:border-ds-border2 hover:text-ds-text'
                    )}
                  >
                    {label} <span className="text-xs opacity-60">({count})</span>
                  </button>
                </CardTilt>
              )
            }
          )}
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div>
          <p className="text-ds-muted mb-2 text-xs font-semibold tracking-widest uppercase">Tags</p>
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 20).map(({ tag, count }) => (
              <button
                key={tag}
                onClick={() => setParam('tag', selectedTag === tag ? null : tag)}
                aria-current={selectedTag === tag ? 'true' : undefined}
                className={cn(
                  'gradient-ring-hover rounded border px-2.5 py-0.5 font-mono text-xs transition-colors',
                  selectedTag === tag
                    ? 'border-ds-accent bg-ds-accent/10 text-ds-accent'
                    : 'border-ds-border bg-ds-surface2 text-ds-muted hover:border-ds-border2 hover:text-ds-text'
                )}
              >
                #{tag} <span className="opacity-60">({count})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Clear filter */}
      {hasFilter && (
        <button
          onClick={clearAll}
          className="text-ds-muted hover:text-ds-text text-xs underline underline-offset-2 transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
