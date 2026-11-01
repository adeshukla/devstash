// Text that goes inside a QR code, for the QR generator. Pure, no React and no
// "@/" imports so node:test can run it. Each builder returns the payload or a
// plain-language error; an empty payload with no error means "nothing typed yet".

export type QrKind = 'website' | 'whatsapp' | 'wifi' | 'contact' | 'email' | 'phone' | 'text'

export interface PayloadResult {
  payload: string
  error: string
}

const empty: PayloadResult = { payload: '', error: '' }
const fail = (error: string): PayloadResult => ({ payload: '', error })
const ok = (payload: string): PayloadResult => ({ payload, error: '' })

export const MAX_TEXT = 1000

export function websitePayload(input: string): PayloadResult {
  const raw = input.trim()
  if (!raw) return empty
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return fail('Use an http or https link.')
    if (!u.hostname.includes('.') && u.hostname !== 'localhost')
      return fail('Add the full address, for example example.com.')
    return ok(u.toString())
  } catch {
    return fail('That link looks incomplete.')
  }
}

/** Digits only, the way wa.me and tel: links want them. Null when it cannot be a real number. */
export function phoneDigits(input: string): { digits: string; error: string } {
  const trimmed = input.trim()
  if (!trimmed) return { digits: '', error: '' }
  let digits = trimmed.replace(/\D/g, '')
  if (trimmed.startsWith('00')) digits = digits.slice(2)
  if (digits.startsWith('0'))
    return { digits: '', error: 'Start with the country code (91 for India), not 0.' }
  if (digits.length < 8 || digits.length > 15)
    return { digits: '', error: 'A full number with country code has 8 to 15 digits.' }
  return { digits, error: '' }
}

/** WhatsApp click-to-chat: https://wa.me/<number>?text=<message>. */
export function whatsappPayload(phone: string, message: string): PayloadResult {
  const { digits, error } = phoneDigits(phone)
  if (error) return fail(error)
  if (!digits) return empty
  const text = message.trim().slice(0, MAX_TEXT)
  return ok(`https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`)
}

export function phonePayload(phone: string): PayloadResult {
  const { digits, error } = phoneDigits(phone)
  if (error) return fail(error)
  return digits ? ok(`tel:+${digits}`) : empty
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function emailPayload(to: string, subject: string, body: string): PayloadResult {
  const address = to.trim()
  if (!address) return empty
  if (!EMAIL.test(address)) return fail('That email address looks incomplete.')
  const params = [
    subject.trim() && `subject=${encodeURIComponent(subject.trim())}`,
    body.trim() && `body=${encodeURIComponent(body.trim().slice(0, MAX_TEXT))}`,
  ].filter(Boolean)
  return ok(`mailto:${address}${params.length ? `?${params.join('&')}` : ''}`)
}

export type WifiSecurity = 'WPA' | 'WEP' | 'nopass'

const wifiEscape = (s: string) => s.replace(/([\\;,:"])/g, '\\$1')

/** WIFI:T:WPA;S:name;P:password;H:true;; as read by Android and iOS cameras. */
export function wifiPayload(
  ssid: string,
  password: string,
  security: WifiSecurity,
  hidden: boolean
): PayloadResult {
  if (!ssid) return empty
  if (security === 'WPA' && (password.length < 8 || password.length > 63))
    return fail('A WPA password is 8 to 63 characters.')
  if (security === 'WEP' && !password) return fail('Enter the network password.')
  const pass = security === 'nopass' ? '' : `P:${wifiEscape(password)};`
  return ok(`WIFI:T:${security};S:${wifiEscape(ssid)};${pass}${hidden ? 'H:true;' : ''};`)
}

export interface Contact {
  first: string
  last: string
  org: string
  title: string
  phone: string
  email: string
  url: string
}

const vEscape = (s: string) =>
  s.replace(/\\/g, '\\\\').replace(/[;,]/g, '\\$&').replace(/\r?\n/g, '\\n')

/** A vCard 3.0 contact card. */
export function contactPayload(c: Contact): PayloadResult {
  const first = c.first.trim()
  const last = c.last.trim()
  const org = c.org.trim()
  if (!first && !last && !org) return empty
  const phone = phoneDigits(c.phone)
  if (phone.error) return fail(phone.error)
  const email = c.email.trim()
  if (email && !EMAIL.test(email)) return fail('That email address looks incomplete.')
  const url = c.url.trim()
  const site = url ? websitePayload(url) : empty
  if (site.error) return fail(site.error)
  const name = [first, last].filter(Boolean).join(' ') || org
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${vEscape(last)};${vEscape(first)};;;`,
    `FN:${vEscape(name)}`,
    org && `ORG:${vEscape(org)}`,
    c.title.trim() && `TITLE:${vEscape(c.title.trim())}`,
    phone.digits && `TEL:+${phone.digits}`,
    email && `EMAIL:${vEscape(email)}`,
    site.payload && `URL:${site.payload}`,
    'END:VCARD',
  ].filter(Boolean)
  return ok(lines.join('\r\n'))
}

export function textPayload(input: string): PayloadResult {
  const text = input.trim()
  if (!text) return empty
  if (text.length > MAX_TEXT) return fail(`Keep it under ${MAX_TEXT} characters.`)
  return ok(text)
}
