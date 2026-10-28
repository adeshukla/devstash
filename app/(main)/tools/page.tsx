import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { buildOgImageUrl } from '@/lib/seo/ogImage'
import { Breadcrumb } from '@/components/layout'
import { PageFacts } from '@/components/ui/PageFacts'
import { type IconName } from '@/components/icons/Icon'
import { CategoryIndex } from '@/components/sections/CategoryIndex'
import toolsData from '@/content/tools/tools.json'

const title = 'Tools — The Developer Stack Adesh Uses Daily'
const description =
  'The actual tools Adesh runs every day — editor, AI assistants, terminal, design, and deployment picks. No affiliate links and no sponsored placements.'

export const metadata: Metadata = buildMetadata({
  title,
  description,
  canonical: '/tools',
  ogImage: buildOgImageUrl({ title, description, type: 'website' }),
})

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tool {
  id: string
  name: string
  description: string
  url: string
  category: 'editor' | 'terminal' | 'browser' | 'design' | 'productivity' | 'ai' | 'devtools'
  tags: string[]
  free: boolean
}

const CATEGORY_LABELS: Record<Tool['category'], string> = {
  editor: 'Editor',
  terminal: 'Terminal & Shell',
  browser: 'Browser',
  design: 'Design',
  productivity: 'Productivity',
  ai: 'AI & LLMs',
  devtools: 'Dev & Deployment',
}

const CATEGORY_ICONS: Record<Tool['category'], IconName> = {
  editor: 'editor',
  terminal: 'terminal',
  browser: 'browser',
  design: 'design',
  productivity: 'productivity',
  ai: 'ai',
  devtools: 'devtools',
}

const CATEGORY_ORDER: Tool['category'][] = [
  'editor',
  'ai',
  'terminal',
  'design',
  'devtools',
  'productivity',
  'browser',
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ToolsPage() {
  const tools = toolsData as Tool[]

  const grouped = tools.reduce<Partial<Record<Tool['category'], Tool[]>>>((acc, t) => {
    acc[t.category] = [...(acc[t.category] ?? []), t]
    return acc
  }, {})

  const orderedCats = CATEGORY_ORDER.filter((cat) => grouped[cat]?.length)
  const freeCount = tools.filter((t) => t.free).length

  return (
    <div>
      {/* Breadcrumb handles its own buildBreadcrumbSchema JsonLd internally */}
      <section className="border-ds-border border-b py-16">
        <div className="max-w-site mx-auto px-6">
          <Breadcrumb
            items={[
              { name: 'Home', url: 'https://devstash.me' },
              { name: 'Tools', url: 'https://devstash.me/tools' },
            ]}
          />
          <h1 className="text-ds-text mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
            What&apos;s actually on my machine
          </h1>
          <p className="text-ds-muted mt-4 max-w-[68ch] text-lg leading-relaxed">
            The stack I reach for every day, and what each thing is genuinely for. No affiliate
            links, no sponsored picks, nothing I don&apos;t open in a normal week.
          </p>
          <PageFacts
            items={[
              { value: tools.length, label: 'tools' },
              { value: freeCount, label: 'free' },
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
            entries: (grouped[cat] ?? []).map((t) => ({
              id: t.id,
              title: t.name,
              href: t.url,
              paid: !t.free,
              description: t.description,
            })),
          }))}
        />
      </section>
    </div>
  )
}
