'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui'
import { MAX_IMPORT_ROWS, parseSheet, type SheetRow } from '@/lib/lab/utm'

/**
 * Bring an existing sheet in: paste cells copied from Google Sheets / Excel, or
 * choose a CSV file. Rows are cleaned and added to the saved list, where the
 * naming checks run across all of them. The file is read in the browser only.
 */
export function UtmImport({ onAdd }: { onAdd: (rows: Omit<SheetRow, 'id'>[]) => void }) {
  const [text, setText] = useState('')
  const [added, setAdded] = useState(0)
  const result = useMemo(() => (text.trim() ? parseSheet(text) : null), [text])

  async function pickFile(file: File | undefined) {
    if (!file) return
    setAdded(0)
    setText(await file.text())
  }

  function add() {
    if (!result?.rows.length) return
    onAdd(result.rows)
    setAdded(result.rows.length)
    setText('')
  }

  return (
    <details className="border-ds-border rounded-xl border p-4">
      <summary className="text-ds-text cursor-pointer text-sm font-medium">
        Already have a sheet of links? Import it
      </summary>
      <div className="mt-3 flex flex-col gap-3">
        <p className="text-ds-muted text-sm">
          Paste rows from Google Sheets or Excel, or choose a CSV file. Columns: link, source,
          medium, campaign, term, content (a header row is optional). We tidy the names and check
          them together.
        </p>
        <label className="text-ds-text text-sm font-medium" htmlFor="utm-import">
          Pasted rows
        </label>
        <textarea
          id="utm-import"
          rows={5}
          value={text}
          onChange={(e) => {
            setAdded(0)
            setText(e.target.value)
          }}
          placeholder={
            'url\tsource\tmedium\tcampaign\nhttps://example.com\tGoogle\tcpc\tSpring Sale'
          }
          className="border-ds-border bg-ds-surface2 text-ds-text focus-visible:ring-ds-accent w-full rounded-lg border p-3 font-mono text-xs focus-visible:ring-2 focus-visible:outline-none"
        />
        <label className="text-ds-muted text-sm">
          Or choose a file{' '}
          <input
            type="file"
            accept=".csv,.tsv,.txt,text/csv,text/plain"
            onChange={(e) => pickFile(e.target.files?.[0])}
            className="text-ds-muted mt-1 block w-full text-xs"
          />
        </label>

        {result && (
          <div className="flex flex-col gap-1 text-sm" aria-live="polite">
            <p className="text-ds-text">
              {result.rows.length} link{result.rows.length === 1 ? '' : 's'} ready
              {result.fixed > 0 && `, ${result.fixed} with names tidied`}.
            </p>
            {result.truncated && (
              <p className="text-ds-warning-strong">
                Only the first {MAX_IMPORT_ROWS} rows are used.
              </p>
            )}
            {result.errors.slice(0, 5).map((e) => (
              <p key={e.line} className="text-ds-warning-strong" role="alert">
                Line {e.line}: {e.message}
              </p>
            ))}
            {result.errors.length > 5 && (
              <p className="text-ds-muted">…and {result.errors.length - 5} more lines skipped.</p>
            )}
          </div>
        )}
        {added > 0 && (
          <p className="text-ds-success text-sm" aria-live="polite">
            Added {added} to your saved list below.
          </p>
        )}
        <div>
          <Button type="button" size="sm" onClick={add} disabled={!result?.rows.length}>
            {result?.rows.length ? `Add ${result.rows.length} to saved list` : 'Add to saved list'}
          </Button>
        </div>
      </div>
    </details>
  )
}
