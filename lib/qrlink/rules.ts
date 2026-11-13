// Pure rules for changeable QR links: which usernames are allowed and which destinations are
// safe to redirect to. Relative import only, so node:test can run it.
import { parseWebAddress } from '../lab/pageImage.ts'

const RESERVED = new Set([
  'admin',
  'api',
  'app',
  'about',
  'blog',
  'contact',
  'devstash',
  'help',
  'lab',
  'login',
  'logout',
  'me',
  'new',
  'privacy',
  'projects',
  'q',
  'root',
  'settings',
  'support',
  'terms',
  'test',
  'www',
  // names people trust, so nobody can borrow them to look official
  'amazon',
  'apple',
  'bank',
  'facebook',
  'gpay',
  'hdfc',
  'icici',
  'instagram',
  'linkedin',
  'microsoft',
  'paypal',
  'paytm',
  'phonepe',
  'sbi',
  'upi',
  'whatsapp',
  'google',
  'youtube',
  'twitter',
  'netflix',
])

/** Lowercase letters, digits and single hyphens; 3 to 20 characters. Returns the clean name or an error. */
export function checkUsername(input: string): { name: string } | { error: string } {
  const name = input.trim().toLowerCase()
  if (name.length < 3 || name.length > 20) return { error: 'Use 3 to 20 characters.' }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name))
    return { error: 'Use only letters, numbers and single hyphens, not at the start or end.' }
  if (RESERVED.has(name)) return { error: 'That name is reserved. Pick another.' }
  return { name }
}

/** A destination must be a public http(s) page that is not another changeable link. */
export function checkDestination(input: string): { url: string } | { error: string } {
  const parsed = parseWebAddress(input)
  if ('error' in parsed) return { error: parsed.error }
  if (parsed.url.pathname.startsWith('/q/'))
    return { error: 'Link to the final page, not to another changeable QR link.' }
  const url = parsed.url.toString()
  if (url.length > 2048) return { error: 'That address is too long.' }
  return { url }
}
