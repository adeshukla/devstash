// app/(main)/blog/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { type Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypePrettyCode from 'rehype-pretty-code'
import type { PluggableList } from 'unified'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { buildOgImageUrl } from '@/lib/seo/ogImage'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildBlogPostingSchema } from '@/lib/schema/builders'
import { Breadcrumb } from '@/components/layout'
import { Badge, Reveal, MountReveal } from '@/components/ui'
import { CategoryIllustration } from '@/components/illustrations/CategoryIllustration'
import { TOC } from '@/components/blog/TOC'
import { AuthorBio } from '@/components/blog/AuthorBio'
import { RelatedPosts } from '@/components/blog/RelatedPosts'
import { ReadTracker } from '@/components/blog/ReadTracker'
import { ReadingProgress } from '@/components/blog/ReadingProgress'
import { mdxComponents } from '@/components/blog/MDXComponents'
import { getAllPosts, getPostBySlug, getRelatedPosts } from '@/lib/markdown/blog'
import { extractTOC } from '@/lib/utils/toc'
import { formatDate } from '@/lib/automation/utils'

// ─── Static Params ────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }))
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}

  return buildMetadata({
    title: post.title,
    description: post.description,
    canonical: `/blog/${post.slug}`,
    type: 'article',
    ogImage: buildOgImageUrl({
      title: post.title,
      description: post.description,
      type: 'article',
      category: post.category,
      readingTime: post.readingTime,
    }),
    publishedTime: post.createdAt,
    modifiedTime: post.updatedAt,
    authors: [post.author],
    section: post.category,
    tags: post.tags,
  })
}

// ─── MDX Options ──────────────────────────────────────────────────────────────
// Cast to PluggableList (mutable) to satisfy unified's type expectations.
// rehype-pretty-code types are not fully compatible with PluggableList yet.

const remarkPlugins: PluggableList = [remarkGfm]

const rehypePlugins: PluggableList = [
  rehypeSlug,
  [
    rehypePrettyCode,
    {
      theme: { dark: 'github-dark-dimmed', light: 'github-light' },
      defaultLang: 'plaintext',
    },
  ],
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post || post.draft) notFound()

  const toc = extractTOC(post.content)
  const relatedPosts = getRelatedPosts(post.slug)

  return (
    <>
      <JsonLd data={buildBlogPostingSchema(post)} />
      <ReadingProgress />
      <ReadTracker slug={post.slug} />

      <div className="container mx-auto max-w-6xl px-4 py-12">
        <Breadcrumb
          items={[
            { name: 'Blog', url: 'https://devstash.me/blog' },
            { name: post.title, url: `https://devstash.me/blog/${post.slug}` },
          ]}
        />

        {/* ── Hero ── */}
        <header className="mt-6 mb-10">
          <MountReveal>
            <div className="border-ds-border bg-ds-surface2 mb-8 h-56 max-w-3xl overflow-hidden rounded-2xl border sm:h-64">
              <CategoryIllustration category={post.category} kind="blog" seed={post.slug} />
            </div>
          </MountReveal>

          <div className="max-w-3xl">
            <MountReveal delay={80}>
              <div className="mb-4 flex items-center gap-3">
                <Badge variant="blue">{post.category.replace('-', ' ')}</Badge>
                <span className="text-ds-muted text-xs">{post.readingTime} min read</span>
              </div>
            </MountReveal>

            <MountReveal delay={160}>
              <h1 className="text-ds-text mb-4 font-sans text-3xl leading-tight font-bold tracking-tight md:text-4xl">
                {post.title}
              </h1>
            </MountReveal>

            <MountReveal delay={240}>
              <p className="text-ds-muted mb-6 text-lg leading-relaxed">{post.description}</p>
            </MountReveal>

            <MountReveal delay={320}>
              <div className="text-ds-muted flex flex-wrap items-center gap-3 text-sm">
                <span>{post.author}</span>
                <span>·</span>
                <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
                {post.updatedAt !== post.createdAt && (
                  <>
                    <span>·</span>
                    <span>Updated {formatDate(post.updatedAt)}</span>
                  </>
                )}
              </div>
            </MountReveal>

            {post.tags.length > 0 && (
              <MountReveal delay={380}>
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <a
                      key={tag}
                      href={`/blog/tag/${tag}`}
                      className="bg-ds-surface2 text-ds-muted hover:text-ds-accent rounded px-2.5 py-0.5 font-mono text-xs transition-colors"
                    >
                      #{tag}
                    </a>
                  ))}
                </div>
              </MountReveal>
            )}
          </div>
        </header>

        {/* ── Content + TOC layout ── */}
        <div className="lg:grid lg:grid-cols-[1fr_220px] lg:gap-12">
          {/* Article body */}
          <article className="max-w-3xl min-w-0">
            {/* Mobile TOC */}
            {toc.length > 0 && (
              <div className="border-ds-border bg-ds-surface mb-8 rounded-xl border p-5 lg:hidden">
                <TOC items={toc} />
              </div>
            )}

            <MDXRemote
              source={post.content}
              components={mdxComponents}
              options={{ mdxOptions: { remarkPlugins, rehypePlugins } }}
            />

            {/* Author */}
            <Reveal className="border-ds-border mt-12 border-t pt-10">
              <AuthorBio author={post.author} />
            </Reveal>
          </article>

          {/* Desktop TOC sidebar */}
          {toc.length > 0 && (
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <TOC items={toc} />
              </div>
            </aside>
          )}
        </div>

        {/* ── Related Posts ── */}
        {relatedPosts.length > 0 && (
          <Reveal className="border-ds-border mt-16 border-t pt-12">
            <RelatedPosts posts={relatedPosts} />
          </Reveal>
        )}
      </div>
    </>
  )
}
