'use client'

import { useEffect, useMemo, useState } from 'react'
import { Input, Button } from '@/components/ui'
import { copyText } from '@/lib/utils/clipboard'
import { buildUtmUrl, PRESETS, UTM_KEYS, type SheetRow, type UtmFields } from '@/lib/lab/utm'
import { useUrlSync } from './useUrlSync'
import { ShareLinkButton } from './ShareLinkButton'
import { UtmSheet } from './UtmSheet'

const INITIAL: UtmFields = { url: '', source: '', medium: '', campaign: '', term: '', content: '' }
const SHEET_KEY = 'devstash-utm-sheet'
// Short URL keys keep shared links readable.
const URL_KEYS = {
  url: 'u',
  source: 'src',
  medium: 'm',
  campaign: 'c',
  term: 't',
  content: 'n',
} as const

function loadSheet(): SheetRow[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(SHEET_KEY) ?? '[]')
    return Array.isArray(parsed) ? (parsed as SheetRow[]).filter((r) => r?.id && r?.url) : []
  } catch {
    return []
  }
}

function saveSheet(rows: SheetRow[]) {
  try {
    window.localStorage.setItem(SHEET_KEY, JSON.stringify(rows))
  } catch {
    // storage blocked: the sheet still works for this visit
  }
}

/**
 * UTM builder. Values are normalised (lowercase, hyphens) because GA4 treats
 * "CPC" and "cpc" as different mediums. Links can be added to a sheet that is
 * checked for naming problems and exported; the sheet stays in this browser
 * (localStorage), and the form state lives in the URL so a link can be shared.
 */
export function UtmBuilder() {
  const [fields, setFields] = useState<UtmFields>(INITIAL)
  const [rows, setRows] = useState<SheetRow[]>([])
  const [copied, setCopied] = useState(false)
  const [touchedUrl, setTouchedUrl] = useState(false)

  const getShareUrl = useUrlSync(
    Object.fromEntries(
      (Object.keys(URL_KEYS) as (keyof UtmFields)[]).map((k) => [URL_KEYS[k], fields[k]])
    ),
    (get) =>
      setFields({
        url: get('u') ?? '',
        source: get('src') ?? '',
        medium: get('m') ?? '',
        campaign: get('c') ?? '',
        term: get('t') ?? '',
        content: get('n') ?? '',
      })
  )

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot mount read of localStorage
    setRows(loadSheet())
  }, [])

  const update = (key: keyof UtmFields, value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }))

  const built = useMemo(() => buildUtmUrl(fields), [fields])
  const hasUtm = UTM_KEYS.some((k) => fields[k].trim())
  const ready = Boolean(built.url) && hasUtm
  // Show URL errors only after the field has been left, not while typing.
  const urlError = touchedUrl ? built.error : ''
  const missingRequired =
    ready && !(fields.source.trim() && fields.medium.trim() && fields.campaign.trim())

  async function handleCopy() {
    if (!ready || !(await copyText(built.url))) return
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function updateRows(next: SheetRow[]) {
    setRows(next)
    saveSheet(next)
  }

  function addToSheet() {
    if (!ready) return
    updateRows([...rows, { id: crypto.randomUUID(), fields, url: built.url }])
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Input
          label="Landing page URL"
          placeholder="https://yoursite.com/landing-page"
          value={fields.url}
          onChange={(e) => update('url', e.target.value)}
          onBlur={() => setTouchedUrl(true)}
          error={urlError}
        />
      </div>

      <div>
        <p className="text-ds-muted mb-2 font-mono text-xs tracking-wide uppercase">
          Channel preset
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => {
            const active = fields.source === p.source && fields.medium === p.medium
            return (
              <button
                key={p.label}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  setFields((prev) => ({ ...prev, source: p.source, medium: p.medium }))
                }
                className={
                  active
                    ? 'bg-ds-cta rounded-lg px-3 py-1.5 text-sm font-medium text-white'
                    : 'border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent rounded-lg border px-3 py-1.5 text-sm transition-colors'
                }
              >
                {p.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Source"
          placeholder="google, facebook, newsletter"
          value={fields.source}
          onChange={(e) => update('source', e.target.value)}
        />
        <Input
          label="Medium"
          placeholder="cpc, email, paid-social"
          value={fields.medium}
          onChange={(e) => update('medium', e.target.value)}
        />
        <Input
          label="Campaign"
          wrapClass="sm:col-span-2"
          placeholder="spring-sale-2026"
          value={fields.campaign}
          onChange={(e) => update('campaign', e.target.value)}
        />
        <Input
          label="Term (optional)"
          placeholder="running-shoes"
          value={fields.term}
          onChange={(e) => update('term', e.target.value)}
        />
        <Input
          label="Content (optional)"
          placeholder="blue-cta-variant-b"
          value={fields.content}
          onChange={(e) => update('content', e.target.value)}
        />
      </div>

      <div className="border-ds-border bg-ds-surface2 rounded-xl border p-4">
        <p className="text-ds-muted mb-2 font-mono text-xs tracking-wide uppercase">Tagged URL</p>
        {ready ? (
          <p className="text-ds-text font-mono text-sm break-all">{built.url}</p>
        ) : (
          <p className="text-ds-muted font-mono text-sm">
            Add a landing page URL and at least one UTM field to see the tagged link.
          </p>
        )}

        {built.changes.length > 0 && (
          <p className="text-ds-muted mt-3 text-xs" aria-live="polite">
            Cleaned for consistent reporting: {built.changes.join(' · ')}
          </p>
        )}
        {missingRequired && (
          <p className="text-ds-warning-strong mt-2 text-xs">
            Source, medium and campaign are the three GA4 reports group by; one is still empty.
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" onClick={handleCopy} disabled={!ready}>
            <span aria-live="polite">{copied ? 'Copied ✓' : 'Copy link'}</span>
          </Button>
          <Button type="button" variant="outline" onClick={addToSheet} disabled={!ready}>
            Add to sheet
          </Button>
          <ShareLinkButton getUrl={getShareUrl} />
        </div>
      </div>

      {rows.length > 0 && (
        <UtmSheet
          rows={rows}
          onRemove={(id) => updateRows(rows.filter((r) => r.id !== id))}
          onClear={() => updateRows([])}
        />
      )}
    </div>
  )
}
