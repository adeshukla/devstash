import Link from 'next/link'
import Image from 'next/image'
import { Badge, Button, Reveal } from '@/components/ui'
import { ProjectDeck, type DeckCard } from '@/components/ui/ProjectDeck'
import { Icon } from '@/components/icons/Icon'
import { projectBrand } from '@/components/icons/ProjectMark'
import { ProjectCover } from '@/components/sections/ProjectCover'
import { hasRealImage, statusConfig } from '@/components/sections/ProjectsGrid'
import type { Project } from '@/types/project'

const linkClass =
  'text-ds-muted hover:text-ds-accent inline-flex items-center gap-1.5 text-xs font-medium transition-colors'

function ProjectLinks({ project }: { project: Project }) {
  return (
    <div className="border-ds-border mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 border-t pt-3">
      <Link href={`/projects/${project.slug}`} className={linkClass}>
        Case study →
      </Link>
      {project.liveUrl &&
        (project.liveUrl.startsWith('/') ? (
          <Link href={project.liveUrl} className={linkClass}>
            <Icon name="external-link" className="h-3.5 w-3.5" />
            Try it live
          </Link>
        ) : (
          <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
            <Icon name="external-link" className="h-3.5 w-3.5" />
            Try it live
          </a>
        ))}
      {project.githubUrl && (
        <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
          <Icon name="github" className="h-3.5 w-3.5" />
          GitHub
        </a>
      )}
    </div>
  )
}

function Mark({ slug, className }: { slug: string; className: string }) {
  const { Mark: BrandMark } = projectBrand(slug)
  return (
    <span className={`block shrink-0 [&>svg]:h-full [&>svg]:w-full ${className}`}>
      <BrandMark />
    </span>
  )
}

// "Pare — Asset Optimization That Runs in the Browser" → name + tagline, so the
// card leads with a short name instead of a title that wraps to four lines on
// a phone. Titles without " — " are all name.
function splitTitle(title: string) {
  const [name, ...rest] = title.split(' — ')
  return { name, tagline: rest.join(' — ') }
}

function Front({ project }: { project: Project }) {
  const status = statusConfig[project.status] ?? statusConfig.archived
  const { name, tagline } = splitTitle(project.title)
  return (
    <>
      <div className="deck-art border-ds-border relative h-36 shrink-0 overflow-hidden rounded-xl border">
        {hasRealImage(project.image) ? (
          <Image
            src={project.image}
            alt=""
            fill
            draggable={false}
            className="object-cover"
            sizes="360px"
          />
        ) : (
          // Brand field only — the deck overlaps the project's own mark on it below
          <ProjectCover slug={project.slug} showMark={false} />
        )}
      </div>
      {/* The project's own logo, overlapping the artwork like an app icon */}
      <div className="relative z-10 -mt-6 flex items-end justify-between pr-1 pl-3">
        <Mark
          slug={project.slug}
          className="ring-ds-surface h-12 w-12 overflow-hidden rounded-[13px] ring-4"
        />
        <div className="flex items-center gap-3">
          <Badge variant={status.variant} dot>
            {status.label}
          </Badge>
          {project.year && <span className="text-ds-muted font-mono text-xs">{project.year}</span>}
        </div>
      </div>
      <h3 className="text-ds-text mt-3 text-2xl leading-tight font-bold tracking-tight">{name}</h3>
      {tagline && <p className="text-ds-text mt-1 text-sm font-medium">{tagline}</p>}
      <p className="text-ds-muted mt-2 line-clamp-2 text-sm leading-relaxed">
        {project.description}
      </p>
      <p className="text-ds-muted mt-2 font-mono text-[11px]" aria-hidden="true">
        tap to flip ↻
      </p>
      <ProjectLinks project={project} />
    </>
  )
}

function Back({ project }: { project: Project }) {
  return (
    <>
      <p className="text-ds-muted font-mono text-[11px] tracking-widest uppercase">Spec sheet</p>
      <div className="mt-2 flex items-center gap-3">
        <Mark slug={project.slug} className="h-8 w-8 overflow-hidden rounded-[9px]" />
        <p className="text-ds-text text-lg leading-tight font-bold tracking-tight">
          {splitTitle(project.title).name}
        </p>
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {project.highlights.slice(0, 3).map((h) => (
          <li key={h} className="text-ds-muted flex gap-2 text-sm leading-snug">
            <span className="text-ds-accent" aria-hidden="true">
              ›
            </span>
            <span className="line-clamp-2">{h}</span>
          </li>
        ))}
      </ul>
      {project.tech.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.tech.slice(0, 5).map((t) => (
            <Badge key={t} variant="default" className="font-mono text-xs">
              {t}
            </Badge>
          ))}
        </div>
      )}
      <ProjectLinks project={project} />
    </>
  )
}

// Server Component — renders every face (images, illustrations, links) on the
// server and hands them to the client-only ProjectDeck, which just moves them.
export function ProjectDeckSection({ projects }: { projects: Project[] }) {
  if (projects.length === 0) return null

  const cards: DeckCard[] = projects.map((project) => ({
    slug: project.slug,
    title: project.title,
    brandColor: projectBrand(project.slug).color,
    front: <Front project={project} />,
    back: <Back project={project} />,
  }))

  return (
    // overflow-x-clip: fanned and thrown cards travel past the viewport edge,
    // which would otherwise add a horizontal scrollbar on phones.
    <section className="overflow-x-clip py-16" aria-labelledby="home-projects-heading">
      <div className="max-w-site mx-auto grid items-center gap-10 px-6 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
        <Reveal>
          <p className="text-ds-accent font-mono text-sm">{'// the stash'}</p>
          <h2
            id="home-projects-heading"
            className="text-ds-text mt-2 text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Projects
          </h2>
          <p className="text-ds-muted mt-3 max-w-md leading-relaxed">
            Things I&apos;ve built and shipped. Drag the top card away to dig through the stack, or
            tap it to flip it over for the details.
          </p>
          <Button href="/projects" variant="ghost" size="sm" className="mt-6 p-3">
            View all projects →
          </Button>
        </Reveal>
        <ProjectDeck cards={cards} label="Featured projects" />
      </div>
    </section>
  )
}
