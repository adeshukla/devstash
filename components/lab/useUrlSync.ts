'use client'

import { useEffect } from 'react'
import { buildSearch } from '@/lib/lab/urlState'

/**
 * Shareable state for a Lab tool, without touching the address bar while the
 * visitor types. On mount, `apply` gets a reader for the query string so the
 * tool can restore a shared link, and the query is then stripped from the URL.
 * The returned function builds the share URL from the tool's current `values`
 * (strings; '' means "default, leave out") and is called only when the
 * visitor presses "Copy share link".
 *
 * Why not mirror state into the URL continuously: analytics records the page
 * URL, so every typed title, URL or campaign name would be sent along with it,
 * and short keys like `s` or `q` are read by GA4 as site-search terms.
 */
export function useUrlSync(
  values: Record<string, string>,
  apply: (get: (key: string) => string | null) => void
): () => string {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (![...params.keys()].length) return
    apply((key) => params.get(key))
    try {
      window.history.replaceState(null, '', window.location.pathname)
    } catch {
      // history can be blocked in sandboxed frames; the link just stays as is
    }
    // apply is a mount-only restore; it is intentionally not a dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return () => `${window.location.origin}${window.location.pathname}${buildSearch(values)}`
}
