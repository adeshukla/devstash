// components/blog/BlogCard.tsx
import Link from 'next/link'
import Image from 'next/image'
import { type BlogPost } from '@/types/blog'
import { Badge } from '@/components/ui'
import { cn } from '@/lib/utils/cn'

interface BlogCardProps {
  post: BlogPost
  featured?: boolean
  className?: string
}

const CATEGORY_COLORS: Record<string, 'blue' | 'purple' | 'green' | 'warn' | 'default' | 'muted'> =
  {
    automation: 'green',
    frontend: 'blue',
    performance: 'warn',
    'ai-workflows': 'purple',
    devtools: 'muted',
    tutorials: 'default',
    career: 'muted',
  }

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function BlogCard({ post, featured = false, className }: BlogCardProps) {
  const badgeVariant = CATEGORY_COLORS[post.category] ?? 'default'

  return (
    <article
      className={cn(
        'group border-ds-border bg-ds-surface flex flex-col overflow-hidden rounded-xl border',
        'hover:border-ds-border2 transition-all duration-200 hover:shadow-lg hover:shadow-black/20',
        featured && 'md:flex-row',
        className
      )}
    >
      {/* Featured Image */}
      <Link
        href={`/blog/${post.slug}`}
        aria-hidden="true"
        tabIndex={-1}
        className={cn(
          'relative block shrink-0 overflow-hidden',
          featured ? 'h-48 md:h-auto md:w-72' : 'h-48'
        )}
      >
        {post.featuredImage ? (
          <Image
            src={post.featuredImage}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes={
              featured ? '(min-width: 768px) 288px, 100vw' : '(min-width: 1024px) 384px, 100vw'
            }
          />
        ) : (
          <div
            className={cn(
              'h-full w-full',
              'bg-gradient-to-br',
              post.category === 'automation' && 'from-ds-success/20 to-ds-surface2',
              post.category === 'frontend' && 'from-ds-accent/20 to-ds-surface2',
              post.category === 'performance' && 'from-ds-warning/20 to-ds-surface2',
              post.category === 'ai-workflows' && 'from-ds-purple/20 to-ds-surface2',
              post.category === 'devtools' && 'from-ds-border2/60 to-ds-surface2',
              post.category === 'tutorials' && 'from-ds-accent/10 to-ds-surface2',
              post.category === 'career' && 'from-ds-purple/10 to-ds-surface2'
            )}
          >
            <div className="flex h-full items-center justify-center">
              <span className="text-ds-border2 font-mono text-3xl select-none">&gt;_</span>
            </div>
          </div>
        )}
        {post.featured && (
          <span className="bg-ds-accent absolute top-3 left-3 rounded-md px-2 py-0.5 text-xs font-semibold text-white">
            Featured
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        {/* Category + read time */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <Badge variant={badgeVariant}>{post.category.replace('-', ' ')}</Badge>
          <span className="text-ds-muted text-xs">{post.readingTime} min read</span>
        </div>

        {/* Title */}
        <Link href={`/blog/${post.slug}`} className="group/title">
          <h2 className="text-ds-text group-hover/title:text-ds-accent mb-2 line-clamp-2 font-sans text-lg leading-snug font-semibold transition-colors">
            {post.title}
          </h2>
        </Link>

        {/* Description */}
        <p className="text-ds-muted mb-4 line-clamp-2 flex-1 text-sm leading-relaxed">
          {post.description}
        </p>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag}
                href={`/blog/tag/${tag}`}
                className="bg-ds-surface2 text-ds-muted hover:text-ds-accent rounded px-2 py-0.5 font-mono text-xs transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Meta footer */}
        <div className="border-ds-border text-ds-muted flex items-center gap-2 border-t pt-4 text-xs">
          <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
          <span>·</span>
          <span>{post.author}</span>
        </div>
      </div>
    </article>
  )
}
