'use client'

import { useEffect, useState } from 'react'
import { readStored, writeStored } from './storage'
import { trackLab } from './track'

interface Preset {
  id: string
  name: string
  /** Pathname plus query: opening it restores the tool's state (see useUrlSync). */
  href: string
}

const MAX_PRESETS = 12

/**
 * "Saved looks" for the tools that already share their state in a link. A look
 * is just a name next to that link, kept in this browser. Opening one reloads
 * the page with the state in the address, which the tool restores on load and
 * then removes from the address bar.
 */
export function PresetBar({ tool, getUrl }: { tool: string; getUrl: () => string }) {
  const key = `devstash-presets-${tool}`
  const [presets, setPresets] = useState<Preset[]>([])
  const [name, setName] = useState('')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot mount read of localStorage
    setPresets(readStored<Preset[]>(key, []).filter((p) => p?.id && p.name && p.href))
  }, [key])

  function save() {
    const label = name.trim().slice(0, 30)
    if (!label) return
    const url = new URL(getUrl())
    const next = [
      { id: crypto.randomUUID(), name: label, href: `${url.pathname}${url.search}` },
      ...presets,
    ].slice(0, MAX_PRESETS)
    setPresets(next)
    writeStored(key, next)
    setName('')
    trackLab(tool, 'save_look')
  }

  function remove(id: string) {
    const next = presets.filter((p) => p.id !== id)
    setPresets(next)
    writeStored(key, next)
  }

  return (
    <div className="border-ds-border mt-4 w-full min-w-0 rounded-xl border p-4">
      <p className="text-ds-text text-sm font-medium">Saved looks</p>
      <p className="text-ds-muted mt-1 text-xs">
        Keep this setup under a name and come back to it. Saved on this device only.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="text-ds-muted flex flex-1 flex-col gap-1 text-xs">
          Name this look
          <input
            value={name}
            maxLength={30}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            placeholder="e.g. Hero blob, dark"
            className="border-ds-border bg-ds-surface2 text-ds-text focus-visible:ring-ds-accent rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
          />
        </label>
        <button
          type="button"
          onClick={save}
          disabled={!name.trim()}
          className="border-ds-border text-ds-text hover:border-ds-accent hover:text-ds-accent rounded-md border px-3 py-2 text-sm transition-colors disabled:opacity-50"
        >
          Save
        </button>
      </div>
      {presets.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5" aria-label="Saved looks">
          {presets.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
              {/* A plain link on purpose: the full load is what restores the saved state. */}
              <a href={p.href} className="text-ds-accent-strong min-w-0 truncate hover:underline">
                {p.name}
              </a>
              <button
                type="button"
                onClick={() => remove(p.id)}
                aria-label={`Remove ${p.name}`}
                className="text-ds-muted hover:text-ds-error shrink-0 text-xs"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
