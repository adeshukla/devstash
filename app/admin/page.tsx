import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { isAdminEnabled } from '@/lib/auth/adminEnabled'
import { getSession } from '@/lib/auth/session'
import { getAllPosts } from '@/lib/markdown/blog'
import { Badge } from '@/components/ui'
import { DeletePostButton } from '@/components/admin/DeletePostButton'

export default async function AdminDashboardPage() {
  if (!isAdminEnabled()) notFound()

  const session = await getSession()
  if (!session.isAdmin) redirect('/admin/login')

  const posts = getAllPosts(true)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-ds-text text-2xl font-bold tracking-tight">Posts</h1>
          <p className="text-ds-muted mt-1 text-sm">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'} (including drafts)
          </p>
        </div>
        <Link
          href="/admin/new"
          className="bg-ds-accent focus-visible:ring-ds-accent focus-visible:ring-offset-ds-bg inline-flex h-10 items-center justify-center rounded-lg px-5 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          New post
        </Link>
      </div>

      <p className="text-ds-muted -mt-4 text-xs">
        Need the format or the AI prompt? See{' '}
        <code className="font-mono">docs/blog-authoring-guide.md</code>.
      </p>

      {posts.length === 0 ? (
        <p className="text-ds-muted border-ds-border rounded-lg border border-dashed px-6 py-12 text-center text-sm">
          No posts yet. Create your first post to get started.
        </p>
      ) : (
        <ul className="border-ds-border divide-ds-border divide-y overflow-hidden rounded-lg border">
          {posts.map((post) => (
            <li
              key={post.slug}
              className="bg-ds-surface hover:bg-ds-surface2 flex flex-wrap items-center justify-between gap-4 px-5 py-4 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <h2 className="text-ds-text truncate font-medium">{post.title}</h2>
                  {post.draft ? (
                    <Badge variant="warn" size="sm">
                      Draft
                    </Badge>
                  ) : (
                    <Badge variant="green" size="sm">
                      Published
                    </Badge>
                  )}
                </div>
                <p className="text-ds-muted mt-1 truncate font-mono text-xs">{post.slug}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={`/admin/edit/${post.slug}`}
                  className="border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent focus-visible:ring-ds-accent focus-visible:ring-offset-ds-bg inline-flex h-9 shrink-0 items-center justify-center rounded-lg border px-4 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  Edit
                </Link>
                <DeletePostButton slug={post.slug} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
