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

// Real post titles make each archive's description unique instead of boilerplate.
function archiveDescription(label: string, titles: string[]) {
  const base = `${titles.length} posts on ${label}: `
  return (base + titles.slice(0, 2).join('; ')).slice(0, 157).trimEnd()
}
import { type BlogCategory, BLOG_CATEGORIES } from '@/types/blog'

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
  const desc = archiveDescription(
    label,
    getPostsByCategory(category as BlogCategory).map((p) => p.title)
  )

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
            <p className="text-ds-muted">
              {posts.length} post{posts.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-site mx-auto px-6">
          <BlogList posts={posts} emptyMessage={`No posts in ${validCategory.label} yet.`} />
        </div>
      </section>
    </>
  )
}
