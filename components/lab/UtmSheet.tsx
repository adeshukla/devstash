'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { copyText } from '@/lib/utils/clipboard'
import { lintRows, toCsv, toTsv, type SheetRow } from '@/lib/lab/utm'

function downloadCsv(rows: SheetRow[]) {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'utm-campaign-sheet.csv'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(a.href)
}

export function UtmSheet({
  rows,
  onRemove,
  onClear,
}: {
  rows: SheetRow[]
  onRemove: (id: string) => void
  onClear: () => void
}) {
  const [copied, setCopied] = useState(false)
  const issues = lintRows(rows)

  async function copyForSheets() {
    if (!(await copyText(toTsv(rows)))) return
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-ds-text text-lg font-semibold">
          Campaign sheet <span className="text-ds-muted font-mono text-sm">({rows.length})</span>
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={copyForSheets}>
            <span aria-live="polite">{copied ? 'Copied ✓' : 'Copy for Sheets'}</span>
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => downloadCsv(rows)}>
            Download CSV
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onClear}>
            Clear
          </Button>
        </div>
      </div>

      {issues.length > 0 && (
        <ul
          className="border-ds-warning/40 bg-ds-warning/10 text-ds-text flex flex-col gap-1 rounded-lg border p-3 text-sm"
          aria-label="Naming issues"
        >
          {issues.map((msg) => (
            <li key={msg}>{msg}</li>
          ))}
        </ul>
      )}

      <ul className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <li
            key={row.id}
            className="border-ds-border bg-ds-surface2 flex items-start gap-3 rounded-lg border p-3"
          >
            <span className="text-ds-muted font-mono text-xs">{i + 1}</span>
            <p className="text-ds-text min-w-0 flex-1 font-mono text-xs break-all">{row.url}</p>
            <button
              type="button"
              onClick={() => onRemove(row.id)}
              aria-label={`Remove row ${i + 1}`}
              className="text-ds-muted hover:text-ds-error shrink-0 font-mono text-xs transition-colors"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
