import Link from 'next/link'
import { Card, Badge, Button } from '@/components/ui'
import type { Project } from '@/types/project'

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
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="text-ds-text text-3xl font-bold">Projects</h2>
              <p className="text-ds-muted mt-1">Things I&apos;ve built and shipped</p>
            </div>
            <Button href="/projects" variant="ghost" size="sm">
              View all →
            </Button>
          </div>
        )}

        {displayed.length === 0 ? (
          <p className="text-ds-muted py-16 text-center">No projects yet — check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayed.map((project) => {
              const status = project.status
                ? (statusConfig[project.status] ?? statusConfig.archived)
                : null

              return (
                <Link
                  key={project.slug}
                  href={`/projects/${project.slug}`}
                  className="group focus-visible:ring-ds-accent focus-visible:ring-offset-ds-bg block rounded-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <Card variant="hover" className="flex h-full flex-col">
                    <div className="flex flex-1 flex-col gap-4 p-5">
                      {/* Status + year */}
                      <div className="flex items-center justify-between">
                        {status && (
                          <Badge variant={status.variant} dot>
                            {status.label}
                          </Badge>
                        )}
                        {project.year && (
                          <span className="text-ds-muted font-mono text-xs">{project.year}</span>
                        )}
                      </div>

                      {/* Title + description */}
                      <div>
                        <h3 className="text-ds-text group-hover:text-ds-accent font-semibold transition-colors">
                          {project.title}
                        </h3>
                        <p className="text-ds-muted mt-1 line-clamp-2 text-sm">
                          {project.description}
                        </p>
                      </div>

                      {/* Tech stack pills */}
                      {project.tech && project.tech.length > 0 && (
                        <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                          {project.tech.slice(0, 4).map((t) => (
                            <Badge key={t} variant="default" className="font-mono text-xs">
                              {t}
                            </Badge>
                          ))}
                          {project.tech.length > 4 && (
                            <Badge variant="muted" className="text-xs">
                              +{project.tech.length - 4} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer links */}
                    {(project.github || project.demo) && (
                      <div className="border-ds-border flex items-center gap-3 border-t px-5 py-3">
                        {project.github && (
                          <span className="text-ds-muted group-hover:text-ds-accent text-xs transition-colors">
                            GitHub →
                          </span>
                        )}
                        {project.demo && (
                          <span className="text-ds-muted group-hover:text-ds-accent text-xs transition-colors">
                            Live →
                          </span>
                        )}
                      </div>
                    )}
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
