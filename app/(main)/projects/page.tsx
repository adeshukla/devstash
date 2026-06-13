import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { buildOgImageUrl } from '@/lib/seo/ogImage'
import { Breadcrumb } from '@/components/layout'
import { getAllProjects } from '@/lib/markdown/projects'
import { ProjectsGrid } from '@/components/sections'
import { Badge } from '@/components/ui'

const title = 'Projects — Frontend, Automation & Web Apps'
const description =
  'Frontend projects built with React, Next.js, and TypeScript, plus automation tooling. A mix of open-source experiments and client work by Adesh Shukla.'

export const metadata: Metadata = buildMetadata({
  title,
  description,
  canonical: '/projects',
  ogImage: buildOgImageUrl({ title, description, type: 'website' }),
})

interface ProjectsPageProps {
  searchParams: Promise<{ category?: string }>
}

const CATEGORIES = [
  'all',
  'frontend',
  'automation',
  'tooling',
  'fullstack',
  // TODO: Keep in sync with your actual project categories
] as const

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const { category } = await searchParams
  const activeCategory = category ?? 'all'

  const allProjects = await getAllProjects()
  const filtered =
    activeCategory === 'all'
      ? allProjects
      : allProjects.filter((p) => p.category === activeCategory)

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
          <h1 className="text-ds-text mt-4 text-4xl font-bold">Projects</h1>
          <p className="text-ds-muted mt-3 max-w-xl">
            Things I&apos;ve designed, built, and shipped — open source repos, automation tools, and
            web apps.
          </p>

          {/* Category filter */}
          <div className="mt-8 flex flex-wrap gap-2" role="list" aria-label="Filter by category">
            {CATEGORIES.map((cat) => {
              const isActive = cat === activeCategory
              const href = cat === 'all' ? '/projects' : `/projects?category=${cat}`
              return (
                <Link
                  key={cat}
                  href={href}
                  role="listitem"
                  aria-current={isActive ? 'true' : undefined}
                >
                  <Badge
                    variant={isActive ? 'blue' : 'default'}
                    className="hover:border-ds-accent hover:text-ds-accent cursor-pointer capitalize transition-colors"
                  >
                    {cat}
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
