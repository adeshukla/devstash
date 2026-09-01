import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { buildOgImageUrl } from '@/lib/seo/ogImage'
import { Breadcrumb } from '@/components/layout'
import { PageHeaderGlow } from '@/components/ui'
import { Icon, type IconName } from '@/components/icons/Icon'
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
    <main>
      {/* Breadcrumb handles its own buildBreadcrumbSchema JsonLd internally */}
      <section className="border-ds-border relative overflow-hidden border-b py-16">
        <PageHeaderGlow side="right" />
        <div className="mx-auto max-w-3xl px-6">
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
          <p className="text-ds-muted mt-6 text-sm">
            {tools.length} tools · {freeCount} free
          </p>
        </div>
      </section>

      {/* An inventory, not a card grid. Each row is name + what it's for, which
          is the only question this page has to answer. */}
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
              </h2>

              <ul className="divide-y divide-[var(--color-ds-border)]">
                {grouped[cat]?.map((tool) => (
                  <li key={tool.id}>
                    <Link
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group focus-visible:ring-ds-accent focus-visible:ring-offset-ds-bg -mx-3 grid gap-1 rounded-lg px-3 py-4 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:grid-cols-[13rem_1fr] sm:items-baseline sm:gap-6"
                    >
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-ds-text group-hover:text-ds-accent font-medium transition-colors">
                          {tool.name}
                        </h3>
                        {!tool.free && <span className="text-ds-muted text-xs">Paid</span>}
                        <Icon
                          name="external-link"
                          className="text-ds-muted h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                        />
                      </div>
                      <p className="text-ds-muted max-w-[68ch] text-sm leading-relaxed">
                        {tool.description}
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
