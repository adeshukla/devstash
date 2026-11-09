// WhatsApp click-to-chat links for the Lab WhatsApp link generator. Pure, no React and no
// "@/" imports so node:test can run it.

import { phoneDigits, whatsappPayload } from './qrPayload.ts'
import { escapeAttr } from './metaTags.ts'
import { normalizeValue } from './utm.ts'

export interface Country {
  name: string
  /** International dial code, digits only. */
  code: string
}

export const COUNTRIES: Country[] = [
  { name: 'India', code: '91' },
  { name: 'United States / Canada', code: '1' },
  { name: 'United Kingdom', code: '44' },
  { name: 'United Arab Emirates', code: '971' },
  { name: 'Saudi Arabia', code: '966' },
  { name: 'Singapore', code: '65' },
  { name: 'Australia', code: '61' },
  { name: 'New Zealand', code: '64' },
  { name: 'Germany', code: '49' },
  { name: 'France', code: '33' },
  { name: 'Italy', code: '39' },
  { name: 'Spain', code: '34' },
  { name: 'Netherlands', code: '31' },
  { name: 'Turkey', code: '90' },
  { name: 'Russia / Kazakhstan', code: '7' },
  { name: 'Egypt', code: '20' },
  { name: 'South Africa', code: '27' },
  { name: 'Nigeria', code: '234' },
  { name: 'Kenya', code: '254' },
  { name: 'Pakistan', code: '92' },
  { name: 'Bangladesh', code: '880' },
  { name: 'Sri Lanka', code: '94' },
  { name: 'Nepal', code: '977' },
  { name: 'Indonesia', code: '62' },
  { name: 'Malaysia', code: '60' },
  { name: 'Philippines', code: '63' },
  { name: 'Japan', code: '81' },
  { name: 'Brazil', code: '55' },
  { name: 'Mexico', code: '52' },
]

export const TEMPLATES = [
  { label: 'Product enquiry', text: 'Hi, I would like to know more about your products.' },
  { label: 'Price list', text: 'Hi, please share your price list.' },
  { label: 'Book an appointment', text: 'Hi, I would like to book an appointment.' },
  { label: 'Order status', text: 'Hi, I would like to check on my order.' },
  { label: 'Need help', text: 'Hi, I need help with something.' },
]

export interface WaInput {
  /** Dial code of the chosen country, digits only. */
  country: string
  /** The number as typed: with or without the country code. */
  number: string
  message: string
  /** Optional campaign code added to the message so replies show where the chat came from. */
  ref: string
}

export interface WaResult {
  link: string
  /** The number as WhatsApp reads it: country code plus number, digits only. */
  digits: string
  /** The message that will be prefilled, including the campaign code. */
  text: string
  error: string
  /** Things done for the person that they should know about. */
  notes: string[]
}

const blank: WaResult = { link: '', digits: '', text: '', error: '', notes: [] }

/** The prefilled message with the campaign code added: "Hi [ref: diwali-26]". */
export function withRef(message: string, ref: string): string {
  const code = normalizeValue(ref)
  const text = message.trim()
  if (!code) return text
  return `${text || 'Hi'} [ref: ${code}]`
}

/**
 * Builds the wa.me link. A number starting with + or 00 is taken as complete. Otherwise the
 * chosen country code is added, a leading 0 is dropped, and a country code the person already
 * typed is not added twice.
 */
export function buildWhatsAppLink(input: WaInput): WaResult {
  const typed = input.number.trim()
  if (!typed) return blank
  const notes: string[] = []
  const complete = typed.startsWith('+') || typed.startsWith('00')

  let international = typed
  if (!complete) {
    let national = typed.replace(/\D/g, '').replace(/^0+/, '')
    if (!national) return { ...blank, error: 'Enter the number without the country code.' }
    if (national.startsWith(input.country) && national.length > 10) {
      national = national.slice(input.country.length)
      notes.push(`Removed the +${input.country} you typed, so it is not added twice.`)
    }
    international = `+${input.country}${national}`
  }

  const { digits, error } = phoneDigits(international)
  if (error) return { ...blank, error }

  const text = withRef(input.message, input.ref)
  const made = whatsappPayload(`+${digits}`, text)
  if (made.error) return { ...blank, error: made.error }
  return { link: made.payload, digits, text, error: '', notes }
}

/** A plain link to paste into a page. The link opens WhatsApp, so it opens in a new tab. */
export function htmlSnippet(link: string, label = 'Chat on WhatsApp'): string {
  return `<a href="${escapeAttr(link)}" target="_blank" rel="noopener noreferrer">${escapeAttr(label)}</a>`
}
