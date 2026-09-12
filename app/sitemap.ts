import { MetadataRoute } from 'next'
import { getAllPosts, getAllCategories, getIndexableTags } from '@/lib/markdown/blog'
import { getAllProjects } from '@/lib/markdown/projects'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://devstash.me'

/**
 * Newest `updatedAt` among the given posts, as the archive's real lastmod.
 *
 * Every route below used to report `lastModified: new Date()`, i.e. "modified
 * right now" on every single fetch of the sitemap. Google's documented
 * behaviour is to start ignoring `lastmod` entirely once it proves unreliable,
 * which is exactly the wrong outcome on a site whose problem is that new posts
 * sit in "Discovered – currently not indexed". Static pages now omit lastmod
 * rather than assert something false, and every content route derives it from
 * the content itself.
 */
function newestUpdate(posts: { updatedAt: string }[]): Date | undefined {
  const times = posts.map((p) => new Date(p.updatedAt).getTime()).filter((t) => !Number.isNaN(t))
  return times.length ? new Date(Math.max(...times)) : undefined
}

export default function sitemap(): MetadataRoute.Sitemap {
  const allPosts = getAllPosts()
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'weekly', priority: 1.0 },
    {
      url: `${BASE_URL}/about`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/projects`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    { url: `${BASE_URL}/blog`, changeFrequency: 'daily', priority: 0.9 },
    {
      url: `${BASE_URL}/lab`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/resources`,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/tools`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/contact`,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/services`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/uses`,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/feed.xml`,
      changeFrequency: 'daily',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  const blogRoutes: MetadataRoute.Sitemap = allPosts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const projectRoutes: MetadataRoute.Sitemap = getAllProjects().map((project) => ({
    url: `${BASE_URL}/projects/${project.slug}`,
    lastModified: new Date(project.endDate ?? project.startDate),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  // Category/tag archives are real, indexable, internally-linked pages
  // (app/(main)/blog/category/[category], app/(main)/blog/tag/[tag]) that
  // were never listed here — crawlers could still reach them via on-page
  // links, but leaving them out of the sitemap is a discovery gap for no
  // reason, since both listings are already computed for the blog list page.
  const categoryRoutes: MetadataRoute.Sitemap = getAllCategories().map(({ category }) => ({
    url: `${BASE_URL}/blog/category/${category}`,
    lastModified: newestUpdate(allPosts.filter((p) => p.category === category)),
    changeFrequency: 'weekly',
    priority: 0.5,
  }))

  // Only tags with enough posts to be a real archive (see
  // MIN_POSTS_FOR_INDEXABLE_TAG). A single-post tag page duplicates the post
  // it links to; those pages stay live and crawlable but are marked
  // noindex,follow and left out of the sitemap rather than padding it with
  // thin URLs that compete with the posts themselves.
  const tagRoutes: MetadataRoute.Sitemap = getIndexableTags().map(({ tag }) => ({
    url: `${BASE_URL}/blog/tag/${tag}`,
    lastModified: newestUpdate(allPosts.filter((p) => p.tags.includes(tag))),
    changeFrequency: 'weekly',
    priority: 0.4,
  }))

  // The 5 /lab/* pages that are real, working tools (not landing-page
  // samples) — noIndex was removed from these; the other 3 lab pages stay
  // deliberately un-indexed and un-listed here (fictional-product demos,
  // not something worth surfacing in search).
  const labToolRoutes: MetadataRoute.Sitemap = [
    'utm-builder',
    'css-shapes-playground',
    'meta-tag-generator',
    'illustration-generator',
    'ai-content-pipeline',
  ].map((slug) => ({
    url: `${BASE_URL}/lab/${slug}`,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [
    ...staticRoutes,
    ...blogRoutes,
    ...projectRoutes,
    ...categoryRoutes,
    ...tagRoutes,
    ...labToolRoutes,
  ]
}
