import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildUtmUrl, normalizeValue, lintRows, toCsv } from '../../lib/lab/utm.ts'
import { buildSearch, pick } from '../../lib/lab/urlState.ts'
import { escapeAttr, buildHtml, buildJsonLd, fitToWidth } from '../../lib/lab/metaTags.ts'

const fields = (over = {}) => ({
  url: 'https://example.com/lp',
  source: '',
  medium: '',
  campaign: '',
  term: '',
  content: '',
  ...over,
})

test('UTM values are lowercased and hyphenated, and the change is reported', () => {
  const r = buildUtmUrl(
    fields({ source: 'Google Ads', medium: 'CPC', campaign: 'Spring Sale 2026' })
  )
  assert.equal(
    r.url,
    'https://example.com/lp?utm_source=google-ads&utm_medium=cpc&utm_campaign=spring-sale-2026'
  )
  assert.equal(r.changes.length, 3)
})

test('UTM keeps existing query params and the hash, and rejects non-http URLs', () => {
  const r = buildUtmUrl(fields({ url: 'https://example.com/a?ref=1#top', source: 'x' }))
  assert.equal(r.url, 'https://example.com/a?ref=1&utm_source=x#top')
  assert.match(buildUtmUrl(fields({ url: 'javascript:alert(1)' })).error, /http/)
  assert.match(buildUtmUrl(fields({ url: 'example.com' })).error, /https/)
})

test('normalizeValue strips unsafe characters', () => {
  assert.equal(normalizeValue('  --Q4 & Beyond!!  '), 'q4-beyond')
})

test('lint flags unknown medium, alias source, duplicates and mixed separators', () => {
  const mk = (f) => ({ id: 'x', fields: fields(f), url: buildUtmUrl(fields(f)).url })
  const rows = [
    mk({ source: 'fb', medium: 'weird', campaign: 'a_b' }),
    mk({ source: 'fb', medium: 'weird', campaign: 'a_b' }),
    mk({ source: 'google', medium: 'cpc', campaign: 'a-b' }),
  ]
  const text = lintRows(rows).join('\n')
  assert.match(text, /not a standard GA4 medium/)
  assert.match(text, /use "facebook"/)
  assert.match(text, /same link as row 1/)
  assert.match(text, /mix/)
})

test('CSV quotes cells that contain commas', () => {
  const row = { id: '1', fields: fields({ source: 's' }), url: 'https://e.com/?a=1,2' }
  assert.match(toCsv([row]), /"https:\/\/e.com\/\?a=1,2"/)
})

test('URL state omits empty values and rejects values outside the allowed list', () => {
  assert.equal(buildSearch({ a: '', b: 'x y' }), '?b=x+y')
  assert.equal(buildSearch({ a: '' }), '')
  assert.equal(pick('nope', ['a', 'b'], 'a'), 'a')
  assert.equal(pick('b', ['a', 'b'], 'a'), 'b')
})

test('meta output escapes quotes, ampersands and angle brackets', () => {
  assert.equal(escapeAttr('He said "hi" & <b>'), 'He said &quot;hi&quot; &amp; &lt;b&gt;')
  const html = buildHtml({
    title: 'A "b"',
    description: 'd',
    url: '',
    siteName: '',
    image: '',
    twitter: '',
    type: 'website',
  })
  assert.match(html, /<title>A &quot;b&quot;<\/title>/)
  assert.ok(!html.includes('og:image'))
})

test('JSON-LD cannot close the script tag', () => {
  const out = buildJsonLd(
    {
      title: '</script><b>',
      description: '',
      url: 'https://e.com',
      siteName: '',
      image: '',
      twitter: '',
      type: 'website',
    },
    'WebPage'
  )
  assert.ok(!out.includes('</script><b>'))
  assert.ok(out.includes('\\u003c/script>'))
})

test('fitToWidth truncates with an ellipsis only when over budget', () => {
  const measure = (s) => s.length * 10
  assert.deepEqual(fitToWidth('short', 100, measure), {
    text: 'short',
    truncated: false,
    width: 50,
  })
  const r = fitToWidth('this is far too long', 100, measure)
  assert.equal(r.truncated, true)
  assert.ok(r.text.endsWith('…'))
  assert.ok(measure(r.text) <= 100)
})

test('splitUtm pulls utm values out of a pasted link and keeps the rest', async () => {
  const { splitUtm } = await import('../../lib/lab/utm.ts')
  const s = splitUtm('https://e.com/p?ref=1&utm_source=google&utm_medium=cpc&utm_campaign=x#top')
  assert.equal(s.base, 'https://e.com/p?ref=1#top')
  assert.equal(s.fields.source, 'google')
  assert.equal(splitUtm('https://e.com/p?ref=1'), null)
  assert.equal(splitUtm('not a url'), null)
})

test('buildMatrix makes one link per page per channel, or one per page for a custom channel', async () => {
  const { buildMatrix, PRESETS } = await import('../../lib/lab/utm.ts')
  const urls = ['https://a.com/1', 'https://a.com/2']
  const two = buildMatrix(urls, fields({ campaign: 'sale' }), [PRESETS[0], PRESETS[5]])
  assert.equal(two.length, 4)
  assert.match(
    two[1].result.url,
    /^https:\/\/a.com\/1\?utm_source=newsletter&utm_medium=email&utm_campaign=sale$/
  )
  const custom = buildMatrix(urls, fields({ source: 'Partner X', medium: 'referral' }), [])
  assert.equal(custom.length, 2)
  assert.match(custom[0].result.url, /utm_source=partner-x&utm_medium=referral/)
})

test('parseUrlList drops blanks and repeats, reports bad lines, caps the list', async () => {
  const { parseUrlList, MAX_BULK_URLS } = await import('../../lib/lab/utm.ts')
  const r = parseUrlList('https://a.com\n\n  https://a.com  \nnope\nftp://x.com\nhttps://b.com')
  assert.deepEqual(r.urls, ['https://a.com', 'https://b.com'])
  assert.deepEqual(
    r.invalid.map((i) => i.line),
    [4, 5]
  )
  const many = Array.from({ length: MAX_BULK_URLS + 5 }, (_, i) => `https://a.com/${i}`).join('\n')
  const capped = parseUrlList(many)
  assert.equal(capped.urls.length, MAX_BULK_URLS)
  assert.equal(capped.truncated, true)
})

test('withMonth appends the month once and cleans the name', async () => {
  const { withMonth } = await import('../../lib/lab/utm.ts')
  const nov = new Date(2026, 10, 5)
  assert.equal(withMonth('Spring Sale', nov), 'spring-sale-2026-11')
  assert.equal(withMonth('spring-sale-2026-11', nov), 'spring-sale-2026-11')
  assert.equal(withMonth('', nov), '2026-11')
})

test('matchPreset finds a preset from source and medium regardless of case', async () => {
  const { matchPreset, PRESETS } = await import('../../lib/lab/utm.ts')
  assert.equal(matchPreset('Google', 'CPC', PRESETS)?.label, 'Google Ads')
  assert.equal(matchPreset('x', 'y', PRESETS), undefined)
})

test('linkWarnings: long link and term on a non-paid medium', async () => {
  const { linkWarnings } = await import('../../lib/lab/utm.ts')
  assert.equal(linkWarnings(fields({ term: 'x', medium: 'email' }), 'https://e.com').length, 1)
  assert.equal(linkWarnings(fields({ term: 'x', medium: 'cpc' }), 'https://e.com').length, 0)
  assert.equal(linkWarnings(fields(), 'https://e.com/' + 'a'.repeat(2100)).length, 1)
})
