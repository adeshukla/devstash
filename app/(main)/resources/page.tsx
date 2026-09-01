import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { buildOgImageUrl } from '@/lib/seo/ogImage'
import { Breadcrumb } from '@/components/layout'
import { PageHeaderGlow } from '@/components/ui'
import { Icon, type IconName } from '@/components/icons/Icon'
import resourcesData from '@/content/resources/resources.json'

const title = 'Developer Resources — Docs, Articles & Courses'
const description =
  'Curated developer resources — the docs, articles, courses, and repositories Adesh actually returns to while building. No SEO filler, just useful signal.'

export const metadata: Metadata = buildMetadata({
  title,
  description,
  canonical: '/resources',
  ogImage: buildOgImageUrl({ title, description, type: 'website' }),
})

// ─── Types ────────────────────────────────────────────────────────────────────

interface Resource {
  id: string
  title: string
  description: string
  url: string
  category: 'docs' | 'article' | 'course' | 'repo' | 'video' | 'tool'
  tags: string[]
  free: boolean
}

const CATEGORY_LABELS: Record<Resource['category'], string> = {
  docs: 'Docs',
  article: 'Articles',
  course: 'Courses',
  repo: 'Repositories',
  video: 'Video',
  tool: 'Tools',
}

const CATEGORY_ICONS: Record<Resource['category'], IconName> = {
  docs: 'docs',
  article: 'article',
  course: 'course',
  repo: 'repo',
  video: 'video',
  tool: 'devtools',
}

const CATEGORY_ORDER: Resource['category'][] = [
  'docs',
  'article',
  'course',
  'repo',
  'video',
  'tool',
]

/** The host, shown so a reader can judge the source before committing a click. */
function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResourcesPage() {
  const resources = resourcesData as Resource[]

  const grouped = resources.reduce<Partial<Record<Resource['category'], Resource[]>>>((acc, r) => {
    acc[r.category] = [...(acc[r.category] ?? []), r]
    return acc
  }, {})

  const orderedCats = CATEGORY_ORDER.filter((cat) => grouped[cat]?.length)

  return (
    <main>
      {/* Breadcrumb handles its own buildBreadcrumbSchema JsonLd internally */}
      <section className="border-ds-border relative overflow-hidden border-b py-16">
        <PageHeaderGlow />
        <div className="mx-auto max-w-3xl px-6">
          <Breadcrumb
            items={[
              { name: 'Home', url: 'https://devstash.me' },
              { name: 'Resources', url: 'https://devstash.me/resources' },
            ]}
          />
          <h1 className="text-ds-text mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
            Resources
          </h1>
          <p className="text-ds-muted mt-4 max-w-[68ch] text-lg leading-relaxed">
            The docs, articles and references I actually go back to — not a link dump. Every entry
            here earned its place by being useful more than once.
          </p>
          <p className="text-ds-muted mt-6 text-sm">
            {resources.length} resources across {orderedCats.length} categories
          </p>
        </div>
      </section>

      {/* A reading list, not a card grid: title first, one line of why, and the
          source host so the reader can judge before clicking. */}
      <section className="py-16">
        <div className="mx-auto flex max-w-3xl flex-col gap-14 px-6">
          {orderedCats.map((cat) => (
            <section key={cat} aria-labelledby={`cat-${cat}`}>
              <h2
                id={`cat-${cat}`}
                className="text-ds-text mb-1 flex items-center gap-2.5 text-sm font-semibold tracking-wide uppercase"
              >
                <Icon name={CATEGORY_ICONS[cat]} className="text-ds-accent h-4 w-4 shrink-0" />
                {CATEGORY_LABELS[cat]}
                <span className="text-ds-muted text-xs font-normal normal-case">
                  {grouped[cat]?.length}
                </span>
              </h2>

              <ul className="divide-y divide-[var(--color-ds-border)]">
                {grouped[cat]?.map((resource) => (
                  <li key={resource.id}>
                    <Link
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group focus-visible:ring-ds-accent focus-visible:ring-offset-ds-bg -mx-3 block rounded-lg px-3 py-4 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      <div className="flex items-baseline justify-between gap-4">
                        <h3 className="text-ds-text group-hover:text-ds-accent font-medium transition-colors">
                          {resource.title}
                        </h3>
                        <span className="text-ds-muted flex shrink-0 items-center gap-1.5 text-xs">
                          {!resource.free && <span>Paid</span>}
                          <span className="hidden sm:inline">{hostOf(resource.url)}</span>
                          <Icon
                            name="external-link"
                            className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                          />
                        </span>
                      </div>
                      <p className="text-ds-muted mt-1 max-w-[68ch] text-sm leading-relaxed">
                        {resource.description}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>
    </main>
  )
}
