'use client'

import { useId, useMemo, useState } from 'react'
import { Button } from '@/components/ui'
import {
  buildDataLayer,
  buildGtag,
  checkEvent,
  MAX_PARAMS,
  TEMPLATES,
  type Param,
} from '@/lib/lab/ga4Event'
import { CssCodeBlock } from './CssCodeBlock'
import { trackLab } from './track'

type Target = 'gtm' | 'gtag'

interface Row extends Param {
  id: number
}

const field =
  'border-ds-border bg-ds-surface2 text-ds-text placeholder:text-ds-muted focus:border-ds-accent w-full rounded-lg border px-3 py-2 text-sm outline-none'

let nextId = 1
const row = (name = '', value = ''): Row => ({ id: nextId++, name, value })

/**
 * Build a GA4 event: pick a recommended one or name your own, add parameters, and get the
 * dataLayer push for Google Tag Manager or the gtag.js call, with Google's naming and size rules
 * checked as you type. Nothing is sent anywhere.
 */
export function Ga4EventBuilder() {
  const nameId = useId()
  const [name, setName] = useState('')
  const [rows, setRows] = useState<Row[]>([row()])
  const [items, setItems] = useState(false)
  const [target, setTarget] = useState<Target>('gtm')

  const params = rows.map(({ name: n, value }) => ({ name: n, value }))
  const issues = useMemo(() => checkEvent(name, params, items), [name, params, items])
  const problems = issues.filter((i) => i.level === 'problem').length
  const code =
    target === 'gtm' ? buildDataLayer(name, params, items) : buildGtag(name, params, items)
  const template = TEMPLATES.find((t) => t.id === name.trim())
  const filled = rows.filter((r) => r.name.trim() || r.value.trim()).length

  function start(id: string) {
    trackLab('ga4-event', 'template', id || 'custom')
    const t = TEMPLATES.find((x) => x.id === id)
    if (!t) {
      setName('')
      setRows([row()])
      setItems(false)
      return
    }
    setName(t.id)
    setRows(t.params.map((p) => row(p.name, p.example)))
    setItems(Boolean(t.items))
  }

  const update = (id: number, patch: Partial<Param>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-start">
      <div className="flex flex-col gap-5">
        <div>
          <label htmlFor="ga4-start" className="text-ds-text mb-1.5 block text-[13px] font-medium">
            Start from a recommended event
          </label>
          <select
            id="ga4-start"
            value={template?.id ?? ''}
            onChange={(e) => start(e.target.value)}
            className={field}
          >
            <option value="">Your own custom event</option>
            {TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <p className="text-ds-muted mt-1.5 text-xs">
            Recommended events come from Google&apos;s list, with the parameters it names.
            Google&apos;s reports and features are built around these names.
          </p>
        </div>

        <div>
          <label htmlFor={nameId} className="text-ds-text mb-1.5 block text-[13px] font-medium">
            Event name
          </label>
          <input
            id={nameId}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="quote_requested"
            autoComplete="off"
            spellCheck={false}
            className={`${field} font-mono`}
          />
          <p className="text-ds-muted mt-1.5 text-xs">
            Letters, numbers and underscores, starting with a letter, up to 40 characters.
          </p>
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-ds-text mb-1 text-[13px] font-medium">
            Parameters ({filled} of {MAX_PARAMS})
          </legend>
          {rows.map((r, i) => (
            <div key={r.id} className="flex items-start gap-2">
              <input
                aria-label={`Parameter ${i + 1} name`}
                value={r.name}
                onChange={(e) => update(r.id, { name: e.target.value })}
                placeholder="parameter_name"
                autoComplete="off"
                spellCheck={false}
                className={`${field} font-mono`}
              />
              <input
                aria-label={`Parameter ${i + 1} value`}
                value={r.value}
                onChange={(e) => update(r.id, { value: e.target.value })}
                placeholder="value"
                autoComplete="off"
                className={field}
              />
              <button
                type="button"
                aria-label={`Remove parameter ${i + 1}`}
                onClick={() =>
                  setRows((rs) => (rs.length > 1 ? rs.filter((x) => x.id !== r.id) : [row()]))
                }
                className="border-ds-border text-ds-muted hover:text-ds-text hover:border-ds-accent h-[38px] shrink-0 rounded-lg border px-3 text-sm"
              >
                ×
              </button>
            </div>
          ))}
          <div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setRows((rs) => [...rs, row()])}
            >
              + Add a parameter
            </Button>
          </div>
        </fieldset>

        <label className="text-ds-text flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={items}
            onChange={(e) => setItems(e.target.checked)}
            className="accent-ds-accent mt-1 h-4 w-4"
          />
          <span>
            Include an items array
            <span className="text-ds-muted block">
              Shop events send the products involved. Each item needs an item_id or an item_name.
              The code gets one example item for you to replace.
            </span>
          </span>
        </label>
      </div>

      <div className="flex flex-col gap-4">
        <div className="border-ds-accent/30 bg-ds-surface2 rounded-xl border p-4 sm:p-5">
          <h2 className="text-ds-text mb-3 text-base font-semibold">Your code</h2>
          <div
            role="tablist"
            aria-label="Where the event goes"
            className="mb-3 flex flex-wrap gap-2"
          >
            {(
              [
                ['gtm', 'Tag Manager (dataLayer)'],
                ['gtag', 'gtag.js'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={target === id}
                onClick={() => setTarget(id)}
                className={
                  target === id
                    ? 'border-ds-accent text-ds-text rounded-full border px-3 py-1 text-sm font-medium'
                    : 'border-ds-border text-ds-muted hover:text-ds-text rounded-full border px-3 py-1 text-sm'
                }
              >
                {label}
              </button>
            ))}
          </div>
          {code ? (
            <CssCodeBlock code={code} label="JavaScript" />
          ) : (
            <p className="text-ds-muted text-sm">Name the event and your code appears here.</p>
          )}
          {code && target === 'gtm' && (
            <p className="text-ds-muted mt-3 text-xs leading-relaxed">
              A push alone sends nothing to GA4. In Tag Manager, add a Custom Event trigger with
              this event name, and a GA4 event tag that reads each parameter from a Data Layer
              Variable.
            </p>
          )}
          {code && target === 'gtag' && (
            <p className="text-ds-muted mt-3 text-xs leading-relaxed">
              Google does not process events placed above the Google tag snippet, so run this after
              it.
            </p>
          )}
        </div>

        {name.trim() && (
          <div aria-live="polite" className="flex flex-col gap-2">
            <p className="text-ds-text font-medium">
              {problems ? `${problems} problem${problems === 1 ? '' : 's'}` : 'No problems found'}
              {issues.length - problems > 0 && `, ${issues.length - problems} to know`}
            </p>
            {issues.length > 0 && (
              <ul className="flex flex-col gap-1.5 text-sm">
                {issues.map((i) => (
                  <li
                    key={i.text}
                    className={i.level === 'problem' ? 'text-ds-warning-strong' : 'text-ds-muted'}
                  >
                    <strong className="font-semibold">
                      {i.level === 'problem' ? 'Problem: ' : 'Good to know: '}
                    </strong>
                    {i.text}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-ds-muted text-xs leading-relaxed">
              To use a custom parameter in reports, register it as a custom dimension in Admin.
              Never send personal data such as emails or phone numbers.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
