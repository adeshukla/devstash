import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { buildOgImageUrl } from '@/lib/seo/ogImage'
import { Breadcrumb } from '@/components/layout'
import { getAllProjects } from '@/lib/markdown/projects'
import { ProjectsGrid } from '@/components/sections'
import { Badge } from '@/components/ui'
import { PageFacts } from '@/components/ui/PageFacts'
import { cn } from '@/lib/utils/cn'
import type { ProjectCategory } from '@/types/project'

const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  'web-app': 'Web App',
  automation: 'Automation',
  tool: 'Tool',
  clone: 'Clone',
  'open-source': 'Open Source',
}
// Plural labels for the header's facts row ("3 web apps", "5 tools")
const CATEGORY_PLURALS: Record<ProjectCategory, string> = {
  'web-app': 'web apps',
  automation: 'automations',
  tool: 'browser tools',
  clone: 'clones',
  'open-source': 'open source',
}

// This page is the case-study layer: what each build solved and why it is put
// together the way it is. The browser tools run in /lab and their cards link
// across; Praxis, Build Components, the Motion Lab and Pare run on their own domains, so the copy cannot promise that
// everything here is a tool living in the Lab. Keep the two framings distinct —
// the older copy also promised "open source repos" and "client work" that the
// project files do not contain.
const title = 'Projects — Frontend Build Notes & Case Studies'
const description =
  'Case studies behind what I have built — the problem each one solved, the decisions and tradeoffs behind it, and what I would change next time.'

export const metadata: Metadata = buildMetadata({
  title,
  description,
  canonical: '/projects',
  ogImage: buildOgImageUrl({ title, description, type: 'website' }),
})

interface ProjectsPageProps {
  searchParams: Promise<{ category?: string }>
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const { category } = await searchParams
  const activeCategory = category ?? 'all'

  const allProjects = await getAllProjects()
  // Derived from the actual project data rather than a hand-typed list, so
  // the filter can never drift out of sync with real ProjectCategory values
  // again — every button shown is guaranteed to match at least one project.
  const categories = ['all', ...new Set(allProjects.map((p) => p.category))] as const
  const filtered =
    activeCategory === 'all'
      ? allProjects
      : allProjects.filter((p) => p.category === activeCategory)

  // Header facts, all counted from the project files: total (+ how many are
  // live), the two biggest categories, and the newest build year.
  const live = allProjects.filter((p) => p.status === 'live').length
  const byCategory = [...new Set(allProjects.map((p) => p.category))]
    .map((c) => ({ c, n: allProjects.filter((p) => p.category === c).length }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 2)
  const latestYear = Math.max(...allProjects.map((p) => p.year ?? 0))

  return (
    <main>
      {/* ── Page header ── */}
      {/* Breadcrumb handles its own buildBreadcrumbSchema JsonLd internally */}
      <section className="border-ds-border border-b py-16">
        <div className="mx-auto max-w-5xl px-6">
          <Breadcrumb
            items={[
              { name: 'Home', url: 'https://devstash.me' },
              { name: 'Projects', url: 'https://devstash.me/projects' },
            ]}
          />
          <h1 className="text-ds-text mt-6 text-[clamp(44px,6vw,72px)] leading-[1.02] font-bold tracking-[-0.035em]">
            Projects
          </h1>
          <p className="text-ds-muted mt-3 max-w-xl">
            The build behind each one — the problem it solved, the tradeoffs, and what I&apos;d
            change. Every card links through to something running: the browser tools live in the{' '}
            <Link
              href="/lab"
              className="text-ds-accent underline underline-offset-4 hover:no-underline"
            >
              Lab
            </Link>
            , and Praxis, Build Components, the Motion Lab and Pare run on their own domains.
          </p>
          <PageFacts
            items={[
              {
                value: allProjects.length,
                label: 'projects',
                note: live === allProjects.length ? 'all live' : `${live} live`,
              },
              ...byCategory.map(({ c, n }) => ({ value: n, label: CATEGORY_PLURALS[c] })),
              ...(latestYear > 0 ? [{ value: latestYear, label: 'latest build' }] : []),
            ]}
          />

          {/* Category filter */}
          <div className="mt-8 flex flex-wrap gap-2" role="list" aria-label="Filter by category">
            {categories.map((cat) => {
              const isActive = cat === activeCategory
              const href = cat === 'all' ? '/projects' : `/projects?category=${cat}`
              const label = cat === 'all' ? 'All' : CATEGORY_LABELS[cat]
              return (
                <Link
                  key={cat}
                  href={href}
                  role="listitem"
                  aria-current={isActive ? 'true' : undefined}
                >
                  <Badge
                    variant={isActive ? 'blue' : 'default'}
                    className={cn(
                      'ring-hover hover:border-ds-accent hover:text-ds-accent cursor-pointer transition-colors',
                      isActive && 'ring-active'
                    )}
                  >
                    {label}
                  </Badge>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Grid ── */}
      <ProjectsGrid projects={filtered} showAll />
    </main>
  )
}
