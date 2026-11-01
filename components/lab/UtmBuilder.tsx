'use client'

import { useEffect, useMemo, useState } from 'react'
import { Input, Button } from '@/components/ui'
import { copyText } from '@/lib/utils/clipboard'
import {
  buildForChannels,
  buildUtmUrl,
  linkWarnings,
  PRESETS,
  splitUtm,
  UTM_KEYS,
  type SheetRow,
  type UtmFields,
} from '@/lib/lab/utm'
import { useUrlSync } from './useUrlSync'
import { ShareLinkButton } from './ShareLinkButton'
import { UtmSheet } from './UtmSheet'

const INITIAL: UtmFields = { url: '', source: '', medium: '', campaign: '', term: '', content: '' }
const SHEET_KEY = 'devstash-utm-sheet'
const RECENT_KEY = 'devstash-utm-recent'
// Short URL keys keep shared links readable. Never `s`, `q` or `search`: GA4
// reads those as site-search terms.
const URL_KEYS = {
  url: 'u',
  source: 'src',
  medium: 'm',
  campaign: 'c',
  term: 't',
  content: 'n',
} as const

function readStored<T>(key: string, fallback: T): T {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(key) ?? 'null')
    return (parsed as T) ?? fallback
  } catch {
    return fallback
  }
}

function writeStored(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage blocked: everything still works for this visit
  }
}

const chip = (active: boolean) =>
  active
    ? 'bg-ds-cta rounded-lg px-3 py-1.5 text-sm font-medium text-white'
    : 'border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent rounded-lg border px-3 py-1.5 text-sm transition-colors'

/**
 * UTM builder. Values are normalised (lowercase, hyphens) because GA4 treats
 * "CPC" and "cpc" as different mediums. Choose one channel to fill source and
 * medium, or several to get one link each. Links go into a sheet that is
 * checked for naming problems and exported. The sheet and recent URLs stay in
 * this browser (localStorage); a share link carries the form state.
 */
export function UtmBuilder() {
  const [fields, setFields] = useState<UtmFields>(INITIAL)
  const [channels, setChannels] = useState<string[]>([])
  const [rows, setRows] = useState<SheetRow[]>([])
  const [recent, setRecent] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const [touchedUrl, setTouchedUrl] = useState(false)
  const [imported, setImported] = useState(false)

  const getShareUrl = useUrlSync(
    {
      ...Object.fromEntries(
        (Object.keys(URL_KEYS) as (keyof UtmFields)[]).map((k) => [URL_KEYS[k], fields[k]])
      ),
      ch: channels.join(','),
    },
    (get) => {
      setFields({
        url: get('u') ?? '',
        source: get('src') ?? '',
        medium: get('m') ?? '',
        campaign: get('c') ?? '',
        term: get('t') ?? '',
        content: get('n') ?? '',
      })
      const labels = (get('ch') ?? '').split(',')
      setChannels(PRESETS.map((p) => p.label).filter((l) => labels.includes(l)))
    }
  )

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-shot mount read of localStorage */
    setRows(readStored<SheetRow[]>(SHEET_KEY, []).filter((r) => r?.id && r?.url))
    setRecent(readStored<string[]>(RECENT_KEY, []))
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  const update = (key: keyof UtmFields, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }))
    // Typing source or medium by hand replaces the channel selection.
    if (key === 'source' || key === 'medium') setChannels([])
  }

  const multi = channels.length > 1
  const links = useMemo(() => {
    if (multi)
      return buildForChannels(fields, channels).map((c) => ({
        label: c.label,
        fields: c.fields,
        ...c.result,
      }))
    const r = buildUtmUrl(fields)
    return r.url && UTM_KEYS.some((k) => fields[k].trim()) ? [{ label: '', fields, ...r }] : []
  }, [fields, channels, multi])
  const urlError = touchedUrl ? buildUtmUrl(fields).error : ''
  const ready = links.length > 0 && links.every((l) => l.url)
  const changes = [...new Set(links.flatMap((l) => l.changes))]
  const warnings = [...new Set(links.flatMap((l) => linkWarnings(l.fields, l.url)))]
  const missingRequired =
    ready && !multi && !(fields.source.trim() && fields.medium.trim() && fields.campaign.trim())
  const multiNoCampaign = ready && multi && !fields.campaign.trim()

  function togglePreset(label: string) {
    const next = channels.includes(label)
      ? channels.filter((c) => c !== label)
      : [...channels, label]
    setChannels(next)
    if (next.length === 1) {
      const p = PRESETS.find((x) => x.label === next[0])!
      setFields((prev) => ({ ...prev, source: p.source, medium: p.medium }))
    } else if (next.length > 1) {
      setFields((prev) => ({ ...prev, source: '', medium: '' }))
    }
  }

  function rememberUrl() {
    const base = fields.url.trim()
    if (!base) return
    const next = [base, ...recent.filter((r) => r !== base)].slice(0, 5)
    setRecent(next)
    writeStored(RECENT_KEY, next)
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const split = splitUtm(e.clipboardData.getData('text'))
    if (!split) return
    e.preventDefault()
    setFields({ url: split.base, ...split.fields })
    setChannels([])
    setImported(true)
  }

  async function handleCopy() {
    if (!ready || !(await copyText(links.map((l) => l.url).join('\n')))) return
    rememberUrl()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function updateRows(next: SheetRow[]) {
    setRows(next)
    writeStored(SHEET_KEY, next)
  }

  function addToSheet() {
    if (!ready) return
    rememberUrl()
    updateRows([
      ...rows,
      ...links.map((l) => ({ id: crypto.randomUUID(), fields: l.fields, url: l.url })),
    ])
  }

  function editRow(row: SheetRow) {
    setFields(row.fields)
    setChannels([])
    updateRows(rows.filter((r) => r.id !== row.id))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Input
          label="Landing page URL"
          placeholder="https://yoursite.com/landing-page"
          value={fields.url}
          onChange={(e) => {
            update('url', e.target.value)
            setImported(false)
          }}
          onBlur={() => setTouchedUrl(true)}
          onPaste={handlePaste}
          error={urlError}
          list="utm-recent-urls"
          autoComplete="off"
          hint="Paste a link that is already tagged and its UTM values are filled in for you."
        />
        <datalist id="utm-recent-urls">
          {recent.map((r) => (
            <option key={r} value={r} />
          ))}
        </datalist>
        {imported && (
          <p className="text-ds-muted mt-2 text-xs" aria-live="polite">
            Loaded the UTM values from your pasted link; edit them below.
          </p>
        )}
      </div>

      <div>
        <p className="text-ds-muted mb-2 font-mono text-xs tracking-wide uppercase">
          Channels <span className="normal-case">(pick several for one link each)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              aria-pressed={channels.includes(p.label)}
              onClick={() => togglePreset(p.label)}
              className={chip(channels.includes(p.label))}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Source"
          placeholder={multi ? 'set by each channel' : 'google, facebook, newsletter'}
          value={fields.source}
          disabled={multi}
          onChange={(e) => update('source', e.target.value)}
        />
        <Input
          label="Medium"
          placeholder={multi ? 'set by each channel' : 'cpc, email, paid-social'}
          value={fields.medium}
          disabled={multi}
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
        <p className="text-ds-muted mb-2 font-mono text-xs tracking-wide uppercase">
          {multi ? `Tagged URLs (${links.length})` : 'Tagged URL'}
        </p>
        {ready ? (
          <ul className="flex flex-col gap-2">
            {links.map((l) => (
              <li key={l.label || 'single'} className="text-ds-text font-mono text-sm break-all">
                {l.label && <span className="text-ds-accent-strong mr-2">{l.label}</span>}
                {l.url}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ds-muted font-mono text-sm">
            Add a landing page URL and at least one UTM field to see the tagged link.
          </p>
        )}

        {changes.length > 0 && (
          <p className="text-ds-muted mt-3 text-xs" aria-live="polite">
            Cleaned for consistent reporting: {changes.join(' · ')}
          </p>
        )}
        {(missingRequired || multiNoCampaign) && (
          <p className="text-ds-warning-strong mt-2 text-xs">
            {multiNoCampaign
              ? 'Add a campaign name: GA4 reports group by it.'
              : 'Source, medium and campaign are the three GA4 reports group by; one is still empty.'}
          </p>
        )}
        {warnings.map((w) => (
          <p key={w} className="text-ds-warning-strong mt-2 text-xs">
            {w}
          </p>
        ))}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" onClick={handleCopy} disabled={!ready}>
            <span aria-live="polite">
              {copied ? 'Copied ✓' : multi ? `Copy ${links.length} links` : 'Copy link'}
            </span>
          </Button>
          <Button type="button" variant="outline" onClick={addToSheet} disabled={!ready}>
            {multi ? `Add ${links.length} to sheet` : 'Add to sheet'}
          </Button>
          <ShareLinkButton getUrl={getShareUrl} />
        </div>
      </div>

      {rows.length > 0 && (
        <UtmSheet
          rows={rows}
          onRemove={(id) => updateRows(rows.filter((r) => r.id !== id))}
          onEdit={editRow}
          onClear={() => updateRows([])}
        />
      )}
    </div>
  )
}
