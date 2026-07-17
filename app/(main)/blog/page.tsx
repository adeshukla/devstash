// app/(main)/blog/page.tsx
import { Suspense } from 'react'
import { type Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { buildOgImageUrl } from '@/lib/seo/ogImage'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildBreadcrumbSchema, buildWebSiteSchema } from '@/lib/schema/builders'
import { Breadcrumb } from '@/components/layout'
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

      <div className="container mx-auto max-w-6xl px-4 py-12">
        {/* Header */}
        <Breadcrumb items={[{ name: 'Blog', url: 'https://devstash.me/blog' }]} />

        <div className="mt-6 mb-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-ds-text mb-3 font-sans text-4xl font-bold tracking-tight">Blog</h1>
            <p className="text-ds-muted max-w-xl">
              Writing about frontend systems, automation, AI workflows, and things I figure out
              while building.
            </p>
          </div>
          <a
            href="/feed.xml"
            className="text-ds-muted hover:text-ds-accent border-ds-border hover:border-ds-accent mt-1 flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors"
          >
            RSS
          </a>
        </div>

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
            {/* Result count */}
            <p className="text-ds-muted mb-6 text-sm">
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
    </>
  )
}
