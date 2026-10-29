'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { Badge, CardTilt } from '@/components/ui'
import { cn } from '@/lib/utils/cn'

export interface LabTool {
  slug: string
  name: string
  blurb: string
  tag: string
  highlights: string[]
  /** Short facts from the project file, shown as chips. */
  stats: string[]
  tech: string[]
  /** Rendered on the server (LabPreview) and passed through. */
  preview: ReactNode
}

/** Tag filter + a tool grid whose cards open to show what is inside. */
export function LabTools({ tools }: { tools: LabTool[] }) {
  const [tag, setTag] = useState('All')
  const [open, setOpen] = useState<string | null>(null)
  const tags = ['All', ...new Set(tools.map((t) => t.tag))]
  const shown = tag === 'All' ? tools : tools.filter((t) => t.tag === tag)

  return (
    <>
      <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter tools by type">
        {tags.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={tag === t}
            onClick={() => setTag(t)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-sm transition-colors',
              tag === t
                ? 'border-ds-accent text-ds-accent bg-ds-accent/10'
                : 'border-ds-border text-ds-muted hover:border-ds-border2 hover:text-ds-text'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2">
        {shown.map((tool) => {
          const isOpen = open === tool.slug
          return (
            <CardTilt key={tool.slug}>
              <article className="group flex h-full flex-col gap-5">
                <Link
                  href={`/lab/${tool.slug}`}
                  aria-label={`Open ${tool.name}`}
                  className="focus-visible:ring-ds-accent focus-visible:ring-offset-ds-bg card-spotlight card-glow block rounded-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  {tool.preview}
                </Link>
                <div className="flex flex-1 flex-col gap-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-ds-text text-xl font-semibold tracking-tight">
                      {tool.name}
                    </h3>
                    <Badge variant="muted" className="shrink-0 text-xs">
                      {tool.tag}
                    </Badge>
                  </div>
                  <p className="text-ds-muted text-sm leading-relaxed">{tool.blurb}</p>
                  {tool.stats.length > 0 && (
                    <ul className="flex flex-wrap gap-1.5" aria-label="Facts">
                      {tool.stats.map((x) => (
                        <li
                          key={x}
                          className="border-ds-border text-ds-muted rounded-full border px-2.5 py-1 font-mono text-[11px]"
                        >
                          {x}
                        </li>
                      ))}
                    </ul>
                  )}

                  {isOpen && (
                    <div id={`lab-${tool.slug}-more`} className="flex flex-col gap-4 pt-1">
                      <ul className="flex flex-col gap-2.5">
                        {tool.highlights.slice(0, 4).map((h) => (
                          <li key={h} className="text-ds-muted flex gap-3 text-sm leading-relaxed">
                            <span className="bg-ds-accent mt-2 h-1.5 w-1.5 shrink-0 rounded-full" />
                            {h}
                          </li>
                        ))}
                      </ul>
                      <div className="flex flex-wrap gap-1.5">
                        {tool.tech.map((t) => (
                          <Badge key={t} variant="default" className="font-mono text-xs">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-sm">
                    <Link
                      href={`/lab/${tool.slug}`}
                      className="text-ds-accent font-medium hover:underline"
                    >
                      Open it &rarr;
                    </Link>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`lab-${tool.slug}-more`}
                      onClick={() => setOpen(isOpen ? null : tool.slug)}
                      className="text-ds-muted hover:text-ds-text transition-colors"
                    >
                      {isOpen ? 'Hide details' : "What's inside"}
                    </button>
                    <Link
                      href={`/projects/${tool.slug}`}
                      className="text-ds-muted hover:text-ds-text transition-colors"
                    >
                      Case study
                    </Link>
                  </div>
                </div>
              </article>
            </CardTilt>
          )
        })}
      </div>
    </>
  )
}
