import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { Breadcrumb } from '@/components/layout'
import { Badge, Card } from '@/components/ui'
import resourcesData from '@/content/resources/resources.json'

export const metadata: Metadata = buildMetadata({
  title: 'Resources — DevStash',
  description:
    'Curated developer resources — docs, articles, courses, and tools that Adesh actually uses. No filler, just signal.',
  canonical: 'https://devstash.me/resources',
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
  article: 'Article / Blog',
  course: 'Course',
  repo: 'Repository',
  video: 'Video',
  tool: 'Tool',
}

const CATEGORY_VARIANTS: Record<
  Resource['category'],
  'blue' | 'purple' | 'green' | 'default' | 'warn' | 'muted'
> = {
  docs: 'blue',
  article: 'purple',
  course: 'green',
  repo: 'default',
  video: 'warn',
  tool: 'muted',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResourcesPage() {
  const resources = resourcesData as Resource[]

  const grouped = resources.reduce<Partial<Record<Resource['category'], Resource[]>>>((acc, r) => {
    acc[r.category] = [...(acc[r.category] ?? []), r]
    return acc
  }, {})

  return (
    <main>
      {/* ── Header ── */}
      {/* Breadcrumb handles its own buildBreadcrumbSchema JsonLd internally */}
      <section className="border-ds-border border-b py-16">
        <div className="mx-auto max-w-5xl px-6">
          <Breadcrumb
            items={[
              { name: 'Home', url: 'https://devstash.me' },
              { name: 'Resources', url: 'https://devstash.me/resources' },
            ]}
          />
          <h1 className="text-ds-text mt-4 text-4xl font-bold">Resources</h1>
          <p className="text-ds-muted mt-3 max-w-xl">
            Docs, articles, and references I keep coming back to. No SEO filler — just the stuff
            that actually helps.
          </p>
        </div>
      </section>

      {/* ── Content ── */}
      <section className="py-16">
        <div className="mx-auto flex max-w-5xl flex-col gap-16 px-6">
          {(Object.keys(grouped) as Resource['category'][]).map((cat) => (
            <div key={cat}>
              <h2 className="text-ds-text mb-6 text-xl font-bold">{CATEGORY_LABELS[cat]}</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {grouped[cat]?.map((resource) => (
                  <Link
                    key={resource.id}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group focus-visible:ring-ds-accent focus-visible:ring-offset-ds-bg block rounded-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    <Card variant="hover" className="h-full">
                      <div className="flex flex-col gap-3 p-5">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant={CATEGORY_VARIANTS[resource.category]}>
                            {CATEGORY_LABELS[resource.category]}
                          </Badge>
                          {resource.free && <Badge variant="muted">Free</Badge>}
                        </div>
                        <h3 className="text-ds-text group-hover:text-ds-accent font-semibold transition-colors">
                          {resource.title}
                        </h3>
                        <p className="text-ds-muted text-sm">{resource.description}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {resource.tags.map((t) => (
                            <span key={t} className="text-ds-muted font-mono text-xs">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
