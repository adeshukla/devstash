import type { Workspace } from '@/lib/lab/workspace'
import { saveBlob } from './saveFile'
import { KEYS, writeStored } from './storage'

/** Saves the workspace as one file and remembers that a backup was made. */
export async function downloadWorkspaceFile(workspace: Workspace) {
  const date = new Date().toLocaleDateString('sv-SE')
  await saveBlob(
    new Blob([JSON.stringify(workspace, null, 2)], { type: 'application/json' }),
    `utm-workspace-${date}.json`
  )
  writeStored(KEYS.lastBackup, Date.now())
}
