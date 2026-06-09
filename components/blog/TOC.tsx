// components/blog/TOC.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { type TOCItem } from '@/types/blog'
import { cn } from '@/lib/utils/cn'

interface TOCProps {
  items: TOCItem[]
}

export function TOC({ items }: TOCProps) {
  const [activeId, setActiveId] = useState<string>('')
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (items.length === 0) return

    const headingElements = items
      .map(({ id }) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)

    if (headingElements.length === 0) return

    // Track which headings are visible; pick the topmost one
    const visible = new Set<string>()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.add(entry.target.id)
          } else {
            visible.delete(entry.target.id)
          }
        }
        // Active = topmost visible heading (matches DOM order)
        const firstVisible = headingElements.find((el) => visible.has(el.id))
        if (firstVisible) setActiveId(firstVisible.id)
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    )

    for (const el of headingElements) observerRef.current.observe(el)

    return () => observerRef.current?.disconnect()
  }, [items])

  if (items.length === 0) return null

  return (
    <nav aria-label="Table of contents" className="space-y-1">
      <p className="text-ds-muted mb-3 text-xs font-semibold tracking-widest uppercase">
        On this page
      </p>
      <ul className="space-y-0.5">
        {items.map(({ id, text, level }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              onClick={(e) => {
                e.preventDefault()
                document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
              }}
              className={cn(
                'block rounded py-1 text-sm leading-snug transition-colors',
                level === 3 && 'pl-4',
                activeId === id ? 'text-ds-accent' : 'text-ds-muted hover:text-ds-text'
              )}
            >
              {text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
