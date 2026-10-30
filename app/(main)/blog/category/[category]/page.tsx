// app/(main)/blog/category/[category]/page.tsx
import { H1_DISPLAY } from '@/lib/utils/typography'
import { notFound } from 'next/navigation'
import { type Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { buildOgImageUrl } from '@/lib/seo/ogImage'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildBreadcrumbSchema } from '@/lib/schema/builders'
import { Breadcrumb } from '@/components/layout'
import { BlogList } from '@/components/blog/BlogList'
import { getAllPosts, getPostsByCategory } from '@/lib/markdown/blog'

import Link from 'next/link'
import { type BlogCategory, BLOG_CATEGORIES } from '@/types/blog'

// One sentence per category, describing what its posts actually cover. It is the
// meta description and the visible intro, so each archive page has real copy
// instead of just a post count.
const CATEGORY_INTRO: Record<BlogCategory, string> = {
  automation:
    'Notes on n8n workflows, Groq prompts and calendar automation: what I automate, what I deliberately leave manual, and the patterns that held up.',
  frontend:
    'Next.js 16 App Router, Tailwind v4, accessibility, landing pages and custom websites: build notes, debugging write-ups and plain guides for site owners.',
  performance:
    'Core Web Vitals and mobile page speed: why pages are slow on phones, how to fix LCP, INP and layout shift, and what to check before paid traffic.',
  'ai-workflows':
    'AI in day-to-day development: coding assistants, MCP, local models and agentic browsing. Where they help, where they fail, and how I check the output.',
  devtools:
    'Comparisons of developer tooling, written from using it on real projects: what each tool is good at and where the differences actually show up.',
  tutorials:
    'Step-by-step explainers that show the working, such as how CSS cubic-bezier easing curves behave and how to choose one for a real element.',
  career:
    'Working notes on being a solo developer with AI assistants: what got removed from the workload, what did not, and what it asks of you.',
}

// ─── Static Params ────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const cats = [...new Set(getAllPosts().map((p) => p.category))]
  return cats.map((category) => ({ category }))
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ category: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params
  const label = BLOG_CATEGORIES.find((c) => c.value === category)?.label ?? category
  const desc = CATEGORY_INTRO[category as BlogCategory] ?? `Posts on ${label}.`

  return buildMetadata({
    title: `${label} — Blog`,
    description: desc,
    canonical: `/blog/category/${category}`,
    type: 'website',
    ogImage: buildOgImageUrl({
      title: `${label} — Blog`,
      description: desc,
      type: 'website',
    }),
  })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CategoryPage({ params }: Props) {
  const { category } = await params

  const validCategory = BLOG_CATEGORIES.find((c) => c.value === category)
  if (!validCategory) notFound()

  const posts = getPostsByCategory(category as BlogCategory)

  const breadcrumbs = [
    { name: 'Home', url: 'https://devstash.me' },
    { name: 'Blog', url: 'https://devstash.me/blog' },
    { name: validCategory.label, url: `https://devstash.me/blog/category/${category}` },
  ]

  return (
    <>
      <JsonLd data={buildBreadcrumbSchema(breadcrumbs)} />

      <section className="border-ds-border border-b py-16">
        <div className="max-w-site mx-auto px-6">
          <Breadcrumb
            items={[
              { name: 'Blog', url: 'https://devstash.me/blog' },
              { name: validCategory.label, url: `https://devstash.me/blog/category/${category}` },
            ]}
          />

          <div className="mt-6">
            <p className="text-ds-muted mb-2 font-mono text-sm">Category</p>
            <h1 className={`${H1_DISPLAY} mb-3`}>{validCategory.label}</h1>
            <p className="text-ds-muted max-w-2xl">{CATEGORY_INTRO[category as BlogCategory]}</p>
            <p className="text-ds-muted mt-3 font-mono text-sm">
              {posts.length} post{posts.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-site mx-auto px-6">
          <BlogList posts={posts} emptyMessage={`No posts in ${validCategory.label} yet.`} />
          <nav aria-label="Other topics" className="border-ds-border mt-12 border-t pt-8">
            <p className="text-ds-muted mb-3 font-mono text-sm">Other topics</p>
            <ul className="flex flex-wrap gap-2">
              {BLOG_CATEGORIES.filter((c) => c.value !== category).map((c) => (
                <li key={c.value}>
                  <Link
                    href={`/blog/category/${c.value}`}
                    className="border-ds-border text-ds-muted hover:border-ds-border2 hover:text-ds-text rounded-full border px-3.5 py-1.5 text-sm transition-colors"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>
    </>
  )
}
