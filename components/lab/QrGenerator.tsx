'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input, Textarea } from '@/components/ui'
import {
  contactPayload,
  emailPayload,
  phonePayload,
  textPayload,
  upiPayload,
  websitePayload,
  whatsappPayload,
  wifiPayload,
  type Contact,
  type PayloadResult,
  type QrKind,
  type WifiSecurity,
} from '@/lib/lab/qrPayload'
import { QrPanel } from './QrPanel'

const KINDS: { id: QrKind; label: string; note: string }[] = [
  { id: 'website', label: 'Website', note: 'Anyone who scans opens this page.' },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    note: 'Opens a chat with this number, with your message ready to send. Include the country code.',
  },
  {
    id: 'upi',
    label: 'UPI payment',
    note: 'Opens a UPI app with the payee filled in. Check the name, and pay a small amount from another UPI app to test before you print. Nothing is stored.',
  },
  {
    id: 'wifi',
    label: 'Wi-Fi',
    note: 'Guests scan to join without typing. Anyone who scans can also read the password, so print it only where guests should have it.',
  },
  {
    id: 'contact',
    label: 'Contact card',
    note: 'Phones offer to save the contact. Everything you type is stored inside the code.',
  },
  { id: 'email', label: 'Email', note: 'Opens a new email to this address.' },
  { id: 'phone', label: 'Phone number', note: 'Opens the dialler with this number.' },
  { id: 'text', label: 'Text', note: 'Shows the text when scanned.' },
]

const EMPTY_CONTACT: Contact = {
  first: '',
  last: '',
  org: '',
  title: '',
  phone: '',
  email: '',
  url: '',
}

const chip = (active: boolean) =>
  active
    ? 'bg-ds-cta rounded-lg px-3 py-1.5 text-sm font-medium text-white'
    : 'border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent rounded-lg border px-3 py-1.5 text-sm transition-colors'

const selectClass =
  'border-ds-border bg-ds-surface2 text-ds-text focus:border-ds-accent h-[42px] w-full rounded-lg border px-3 text-[14px] outline-none'

/**
 * QR codes for the things people actually print: a website, a WhatsApp chat,
 * Wi-Fi, a contact card, an email, a phone number or plain text. Every code is
 * static (the content is stored in the pattern), so it never expires and
 * nothing is sent anywhere. Style, save and print come from QrPanel.
 */
export function QrGenerator() {
  const [kind, setKind] = useState<QrKind>('website')
  const [website, setWebsite] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [ssid, setSsid] = useState('')
  const [password, setPassword] = useState('')
  const [security, setSecurity] = useState<WifiSecurity>('WPA')
  const [hidden, setHidden] = useState(false)
  const [contact, setContact] = useState<Contact>(EMPTY_CONTACT)
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [text, setText] = useState('')
  const [upiId, setUpiId] = useState('')
  const [upiName, setUpiName] = useState('')
  const [upiAmount, setUpiAmount] = useState('')
  const [upiNote, setUpiNote] = useState('')

  const result: PayloadResult = (() => {
    switch (kind) {
      case 'website':
        return websitePayload(website)
      case 'whatsapp':
        return whatsappPayload(phone, message)
      case 'wifi':
        return wifiPayload(ssid, password, security, hidden)
      case 'contact':
        return contactPayload(contact)
      case 'email':
        return emailPayload(to, subject, body)
      case 'phone':
        return phonePayload(phone)
      case 'upi':
        return upiPayload(upiId, upiName, upiAmount, upiNote)
      case 'text':
        return textPayload(text)
    }
  })()
  const current = KINDS.find((k) => k.id === kind)!
  const setC = (key: keyof Contact) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setContact((prev) => ({ ...prev, [key]: e.target.value }))

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-start">
      <div className="flex flex-col gap-6">
        <div role="group" aria-label="What should the code open?" className="flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              aria-pressed={kind === k.id}
              onClick={() => setKind(k.id)}
              className={chip(kind === k.id)}
            >
              {k.label}
            </button>
          ))}
        </div>
        <p className="text-ds-muted text-sm">{current.note}</p>

        <div className="flex flex-col gap-4">
          {kind === 'website' && (
            <>
              <Input
                label="Website link"
                placeholder="https://yoursite.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                autoComplete="off"
              />
              <p className="text-ds-muted text-sm">
                Tracking a campaign? Tag the link first in the{' '}
                <Link href="/lab/utm-builder" className="text-ds-accent-strong underline">
                  UTM builder
                </Link>
                , which also makes QR codes.
              </p>
            </>
          )}

          {(kind === 'whatsapp' || kind === 'phone') && (
            <Input
              label={
                kind === 'whatsapp'
                  ? 'WhatsApp number with country code'
                  : 'Phone number with country code'
              }
              type="tel"
              inputMode="tel"
              placeholder="91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              hint="Country code first, no leading 0. India is 91, the US is 1."
              autoComplete="off"
            />
          )}
          {kind === 'whatsapp' && (
            <>
              <Textarea
                label="Message ready to send (optional)"
                rows={3}
                placeholder="Hi, I would like to know more about…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <p className="text-ds-muted text-sm">
                Easier with a country picker, message templates and a campaign code? Use the{' '}
                <Link
                  href="/lab/whatsapp-link-generator"
                  className="text-ds-accent-strong underline"
                >
                  WhatsApp link generator
                </Link>
                .
              </p>
            </>
          )}

          {kind === 'wifi' && (
            <>
              <Input
                label="Network name"
                value={ssid}
                onChange={(e) => setSsid(e.target.value)}
                autoComplete="off"
              />
              <div>
                <label
                  htmlFor="qr-wifi-security"
                  className="text-ds-text mb-1.5 block text-[13px] font-medium"
                >
                  Security
                </label>
                <select
                  id="qr-wifi-security"
                  value={security}
                  onChange={(e) => setSecurity(e.target.value as WifiSecurity)}
                  className={selectClass}
                >
                  <option value="WPA">WPA, WPA2 or WPA3 (most routers)</option>
                  <option value="WEP">WEP (very old routers)</option>
                  <option value="nopass">No password</option>
                </select>
              </div>
              {security !== 'nopass' && (
                <Input
                  label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="off"
                />
              )}
              <label className="text-ds-text flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={hidden}
                  onChange={(e) => setHidden(e.target.checked)}
                />
                The network is hidden
              </label>
            </>
          )}

          {kind === 'contact' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="First name" value={contact.first} onChange={setC('first')} />
              <Input label="Last name" value={contact.last} onChange={setC('last')} />
              <Input label="Company" value={contact.org} onChange={setC('org')} />
              <Input label="Job title" value={contact.title} onChange={setC('title')} />
              <Input
                label="Phone with country code"
                type="tel"
                value={contact.phone}
                onChange={setC('phone')}
              />
              <Input label="Email" type="email" value={contact.email} onChange={setC('email')} />
              <Input
                label="Website"
                wrapClass="sm:col-span-2"
                value={contact.url}
                onChange={setC('url')}
              />
            </div>
          )}

          {kind === 'email' && (
            <>
              <Input
                label="Send to"
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                autoComplete="off"
              />
              <Input
                label="Subject (optional)"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <Textarea
                label="Message (optional)"
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </>
          )}

          {kind === 'upi' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="UPI ID"
                placeholder="name@bank"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                autoComplete="off"
              />
              <Input
                label="Payee name"
                placeholder="As it should appear to the payer"
                value={upiName}
                maxLength={60}
                onChange={(e) => setUpiName(e.target.value)}
              />
              <Input
                label="Amount in rupees (optional)"
                inputMode="decimal"
                placeholder="250"
                value={upiAmount}
                hint="Leave blank to let the payer type the amount."
                onChange={(e) => setUpiAmount(e.target.value)}
              />
              <Input
                label="Note (optional)"
                placeholder="Invoice 1042"
                value={upiNote}
                maxLength={50}
                onChange={(e) => setUpiNote(e.target.value)}
              />
            </div>
          )}

          {kind === 'text' && (
            <Textarea
              label="Text"
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              hint="Up to 1000 characters."
            />
          )}
        </div>

        {result.error && (
          <p className="text-ds-warning-strong text-sm" role="alert">
            {result.error}
          </p>
        )}
      </div>

      <div className="border-ds-accent/30 bg-ds-surface2 rounded-xl border p-4 sm:p-5 lg:sticky lg:top-6">
        <h2 className="text-ds-text mb-3 text-base font-semibold">Your QR code</h2>
        {result.payload ? (
          <QrPanel
            text={result.payload}
            fileBase={`qr-${kind}`}
            printCaption={current.label}
            showText={kind !== 'wifi' && kind !== 'contact'}
            tool="qr-generator"
            kind={kind}
          />
        ) : (
          <p className="text-ds-muted text-sm">Fill in the form and your code appears here.</p>
        )}
        <p className="text-ds-muted mt-4 text-xs">
          Static code: the content is stored inside the pattern, so it never expires and there is no
          subscription. Nothing you type leaves your browser.
        </p>
      </div>
    </div>
  )
}
