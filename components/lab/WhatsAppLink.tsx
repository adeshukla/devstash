'use client'

import { useId, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button, Input, Textarea } from '@/components/ui'
import { copyText } from '@/lib/utils/clipboard'
import { buildWhatsAppLink, COUNTRIES, htmlSnippet, TEMPLATES } from '@/lib/lab/whatsapp'
import { QrPanel } from './QrPanel'
import { trackLab } from './track'

const chip = (active: boolean) =>
  active
    ? 'bg-ds-cta rounded-lg px-3 py-1.5 text-sm font-medium text-white'
    : 'border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent rounded-lg border px-3 py-1.5 text-sm transition-colors'

const selectClass =
  'border-ds-border bg-ds-surface2 text-ds-text focus:border-ds-accent h-[42px] w-full rounded-lg border px-3 text-[14px] outline-none'

/**
 * A WhatsApp click-to-chat link with a message already typed, a QR code for it, and an HTML
 * snippet. Everything is made in the browser. The campaign code goes into the message because a
 * wa.me link opens WhatsApp, not your site, so it cannot carry UTM tags.
 */
export function WhatsAppLink() {
  const countryId = useId()
  const [country, setCountry] = useState('91')
  const [number, setNumber] = useState('')
  const [message, setMessage] = useState('')
  const [ref, setRef] = useState('')
  const [copied, setCopied] = useState<'link' | 'html' | null>(null)

  const result = useMemo(
    () => buildWhatsAppLink({ country, number, message, ref }),
    [country, number, message, ref]
  )

  async function copy(text: string, which: 'link' | 'html') {
    if (!(await copyText(text))) return
    trackLab('whatsapp-link', which === 'link' ? 'copy_link' : 'copy_html')
    setCopied(which)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-start">
      <div className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
          <div>
            <label
              htmlFor={countryId}
              className="text-ds-text mb-1.5 block text-[13px] font-medium"
            >
              Country
            </label>
            <select
              id={countryId}
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className={selectClass}
            >
              {COUNTRIES.map((c) => (
                <option key={`${c.name}-${c.code}`} value={c.code}>
                  {c.name} (+{c.code})
                </option>
              ))}
            </select>
          </div>
          <Input
            label="WhatsApp number"
            type="tel"
            inputMode="tel"
            placeholder="98765 43210"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            hint="Without the country code. A leading 0 is removed. Or paste a full number that starts with +."
            autoComplete="off"
          />
        </div>

        <div>
          <p className="text-ds-text mb-1.5 text-[13px] font-medium">Start from a message</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Message templates">
            {TEMPLATES.map((t) => (
              <button
                key={t.label}
                type="button"
                aria-pressed={message === t.text}
                onClick={() => setMessage(t.text)}
                className={chip(message === t.text)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <Textarea
          label="Message ready to send (optional)"
          rows={3}
          placeholder="Hi, I would like to know more about…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <Input
          label="Campaign code (optional)"
          placeholder="diwali-poster"
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          hint="Added to the message as [ref: code], so each chat tells you which poster, ad or page it came from."
          autoComplete="off"
        />

        {result.error && (
          <p className="text-ds-warning-strong text-sm" role="alert">
            {result.error}
          </p>
        )}
        {result.notes.map((n) => (
          <p key={n} className="text-ds-muted text-sm">
            {n}
          </p>
        ))}
        <p className="text-ds-muted text-sm">
          Want UTM tags? A WhatsApp link opens WhatsApp, not your website, so it cannot carry them.
          Tag the link that leads to your site in the{' '}
          <Link href="/lab/utm-builder" className="text-ds-accent-strong underline">
            UTM builder
          </Link>
          , or make a QR code for anything else in the{' '}
          <Link href="/lab/qr-code-generator" className="text-ds-accent-strong underline">
            QR generator
          </Link>
          .
        </p>
      </div>

      <div className="border-ds-accent/30 bg-ds-surface2 rounded-xl border p-4 sm:p-5 lg:sticky lg:top-6">
        <h2 className="text-ds-text mb-3 text-base font-semibold">Your link</h2>
        {result.link ? (
          <div className="flex flex-col gap-4">
            <p className="text-ds-muted text-sm">
              Opens a chat with{' '}
              <span className="text-ds-text font-mono font-medium">+{result.digits}</span>. Check
              the number before you share it.
            </p>
            {result.text && (
              <p className="text-ds-muted text-sm">
                The message they will see:{' '}
                <span className="text-ds-text [overflow-wrap:anywhere]">{result.text}</span>
              </p>
            )}
            <code className="bg-ds-surface border-ds-border text-ds-text block rounded-lg border px-3 py-2 font-mono text-xs [overflow-wrap:anywhere]">
              {result.link}
            </code>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={() => copy(result.link, 'link')}>
                {copied === 'link' ? 'Copied ✓' : 'Copy link'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => copy(htmlSnippet(result.link), 'html')}
              >
                {copied === 'html' ? 'Copied ✓' : 'Copy as HTML link'}
              </Button>
              <a
                href={result.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackLab('whatsapp-link', 'test_open')}
                className="border-ds-border text-ds-text hover:border-ds-accent hover:text-ds-accent inline-flex items-center rounded-lg border px-3 py-1.5 text-sm transition-colors"
              >
                Test it
              </a>
            </div>
            <QrPanel
              key={result.link}
              text={result.link}
              fileBase="whatsapp-chat"
              printCaption="Scan to chat on WhatsApp"
              tool="whatsapp-link"
              kind="whatsapp"
            />
          </div>
        ) : (
          <p className="text-ds-muted text-sm">Enter a number and your link appears here.</p>
        )}
        <p className="text-ds-muted mt-4 text-xs">
          Nothing you type leaves your browser. The QR code is static, so it never expires.
        </p>
      </div>
    </div>
  )
}
