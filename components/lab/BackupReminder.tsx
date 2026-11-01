'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui'
import type { Workspace } from '@/lib/lab/workspace'
import { downloadWorkspaceFile } from './backupFile'
import { KEYS, readStored } from './storage'
import { trackLab } from './track'

/** Saved links live only in this browser; once there are a few, say so, once. */
export const REMIND_AFTER = 5

export function BackupReminder({ count, build }: { count: number; build: () => Workspace }) {
  const [backedUp, setBackedUp] = useState(true)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot mount read of localStorage
    setBackedUp(Boolean(readStored<number | null>(KEYS.lastBackup, null)))
  }, [])

  if (backedUp || hidden || count < REMIND_AFTER) return null

  async function backUp() {
    trackLab('utm-builder', 'backup_reminder_used')
    await downloadWorkspaceFile(build())
    setBackedUp(true)
  }

  return (
    <div
      role="status"
      className="border-ds-accent/30 bg-ds-accent/10 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
    >
      <p className="text-ds-text text-sm">
        You have {count} saved links, and they live only in this browser. Clearing site data would
        remove them.
      </p>
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={backUp}>
          Back up now
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setHidden(true)}>
          Not now
        </Button>
      </div>
    </div>
  )
}
