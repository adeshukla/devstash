'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { copyText } from '@/lib/utils/clipboard'
import { ChannelNote } from './ChannelNote'
import { makeQr, qrSvg } from '@/lib/lab/qr'
import { buildPackHtml, type PackItem } from '@/lib/lab/campaignPack'
import { saveBlob } from './saveFile'
import { trackLab } from './track'
import { printQrSheet, type PrintItem } from './qrPrint'
import { ruleIssues, rulesActive, rulesVersion, type UtmRules } from '@/lib/lab/utmRules'
import { ga4Channel, tokensIn, lintRows, toCsv, toTsv, type SheetRow } from '@/lib/lab/utm'

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

const action =
  'text-ds-muted hover:text-ds-accent font-mono text-xs transition-colors focus-visible:ring-ds-accent rounded focus-visible:ring-2 focus-visible:outline-none'

/** The saved list: review, fix, export. Everything here is optional for a single link. */
export function UtmSheet({
  rows,
  rules,
  owner,
  onRemove,
  onEdit,
  onQr,
  onClear,
}: {
  rows: SheetRow[]
  rules: UtmRules
  owner: string
  onRemove: (id: string) => void
  onEdit: (row: SheetRow) => void
  onQr: (url: string) => void
  onClear: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [copiedRow, setCopiedRow] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [printNote, setPrintNote] = useState('')
  const issues = [...lintRows(rows), ...ruleIssues(rows, rules)]

  async function copyForSheets() {
    if (!(await copyText(toTsv(rows)))) return
    trackLab('utm-builder', 'copy_for_sheets')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function downloadPack() {
    trackLab('utm-builder', 'download_pack')
    const items: PackItem[] = []
    for (const row of rows) {
      let svg = ''
      if (!tokensIn(row.url).length) {
        try {
          svg = qrSvg(await makeQr(row.url, 'M'), { fg: '#000000', bg: '#ffffff', label: '' })
        } catch {
          // too long for a QR code: the pack lists the link without one
        }
      }
      items.push({
        url: row.url,
        source: row.fields.source,
        medium: row.fields.medium,
        campaign: row.fields.campaign,
        channel: ga4Channel(row.fields.source, row.fields.medium),
        svg,
      })
    }
    const names = [...new Set(rows.map((r) => r.fields.campaign).filter(Boolean))]
    const html = buildPackHtml({
      title: names.length
        ? `Campaign pack: ${names.slice(0, 3).join(', ')}${names.length > 3 ? '…' : ''}`
        : 'Campaign pack',
      owner: owner.trim(),
      date: new Date().toLocaleDateString('sv-SE'),
      rules: rulesActive(rules) ? rulesVersion(rules) : '',
      issues,
      items,
    })
    await saveBlob(new Blob([html], { type: 'text/html' }), 'campaign-pack.html')
  }

  async function printSheet() {
    trackLab('utm-builder', 'print_qr_sheet')
    const items: PrintItem[] = []
    for (const row of rows) {
      if (tokensIn(row.url).length) continue
      try {
        const qr = await makeQr(row.url, 'M')
        items.push({
          qr,
          style: { fg: '#000000', bg: '#ffffff', label: '' },
          caption: [row.fields.source, row.fields.medium, row.fields.campaign]
            .filter(Boolean)
            .join(' / '),
          url: row.url,
        })
      } catch {
        // too long for a QR code: skipped and counted below
      }
    }
    const skipped = rows.length - items.length
    setPrintNote(
      skipped
        ? `${skipped} link${skipped === 1 ? '' : 's'} left out (placeholders or too long for a QR code).`
        : ''
    )
    printQrSheet(items)
  }

  async function copyRow(row: SheetRow) {
    if (!(await copyText(row.url))) return
    setCopiedRow(row.id)
    setTimeout(() => setCopiedRow(null), 2000)
  }

  return (
    <section aria-label="Saved links" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-ds-text text-lg font-semibold">
          Saved links <span className="text-ds-muted font-mono text-sm">({rows.length})</span>
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={copyForSheets}>
            <span aria-live="polite">{copied ? 'Copied ✓' : 'Copy for Google Sheets'}</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              trackLab('utm-builder', 'download_csv')
              downloadCsv(rows)
            }}
          >
            Download CSV
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={downloadPack}>
            Download campaign pack
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={printSheet}>
            Print QR sheet
          </Button>
          {confirmClear ? (
            <Button
              type="button"
              size="sm"
              variant="danger"
              onClick={() => {
                onClear()
                setConfirmClear(false)
              }}
            >
              Yes, delete all
            </Button>
          ) : (
            <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmClear(true)}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {printNote && (
        <p className="text-ds-muted text-sm" role="status">
          {printNote}
        </p>
      )}

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
          <li key={row.id} className="border-ds-border bg-ds-surface2 rounded-lg border p-3">
            <p className="text-ds-text font-mono text-xs break-all">
              <span className="text-ds-muted mr-2">{i + 1}</span>
              {row.url}
            </p>
            <ChannelNote source={row.fields.source} medium={row.fields.medium} />
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              <button
                type="button"
                onClick={() => copyRow(row)}
                aria-label={`Copy row ${i + 1}`}
                className={action}
              >
                {copiedRow === row.id ? 'Copied ✓' : 'Copy'}
              </button>
              {!tokensIn(row.url).length && (
                <button
                  type="button"
                  onClick={() => onQr(row.url)}
                  aria-label={`QR code for row ${i + 1}`}
                  className={action}
                >
                  QR code
                </button>
              )}
              <button
                type="button"
                onClick={() => onEdit(row)}
                aria-label={`Edit row ${i + 1}: moves it back into the form`}
                className={action}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onRemove(row.id)}
                aria-label={`Remove row ${i + 1}`}
                className="text-ds-muted hover:text-ds-error font-mono text-xs transition-colors"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
