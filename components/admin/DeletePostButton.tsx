'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

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
    <Button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      loading={pending}
      variant="danger"
      size="sm"
      className="shrink-0"
    >
      {pending ? 'Deleting…' : 'Delete'}
    </Button>
  )
}
