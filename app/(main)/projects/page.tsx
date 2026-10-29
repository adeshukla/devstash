import { FaqSection } from '@/components/sections/FaqSection'
import { H1_DISPLAY } from '@/lib/utils/typography'
import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { buildOgImageUrl } from '@/lib/seo/ogImage'
import { Breadcrumb } from '@/components/layout'
import { getAllProjects } from '@/lib/markdown/projects'
import { ProjectsExplorer, type ExplorerProject } from '@/components/sections/ProjectsExplorer'
import { hasRealImage } from '@/components/sections/ProjectsGrid'
import { Button } from '@/components/ui'
import { PageFacts } from '@/components/ui/PageFacts'
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

const FAQ = [
  {
    question: 'Are these client projects?',
    answer:
      'No. Everything on this page is something I built myself, and each case study says what it is and is not. Praxis, for example, has no users and I do not report numbers I do not have.',
  },
  {
    question: 'Were these built with AI assistance?',
    answer:
      'Where it applies, the case study says so. Praxis states that the implementation was built with AI assistance that I directed and reviewed, while the product thinking, learning model and UX are mine.',
  },
  {
    question: 'Which projects can I try right now?',
    answer:
      'The browser tools run in the Lab with no signup. Praxis, Build Components, the Motion Lab and Pare run on their own domains, linked from each card.',
  },
  {
    question: 'Where is the source code?',
    answer:
      'Projects with a public repository show a GitHub link on their card and in the detail panel.',
  },
]

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const { category } = await searchParams
  const activeCategory = category ?? 'all'

  const allProjects = await getAllProjects()
  // Derived from the actual project data rather than a hand-typed list, so
  // the filter can never drift out of sync with real ProjectCategory values
  // again — every button shown is guaranteed to match at least one project.
  const explorerProjects: ExplorerProject[] = allProjects.map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    category: p.category,
    categoryLabel: CATEGORY_LABELS[p.category],
    status: p.status,
    year: p.year,
    tech: p.tech,
    highlights: p.highlights,
    problem: p.caseStudy?.problem,
    approach: p.caseStudy?.approach,
    decisions: p.caseStudy?.decisions,
    coverStats: p.coverStats,
    outcome: p.caseStudy?.outcome,
    liveUrl: p.liveUrl,
    githubUrl: p.githubUrl,
    image: hasRealImage(p.image) ? p.image : undefined,
  }))
  const techCount = new Map<string, number>()
  for (const p of allProjects) for (const t of p.tech) techCount.set(t, (techCount.get(t) ?? 0) + 1)
  const stack = [...techCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)

  // Header facts, all counted from the project files: total (+ how many are
  // live), the two biggest categories, and how many run standalone.
  const live = allProjects.filter((p) => p.status === 'live').length
  const byCategory = [...new Set(allProjects.map((p) => p.category))]
    .map((c) => ({ c, n: allProjects.filter((p) => p.category === c).length }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 2)
  // Evergreen: a "latest build" year reads as stale the following January.
  const standalone = allProjects.filter((p) => p.liveUrl?.startsWith('http')).length

  return (
    <div>
      {/* ── Page header ── */}
      {/* Breadcrumb handles its own buildBreadcrumbSchema JsonLd internally */}
      <section className="border-ds-border border-b py-16">
        <div className="max-w-site mx-auto px-6">
          <Breadcrumb
            items={[
              { name: 'Home', url: 'https://devstash.me' },
              { name: 'Projects', url: 'https://devstash.me/projects' },
            ]}
          />
          <h1 className={`${H1_DISPLAY} mt-6`}>Projects</h1>
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
              ...(standalone > 0 ? [{ value: standalone, label: 'standalone apps' }] : []),
            ]}
          />
        </div>
      </section>

      {/* ── Grid ── */}
      <ProjectsExplorer projects={explorerProjects} initialCategory={activeCategory} />

      {/* ── Stack across projects: counted from the project files ── */}
      <section className="border-ds-border border-t py-16">
        <div className="max-w-site mx-auto grid gap-10 px-6 lg:grid-cols-[5fr_7fr]">
          <div>
            <h2 className="text-ds-text text-2xl font-bold tracking-tight">
              What it&apos;s built with
            </h2>
            <p className="text-ds-muted mt-3 max-w-md leading-relaxed">
              Counted from the project files above, not picked for effect. The same few tools keep
              showing up because I would rather know them well than collect new ones.
            </p>
          </div>
          <ul className="flex flex-col gap-3">
            {stack.map(([tech, n]) => (
              <li key={tech} className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="text-ds-text w-32 shrink-0 font-mono text-sm">{tech}</span>
                <span className="bg-ds-border/50 h-2 min-w-24 flex-1 basis-24 overflow-hidden rounded-full">
                  <span
                    className="from-ds-accent to-ds-purple block h-full rounded-full bg-gradient-to-r"
                    style={{ width: `${(n / stack[0][1]) * 100}%` }}
                  />
                </span>
                <span className="text-ds-muted w-16 shrink-0 text-right font-mono text-xs">
                  {n} of {allProjects.length}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-ds-border border-t py-16">
        <div className="max-w-site mx-auto flex flex-col gap-6 px-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-ds-text text-2xl font-bold tracking-tight">
              Want to use something?
            </h2>
            <p className="text-ds-muted mt-2">The browser tools run in the Lab, no signup.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href="/lab">Open the Lab →</Button>
            <Button href="/contact" variant="ghost">
              Get in touch
            </Button>
          </div>
        </div>
      </section>
      <FaqSection items={FAQ} intro="What the case studies are, and are not." />
    </div>
  )
}
