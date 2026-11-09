// GA4 custom events: naming checks and the code to send them. Pure, no React and no "@/"
// imports so node:test can run it. The rules and the recommended events below come from Google's
// own documentation, read on 2026-11-09 (support.google.com/analytics answers 13316687, 9267744
// and 6366371, and developers.google.com/analytics/devguides/collection/ga4). Google changes
// these, so re-check them from time to time.

export const MAX_EVENT_NAME = 40
export const MAX_PARAMS = 25
export const MAX_PARAM_NAME = 40
export const MAX_PARAM_VALUE = 100
/** Parameters Google gives a longer value limit. */
export const VALUE_LIMITS: Record<string, number> = {
  page_title: 300,
  page_referrer: 420,
  page_location: 1000,
}

/** Event names Google reserves for web data streams. */
export const RESERVED_EVENTS = [
  'ad_impression',
  'app_remove',
  'app_store_refund',
  'app_store_subscription_cancel',
  'app_store_subscription_renew',
  'click',
  'error',
  'file_download',
  'first_open',
  'first_visit',
  'form_start',
  'form_submit',
  'in_app_purchase',
  'page_view',
  'scroll',
  'session_start',
  'user_engagement',
  'view_complete',
  'video_progress',
  'video_start',
  'view_search_results',
]

/** Google documents only this one as a reserved event-name prefix for web. */
const RESERVED_EVENT_PREFIX = 'query_id'
/** Reserved for parameter names. Used in event names they are not documented as blocked. */
const RESERVED_PARAM_PREFIXES = ['_', 'firebase_', 'ga_', 'google_', 'gtag.']

export interface Param {
  name: string
  value: string
}

export interface Issue {
  level: 'problem' | 'tip'
  text: string
}

const problem = (text: string): Issue => ({ level: 'problem', text })
const tip = (text: string): Issue => ({ level: 'tip', text })

export function validateEventName(name: string): Issue[] {
  const n = name.trim()
  if (!n) return []
  const out: Issue[] = []
  if (!/^\p{L}/u.test(n)) out.push(problem('An event name must start with a letter.'))
  else if (!/^[\p{L}\p{M}\p{N}_]+$/u.test(n))
    out.push(problem('Use only letters, numbers and underscores. No spaces or other symbols.'))
  if (n.length > MAX_EVENT_NAME)
    out.push(
      problem(
        `${n.length} characters is over the ${MAX_EVENT_NAME}-character limit. GA4 does not log the event.`
      )
    )
  if (RESERVED_EVENTS.includes(n))
    out.push(problem(`"${n}" is a name Google reserves, so you cannot use it for your own event.`))
  if (n.startsWith(RESERVED_EVENT_PREFIX))
    out.push(problem(`Names starting with ${RESERVED_EVENT_PREFIX} are reserved.`))
  if (n !== n.toLowerCase())
    out.push(
      tip(
        `Event names are case sensitive: "${n}" and "${n.toLowerCase()}" would be two different events. Lowercase with underscores is the usual choice.`
      )
    )
  if (RESERVED_PARAM_PREFIXES.some((p) => p !== '_' && n.startsWith(p)))
    out.push(
      tip('Google reserves google_, ga_ and firebase_ for its own names. Avoid them to be safe.')
    )
  return out
}

const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/
const LONG_DIGITS = /(?:\d[\s().-]?){10,}/

export function validateParams(params: Param[]): Issue[] {
  const out: Issue[] = []
  const filled = params.filter((p) => p.name.trim() || p.value.trim())
  if (filled.length > MAX_PARAMS)
    out.push(
      problem(
        `${filled.length} parameters is over the limit of ${MAX_PARAMS} per event. GA4 drops the extra ones.`
      )
    )
  const seen = new Set<string>()
  for (const p of filled) {
    const name = p.name.trim()
    const value = p.value.trim()
    if (!name) {
      out.push(problem(`A parameter has a value ("${value.slice(0, 20)}") but no name.`))
      continue
    }
    if (seen.has(name)) out.push(problem(`"${name}" is used twice. Only one value is sent.`))
    seen.add(name)
    if (!/^\p{L}[\p{L}\p{M}\p{N}_]*$/u.test(name))
      out.push(
        problem(`Parameter "${name}": start with a letter and use only letters, numbers and _.`)
      )
    if (name.length > MAX_PARAM_NAME)
      out.push(
        problem(`Parameter name "${name.slice(0, 20)}…" is over ${MAX_PARAM_NAME} characters.`)
      )
    const prefix = RESERVED_PARAM_PREFIXES.find((r) => name.startsWith(r))
    if (prefix) out.push(problem(`Parameter names cannot start with "${prefix}" (reserved).`))
    const limit = VALUE_LIMITS[name] ?? MAX_PARAM_VALUE
    if (value.length > limit)
      out.push(
        problem(`The value of "${name}" is ${value.length} characters. The limit is ${limit}.`)
      )
    if (EMAIL.test(value))
      out.push(
        problem(
          `The value of "${name}" looks like an email address. Google's policy forbids sending personal data such as emails or phone numbers.`
        )
      )
    else if (LONG_DIGITS.test(value))
      out.push(
        tip(
          `The value of "${name}" has a long run of digits. If it could be a phone number, do not send it: Google forbids personal data.`
        )
      )
  }
  return out
}

export interface Template {
  id: string
  label: string
  /** Parameters to start from. required ones are marked in Google's table. */
  params: { name: string; example: string; required?: boolean }[]
  /** The event needs an items array. */
  items?: boolean
}

export const TEMPLATES: Template[] = [
  {
    id: 'generate_lead',
    label: 'generate_lead',
    params: [
      { name: 'currency', example: 'INR', required: true },
      { name: 'value', example: '500', required: true },
      { name: 'lead_source', example: 'Trade show' },
    ],
  },
  {
    id: 'sign_up',
    label: 'sign_up',
    params: [{ name: 'method', example: 'Google' }],
  },
  {
    id: 'login',
    label: 'login',
    params: [{ name: 'method', example: 'Google' }],
  },
  {
    id: 'search',
    label: 'search',
    params: [{ name: 'search_term', example: 't-shirts', required: true }],
  },
  {
    id: 'share',
    label: 'share',
    params: [
      { name: 'method', example: 'WhatsApp' },
      { name: 'content_type', example: 'article' },
      { name: 'item_id', example: 'C12345' },
    ],
  },
  {
    id: 'select_content',
    label: 'select_content',
    params: [
      { name: 'content_type', example: 'product' },
      { name: 'content_id', example: 'C_12345' },
    ],
  },
  {
    id: 'view_item',
    label: 'view_item',
    items: true,
    params: [
      { name: 'currency', example: 'INR', required: true },
      { name: 'value', example: '499', required: true },
    ],
  },
  {
    id: 'add_to_cart',
    label: 'add_to_cart',
    items: true,
    params: [
      { name: 'currency', example: 'INR', required: true },
      { name: 'value', example: '499', required: true },
    ],
  },
  {
    id: 'begin_checkout',
    label: 'begin_checkout',
    items: true,
    params: [
      { name: 'currency', example: 'INR', required: true },
      { name: 'value', example: '499', required: true },
      { name: 'coupon', example: 'DIWALI10' },
    ],
  },
  {
    id: 'purchase',
    label: 'purchase',
    items: true,
    params: [
      { name: 'transaction_id', example: 'T_12345', required: true },
      { name: 'currency', example: 'INR', required: true },
      { name: 'value', example: '499', required: true },
      { name: 'shipping', example: '40' },
      { name: 'tax', example: '25' },
      { name: 'coupon', example: 'DIWALI10' },
    ],
  },
]

const isNumber = (s: string) => /^-?(0|[1-9]\d{0,14})(\.\d+)?$/.test(s.trim())

/** Checks that a recommended event has what Google's table requires, and sends numbers as numbers. */
export function validateRecommended(name: string, params: Param[], items: boolean): Issue[] {
  const t = TEMPLATES.find((x) => x.id === name.trim())
  if (!t) return []
  const out: Issue[] = []
  const get = (n: string) => params.find((p) => p.name.trim() === n)?.value.trim() ?? ''
  for (const p of t.params) {
    if (p.required && !get(p.name))
      out.push(problem(`Google lists "${p.name}" as required for ${t.id}.`))
  }
  if (t.items && !items)
    out.push(
      problem(`${t.id} needs an items array: include one (item_id or item_name is required).`)
    )
  const value = get('value')
  if (value && !isNumber(value))
    out.push(
      problem('"value" must be a number, for example 499 or 499.50, without a currency symbol.')
    )
  if (value && !get('currency'))
    out.push(problem('"currency" is required if you set "value", for example INR or USD.'))
  const currency = get('currency')
  if (currency && !/^[A-Z]{3}$/.test(currency))
    out.push(tip('"currency" should be a three-letter code in capitals, for example INR.'))
  if (t.id === 'select_content') {
    const id = get('content_id')
    if (id && /^\d+$/.test(id))
      out.push(problem('"content_id" must include at least one character that is not a digit.'))
  }
  return out
}

/** All the checks together, problems first. */
export function checkEvent(name: string, params: Param[], items: boolean): Issue[] {
  const all = [
    ...validateEventName(name),
    ...validateParams(params),
    ...validateRecommended(name, params, items),
  ]
  return [...all.filter((i) => i.level === 'problem'), ...all.filter((i) => i.level === 'tip')]
}

/** A single-quoted JavaScript string. "<" is escaped so the code is safe inside a script tag. */
export function jsString(s: string): string {
  return `'${s
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r?\n/g, '\\n')
    .replace(/</g, '\\u003c')}'`
}

/** A number stays a number (value, shipping, tax); everything else is a string. */
export function jsValue(s: string): string {
  return isNumber(s) ? s.trim() : jsString(s.trim())
}

const key = (n: string) => (/^[A-Za-z_$][\w$]*$/.test(n) ? n : jsString(n))

const ITEMS_LINE = "items: [{ item_id: 'SKU_12345', item_name: 'Example product' }],"

function fields(params: Param[], items: boolean, indent: string): string[] {
  const lines = params
    .filter((p) => p.name.trim())
    .map((p) => `${indent}${key(p.name.trim())}: ${jsValue(p.value)},`)
  if (items) lines.push(`${indent}${ITEMS_LINE}`)
  return lines
}

/** For Google Tag Manager: push the event to the data layer. */
export function buildDataLayer(name: string, params: Param[], items: boolean): string {
  if (!name.trim()) return ''
  return [
    'window.dataLayer = window.dataLayer || [];',
    'window.dataLayer.push({',
    `  event: ${jsString(name.trim())},`,
    ...fields(params, items, '  '),
    '});',
  ].join('\n')
}

/** For gtag.js: send the event straight to GA4. */
export function buildGtag(name: string, params: Param[], items: boolean): string {
  if (!name.trim()) return ''
  const body = fields(params, items, '  ')
  return body.length
    ? [`gtag('event', ${jsString(name.trim())}, {`, ...body, '});'].join('\n')
    : `gtag('event', ${jsString(name.trim())});`
}
