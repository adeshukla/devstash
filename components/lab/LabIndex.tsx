'use client'

import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react'
import Link from 'next/link'
import { Badge, Button, CardTilt } from '@/components/ui'
import { AnimatedCover } from '@/components/sections/AnimatedCover'
import { projectBrand } from '@/components/icons/ProjectMark'
import { cn } from '@/lib/utils/cn'
import { copyText } from '@/lib/utils/clipboard'
import { LabMiniTry, MINI_TOOLS } from './LabMiniTry'
import { trackLab } from './track'
import '@/components/sections/ProjectsExplorer.css'

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

type Row = IndexTool & { group: string }

const TABS = ['Try it', 'Highlights', 'Facts'] as const
type Tab = (typeof TABS)[number]

function ringVars(slug: string): CSSProperties | undefined {
  const brand = projectBrand(slug)
  if (brand.generic) return undefined
  return {
    '--ring-a': brand.color,
    '--ring-b': `color-mix(in srgb, ${brand.color} 55%, white)`,
  } as CSSProperties
}

/** True on a wide screen. Server and first paint assume wide, so nothing flashes. */
function useWide() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia('(min-width: 1024px)')
      m.addEventListener('change', cb)
      return () => m.removeEventListener('change', cb)
    },
    () => window.matchMedia('(min-width: 1024px)').matches,
    () => true
  )
}

function Detail({ tool }: { tool: Row }) {
  const [tab, setTab] = useState<Tab>('Try it')
  const [viewIndex, setViewIndex] = useState(0)
  const [copied, setCopied] = useState(false)
  const baseId = useId()
  const v = tool.views[viewIndex]
  const mini = (MINI_TOOLS as readonly string[]).includes(v.slug)
  const tabs = TABS.filter((t) => (t === 'Facts' ? v.stats.length > 0 : true))
  const shownTab = tabs.includes(tab) ? tab : 'Try it'

  async function copy() {
    if (!(await copyText(`${window.location.origin}/lab/${v.slug}`))) return
    trackLab('hub', 'copy_tool_link', v.slug)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="pe-swap flex flex-col gap-6" style={ringVars(v.slug)}>
      <CardTilt>
        <div className="card-spotlight card-glow rounded-xl">
          <div className="relative h-44 w-full overflow-hidden rounded-xl sm:h-56 lg:h-60">
            <AnimatedCover slug={v.slug} stats={v.stats} />
          </div>
        </div>
      </CardTilt>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="green" dot>
            Live
          </Badge>
          <span className="text-ds-muted font-mono text-xs">
            {tool.group} · {tool.tag}
          </span>
        </div>
        <h3 className="text-ds-text text-2xl font-bold tracking-tight">{tool.name}</h3>
        <p className="text-ds-muted leading-relaxed">
          <span className="text-ds-accent-strong font-medium">Use it when </span>
          {v.useWhen}
        </p>
        {tool.views.length > 1 && (
          <div
            role="group"
            aria-label={`${tool.name} type`}
            className="border-ds-border2 inline-flex self-start overflow-hidden rounded-md border"
          >
            {tool.views.map((x, i) => (
              <button
                key={x.slug}
                type="button"
                aria-pressed={viewIndex === i}
                onClick={() => setViewIndex(i)}
                className={cn(
                  'px-3.5 py-1.5 text-sm transition-colors',
                  viewIndex === i ? 'bg-ds-cta text-white' : 'text-ds-muted hover:text-ds-text'
                )}
              >
                {x.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <div
          role="tablist"
          aria-label={`${tool.name} details`}
          className="border-ds-border flex gap-6 border-b"
        >
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              id={`${baseId}-${t}`}
              aria-selected={shownTab === t}
              aria-controls={`${baseId}-panel`}
              onClick={() => setTab(t)}
              className={cn(
                '-mb-px border-b-2 pb-2 text-sm font-medium transition-colors',
                shownTab === t
                  ? 'border-ds-accent text-ds-text'
                  : 'text-ds-muted hover:text-ds-text border-transparent'
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          id={`${baseId}-panel`}
          aria-labelledby={`${baseId}-${shownTab}`}
          className="pt-5"
        >
          {shownTab === 'Try it' && (
            <div className="flex flex-col gap-5">
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
                <dt className="text-ds-muted font-mono text-[11px] leading-5">YOU GIVE</dt>
                <dd className="text-ds-text">{tool.gives}</dd>
                <dt className="text-ds-muted font-mono text-[11px] leading-5">YOU GET</dt>
                <dd className="text-ds-text">{tool.gets}</dd>
              </dl>
              {mini ? (
                <LabMiniTry key={v.slug} slug={v.slug} />
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
            </div>
          )}
          {shownTab === 'Highlights' && (
            <div className="flex flex-col gap-4">
              <p className="text-ds-muted text-sm leading-relaxed">{v.blurb}</p>
              <ul className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:gap-y-4">
                {v.highlights.slice(0, 6).map((h) => (
                  <li key={h} className="text-ds-muted flex gap-3 text-sm leading-relaxed">
                    <span className="bg-ds-accent mt-2 h-1.5 w-1.5 shrink-0 rounded-full" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {shownTab === 'Facts' && (
            <ul className="flex flex-wrap gap-2" aria-label="Facts">
              {v.stats.map((x) => (
                <li key={x}>
                  <Badge variant="default" className="font-mono text-xs">
                    {x}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-4 pt-1">
        <Button href={`/lab/${v.slug}`} size="sm">
          Open {tool.views.length > 1 ? v.label.toLowerCase() : 'the tool'} →
        </Button>
        <button
          type="button"
          onClick={copy}
          className="text-ds-muted hover:text-ds-accent text-sm font-medium transition-colors"
        >
          <span aria-live="polite">{copied ? 'Link copied ✓' : 'Copy link'}</span>
        </button>
        {v.caseStudy && (
          <Link
            href={`/lab/${v.slug}/case-study`}
            className="text-ds-muted hover:text-ds-accent text-sm font-medium transition-colors"
          >
            Case study
          </Link>
        )}
      </div>
    </div>
  )
}

/**
 * The Lab as an explorer, built like the Projects and Services pages: a filter row and search
 * above, a numbered list on the left, and the chosen tool on the right with a cover, tabs and its
 * actions. On a phone the detail opens under its row.
 */
export function LabIndex({ groups }: { groups: JobGroup[] }) {
  const [job, setJob] = useState('all')
  const [q, setQ] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const searchBox = useRef<HTMLInputElement>(null)
  const searched = useRef(false)
  const wide = useWide()

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
    setQ('')
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

  const words = q.toLowerCase().split(/\s+/).filter(Boolean)
  const searching = words.length > 0
  const all: Row[] = groups.flatMap((g) => g.tools.map((t) => ({ ...t, group: g.name })))
  const rows = all.filter((t) => {
    if (searching) {
      const hay = `${t.name} ${t.tag} ${t.gives} ${t.gets} ${t.keywords}`.toLowerCase()
      return words.every((w) => hay.includes(w))
    }
    return job === 'all' || groups.find((g) => g.id === job)?.name === t.group
  })
  const active = rows.find((t) => t.id === activeId) ?? rows[0]

  function onKeyDown(e: React.KeyboardEvent<HTMLUListElement>) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const i = rows.findIndex((t) => t.id === active?.id)
    const next = rows[(i + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length]
    if (!next) return
    setActiveId(next.id)
    e.currentTarget.querySelector<HTMLButtonElement>(`[data-tool="${next.id}"]`)?.focus()
  }

  const chips = [
    { id: 'all', name: 'All', n: all.length, hint: '' },
    ...groups.map((g) => ({ id: g.id, name: g.name, n: g.tools.length, hint: g.question })),
  ]

  return (
    <div>
      {/* Toolbar: the same chips and search box as the Projects page. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Show tools for">
          {chips.map((c) => {
            const on = !searching && job === c.id
            return (
              <button
                key={c.id}
                type="button"
                title={c.hint || undefined}
                aria-pressed={on}
                onClick={() => pick(c.id)}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-sm transition-colors',
                  on
                    ? 'border-ds-accent text-ds-accent-strong bg-ds-accent/10'
                    : 'border-ds-border text-ds-muted hover:border-ds-border2 hover:text-ds-text'
                )}
              >
                {c.name} <span className="font-mono text-xs">{c.n}</span>
              </button>
            )
          })}
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
            {rows.length === 0
              ? 'Nothing matches that. Try ads, qr, share or report. '
              : `${rows.length} ${rows.length === 1 ? 'tool matches' : 'tools match'} “${q.trim()}”. `}
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

      {!active ? null : (
        <div className="mt-10 grid gap-12 lg:grid-cols-[5fr_7fr]">
          <ul
            className="border-ds-border divide-ds-border min-w-0 divide-y border-y"
            onKeyDown={onKeyDown}
            aria-label="Tools"
          >
            {rows.map((t, i) => {
              const isActive = t.id === active.id
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    data-tool={t.id}
                    aria-expanded={isActive}
                    onClick={() => setActiveId(t.id)}
                    className="group relative isolate flex w-full items-center gap-4 py-5 pr-3 pl-5 text-left"
                  >
                    {/* Hover/active wash: fades in behind the row, never moves it */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        'from-ds-accent/10 absolute -inset-x-2 inset-y-1 -z-10 rounded-lg bg-gradient-to-r to-transparent transition-opacity duration-300',
                        isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      )}
                    />
                    <span
                      aria-hidden="true"
                      className={cn(
                        'bg-ds-accent absolute top-3 bottom-3 left-0 w-0.5 origin-center rounded-full transition-transform duration-300',
                        isActive ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-50'
                      )}
                    />
                    <span
                      className={cn(
                        'w-6 shrink-0 font-mono text-xs transition-colors',
                        isActive ? 'text-ds-accent' : 'text-ds-muted group-hover:text-ds-accent'
                      )}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span
                        className={cn(
                          'font-semibold [overflow-wrap:anywhere] transition-colors',
                          isActive ? 'text-ds-accent' : 'text-ds-text group-hover:text-ds-accent'
                        )}
                      >
                        {t.name}
                      </span>
                      <span className="text-ds-muted truncate font-mono text-xs">
                        {t.group} · {t.tag}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        'shrink-0 transition-[transform,color] duration-300 group-hover:translate-x-1',
                        isActive
                          ? 'text-ds-accent rotate-90 lg:rotate-0'
                          : 'text-ds-muted group-hover:text-ds-accent'
                      )}
                    >
                      →
                    </span>
                  </button>
                  {/* Phones: the detail opens under its row */}
                  {isActive && !wide && (
                    <div className="pt-1 pb-10">
                      <Detail key={t.id} tool={t} />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>

          {/* Desktop: sticky detail panel */}
          {wide && (
            <div>
              <div className="sticky top-24">
                <Detail key={active.id} tool={active} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
