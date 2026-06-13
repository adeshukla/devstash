// app/(main)/blog/category/[category]/page.tsx
import { notFound } from 'next/navigation'
import { type Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { buildOgImageUrl } from '@/lib/seo/ogImage'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildBreadcrumbSchema } from '@/lib/schema/builders'
import { Breadcrumb } from '@/components/layout'
import { BlogList } from '@/components/blog/BlogList'
import { getAllPosts, getPostsByCategory } from '@/lib/markdown/blog'
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

  return buildMetadata({
    title: `${label} — Blog`,
    description: `All DevStash blog posts in the ${label} category.`,
    canonical: `/blog/category/${category}`,
    type: 'website',
    ogImage: buildOgImageUrl({
      title: `${label} — Blog`,
      description: `All DevStash blog posts in the ${label} category.`,
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

      <div className="container mx-auto max-w-6xl px-4 py-12">
        <Breadcrumb
          items={[
            { name: 'Blog', url: 'https://devstash.me/blog' },
            { name: validCategory.label, url: `https://devstash.me/blog/category/${category}` },
          ]}
        />

        <div className="mt-6 mb-10">
          <p className="text-ds-muted mb-2 font-mono text-sm">Category</p>
          <h1 className="text-ds-text mb-3 font-sans text-4xl font-bold tracking-tight">
            {validCategory.label}
          </h1>
          <p className="text-ds-muted">
            {posts.length} post{posts.length !== 1 ? 's' : ''}
          </p>
        </div>

        <BlogList posts={posts} emptyMessage={`No posts in ${validCategory.label} yet.`} />
      </div>
    </>
  )
}
