#!/usr/bin/env node
// scripts/indexing/check-index-status.mjs
//
// Reports, for every URL in the live sitemap, whether Google has indexed it,
// using the Search Console URL Inspection API (read-only).
//
// What this is NOT: a way to request indexing. Google exposes no API for that
// on ordinary pages. The Indexing API is limited to JobPosting and livestream
// BroadcastEvent pages, and URL Inspection can only read status. So the loop is:
//   deploy -> sitemap auto-submitted (submit-sitemap.mjs) -> this report shows
//   what is still "not indexed" -> Request indexing by hand for just those URLs
//   (Search Console -> URL Inspection -> Request indexing).
//
// Same secrets as submit-sitemap.mjs (GSC_SERVICE_ACCOUNT_JSON, GSC_PROPERTY).
// Quota is about 2,000 inspections per property per day; this site uses ~90.
// Not configured? Prints a notice and exits 0.
//
// Usage: node scripts/indexing/check-index-status.mjs [--only-unindexed]

import fs from 'node:fs'
import { readServiceAccount, getAccessToken } from './gsc-auth.mjs'

const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://devstash.me'
const SITEMAP_URL = process.env.SITEMAP_URL || `${SITE_URL}/sitemap.xml`
const onlyUnindexed = process.argv.includes('--only-unindexed')

async function sitemapUrls() {
  const res = await fetch(SITEMAP_URL)
  if (!res.ok) throw new Error(`Could not fetch ${SITEMAP_URL} (${res.status})`)
  return [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
}

async function inspect(token, property, url) {
  const res = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inspectionUrl: url, siteUrl: property }),
  })
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 200)}`)
  const r = (await res.json()).inspectionResult?.indexStatusResult ?? {}
  return {
    url,
    verdict: r.verdict ?? 'UNKNOWN',
    state: r.coverageState ?? '',
    lastCrawl: r.lastCrawlTime ? r.lastCrawlTime.slice(0, 10) : '-',
  }
}

async function main() {
  const property = process.env.GSC_PROPERTY
  const sa = readServiceAccount()
  if (!sa || !property) {
    console.log('↷ Index check skipped — set GSC_SERVICE_ACCOUNT_JSON and GSC_PROPERTY to enable.')
    return
  }

  const token = await getAccessToken(sa, SCOPE)
  const urls = await sitemapUrls()
  const rows = []
  // Sequential: stays far below the 600/min limit and keeps the output ordered.
  for (const url of urls) {
    try {
      rows.push(await inspect(token, property, url))
    } catch (err) {
      rows.push({ url, verdict: 'ERROR', state: err.message, lastCrawl: '-' })
    }
  }

  const indexed = rows.filter((r) => r.verdict === 'PASS')
  const pending = rows.filter((r) => r.verdict !== 'PASS')
  const lines = [
    `## Google index status — ${indexed.length}/${rows.length} indexed`,
    '',
    '| URL | Status | Last crawl |',
    '| --- | --- | --- |',
    ...(onlyUnindexed ? pending : rows).map(
      (r) => `| ${r.url.replace(SITE_URL, '') || '/'} | ${r.state || r.verdict} | ${r.lastCrawl} |`
    ),
  ]
  const out = lines.join('\n')
  console.log(out)
  // On GitHub Actions the same table lands on the run summary page.
  if (process.env.GITHUB_STEP_SUMMARY)
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, out + '\n')
}

main().catch((err) => {
  console.error('✗ Index check failed:', err.message)
  process.exit(1)
})
