import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { buildOgImageUrl } from '@/lib/seo/ogImage'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildProjectSchema } from '@/lib/schema/builders'
import { Breadcrumb } from '@/components/layout'
import { getAllProjects, getProjectBySlug } from '@/lib/markdown/projects'
import { Badge, Button, ImageGallery, Separator } from '@/components/ui'

// ─── Static generation ────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const projects = await getAllProjects()
  return projects.map((p) => ({ slug: p.slug }))
}

// ─── Dynamic metadata ─────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const project = await getProjectBySlug(slug)

  if (!project) {
    return buildMetadata({
      title: 'Project not found',
      description: 'The project you are looking for does not exist.',
      canonical: `/projects/${slug}`,
      ogImage: buildOgImageUrl({ title: 'Project not found', type: 'website' }),
    })
  }

  return buildMetadata({
    title: project.title,
    description: project.description,
    canonical: `/projects/${project.slug}`,
    type: 'website',
    ogImage: buildOgImageUrl({
      title: project.title,
      description: project.description,
      type: 'project',
    }),
  })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface ProjectPageProps {
  params: Promise<{ slug: string }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)

  if (!project) notFound()

  const statusConfig = {
    live: { variant: 'green' as const, label: 'Live' },
    wip: { variant: 'warn' as const, label: 'Work in Progress' },
    archived: { variant: 'muted' as const, label: 'Archived' },
  }
  const statusInfo = project.status ? statusConfig[project.status] : null

  return (
    <>
      {/* Project schema — Breadcrumb handles its own JsonLd internally */}
      <JsonLd data={buildProjectSchema(project)} />

      <main>
        {/* ── Header ── */}
        <section className="border-ds-border border-b py-16">
          <div className="mx-auto max-w-4xl px-6">
            <Breadcrumb
              items={[
                { name: 'Home', url: 'https://devstash.me' },
                { name: 'Projects', url: 'https://devstash.me/projects' },
                {
                  name: project.title,
                  url: `https://devstash.me/projects/${project.slug}`,
                },
              ]}
            />

            <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1">
                <div className="mb-3 flex items-center gap-3">
                  {statusInfo && (
                    <Badge variant={statusInfo.variant} dot>
                      {statusInfo.label}
                    </Badge>
                  )}
                  {project.year && (
                    <span className="text-ds-muted font-mono text-xs">{project.year}</span>
                  )}
                </div>
                <h1 className="text-ds-text text-4xl font-bold">{project.title}</h1>
                <p className="text-ds-muted mt-4 max-w-2xl text-lg">{project.description}</p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                {project.liveUrl && (
                  <Button href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                    Live Demo →
                  </Button>
                )}
                {project.githubUrl && (
                  <Button
                    href={project.githubUrl}
                    variant="outline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub →
                  </Button>
                )}
              </div>
            </div>

            {/* Tech stack */}
            {project.tech && project.tech.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {project.tech.map((t) => (
                  <Badge key={t} variant="default" className="font-mono text-xs">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Body ── */}
        <section className="py-16">
          <div className="mx-auto max-w-4xl px-6">
            {/* TODO: Replace with MDX rendered content in Phase 5 */}

            {project.interface && project.interface.length > 0 && (
              <>
                <h2 className="text-ds-text text-2xl font-bold">Interface</h2>
                <p className="text-ds-muted mt-4 mb-8">
                  User interface flow — from authentication to AI recommendations
                </p>
                <ImageGallery images={project.interface} />
              </>
            )}

            {project.highlights && project.highlights.length > 0 && (
              <>
                <Separator className="my-10" />
                <h2 className="text-ds-text mb-6 text-2xl font-bold">Highlights</h2>
                <ul className="flex flex-col gap-3">
                  {project.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="bg-ds-accent mt-2 h-1.5 w-1.5 shrink-0 rounded-full" />
                      <span className="text-ds-muted">{item}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {project.longDescription && (
              <>
                <Separator className="my-10" />
                <div className="prose prose-invert max-w-none">
                  {/* TODO: Render MDX in Phase 5 */}
                  <p className="text-ds-muted">{project.longDescription}</p>
                </div>
              </>
            )}
          </div>
        </section>

        {/* ── Back link ── */}
        <div className="border-ds-border border-t py-8">
          <div className="mx-auto max-w-4xl px-6">
            <Link
              href="/projects"
              className="text-ds-muted hover:text-ds-accent font-mono text-sm transition-colors"
            >
              ← All projects
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
