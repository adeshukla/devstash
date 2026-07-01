// components/blog/BlogList.tsx
import { type BlogPost } from '@/types/blog'
import { BlogCard } from './BlogCard'
import { Reveal } from '@/components/ui'

interface BlogListProps {
  posts: BlogPost[]
  emptyMessage?: string
}

export function BlogList({ posts, emptyMessage = 'No posts found.' }: BlogListProps) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <span className="text-ds-border2 mb-4 font-mono text-4xl select-none">&gt;_</span>
        <p className="text-ds-muted">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
      {posts.map((post, i) => (
        <Reveal key={post.slug} delay={(i % 6) * 60}>
          <BlogCard post={post} />
        </Reveal>
      ))}
    </div>
  )
}
