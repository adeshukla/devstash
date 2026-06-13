import { notFound, redirect } from 'next/navigation'
import { isAdminEnabled } from '@/lib/auth/adminEnabled'
import { getSession } from '@/lib/auth/session'
import { LoginForm } from '@/components/admin/LoginForm'

export default async function AdminLoginPage() {
  if (!isAdminEnabled()) notFound()

  const session = await getSession()
  if (session.isAdmin) redirect('/admin')

  return (
    <div className="flex min-h-[70vh] w-full items-center justify-center px-4">
      <div className="bg-ds-surface border-ds-border w-full max-w-sm rounded-xl border p-8 shadow-lg">
        <div className="mb-6 flex flex-col gap-1.5 text-center">
          <h1 className="text-ds-text text-xl font-semibold">Admin sign in</h1>
          <p className="text-ds-muted text-sm">Enter the password to manage blog posts.</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
