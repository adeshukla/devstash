import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  validateEventName,
  validateParams,
  validateRecommended,
  checkEvent,
  buildDataLayer,
  buildGtag,
  jsValue,
  TEMPLATES,
} from '../../lib/lab/ga4Event.ts'
import {
  wrapLines,
  fitText,
  buildOgSvg,
  DEFAULTS,
  PRESETS,
  applyPreset,
  FONTS,
} from '../../lib/lab/ogImage.ts'
import {
  extractPalette,
  suggestStyle,
  scrimFor,
  meanColor,
  readableOn,
  luminance,
  mix,
} from '../../lib/lab/palette.ts'
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

test('GA4 event names follow Google’s documented rules', () => {
  const probs = (n) => validateEventName(n).filter((i) => i.level === 'problem').length
  assert.deepEqual(validateEventName('generate_lead'), [])
  assert.equal(probs('My Event'), 1, 'a space is a problem')
  assert.ok(
    validateEventName('My Event').some((i) => i.level === 'tip'),
    'capitals get a case tip'
  )
  assert.equal(probs('1abc'), 1, 'must start with a letter')
  assert.equal(probs('a'.repeat(41)), 1, 'over 40 characters')
  assert.equal(probs('a'.repeat(40)), 0)
  assert.equal(probs('page_view'), 1, 'a reserved name')
  assert.equal(probs('Page_View'), 0, 'case sensitive: a different name is not reserved')
  assert.equal(probs('query_id_x'), 1, 'the one documented reserved event prefix')
  assert.equal(probs('google_lead'), 0, 'google_ is documented for parameters, so only a tip here')
  assert.ok(validateEventName('google_lead').some((i) => i.level === 'tip'))
  assert.equal(probs('सदस्यता_पूर्ण'), 0, 'non-English letters are allowed')
})

test('GA4 parameters: limits, reserved prefixes, personal data', () => {
  const P = (name, value = 'x') => ({ name, value })
  const probs = (ps) =>
    validateParams(ps)
      .filter((i) => i.level === 'problem')
      .map((i) => i.text)
  assert.equal(probs(Array.from({ length: 25 }, (_, i) => P(`p${i}`))).length, 0)
  assert.match(probs(Array.from({ length: 26 }, (_, i) => P(`p${i}`)))[0], /26 parameters/)
  assert.match(probs([P('a'), P('a')])[0], /used twice/)
  for (const bad of ['google_x', 'ga_x', 'firebase_x', '_x'])
    assert.ok(probs([P(bad)]).length > 0, bad)
  assert.match(probs([P('note', 'y'.repeat(101))])[0], /limit is 100/)
  assert.equal(probs([P('note', 'y'.repeat(100))]).length, 0)
  assert.equal(probs([P('page_location', 'u'.repeat(900))]).length, 0, 'page_location may be 1000')
  assert.equal(probs([P('page_title', 't'.repeat(301))]).length, 1, 'page_title may be 300')
  assert.match(probs([P('contact', 'adesh@example.com')])[0], /email address/)
  const digits = validateParams([P('ref', '98765 43210')])
  assert.ok(digits.length === 1 && digits[0].level === 'tip', 'long digits are a tip, not a block')
  assert.match(probs([P('', 'orphan value')])[0], /no name/)
})

test('GA4 recommended events: required parameters, value needs currency, numbers stay numbers', () => {
  const P = (name, value) => ({ name, value })
  const texts = (n, ps, items) => validateRecommended(n, ps, items).map((i) => i.text)
  assert.deepEqual(texts('custom_thing', [], false), [], 'a custom event has no recommended rules')
  assert.ok(
    texts('purchase', [P('currency', 'INR'), P('value', '499')], true).some((t) =>
      /transaction_id/.test(t)
    )
  )
  assert.ok(
    texts(
      'purchase',
      [P('transaction_id', 'T1'), P('currency', 'INR'), P('value', '1')],
      false
    ).some((t) => /items array/.test(t))
  )
  assert.ok(texts('generate_lead', [P('value', '500')], false).some((t) => /currency/.test(t)))
  assert.ok(
    texts('generate_lead', [P('currency', 'INR'), P('value', '₹500')], false).some((t) =>
      /must be a number/.test(t)
    )
  )
  assert.deepEqual(texts('generate_lead', [P('currency', 'INR'), P('value', '500')], false), [])
  assert.ok(
    texts('select_content', [P('content_id', '12345')], false).some((t) => /not a digit/.test(t))
  )
  assert.deepEqual(texts('search', [P('search_term', 't-shirts')], false), [])
  assert.equal(jsValue('500'), '500')
  assert.equal(jsValue('007'), "'007'", 'a leading zero is an ID, not a number')
  assert.equal(jsValue('1e5'), "'1e5'")
  assert.equal(jsValue("it's"), "'it\\'s'")
  assert.equal(jsValue('</script>'), "'\\u003c/script>'")
  assert.equal(TEMPLATES.length, 10)
})

test('GA4 event code: dataLayer push and gtag call', () => {
  const ps = [
    { name: 'currency', value: 'INR' },
    { name: 'value', value: '500' },
    { name: 'my param', value: 'a b' },
    { name: '', value: 'ignored' },
  ]
  assert.equal(
    buildGtag('generate_lead', ps, false),
    "gtag('event', 'generate_lead', {\n  currency: 'INR',\n  value: 500,\n  'my param': 'a b',\n});"
  )
  assert.equal(
    buildDataLayer('generate_lead', ps.slice(0, 2), true),
    "window.dataLayer = window.dataLayer || [];\nwindow.dataLayer.push({\n  event: 'generate_lead',\n  currency: 'INR',\n  value: 500,\n  items: [{ item_id: 'SKU_12345', item_name: 'Example product' }],\n});"
  )
  assert.equal(buildGtag('login', [], false), "gtag('event', 'login');")
  assert.equal(buildGtag('', ps, false), '')
  // problems come before tips
  const issues = checkEvent('My_Event', [{ name: 'a', value: 'adesh@example.com' }], false)
  assert.equal(issues[0].level, 'problem')
  assert.equal(issues.at(-1).level, 'tip')
})

test('OG image: wrapping and fitting', () => {
  const m = (t, s) => Array.from(t).length * s * 0.5
  assert.deepEqual(wrapLines('aaa bbb ccc', 40, 10, m), ['aaa bbb', 'ccc'])
  const broken = wrapLines('abcdefghij', 30, 10, m)
  assert.equal(broken.join(''), 'abcdefghij')
  assert.ok(broken.every((l) => m(l, 10) <= 30))
  // Hindi: a long word breaks only between whole letters, never before a vowel sign
  const hindi = wrapLines('मुझेजानकारीचाहिए', 40, 10, m)
  assert.equal(hindi.join(''), 'मुझेजानकारीचाहिए')
  assert.ok(
    hindi.every((l) => !/^\p{M}/u.test(l)),
    'no line starts with a combining mark'
  )

  const box = { width: 1000, height: 300 }
  const o = { max: 100, min: 40, lineHeight: 1.15, maxLines: 3 }
  assert.equal(fitText('Short title', box, m, o).fontSize, 100)
  const mid = fitText('A much longer title that needs more room than one line gives it', box, m, o)
  assert.ok(mid.fontSize < 100 && mid.fontSize >= 40 && !mid.truncated)
  const huge = fitText('word '.repeat(200), box, m, o)
  assert.equal(huge.truncated, true)
  assert.ok(huge.lines.length <= 3 && huge.lines.at(-1).endsWith('…'))
})

// pixels for a palette test: [r, g, b, count]
const pixels = (...parts) => {
  const total = parts.reduce((n, p) => n + p[3], 0)
  const d = new Uint8ClampedArray(total * 4)
  let i = 0
  for (const [r, g, b, n] of parts) for (let k = 0; k < n; k++, i += 4) d.set([r, g, b, 255], i)
  return d
}

test('palette: dominant colours, shares, transparency and merging', () => {
  const pal = extractPalette(pixels([200, 30, 30, 600], [20, 40, 200, 400]), 6)
  assert.equal(pal.length, 2)
  assert.ok(pal[0].share > 0.55 && pal[0].share < 0.65, 'the bigger colour comes first')
  assert.match(pal[0].hex, /^#c81e1e$/i)
  assert.ok(Math.abs(pal.reduce((n, s) => n + s.share, 0) - 1) < 0.001)
  assert.deepEqual(
    extractPalette(pixels([200, 30, 30, 600], [20, 40, 200, 400]), 6),
    pal,
    'deterministic'
  )
  assert.deepEqual(
    extractPalette(new Uint8ClampedArray(400), 6),
    [],
    'fully transparent gives nothing'
  )
  const nearly = extractPalette(pixels([100, 100, 100, 300], [104, 98, 102, 300]), 6)
  assert.equal(nearly.length, 1, 'near-identical colours merge')
  assert.equal(meanColor(pixels([0, 0, 0, 1], [255, 255, 255, 1])), '#808080')
})

test('palette: a suggested style always has readable text', () => {
  // dark navy with an orange accent
  const navy = suggestStyle(
    extractPalette(pixels([20, 33, 61, 700], [252, 163, 17, 120], [40, 60, 100, 180]), 6)
  )
  assert.equal(navy.dark, true)
  assert.equal(navy.text, '#ffffff')
  assert.ok(
    contrastRatio(navy.accent, navy.bgFrom) >= 3,
    'the accent stands apart from the background'
  )
  assert.match(navy.accent, /^#fca311$/i)
  // light cream gets dark text
  const cream = suggestStyle(extractPalette(pixels([246, 241, 231, 800], [194, 65, 12, 100]), 6))
  assert.equal(cream.dark, false)
  assert.equal(cream.text, '#111827')
  assert.equal(suggestStyle([]), null)
  // any background at all: the text is readable, even for mid-greys where white and black both struggle
  let seed = 7
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648
  for (let i = 0; i < 300; i++) {
    const hex =
      '#' +
      [rnd(), rnd(), rnd()]
        .map((v) =>
          Math.round(v * 255)
            .toString(16)
            .padStart(2, '0')
        )
        .join('')
    const s = suggestStyle([{ hex, share: 1 }])
    assert.ok(contrastRatio(s.text, s.bgFrom) >= 4.5, `${hex} -> ${s.bgFrom} on ${s.text}`)
    assert.ok(contrastRatio(s.accent, s.bgFrom) >= 3 || s.accent === s.text, `accent on ${hex}`)
  }
  for (const g of ['#777777', '#7a7a7a', '#808080', '#8a8a8a'])
    assert.ok(
      contrastRatio(
        suggestStyle([{ hex: g, share: 1 }]).text,
        suggestStyle([{ hex: g, share: 1 }]).bgFrom
      ) >= 4.5,
      g
    )
})

test('palette: the scrim over a photo makes the text readable with as little darkening as needed', () => {
  const bright = scrimFor('#e8e8e8', '#ffffff')
  assert.equal(bright.color, '#000000')
  assert.ok(bright.opacity > 0.4 && bright.opacity <= 0.85)
  assert.ok(
    contrastRatio('#ffffff', mix('#e8e8e8', bright.color, bright.opacity)) >= 4.5 ||
      bright.opacity === 0.85
  )
  assert.equal(
    scrimFor('#101010', '#ffffff').opacity,
    0.15,
    'a dark photo needs only the lightest scrim'
  )
  const lightText = scrimFor('#202020', '#111827')
  assert.equal(lightText.color, '#ffffff', 'dark text over a dark photo gets a light scrim')
  assert.equal(readableOn('#ffffff'), '#111827')
  assert.equal(readableOn('#000000'), '#ffffff')
  assert.ok(luminance('#ffffff') > 0.99 && luminance('#000000') < 0.01)
})

const fake = (t, f) => Array.from(t).length * (f.size * 0.5 + f.spacing)
const svgOf = (over = {}) => buildOgSvg({ ...DEFAULTS, ...over }, fake)
const withText = (over = {}) =>
  svgOf({
    eyebrow: { ...DEFAULTS.eyebrow, text: 'northpeak.example' },
    title: { ...DEFAULTS.title, text: 'Free QR codes that never expire' },
    subtitle: { ...DEFAULTS.subtitle, text: 'Static vs dynamic, explained' },
    badge: { ...DEFAULTS.badge, text: 'New' },
    footer: { ...DEFAULTS.footer, text: 'devstash.me/blog' },
    ...over,
  })
const count = (svg, re) => (svg.match(re) ?? []).length

test('OG image: every text is its own element with its own font, and nothing unset is drawn', () => {
  assert.equal(count(svgOf(), /<text /g), 1, 'with no text only the placeholder title is drawn')
  assert.match(svgOf(), /Your title goes here/)
  const svg = withText()
  // the tag line, badge, subtitle and footer are one text each; the title may wrap onto several lines
  assert.equal(count(svg, /font-family="Consolas/g), 1, 'footer')
  assert.equal(count(svg, />NEW</g), 1, 'badge')
  assert.ok(count(svg, /<text /g) >= 5)
  assert.match(svg, /northpeak\.example/i)
  assert.match(svg, />NEW</, 'upper-case is applied to the badge')
  assert.match(svg, /font-family="Georgia,/, 'the title uses the serif stack')
  assert.match(svg, /font-family="Consolas,/, 'the footer uses the mono stack')
  // each text takes its own settings
  const styled = withText({
    title: {
      ...DEFAULTS.title,
      text: 'Hello',
      font: 'heavy',
      weight: 900,
      italic: true,
      color: '#ff0000',
      opacity: 60,
      spacing: 5,
    },
  })
  assert.match(
    styled,
    /font-family="Impact,[^"]*" font-size="\d+" font-weight="900" font-style="italic" letter-spacing="[\d.]+" fill="#ff0000" fill-opacity="0.6"/
  )
  // special characters are escaped everywhere
  const nasty = withText({
    title: { ...DEFAULTS.title, text: 'Fish & <Chips> "to go"' },
    footer: { ...DEFAULTS.footer, text: "a<b>'" },
  })
  assert.doesNotMatch(nasty, /<Chips>|<b>/)
  assert.match(nasty, /&amp;/)
  assert.match(nasty, /&lt;Chips&gt;/)
})

test('OG image: alignment, vertical position, sizes and every layout stay inside the canvas', () => {
  const inside = (svg, W, H) => {
    for (const m of svg.matchAll(/<text x="(-?[\d.]+)" y="(-?[\d.]+)"/g)) {
      assert.ok(Number(m[2]) >= 0 && Number(m[2]) <= H, `y ${m[2]} outside 0..${H}`)
      assert.ok(Number(m[1]) >= 0 && Number(m[1]) <= W, `x ${m[1]} outside 0..${W}`)
    }
  }
  const long = 'A title long enough to wrap onto several lines in the image '.repeat(4)
  const photo = { photo: 'data:image/jpeg;base64,AAAA', photoW: 1600, photoH: 900 }
  for (const [w, h] of [
    [1200, 630],
    [1080, 1920],
    [1080, 1080],
    [200, 200],
    [4000, 4000],
    [9999, 50],
  ])
    for (const align of ['left', 'center', 'right'])
      for (const vAnchor of ['top', 'middle', 'bottom'])
        for (const layout of ['stack', 'split-left', 'split-right']) {
          const svg = withText({
            ...photo,
            width: w,
            height: h,
            align,
            vAnchor,
            layout,
            title: { ...DEFAULTS.title, text: long },
          })
          const W = Math.min(4000, Math.max(200, w))
          const H = Math.min(4000, Math.max(200, h))
          assert.match(svg, new RegExp(`width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"`))
          inside(svg, W, H)
          assert.doesNotMatch(svg, /NaN|undefined|Infinity/)
        }
  // the title follows the alignment (the badge text is always centred inside its own pill)
  assert.match(withText({ align: 'center' }), /Georgia[^>]*text-anchor="middle"/)
  assert.match(withText({ align: 'right' }), /Georgia[^>]*text-anchor="end"/)
  assert.match(withText({ align: 'left' }), /Georgia[^>]*text-anchor="start"/)
  // moving the block down moves the title down
  const y = (svg) =>
    Number(
      svg.match(
        /font-weight="700"[^>]*>Free|<text x="[\d.]+" y="(\d+)" font-family="Georgia/
      )?.[1] ?? svg.match(/<text x="[\d.]+" y="(\d+)" font-family="Georgia/)[1]
    )
  assert.ok(y(withText({ vAnchor: 'top' })) < y(withText({ vAnchor: 'middle' })))
  assert.ok(y(withText({ vAnchor: 'middle' })) < y(withText({ vAnchor: 'bottom' })))
  assert.ok(y(withText({ offsetY: 10 })) > y(withText({ offsetY: 0 })))
})

test('OG image: backgrounds, a photo, the scrim and the split layout', () => {
  assert.match(
    svgOf({ bgType: 'solid', bgFrom: '#112233' }),
    /<rect width="1200" height="630" fill="#112233"\/>/
  )
  assert.match(svgOf({ bgType: 'linear', bgAngle: 45 }), /rotate\(45 0\.5 0\.5\)/)
  assert.match(svgOf({ bgType: 'radial' }), /<radialGradient id="bg"/)
  assert.match(svgOf({ bgType: 'glow' }), /<filter id="glow"/)
  assert.match(svgOf({ bgFrom: 'javascript:x' }), /stop-color="#f6f1e7"/, 'a bad colour falls back')

  const photo = { photo: 'data:image/jpeg;base64,AAAA', photoW: 1000, photoH: 500 }
  const bg = svgOf({
    ...photo,
    bgType: 'photo',
    scrimColor: '#000000',
    scrimOpacity: 40,
    photoBlur: 5,
    photoGray: true,
  })
  assert.match(bg, /<image href="data:image\/jpeg;base64,AAAA"/)
  assert.match(bg, /fill-opacity="0.4"/, 'the scrim')
  assert.match(bg, /feGaussianBlur/)
  assert.match(bg, /feColorMatrix type="saturate" values="0"/)
  // cover: a 2:1 picture in a 1200x630 box is scaled to fill it, and zoom enlarges it
  const w = (s) => Number(s.match(/<image href="data:image\/jpeg[^>]* width="([\d.]+)"/)[1])
  assert.ok(w(bg) >= 1200)
  assert.ok(w(svgOf({ ...photo, bgType: 'photo', photoZoom: 200 })) > w(bg))
  // a photo with no size, or anything that is not a picture data URL, is never embedded
  assert.doesNotMatch(
    svgOf({ photo: 'data:image/jpeg;base64,AAAA', photoW: 0, photoH: 0, bgType: 'photo' }),
    /<image/
  )
  assert.doesNotMatch(
    svgOf({ ...photo, photo: 'https://evil.example/x.png', bgType: 'photo' }),
    /<image|evil/
  )
  assert.doesNotMatch(
    svgOf({ ...photo, photo: 'javascript:alert(1)', bgType: 'photo' }),
    /<image|javascript/
  )
  assert.doesNotMatch(
    svgOf({ ...photo, photo: 'data:image/jpeg;base64,AAAA" onload="x', bgType: 'photo' }),
    /onload/
  )

  // split layout: the picture takes 42% of the width and the text stays on the other side
  const left = withText({ ...photo, layout: 'split-left' })
  assert.match(left, /<clipPath id="pcsp"><rect x="0" y="0" width="504" height="630"\/>/)
  for (const m of left.matchAll(/<text x="([\d.]+)"/g))
    assert.ok(Number(m[1]) >= 504, 'text is right of the picture')
  const right = withText({ ...photo, layout: 'split-right' })
  assert.match(right, /<clipPath id="pcsp"><rect x="696" y="0" width="504" height="630"\/>/)
  for (const m of right.matchAll(/<text x="([\d.]+)"/g))
    assert.ok(Number(m[1]) <= 696, 'text is left of the picture')
  assert.doesNotMatch(withText({ layout: 'split-left' }), /pcsp/, 'no picture, no panel')
  // a picture that is the background is not drawn a second time when it gets its own panel
  const twice = withText({ ...photo, bgType: 'photo', scrimOpacity: 40, layout: 'split-left' })
  assert.equal(count(twice, /<image /g), 1, 'one picture, in the panel')
  assert.doesNotMatch(twice, /fill-opacity="0.4"/, 'and no darkening layer over the whole image')
})

test('OG image: patterns, marks, corner shapes, frame, panel and logo', () => {
  assert.match(svgOf({ pattern: 'grid' }), /<path d="M\d+ 0V630/)
  assert.match(svgOf({ pattern: 'dots' }), /<g fill="#c2410c" fill-opacity="0.14"><circle/)
  assert.match(svgOf({ pattern: 'rings' }), /<circle cx="\d+" cy="\d+" r="\d+" fill="none"/)
  assert.match(svgOf({ pattern: 'stripes' }), /<path d="M-\d+ 630L/)
  assert.match(svgOf({ pattern: 'waves' }), /<path d="M0 [\d.]+q/)
  assert.match(svgOf({ pattern: 'plus' }), /V[\d.]+" fill="none"/)
  assert.match(
    svgOf({ pattern: 'grain' }),
    /<filter id="grain"[\s\S]*<rect width="1200" height="630" filter="url\(#grain\)"/
  )
  assert.doesNotMatch(svgOf({ pattern: 'none' }), /grain|stroke-opacity|<circle/)
  assert.match(
    svgOf({ pattern: 'dots', patternColor: '#00ff00', patternOpacity: 50 }),
    /fill="#00ff00" fill-opacity="0.5"/
  )

  const rects = (svg) => count(svg, /<rect /g)
  const base = rects(withText({ mark: 'none', badge: { ...DEFAULTS.badge, text: '' } }))
  assert.equal(rects(withText({ mark: 'bar', badge: { ...DEFAULTS.badge, text: '' } })), base + 1)
  assert.equal(
    rects(withText({ mark: 'underline', badge: { ...DEFAULTS.badge, text: '' } })),
    base + 1
  )
  assert.equal(rects(withText({ mark: 'side', badge: { ...DEFAULTS.badge, text: '' } })), base + 1)
  assert.match(withText({ mark: 'bar', markColor: '#00ff00' }), /fill="#00ff00"/)

  for (const decor of ['circle', 'quarter', 'triangle', 'blob'])
    for (const corner of ['tl', 'tr', 'bl', 'br']) {
      const svg = svgOf({ decor, decorCorner: corner })
      assert.match(svg, /fill-opacity="0.22"/, `${decor} ${corner}`)
      assert.doesNotMatch(svg, /NaN/)
    }
  assert.match(
    svgOf({ frame: true, frameColor: '#111111', frameRadius: 3 }),
    /fill="none" stroke="#111111"/
  )
  assert.doesNotMatch(svgOf({ frame: false }), /stroke="#111111"/)
  assert.match(
    withText({ panel: true, panelColor: '#ffffff', panelOpacity: 50 }),
    /fill="#ffffff" fill-opacity="0.5"/
  )

  const logo = 'data:image/png;base64,AAAA'
  assert.match(
    svgOf({ logo, logoPos: 'br' }),
    /<image href="data:image\/png;base64,AAAA" x="\d+" y="\d+"/
  )
  assert.match(svgOf({ logo, logoRound: true }), /<clipPath id="logoc"><circle/)
  assert.doesNotMatch(svgOf({ logo: 'https://evil.example/l.png' }), /<image|evil/)
  for (const pos of ['tl', 'tr', 'bl', 'br'])
    assert.doesNotMatch(svgOf({ logo, logoPos: pos }), /NaN/)
})

test('OG image: presets keep the content, reset the style, and every one builds a clean image', () => {
  const content = {
    ...DEFAULTS,
    title: { ...DEFAULTS.title, text: 'मेरा शीर्षक', weight: 300, color: '#ff00ff' },
    eyebrow: { ...DEFAULTS.eyebrow, text: 'tag' },
    markColor: '#00ff00',
    frame: true,
    photo: 'data:image/jpeg;base64,AAAA',
    photoW: 10,
    photoH: 10,
    sizeId: 'cover',
    width: 1600,
    height: 900,
  }
  const poster = applyPreset(
    content,
    PRESETS.find((p) => p.id === 'poster')
  )
  assert.equal(poster.title.text, 'मेरा शीर्षक')
  assert.equal(poster.eyebrow.text, 'tag')
  assert.equal(poster.photo, content.photo)
  assert.equal(poster.width, 1600)
  assert.equal(poster.title.font, 'heavy')
  assert.equal(poster.title.color, '', 'the old colour override is gone')
  assert.equal(poster.title.weight, 400)
  assert.equal(poster.markColor, '', 'styles from before are reset')
  assert.equal(
    applyPreset(poster, PRESETS[0]).bgFrom,
    DEFAULTS.bgFrom,
    'Editorial is the default look'
  )
  // a photo background survives a preset that does not choose its own background
  const photoBg = applyPreset(
    { ...content, bgType: 'photo', scrimOpacity: 55 },
    PRESETS.find((p) => p.id === 'paper')
  )
  assert.equal(photoBg.bgType, 'photo')
  assert.equal(photoBg.scrimOpacity, 55)
  for (const p of PRESETS) {
    const o = applyPreset(
      { ...content, title: { ...content.title, text: 'दिवाली सेल: 50% छूट '.repeat(6) } },
      p
    )
    const svg = buildOgSvg(o, fake)
    assert.ok(svg.startsWith('<svg') && svg.endsWith('</svg>'), p.id)
    assert.doesNotMatch(svg, /NaN|undefined/, p.id)
    assert.equal(count(svg, /<text /g) >= 1, true)
  }
  assert.equal(Object.keys(FONTS).length, 5)
})

test('OG image: the accent bar never touches the tag line or the title, at any title length and anchor', () => {
  for (const vAnchor of ['top', 'middle', 'bottom'])
    for (const title of [
      'Short',
      'A title long enough to wrap onto several lines in the image '.repeat(3),
      'word '.repeat(200),
    ]) {
      const svg = svgOf({
        vAnchor,
        eyebrow: { ...DEFAULTS.eyebrow, text: 'site.com' },
        title: { ...DEFAULTS.title, text: title },
        subtitle: { ...DEFAULTS.subtitle, text: 'Sub' },
      })
      const eb = svg.match(
        /<text x="\d+" y="(\d+)" font-family="[^"]*" font-size="(\d+)" font-weight="600"/
      )
      const bar = Number(svg.match(/<rect x="\d+" y="(-?[\d.]+)" width="\d+" height="(\d+)"/)[1])
      const first = svg.match(
        /<text x="[\d.]+" y="(\d+)" font-family="Georgia[^"]*" font-size="(\d+)"/
      )
      assert.ok(
        bar >= Number(eb[1]) + 6,
        `${vAnchor}: bar ${bar} is below the tag line baseline ${eb[1]}`
      )
      assert.ok(
        Number(first[1]) - Number(first[2]) >= bar + 4,
        `${vAnchor}: title top clears the bar`
      )
    }
})

test('QR forms say what is missing instead of showing nothing', () => {
  const blank = { first: '', last: '', org: '', title: '', phone: '', email: '', url: '' }
  // Wi-Fi: a password with no network name is explained; a blank form stays quiet
  assert.match(wifiPayload('', 'longenoughpass', 'WPA', false).error, /network name/)
  assert.match(wifiPayload('   ', 'longenoughpass', 'WPA', false).error, /network name/)
  assert.deepEqual(wifiPayload('', '', 'WPA', false), { payload: '', error: '' })
  assert.equal(wifiPayload('Cafe', 'longenoughpass', 'WPA', false).error, '')
  // contact: details with no name are explained; a blank form stays quiet
  assert.match(contactPayload({ ...blank, phone: '+919876543210' }).error, /name or a company/)
  assert.match(contactPayload({ ...blank, email: 'a@b.com' }).error, /name or a company/)
  assert.deepEqual(contactPayload(blank), { payload: '', error: '' })
  assert.equal(contactPayload({ ...blank, org: 'DevStash', phone: '+919876543210' }).error, '')
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

// ---- web address -> share image (SSRF guard + og:image finder) ----
import { isPrivateAddress, parseWebAddress, findImageUrl } from '../../lib/lab/pageImage.ts'

test('private and internal addresses are refused, public ones allowed', () => {
  for (const ip of [
    '127.0.0.1',
    '10.1.2.3',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.1',
    '169.254.169.254',
    '100.64.0.1',
    '0.0.0.0',
    '224.0.0.1',
    '::1',
    '::',
    'fe80::1',
    'fd00::1',
    '::ffff:127.0.0.1',
    '::ffff:7f00:1',
    '::ffff:a9fe:a9fe',
    '64:ff9b::1.2.3.4',
    'not-an-ip',
  ])
    assert.equal(isPrivateAddress(ip), true, ip)
  for (const ip of ['8.8.8.8', '1.1.1.1', '172.32.0.1', '151.101.1.1', '2606:4700:4700::1111'])
    assert.equal(isPrivateAddress(ip), false, ip)
})

test('web address parsing refuses the unsafe and tidies the rest', () => {
  assert.ok('url' in parseWebAddress('example.com/page'))
  assert.equal(parseWebAddress('example.com').url.protocol, 'https:')
  for (const bad of [
    '',
    'ftp://example.com',
    'file:///etc/passwd',
    'http://localhost:3000',
    'http://127.0.0.1',
    'http://2130706433',
    'http://[::1]/',
    'http://user:pw@example.com',
    'https://example.com:8080',
    'http://intranet',
    'http://printer.local',
    'http://169.254.169.254/latest/meta-data',
  ])
    assert.ok('error' in parseWebAddress(bad), bad)
})

test('finds the page share image and resolves it', () => {
  const html = `<head>
    <meta name="twitter:image" content="/tw.png">
    <meta property='og:image' content='/img/a.png?x=1&amp;y=2'>
    <link rel="image_src" href="/old.png"></head>`
  assert.equal(
    findImageUrl(html, 'https://site.test/blog/post'),
    'https://site.test/img/a.png?x=1&y=2'
  )
  assert.equal(
    findImageUrl(
      '<meta name="twitter:image" content="https://cdn.test/t.jpg">',
      'https://site.test'
    ),
    'https://cdn.test/t.jpg'
  )
  assert.equal(
    findImageUrl('<link rel="image_src" href="x.png">', 'https://site.test/a/'),
    'https://site.test/a/x.png'
  )
  assert.equal(
    findImageUrl('<meta property="og:image" content="javascript:alert(1)">', 'https://site.test'),
    null
  )
  assert.equal(findImageUrl('<p>nothing</p>', 'https://site.test'), null)
})
