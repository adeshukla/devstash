import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildWebSiteSchema, buildPersonSchema } from '@/lib/schema/builders'
import { HeroSection } from '@/components/sections/HeroSection'
import { ProjectsGrid } from '@/components/sections/ProjectsGrid'
import { FeaturedPosts } from '@/components/sections/FeaturedPosts'
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

      {/* Featured projects (preview — links to /projects) */}
      <ProjectsGrid projects={projects} />

      {/* Latest writing (renders nothing if there are no posts) */}
      <FeaturedPosts posts={posts} />

      {/* Closing CTA */}
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
            <Link
              href="/contact"
              className="bg-ds-accent focus-visible:ring-ds-accent focus-visible:ring-offset-ds-bg inline-flex h-12 items-center justify-center rounded-xl px-6 text-[15px] font-semibold text-white transition-colors hover:bg-blue-400 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              Get in touch
            </Link>
            <a
              href="/resume-adesh-shukla.pdf"
              download
              data-analytics-event="cv_viewed"
              className="border-ds-accent text-ds-accent hover:bg-ds-accent focus-visible:ring-ds-accent focus-visible:ring-offset-ds-bg inline-flex h-12 items-center justify-center gap-2.5 rounded-xl border px-6 text-[15px] font-medium transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              Download résumé ↓
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
