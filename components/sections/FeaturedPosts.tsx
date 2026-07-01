import Link from 'next/link'
import Image from 'next/image'
import { Card, Badge, Button, Reveal, CardTilt } from '@/components/ui'
import { CategoryIllustration } from '@/components/illustrations/CategoryIllustration'
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
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-ds-text text-3xl font-bold">Latest Writing</h2>
            <p className="text-ds-muted mt-1">
              Thoughts on frontend, automation, and developer tooling
            </p>
          </div>
          <Button
            href="/blog"
            variant="ghost"
            size="sm"
            className="flex-shrink-0 self-start p-3 sm:self-auto"
          >
            All posts →
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          {posts.slice(0, 4).map((post, i) => (
            <Reveal key={post.slug} delay={i * 60}>
              <CardTilt>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group focus-visible:ring-ds-accent focus-visible:ring-offset-ds-bg block rounded-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <Card variant="hover" className="flex h-full flex-col" padding="none">
                    <div className="relative h-56 w-full overflow-hidden">
                      {post.featuredImage ? (
                        <Image
                          src={post.featuredImage}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw"
                        />
                      ) : (
                        <div className="h-full w-full transition-transform duration-300 group-hover:scale-105">
                          <CategoryIllustration
                            category={post.category}
                            kind="blog"
                            seed={post.slug}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-6">
                      {/* Category + read time */}
                      <div className="flex items-center gap-2">
                        <Badge variant="blue">{post.category}</Badge>
                        <span className="text-ds-muted font-mono text-xs">
                          {post.readingTime} min read
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-ds-text group-hover:text-ds-accent line-clamp-2 text-xl font-semibold transition-colors">
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
              </CardTilt>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
