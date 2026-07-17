// components/blog/BlogFilter.tsx
'use client'

import { useState } from 'react'
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
  // Tags stay collapsed on mobile by default — category is the primary filter,
  // tags are a secondary refinement most visitors won't need immediately.
  // Always expanded at lg where they live in the sidebar with room to spare.
  const [tagsOpen, setTagsOpen] = useState(false)

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
      {/* Categories — a horizontally-scrolling single-row chip strip on
          mobile (Airbnb/YouTube-style category bar), same wrapped grid as
          before at lg where it sits in the sidebar with vertical room. */}
      <div>
        <p className="text-ds-muted mb-2 text-xs font-semibold tracking-widest uppercase">
          Category
        </p>
        {/* `overflow-x-auto` forces overflow-y to `auto` too (CSS spec: if
            one axis isn't `visible`, the other can't stay `visible` either),
            which was clipping the top of .gradient-ring-hover's -2px ::before
            ring. `-m-1 p-1` gives it room on every side, not just left/right/
            bottom, while keeping the row's visual position unchanged. */}
        <div className="-m-1 flex [scrollbar-width:none] gap-2 overflow-x-auto p-1 lg:m-0 lg:flex-wrap lg:overflow-visible lg:p-0 [&::-webkit-scrollbar]:hidden">
          <CardTilt>
            <button
              onClick={() => setParam('category', null)}
              aria-current={!selectedCategory ? 'true' : undefined}
              className={cn(
                'gradient-ring-hover shrink-0 rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-colors',
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
                      'gradient-ring-hover shrink-0 rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-colors',
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

      {/* Tags — secondary refinement, collapsed by default on mobile so the
          filter block stays compact and post cards stay in the first fold;
          always open at lg where it lives in the sidebar. */}
      {tags.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setTagsOpen((o) => !o)}
            className="text-ds-muted hover:text-ds-text mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase lg:pointer-events-none"
            aria-expanded={tagsOpen}
          >
            Tags
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              aria-hidden="true"
              className={cn('transition-transform lg:hidden', tagsOpen && 'rotate-180')}
            >
              <path
                d="M2 3.5L5 6.5L8 3.5"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <div className={cn('flex flex-wrap gap-2', !tagsOpen && 'hidden lg:flex')}>
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
