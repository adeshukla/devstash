'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface DeletePostButtonProps {
  slug: string
}

export function DeletePostButton({ slug }: DeletePostButtonProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleDelete() {
    if (!window.confirm(`Delete "${slug}"? This removes the .mdx file.`)) return

    setPending(true)
    try {
      const res = await fetch(`/api/admin/posts?slug=${encodeURIComponent(slug)}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.refresh()
      } else {
        window.alert('Failed to delete post.')
      }
    } catch {
      window.alert('Failed to delete post.')
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="border-ds-border text-ds-error hover:border-ds-error hover:bg-ds-error/10 focus-visible:ring-ds-error focus-visible:ring-offset-ds-bg inline-flex h-9 shrink-0 items-center justify-center rounded-lg border px-4 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
    >
      {pending ? 'Deleting…' : 'Delete'}
    </button>
  )
}
