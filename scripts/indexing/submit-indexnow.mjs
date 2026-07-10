#!/usr/bin/env node
// scripts/indexing/submit-indexnow.mjs
//
// Notifies IndexNow-participating engines (Bing, Yandex, Seznam, Naver, …) that
// the site's URLs changed, so they re-crawl fast. Google does NOT participate in
// IndexNow — that's what the Search Console API submission (submit-sitemap.mjs)
// is for. The two are complementary; run both on deploy.
//
// No secret needed: the IndexNow key is public by design. It's committed as
// public/<key>.txt and served at https://devstash.me/<key>.txt, which is how the
// engines verify ownership. Dependency-free — parses the live sitemap and POSTs.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://devstash.me'
const SITEMAP_URL = process.env.SITEMAP_URL || `${SITE_URL}/sitemap.xml`
const ENDPOINT = 'https://api.indexnow.org/indexnow'

// Must match the committed public/<KEY>.txt filename + contents.
const KEY = process.env.INDEXNOW_KEY || 'f95369590574e898cd8babd91dfdb6d9'

const MAX_URLS = 10000 // IndexNow's per-request cap.

/** Pull every <loc> URL out of the live sitemap. */
async function readSitemapUrls() {
  const res = await fetch(SITEMAP_URL)
  if (!res.ok) throw new Error(`Could not fetch sitemap (${res.status}) at ${SITEMAP_URL}`)
  const xml = await res.text()
  const urls = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1])
  return [...new Set(urls)].slice(0, MAX_URLS)
}

async function main() {
  const host = new URL(SITE_URL).host

  const urlList = await readSitemapUrls()
  if (urlList.length === 0) {
    console.log('↷ IndexNow skipped — sitemap had no URLs.')
    return
  }

  console.log(`→ Notifying IndexNow of ${urlList.length} URL(s) for ${host}…`)
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host,
      key: KEY,
      keyLocation: `${SITE_URL}/${KEY}.txt`,
      urlList,
    }),
  })

  // 200 = accepted, 202 = accepted/queued. Both are success.
  if (res.status === 200 || res.status === 202) {
    console.log(`✓ IndexNow accepted the submission (${res.status}).`)
    return
  }
  throw new Error(
    `IndexNow rejected the submission (${res.status}): ${(await res.text()).slice(0, 300)}`
  )
}

main().catch((err) => {
  console.error('✗ IndexNow submission failed:', err.message)
  process.exit(1)
})
