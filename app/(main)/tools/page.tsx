import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { Breadcrumb } from '@/components/layout'
import { Badge, Card } from '@/components/ui'
import toolsData from '@/content/tools/tools.json'

export const metadata: Metadata = buildMetadata({
  title: 'Tools — DevStash',
  description:
    'The actual tools Adesh uses daily — editor, AI, terminal, design, deployment. No sponsored picks.',
  canonical: 'https://devstash.me/tools',
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

  return (
    <main>
      {/* ── Header ── */}
      {/* Breadcrumb handles its own buildBreadcrumbSchema JsonLd internally */}
      <section className="border-ds-border border-b py-16">
        <div className="mx-auto max-w-5xl px-6">
          <Breadcrumb
            items={[
              { name: 'Home', url: 'https://devstash.me' },
              { name: 'Tools', url: 'https://devstash.me/tools' },
            ]}
          />
          <h1 className="text-ds-text mt-4 text-4xl font-bold">Tools</h1>
          <p className="text-ds-muted mt-3 max-w-xl">
            What&apos;s actually running on my machine. No affiliate links, no sponsored picks —
            just the stack I reach for every day.
          </p>
        </div>
      </section>

      {/* ── Tool groups ── */}
      <section className="py-16">
        <div className="mx-auto flex max-w-5xl flex-col gap-16 px-6">
          {orderedCats.map((cat) => (
            <div key={cat}>
              <h2 className="text-ds-text mb-6 flex items-center gap-3 text-xl font-bold">
                {CATEGORY_LABELS[cat]}
                <span className="bg-ds-border h-px flex-1" aria-hidden="true" />
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {grouped[cat]?.map((tool) => (
                  <Link
                    key={tool.id}
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group focus-visible:ring-ds-accent focus-visible:ring-offset-ds-bg block rounded-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    <Card variant="hover" className="h-full">
                      <div className="flex flex-col gap-3 p-5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-ds-text group-hover:text-ds-accent font-semibold transition-colors">
                            {tool.name}
                          </h3>
                          {tool.free ? (
                            <Badge variant="green">Free</Badge>
                          ) : (
                            <Badge variant="muted">Paid</Badge>
                          )}
                        </div>
                        <p className="text-ds-muted text-sm">{tool.description}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {tool.tags.map((t) => (
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
