import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { buildOgImageUrl } from '@/lib/seo/ogImage'
import { Breadcrumb } from '@/components/layout'
import { Card, Badge } from '@/components/ui'

const title = 'Uses — Tools, Stack & Setup'
const description =
  "The languages, frameworks, dev tools, and hardware Adesh Shukla actually uses day to day — not a wishlist, what's really in the toolchain."

export const metadata: Metadata = buildMetadata({
  title,
  description,
  canonical: '/uses',
  ogImage: buildOgImageUrl({ title, description, type: 'website' }),
})

interface UsesSection {
  heading: string
  items: { name: string; note: string }[]
}

// Confirmed from this repo's own package.json / CLAUDE.md — not a guess.
const CONFIRMED: UsesSection[] = [
  {
    heading: 'Languages & Framework',
    items: [
      { name: 'TypeScript', note: 'strict mode, no `any`' },
      { name: 'Next.js (App Router)', note: 'Server Components by default' },
      { name: 'React', note: 'exact-pinned, not caret-ranged' },
      { name: 'Tailwind CSS v4', note: '@theme tokens, no arbitrary colors' },
    ],
  },
  {
    heading: 'Content & Data',
    items: [
      { name: 'next-mdx-remote', note: 'blog content pipeline' },
      { name: 'Zod v4', note: 'runtime validation' },
      { name: 'gray-matter', note: 'MDX frontmatter parsing' },
    ],
  },
  {
    heading: 'Infra & Deployment',
    items: [
      { name: 'Vercel', note: 'hosting, preview deploys, Speed Insights' },
      { name: 'Cloudflare', note: 'DNS only, grey-cloud' },
      { name: 'GitHub Actions', note: 'CI: typecheck, lint, build, security' },
      { name: 'pnpm', note: 'package manager, always' },
    ],
  },
  {
    heading: 'Automation & AI',
    items: [
      { name: 'n8n', note: 'workflow automation, self-hosted' },
      { name: 'Groq', note: 'LLM inference for the AI content pipeline' },
      { name: 'Playwright', note: 'responsive + security QA automation' },
    ],
  },
]

// [TODO: Adesh — fill these in with your real setup. Don't guess/reuse
// generic dev-blog answers; only list what you actually use.]
const TODO: UsesSection[] = [
  {
    heading: 'Editor & Terminal',
    items: [
      { name: '[TODO: editor, e.g. VS Code / theme / key extensions]', note: '' },
      { name: '[TODO: terminal app + shell]', note: '' },
    ],
  },
  {
    heading: 'Design',
    items: [{ name: '[TODO: Figma plugins / workflow you actually use]', note: '' }],
  },
  {
    heading: 'Hardware',
    items: [
      { name: '[TODO: machine — laptop/desktop, specs]', note: '' },
      { name: '[TODO: monitor / keyboard / mouse if worth mentioning]', note: '' },
    ],
  },
  {
    heading: 'Browser & Everyday Apps',
    items: [
      { name: '[TODO: browser + key extensions]', note: '' },
      { name: '[TODO: notes app, todo app, anything else you rely on]', note: '' },
    ],
  },
]

export default function UsesPage() {
  return (
    <main>
      <section className="border-ds-border border-b py-16">
        <div className="mx-auto max-w-3xl px-6">
          <Breadcrumb
            items={[
              { name: 'Home', url: 'https://devstash.me' },
              { name: 'Uses', url: 'https://devstash.me/uses' },
            ]}
          />
          <p className="text-ds-accent mt-4 font-mono text-sm">/uses</p>
          <h1 className="text-ds-text mt-2 text-4xl font-bold">What I actually use</h1>
          <p className="text-ds-muted mt-3 max-w-lg">
            Stack, tools, and setup — kept current, not a wishlist. Inspired by{' '}
            <a
              href="https://uses.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ds-accent underline-offset-4 hover:underline"
            >
              uses.tech
            </a>
            .
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto flex max-w-3xl flex-col gap-10 px-6">
          {CONFIRMED.map((section) => (
            <Card key={section.heading} padding="lg">
              <h2 className="text-ds-text mb-4 text-lg font-semibold">{section.heading}</h2>
              <ul className="flex flex-col gap-3">
                {section.items.map((item) => (
                  <li key={item.name} className="flex flex-wrap items-baseline gap-2">
                    <Badge variant="blue">{item.name}</Badge>
                    {item.note ? <span className="text-ds-muted text-sm">{item.note}</span> : null}
                  </li>
                ))}
              </ul>
            </Card>
          ))}

          {TODO.map((section) => (
            <Card key={section.heading} padding="lg" className="border-dashed">
              <h2 className="text-ds-muted mb-4 text-lg font-semibold">{section.heading}</h2>
              <ul className="flex flex-col gap-3">
                {section.items.map((item) => (
                  <li key={item.name} className="text-ds-muted font-mono text-sm">
                    {item.name}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>
    </main>
  )
}
