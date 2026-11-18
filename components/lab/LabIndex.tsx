'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { copyText } from '@/lib/utils/clipboard'
import { trackLab } from './track'

/** One way of looking at a tool. Most tools have one; the QR tool has Fixed and Changeable. */
export interface ToolView {
  label: string
  slug: string
  blurb: string
  /** Plain-language "use it when" line: the reason a normal person would open it. */
  useWhen: string
  example?: { input: string; output: string }
  highlights: string[]
  stats: string[]
  /** True when /projects/<slug> exists. */
  caseStudy: boolean
}

export interface IndexTool {
  id: string
  name: string
  tag: string
  /** More than one means a switch between views. */
  views: ToolView[]
}

export interface JobGroup {
  id: string
  /** What the person wants, in their words. */
  question: string
  name: string
  sub: string
  tools: IndexTool[]
}

/**
 * The Lab as a directory by job. The rail is written as what the visitor wants to do, so a first
 * visit starts with "which of these sounds like me", not with tool names.
 */
export function LabIndex({ groups, initial }: { groups: JobGroup[]; initial: string }) {
  const [job, setJob] = useState(initial)
  const [view, setView] = useState<Record<string, number>>({})
  const [open, setOpen] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  // A link like /lab?job=share opens that job. Read once on mount; the state is the source after.
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get('job')
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot read of the address on mount */
    if (wanted && groups.some((g) => g.id === wanted)) setJob(wanted)
  }, [groups])

  function pick(id: string) {
    setJob(id)
    setOpen(null)
    window.history.replaceState(null, '', id === initial ? '/lab' : `/lab?job=${id}`)
    trackLab('hub', 'choose_job', id)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const i = groups.findIndex((g) => g.id === job)
    const step =
      e.key === 'ArrowDown' || e.key === 'ArrowRight'
        ? 1
        : e.key === 'ArrowUp' || e.key === 'ArrowLeft'
          ? -1
          : 0
    if (!step) return
    e.preventDefault()
    const next = groups[(i + step + groups.length) % groups.length]
    pick(next.id)
    requestAnimationFrame(() => document.getElementById(`lab-job-${next.id}`)?.focus())
  }

  async function copyToolLink(slug: string) {
    if (!(await copyText(`${window.location.origin}/lab/${slug}`))) return
    trackLab('hub', 'copy_tool_link', slug)
    setCopied(slug)
    setTimeout(() => setCopied(null), 2000)
  }

  const group = groups.find((g) => g.id === job) ?? groups[0]

  return (
    <div className="border-ds-border grid border md:grid-cols-[280px_1fr]">
      <div
        role="tablist"
        aria-label="What do you want to do?"
        aria-orientation="vertical"
        onKeyDown={onKeyDown}
        className="border-ds-border bg-ds-surface flex flex-col md:sticky md:top-24 md:self-start md:border-r"
      >
        {groups.map((g) => {
          const active = g.id === group.id
          return (
            <button
              key={g.id}
              id={`lab-job-${g.id}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls="lab-job-panel"
              tabIndex={active ? 0 : -1}
              onClick={() => pick(g.id)}
              className={cn(
                'border-ds-border relative border-b px-5 py-4 text-left transition-colors',
                active ? 'bg-ds-surface2' : 'hover:bg-ds-surface2/60'
              )}
            >
              {active && (
                <span
                  aria-hidden="true"
                  className="bg-ds-accent absolute inset-y-0 left-0 w-[3px]"
                />
              )}
              <span className="text-ds-text block text-[15px] leading-snug font-semibold">
                {g.question}
              </span>
              <span className="text-ds-muted mt-1 block text-xs">
                {g.name} · {g.tools.length} {g.tools.length === 1 ? 'tool' : 'tools'}
              </span>
            </button>
          )
        })}
      </div>

      <div
        role="tabpanel"
        id="lab-job-panel"
        aria-labelledby={`lab-job-${group.id}`}
        className="bg-ds-bg min-w-0"
      >
        <div className="border-ds-border border-b px-5 py-4 sm:px-6">
          <h3 className="text-ds-text text-lg font-semibold tracking-tight">{group.name}</h3>
          <p className="text-ds-muted mt-0.5 text-sm">{group.sub}</p>
        </div>
        <ul>
          {group.tools.map((tool, index) => {
            const v = tool.views[Math.min(view[tool.id] ?? 0, tool.views.length - 1)]
            const isOpen = open === tool.id
            return (
              <li
                key={tool.id}
                style={{ animationDelay: `${index * 50}ms` }}
                className="animate-fade-in border-ds-border hover:bg-ds-surface/60 border-b px-5 py-5 last:border-b-0 motion-reduce:animate-none sm:px-6"
              >
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:gap-8">
                  <div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <h4 className="text-ds-text text-lg font-semibold tracking-tight">
                        {tool.name}
                      </h4>
                      <span className="text-ds-muted font-mono text-[11px]">{tool.tag}</span>
                      {tool.views.length > 1 && (
                        <div
                          role="group"
                          aria-label={`${tool.name} type`}
                          className="border-ds-border2 inline-flex overflow-hidden rounded-md border"
                        >
                          {tool.views.map((x, i) => (
                            <button
                              key={x.slug}
                              type="button"
                              aria-pressed={v.slug === x.slug}
                              onClick={() => setView({ ...view, [tool.id]: i })}
                              className={cn(
                                'px-3 py-1 text-xs transition-colors',
                                v.slug === x.slug
                                  ? 'bg-ds-cta text-white'
                                  : 'text-ds-muted hover:text-ds-text'
                              )}
                            >
                              {x.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-ds-text mt-2 text-sm">
                      <span className="text-ds-accent-strong font-medium">Use it when </span>
                      {v.useWhen}
                    </p>
                    <p className="text-ds-muted mt-1.5 text-sm leading-relaxed">{v.blurb}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                      <Link
                        href={`/lab/${v.slug}`}
                        className="bg-ds-cta hover:bg-ds-cta-hover rounded-md px-3.5 py-1.5 font-medium text-white"
                      >
                        Open {tool.views.length > 1 ? v.label.toLowerCase() : 'it'} &rarr;
                      </Link>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={`lab-${tool.id}-more`}
                        onClick={() => setOpen(isOpen ? null : tool.id)}
                        className="text-ds-muted hover:text-ds-text transition-colors"
                      >
                        {isOpen ? 'Hide details' : "What's inside"}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToolLink(v.slug)}
                        className="text-ds-muted hover:text-ds-text transition-colors"
                      >
                        <span aria-live="polite">
                          {copied === v.slug ? 'Link copied ✓' : 'Copy link'}
                        </span>
                      </button>
                      {v.caseStudy && (
                        <Link
                          href={`/projects/${v.slug}`}
                          className="text-ds-muted hover:text-ds-text transition-colors"
                        >
                          Case study
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="min-w-0">
                    {v.example && (
                      <div className="border-ds-border bg-ds-surface2 rounded-sm border p-3">
                        <p className="text-ds-muted text-xs">Real output · {v.example.input}</p>
                        <p className="text-ds-text mt-1 font-mono text-xs [overflow-wrap:anywhere]">
                          {v.example.output}
                        </p>
                      </div>
                    )}
                    {isOpen && (
                      <div id={`lab-${tool.id}-more`} className="mt-3">
                        <ul className="flex flex-col gap-2">
                          {v.highlights.slice(0, 4).map((h) => (
                            <li
                              key={h}
                              className="text-ds-muted flex gap-3 text-sm leading-relaxed"
                            >
                              <span className="bg-ds-accent mt-2 h-1.5 w-1.5 shrink-0 rounded-full" />
                              {h}
                            </li>
                          ))}
                        </ul>
                        {v.stats.length > 0 && (
                          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Facts">
                            {v.stats.map((x) => (
                              <li
                                key={x}
                                className="border-ds-border text-ds-muted rounded-full border px-2.5 py-1 font-mono text-[11px]"
                              >
                                {x}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
