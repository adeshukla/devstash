'use client'

import { useState } from 'react'
import { META_PLACEHOLDERS, type AdPlaceholder, type UtmKey } from '@/lib/lab/utm'

const TARGETS: { key: Extract<UtmKey, 'campaign' | 'term' | 'content'>; label: string }[] = [
  { key: 'term', label: 'Keyword' },
  { key: 'content', label: 'Ad version' },
  { key: 'campaign', label: 'Campaign name' },
]

/**
 * Ad platforms fill in a placeholder such as {keyword} for every click, so one
 * tagged link covers thousands of ads. Only shown when a channel with known
 * placeholders is chosen.
 */
export function AdValues({
  sets,
  onInsert,
}: {
  sets: { name: string; items: AdPlaceholder[] }[]
  onInsert: (key: 'campaign' | 'term' | 'content', token: string) => void
}) {
  const [target, setTarget] = useState<(typeof TARGETS)[number]['key']>('term')
  if (!sets.length) return null
  return (
    <div className="border-ds-border rounded-lg border p-3 sm:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-ds-text text-sm font-medium">Let the ad platform fill it in</p>
        <label className="text-ds-muted flex items-center gap-2 text-xs">
          Add to
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value as typeof target)}
            className="border-ds-border bg-ds-surface2 text-ds-text rounded-md border px-2 py-1 text-xs"
          >
            {TARGETS.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {sets.map((set) => (
        <div key={set.name} className="mt-2">
          <p className="text-ds-muted text-xs">{set.name}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {set.items.map((p) => (
              <button
                key={p.token}
                type="button"
                onClick={() => onInsert(target, p.token)}
                className="border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent rounded-md border px-2.5 py-1 text-xs transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
          {set.items === META_PLACEHOLDERS && (
            <p className="text-ds-muted mt-1 text-xs">
              Meta fills in names when the ad is published; renaming later does not change them.
            </p>
          )}
        </div>
      ))}
      <p className="text-ds-muted mt-2 text-xs">
        These links only work once pasted into the ad platform.
      </p>
    </div>
  )
}
