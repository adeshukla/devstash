import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { buildOgImageUrl } from '@/lib/seo/ogImage'
import { Breadcrumb } from '@/components/layout'
import { Badge, PageHeaderGlow } from '@/components/ui'
import { LabPreview, type PreviewKind } from '@/components/lab/LabPreview'

const title = 'Lab — Interactive Tools & Live Demos'
const description =
  'Things I built and shipped live in the browser: an AI content pipeline, CSS and SVG generators, SEO tooling, and conversion-focused landing-page samples.'

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

const SAMPLES: Demo[] = [
  {
    slug: 'marketing-lead-gen',
    name: 'Marketing Audit Lead-Gen',
    blurb: 'A low-friction lead-magnet page for a marketing agency, with a working demo form.',
    tag: 'Lead-gen',
    preview: 'page-form',
  },
  {
    slug: 'real-estate-listing',
    name: 'Real-Estate Listing',
    blurb: 'A property listing page — sticky inquiry form, key-facts strip, working demo form.',
    tag: 'Real estate',
    preview: 'page-listing',
  },
  {
    slug: 'saas-trial-signup',
    name: 'SaaS Free-Trial Signup',
    blurb: 'A single-CTA, no-card-required SaaS trial signup page with a working demo form.',
    tag: 'SaaS',
    preview: 'page-trial',
  },
]

/**
 * An entry leads with its own live output. The preview is the point — it is
 * what separates a lab from a list of links — so it sits above the name rather
 * than being decoration beside it.
 */
function LabEntry({ demo }: { demo: Demo }) {
  return (
    <Link
      href={`/lab/${demo.slug}`}
      className="group focus-visible:ring-ds-accent focus-visible:ring-offset-ds-bg block rounded-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <article className="flex h-full flex-col gap-4">
        <div className="group-hover:border-ds-accent/50 rounded-lg transition-colors">
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
  )
}

export default function LabPage() {
  return (
    <main>
      {/* Breadcrumb emits its own BreadcrumbList JSON-LD */}
      <section className="border-ds-border relative overflow-hidden border-b py-16">
        <PageHeaderGlow side="right" />
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
          <Link
            href={`/lab/${FLAGSHIP.slug}`}
            className="group focus-visible:ring-ds-accent focus-visible:ring-offset-ds-bg block rounded-2xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <article className="border-ds-border bg-ds-surface hover:border-ds-accent/40 grid gap-8 rounded-2xl border p-6 transition-colors sm:p-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
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

      <section className="border-ds-border border-t py-16">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-ds-text mb-3 text-2xl font-bold tracking-tight">
            Landing-page samples
          </h2>
          <p className="text-ds-muted mb-8 max-w-[68ch] leading-relaxed">
            Conversion-focused pages in the style of the 200+ PPC landing pages I&apos;ve shipped
            for US clients — each one with a working demo form.
          </p>
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {SAMPLES.map((demo) => (
              <LabEntry key={demo.slug} demo={demo} />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
