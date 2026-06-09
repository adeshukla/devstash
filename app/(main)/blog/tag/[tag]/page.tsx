// app/(main)/blog/tag/[tag]/page.tsx
import { notFound } from 'next/navigation'
import { type Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildBreadcrumbSchema } from '@/lib/schema/builders'
import { Breadcrumb } from '@/components/layout'
import { BlogList } from '@/components/blog/BlogList'
import { getAllPosts, getPostsByTag, getAllTags } from '@/lib/markdown/blog'

// ─── Static Params ────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  return getAllTags().map(({ tag }) => ({ tag }))
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ tag: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params

  return buildMetadata({
    title: `#${tag} — Blog`,
    description: `All DevStash blog posts tagged with #${tag}.`,
    canonical: `/blog/tag/${tag}`,
    type: 'website',
  })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function TagPage({ params }: Props) {
  const { tag } = await params

  const knownTags = getAllPosts().flatMap((p) => p.tags)
  if (!knownTags.includes(tag)) notFound()

  const posts = getPostsByTag(tag)

  const breadcrumbs = [
    { name: 'Home', url: 'https://devstash.me' },
    { name: 'Blog', url: 'https://devstash.me/blog' },
    { name: `#${tag}`, url: `https://devstash.me/blog/tag/${tag}` },
  ]

  return (
    <>
      <JsonLd data={buildBreadcrumbSchema(breadcrumbs)} />

      <div className="container mx-auto max-w-6xl px-4 py-12">
        <Breadcrumb
          items={[
            { name: 'Blog', url: 'https://devstash.me/blog' },
            { name: `#${tag}`, url: `https://devstash.me/blog/tag/${tag}` },
          ]}
        />

        <div className="mt-6 mb-10">
          <p className="text-ds-muted mb-2 font-mono text-sm">Tag</p>
          <h1 className="text-ds-text mb-3 font-sans text-4xl font-bold tracking-tight">
            <span className="text-ds-muted">#</span>
            {tag}
          </h1>
          <p className="text-ds-muted">
            {posts.length} post{posts.length !== 1 ? 's' : ''}
          </p>
        </div>

        <BlogList posts={posts} emptyMessage={`No posts tagged #${tag} yet.`} />
      </div>
    </>
  )
}
