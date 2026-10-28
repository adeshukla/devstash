import { H1_DISPLAY } from '@/lib/utils/typography'
import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { buildOgImageUrl } from '@/lib/seo/ogImage'
import { Breadcrumb } from '@/components/layout'
import { PageFacts } from '@/components/ui/PageFacts'
import { type IconName } from '@/components/icons/Icon'
import { CategoryIndex } from '@/components/sections/CategoryIndex'
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
  /** Brand colour for the card hover: a hex, or "mono" for black-and-white brands. */
  brand?: string
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
    <div>
      {/* Breadcrumb handles its own buildBreadcrumbSchema JsonLd internally */}
      <section className="border-ds-border border-b py-16">
        <div className="max-w-site mx-auto px-6">
          <Breadcrumb
            items={[
              { name: 'Home', url: 'https://devstash.me' },
              { name: 'Resources', url: 'https://devstash.me/resources' },
            ]}
          />
          <h1 className={`${H1_DISPLAY} mt-6`}>Resources</h1>
          <p className="text-ds-muted mt-4 max-w-[68ch] text-lg leading-relaxed">
            The docs, articles and references I actually go back to — not a link dump. Every entry
            here earned its place by being useful more than once.
          </p>
          <PageFacts
            items={[
              { value: resources.length, label: 'resources' },
              { value: orderedCats.length, label: 'categories' },
            ]}
          />
        </div>
      </section>

      <section className="py-6">
        <CategoryIndex
          groups={orderedCats.map((cat) => ({
            key: cat,
            label: CATEGORY_LABELS[cat],
            icon: CATEGORY_ICONS[cat],
            entries: (grouped[cat] ?? []).map((r) => ({
              id: r.id,
              title: r.title,
              href: r.url,
              meta: hostOf(r.url),
              paid: !r.free,
              description: r.description,
              brand: r.brand,
            })),
          }))}
        />
      </section>
    </div>
  )
}
