import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildWhatsAppLink, withRef, htmlSnippet, COUNTRIES } from '../../lib/lab/whatsapp.ts'
import {
  parseRobots,
  isAllowed,
  checkCrawlers,
  CRAWLERS,
  TRAINING_TOKENS,
} from '../../lib/lab/aiCrawlers.ts'
import { auditHead } from '../../lib/lab/metaAudit.ts'
import { pickIcon, pickIcons, iconSvg, heroArt, ringsSvg } from '../../lib/ai/landingGraphics.ts'
import {
  cleanReport,
  mergedTsv,
  mappingTsv,
  lookerCase,
  lookerField,
  applyNames,
  rememberable,
} from '../../lib/lab/reportClean.ts'
import { buildWorkspace, parseWorkspace, mergeRows } from '../../lib/lab/workspace.ts'
import { buildPackHtml } from '../../lib/lab/campaignPack.ts'
import {
  websitePayload,
  whatsappPayload,
  phonePayload,
  emailPayload,
  wifiPayload,
  contactPayload,
  textPayload,
  upiPayload,
} from '../../lib/lab/qrPayload.ts'
import { analyzeLink, adsSuffix } from '../../lib/lab/utmCheck.ts'
import { makeQr, qrSvg, contrastRatio, scanWarning } from '../../lib/lab/qr.ts'
import {
  parseChannelLines,
  encodeRules,
  decodeRules,
  rulesVersion,
  ruleIssues,
  patternError,
  matchesPattern,
  patternExample,
} from '../../lib/lab/utmRules.ts'
import { withMonth, placeholdersFor } from '../../lib/lab/utm.ts'
import {
  buildUtmUrl,
  normalizeValue,
  lintRows,
  toCsv,
  ga4Channel,
  parseSheet,
  parseVariants,
  buildMatrix,
  parseUrlList,
  withScheme,
} from '../../lib/lab/utm.ts'
import { buildSearch, pick } from '../../lib/lab/urlState.ts'
import { escapeAttr, buildHtml, buildJsonLd, fitToWidth } from '../../lib/lab/metaTags.ts'
import {
  parseFaqs,
  buildFaqJsonLd,
  buildRobotsTs,
  buildSitemapTs,
  buildOgImageTsx,
  origin,
} from '../../lib/lab/seoKit.ts'

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
  // A bare domain is completed with https://; a plain word is still refused.
  assert.equal(
    buildUtmUrl(fields({ url: 'example.com', source: 'x' })).url,
    'https://example.com/?utm_source=x'
  )
  assert.match(buildUtmUrl(fields({ url: 'example' })).error, /https/)
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

test('report cleaner merges campaign variants, sums additive metrics and skips rates', () => {
  const r = cleanReport(
    [
      '# ----------------------------------------',
      '# Session campaign',
      '# ----------------------------------------',
      'Session campaign,Sessions,Engagement rate',
      'spring-sale,1200,0.67',
      'Spring_Sale,300,0.5',
      'spring sale,90,0.44',
      'winter-promo,500,0.6',
    ].join('\n'),
    '-'
  )
  assert.equal(r.error, '')
  assert.deepEqual(r.metricNames, ['Sessions'])
  assert.deepEqual(r.skippedMetrics, ['Engagement rate'])
  assert.equal(r.groups.length, 2)
  const g = r.groups[0]
  assert.equal(g.canonical, 'spring-sale')
  assert.equal(g.split, true)
  assert.deepEqual(
    g.variants.map((v) => v.raw),
    ['spring-sale', 'Spring_Sale', 'spring sale']
  )
  assert.deepEqual(g.totals, [1590])
  assert.equal(r.groups[1].split, false)
  assert.match(
    lookerCase(r),
    /WHEN Session campaign IN \("Spring_Sale", "spring sale"\) THEN "spring-sale"/
  )
  assert.match(
    mappingTsv(r),
    /^Original\tClean\nspring-sale\tspring-sale\nSpring_Sale\tspring-sale/
  )
  assert.match(mergedTsv(r), /^Session campaign\tVariants merged\tSessions\nspring-sale\t3\t1590/)
})

test('report cleaner treats fb and facebook as one source, honours the separator, keeps (not set)', () => {
  const r = cleanReport(
    [
      'Session source / medium,Sessions',
      'fb / paid-social,10',
      'facebook / Paid_Social,5',
      '(not set),2',
      '(Not Set),1',
    ].join('\n'),
    '_'
  )
  assert.equal(r.groups[0].canonical, 'facebook / paid_social')
  assert.equal(r.groups[0].totals[0], 15)
  const unset = r.groups.find((g) => g.canonical === '(not set)')
  assert.equal(unset.variants.length, 2)
})

test('report cleaner reads a plain list and does not mistake a label for a header', () => {
  const r = cleanReport('content-marketing\nContent_Marketing\nother', '-')
  assert.equal(r.dims[0], 'Value')
  assert.equal(r.groups[0].canonical, 'content-marketing')
  assert.equal(r.groups[0].variants.length, 2)
  assert.equal(cleanReport('', '-').rowCount, 0)
  assert.match(cleanReport('Sessions,Users\n5,6', '-').error, /Add a header row/)
})

test('workspace backup round-trips, rejects foreign files and merges rows without duplicates', () => {
  const row = (id, url) => ({
    id,
    url,
    fields: {
      url: 'https://e.com',
      source: 'google',
      medium: 'cpc',
      campaign: 'c',
      term: '',
      content: '',
    },
  })
  const ws = buildWorkspace(
    {
      sheet: [row('1', 'https://e.com/?a'), row('2', 'https://e.com/?b')],
      presets: [{ label: 'Acme', source: 'acme', medium: 'referral' }],
      rules: 'abc',
      owner: 'Priya',
      aliases: { 'fb-ads': 'facebook-ads' },
    },
    new Date('2026-11-02T00:00:00Z')
  )
  const parsed = parseWorkspace(JSON.stringify(ws))
  assert.equal(parsed.error, '')
  assert.deepEqual(parsed.data.aliases, { 'fb-ads': 'facebook-ads' })
  assert.equal(parsed.data.sheet.length, 2)
  assert.match(parseWorkspace('{"app":"other","version":1}').error, /not a backup/)
  assert.match(parseWorkspace('nope').error, /not a backup/)
  assert.match(parseWorkspace('{"app":"devstash-utm","version":2}').error, /newer version/)
  const broken = parseWorkspace(
    JSON.stringify({
      ...ws,
      sheet: [{ id: 1 }, row('3', 'https://e.com/?c')],
      aliases: { a: 5, b: 'ok' },
    })
  )
  assert.equal(broken.data.sheet.length, 1)
  assert.deepEqual(broken.data.aliases, { b: 'ok' })
  const merged = mergeRows([row('9', 'https://e.com/?a')], ws.sheet)
  assert.equal(merged.added, 1)
  assert.equal(merged.rows.length, 2)
})

test('cleaner applies remembered merges and custom names, and lists merges to remember', () => {
  const text = ['Session campaign,Sessions', 'facebook-ads,100', 'fb-ads,20', 'brand,5'].join('\n')
  const plain = cleanReport(text, '-')
  assert.equal(plain.groups.filter((g) => g.split).length, 0)
  const r = cleanReport(text, '-', { 'fb-ads': 'facebook-ads' })
  const g = r.groups[0]
  assert.equal(g.canonical, 'facebook-ads')
  assert.equal(g.split, true)
  assert.deepEqual(g.totals, [120])
  assert.equal(g.variants.find((v) => v.raw === 'fb-ads').remembered, true)
  const named = applyNames(r, { 'facebook-ads': 'meta-ads' })
  assert.equal(named.groups[0].canonical, 'meta-ads')
  assert.deepEqual(rememberable(named), { 'facebook-ads': 'meta-ads', 'fb-ads': 'meta-ads' })
  assert.match(mappingTsv(named), /fb-ads\tmeta-ads/)
})

test('landing graphics: icons match the text, never repeat in a row, and every art is well-formed', () => {
  assert.equal(pickIcon('Your data stays private and secure', 0), 'shield')
  assert.equal(pickIcon('Reports delivered every month', 0), 'chart')
  assert.equal(pickIcon('Something with no keyword at all', 1), 'check')
  const icons = pickIcons(['Fast setup', 'Quick start', 'Speedy help'])
  assert.notEqual(icons[0], icons[1])
  assert.notEqual(icons[1], icons[2])
  assert.match(iconSvg('rocket'), /^<svg class="gi"[^>]*aria-hidden="true"/)
  for (const type of [
    'technical',
    'marketing',
    'service',
    'sales',
    'product',
    'company',
    'explainer',
    'case-study',
    'event',
  ]) {
    const svg = heroArt(type)
    assert.ok(svg.startsWith('<svg class="hero-art"') && svg.trim().endsWith('</svg>'), type)
    assert.equal((svg.match(/<svg/g) || []).length, 1, type)
    assert.equal(
      (svg.match(/<g[ >]/g) || []).length,
      (svg.match(/<\/g>/g) || []).length,
      type + ' g balance'
    )
    assert.doesNotMatch(svg, /undefined|NaN/, type)
    assert.doesNotMatch(svg, /<text/, type + ' must carry no figures or labels')
  }
  assert.match(ringsSvg(), /aria-hidden="true"/)
})

test('team campaign pattern: validates, matches, round-trips and flags rows', () => {
  assert.equal(patternError('{name}-{yyyy}-{mm}'), '')
  assert.match(patternError('{nam}-{yyyy}'), /Unknown part \{nam\}/)
  assert.match(patternError('spring'), /at least one part/)
  assert.match(patternError('{name} {yyyy}'), /only lowercase/)
  const rules = {
    channels: [{ label: 'G', source: 'google', medium: 'cpc' }],
    separator: '-',
    pattern: '{name}-{yyyy}-{mm}',
  }
  assert.equal(matchesPattern('spring-sale-2026-11', rules), true)
  assert.equal(matchesPattern('spring-sale', rules), false)
  assert.equal(matchesPattern('spring-sale-26-11', rules), false)
  assert.equal(matchesPattern('anything', { ...rules, pattern: '' }), true)
  assert.equal(
    patternExample('{name}-{yyyy}-{mm}', '_', new Date(2026, 10, 2)),
    'spring_sale_2026_11'
  )
  assert.deepEqual(decodeRules(encodeRules(rules)), rules)
  assert.notEqual(rulesVersion(rules), rulesVersion({ ...rules, pattern: '' }))
  assert.equal(decodeRules(encodeRules({ ...rules, pattern: '' })).pattern, undefined)
  const row = (campaign) => ({
    id: '1',
    url: 'u',
    fields: {
      url: 'https://e.com',
      source: 'google',
      medium: 'cpc',
      campaign,
      term: '',
      content: '',
    },
  })
  assert.match(
    ruleIssues([row('spring-sale')], rules).join('\n'),
    /does not follow the team pattern \{name\}-\{yyyy\}-\{mm\}/
  )
  assert.equal(ruleIssues([row('spring-sale-2026-11')], rules).length, 0)
})

test('ad versions multiply pages x channels x versions, with a cap', () => {
  assert.deepEqual(parseVariants('Blue Button, green-button,, blue-button\nred'), [
    'blue-button',
    'green-button',
    'red',
  ])
  const base = { url: '', source: '', medium: '', campaign: 'c', term: '', content: 'ignored' }
  const channels = [
    { label: 'Google Ads', source: 'google', medium: 'cpc' },
    { label: 'Newsletter', source: 'newsletter', medium: 'email' },
  ]
  const links = buildMatrix(['https://a.com/1', 'https://a.com/2'], base, channels, undefined, [
    'a',
    'b',
  ])
  assert.equal(links.length, 8)
  assert.equal(links[0].label, 'Google Ads · a')
  assert.match(links[1].result.url, /utm_content=b/)
  assert.doesNotMatch(links[0].result.url, /ignored/)
  const plain = buildMatrix(['https://a.com/1'], base, channels)
  assert.equal(plain.length, 2)
  assert.match(plain[0].result.url, /utm_content=ignored/)
  const many = buildMatrix(
    Array.from({ length: 50 }, (_, i) => 'https://a.com/' + i),
    base,
    [...channels, { label: 'X', source: 'x', medium: 'social' }],
    undefined,
    ['a', 'b', 'c']
  )
  assert.equal(many.length, 300)
})

test('UPI payment link follows the NPCI parameters and rejects bad input', () => {
  assert.equal(
    upiPayload('shop@okhdfcbank', 'Acme Studio', '250', 'Invoice 1042').payload,
    'upi://pay?pa=shop@okhdfcbank&pn=Acme%20Studio&am=250.00&cu=INR&tn=Invoice%201042'
  )
  assert.equal(
    upiPayload('a.b-c_d@ybl', 'Ana', '', '').payload,
    'upi://pay?pa=a.b-c_d@ybl&pn=Ana&cu=INR'
  )
  assert.equal(
    upiPayload('ana@ybl', 'Ana', '₹1,250.5', '').payload,
    'upi://pay?pa=ana@ybl&pn=Ana&am=1250.50&cu=INR'
  )
  assert.deepEqual(upiPayload('', '', '', ''), { payload: '', error: '' })
  assert.match(upiPayload('nobank', 'Ana', '', '').error, /name@bank/)
  assert.match(upiPayload('ana@ybl', '', '', '').error, /payee name/)
  assert.match(upiPayload('ana@ybl', 'Ana', '12.345', '').error, /amount/)
  assert.match(upiPayload('ana@ybl', 'Ana', '0', '').error, /amount/)
  assert.match(upiPayload('ana@ybl', 'Ana', '', 'x'.repeat(51)).error, /under 50/)
})

test('campaign pack carries the launch checklist', () => {
  const html = buildPackHtml({
    title: 't',
    owner: '',
    date: '2026-11-02',
    rules: '',
    issues: [],
    items: [],
  })
  assert.match(html, /Before you launch/)
  assert.match(html, /type="checkbox"/)
})

test('meta audit reads a head and reports what is missing, long or repeated', () => {
  const bad = auditHead(
    '<head><title>Home</title><meta name="description" content="Hi"><meta property="og:image" content="/x.png"><meta name="robots" content="noindex,follow"></head>'
  )
  const text = bad.issues.map((i) => i.level + ':' + i.text).join('\n')
  assert.match(text, /problem:There is no viewport/)
  assert.match(text, /problem:The robots tag says noindex/)
  assert.match(text, /problem:og:image must be a full/)
  assert.match(text, /tip:The title is only 4 characters/)
  assert.match(text, /tip:There is no canonical link/)
  assert.match(text, /Open Graph tags missing: og:title, og:description, og:url, og:type/)
  const dup = auditHead(
    '<title>A</title><title>B</title><meta name="description" content="x"><meta name="description" content="y">'
  )
  const dupText = dup.issues.map((i) => i.text).join('\n')
  assert.match(dupText, /There are 2 <title> tags/)
  assert.match(dupText, /There are 2 meta descriptions/)
  const good = auditHead(
    '<meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>' +
      'A solid page title for search results'.padEnd(40, 'x') +
      '</title><meta name="description" content="' +
      'x'.repeat(140) +
      '"><link rel="canonical" href="https://e.com/a"><meta property="og:title" content="t"><meta property="og:description" content="d"><meta property="og:image" content="https://e.com/i.png"><meta property="og:url" content="https://e.com/a"><meta property="og:type" content="website"><meta name="twitter:card" content="summary_large_image">'
  )
  assert.equal(good.issues.length, 0, JSON.stringify(good.issues))
  assert.deepEqual(auditHead('  '), { title: '', description: '', found: [], issues: [] })
})

test('seo kit: FAQ blocks parse, multi-line answers join, schema cannot close its script', () => {
  const faqs = parseFaqs('Q: One?\nA: Yes.\nStill yes.\n\nnot a block\n\nq: Two?\na: </script><b>')
  assert.deepEqual(faqs, [
    { q: 'One?', a: 'Yes. Still yes.' },
    { q: 'Two?', a: '</script><b>' },
  ])
  const out = buildFaqJsonLd(faqs)
  assert.equal(out.match(/<\/script>/g).length, 1)
  assert.match(out, /"@type": "FAQPage"/)
})

test('seo kit: regressions found by stress testing', () => {
  // pairs without a blank line between them stay separate
  assert.deepEqual(parseFaqs('Q: One?\nA: Yes.\nQ: Two?\nA: No.'), [
    { q: 'One?', a: 'Yes.' },
    { q: 'Two?', a: 'No.' },
  ])
  // full URLs pasted into the sitemap are not glued onto the site address
  const full = buildSitemapTs(
    'https://x.com',
    'https://x.com/a?utm=1#top\n/my page\n/a\n//evil.com/x'
  )
  assert.doesNotMatch(full, /x\.com\/https/)
  assert.match(full, /\{ url: "https:\/\/x\.com\/a" \}/)
  assert.equal(full.match(/x\.com\/a"/g).length, 1, 'duplicates are removed')
  assert.match(full, /my%20page/)
  assert.match(full, /"https:\/\/x\.com\/evil\.com\/x"/, '//host/x stays a path on this site')
  // robots: leading slash added, whole-site rules dropped, repeats removed
  const robots = buildRobotsTs('x.com', 'admin\n/\n*\n/a\n/a')
  assert.match(robots, /disallow: \["\/admin","\/a"\]/)
  // not web addresses
  assert.equal(origin('example'), '')
  assert.equal(origin('ftp://x.com'), '')
  assert.equal(origin('localhost:3000'), 'https://localhost:3000')
})

test('seo kit: robots never blocks /_next/, sitemap uses the site origin, OG file escapes text', () => {
  const robots = buildRobotsTs('example.com/some/page', '/admin/\n/_next/\n')
  assert.match(robots, /disallow: \["\/admin\/"\]/)
  assert.doesNotMatch(robots, /_next/)
  assert.match(robots, /sitemap: "https:\/\/example\.com\/sitemap\.xml"/)
  const sitemap = buildSitemapTs('https://example.com/', '/\nabout')
  assert.match(sitemap, /\{ url: "https:\/\/example\.com" \}/)
  assert.match(sitemap, /\{ url: "https:\/\/example\.com\/about" \}/)
  const og = buildOgImageTsx({
    title: 'A "quoted" {brace}',
    siteName: '',
    background: 'red; x',
    accent: '#fff',
  })
  assert.match(og, /\{"A \\"quoted\\" \{brace\}"\}/)
  assert.match(og, /background: "#0b0f19"/)
})

const f = (over = {}) => ({
  url: 'https://a.com/p',
  source: 'google',
  medium: 'cpc',
  campaign: 'sale',
  term: '',
  content: '',
  ...over,
})

test('builder: a bare domain gets https, other schemes and plain words are still refused', () => {
  assert.equal(withScheme('example.com/pricing'), 'https://example.com/pricing')
  assert.equal(withScheme('localhost:3000/x'), 'https://localhost:3000/x')
  assert.equal(withScheme('https://a.com'), 'https://a.com')
  assert.equal(
    buildUtmUrl(f({ url: 'example.com/pricing' })).url,
    'https://example.com/pricing?utm_source=google&utm_medium=cpc&utm_campaign=sale'
  )
  assert.match(buildUtmUrl(f({ url: 'mailto:a@b.com' })).error, /http/)
  assert.match(buildUtmUrl(f({ url: 'javascript:alert(1)' })).error, /http/)
  assert.match(buildUtmUrl(f({ url: 'pricing' })).error, /incomplete/)
  assert.match(buildUtmUrl(f({ url: 'hello world' })).error, /incomplete/)
  assert.deepEqual(parseUrlList('a.com/x\nnot a url\nhttps://a.com/x').urls, ['https://a.com/x'])
  assert.deepEqual(parseUrlList('a.com/x\nnot a url').invalid, [{ line: 2, text: 'not a url' }])
})

test('names in any language survive; symbols and emoji do not', () => {
  assert.equal(normalizeValue('दिवाली सेल 2026'), 'दिवाली-सेल-2026')
  assert.equal(normalizeValue('Café Sale!'), 'café-sale')
  assert.equal(normalizeValue('🔥 Spring Sale'), 'spring-sale')
  assert.equal(normalizeValue('a&b=c#d'), 'abcd')
  const built = buildUtmUrl(f({ campaign: 'दिवाली सेल' })).url
  assert.equal(new URL(built).searchParams.get('utm_campaign'), 'दिवाली-सेल')
})

test('report cleaner: different Hindi or accented campaigns are not merged into one', () => {
  const hi = cleanReport('Session campaign,Sessions\nदिवाली-सेल,10\nदिवाली_सेल,5\nहोली-ऑफर,7', '-')
  assert.equal(hi.groups.length, 2)
  const merged = hi.groups.find((g) => g.variants.length === 2)
  assert.equal(merged.canonical, 'दिवाली-सेल')
  assert.equal(merged.totals[0], 15)
  const accents = cleanReport('Session campaign,Sessions\nCafé,1\nCafe,2', '-')
  assert.equal(accents.groups.length, 2)
})

test('report cleaner: reads European and US number formats, and says when rows were cut', () => {
  const eu = cleanReport(
    'Session campaign;Sessions;Revenue\nSpring-Sale;1.200;1.234,50\nspring_sale;300;99,10',
    '-'
  )
  assert.deepEqual(eu.groups[0].totals, [1500, 1333.6])
  const us = cleanReport(
    'Session campaign,Sessions,Revenue\nspring-sale,"1,200","1,234.50"\nSpring_Sale,300,99.10',
    '-'
  )
  assert.deepEqual(us.groups[0].totals, [1500, 1333.6])
  const lakh = cleanReport(
    'Session campaign,Sessions\nspring-sale,"1,20,000"\nSpring_Sale,"2,50,000"',
    '-'
  )
  assert.equal(lakh.groups[0].totals[0], 370000)
  const big =
    'Session campaign,Sessions\n' + Array.from({ length: 5200 }, (_, i) => `c${i},1`).join('\n')
  const r = cleanReport(big, '-')
  assert.equal(r.rowCount, 5000)
  assert.equal(r.totalRows, 5200)
  assert.equal(cleanReport('Session campaign,Sessions\na,1', '-').totalRows, 1)
})

test('QR: a 10-digit number with no country code is refused, with a + it is accepted', () => {
  assert.match(whatsappPayload('98765 43210', '').error, /country code is missing/)
  assert.match(phonePayload('9876543210').error, /country code is missing/)
  assert.equal(whatsappPayload('91 98765 43210', '').payload, 'https://wa.me/919876543210')
  assert.equal(whatsappPayload('+65 8123 4567', '').payload, 'https://wa.me/6581234567')
  assert.equal(phonePayload('+91 98765 43210').payload, 'tel:+919876543210')
})

test('robots.txt matching: own group beats *, longest rule wins, Allow wins a tie', () => {
  const g = parseRobots(
    [
      '# comment',
      'User-agent: *',
      'Disallow: /private/',
      'Allow: /private/public/',
      '',
      'User-agent: GPTBot',
      'User-agent: ClaudeBot',
      'Disallow: /',
      'Allow: /blog/$',
      '',
      'User-agent: Tie',
      'Disallow: /x',
      'Allow: /x',
    ].join('\n')
  )
  // wildcard group applies to a crawler with no group of its own
  assert.deepEqual(isAllowed(g, 'PerplexityBot', '/private/a'), { allowed: false, via: 'wildcard' })
  assert.equal(
    isAllowed(g, 'PerplexityBot', '/private/public/a').allowed,
    true,
    'longer Allow wins'
  )
  assert.equal(isAllowed(g, 'PerplexityBot', '/blog').allowed, true)
  // two user-agent lines share one set of rules, and names are case-insensitive
  assert.deepEqual(isAllowed(g, 'claudebot', '/anything'), { allowed: false, via: 'own' })
  assert.equal(isAllowed(g, 'GPTBot', '/blog/').allowed, true, '$ anchors the end of the path')
  assert.equal(isAllowed(g, 'GPTBot', '/blog/post').allowed, false)
  assert.equal(isAllowed(g, 'Tie', '/x').allowed, true, 'Allow beats Disallow when equally long')
  // no rules at all, and an empty Disallow, both mean allowed
  assert.deepEqual(isAllowed([], 'GPTBot', '/'), { allowed: true, via: 'none' })
  assert.equal(isAllowed(parseRobots('User-agent: *\nDisallow:'), 'GPTBot', '/x').allowed, true)
})

test('AI crawler check on a real-looking robots.txt', () => {
  const by = (txt) => Object.fromEntries(checkCrawlers(txt).map((r) => [r.token, r]))
  const some = by(
    'User-agent: *\nAllow: /\nDisallow: /admin/\n\nUser-agent: GPTBot\nDisallow: /\n\nUser-agent: ClaudeBot\nDisallow: /\n'
  )
  assert.equal(some.GPTBot.status, 'blocked')
  assert.equal(some.ClaudeBot.status, 'blocked')
  assert.equal(some['OAI-SearchBot'].status, 'allowed')
  assert.equal(some.PerplexityBot.via, 'wildcard')
  // blocking everything with * also blocks AI crawlers, unless one has its own group
  const all = by('User-agent: *\nDisallow: /\n\nUser-agent: OAI-SearchBot\nAllow: /')
  assert.equal(all.GPTBot.status, 'blocked')
  assert.equal(all['OAI-SearchBot'].status, 'allowed')
  // a crawler that may read the blog but not the rest is reported as partial
  const part = by('User-agent: GPTBot\nDisallow: /\nAllow: /blog/')
  assert.equal(part.GPTBot.status, 'partial')
  // no robots.txt: everything allowed, nothing blocked
  const none = checkCrawlers('')
  assert.ok(none.every((r) => r.status === 'allowed' && r.via === 'none'))
  assert.equal(new Set(CRAWLERS.map((c) => c.token)).size, CRAWLERS.length, 'tokens are unique')
})

test('robots.ts generator: opt out of AI training adds one group and leaves search crawlers alone', () => {
  const plain = buildRobotsTs('example.com', '/admin', false)
  assert.match(plain, /rules: \{/)
  assert.doesNotMatch(plain, /GPTBot/)
  const out = buildRobotsTs('example.com', '/admin', true)
  assert.match(out, /rules: \[/)
  assert.match(
    out,
    /userAgent: \["GPTBot","ClaudeBot","Google-Extended","Applebot-Extended","CCBot","meta-externalagent"\]/
  )
  assert.match(out, /disallow: \["\/admin"\]/)
  assert.doesNotMatch(out, /OAI-SearchBot|PerplexityBot|Claude-SearchBot/)
  // what the generator writes is what the checker reports
  const asTxt =
    'User-agent: *\nAllow: /\n\n' +
    `User-agent: ${TRAINING_TOKENS.join('\nUser-agent: ')}\nDisallow: /`
  const r = checkCrawlers(asTxt)
  for (const c of r)
    assert.equal(c.status === 'blocked', TRAINING_TOKENS.includes(c.token), c.token)
})

test('WhatsApp link: country code added, leading 0 dropped, repeated code caught, + is complete', () => {
  const wa = (o) => buildWhatsAppLink({ country: '91', number: '', message: '', ref: '', ...o })
  const india = wa({ number: '98765 43210', message: 'Hi' })
  assert.equal(india.link, 'https://wa.me/919876543210?text=Hi')
  assert.equal(india.digits, '919876543210')
  assert.equal(
    wa({ country: '44', number: '07911 123456' }).digits,
    '447911123456',
    'trunk 0 removed'
  )
  const twice = wa({ number: '91 98765 43210' })
  assert.equal(twice.digits, '919876543210')
  assert.equal(twice.notes.length, 1, 'tells the person the code was not added twice')
  assert.equal(
    wa({ country: '91', number: '+65 8123 4567' }).digits,
    '6581234567',
    '+ means complete'
  )
  assert.equal(wa({ number: '0044 7911 123456' }).digits, '447911123456')
  assert.deepEqual(wa({ number: '   ' }), { link: '', digits: '', text: '', error: '', notes: [] })
  assert.match(wa({ number: '123' }).error, /8 to 15/)
  assert.match(wa({ number: '0' }).error, /without the country code/)
  assert.match(
    wa({ number: '000' }).error,
    /not 0/,
    '00 is the international prefix, then a stray 0'
  )
})

test('WhatsApp link: campaign code goes into the message, Hindi kept, text is encoded', () => {
  assert.equal(withRef('Hi, price list', 'Diwali Poster'), 'Hi, price list [ref: diwali-poster]')
  assert.equal(withRef('', 'poster-1'), 'Hi [ref: poster-1]')
  assert.equal(withRef('Hello', ''), 'Hello')
  assert.equal(withRef('Hello', 'दिवाली पोस्टर'), 'Hello [ref: दिवाली-पोस्टर]')
  const r = buildWhatsAppLink({
    country: '91',
    number: '9876543210',
    message: 'A & B\nline',
    ref: 'x',
  })
  assert.match(r.link, /\?text=A%20%26%20B%0Aline%20%5Bref%3A%20x%5D$/)
  assert.equal(
    htmlSnippet('https://wa.me/1?text=a&b="c"'),
    '<a href="https://wa.me/1?text=a&amp;b=&quot;c&quot;" target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>'
  )
  assert.equal(new Set(COUNTRIES.map((c) => `${c.name}`)).size, COUNTRIES.length)
})

// Synthetic exports in GA4's CSV layout (comment header, Grand total line, rate columns).
const fixture = (name) => readFileSync(new URL(`../fixtures/${name}`, import.meta.url), 'utf8')

test('report cleaner on a GA4-shaped source / medium export', () => {
  const r = cleanReport(fixture('ga4-source-medium.csv'), '-')
  assert.equal(r.error, '')
  assert.equal(r.totalLinesIgnored, 1, 'the Grand total line is left out')
  assert.deepEqual(r.skippedMetrics, [
    'Total users',
    'Engagement rate',
    'Average engagement time per session',
  ])
  assert.deepEqual(r.metricNames, ['Sessions', 'Engaged sessions', 'Key events', 'Total revenue'])
  const by = Object.fromEntries(r.groups.map((g) => [g.canonical, g]))
  assert.equal(by['google / cpc'].totals[0], 4693)
  assert.equal(by['facebook / paid-social'].variants.length, 3)
  assert.equal(by['newsletter / email'].variants.length, 3, 'e-mail merges with email')
  // different mediums of one source are NOT merged
  assert.ok(by['instagram / social'] && by['instagram / paid-social'])
  assert.ok(
    by['(not set) / (not set)'] && by['(direct) / (none)'],
    'reserved labels stay as they are'
  )
  assert.equal(
    r.groups.reduce((n, g) => n + g.totals[0], 0),
    15535,
    'nothing lost, nothing counted twice'
  )
  assert.ok(!r.groups.some((g) => /total/i.test(g.canonical)))
})

test('report cleaner on a GA4-shaped campaign export, Hindi names included', () => {
  const r = cleanReport(fixture('ga4-campaigns.csv'), '-')
  assert.equal(
    r.groups.reduce((n, g) => n + g.totals[0], 0),
    15622,
    'matches the file row by row'
  )
  const by = Object.fromEntries(r.groups.map((g) => [g.canonical, g]))
  assert.equal(by['diwali-sale-2026'].variants.length, 4)
  assert.equal(by['दिवाली-सेल'].totals[0], 610)
  assert.ok(by['होली-ऑफर'] && !by['होली-ऑफर'].split, 'a different Hindi campaign is left alone')
  assert.ok(by['bf-2026'] && by['black-friday-2026'], 'different names are never guessed to match')
})

test('Looker field names, and the formula agrees with the merged table', () => {
  assert.equal(lookerField('Session campaign'), 'Session campaign')
  assert.equal(lookerField('Session source / medium'), '`Session source / medium`')
  const sm = lookerCase(cleanReport(fixture('ga4-source-medium.csv'), '-'))
  assert.match(
    sm,
    /WHEN `Session source \/ medium` IN \("Google \/ cpc", "google \/ CPC"\) THEN "google \/ cpc"/
  )
  assert.match(
    sm,
    /IN \("ig \/ paid_social"\) THEN "instagram \/ paid-social"/,
    'a lone renamed label is mapped too'
  )
  assert.match(sm, /ELSE `Session source \/ medium`\nEND$/)
  const camp = lookerCase(cleanReport(fixture('ga4-campaigns.csv'), '-'))
  assert.match(camp, /WHEN Session campaign IN/)
})
