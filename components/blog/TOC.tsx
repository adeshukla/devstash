// components/blog/TOC.tsx
'use client'

import { useEffect, useState } from 'react'
import { type TOCItem } from '@/types/blog'
import { cn } from '@/lib/utils/cn'

interface TOCProps {
  items: TOCItem[]
  /** Phone layout: a single closed row that shows the current section and opens on tap. */
  compact?: boolean
}

export function TOC({ items, compact = false }: TOCProps) {
  const [activeId, setActiveId] = useState<string>('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (items.length === 0) return

    const headingElements = items
      .map(({ id }) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)

    if (headingElements.length === 0) return

    // Track which headings are visible; pick the topmost one
    const visible = new Set<string>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id)
          else visible.delete(entry.target.id)
        }
        // Active = topmost visible heading (matches DOM order)
        const firstVisible = headingElements.find((el) => visible.has(el.id))
        if (firstVisible) setActiveId(firstVisible.id)
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    )

    for (const el of headingElements) observer.observe(el)
    return () => observer.disconnect()
  }, [items])

  if (items.length === 0) return null

  const current = items.find((i) => i.id === activeId)

  const list = (
    // A thin rail with a marker on the section being read; headings keep their natural width.
    <ul className="border-ds-border border-l">
      {items.map(({ id, text, level }) => {
        const active = activeId === id
        return (
          <li key={id}>
            <a
              href={`#${id}`}
              aria-current={active ? 'location' : undefined}
              onClick={(e) => {
                e.preventDefault()
                document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
                setOpen(false)
              }}
              className={cn(
                '-ml-px block border-l-2 py-1.5 pr-1 text-[13px] leading-snug transition-colors',
                level === 3 ? 'pl-6' : 'pl-3.5',
                active
                  ? 'border-ds-accent text-ds-text font-medium'
                  : 'text-ds-muted hover:text-ds-text hover:border-ds-border2 border-transparent'
              )}
            >
              {text}
            </a>
          </li>
        )
      })}
    </ul>
  )

  if (compact) {
    return (
      <nav
        aria-label="Table of contents"
        className="border-ds-border bg-ds-surface rounded-xl border"
      >
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <span className="min-w-0">
            <span className="text-ds-muted block text-[11px] font-semibold tracking-widest uppercase">
              On this page · {items.length} sections
            </span>
            <span className="text-ds-text mt-0.5 block truncate text-sm">
              {current?.text ?? items[0].text}
            </span>
          </span>
          <svg
            viewBox="0 0 16 16"
            width="16"
            height="16"
            aria-hidden="true"
            className={cn('text-ds-muted shrink-0 transition-transform', open && 'rotate-180')}
          >
            <path
              d="M3 6l5 5 5-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {open && <div className="border-ds-border border-t px-4 py-3">{list}</div>}
      </nav>
    )
  }

  return (
    <nav aria-label="Table of contents">
      <p className="text-ds-muted mb-3 text-[11px] font-semibold tracking-widest uppercase">
        On this page
      </p>
      <div className="max-h-[calc(100vh-10rem)] overflow-y-auto pr-1">{list}</div>
    </nav>
  )
}
