'use client'

import { useMemo, useState } from 'react'
import { Input } from '@/components/ui'

interface FieldState {
  url: string
  source: string
  medium: string
  campaign: string
  term: string
  content: string
}

const INITIAL: FieldState = {
  url: '',
  source: '',
  medium: '',
  campaign: '',
  term: '',
  content: '',
}

/**
 * Real, working UTM URL builder — no backend needed, everything happens in
 * the browser. Built from actually tagging 200+ PPC landing pages: source +
 * medium + campaign are the three that always matter, term/content are the
 * ones people forget and then can't tell which ad variant drove a click.
 */
export function UtmBuilder() {
  const [fields, setFields] = useState<FieldState>(INITIAL)
  const [copied, setCopied] = useState(false)
  const [urlError, setUrlError] = useState('')

  function update(key: keyof FieldState, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }))
    if (key === 'url') setUrlError('')
  }

  const result = useMemo(() => {
    if (!fields.url.trim()) return ''
    let base: URL
    try {
      base = new URL(fields.url.trim())
    } catch {
      return ''
    }

    const params = new URLSearchParams(base.search)
    const set = (key: string, value: string) => {
      const trimmed = value.trim()
      if (trimmed) params.set(key, trimmed)
    }
    set('utm_source', fields.source)
    set('utm_medium', fields.medium)
    set('utm_campaign', fields.campaign)
    set('utm_term', fields.term)
    set('utm_content', fields.content)

    base.search = params.toString()
    return base.toString()
  }, [fields])

  async function handleCopy() {
    if (!result) return
    await navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleBuild() {
    if (!fields.url.trim()) {
      setUrlError('Enter the landing page URL first.')
      return
    }
    try {
      new URL(fields.url.trim())
    } catch {
      setUrlError('That URL looks incomplete — include https://')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Landing page URL"
          wrapClass="sm:col-span-2"
          placeholder="https://yoursite.com/landing-page"
          value={fields.url}
          onChange={(e) => update('url', e.target.value)}
          onBlur={handleBuild}
          error={urlError}
        />
        <Input
          label="Source"
          placeholder="google, facebook, newsletter"
          value={fields.source}
          onChange={(e) => update('source', e.target.value)}
        />
        <Input
          label="Medium"
          placeholder="cpc, email, social"
          value={fields.medium}
          onChange={(e) => update('medium', e.target.value)}
        />
        <Input
          label="Campaign"
          placeholder="spring-sale-2026"
          value={fields.campaign}
          onChange={(e) => update('campaign', e.target.value)}
        />
        <Input
          label="Term (optional)"
          placeholder="running+shoes"
          value={fields.term}
          onChange={(e) => update('term', e.target.value)}
        />
        <Input
          label="Content (optional)"
          wrapClass="sm:col-span-2"
          placeholder="blue-cta-variant-b"
          value={fields.content}
          onChange={(e) => update('content', e.target.value)}
        />
      </div>

      <div className="border-ds-border bg-ds-surface2 rounded-xl border p-4">
        <p className="text-ds-muted mb-2 font-mono text-xs tracking-wide uppercase">Tagged URL</p>
        {result ? (
          <p className="text-ds-text font-mono text-sm break-all">{result}</p>
        ) : (
          <p className="text-ds-muted font-mono text-sm">
            Fill in the URL and at least a source to see the tagged link here.
          </p>
        )}
        <button
          type="button"
          onClick={handleCopy}
          disabled={!result}
          className="bg-ds-accent focus-visible:ring-ds-accent mt-4 inline-flex h-10 items-center justify-center rounded-lg px-5 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
        >
          {copied ? 'Copied ✓' : 'Copy link'}
        </button>
      </div>
    </div>
  )
}
