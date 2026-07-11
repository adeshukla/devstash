import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildWebSiteSchema, buildPersonSchema } from '@/lib/schema/builders'
import { HeroSection } from '@/components/sections/HeroSection'
import { ProjectsGrid } from '@/components/sections/ProjectsGrid'
import { FeaturedPosts } from '@/components/sections/FeaturedPosts'
import { Reveal, Button, Badge } from '@/components/ui'
import { Icon } from '@/components/icons/Icon'
import { getAllProjects, getFeaturedProjects } from '@/lib/markdown/projects'
import { getAllPosts, getFeaturedPosts } from '@/lib/markdown/blog'
import type { IconName } from '@/components/icons/Icon'

// Home metadata — canonical defaults to the site root (no trailing slash).
export const metadata: Metadata = buildMetadata({
  description:
    'The developer ecosystem of Adesh Shukla — frontend engineering, automation, AI workflows, and developer resources. Projects, writing, and tools in one place.',
})

// ─── "What I do" — client-facing framing, each line backed by something this
// site itself demonstrably does (perf budget, own SEO system, own automation).
const WHAT_I_DO: { icon: IconName; title: string; description: string }[] = [
  {
    icon: 'frontend',
    title: 'Frontend Engineering',
    description:
      'React and Next.js apps built to a real performance budget — Lighthouse 90+, tight Core Web Vitals, accessible by default.',
  },
  {
    icon: 'performance',
    title: 'SEO-Ready by Default',
    description:
      "Structured data, metadata, and sitemaps wired in from day one on every page — this site's own search visibility runs on the same system.",
  },
  {
    icon: 'automation',
    title: 'Workflow Automation',
    description:
      'n8n and LLM pipelines that handle the repetitive parts — from deploy-triggered search-engine notifications to AI-assisted content workflows.',
  },
]

// ─── Flagship build — the AI Content Pipeline demo (/lab/ai-content-pipeline):
// a real 3-step Groq LLM chain, not a mockup. Facts below match the demo's own
// page copy and types/aiPipeline.ts exactly — nothing here is invented.
const PIPELINE_STEPS: { step: string; title: string; description: string }[] = [
  {
    step: '01',
    title: 'Scaffold',
    description:
      "Writes an honest first draft — and leaves [TODO: …] markers wherever it would otherwise fake code or metrics it doesn't have.",
  },
  {
    step: '02',
    title: 'Copy-edit',
    description:
      'A pass that strips common AI tells — "in conclusion", "delve into", "leverage" — with a before/after phrase count shown.',
  },
  {
    step: '03',
    title: 'Frontmatter',
    description:
      "Outputs SEO frontmatter matching this blog's real schema — title, slug, description, category, tags, reading time.",
  },
]

export default function HomePage() {
  // Prefer featured items; gracefully fall back to the latest if none flagged.
  const featuredProjects = getFeaturedProjects(6)
  const projects = featuredProjects.length > 0 ? featuredProjects : getAllProjects().slice(0, 6)

  const featuredPosts = getFeaturedPosts(3)
  const posts = featuredPosts.length > 0 ? featuredPosts : getAllPosts().slice(0, 3)

  return (
    <>
      <JsonLd data={buildWebSiteSchema()} />
      <JsonLd data={buildPersonSchema()} />

      {/* Hero */}
      <HeroSection />

      {/* What I do — client-facing framing between the hero and the project grid */}
      <Reveal>
        <section className="py-16">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-10 max-w-2xl">
              <p className="text-ds-accent font-mono text-sm">{'// what i do'}</p>
              <h2 className="text-ds-text mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Frontend, SEO, and the automation that ties it together
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              {WHAT_I_DO.map(({ icon, title, description }) => (
                <div key={title}>
                  <div className="border-ds-border bg-ds-surface text-ds-accent flex h-10 w-10 items-center justify-center rounded-lg border">
                    <Icon name={icon} className="h-5 w-5" />
                  </div>
                  <h3 className="text-ds-text mt-4 font-semibold">{title}</h3>
                  <p className="text-ds-muted mt-2 text-sm leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* Featured projects (preview — links to /projects) — cards reveal individually */}
      <ProjectsGrid projects={projects} />

      {/* Flagship build — the AI Content Pipeline demo, the strongest single proof point */}
      <Reveal>
        <section className="border-ds-border border-t py-16">
          <div className="mx-auto max-w-5xl px-6">
            <div className="border-ds-border bg-ds-surface overflow-hidden rounded-2xl border">
              <div className="grid grid-cols-1 gap-10 p-8 sm:p-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <Badge variant="purple" dot>
                      Flagship build
                    </Badge>
                  </div>
                  <h2 className="text-ds-text text-2xl font-bold tracking-tight sm:text-3xl">
                    A real AI pipeline, not a mockup
                  </h2>
                  <p className="text-ds-muted mt-4 leading-relaxed">
                    Three sequential Groq LLM calls run server-side for every request — scaffold,
                    copy-edit, frontmatter — with real token usage and latency shown for each step,
                    and an automatic fallback to Cerebras if Groq is unavailable.
                  </p>
                  <Button
                    href="/lab/ai-content-pipeline"
                    size="lg"
                    className="mt-8 font-semibold"
                    iconRight={<Icon name="external-link" className="h-4 w-4" />}
                  >
                    Try it live
                  </Button>
                </div>

                <ol className="flex flex-col gap-6">
                  {PIPELINE_STEPS.map(({ step, title, description }) => (
                    <li key={step} className="flex gap-4">
                      <span className="text-ds-accent font-mono text-sm">{step}</span>
                      <div>
                        <h3 className="text-ds-text font-semibold">{title}</h3>
                        <p className="text-ds-muted mt-1 text-sm leading-relaxed">{description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Latest writing (renders nothing if there are no posts) — cards reveal individually */}
      <FeaturedPosts posts={posts} />

      {/* Lab teaser — surfaces the interactive demos (the strongest differentiator) */}
      <Reveal>
        <section className="border-ds-border border-t py-20">
          <div className="mx-auto max-w-5xl px-6">
            <div className="border-ds-border bg-ds-surface flex flex-col items-start gap-6 rounded-2xl border p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
              <div className="max-w-xl">
                <p className="text-ds-accent font-mono text-sm">{'// lab'}</p>
                <h2 className="text-ds-text mt-2 text-2xl font-bold tracking-tight">
                  Play with what I&apos;ve built
                </h2>
                <p className="text-ds-muted mt-3 leading-relaxed">
                  A live AI content pipeline, CSS &amp; SVG generators, SEO tooling, and
                  conversion-focused landing-page samples — all running in your browser, no signup.
                </p>
              </div>
              <Button href="/lab" size="lg" className="shrink-0 font-semibold">
                Explore the Lab →
              </Button>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Closing CTA */}
      <Reveal>
        <section className="border-ds-border bg-ds-surface border-t py-20">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="text-ds-text text-3xl font-bold tracking-tight">
              Let&apos;s build something
            </h2>
            <p className="text-ds-muted mt-3 text-lg">
              Open to frontend roles and freelance collaborations. Have a project, a role, or just a
              question? I&apos;d love to hear about it.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button href="/contact" size="lg" className="font-semibold">
                Get in touch
              </Button>
              <Button
                href="/resume-adesh-shukla.pdf"
                download
                data-analytics-event="cv_viewed"
                variant="outline"
                size="lg"
                iconRight={<Icon name="download" className="h-4 w-4" />}
              >
                Download résumé
              </Button>
            </div>
          </div>
        </section>
      </Reveal>
    </>
  )
}
