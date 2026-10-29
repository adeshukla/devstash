'use client'

import { useId, useMemo, useState, type CSSProperties, type KeyboardEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Badge, Button } from '@/components/ui'
import { Icon } from '@/components/icons/Icon'
import { AnimatedCover } from '@/components/sections/AnimatedCover'
import { projectBrand } from '@/components/icons/ProjectMark'
import { TECH_ICONS } from '@/lib/utils/techIcons'
import { cn } from '@/lib/utils/cn'
import './ProjectsExplorer.css'

// Only what the explorer renders crosses the server/client boundary — the
// full project files (longDescription, interface shots) stay on the server.
export interface ExplorerProject {
  slug: string
  title: string
  description: string
  category: string
  categoryLabel: string
  status?: 'live' | 'wip' | 'archived'
  year?: number
  tech: string[]
  highlights: string[]
  problem?: string
  approach?: string
  decisions?: string[]
  outcome?: string
  coverStats?: string[]
  liveUrl?: string
  githubUrl?: string
  /** Set only when the screenshot exists on disk (checked on the server). */
  image?: string
}

const STATUS = {
  live: { variant: 'green', label: 'Live' },
  wip: { variant: 'warn', label: 'WIP' },
  archived: { variant: 'muted', label: 'Archived' },
} as const

const TABS = ['Overview', 'Case study', 'Stack'] as const
type Tab = (typeof TABS)[number]

function ringVars(slug: string): CSSProperties | undefined {
  const brand = projectBrand(slug)
  if (brand.generic) return undefined
  return {
    '--ring-a': brand.color,
    '--ring-b': `color-mix(in srgb, ${brand.color} 55%, white)`,
  } as CSSProperties
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  const cls =
    'text-ds-muted hover:text-ds-accent inline-flex items-center gap-1.5 text-sm font-medium transition-colors'
  return href.startsWith('/') ? (
    <Link href={href} className={cls}>
      {children}
    </Link>
  ) : (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {children}
    </a>
  )
}

function Detail({ project }: { project: ExplorerProject }) {
  const [tab, setTab] = useState<Tab>('Overview')
  const baseId = useId()
  const status = project.status ? STATUS[project.status] : null
  const hasCase = Boolean(project.problem || project.outcome)
  const tabs = hasCase ? TABS : TABS.filter((t) => t !== 'Case study')

  return (
    <div className="pe-swap flex flex-col gap-6" style={ringVars(project.slug)}>
      <div className="card-spotlight card-glow rounded-xl">
        <div className="relative h-52 w-full overflow-hidden rounded-xl sm:h-64 lg:h-72">
          {project.image ? (
            <Image
              src={project.image}
              alt={project.title}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 600px, 100vw"
            />
          ) : (
            <AnimatedCover slug={project.slug} stats={project.coverStats} />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {status && (
            <Badge variant={status.variant} dot>
              {status.label}
            </Badge>
          )}
          <span className="text-ds-muted font-mono text-xs">
            {project.categoryLabel}
            {project.year ? ` · ${project.year}` : ''}
          </span>
        </div>
        <h2 className="text-ds-text text-2xl font-bold tracking-tight">{project.title}</h2>
        <p className="text-ds-muted leading-relaxed">{project.description}</p>
      </div>

      <div>
        <div
          role="tablist"
          aria-label={`${project.title} details`}
          className="border-ds-border flex gap-6 border-b"
        >
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              id={`${baseId}-${t}`}
              aria-selected={tab === t}
              aria-controls={`${baseId}-panel`}
              onClick={() => setTab(t)}
              className={cn(
                '-mb-px border-b-2 pb-2 text-sm font-medium transition-colors',
                tab === t
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
          aria-labelledby={`${baseId}-${tab}`}
          className="pt-5"
        >
          {tab === 'Overview' && (
            <ul className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:gap-y-4">
              {project.highlights.slice(0, 6).map((h, i) => (
                <li
                  key={h}
                  className={cn(
                    'text-ds-muted flex gap-3 text-sm leading-relaxed',
                    i >= 4 && 'hidden lg:flex'
                  )}
                >
                  <span className="bg-ds-accent mt-2 h-1.5 w-1.5 shrink-0 rounded-full" />
                  {h}
                </li>
              ))}
            </ul>
          )}
          {tab === 'Case study' && (
            <dl className="flex flex-col gap-5 text-sm leading-relaxed lg:grid lg:grid-cols-2 lg:gap-x-8">
              {project.problem && (
                <div>
                  <dt className="text-ds-text mb-1 font-mono text-[11px] tracking-[0.12em] uppercase">
                    Problem
                  </dt>
                  <dd className="text-ds-muted line-clamp-5 lg:line-clamp-none">
                    {project.problem}
                  </dd>
                </div>
              )}
              {project.approach && (
                <div className="hidden lg:block">
                  <dt className="text-ds-text mb-1 font-mono text-[11px] tracking-[0.12em] uppercase">
                    Approach
                  </dt>
                  <dd className="text-ds-muted">{project.approach}</dd>
                </div>
              )}
              {project.decisions && project.decisions.length > 0 && (
                <div className="hidden lg:col-span-2 lg:block">
                  <dt className="text-ds-text mb-1 font-mono text-[11px] tracking-[0.12em] uppercase">
                    Key decisions
                  </dt>
                  <dd>
                    <ul className="flex flex-col gap-2">
                      {project.decisions.map((d) => (
                        <li key={d} className="text-ds-muted flex gap-3">
                          <span className="bg-ds-accent mt-2 h-1.5 w-1.5 shrink-0 rounded-full" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
              {project.outcome && (
                <div className="lg:col-span-2">
                  <dt className="text-ds-text mb-1 font-mono text-[11px] tracking-[0.12em] uppercase">
                    Outcome
                  </dt>
                  <dd className="text-ds-muted line-clamp-5 lg:line-clamp-none">
                    {project.outcome}
                  </dd>
                </div>
              )}
            </dl>
          )}
          {tab === 'Stack' && (
            <div className="flex flex-wrap gap-2">
              {project.tech.map((t) => {
                const iconName = TECH_ICONS[t]
                return (
                  <Badge
                    key={t}
                    variant="default"
                    className="font-mono text-xs"
                    icon={iconName ? <Icon name={iconName} /> : undefined}
                  >
                    {t}
                  </Badge>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-4 pt-1">
        <Button href={`/projects/${project.slug}`} size="sm">
          Read the case study →
        </Button>
        {project.liveUrl && (
          <ExternalLink href={project.liveUrl}>
            <Icon name="external-link" className="h-4 w-4" />
            Try it live
          </ExternalLink>
        )}
        {project.githubUrl && (
          <ExternalLink href={project.githubUrl}>
            <Icon name="github" className="h-4 w-4" />
            GitHub
          </ExternalLink>
        )}
      </div>
    </div>
  )
}

export function ProjectsExplorer({
  projects,
  initialCategory = 'all',
}: {
  projects: ExplorerProject[]
  initialCategory?: string
}) {
  const [category, setCategory] = useState(initialCategory)
  const [query, setQuery] = useState('')
  const [activeSlug, setActiveSlug] = useState(projects[0]?.slug)

  const categories = useMemo(() => {
    const seen = new Map<string, { label: string; n: number }>()
    for (const p of projects) {
      const cur = seen.get(p.category)
      seen.set(p.category, { label: p.categoryLabel, n: (cur?.n ?? 0) + 1 })
    }
    return [...seen.entries()]
  }, [projects])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return projects.filter(
      (p) =>
        (category === 'all' || p.category === category) &&
        (!q || `${p.title} ${p.description} ${p.tech.join(' ')}`.toLowerCase().includes(q))
    )
  }, [projects, category, query])

  const active = filtered.find((p) => p.slug === activeSlug) ?? filtered[0]

  function onKeyDown(e: KeyboardEvent<HTMLUListElement>) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const i = filtered.findIndex((p) => p.slug === active?.slug)
    const next =
      filtered[(i + (e.key === 'ArrowDown' ? 1 : -1) + filtered.length) % filtered.length]
    if (!next) return
    setActiveSlug(next.slug)
    e.currentTarget.querySelector<HTMLButtonElement>(`[data-slug="${next.slug}"]`)?.focus()
  }

  return (
    <section className="py-12">
      <div className="max-w-site mx-auto px-6">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            {[['all', { label: 'All', n: projects.length }] as const, ...categories].map(
              ([key, { label, n }]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={category === key}
                  onClick={() => setCategory(key)}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-sm transition-colors',
                    category === key
                      ? 'border-ds-accent text-ds-accent-strong bg-ds-accent/10'
                      : 'border-ds-border text-ds-muted hover:border-ds-border2 hover:text-ds-text'
                  )}
                >
                  {label} <span className="font-mono text-xs opacity-80">{n}</span>
                </button>
              )
            )}
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects or tech…"
            aria-label="Search projects"
            className="border-ds-border bg-ds-surface2 text-ds-text placeholder:text-ds-muted focus:border-ds-accent w-full rounded-lg border px-3.5 py-2 text-sm outline-none sm:w-64"
          />
        </div>

        {!active ? (
          <p className="text-ds-muted py-20 text-center">
            Nothing matches that.{' '}
            <button
              type="button"
              className="text-ds-accent underline underline-offset-4"
              onClick={() => {
                setCategory('all')
                setQuery('')
              }}
            >
              Clear filters
            </button>
          </p>
        ) : (
          <div className="mt-10 grid gap-12 lg:grid-cols-[5fr_7fr]">
            <ul
              className="border-ds-border divide-ds-border min-w-0 divide-y border-y"
              onKeyDown={onKeyDown}
              aria-label="Projects"
            >
              {filtered.map((p, i) => {
                const isActive = p.slug === active.slug
                return (
                  <li key={p.slug}>
                    <button
                      type="button"
                      data-slug={p.slug}
                      aria-expanded={isActive}
                      onClick={() => setActiveSlug(p.slug)}
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
                          {p.title}
                        </span>
                        <span className="text-ds-muted truncate font-mono text-xs">
                          {p.categoryLabel}
                          {p.year ? ` · ${p.year}` : ''}
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
                    {isActive && (
                      <div className="pt-1 pb-10 lg:hidden">
                        <Detail key={p.slug} project={p} />
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>

            {/* Desktop: sticky detail panel */}
            <div className="hidden lg:block">
              <div className="sticky top-24">
                <Detail key={active.slug} project={active} />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
