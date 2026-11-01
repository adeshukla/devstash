'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { parseWorkspace, type Workspace } from '@/lib/lab/workspace'
import { saveBlob } from './saveFile'

export interface RestoreSummary {
  links: number
  channels: number
  merges: number
  rules: boolean
}

/**
 * Everything the UTM tools remember lives in this browser. One file moves it
 * to another browser or a teammate, and restores it after site data is cleared.
 */
export function WorkspaceBackup({
  build,
  onRestore,
}: {
  build: () => Workspace
  onRestore: (data: Workspace) => RestoreSummary
}) {
  const [message, setMessage] = useState('')
  const [bad, setBad] = useState(false)

  async function download() {
    const date = new Date().toLocaleDateString('sv-SE')
    await saveBlob(
      new Blob([JSON.stringify(build(), null, 2)], { type: 'application/json' }),
      `utm-workspace-${date}.json`
    )
    setBad(false)
    setMessage('Backup saved. Keep it somewhere safe; it holds your links, channels and rules.')
  }

  async function restore(file: File | undefined) {
    if (!file) return
    const { data, error } = parseWorkspace(await file.text())
    if (!data) {
      setBad(true)
      setMessage(error)
      return
    }
    const s = onRestore(data)
    const parts = [
      `${s.links} new link${s.links === 1 ? '' : 's'}`,
      `${s.channels} channel${s.channels === 1 ? '' : 's'}`,
      `${s.merges} remembered merge${s.merges === 1 ? '' : 's'}`,
      s.rules && 'team rules',
    ].filter(Boolean)
    setBad(false)
    setMessage(`Restored: ${parts.join(', ')}.`)
  }

  return (
    <details className="border-ds-border rounded-xl border p-4">
      <summary className="text-ds-text cursor-pointer text-sm font-medium">
        Back up or move your workspace
      </summary>
      <div className="mt-3 flex flex-col gap-3">
        <p className="text-ds-muted text-sm">
          Your saved links, channels, team rules and remembered merges live only in this browser.
          Download them as one file to keep a copy, use them in another browser, or give a teammate
          the same setup. Restoring adds to what you already have.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <Button type="button" size="sm" onClick={download}>
            Download backup
          </Button>
          <label className="text-ds-muted max-w-full min-w-0 text-sm">
            Restore from a backup
            <input
              type="file"
              accept=".json,application/json"
              onChange={(e) => {
                restore(e.target.files?.[0])
                e.target.value = ''
              }}
              className="text-ds-muted mt-1 block w-full max-w-full text-xs"
            />
          </label>
        </div>
        {message && (
          <p
            className={bad ? 'text-ds-warning-strong text-sm' : 'text-ds-success text-sm'}
            role={bad ? 'alert' : 'status'}
          >
            {message}
          </p>
        )}
      </div>
    </details>
  )
}
