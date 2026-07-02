import fs from 'node:fs'
import path from 'node:path'
import Link from 'next/link'
import Image from 'next/image'
import { Card, Badge, Button, Reveal, CardTilt } from '@/components/ui'
import { Icon } from '@/components/icons/Icon'
import { CategoryIllustration } from '@/components/illustrations/CategoryIllustration'
import { TECH_ICONS } from '@/lib/utils/techIcons'
import type { Project } from '@/types/project'

// Several existing project entries reference an `image` path that isn't
// actually on disk yet (only a JSON field, not a real screenshot). Rather
// than let next/image 400 on a missing file, or silently drop the image slot
// entirely, check for the real file at render time (Server Component, cheap)
// and fall back to a category illustration when it's not there.
function hasRealImage(imagePath: string | undefined): imagePath is string {
  if (!imagePath) return false
  const abs = path.join(process.cwd(), 'public', imagePath.replace(/^\//, ''))
  return fs.existsSync(abs)
}

interface ProjectsGridProps {
  projects: Project[]
  /** Show all projects (projects page) vs preview (homepage) */
  showAll?: boolean
}

const statusConfig = {
  live: { variant: 'green', label: 'Live' },
  wip: { variant: 'warn', label: 'WIP' },
  archived: { variant: 'muted', label: 'Archived' },
} as const

// Server Component
export function ProjectsGrid({ projects, showAll = false }: ProjectsGridProps) {
  const displayed = showAll ? projects : projects.slice(0, 6)

  return (
    <section className="py-16">
      <div className="mx-auto max-w-5xl px-6">
        {!showAll && (
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-ds-text text-3xl font-bold">Projects</h2>
              <p className="text-ds-muted mt-1">Things I&apos;ve built and shipped</p>
            </div>
            <Button
              href="/projects"
              variant="ghost"
              size="sm"
              className="flex-shrink-0 self-start p-3 sm:self-auto"
            >
              View all →
            </Button>
          </div>
        )}

        {displayed.length === 0 ? (
          <p className="text-ds-muted py-16 text-center">No projects yet — check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {displayed.map((project, i) => {
              const status = project.status
                ? (statusConfig[project.status] ?? statusConfig.archived)
                : null

              return (
                <Reveal key={project.slug} delay={(i % 6) * 60}>
                  <CardTilt>
                    <Link
                      href={`/projects/${project.slug}`}
                      className="group focus-visible:ring-ds-accent focus-visible:ring-offset-ds-bg block rounded-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      <Card variant="hover" className="flex h-full flex-col" padding="none">
                        <div className="relative h-56 w-full overflow-hidden">
                          {hasRealImage(project.image) ? (
                            <Image
                              src={project.image}
                              alt={project.title}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                              sizes="(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw"
                            />
                          ) : (
                            <div className="h-full w-full transition-transform duration-300 group-hover:scale-105">
                              <CategoryIllustration
                                category={project.category}
                                kind="project"
                                seed={project.slug}
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col gap-4 p-6">
                          {/* Status + year */}
                          <div className="flex items-center justify-between">
                            {status && (
                              <Badge variant={status.variant} dot>
                                {status.label}
                              </Badge>
                            )}
                            {project.year && (
                              <span className="text-ds-muted font-mono text-xs">
                                {project.year}
                              </span>
                            )}
                          </div>

                          {/* Title + description */}
                          <div>
                            <h2 className="text-ds-text group-hover:text-ds-accent text-lg font-semibold transition-colors">
                              {project.title}
                            </h2>
                            <p className="text-ds-muted mt-1 line-clamp-2 text-sm">
                              {project.description}
                            </p>
                          </div>

                          {/* Tech stack pills */}
                          {project.tech && project.tech.length > 0 && (
                            <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                              {project.tech.slice(0, 4).map((t) => {
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
                              {project.tech.length > 4 && (
                                <Badge variant="muted" className="text-xs">
                                  +{project.tech.length - 4} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Footer links */}
                        {(project.githubUrl || project.liveUrl) && (
                          <div className="border-ds-border flex items-center gap-4 border-t px-5 py-3">
                            {project.githubUrl && (
                              <span className="text-ds-muted group-hover:text-ds-accent inline-flex items-center gap-1.5 text-xs transition-colors">
                                <Icon name="github" className="h-3.5 w-3.5" />
                                GitHub
                              </span>
                            )}
                            {project.liveUrl && (
                              <span className="text-ds-muted group-hover:text-ds-accent inline-flex items-center gap-1.5 text-xs transition-colors">
                                <Icon name="external-link" className="h-3.5 w-3.5" />
                                Live
                              </span>
                            )}
                          </div>
                        )}
                      </Card>
                    </Link>
                  </CardTilt>
                </Reveal>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
