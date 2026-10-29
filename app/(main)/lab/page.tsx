import { H1_DISPLAY } from '@/lib/utils/typography'
import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { buildOgImageUrl } from '@/lib/seo/ogImage'
import { Breadcrumb } from '@/components/layout'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildItemListSchema } from '@/lib/schema/builders'
import { Badge, Button, CardTilt } from '@/components/ui'
import { PageFacts } from '@/components/ui/PageFacts'
import { getAllProjects } from '@/lib/markdown/projects'
import { buildFAQSchema } from '@/lib/schema/builders'
import { LabFaq } from '@/components/lab/LabFaq'
import { LabTools, type LabTool } from '@/components/lab/LabTools'
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

const PRINCIPLES = [
  {
    title: 'Runs where you are',
    body: 'The CSS, SVG, SEO and UTM tools run entirely in your browser; none of their code makes a network request. Only the AI pipeline calls a server.',
  },
  {
    title: 'Real output, not mock-ups',
    body: 'Each preview animates the shape of what the tool really produces. Open one and what you get is the actual result, ready to copy.',
  },
  {
    title: 'Honest by design',
    body: 'The AI pipeline leaves [TODO] markers where only your own experience belongs. It does not invent code, numbers or a human voice.',
  },
]

const FAQ = [
  {
    question: 'Do I need an account?',
    answer: 'No. Every tool opens straight away, with no signup.',
  },
  {
    question: 'Is what I type sent anywhere?',
    answer:
      'Not by the browser-side tools: the CSS playground, illustration generator, meta tag generator and UTM builder make no network requests. The AI Content Pipeline does send your input to a server, because that is where the model runs.',
  },
  {
    question: 'What does the AI pipeline run on?',
    answer:
      'A three-step chain on Groq, with an automatic Cerebras fallback: scaffold, copy-edit, then frontmatter. It reports token usage and latency at each step.',
  },
  {
    question: 'How is the Lab different from Projects?',
    answer:
      'The Lab holds things you can use right now. Projects holds the case studies behind them: the problem, the decisions and what I would change.',
  },
]

export default async function LabPage() {
  const projects = await getAllProjects()
  const tools: LabTool[] = TOOLS.map((demo) => {
    const project = projects.find((p) => p.slug === demo.slug)
    return {
      slug: demo.slug,
      name: demo.name,
      blurb: demo.blurb,
      tag: demo.tag,
      highlights: project?.highlights ?? [],
      stats: project?.coverStats ?? [],
      tech: project?.tech ?? [],
      preview: <LabPreview kind={demo.preview} />,
    }
  })

  return (
    <div>
      <JsonLd
        data={buildItemListSchema(
          [FLAGSHIP, ...TOOLS].map((d) => ({ name: d.name, url: `/lab/${d.slug}` }))
        )}
      />
      <JsonLd data={buildFAQSchema(FAQ.map((f) => ({ question: f.question, answer: f.answer })))} />
      {/* Breadcrumb emits its own BreadcrumbList JSON-LD */}
      <section className="border-ds-border border-b py-16">
        <div className="max-w-site mx-auto px-6">
          <Breadcrumb
            items={[
              { name: 'Home', url: 'https://devstash.me' },
              { name: 'Lab', url: 'https://devstash.me/lab' },
            ]}
          />
          <h1 className={`${H1_DISPLAY} mt-6`}>Everything here is running.</h1>
          <p className="text-ds-muted mt-4 max-w-[68ch] text-lg leading-relaxed">
            Not screenshots or case studies — working things you can use right now, in your browser,
            with no signup. Break them, copy from them, view the source. Each preview below is the
            real output, animating live.
          </p>
          <PageFacts
            items={[
              { value: TOOLS.length + 1, label: 'live tools' },
              { value: 1, label: 'runs server-side' },
              { value: 0, label: 'signups needed' },
            ]}
          />
        </div>
      </section>

      {/* The flagship is a build, not a card in a grid — it gets the space to
          show its own three-stage shape. */}
      <section className="py-16">
        <div className="max-w-site mx-auto px-6">
          <CardTilt>
            <Link
              href={`/lab/${FLAGSHIP.slug}`}
              className="group focus-visible:ring-ds-accent focus-visible:ring-offset-ds-bg rounded-card block focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <article className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-14">
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
                <div className="card-spotlight card-glow rounded-xl">
                  <LabPreview kind="pipeline" />
                </div>
              </article>
            </Link>
          </CardTilt>
        </div>
      </section>

      <section className="py-4 pb-16">
        <div className="max-w-site mx-auto px-6">
          <h2 className="text-ds-text mb-2 text-2xl font-bold tracking-tight">Tools</h2>
          <p className="text-ds-muted mb-8 max-w-[60ch]">
            Filter by type, open any card for what is inside it, or jump straight in.
          </p>
          <LabTools tools={tools} />
        </div>
      </section>

      <section className="border-ds-border border-t py-16">
        <div className="max-w-site mx-auto px-6">
          <h2 className="text-ds-text text-2xl font-bold tracking-tight">How the Lab works</h2>
          <ol className="mt-10 grid gap-10 md:grid-cols-3">
            {PRINCIPLES.map((item, n) => (
              <li key={item.title} className="flex flex-col gap-3">
                <span className="text-ds-accent font-mono text-sm">
                  {String(n + 1).padStart(2, '0')}
                </span>
                <h3 className="text-ds-text text-lg font-semibold tracking-tight">{item.title}</h3>
                <p className="text-ds-muted text-sm leading-relaxed">{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-ds-border border-t py-16">
        <div className="max-w-site mx-auto grid gap-10 px-6 lg:grid-cols-[5fr_7fr]">
          <div>
            <h2 className="text-ds-text text-2xl font-bold tracking-tight">Questions</h2>
            <p className="text-ds-muted mt-3 max-w-md leading-relaxed">
              The short answers on what the Lab is and what it does with what you type.
            </p>
          </div>
          <LabFaq items={FAQ} />
        </div>
      </section>

      <section className="border-ds-border border-t py-16">
        <div className="max-w-site mx-auto flex flex-col gap-6 px-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-ds-text text-2xl font-bold tracking-tight">Want the reasoning?</h2>
            <p className="text-ds-muted mt-2">
              Each build has a case study: the problem and the tradeoffs.
            </p>
          </div>
          <Button href="/projects">Read the case studies &rarr;</Button>
        </div>
      </section>
    </div>
  )
}
