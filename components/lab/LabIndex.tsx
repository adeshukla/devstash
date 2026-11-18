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
 * The Lab as a directory by job. The rail is written as what the visitor wants to do, so a first
 * visit starts with "which of these sounds like me", not with tool names.
 */
export function LabIndex({ groups, initial }: { groups: JobGroup[]; initial: string }) {
  const [job, setJob] = useState(initial)
  const [view, setView] = useState<Record<string, number>>({})
  const [open, setOpen] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const searchBox = useRef<HTMLInputElement>(null)
  const searched = useRef(false)

  const words = q.toLowerCase().split(/s+/).filter(Boolean)
  const found = groups
    .flatMap((g) => g.tools.map((tool) => ({ tool, job: g.name })))
    .filter(({ tool }) => {
      const hay =
        `${tool.name} ${tool.tag} ${tool.gives} ${tool.gets} ${tool.keywords}`.toLowerCase()
      return words.every((w) => hay.includes(w))
    })

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

  function search(v: string) {
    setQ(v)
    if (v && !searched.current) {
      searched.current = true
      trackLab('hub', 'search_used')
    }
  }

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
  const searching = words.length > 0

  function row(tool: IndexTool, index: number, jobName?: string) {
    const v = tool.views[Math.min(view[tool.id] ?? 0, tool.views.length - 1)]
    const isOpen = open === tool.id
    const mini = (MINI_TOOLS as readonly string[]).includes(v.slug)
    return (
      <li
        key={tool.id}
        style={{ animationDelay: `${Math.min(index, 6) * 50}ms` }}
        className="animate-fade-in border-ds-border hover:bg-ds-surface/60 border-b px-5 py-6 transition-colors last:border-b-0 motion-reduce:animate-none sm:px-6"
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-8">
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
              <span className="border-ds-border2 text-ds-muted rounded-md border px-1.5 py-0.5 font-mono text-[11px]">
                {tool.tag}
              </span>
              {jobName && <span className="text-ds-muted text-xs">in {jobName}</span>}
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
            <p className="text-ds-muted mt-3 text-sm leading-relaxed">
              <span className="text-ds-accent-strong font-medium">Use it when </span>
              {v.useWhen}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
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
                {isOpen ? 'Hide details' : 'What is inside'}
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
          </div>

          <div className="min-w-0">
            {mini ? (
              <LabMiniTry slug={v.slug} />
            ) : (
              v.example && (
                <div className="border-ds-border bg-ds-surface2 rounded-lg border p-3.5">
                  <p className="text-ds-muted text-xs">Real result · {v.example.input}</p>
                  <p className="text-ds-text mt-1.5 font-mono text-xs [overflow-wrap:anywhere]">
                    {v.example.output}
                  </p>
                </div>
              )
            )}
            {isOpen && (
              <div id={`lab-${tool.id}-more`} className="mt-3">
                <p className="text-ds-muted text-sm leading-relaxed">{v.blurb}</p>
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
        </div>
      </li>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <label htmlFor="lab-search" className="sr-only">
          Describe what you want to do
        </label>
        <div className="border-ds-border2 bg-ds-surface focus-within:border-ds-accent focus-within:ring-ds-accent/30 flex items-center gap-3 rounded-xl border-2 px-4 focus-within:ring-4">
          <input
            id="lab-search"
            ref={searchBox}
            value={q}
            onChange={(e) => search(e.target.value)}
            placeholder="What do you want to get done?"
            autoComplete="off"
            className="text-ds-text placeholder:text-ds-muted min-w-0 flex-1 bg-transparent py-3.5 text-base outline-none"
          />
          {q ? (
            <button
              type="button"
              onClick={() => {
                setQ('')
                searchBox.current?.focus()
              }}
              className="text-ds-muted hover:text-ds-text text-sm"
            >
              Clear
            </button>
          ) : (
            <kbd className="border-ds-border2 text-ds-muted hidden rounded border px-2 py-0.5 font-mono text-xs sm:block">
              /
            </kbd>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-ds-muted">Try:</span>
          {['ads', 'whatsapp', 'report', 'share', 'qr', 'google'].map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => search(w)}
              className="border-ds-border2 text-ds-muted hover:bg-ds-surface2 hover:text-ds-text rounded-full border px-3 py-1 transition-colors"
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {searching ? (
        <div className="border-ds-border border" role="region" aria-label="Search results">
          <p
            className="text-ds-muted border-ds-border border-b px-5 py-3 text-sm sm:px-6"
            aria-live="polite"
          >
            {found.length === 0
              ? 'Nothing matches that. Try “ads”, “qr”, “share” or “report”, or clear the box.'
              : `${found.length} ${found.length === 1 ? 'tool matches' : 'tools match'} “${q.trim()}”`}
          </p>
          <h3 className="sr-only">Matching tools</h3>
          <ul>{found.map(({ tool, job: name }, i) => row(tool, i, name))}</ul>
        </div>
      ) : (
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
            <ul>{group.tools.map((tool, i) => row(tool, i))}</ul>
          </div>
        </div>
      )}
    </div>
  )
}
