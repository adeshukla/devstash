'use client'

import { useId, useState } from 'react'
import { buildUtmUrl } from '@/lib/lab/utm'
import { analyzeLink } from '@/lib/lab/utmCheck'
import { buildWhatsAppLink } from '@/lib/lab/whatsapp'
import { validateEventName } from '@/lib/lab/ga4Event'

const input =
  'border-ds-border2 bg-ds-bg text-ds-text focus-visible:ring-ds-accent w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none'

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="text-ds-muted mb-1 block font-mono text-[11px]">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={input}
        autoComplete="off"
        spellCheck={false}
      />
    </div>
  )
}

function Result({ children, bad }: { children: React.ReactNode; bad?: boolean }) {
  return (
    <p
      aria-live="polite"
      className={`bg-ds-surface2 min-h-10 rounded-md border px-3 py-2 font-mono text-xs [overflow-wrap:anywhere] ${
        bad ? 'border-ds-error text-ds-text' : 'border-ds-border text-ds-text'
      }`}
    >
      {children}
    </p>
  )
}

/** The tools that have a small working version on their Lab card. */
export const MINI_TOOLS = [
  'utm-builder',
  'utm-link-checker',
  'whatsapp-link-generator',
  'meta-tag-generator',
  'ga4-event-builder',
] as const

function Utm() {
  const [url, setUrl] = useState('example.com/pricing')
  const [campaign, setCampaign] = useState('Spring Sale')
  const r = buildUtmUrl({
    url,
    source: 'google',
    medium: 'cpc',
    campaign,
    term: '',
    content: '',
  })
  return (
    <>
      <Field label="Your page" value={url} onChange={setUrl} />
      <Field label="Campaign name" value={campaign} onChange={setCampaign} />
      <Result bad={!r.url}>{r.url || r.error || 'Type your page first.'}</Result>
    </>
  )
}

function Checker() {
  const [link, setLink] = useState(
    'https://example.com/?utm_source=Google&UTM_Campaign=Spring Sale'
  )
  const r = link.trim() ? analyzeLink(link) : null
  const problems = r?.issues.filter((i) => i.level === 'problem').length ?? 0
  return (
    <>
      <Field label="A link you already use" value={link} onChange={setLink} />
      <Result bad={problems > 0}>
        {r
          ? `${problems} problem${problems === 1 ? '' : 's'}. Clean: ${r.cleaned}`
          : 'Paste a link to check it.'}
      </Result>
    </>
  )
}

function WhatsApp() {
  const [number, setNumber] = useState('98765 43210')
  const [message, setMessage] = useState('Hi, please share your price list.')
  const r = buildWhatsAppLink({ country: '91', number, message, ref: '' })
  return (
    <>
      <Field label="WhatsApp number (India)" value={number} onChange={setNumber} />
      <Field label="Message ready to send" value={message} onChange={setMessage} />
      <Result bad={!r.link}>{r.link || r.error || 'Add a number.'}</Result>
    </>
  )
}

function Title() {
  const [title, setTitle] = useState('Shoes & Socks | Spring Sale')
  const n = title.trim().length
  const long = n > 60
  return (
    <>
      <Field label="Page title" value={title} onChange={setTitle} />
      <div className="bg-ds-border h-1.5 overflow-hidden rounded-full" aria-hidden="true">
        <div
          className={`h-full transition-[width] duration-200 ${long ? 'bg-ds-warning' : 'bg-ds-success'}`}
          style={{ width: `${Math.min(100, (n / 60) * 100)}%` }}
        />
      </div>
      <Result bad={long}>
        {n}/60 characters.{' '}
        {long
          ? `Google will likely cut it. Shorten by ${n - 60}.`
          : n === 0
            ? 'Type a title.'
            : 'Fits on Google.'}
      </Result>
    </>
  )
}

function Ga4() {
  const [name, setName] = useState('generate_lead')
  const issues = validateEventName(name).filter((i) => i.level === 'problem')
  return (
    <>
      <Field label="Event name" value={name} onChange={setName} />
      <Result bad={issues.length > 0}>
        {!name.trim()
          ? 'Name the event.'
          : issues.length
            ? issues[0].text
            : `gtag('event', '${name.trim()}')  ✓ GA4 accepts this name`}
      </Result>
    </>
  )
}

const MINI: Record<string, () => React.JSX.Element> = {
  'utm-builder': Utm,
  'utm-link-checker': Checker,
  'whatsapp-link-generator': WhatsApp,
  'meta-tag-generator': Title,
  'ga4-event-builder': Ga4,
}

/** A small working version of a tool. Everything runs in the browser, nothing is sent anywhere. */
export function LabMiniTry({ slug }: { slug: string }) {
  const Mini = MINI[slug]
  if (!Mini) return null
  return (
    <div className="border-ds-border2 bg-ds-surface flex flex-col gap-2.5 rounded-lg border border-dashed p-3.5">
      <p className="text-ds-accent-strong font-mono text-[11px]">Try it here. Edit the boxes.</p>
      <Mini />
    </div>
  )
}
