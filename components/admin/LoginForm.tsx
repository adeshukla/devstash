'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input } from '@/components/ui'

export function LoginForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        router.push('/admin')
        router.refresh()
        return
      }

      const data = (await res.json().catch(() => null)) as { error?: string } | null
      setError(data?.error ?? 'Invalid password.')
      setIsSubmitting(false)
    } catch {
      setError('Invalid password.')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Admin login" className="flex w-full flex-col gap-5">
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="border-ds-error/30 bg-ds-error/10 text-ds-error rounded-lg border px-4 py-3 text-sm"
        >
          {error}
        </div>
      )}

      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={isSubmitting}
        required
        autoFocus
        placeholder="••••••••"
      />

      <Button type="submit" size="lg" loading={isSubmitting} disabled={isSubmitting}>
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  )
}
