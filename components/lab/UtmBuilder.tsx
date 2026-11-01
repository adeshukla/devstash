'use client'

import { useEffect, useMemo, useState } from 'react'
import { Input, Button } from '@/components/ui'
import { copyText } from '@/lib/utils/clipboard'
import {
  buildMatrix,
  buildUtmUrl,
  applySeparator,
  channelKey,
  linkWarnings,
  matchPreset,
  normalizeValue,
  parseUrlList,
  parseVariants,
  MAX_LINKS,
  placeholdersFor,
  tokensIn,
  GOOGLE_PLACEHOLDERS,
  PRESETS,
  splitUtm,
  withMonth,
  UTM_KEYS,
  type ChannelPreset,
  type SheetRow,
  type UtmFields,
} from '@/lib/lab/utm'
import { buildSearch } from '@/lib/lab/urlState'
import {
  NO_RULES,
  decodeRules,
  encodeRules,
  matchesPattern,
  patternExample,
  rulesActive,
  rulesVersion,
  type UtmRules,
} from '@/lib/lab/utmRules'
import { useUrlSync } from './useUrlSync'
import { KEYS, readStored, writeStored } from './storage'
import { trackLab } from './track'
import { LaunchChecklist } from './LaunchChecklist'
import { WorkspaceBackup, type RestoreSummary } from './WorkspaceBackup'
import { buildWorkspace, mergeRows, type Workspace } from '@/lib/lab/workspace'
import { UtmRulesPanel } from './UtmRulesPanel'
import { AdValues } from './AdValues'
import { ShareLinkButton } from './ShareLinkButton'
import { UtmSheet } from './UtmSheet'
import { UtmQr } from './UtmQr'
import { UtmImport } from './UtmImport'
import { ChannelNote } from './ChannelNote'
import { AdsSuffixButton } from './AdsSuffixButton'

const INITIAL: UtmFields = { url: '', source: '', medium: '', campaign: '', term: '', content: '' }
const SHEET_KEY = KEYS.sheet
const RECENT_KEY = KEYS.recent
const PRESETS_KEY = KEYS.presets
const RULES_KEY = KEYS.rules
const OWNER_KEY = KEYS.owner

const chip = (active: boolean) =>
  active
    ? 'bg-ds-cta rounded-lg px-3 py-1.5 text-sm font-medium text-white'
    : 'border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent rounded-lg border px-3 py-1.5 text-sm transition-colors'

const textButton =
  'text-ds-accent-strong hover:underline focus-visible:ring-ds-accent rounded text-sm focus-visible:ring-2 focus-visible:outline-none'

function Step({
  n,
  title,
  hint,
  children,
}: {
  n: number
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section aria-labelledby={`utm-step-${n}`} className="flex gap-3 sm:gap-4">
      <span
        aria-hidden="true"
        className="bg-ds-cta mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-sm font-semibold text-white"
      >
        {n}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div>
          <h2 id={`utm-step-${n}`} className="text-ds-text text-base font-semibold">
            {title}
          </h2>
          {hint && <p className="text-ds-muted mt-0.5 text-sm">{hint}</p>}
        </div>
        {children}
      </div>
    </section>
  )
}

/**
 * UTM builder in three plain steps: where the link goes, where it is shared,
 * what the campaign is called. Values are cleaned (lowercase, hyphens) because
 * GA4 treats "CPC" and "cpc" as different mediums. Several pages and several
 * channels multiply out into one link each. The saved list, recent URLs and
 * custom channels stay in this browser (localStorage); a share link carries
 * the form state.
 */
export function UtmBuilder() {
  const [fields, setFields] = useState<UtmFields>(INITIAL)
  const [bulk, setBulk] = useState(false)
  const [many, setMany] = useState('')
  const [channels, setChannels] = useState<ChannelPreset[]>([])
  const [customOpen, setCustomOpen] = useState(false)
  const [mine, setMine] = useState<ChannelPreset[]>([])
  const [presetName, setPresetName] = useState('')
  const [presetError, setPresetError] = useState('')
  const [rows, setRows] = useState<SheetRow[]>([])
  const [recent, setRecent] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const [touchedUrl, setTouchedUrl] = useState(false)
  const [imported, setImported] = useState(false)
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [variantsText, setVariantsText] = useState('')
  const variants = useMemo(() => parseVariants(variantsText), [variantsText])
  const [rules, setRules] = useState<UtmRules>(NO_RULES)
  const [owner, setOwner] = useState('')
  const locked = rulesActive(rules)
  const sep = locked ? rules.separator : undefined

  // Never `s`, `q` or `search` as share keys: GA4 reads those as site-search terms.
  const getShareUrl = useUrlSync(
    {
      u: bulk ? '' : fields.url,
      us: bulk ? many : '',
      src: channels.length ? '' : fields.source,
      m: channels.length ? '' : fields.medium,
      c: fields.campaign,
      t: fields.term,
      n: fields.content,
      v: variantsText,
      ch: channels.map(channelKey).join(','),
      r: locked ? encodeRules(rules) : '',
    },
    (get) => {
      const sharedRules = decodeRules(get('r') ?? '')
      if (sharedRules) {
        setRules(sharedRules)
        writeStored(RULES_KEY, encodeRules(sharedRules))
      }
      const many = get('us') ?? ''
      setBulk(Boolean(many))
      setMany(many)
      setFields({
        url: get('u') ?? '',
        source: get('src') ?? '',
        medium: get('m') ?? '',
        campaign: get('c') ?? '',
        term: get('t') ?? '',
        content: get('n') ?? '',
      })
      setVariantsText(get('v') ?? '')
      const restored = (get('ch') ?? '')
        .split(',')
        .map((pair) => pair.split('/'))
        .filter(([s, m]) => s && m)
        .map(
          ([source, medium]) =>
            matchPreset(source, medium, sharedRules ? sharedRules.channels : PRESETS) ?? {
              label: `${source} / ${medium}`,
              source,
              medium,
            }
        )
        .filter(
          (c) => !sharedRules || sharedRules.channels.some((p) => channelKey(p) === channelKey(c))
        )
      setChannels(restored)
      setCustomOpen(!restored.length && Boolean(get('src') || get('m')))
    }
  )

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-shot mount read of localStorage */
    setRows(readStored<SheetRow[]>(SHEET_KEY, []).filter((r) => r?.id && r?.url))
    setRecent(readStored<string[]>(RECENT_KEY, []))
    setMine(
      readStored<ChannelPreset[]>(PRESETS_KEY, []).filter((p) => p?.label && p.source && p.medium)
    )
    const stored = readStored<string>(RULES_KEY, '')
    setRules((stored && decodeRules(stored)) || NO_RULES)
    setOwner(readStored<string>(OWNER_KEY, ''))
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  const update = (key: keyof UtmFields, value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }))

  const chips = useMemo(() => {
    const seen = new Set<string>()
    const pool = locked ? rules.channels : [...PRESETS, ...mine, ...channels]
    return pool.filter((p) => {
      const k = channelKey(p)
      return seen.has(k) ? false : (seen.add(k), true)
    })
  }, [mine, channels, locked, rules])

  // Names used before, so a new link reuses the spelling instead of inventing a new one.
  const campaignNames = useMemo(
    () => [...new Set(rows.map((r) => r.fields.campaign.trim()).filter(Boolean))].slice(0, 20),
    [rows]
  )

  const placeholderSets = useMemo(() => {
    const sources = channels.length ? channels.map((c) => c.source) : [fields.source]
    const out: { name: string; items: ReturnType<typeof placeholdersFor> }[] = []
    for (const s of sources) {
      const items = placeholdersFor(s)
      if (items.length && !out.some((o) => o.items === items))
        out.push({
          name: items === GOOGLE_PLACEHOLDERS ? 'Google Ads' : 'Meta (Facebook and Instagram)',
          items,
        })
    }
    return out
  }, [channels, fields.source])

  const list = useMemo(() => (bulk ? parseUrlList(many) : null), [bulk, many])
  const single = fields.url.trim()
  const urls = useMemo(
    () => (bulk ? (list?.urls ?? []) : single ? [single] : []),
    [bulk, list, single]
  )
  const links = useMemo(
    () => buildMatrix(urls, fields, channels, sep, variants),
    [urls, fields, channels, sep, variants]
  )
  const singleError = !bulk && touchedUrl ? buildUtmUrl(fields).error : ''
  const hasInput = channels.length > 0 || UTM_KEYS.some((k) => fields[k].trim())
  const ready =
    links.length > 0 &&
    hasInput &&
    links.every((l) => l.result.url) &&
    !(bulk && list && list.invalid.length > 0)
  const changes = [...new Set(links.flatMap((l) => l.result.changes))]
  const warnings = [...new Set(links.flatMap((l) => linkWarnings(l.fields, l.result.url)))]
  const cleanCampaign = applySeparator(normalizeValue(fields.campaign), sep)
  const campaignFits = !fields.campaign.trim() || matchesPattern(cleanCampaign, rules)
  const needChannel = !channels.length && !(fields.source.trim() && fields.medium.trim())
  const needCampaign = !fields.campaign.trim()

  function togglePreset(p: ChannelPreset) {
    const k = channelKey(p)
    setChannels((prev) =>
      prev.some((c) => channelKey(c) === k) ? prev.filter((c) => channelKey(c) !== k) : [...prev, p]
    )
    setCustomOpen(false)
  }

  function openCustom() {
    setChannels([])
    setCustomOpen(true)
  }

  function savePreset() {
    const label = presetName.trim().slice(0, 24)
    const source = normalizeValue(fields.source)
    const medium = normalizeValue(fields.medium)
    if (!label || !source || !medium) return
    if ([...PRESETS, ...mine].some((p) => p.label.toLowerCase() === label.toLowerCase())) {
      setPresetError('You already have a channel with that name.')
      return
    }
    const preset = { label, source, medium }
    const next = [...mine, preset]
    setMine(next)
    writeStored(PRESETS_KEY, next)
    setChannels([preset])
    setCustomOpen(false)
    setPresetName('')
    setPresetError('')
  }

  function removePreset(p: ChannelPreset) {
    const next = mine.filter((m) => channelKey(m) !== channelKey(p) || m.label !== p.label)
    setMine(next)
    writeStored(PRESETS_KEY, next)
    setChannels((prev) => prev.filter((c) => channelKey(c) !== channelKey(p)))
  }

  function rememberUrls() {
    const next = [...new Set([...urls, ...recent])].slice(0, 5)
    setRecent(next)
    writeStored(RECENT_KEY, next)
  }

  function showChannelFor(source: string, medium: string) {
    const found = matchPreset(source, medium, [...PRESETS, ...mine])
    setChannels(found ? [found] : [])
    setCustomOpen(!found && Boolean(source || medium))
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const split = splitUtm(e.clipboardData.getData('text'))
    if (!split) return
    e.preventDefault()
    setFields({ url: split.base, ...split.fields })
    showChannelFor(split.fields.source, split.fields.medium)
    setImported(true)
  }

  async function handleCopy() {
    if (!ready || !(await copyText(links.map((l) => l.result.url).join('\n')))) return
    rememberUrls()
    trackLab('utm-builder', links.length > 1 ? 'copy_many_links' : 'copy_link')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function updateRows(next: SheetRow[]) {
    setRows(next)
    writeStored(SHEET_KEY, next)
  }

  /** Audit trail written onto every saved row. */
  const stamp = () => ({
    createdAt: new Date().toLocaleDateString('sv-SE'),
    owner: owner.trim(),
    rules: locked ? rulesVersion(rules) : '',
  })

  function addToList() {
    if (!ready) return
    trackLab('utm-builder', 'save_to_list')
    rememberUrls()
    updateRows([
      ...rows,
      ...links.map((l) => ({
        id: crypto.randomUUID(),
        fields: l.fields,
        url: l.result.url,
        ...stamp(),
      })),
    ])
  }

  function importRows(next: Omit<SheetRow, 'id'>[]) {
    trackLab('utm-builder', 'import_sheet')
    updateRows([...rows, ...next.map((r) => ({ ...r, id: crypto.randomUUID(), ...stamp() }))])
  }

  function applyRules(next: UtmRules) {
    trackLab('utm-builder', 'rules_on')
    setRules(next)
    writeStored(RULES_KEY, encodeRules(next))
    setChannels([])
    setCustomOpen(false)
  }

  function rulesOff() {
    setRules(NO_RULES)
    writeStored(RULES_KEY, '')
  }

  const buildBackup = (): Workspace =>
    buildWorkspace(
      {
        sheet: rows,
        presets: mine,
        rules: locked ? encodeRules(rules) : '',
        owner,
        aliases: readStored<Record<string, string>>(KEYS.aliases, {}),
      },
      new Date()
    )

  function restoreBackup(data: Workspace): RestoreSummary {
    trackLab('utm-builder', 'restore_backup')
    const merged = mergeRows(rows, data.sheet)
    if (merged.added) updateRows(merged.rows)
    const known = new Set(mine.map((p) => `${p.label}|${channelKey(p)}`))
    const newPresets = data.presets.filter((p) => !known.has(`${p.label}|${channelKey(p)}`))
    if (newPresets.length) {
      const next = [...mine, ...newPresets]
      setMine(next)
      writeStored(PRESETS_KEY, next)
    }
    const restoredRules = data.rules ? decodeRules(data.rules) : null
    if (restoredRules) applyRules(restoredRules)
    if (data.owner && !owner) updateOwner(data.owner)
    const stored = readStored<Record<string, string>>(KEYS.aliases, {})
    const fresh = Object.keys(data.aliases).filter((k) => !(k in stored))
    if (fresh.length) writeStored(KEYS.aliases, { ...stored, ...data.aliases })
    return {
      links: merged.added,
      channels: newPresets.length,
      merges: fresh.length,
      rules: Boolean(restoredRules),
    }
  }

  function updateOwner(value: string) {
    setOwner(value)
    writeStored(OWNER_KEY, value)
  }

  const rulesLink = () =>
    `${window.location.origin}${window.location.pathname}${buildSearch({ r: encodeRules(rules) })}`

  function insertToken(key: 'campaign' | 'term' | 'content', token: string) {
    setFields((prev) => ({
      ...prev,
      [key]: prev[key] ? `${prev[key]}${sep ?? '-'}${token}` : token,
    }))
  }

  function tryExample() {
    setBulk(false)
    setFields({
      ...INITIAL,
      url: 'https://example.com/spring-sale',
      campaign: withMonth('spring-sale', new Date(), sep),
    })
    setChannels([chips[0] ?? PRESETS[0]])
    setCustomOpen(false)
    setTouchedUrl(false)
  }

  function editRow(row: SheetRow) {
    setBulk(false)
    setFields(row.fields)
    showChannelFor(row.fields.source, row.fields.medium)
    updateRows(rows.filter((r) => r.id !== row.id))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const count = links.length
  const fullSize =
    Math.max(urls.length, 1) * Math.max(channels.length, 1) * Math.max(variants.length, 1)

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start">
      <div className="flex flex-col gap-8">
        <Step n={1} title="Where does the link go?" hint="The page people land on.">
          {bulk ? (
            <div>
              <label
                htmlFor="utm-many"
                className="text-ds-text mb-1.5 block text-[13px] font-medium"
              >
                Page links, one per line
              </label>
              <textarea
                id="utm-many"
                value={many}
                onChange={(e) => setMany(e.target.value)}
                rows={5}
                placeholder={'https://yoursite.com/page-one\nhttps://yoursite.com/page-two'}
                className="border-ds-border bg-ds-surface2 text-ds-text placeholder:text-ds-muted focus:border-ds-accent w-full resize-y rounded-lg border px-4 py-3 font-mono text-xs leading-relaxed outline-none"
              />
              {list && list.invalid.length > 0 && (
                <p className="text-ds-error mt-1.5 text-xs" role="alert">
                  {list.invalid.length === 1 ? 'Line' : 'Lines'}{' '}
                  {list.invalid.map((i) => i.line).join(', ')}{' '}
                  {list.invalid.length === 1 ? 'is' : 'are'} not a full link (start with https://).
                </p>
              )}
              {list?.truncated && (
                <p className="text-ds-warning-strong mt-1.5 text-xs">
                  Only the first 50 pages are used.
                </p>
              )}
            </div>
          ) : (
            <div>
              <Input
                label="Landing page link"
                aria-label="Landing page link"
                placeholder="https://yoursite.com/landing-page"
                value={fields.url}
                onChange={(e) => {
                  update('url', e.target.value)
                  setImported(false)
                }}
                onBlur={() => setTouchedUrl(true)}
                onPaste={handlePaste}
                error={singleError}
                list="utm-recent-urls"
                autoComplete="off"
                hint="Already have a tagged link? Paste it and we fill in the rest."
              />
              <datalist id="utm-recent-urls">
                {recent.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
              {imported && (
                <p className="text-ds-muted mt-2 text-xs" aria-live="polite">
                  Filled in from your pasted link. Check steps 2 and 3.
                </p>
              )}
            </div>
          )}
          <button
            type="button"
            className={`${textButton} self-start`}
            onClick={() => {
              if (!bulk && fields.url.trim() && !many.trim()) setMany(fields.url.trim())
              setBulk(!bulk)
            }}
          >
            {bulk ? 'Just one page' : 'Tagging several pages? Paste a list'}
          </button>
          {!fields.url && !fields.campaign && !channels.length && (
            <button type="button" className={`${textButton} self-start`} onClick={tryExample}>
              Not sure? Try an example
            </button>
          )}
        </Step>

        <Step
          n={2}
          title="Where will you share it?"
          hint={
            locked
              ? "Locked to your team's approved channels."
              : 'Pick one, or several to get a separate link for each.'
          }
        >
          <div className="flex flex-wrap gap-2">
            {chips.map((p) => {
              const active = channels.some((c) => channelKey(c) === channelKey(p))
              const own =
                !locked && mine.some((m) => m.label === p.label && channelKey(m) === channelKey(p))
              return (
                <span key={channelKey(p) + p.label} className="inline-flex items-stretch">
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => togglePreset(p)}
                    className={`${chip(active)} ${own ? 'rounded-r-none' : ''}`}
                  >
                    {p.label}
                  </button>
                  {own && (
                    <button
                      type="button"
                      aria-label={`Delete saved channel ${p.label}`}
                      onClick={() => removePreset(p)}
                      className="border-ds-border text-ds-muted hover:text-ds-error rounded-r-lg border border-l-0 px-2 text-sm transition-colors"
                    >
                      ×
                    </button>
                  )}
                </span>
              )
            })}
            {!locked && (
              <button
                type="button"
                aria-pressed={customOpen}
                onClick={openCustom}
                className={chip(customOpen)}
              >
                Something else
              </button>
            )}
          </div>

          {customOpen && !locked && (
            <div className="border-ds-border bg-ds-surface2/50 flex flex-col gap-4 rounded-xl border p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Platform (source)"
                  placeholder="google, a partner name"
                  value={fields.source}
                  onChange={(e) => update('source', e.target.value)}
                />
                <Input
                  label="Type of traffic (medium)"
                  placeholder="cpc, email, referral"
                  value={fields.medium}
                  onChange={(e) => update('medium', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <Input
                  label="Save this as a channel (optional)"
                  wrapClass="flex-1"
                  placeholder="Name, e.g. Acme Partners"
                  value={presetName}
                  maxLength={24}
                  onChange={(e) => {
                    setPresetName(e.target.value)
                    setPresetError('')
                  }}
                  error={presetError}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={savePreset}
                  disabled={!presetName.trim() || !fields.source.trim() || !fields.medium.trim()}
                >
                  Save channel
                </Button>
              </div>
            </div>
          )}
        </Step>

        <Step
          n={3}
          title="Name the campaign"
          hint="Any short name you will recognise in your reports."
        >
          <div>
            <Input
              label="Campaign name"
              aria-label="Campaign name"
              list="utm-campaign-names"
              autoComplete="off"
              placeholder={
                locked && rules.pattern
                  ? patternExample(rules.pattern, rules.separator, new Date())
                  : 'spring-sale'
              }
              hint={locked && rules.pattern ? `Team pattern: ${rules.pattern}` : undefined}
              value={fields.campaign}
              onChange={(e) => update('campaign', e.target.value)}
            />
            <datalist id="utm-campaign-names">
              {campaignNames.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
            <button
              type="button"
              className={`${textButton} mt-2`}
              onClick={() => update('campaign', withMonth(fields.campaign, new Date(), sep))}
            >
              + Add this month
            </button>
          </div>
          <details className="group">
            <summary className="text-ds-muted hover:text-ds-accent cursor-pointer text-sm select-none">
              More options (optional)
            </summary>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Keyword (term)"
                hint="For paid search ads."
                placeholder="running-shoes"
                value={fields.term}
                onChange={(e) => update('term', e.target.value)}
              />
              <Input
                label="Ad version (content)"
                hint={variants.length ? 'Replaced by the versions below.' : 'To compare two ads.'}
                placeholder="blue-button"
                value={fields.content}
                disabled={variants.length > 0}
                onChange={(e) => update('content', e.target.value)}
              />
              <Input
                label="Or test several ad versions at once"
                wrapClass="sm:col-span-2"
                hint="Comma-separated, up to 10, for example blue-button, green-button. Makes one link per version, for every page and channel."
                placeholder="blue-button, green-button"
                value={variantsText}
                onChange={(e) => setVariantsText(e.target.value)}
              />
              <AdValues sets={placeholderSets} onInsert={insertToken} />
            </div>
          </details>
        </Step>
      </div>

      <div className="border-ds-accent/30 bg-ds-surface2 rounded-xl border p-4 sm:p-5 lg:sticky lg:top-6">
        <h2 className="text-ds-text text-base font-semibold">
          {count > 1 ? `Your ${count} links` : 'Your link'}
        </h2>

        {ready ? (
          <div
            role="region"
            aria-label="Tagged links"
            tabIndex={0}
            className="focus-visible:ring-ds-accent mt-3 max-h-72 overflow-auto rounded focus-visible:ring-2 focus-visible:outline-none lg:max-h-[45vh]"
          >
            <ul className="flex flex-col gap-3">
              {links.map((l) => (
                <li
                  key={l.fields.url + l.label}
                  className="text-ds-text border-ds-border bg-ds-surface rounded-lg border p-3"
                >
                  {l.label && (
                    <span className="text-ds-accent-strong mb-1 block text-xs font-semibold">
                      {l.label}
                    </span>
                  )}
                  <span className="font-mono text-sm break-all">{l.result.url}</span>
                  <ChannelNote source={l.fields.source} medium={l.fields.medium} />
                  {!tokensIn(l.result.url).length && (
                    <button
                      type="button"
                      onClick={() => setQrUrl(l.result.url)}
                      aria-label={`QR code for ${l.label || 'this link'}`}
                      className="border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent mt-2 rounded-md border px-2.5 py-1 text-xs transition-colors"
                    >
                      QR code
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-ds-muted mt-2 text-sm">
            {bulk && list && list.invalid.length > 0
              ? 'Fix the highlighted lines in step 1.'
              : 'Fill in the steps above and your link appears here.'}
          </p>
        )}

        {ready && locked && rules.pattern && fields.campaign.trim() && !campaignFits && (
          <p className="text-ds-warning-strong mt-3 text-xs">
            The campaign name does not follow your team pattern {rules.pattern}, for example{' '}
            {patternExample(rules.pattern, rules.separator, new Date())}.
          </p>
        )}
        {ready && (needChannel || needCampaign) && (
          <p className="text-ds-warning-strong mt-3 text-xs">
            {needChannel && 'Pick where you will share it (step 2). '}
            {needCampaign && 'Add a campaign name (step 3): reports group by it.'}
          </p>
        )}
        {count >= MAX_LINKS && fullSize > MAX_LINKS && (
          <p className="text-ds-warning-strong mt-2 text-xs">
            Showing the first {MAX_LINKS} of {fullSize} links. Use fewer pages, channels or
            versions.
          </p>
        )}
        {warnings.map((w) => (
          <p key={w} className="text-ds-warning-strong mt-2 text-xs">
            {w}
          </p>
        ))}
        {changes.length > 0 && (
          <p className="text-ds-muted mt-3 text-xs" aria-live="polite">
            Tidied so reports stay consistent: {changes.join(' · ')}
          </p>
        )}

        {ready && count === 1 && links[0].fields.source.trim().toLowerCase() === 'google' && (
          <AdsSuffixButton url={links[0].result.url} />
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button type="button" onClick={handleCopy} disabled={!ready}>
            <span aria-live="polite">
              {copied ? 'Copied ✓' : count > 1 ? `Copy ${count} links` : 'Copy link'}
            </span>
          </Button>
          <Button type="button" variant="outline" onClick={addToList} disabled={!ready}>
            {count > 1 ? `Save ${count} to list` : 'Save to list'}
          </Button>
          <ShareLinkButton getUrl={getShareUrl} tool="utm-builder" />
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:col-span-2">
        <UtmRulesPanel
          key={locked ? rulesVersion(rules) : 'off'}
          rules={rules}
          owner={owner}
          onApply={applyRules}
          onOff={rulesOff}
          onOwner={updateOwner}
          getLink={rulesLink}
        />
        <UtmImport onAdd={importRows} />
        <LaunchChecklist />
        <WorkspaceBackup build={buildBackup} onRestore={restoreBackup} />

        {rows.length > 0 && (
          <UtmSheet
            rows={rows}
            rules={rules}
            owner={owner}
            onRemove={(id) => updateRows(rows.filter((r) => r.id !== id))}
            onEdit={editRow}
            onQr={setQrUrl}
            onClear={() => updateRows([])}
          />
        )}
      </div>

      {qrUrl && <UtmQr key={qrUrl} url={qrUrl} onClose={() => setQrUrl(null)} />}
    </div>
  )
}
