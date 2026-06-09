// components/blog/RelatedPosts.tsx
import { type BlogPost } from '@/types/blog'
import { BlogCard } from './BlogCard'

interface RelatedPostsProps {
  posts: BlogPost[]
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (posts.length === 0) return null

  return (
    <section>
      <h2 className="text-ds-text mb-6 font-sans text-xl font-semibold">Related Posts</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  )
}
