import { notFound, redirect } from 'next/navigation'
import { isAdminEnabled } from '@/lib/auth/adminEnabled'
import { getSession } from '@/lib/auth/session'
import { PostEditor, type PostFormValues } from '@/components/admin/PostEditor'

const EMPTY_POST: PostFormValues = {
  title: '',
  slug: '',
  description: '',
  category: 'tutorials',
  tags: [],
  featuredImage: '',
  readingTime: undefined,
  draft: true,
  featured: false,
  body: '',
}

export default async function NewPostPage() {
  if (!isAdminEnabled()) notFound()

  const session = await getSession()
  if (!session.isAdmin) redirect('/admin/login')

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-ds-text text-2xl font-semibold">New post</h1>
        <p className="text-ds-muted text-sm">
          Create a new MDX post in <code className="font-mono">content/blogs/</code>.
        </p>
      </header>

      <PostEditor mode="create" initial={EMPTY_POST} />
    </div>
  )
}
