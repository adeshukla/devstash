import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildWebSiteSchema, buildPersonSchema } from '@/lib/schema/builders'
import { HeroSection } from '@/components/sections/HeroSection'
import { ProjectsGrid } from '@/components/sections/ProjectsGrid'
import { FeaturedPosts } from '@/components/sections/FeaturedPosts'
import { Reveal, Button } from '@/components/ui'
import { Icon } from '@/components/icons/Icon'
import { getAllProjects, getFeaturedProjects } from '@/lib/markdown/projects'
import { getAllPosts, getFeaturedPosts } from '@/lib/markdown/blog'

// Home metadata — canonical defaults to the site root (no trailing slash).
export const metadata: Metadata = buildMetadata({
  description:
    'The developer ecosystem of Adesh Shukla — frontend engineering, automation, AI workflows, and developer resources. Projects, writing, and tools in one place.',
})

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

      {/* Featured projects (preview — links to /projects) — cards reveal individually */}
      <ProjectsGrid projects={projects} />

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
