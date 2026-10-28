import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { buildOgImageUrl } from '@/lib/seo/ogImage'
import { Breadcrumb } from '@/components/layout'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildItemListSchema } from '@/lib/schema/builders'
import { Badge, CardTilt } from '@/components/ui'
import { LabPreview, type PreviewKind } from '@/components/lab/LabPreview'

const title = 'Lab — Interactive Tools & Live Demos'
const description =
  'Things I built and shipped live in the browser: an AI content pipeline, CSS and SVG generators, and SEO and marketing tooling.'

export const metadata: Metadata = buildMetadata({
  title,
  description,
  canonical: '/lab',
  ogImage: buildOgImageUrl({ title, description, type: 'website' }),
})

interface Demo {
  slug: string
  name: string
  blurb: string
  tag: string
  preview: PreviewKind
}

const FLAGSHIP = {
  slug: 'ai-content-pipeline',
  name: 'AI Content Pipeline',
  blurb:
    'A live 3-step LLM chain running server-side: it scaffolds an honest draft, copy-edits the AI tells out of it, then generates SEO frontmatter — showing real token usage and latency at every step.',
  steps: [
    { name: 'Scaffold', detail: 'Marks what it will not invent' },
    { name: 'Copy-edit', detail: 'Strips AI-tell phrases' },
    { name: 'Frontmatter', detail: 'Emits real SEO fields' },
  ],
}

const TOOLS: Demo[] = [
  {
    slug: 'css-shapes-playground',
    name: 'CSS Shapes & Animation Playground',
    blurb:
      'Live shape, color, animated-border, and box-shadow customizers, with copyable CSS on every demo.',
    tag: 'CSS',
    preview: 'shapes',
  },
  {
    slug: 'illustration-generator',
    name: 'Illustration Generator',
    blurb:
      'Composes a unique, theme-aware animated SVG from a text description — procedural generation, not a fixed list of presets.',
    tag: 'Generative',
    preview: 'illustration',
  },
  {
    slug: 'meta-tag-generator',
    name: 'Meta Tag & Social Preview Generator',
    blurb:
      'Drafts a title and description, then previews it as a Google result, an X card, and a Facebook/OG card — with live character counts.',
    tag: 'SEO',
    preview: 'meta',
  },
  {
    slug: 'utm-builder',
    name: 'UTM Builder',
    blurb:
      'A working UTM link builder for campaign URLs — fully client-side, nothing you type is sent anywhere.',
    tag: 'Marketing',
    preview: 'utm',
  },
]

/**
 * An entry leads with its own live output. The preview is the point — it is
 * what separates a lab from a list of links — so it sits above the name rather
 * than being decoration beside it.
 */
function LabEntry({ demo }: { demo: Demo }) {
  return (
    <CardTilt>
      <Link
        href={`/lab/${demo.slug}`}
        className="group focus-visible:ring-ds-accent focus-visible:ring-offset-ds-bg block rounded-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <article className="flex h-full flex-col gap-4">
          <div className="card-spotlight card-glow rounded-lg">
            <LabPreview kind={demo.preview} />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-ds-text group-hover:text-ds-accent font-semibold transition-colors">
                {demo.name}
              </h3>
              <span className="text-ds-muted shrink-0 text-xs">{demo.tag}</span>
            </div>
            <p className="text-ds-muted flex-1 text-sm leading-relaxed">{demo.blurb}</p>
            <span className="text-ds-accent text-sm font-medium opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              Open it &rarr;
            </span>
          </div>
        </article>
      </Link>
    </CardTilt>
  )
}

export default function LabPage() {
  return (
    <div>
      <JsonLd
        data={buildItemListSchema(
          [FLAGSHIP, ...TOOLS].map((d) => ({ name: d.name, url: `/lab/${d.slug}` }))
        )}
      />
      {/* Breadcrumb emits its own BreadcrumbList JSON-LD */}
      <section className="border-ds-border border-b py-16">
        <div className="mx-auto max-w-5xl px-6">
          <Breadcrumb
            items={[
              { name: 'Home', url: 'https://devstash.me' },
              { name: 'Lab', url: 'https://devstash.me/lab' },
            ]}
          />
          <h1 className="text-ds-text mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
            Everything here is running.
          </h1>
          <p className="text-ds-muted mt-4 max-w-[68ch] text-lg leading-relaxed">
            Not screenshots or case studies — working things you can use right now, in your browser,
            with no signup. Break them, copy from them, view the source. Each preview below is the
            real output, animating live.
          </p>
        </div>
      </section>

      {/* The flagship is a build, not a card in a grid — it gets the space to
          show its own three-stage shape. */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6">
          <CardTilt>
            <Link
              href={`/lab/${FLAGSHIP.slug}`}
              className="group focus-visible:ring-ds-accent focus-visible:ring-offset-ds-bg rounded-card block focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <article className="bg-ds-surface card-spotlight card-glow rounded-card grid gap-8 p-6 shadow-sm sm:p-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="purple">Flagship</Badge>
                    <span className="text-ds-muted text-xs">Runs server-side on every request</span>
                  </div>
                  <h2 className="text-ds-text group-hover:text-ds-accent text-2xl font-bold tracking-tight transition-colors sm:text-3xl">
                    {FLAGSHIP.name}
                  </h2>
                  <p className="text-ds-muted max-w-[60ch] leading-relaxed">{FLAGSHIP.blurb}</p>
                  <ol className="border-ds-border mt-1 flex flex-col divide-y divide-[var(--color-ds-border)] border-y">
                    {FLAGSHIP.steps.map((step) => (
                      <li key={step.name} className="flex items-baseline gap-3 py-2.5">
                        <span className="text-ds-text w-24 shrink-0 text-sm font-medium">
                          {step.name}
                        </span>
                        <span className="text-ds-muted text-sm">{step.detail}</span>
                      </li>
                    ))}
                  </ol>
                  <span className="text-ds-accent mt-1 text-sm font-medium">
                    Run the pipeline &rarr;
                  </span>
                </div>
                <LabPreview kind="pipeline" />
              </article>
            </Link>
          </CardTilt>
        </div>
      </section>

      <section className="py-4 pb-16">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-ds-text mb-8 text-2xl font-bold tracking-tight">Tools</h2>
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2">
            {TOOLS.map((demo) => (
              <LabEntry key={demo.slug} demo={demo} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
