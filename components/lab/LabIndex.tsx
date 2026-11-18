'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { copyText } from '@/lib/utils/clipboard'
import { LabMiniTry, MINI_TOOLS } from './LabMiniTry'
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
  /** True when /lab/<slug>/case-study exists. */
  caseStudy: boolean
}

export interface IndexTool {
  id: string
  name: string
  tag: string
  /** What the person types or pastes in, in plain words. */
  gives: string
  /** What they get back, in plain words. */
  gets: string
  /** Words people might search for that the name does not contain. */
  keywords: string
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
 * The Lab as a directory. A filter row and a search box (the same pair the Projects page uses)
 * sit above one grid of tool cards, grouped by what the visitor wants to do. Each card is a single
 * surface: what goes in, what comes back, a small working version, and the actions.
 */
export function LabIndex({ groups }: { groups: JobGroup[] }) {
  const [job, setJob] = useState('all')
  const [view, setView] = useState<Record<string, number>>({})
  const [open, setOpen] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const searchBox = useRef<HTMLInputElement>(null)
  const searched = useRef(false)

  // A link like /lab?job=share opens that group. Read once on mount; the state is the source after.
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get('job')
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot read of the address on mount */
    if (wanted && groups.some((g) => g.id === wanted)) setJob(wanted)
  }, [groups])

  // "/" jumps to the search box, as on most sites.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement
      const typing =
        el instanceof HTMLElement &&
        (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
      if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        searchBox.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function pick(id: string) {
    setJob(id)
    setOpen(null)
    window.history.replaceState(null, '', id === 'all' ? '/lab' : `/lab?job=${id}`)
    trackLab('hub', 'choose_job', id)
  }

  function search(v: string) {
    setQ(v)
    if (v && !searched.current) {
      searched.current = true
      trackLab('hub', 'search_used')
    }
  }

  async function copyToolLink(slug: string) {
    if (!(await copyText(`${window.location.origin}/lab/${slug}`))) return
    trackLab('hub', 'copy_tool_link', slug)
    setCopied(slug)
    setTimeout(() => setCopied(null), 2000)
  }

  const words = q.toLowerCase().split(/\s+/).filter(Boolean)
  const searching = words.length > 0
  const found = groups
    .flatMap((g) => g.tools)
    .filter((tool) => {
      const hay =
        `${tool.name} ${tool.tag} ${tool.gives} ${tool.gets} ${tool.keywords}`.toLowerCase()
      return words.every((w) => hay.includes(w))
    })
  const shown = job === 'all' ? groups : groups.filter((g) => g.id === job)
  const total = groups.reduce((n, g) => n + g.tools.length, 0)

  function card(tool: IndexTool, index: number) {
    const v = tool.views[Math.min(view[tool.id] ?? 0, tool.views.length - 1)]
    const isOpen = open === tool.id
    const mini = (MINI_TOOLS as readonly string[]).includes(v.slug)
    return (
      <li
        key={tool.id}
        style={{ animationDelay: `${Math.min(index, 5) * 45}ms` }}
        className="animate-fade-in border-ds-border bg-ds-surface rounded-card hover:border-ds-border2 flex flex-col overflow-hidden border shadow-sm transition-colors motion-reduce:animate-none"
      >
        <div className="flex flex-1 flex-col gap-5 p-6">
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h4 className="text-xl font-semibold tracking-tight">
                <Link
                  href={`/lab/${v.slug}`}
                  className="text-ds-text hover:text-ds-accent-strong transition-colors"
                >
                  {tool.name}
                </Link>
              </h4>
              <span className="text-ds-muted font-mono text-xs">{tool.tag}</span>
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
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
              <dt className="text-ds-muted font-mono text-[11px] leading-5">YOU GIVE</dt>
              <dd className="text-ds-text">{tool.gives}</dd>
              <dt className="text-ds-muted font-mono text-[11px] leading-5">YOU GET</dt>
              <dd className="text-ds-text">{tool.gets}</dd>
            </dl>
          </div>

          {mini ? (
            <LabMiniTry slug={v.slug} />
          ) : (
            v.example && (
              <div className="border-ds-border border-t pt-4">
                <p className="text-ds-muted font-mono text-[11px]">
                  REAL RESULT · {v.example.input}
                </p>
                <p className="border-ds-accent text-ds-text mt-2 border-l-2 py-0.5 pl-3 font-mono text-xs [overflow-wrap:anywhere]">
                  {v.example.output}
                </p>
              </div>
            )
          )}

          {isOpen && (
            <div id={`lab-${tool.id}-more`} className="border-ds-border border-t pt-4">
              <p className="text-ds-text text-sm">
                <span className="text-ds-accent-strong font-medium">Use it when </span>
                {v.useWhen}
              </p>
              <p className="text-ds-muted mt-2 text-sm leading-relaxed">{v.blurb}</p>
              <ul className="mt-3 flex flex-col gap-2">
                {v.highlights.slice(0, 4).map((h) => (
                  <li key={h} className="text-ds-muted flex gap-3 text-sm leading-relaxed">
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

        <div className="border-ds-border flex flex-wrap items-center gap-x-5 gap-y-2 border-t px-6 py-3.5 text-sm">
          <Link
            href={`/lab/${v.slug}`}
            className="bg-ds-cta hover:bg-ds-cta-hover rounded-md px-3.5 py-1.5 font-medium text-white"
          >
            Open {tool.views.length > 1 ? v.label.toLowerCase() : 'the tool'} &rarr;
          </Link>
          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls={`lab-${tool.id}-more`}
            onClick={() => setOpen(isOpen ? null : tool.id)}
            className="text-ds-muted hover:text-ds-text transition-colors"
          >
            {isOpen ? 'Hide details' : 'When to use it'}
          </button>
          <button
            type="button"
            onClick={() => copyToolLink(v.slug)}
            className="text-ds-muted hover:text-ds-text transition-colors"
          >
            <span aria-live="polite">{copied === v.slug ? 'Link copied ✓' : 'Copy link'}</span>
          </button>
          {v.caseStudy && (
            <Link
              href={`/lab/${v.slug}/case-study`}
              className="text-ds-muted hover:text-ds-text transition-colors"
            >
              Case study
            </Link>
          )}
        </div>
      </li>
    )
  }

  return (
    <div>
      {/* Toolbar: the same chips and search box as the Projects page. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Show tools for">
          {[
            { id: 'all', name: 'All', n: total, hint: '' },
            ...groups.map((g) => ({ id: g.id, name: g.name, n: g.tools.length, hint: g.question })),
          ].map((c) => (
            <button
              key={c.id}
              type="button"
              title={c.hint || undefined}
              aria-pressed={!searching && job === c.id}
              onClick={() => {
                setQ('')
                pick(c.id)
              }}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-sm transition-colors',
                !searching && job === c.id
                  ? 'border-ds-accent text-ds-accent-strong bg-ds-accent/10'
                  : 'border-ds-border text-ds-muted hover:border-ds-border2 hover:text-ds-text'
              )}
            >
              {c.name} <span className="font-mono text-xs">{c.n}</span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <label htmlFor="lab-search" className="sr-only">
            Describe what you want to do
          </label>
          <input
            id="lab-search"
            ref={searchBox}
            type="search"
            value={q}
            onChange={(e) => search(e.target.value)}
            placeholder="What do you want to get done?"
            autoComplete="off"
            className="border-ds-border bg-ds-surface2 text-ds-text placeholder:text-ds-muted focus:border-ds-accent w-full rounded-lg border py-2 pr-9 pl-3.5 text-sm outline-none"
          />
          {!q && (
            <kbd
              aria-hidden="true"
              className="border-ds-border2 text-ds-muted pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded border px-1.5 font-mono text-xs"
            >
              /
            </kbd>
          )}
        </div>
      </div>
      <p className="text-ds-muted mt-3 text-sm">
        {searching ? (
          <span aria-live="polite">
            {found.length === 0
              ? 'Nothing matches that. Try ads, qr, share or report.'
              : `${found.length} ${found.length === 1 ? 'tool matches' : 'tools match'} “${q.trim()}”. `}
            <button
              type="button"
              onClick={() => {
                setQ('')
                searchBox.current?.focus()
              }}
              className="text-ds-accent-strong underline underline-offset-4"
            >
              Clear
            </button>
          </span>
        ) : (
          <>
            Try a search:{' '}
            {['ads', 'whatsapp', 'report', 'share', 'qr', 'google'].map((w, i) => (
              <span key={w}>
                {i > 0 && ', '}
                <button
                  type="button"
                  onClick={() => search(w)}
                  className="text-ds-accent-strong underline underline-offset-4"
                >
                  {w}
                </button>
              </span>
            ))}
          </>
        )}
      </p>

      {searching ? (
        <div className="mt-8">
          <h3 className="sr-only">Matching tools</h3>
          <ul className="grid gap-5 lg:grid-cols-2">{found.map((t, i) => card(t, i))}</ul>
        </div>
      ) : (
        shown.map((g) => (
          <section key={g.id} aria-labelledby={`lab-group-${g.id}`} className="mt-10">
            <div className="mb-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h3
                id={`lab-group-${g.id}`}
                className="text-ds-text text-2xl font-bold tracking-tight"
              >
                {g.name}
              </h3>
              <p className="text-ds-muted text-sm">{g.sub}</p>
            </div>
            <ul className="grid gap-5 lg:grid-cols-2">{g.tools.map((t, i) => card(t, i))}</ul>
          </section>
        ))
      )}
    </div>
  )
}
