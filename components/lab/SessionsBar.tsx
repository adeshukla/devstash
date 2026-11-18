'use client'

import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { Button, Input } from '@/components/ui'
import {
  addSession,
  duplicateSession,
  mergeImported,
  parseSessionFile,
  removeSession,
  renameSession,
  toFile,
  updateSession,
  MAX_SESSIONS,
  type Session,
  type SessionData,
} from '@/lib/lab/sessions'
import { saveBlob } from './saveFile'
import { readStored, writeStored } from './storage'
import { trackLab } from './track'

const newId = () => crypto.randomUUID()
const when = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
const sameData = (a: SessionData, b: SessionData) => JSON.stringify(a) === JSON.stringify(b)
const fileSafe = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'session'

interface Draft {
  savedAt: string
  data: SessionData
}

/**
 * "My sessions" for a Lab tool. Two things, both kept only in this browser:
 *  - Your last unsaved work comes back when you return (a draft, saved as you type).
 *  - Named sessions: save, reopen, copy, rename, delete, and move to another browser as a file.
 * The tool passes its current `data` and says how to put saved data back with `onApply`. Leave
 * secrets (passwords) out of `data`: it is written to this browser's storage.
 */
export function SessionsBar({
  tool,
  label,
  data,
  blank,
  draftOmit = [],
  onApply,
  exportCsv,
}: {
  tool: string
  /** Used in file names, e.g. "whatsapp-link". */
  label: string
  data: SessionData
  /** What the tool holds before anything is typed. */
  blank: SessionData
  /** Keys left out of the unsaved-work draft, for data that is kept elsewhere already. */
  draftOmit?: string[]
  /** `source` is "draft" for work brought back on return, "session" for a saved or blank session. */
  onApply: (d: SessionData, source: 'draft' | 'session') => void
  /** Optional: a spreadsheet version of one session's data. */
  exportCsv?: (d: SessionData) => string | null
}) {
  const listKey = `devstash-sessions-${tool}`
  const draftKey = `devstash-draft-${tool}`
  const [sessions, setSessions] = useState<Session[]>([])
  const [current, setCurrent] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [bad, setBad] = useState(false)
  const [restored, setRestored] = useState<string | null>(null)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameTo, setRenameTo] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const ready = useRef(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const forDraft = (d: SessionData): SessionData =>
    Object.fromEntries(Object.entries(d).filter(([k]) => !draftOmit.includes(k)))
  const json = JSON.stringify(forDraft(data))
  const isBlank = json === JSON.stringify(forDraft(blank))
  const currentSession = sessions.find((s) => s.id === current) ?? null
  const dirty = currentSession ? !sameData(currentSession.data, data) : !isBlank

  const restore = useEffectEvent((d: SessionData) => onApply(d, 'draft'))

  // On return: load the saved sessions and bring back the last unsaved work.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-shot mount read of localStorage */
    setSessions(readStored<Session[]>(listKey, []))
    const draft = readStored<Draft | null>(draftKey, null)
    if (
      draft &&
      draft.data &&
      typeof draft.data === 'object' &&
      !sameData(forDraft(draft.data), forDraft(blank))
    ) {
      restore(draft.data)
      setRestored(draft.savedAt)
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    ready.current = true
    // blank is a constant for the tool; this runs once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listKey, draftKey])

  // Keep the draft up to date while typing, and drop it when the tool is back to blank.
  useEffect(() => {
    if (!ready.current) return
    const t = window.setTimeout(() => {
      if (isBlank) writeStored(draftKey, null)
      else writeStored(draftKey, { savedAt: new Date().toISOString(), data: JSON.parse(json) })
    }, 600)
    return () => window.clearTimeout(t)
  }, [json, isBlank, draftKey])

  function commit(next: Session[]) {
    setSessions(next)
    writeStored(listKey, next)
  }

  function say(text: string, isBad = false) {
    setMessage(text)
    setBad(isBad)
  }

  function saveNew() {
    const r = addSession(sessions, name, data, new Date(), newId())
    if (r.error) return say(r.error, true)
    commit(r.list)
    setCurrent(r.id)
    setName('')
    trackLab(tool, 'session_save')
    say(`Saved as “${r.list[0].name}”.`)
  }

  function saveUpdate() {
    if (!currentSession) return
    const r = updateSession(sessions, currentSession.id, data, new Date())
    if (r.error) return say(r.error, true)
    commit(r.list)
    trackLab(tool, 'session_update')
    say(`Updated “${currentSession.name}”.`)
  }

  function openSession(s: Session) {
    if (dirty && !window.confirm('Open this session? Your unsaved changes here will be replaced.'))
      return
    onApply(structuredClone(s.data), 'session')
    setCurrent(s.id)
    setRestored(null)
    trackLab(tool, 'session_open')
    say(`Opened “${s.name}”.`)
  }

  /** `draft`: just empty the tool. `session`: a deliberate new blank session, which may clear a saved list. */
  function startBlank(source: 'draft' | 'session') {
    if (
      source === 'session' &&
      dirty &&
      !window.confirm('Start a blank session? Your unsaved changes here will be lost.')
    )
      return
    onApply(structuredClone(blank), source)
    setCurrent(null)
    setRestored(null)
    writeStored(draftKey, null)
    say('Started a blank session.')
  }

  function copy(s: Session) {
    const r = duplicateSession(sessions, s.id, new Date(), newId())
    if (r.error) return say(r.error, true)
    commit(r.list)
    say(`Copied to “${r.list[0].name}”.`)
  }

  function rename(s: Session) {
    const r = renameSession(sessions, s.id, renameTo, new Date())
    if (r.error) return say(r.error, true)
    commit(r.list)
    setRenaming(null)
    say('Renamed.')
  }

  function remove(s: Session) {
    commit(removeSession(sessions, s.id))
    if (current === s.id) setCurrent(null)
    setConfirmDelete(null)
    trackLab(tool, 'session_delete')
    say(`Deleted “${s.name}”.`)
  }

  async function exportFile(list: Session[], base: string) {
    await saveBlob(
      new Blob([JSON.stringify(toFile(tool, list, new Date()), null, 2)], {
        type: 'application/json',
      }),
      `${label}-${fileSafe(base)}.json`
    )
    trackLab(tool, 'session_export')
    say('File saved. Import it on another browser to continue there.')
  }

  async function exportCsvFile(s: Session) {
    const csv = exportCsv?.(s.data)
    if (!csv) return say('This session has nothing to put in a spreadsheet yet.', true)
    await saveBlob(new Blob([csv], { type: 'text/csv' }), `${label}-${fileSafe(s.name)}.csv`)
    trackLab(tool, 'session_export_csv')
    say('Spreadsheet saved.')
  }

  async function importFile(file: File | undefined) {
    if (!file) return
    if (file.size > 5_000_000) return say('That file is too big.', true)
    const parsed = parseSessionFile(await file.text(), tool)
    if (parsed.error) return say(parsed.error, true)
    const m = mergeImported(sessions, parsed.sessions, newId)
    commit(m.list)
    trackLab(tool, 'session_import')
    say(
      `Added ${m.added} session${m.added === 1 ? '' : 's'}.` +
        (m.skipped ? ` ${m.skipped} left out: the limit is ${MAX_SESSIONS}.` : '')
    )
    if (fileInput.current) fileInput.current.value = ''
  }

  const status = currentSession
    ? dirty
      ? `Working on “${currentSession.name}”. You have changes that are not saved to it.`
      : `Working on “${currentSession.name}”. Saved.`
    : isBlank
      ? 'Start typing. Your work is kept on this device if you close the tab.'
      : 'Your work is kept on this device if you close the tab. Save it under a name to keep it for good.'

  return (
    <section
      aria-label="My sessions"
      data-tour="sessions"
      className="border-ds-border bg-ds-surface mb-5 rounded-xl border"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <p className="text-ds-muted min-w-0 flex-1 text-sm" aria-live="polite">
          <span className="text-ds-text font-medium">My sessions · </span>
          {status}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          aria-expanded={open}
          aria-controls={`sessions-${tool}`}
          onClick={() => setOpen(!open)}
        >
          {open ? 'Close' : `Sessions (${sessions.length})`}
        </Button>
      </div>

      {restored && (
        <p
          role="status"
          className="border-ds-border text-ds-muted flex flex-wrap items-center gap-x-3 gap-y-1 border-t px-4 py-2.5 text-sm"
        >
          <span>Picked up where you left off ({when(restored)}).</span>
          <button
            type="button"
            onClick={() => startBlank('draft')}
            className="text-ds-accent-strong underline underline-offset-2"
          >
            Start fresh
          </button>
        </p>
      )}

      {open && (
        <div id={`sessions-${tool}`} className="border-ds-border border-t px-4 py-4">
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              saveNew()
            }}
          >
            <Input
              className="min-w-[220px] flex-1"
              label="Save this as a new session"
              placeholder="e.g. Diwali sale"
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button type="submit" size="sm" disabled={isBlank}>
              Save as new
            </Button>
            {currentSession && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={saveUpdate}
                disabled={!dirty}
              >
                Update “{currentSession.name}”
              </Button>
            )}
          </form>

          {message && (
            <p
              role="status"
              className={`mt-3 text-sm ${bad ? 'text-ds-error' : 'text-ds-success'}`}
            >
              {message}
            </p>
          )}

          {sessions.length === 0 ? (
            <p className="text-ds-muted mt-4 text-sm">
              No saved sessions yet. Do some work, give it a name and save it. You can start another
              one any time and come back to this.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-[var(--color-ds-border)]">
              {sessions.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                  <div className="min-w-0 flex-1">
                    {renaming === s.id ? (
                      <form
                        className="flex gap-2"
                        onSubmit={(e) => {
                          e.preventDefault()
                          rename(s)
                        }}
                      >
                        <Input
                          aria-label={`New name for ${s.name}`}
                          maxLength={60}
                          value={renameTo}
                          onChange={(e) => setRenameTo(e.target.value)}
                        />
                        <Button type="submit" size="sm">
                          Save
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setRenaming(null)}
                        >
                          Cancel
                        </Button>
                      </form>
                    ) : (
                      <>
                        <p className="text-ds-text truncate text-sm font-medium">
                          {s.name}
                          {s.id === current && (
                            <span className="text-ds-accent-strong ml-2 text-xs font-normal">
                              open
                            </span>
                          )}
                        </p>
                        <p className="text-ds-muted text-xs">Saved {when(s.updatedAt)}</p>
                      </>
                    )}
                  </div>
                  {renaming !== s.id && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <button
                        type="button"
                        aria-label={`Open ${s.name}`}
                        onClick={() => openSession(s)}
                        className="text-ds-accent-strong font-medium hover:underline"
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        aria-label={`Copy ${s.name}`}
                        onClick={() => copy(s)}
                        className="text-ds-muted hover:text-ds-text"
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        aria-label={`Rename ${s.name}`}
                        onClick={() => {
                          setRenaming(s.id)
                          setRenameTo(s.name)
                        }}
                        className="text-ds-muted hover:text-ds-text"
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        aria-label={`Export ${s.name} as a file`}
                        onClick={() => void exportFile([s], s.name)}
                        className="text-ds-muted hover:text-ds-text"
                      >
                        Export
                      </button>
                      {exportCsv && (
                        <button
                          type="button"
                          aria-label={`Export ${s.name} as a spreadsheet`}
                          onClick={() => void exportCsvFile(s)}
                          className="text-ds-muted hover:text-ds-text"
                        >
                          CSV
                        </button>
                      )}
                      {confirmDelete === s.id ? (
                        <button
                          type="button"
                          aria-label={`Confirm delete ${s.name}`}
                          onClick={() => remove(s)}
                          className="text-ds-error font-medium"
                        >
                          Yes, delete
                        </button>
                      ) : (
                        <button
                          type="button"
                          aria-label={`Delete ${s.name}`}
                          onClick={() => setConfirmDelete(s.id)}
                          className="text-ds-muted hover:text-ds-error"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="border-ds-border mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t pt-4 text-sm">
            <button
              type="button"
              onClick={() => startBlank('session')}
              className="text-ds-muted hover:text-ds-text"
            >
              New blank session
            </button>
            <button
              type="button"
              disabled={sessions.length === 0}
              onClick={() => void exportFile(sessions, 'all')}
              className="text-ds-muted hover:text-ds-text disabled:opacity-50"
            >
              Export all
            </button>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="text-ds-muted hover:text-ds-text"
            >
              Import a file
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              aria-label="Import a sessions file"
              onChange={(e) => void importFile(e.target.files?.[0])}
            />
          </div>
          <p className="text-ds-muted mt-3 text-xs leading-relaxed">
            Sessions live only in this browser on this device. They are not uploaded. On a shared
            computer, delete them when you are done, and export a file if you want to keep them
            somewhere else.
          </p>
        </div>
      )}
    </section>
  )
}
