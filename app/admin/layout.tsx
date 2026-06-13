import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isAdminEnabled } from '@/lib/auth/adminEnabled'
import { LogoutButton } from '@/components/admin/LogoutButton'

// Admin is never indexed, regardless of environment.
export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
}

// This layout wraps ALL /admin routes — including /admin/login — so it must NOT
// perform any auth redirect (login has to stay reachable). Auth gating lives in
// the individual protected pages.
export default function AdminLayout({ children }: { children: ReactNode }) {
  if (!isAdminEnabled()) notFound()

  return (
    <div className="bg-ds-bg text-ds-text min-h-screen">
      <header className="border-ds-border bg-ds-surface border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-ds-text text-base font-bold tracking-tight">DevStash</span>
            <span className="text-ds-accent font-mono text-sm">/admin</span>
          </Link>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  )
}
