// app/(main)/blog/page.tsx
import { Suspense } from 'react'
import { type Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { buildOgImageUrl } from '@/lib/seo/ogImage'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildBreadcrumbSchema, buildWebSiteSchema } from '@/lib/schema/builders'
import { Breadcrumb } from '@/components/layout'
import { PageHeaderGlow } from '@/components/ui'
import { Icon } from '@/components/icons/Icon'
import { Pagination } from '@/components/ui/Pagination'
import { BlogList } from '@/components/blog/BlogList'
import { BlogFilter } from '@/components/blog/BlogFilter'
import { getAllPosts, getAllCategories, getAllTags } from '@/lib/markdown/blog'
import { type BlogCategory } from '@/types/blog'

const POSTS_PER_PAGE = 9

const title = 'Blog — Frontend, Automation & AI Workflows'
const description =
  'Articles on frontend development, automation, AI workflows, and developer tooling — practical write-ups from things Adesh figures out while building.'

export const metadata: Metadata = buildMetadata({
  title,
  description,
  canonical: '/blog',
  type: 'website',
  ogImage: buildOgImageUrl({ title, description, type: 'website' }),
})

type Props = {
  searchParams: Promise<{
    category?: string
    tag?: string
    page?: string
  }>
}

export default async function BlogPage({ searchParams }: Props) {
  const { category, tag, page: pageParam } = await searchParams

  const currentPage = Math.max(1, parseInt(pageParam ?? '1', 10))
  const allPosts = getAllPosts()
  const categories = getAllCategories()
  const tags = getAllTags()

  // Filter
  let filtered = allPosts
  if (category) filtered = filtered.filter((p) => p.category === (category as BlogCategory))
  if (tag) filtered = filtered.filter((p) => p.tags.includes(tag))

  // Paginate
  const totalPages = Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const start = (safePage - 1) * POSTS_PER_PAGE
  const paged = filtered.slice(start, start + POSTS_PER_PAGE)

  const currentParams: Record<string, string> = {}
  if (category) currentParams.category = category
  if (tag) currentParams.tag = tag

  const breadcrumbs = [
    { name: 'Home', url: 'https://devstash.me' },
    { name: 'Blog', url: 'https://devstash.me/blog' },
  ]

  return (
    <>
      <JsonLd data={buildBreadcrumbSchema(breadcrumbs)} />
      <JsonLd data={buildWebSiteSchema()} />

      {/* ── Header — same bordered-section rhythm as every other page header
          (Tools, Resources, Lab): border-b py-16, mx-auto px-6, glow behind
          it. Blog used to run a flat unbordered container here instead. ── */}
      <section className="border-ds-border relative overflow-hidden border-b py-16">
        <PageHeaderGlow side="right" />
        <div className="mx-auto max-w-6xl px-6">
          <Breadcrumb items={[{ name: 'Blog', url: 'https://devstash.me/blog' }]} />

          <div className="mt-6">
            <h1 className="text-ds-text mb-3 font-sans text-4xl font-bold tracking-tight sm:text-5xl">
              Blog
            </h1>
            <p className="text-ds-muted max-w-xl">
              Writing about frontend systems, automation, AI workflows, and things I figure out
              while building.
            </p>
          </div>
        </div>
      </section>

      {/* ── Content ── */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          {/* Layout: filter bar + post grid. BlogFilter is compact on mobile
              (horizontal-scroll category strip, tags collapsed) so it can sit
              at the top — like every major filter UI — without pushing cards
              out of the first fold. Becomes the left sidebar at lg. */}
          <div className="flex flex-col lg:grid lg:grid-cols-[240px_1fr] lg:gap-10">
            {/* Filter bar / sidebar */}
            <aside className="mb-6 lg:mb-0">
              <Suspense>
                <BlogFilter
                  categories={categories}
                  tags={tags}
                  selectedCategory={category}
                  selectedTag={tag}
                />
              </Suspense>
            </aside>

            {/* Post grid */}
            <section>
              {/* Result count + RSS — was a standalone pill floating in the
                  header, disconnected from everything around it. This row
                  is the actual "content" line it belongs next to. */}
              <div className="mb-6 flex items-center justify-between gap-4">
                <p className="text-ds-muted text-sm">
                  {filtered.length === 0
                    ? 'No posts found'
                    : `${filtered.length} post${filtered.length === 1 ? '' : 's'}`}
                  {category && (
                    <>
                      {' '}
                      in <span className="text-ds-text">{category}</span>
                    </>
                  )}
                  {tag && (
                    <>
                      {' '}
                      tagged <span className="text-ds-text font-mono">#{tag}</span>
                    </>
                  )}
                </p>
                <a
                  href="/feed.xml"
                  aria-label="RSS feed"
                  className="gradient-ring-hover border-ds-border text-ds-muted hover:text-ds-accent flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border transition-colors"
                >
                  <Icon name="rss" className="h-3.5 w-3.5" />
                </a>
              </div>

              <BlogList posts={paged} />

              {totalPages > 1 && (
                <div className="mt-10">
                  <Pagination
                    currentPage={safePage}
                    totalPages={totalPages}
                    baseUrl="/blog"
                    searchParams={currentParams}
                  />
                </div>
              )}
            </section>
          </div>
        </div>
      </section>
    </>
  )
}
