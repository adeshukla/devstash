import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildPackHtml } from '../../lib/lab/campaignPack.ts'
import {
  websitePayload,
  whatsappPayload,
  phonePayload,
  emailPayload,
  wifiPayload,
  contactPayload,
  textPayload,
} from '../../lib/lab/qrPayload.ts'
import { analyzeLink, adsSuffix } from '../../lib/lab/utmCheck.ts'
import { makeQr, qrSvg, contrastRatio, scanWarning } from '../../lib/lab/qr.ts'
import {
  parseChannelLines,
  encodeRules,
  decodeRules,
  rulesVersion,
  ruleIssues,
} from '../../lib/lab/utmRules.ts'
import { withMonth, placeholdersFor } from '../../lib/lab/utm.ts'
import {
  buildUtmUrl,
  normalizeValue,
  lintRows,
  toCsv,
  ga4Channel,
  parseSheet,
} from '../../lib/lab/utm.ts'
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
  assert.match(text, /under Unassigned/)
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

test('GA4 channel follows the default grouping rules', () => {
  assert.equal(ga4Channel('google', 'cpc'), 'Paid Search')
  assert.equal(ga4Channel('Facebook', 'paid-social'), 'Paid Social')
  assert.equal(ga4Channel('facebook', 'cpc'), 'Paid Social')
  assert.equal(ga4Channel('linkedin', 'social'), 'Organic Social')
  assert.equal(ga4Channel('newsletter', 'email'), 'Email')
  assert.equal(ga4Channel('acme', 'ppc-ads'), 'Unassigned')
  assert.equal(ga4Channel('', ''), '')
})

test('sheet import reads headers in any order, cleans values and reports bad lines', () => {
  const r = parseSheet(
    'campaign,url,utm_source,medium\n"Spring Sale",https://a.com/1,Google,cpc\n,nope,x,y\n,https://b.com/?utm_source=bing&utm_medium=cpc&utm_campaign=q,,'
  )
  assert.equal(r.rows.length, 2)
  assert.match(r.rows[0].url, /utm_campaign=spring-sale/)
  assert.match(r.rows[0].url, /utm_source=google/)
  assert.deepEqual(
    r.errors.map((e) => e.line),
    [3]
  )
  assert.match(r.rows[1].url, /utm_source=bing&utm_medium=cpc&utm_campaign=q/)
  assert.equal(r.fixed, 1)
})

test('sheet import without a header uses url, source, medium, campaign order', () => {
  const r = parseSheet('https://a.com\tgoogle\tcpc\tsale')
  assert.match(r.rows[0].url, /utm_campaign=sale/)
})

test('ad-platform placeholders survive cleaning and keep raw braces in the link', () => {
  const r = buildUtmUrl(
    fields({
      source: 'google',
      medium: 'cpc',
      campaign: 'Spring Sale',
      term: '{keyword}',
      content: 'v1-{creative}',
    })
  )
  assert.match(r.url, /utm_term=\{keyword\}/)
  assert.match(r.url, /utm_content=v1-\{creative\}/)
  assert.match(r.url, /utm_campaign=spring-sale/)
  assert.equal(normalizeValue('{notreal} Hi'), 'notreal-hi')
  assert.equal(placeholdersFor('Facebook')[0].token, '{{campaign.name}}')
})

test('separator rule rewrites campaign words but not source or medium', () => {
  const r = buildUtmUrl(
    fields({ source: 'my-src', medium: 'cpc', campaign: 'Spring Sale-2026' }),
    '_'
  )
  assert.match(r.url, /utm_campaign=spring_sale_2026/)
  assert.match(r.url, /utm_source=my-src/)
  assert.equal(withMonth('spring', new Date(2026, 10, 3), '_'), 'spring_2026_11')
})

test('CSV export carries the GA4 channel and audit columns', () => {
  const row = {
    id: '1',
    fields: fields({ source: 'google', medium: 'cpc' }),
    url: 'https://e.com/',
    createdAt: '2026-11-02',
    owner: 'Ana',
    rules: 'abc123',
  }
  const [head, line] = toCsv([row]).split('\n')
  assert.match(head, /ga4_channel,created_at,owner,rules_version$/)
  assert.match(line, /Paid Search,2026-11-02,Ana,abc123$/)
})

test('team rules round-trip through a share link and flag rows that break them', () => {
  const { channels, errors } = parseChannelLines(
    'Google Ads, google, cpc\nbad line\nNewsletter, Newsletter, Email'
  )
  assert.equal(channels.length, 2)
  assert.deepEqual(
    errors.map((e) => e.line),
    [2]
  )
  const rules = { channels, separator: '_' }
  assert.deepEqual(decodeRules(encodeRules(rules)), { channels, separator: '_' })
  assert.equal(decodeRules('not-base64!'), null)
  assert.equal(rulesVersion(rules), rulesVersion({ channels, separator: '_' }))
  const rows = [
    { id: '1', fields: fields({ source: 'tiktok', medium: 'cpc', campaign: 'a-b' }), url: 'u1' },
    { id: '2', fields: fields({ source: 'google', medium: 'cpc', campaign: 'a_b' }), url: 'u2' },
  ]
  const text = ruleIssues(rows, rules).join('\n')
  assert.match(text, /Row 1: tiktok\/cpc is not one of the team/)
  assert.match(text, /Row 1: campaign "a-b" should use "_"/)
  assert.doesNotMatch(text, /Row 2/)
})

test('QR contrast and scan warnings', () => {
  assert.equal(Math.round(contrastRatio('#000000', '#ffffff')), 21)
  assert.equal(scanWarning({ fg: '#000000', bg: '#ffffff' }), '')
  assert.match(scanWarning({ fg: '#ffffff', bg: '#000000' }), /light code on a dark/i)
  assert.match(scanWarning({ fg: '#777777', bg: '#999999' }), /too close/i)
})

test('QR code is generated, captioned and escaped; oversized text throws', async () => {
  const qr = await makeQr('https://example.com/?utm_source=google', 'M')
  assert.ok(qr.size > 20 && qr.path.startsWith('M'))
  const svg = qrSvg(qr, { fg: '#000', bg: '#fff', label: 'Scan <me>' }, 512)
  assert.match(svg, /Scan &#60;me&#62;/)
  assert.match(svg, /width="512"/)
  assert.doesNotMatch(qrSvg(qr, { fg: '#000', bg: '#fff', label: '' }), /<text/)
  await assert.rejects(() => makeQr('x'.repeat(5000), 'M'))
})

test('QR payloads: website, WhatsApp, phone and email', () => {
  assert.equal(websitePayload('example.com/a').payload, 'https://example.com/a')
  assert.match(websitePayload('example').error, /full address/)
  assert.match(websitePayload('ftp://example.com').error, /http/)
  assert.equal(
    whatsappPayload('+91 98765-43210', 'Hi there & welcome').payload,
    'https://wa.me/919876543210?text=Hi%20there%20%26%20welcome'
  )
  assert.equal(whatsappPayload('0044 7911 123456', '').payload, 'https://wa.me/447911123456')
  assert.match(whatsappPayload('07911123456', '').error, /country code/)
  assert.match(whatsappPayload('12345', '').error, /8 to 15/)
  assert.equal(phonePayload('+44 7911 123456').payload, 'tel:+447911123456')
  assert.equal(
    emailPayload('a@b.co', 'Hello there', '').payload,
    'mailto:a@b.co?subject=Hello%20there'
  )
  assert.match(emailPayload('nope', '', '').error, /incomplete/)
  assert.deepEqual(whatsappPayload('', ''), { payload: '', error: '' })
})

test('QR payloads: Wi-Fi escapes special characters and checks WPA length', () => {
  assert.equal(
    wifiPayload('Cafe;Net', 'pa:ss;word1', 'WPA', true).payload,
    'WIFI:T:WPA;S:Cafe\\;Net;P:pa\\:ss\\;word1;H:true;;'
  )
  assert.equal(wifiPayload('Open', '', 'nopass', false).payload, 'WIFI:T:nopass;S:Open;;')
  assert.match(wifiPayload('Net', 'short', 'WPA', false).error, /8 to 63/)
})

test('QR payloads: contact card is a valid vCard and text has a limit', () => {
  const v = contactPayload({
    first: 'Ana',
    last: 'Rao',
    org: 'Acme, Inc',
    title: '',
    phone: '+91 98765 43210',
    email: 'ana@acme.co',
    url: 'acme.co',
  }).payload
  assert.equal(
    v,
    [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'N:Rao;Ana;;;',
      'FN:Ana Rao',
      'ORG:Acme\\, Inc',
      'TEL:+919876543210',
      'EMAIL:ana@acme.co',
      'URL:https://acme.co/',
      'END:VCARD',
    ].join('\r\n')
  )
  assert.match(
    contactPayload({ first: 'A', last: '', org: '', title: '', phone: '', email: 'bad', url: '' })
      .error,
    /email/
  )
  assert.match(textPayload('x'.repeat(1001)).error, /under 1000/)
})

test('link checker explains problems and builds a cleaned link', () => {
  const a = analyzeLink(
    'https://example.com/p?utm_source=Google&utm_medium=cpc&UTM_Campaign=Spring Sale&ref=1'
  )
  assert.equal(a.channel, 'Paid Search')
  const text = a.issues.map((i) => i.text).join('\n')
  assert.match(text, /utm_source has capital letters/)
  assert.match(text, /"UTM_Campaign" will not be read/)
  assert.equal(
    a.cleaned,
    'https://example.com/p?ref=1&utm_source=google&utm_medium=cpc&utm_campaign=spring-sale'
  )
  const none = analyzeLink('https://example.com/')
  assert.match(none.issues[0].text, /no UTM parameters/)
  assert.equal(none.cleaned, '')
  assert.match(analyzeLink('nope').error, /full link/)
  const bad = analyzeLink('https://e.com/?utm_source=acme&utm_medium=ppc-ads&utm_campaign=x')
  assert.match(bad.issues.map((i) => i.text).join('\n'), /Unassigned/)
  assert.match(
    analyzeLink('https://e.com/#utm_source=a')
      .issues.map((i) => i.text)
      .join(),
    /after a #/
  )
  const good = analyzeLink('https://e.com/?utm_source=google&utm_medium=cpc&utm_campaign=ok')
  assert.equal(good.issues.filter((i) => i.level === 'problem').length, 0)
  assert.equal(good.cleaned, '')
})

test('Google Ads suffix keeps only utm_ parameters without the question mark', () => {
  assert.equal(
    adsSuffix('https://e.com/p?a=1&utm_source=google&utm_term={keyword}#x'),
    'utm_source=google&utm_term={keyword}'
  )
  assert.equal(adsSuffix('https://e.com/'), '')
})

test('campaign pack escapes every value and keeps the QR markup', () => {
  const html = buildPackHtml({
    title: 'Pack <script>x</script>',
    owner: 'A&B',
    date: '2026-11-02',
    rules: 'abc123',
    issues: ['Row 1: <b>bad</b>'],
    items: [
      {
        url: 'https://e.com/?a=1&b=2',
        source: 'google',
        medium: 'cpc',
        campaign: 'c"q',
        channel: 'Paid Search',
        svg: '<svg id="qr"></svg>',
      },
      {
        url: 'https://e.com/?utm_term={keyword}',
        source: 'google',
        medium: 'cpc',
        campaign: 'k',
        channel: 'Paid Search',
        svg: '',
      },
    ],
  })
  assert.doesNotMatch(html, /<script>x/)
  assert.doesNotMatch(html, /<b>bad/)
  assert.match(html, /a=1&#38;b=2/)
  assert.match(html, /Owner: A&#38;B/)
  assert.ok(html.includes('<svg id="qr"></svg>'))
  assert.match(html, /No QR: placeholders/)
  assert.match(html, /2 links/)
})
