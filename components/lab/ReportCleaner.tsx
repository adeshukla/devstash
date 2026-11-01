'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { copyText } from '@/lib/utils/clipboard'
import {
  applyNames,
  cleanReport,
  lookerCase,
  mappingTsv,
  mergedTsv,
  rememberable,
} from '@/lib/lab/reportClean'
import { KEYS, readStored, writeStored } from './storage'
import { trackLab } from './track'
import type { Separator } from '@/lib/lab/utm'

// A made-up sample so the tool can be tried without an export. Not real data.
const EXAMPLE = [
  'Session campaign,Sessions,Engagement rate',
  'spring-sale,1200,0.67',
  'Spring_Sale,300,0.5',
  'spring sale,90,0.44',
  'SPRING-SALE,12,0.42',
  'winter-promo,500,0.6',
  'Winter Promo,40,0.5',
  'launch-week,220,0.7',
].join('\n')

const fmt = (n: number) => n.toLocaleString('en-US')

/**
 * Paste an analytics export; rows that are the same campaign, source or medium
 * written differently are found, merged, and the mapping is ready to copy.
 * Runs in the browser; nothing is uploaded.
 */
export function ReportCleaner() {
  const [text, setText] = useState('')
  const [sep, setSep] = useState<Separator>('-')
  const [copied, setCopied] = useState('')
  // Merges remembered from earlier reports, kept on this device.
  const [saved, setSaved] = useState<Record<string, string>>({})
  // Clean names the user typed instead of the suggested ones, keyed by the suggestion.
  const [names, setNames] = useState<Record<string, string>>({})
  const [note, setNote] = useState('')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot mount read of localStorage
    setSaved(readStored<Record<string, string>>(KEYS.aliases, {}))
  }, [])

  const auto = useMemo(
    () => (text.trim() ? cleanReport(text, sep, saved) : null),
    [text, sep, saved]
  )
  const result = useMemo(() => (auto ? applyNames(auto, names) : null), [auto, names])
  const savedCount = Object.keys(saved).length

  async function pickFile(file: File | undefined) {
    if (file) setText(await file.text())
  }
  async function copy(value: string, id: string) {
    if (!(await copyText(value))) return
    trackLab('report-cleaner', `copy_${id}`)
    setCopied(id)
    setTimeout(() => setCopied(''), 2000)
  }

  const splitItems =
    result?.groups
      .map((g, i) => ({ g, key: auto?.groups[i].canonical ?? g.canonical }))
      .filter((x) => x.g.split) ?? []
  const split = splitItems.map((x) => x.g)
  const appliedMemory =
    result?.groups.reduce((n, g) => n + g.variants.filter((v) => v.remembered).length, 0) ?? 0

  function remember() {
    trackLab('report-cleaner', 'remember_merges')
    if (!result) return
    const found = rememberable(result)
    const next = { ...saved, ...found }
    setSaved(next)
    writeStored(KEYS.aliases, next)
    setNames({})
    setNote(
      `Remembered ${Object.keys(found).length} merges. They are applied automatically the next time you paste a report here.`
    )
  }
  function forget() {
    setSaved({})
    writeStored(KEYS.aliases, {})
    setNote('Forgot all remembered merges.')
  }
  const rest = result?.groups.filter((g) => !g.split) ?? []
  const spellings = split.reduce((n, g) => n + g.variants.length, 0)
  const looker = result ? lookerCase(result) : ''
  const field = result?.dims.length === 1 ? result.dims[0] : 'Your field'
  const sheetsFormula = '=LOWER(REGEXP_REPLACE(TRIM(A2),"[ _]+","-"))'
  const lookerFormula = `LOWER(REGEXP_REPLACE(TRIM(${field}), "[ _]+", "-"))`

  const copyBtn =
    'border-ds-border text-ds-text hover:border-ds-accent hover:text-ds-accent rounded-md border px-2.5 py-1 text-xs transition-colors'

  return (
    <div className="flex flex-col gap-6">
      <div>
        <label htmlFor="rc-text" className="text-ds-text mb-1.5 block text-[13px] font-medium">
          Paste your report
        </label>
        <textarea
          id="rc-text"
          rows={7}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'Session campaign\tSessions\nspring-sale\t1200\nSpring_Sale\t300'}
          className="border-ds-border bg-ds-surface2 text-ds-text placeholder:text-ds-muted focus:border-ds-accent w-full resize-y rounded-lg border px-4 py-3 font-mono text-xs leading-relaxed outline-none"
        />
        <p className="text-ds-muted mt-1.5 text-sm">
          Copy the table from GA4 or Looker Studio, or choose the CSV you exported. It needs a
          column named like Session campaign, Session source / medium, source, medium or campaign,
          and may have numbers such as Sessions.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2">
          <label className="text-ds-muted max-w-full min-w-0 text-sm">
            Or choose a file{' '}
            <input
              type="file"
              accept=".csv,.tsv,.txt,text/csv,text/plain"
              onChange={(e) => pickFile(e.target.files?.[0])}
              className="text-ds-muted mt-1 block w-full max-w-full text-xs"
            />
          </label>
          {!text && (
            <button
              type="button"
              onClick={() => setText(EXAMPLE)}
              className="text-ds-accent-strong text-sm hover:underline"
            >
              Not sure? Try an example
            </button>
          )}
        </div>
      </div>

      <fieldset>
        <legend className="text-ds-text mb-1.5 text-[13px] font-medium">Clean names use</legend>
        <div className="flex flex-wrap gap-4">
          {(['-', '_'] as const).map((s) => (
            <label key={s} className="text-ds-text flex items-center gap-2 text-sm">
              <input type="radio" name="rc-sep" checked={sep === s} onChange={() => setSep(s)} />
              {s === '-' ? 'Hyphens (spring-sale)' : 'Underscores (spring_sale)'}
            </label>
          ))}
        </div>
      </fieldset>

      {result?.error && (
        <p className="text-ds-warning-strong text-sm" role="alert">
          {result.error}
        </p>
      )}

      {result && !result.error && (
        <div className="flex flex-col gap-6" aria-live="polite">
          <div className="border-ds-accent/30 bg-ds-surface2 rounded-xl border p-4">
            <p className="text-ds-text font-medium">
              {split.length
                ? `${split.length} ${split.length === 1 ? 'thing is' : 'things are'} split into ${spellings} spellings.`
                : 'Nothing to merge: the names already agree.'}
            </p>
            <p className="text-ds-muted mt-1 text-sm">
              {result.rowCount} rows read, {result.groups.length} after merging
              {result.metricNames.length > 0 && `. Added up: ${result.metricNames.join(', ')}.`}
            </p>
            {appliedMemory > 0 && (
              <p className="text-ds-muted mt-1 text-sm">
                {appliedMemory} {appliedMemory === 1 ? 'spelling was' : 'spellings were'} merged
                using what you saved from earlier reports.
              </p>
            )}
            {result.skippedMetrics.length > 0 && (
              <p className="text-ds-muted mt-1 text-sm">
                Left out because rates and averages cannot be added:{' '}
                {result.skippedMetrics.join(', ')}.
              </p>
            )}
          </div>

          {split.length > 0 && (
            <ul className="flex flex-col gap-3" aria-label="Merged groups">
              {splitItems.map(({ g, key }, gi) => (
                <li key={key} className="border-ds-border bg-ds-surface2 rounded-xl border p-4">
                  <label htmlFor={`rc-name-${gi}`} className="text-ds-muted block text-xs">
                    Merge into (you can rename it)
                  </label>
                  <input
                    id={`rc-name-${gi}`}
                    value={names[key] ?? g.canonical}
                    onChange={(e) => setNames((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="border-ds-border bg-ds-surface text-ds-text focus:border-ds-accent mt-1 w-full rounded-md border px-2 py-1 font-mono text-sm outline-none"
                  />
                  {result.metricNames.length > 0 && (
                    <p className="text-ds-muted mt-1 text-sm">
                      Total:{' '}
                      {g.totals
                        .map((t, i) => `${fmt(t)} ${result.metricNames[i].toLowerCase()}`)
                        .join(' · ')}
                    </p>
                  )}
                  <ul className="mt-2 flex flex-col gap-1 text-sm">
                    {g.variants.map((v) => (
                      <li
                        key={v.raw}
                        className="text-ds-muted flex flex-wrap justify-between gap-x-4"
                      >
                        <span className="font-mono break-all">
                          {v.raw}
                          {v.remembered && (
                            <span className="text-ds-muted font-sans text-xs"> (remembered)</span>
                          )}
                        </span>
                        <span>
                          {v.metrics.length
                            ? v.metrics.map((m) => fmt(m)).join(' · ')
                            : `${v.rows} ${v.rows === 1 ? 'row' : 'rows'}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}

          {rest.length > 0 && (
            <details>
              <summary className="text-ds-muted hover:text-ds-accent cursor-pointer text-sm">
                Rows with nothing to merge ({rest.length})
              </summary>
              <ul className="text-ds-muted mt-2 flex flex-col gap-1 font-mono text-xs">
                {rest.map((g) => (
                  <li key={g.canonical} className="break-all">
                    {g.variants[0].raw}
                    {g.totals.length > 0 && ` — ${g.totals.map((t) => fmt(t)).join(' · ')}`}
                  </li>
                ))}
              </ul>
            </details>
          )}

          <div className="flex flex-col gap-3">
            <h2 className="text-ds-text text-base font-semibold">
              Take the clean version with you
            </h2>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={() => copy(mergedTsv(result), 'merged')}>
                {copied === 'merged' ? 'Copied ✓' : 'Copy merged table'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => copy(mappingTsv(result), 'map')}
              >
                {copied === 'map' ? 'Copied ✓' : 'Copy original → clean list'}
              </Button>
              {looker && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => copy(looker, 'looker')}
                >
                  {copied === 'looker' ? 'Copied ✓' : 'Copy Looker Studio field'}
                </Button>
              )}
            </div>
            <div className="border-ds-border flex flex-col gap-2 rounded-lg border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={remember}
                  disabled={!split.length}
                >
                  Remember these merges
                </Button>
                {savedCount > 0 && (
                  <button
                    type="button"
                    onClick={forget}
                    className="text-ds-muted hover:text-ds-error text-xs underline"
                  >
                    Forget all {savedCount}
                  </button>
                )}
              </div>
              <p className="text-ds-muted text-sm">
                Next month, paste a fresh report and these merges apply on their own. They stay on
                this device; the builder&apos;s backup includes them.
              </p>
              {note && (
                <p className="text-ds-success text-sm" role="status">
                  {note}
                </p>
              )}
            </div>
            <p className="text-ds-muted text-sm">
              Paste the tables into Google Sheets or Excel. The Looker Studio field is a calculated
              field that maps each spelling to the clean one.
            </p>
            <details>
              <summary className="text-ds-muted hover:text-ds-accent cursor-pointer text-sm">
                Formulas that fix capitals, spaces and underscores everywhere
              </summary>
              <div className="mt-3 flex flex-col gap-3 text-sm">
                {[
                  ['Google Sheets (label in A2)', sheetsFormula, 'sheets'],
                  ['Looker Studio calculated field', lookerFormula, 'lformula'],
                ].map(([label, formula, id]) => (
                  <div key={id}>
                    <p className="text-ds-muted">{label}</p>
                    <code className="bg-ds-surface2 text-ds-text mt-1 block rounded px-2 py-1 font-mono text-xs break-all">
                      {formula}
                    </code>
                    <button
                      type="button"
                      onClick={() => copy(formula, id)}
                      className={`${copyBtn} mt-1`}
                    >
                      {copied === id ? 'Copied ✓' : 'Copy'}
                    </button>
                  </div>
                ))}
                <p className="text-ds-muted">
                  These handle capitals, spaces and underscores only. Short names such as fb and
                  facebook need the original → clean list above.
                </p>
              </div>
            </details>
          </div>

          <p className="text-ds-muted text-sm">
            GA4 keeps the original values, so this cleans your copy of the report, not GA4 itself.
            To stop it happening, tag links the same way every time with the{' '}
            <Link href="/lab/utm-builder" className="text-ds-accent-strong underline">
              UTM builder
            </Link>
            , and check old ones in the{' '}
            <Link href="/lab/utm-link-checker" className="text-ds-accent-strong underline">
              link checker
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  )
}
