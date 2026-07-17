import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { buildOgImageUrl } from '@/lib/seo/ogImage'
import { Breadcrumb } from '@/components/layout'
import { Badge, Card, Reveal } from '@/components/ui'

const title = 'Lab — Interactive Tools & Live Demos'
const description =
  'A playground of things I built and shipped live in the browser: an AI content pipeline, CSS and SVG generators, SEO tooling, and conversion-focused landing-page samples.'

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
  flagship?: boolean
}

// Genuinely interactive utilities.
const TOOLS: Demo[] = [
  {
    slug: 'ai-content-pipeline',
    name: 'AI Content Pipeline',
    blurb:
      'A live 3-step LLM pipeline — draft, humanize to strip AI-tell phrases, then generate SEO frontmatter — with real token usage and latency shown for every step.',
    tag: 'AI',
    flagship: true,
  },
  {
    slug: 'css-shapes-playground',
    name: 'CSS Shapes & Animation Playground',
    blurb:
      'Live shape, color, animated-border, and box-shadow customizers, with copyable CSS on every demo.',
    tag: 'CSS',
  },
  {
    slug: 'illustration-generator',
    name: 'Illustration Generator',
    blurb:
      'Composes a unique, theme-aware animated SVG from a text description — procedural generation, not a fixed list of presets.',
    tag: 'Generative',
  },
  {
    slug: 'meta-tag-generator',
    name: 'Meta Tag & Social Preview Generator',
    blurb:
      'Drafts a title and description, then previews it as a Google result, an X card, and a Facebook/OG card — with live character counts and copyable tags.',
    tag: 'SEO',
  },
  {
    slug: 'utm-builder',
    name: 'UTM Builder',
    blurb:
      'A working UTM link builder for campaign URLs — fully client-side, nothing you type is sent anywhere.',
    tag: 'Marketing',
  },
]

// Conversion-focused landing-page samples.
const SAMPLES: Demo[] = [
  {
    slug: 'marketing-lead-gen',
    name: 'Marketing Audit Lead-Gen',
    blurb:
      'A low-friction lead-magnet landing page for a marketing agency, with a working demo form.',
    tag: 'Lead-gen',
  },
  {
    slug: 'real-estate-listing',
    name: 'Real-Estate Listing',
    blurb:
      'A property listing lead-gen page — sticky inquiry form, key-facts strip, and a working demo form.',
    tag: 'Real estate',
  },
  {
    slug: 'saas-trial-signup',
    name: 'SaaS Free-Trial Signup',
    blurb: 'A single-CTA, no-card-required SaaS trial signup page with a working demo form.',
    tag: 'SaaS',
  },
]

function DemoCard({ demo }: { demo: Demo }) {
  return (
    <Link
      href={`/lab/${demo.slug}`}
      className="group focus-visible:ring-ds-accent focus-visible:ring-offset-ds-bg block rounded-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <Card variant="hover" className="h-full">
        <div className="flex h-full flex-col gap-3 p-6">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-ds-text group-hover:text-ds-accent font-semibold transition-colors">
              {demo.name}
            </h3>
            <Badge variant={demo.flagship ? 'purple' : 'muted'}>
              {demo.flagship ? 'Flagship' : demo.tag}
            </Badge>
          </div>
          <p className="text-ds-muted flex-1 text-sm leading-relaxed">{demo.blurb}</p>
          <span className="text-ds-accent mt-1 text-sm font-medium">Try it live →</span>
        </div>
      </Card>
    </Link>
  )
}

export default function LabPage() {
  return (
    <main>
      {/* ── Header ── */}
      {/* Breadcrumb emits its own BreadcrumbList JSON-LD */}
      <section className="border-ds-border border-b py-16">
        <div className="mx-auto max-w-5xl px-6">
          <Breadcrumb
            items={[
              { name: 'Home', url: 'https://devstash.me' },
              { name: 'Lab', url: 'https://devstash.me/lab' },
            ]}
          />
          <p className="text-ds-accent mt-6 font-mono text-sm">{'// lab'}</p>
          <h1 className="text-ds-text mt-3 text-4xl font-bold tracking-tight">Lab</h1>
          <p className="text-ds-muted mt-3 max-w-2xl text-lg leading-relaxed">
            Real, interactive things I&apos;ve built — running live in your browser, no signup.
            Break them, copy from them, view the source. Everything here is client-side unless it
            says otherwise.
          </p>
        </div>
      </section>

      {/* ── Interactive tools ── */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6">
          <Reveal>
            <h2 className="text-ds-text mb-8 flex items-baseline gap-3 text-2xl font-bold">
              <span className="text-ds-accent font-mono text-base font-normal">01 —</span>
              Interactive tools
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((demo, i) => (
              <Reveal key={demo.slug} delay={i * 60}>
                <DemoCard demo={demo} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Landing-page samples ── */}
      <section className="border-ds-border border-t py-16">
        <div className="mx-auto max-w-5xl px-6">
          <Reveal>
            <h2 className="text-ds-text mb-2 flex items-baseline gap-3 text-2xl font-bold">
              <span className="text-ds-accent font-mono text-base font-normal">02 —</span>
              Landing-page samples
            </h2>
          </Reveal>
          <p className="text-ds-muted mb-8 max-w-2xl text-sm leading-relaxed">
            Conversion-focused pages in the style of the 200+ PPC landing pages I&apos;ve shipped
            for US clients — each with a working demo form.
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SAMPLES.map((demo, i) => (
              <Reveal key={demo.slug} delay={i * 60}>
                <DemoCard demo={demo} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
