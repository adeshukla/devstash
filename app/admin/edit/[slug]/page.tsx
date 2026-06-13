import { notFound, redirect } from 'next/navigation'
import { isAdminEnabled } from '@/lib/auth/adminEnabled'
import { getSession } from '@/lib/auth/session'
import { getPostBySlug } from '@/lib/markdown/blog'
import { PostEditor, type PostFormValues } from '@/components/admin/PostEditor'

interface EditPostPageProps {
  params: Promise<{ slug: string }>
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  if (!isAdminEnabled()) notFound()

  const session = await getSession()
  if (!session.isAdmin) redirect('/admin/login')

  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const initial: PostFormValues = {
    title: post.title,
    slug: post.slug,
    description: post.description,
    category: post.category,
    tags: post.tags,
    featuredImage: post.featuredImage,
    readingTime: post.readingTime,
    draft: post.draft,
    featured: post.featured,
    body: post.content,
    createdAt: post.createdAt,
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-ds-text text-2xl font-semibold">Edit post</h1>
        <p className="text-ds-muted text-sm">
          Editing <code className="font-mono">{post.slug}.mdx</code>
        </p>
      </header>

      <PostEditor mode="edit" initial={initial} />
    </div>
  )
}
