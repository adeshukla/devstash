import Link from 'next/link'
import { Card, Badge, Button } from '@/components/ui'
import type { BlogPost } from '@/types/blog'

interface FeaturedPostsProps {
  posts: BlogPost[]
}

// Server Component
export function FeaturedPosts({ posts }: FeaturedPostsProps) {
  if (posts.length === 0) return null

  return (
    <section className="border-ds-border border-t py-16">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-ds-text text-3xl font-bold">Latest Writing</h2>
            <p className="text-ds-muted mt-1">
              Thoughts on frontend, automation, and developer tooling
            </p>
          </div>
          <Button href="/blog" variant="ghost" size="sm">
            All posts →
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.slice(0, 3).map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group focus-visible:ring-ds-accent focus-visible:ring-offset-ds-bg block rounded-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <Card variant="hover" className="flex h-full flex-col">
                <div className="flex flex-1 flex-col gap-3 p-5">
                  {/* Category + read time */}
                  <div className="flex items-center gap-2">
                    <Badge variant="blue">{post.category}</Badge>
                    <span className="text-ds-muted font-mono text-xs">
                      {post.readingTime} min read
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-ds-text group-hover:text-ds-accent line-clamp-2 font-semibold transition-colors">
                    {post.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-ds-muted line-clamp-3 text-sm">{post.description}</p>

                  {/* Date */}
                  <time
                    dateTime={post.createdAt}
                    className="text-ds-muted mt-auto font-mono text-xs"
                  >
                    {new Date(post.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </time>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
