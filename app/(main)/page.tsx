import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildWebSiteSchema, buildPersonSchema, buildIntroVideoSchema } from '@/lib/schema/builders'
import { HeroSection } from '@/components/sections/HeroSection'
import { ProjectDeckSection } from '@/components/sections/ProjectDeckSection'
import { FeaturedPosts } from '@/components/sections/FeaturedPosts'
import { WhatIDoBento } from '@/components/sections/WhatIDoBento'
import { Reveal, Button } from '@/components/ui'
import { Icon } from '@/components/icons/Icon'
import { IntroVideo } from '@/components/ui/IntroVideo'
import { getAllProjects, getFeaturedProjects } from '@/lib/markdown/projects'
import { getAllPosts, getFeaturedPosts } from '@/lib/markdown/blog'

// Home metadata — canonical is deliberately omitted so it defaults to the site
// root with no trailing slash.
//
// The title leads with the person, not the brand: "DevStash" collides with
// devstash.dev and an unrelated GitHub project of the same name, while
// "Adesh Shukla — Frontend Developer" is the query a recruiter actually types.
// The old title ("DevStash — Modern Developer Ecosystem") targeted a phrase
// with no real search demand and rendered the brand name twice.
export const metadata: Metadata = buildMetadata({
  title: 'Adesh Shukla — UI Developer: Landing Pages & Web Performance',
  description:
    'UI developer, 6+ years. 200+ PPC landing pages for US clients — CSS, responsive layout, accessibility and page-speed fixes. Open to roles in India or remote.',
})

export default function HomePage() {
  // Prefer featured items; gracefully fall back to the latest if none flagged.
  const featuredProjects = getFeaturedProjects(6)
  const projects = featuredProjects.length > 0 ? featuredProjects : getAllProjects().slice(0, 6)

  // FeaturedPosts renders up to 4, but only 2 posts are flagged `featured`, so
  // the homepage was linking to 2 of 20 posts. The old fallback only triggered
  // when NOTHING was flagged, so a partial set stayed partial. Top up with the
  // most recent unflagged posts instead: the homepage is the site's highest-
  // authority page, and every extra outbound link from it is a crawl path into
  // a post that currently has almost no internal links pointing at it.
  const HOMEPAGE_POST_COUNT = 4
  const featuredPosts = getFeaturedPosts(HOMEPAGE_POST_COUNT)
  const posts = [
    ...featuredPosts,
    ...getAllPosts().filter((p) => !featuredPosts.some((f) => f.slug === p.slug)),
  ].slice(0, HOMEPAGE_POST_COUNT)

  return (
    <>
      <JsonLd data={buildWebSiteSchema()} />
      <JsonLd data={buildPersonSchema()} />
      <JsonLd data={buildIntroVideoSchema()} />

      {/* Hero */}
      <HeroSection />

      {/* Featured projects as a draggable, flippable deck (links to /projects).
          Straight after the hero: proof before claims, and the page's one
          signature interaction is the first thing a visitor can touch. */}
      <ProjectDeckSection projects={projects} />

      {/* What I do — the claims, each linked to the projects that prove it */}
      <Reveal>
        <WhatIDoBento />
      </Reveal>

      {/* The work above, narrated in 80 seconds. Click-to-load: only the poster ships with the page. */}
      <Reveal>
        <section className="border-ds-border border-t py-16" aria-labelledby="home-video-heading">
          <div className="mx-auto max-w-4xl px-6">
            <h2
              id="home-video-heading"
              className="text-ds-text text-3xl font-bold tracking-tight sm:text-4xl"
            >
              The work, in 80 seconds
            </h2>
            <p className="text-ds-muted mt-3 mb-8 leading-relaxed">
              A narrated tour of the projects above — what each one does and why it was built.
            </p>
            <IntroVideo />
          </div>
        </section>
      </Reveal>

      {/* Latest writing (renders nothing if there are no posts) — cards reveal individually */}
      <FeaturedPosts posts={posts} />

      {/* Lab teaser — surfaces the interactive demos (the strongest differentiator) */}
      <Reveal>
        <section className="border-ds-border border-t py-20">
          <div className="max-w-site mx-auto px-6">
            <div className="border-ds-border bg-ds-surface flex flex-col items-start gap-6 rounded-2xl border p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
              <div className="max-w-xl">
                <p className="text-ds-accent font-mono text-sm">{'// lab'}</p>
                <h2 className="text-ds-text mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
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

      {/* Testimonials: built (components/sections/Testimonials.tsx +
          components/ui/TestimonialsCarousel.tsx), self-gates on real quotes in
          content/testimonials/testimonials.json. Not wired in for now per
          Adesh — component kept for later, not deleted. */}

      {/* Closing CTA */}
      <Reveal>
        <section className="border-ds-border bg-ds-surface border-t py-20">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="text-ds-text text-3xl font-bold tracking-tight sm:text-4xl">
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
