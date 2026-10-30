#!/usr/bin/env node
// scripts/indexing/submit-sitemap.mjs
//
// Submits the sitemap to Google Search Console via the Search Console API so a
// fresh deploy nudges Google to re-crawl. Runs on every push to `main` (see
// .github/workflows/submit-sitemap.yml).
//
// Why the API and not a "ping"? Google retired the anonymous
// `google.com/ping?sitemap=` endpoint in 2023 — it's a no-op now. The API is
// the only programmatic path that still works. It needs a Google Cloud service
// account that's been added as a user on the Search Console property.
//
// Dependency-free on purpose: builds the service-account JWT with node:crypto
// and talks to the REST endpoints with fetch. No googleapis package.
//
// ── One-time setup ──────────────────────────────────────────────────────────
//   1. Google Cloud Console → create a service account → create a JSON key.
//   2. Enable the "Google Search Console API" for that project.
//   3. Search Console → Settings → Users and permissions → add the service
//      account's client_email as an Owner (or Full user).
//   4. Add these repo secrets (GitHub → Settings → Secrets → Actions):
//        GSC_SERVICE_ACCOUNT_JSON  = the entire service-account JSON
//        GSC_PROPERTY              = sc-domain:devstash.me   (Domain property)
//                                    or https://devstash.me/ (URL-prefix property)
//   (SITEMAP_URL defaults to https://devstash.me/sitemap.xml.)
//
// Not configured? The script prints a notice and exits 0 — it never fails a
// deploy just because the secrets aren't set yet.

import { readServiceAccount, getAccessToken } from './gsc-auth.mjs'

const SCOPE = 'https://www.googleapis.com/auth/webmasters'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://devstash.me'
const SITEMAP_URL = process.env.SITEMAP_URL || `${SITE_URL}/sitemap.xml`

async function submitSitemap(accessToken, property) {
  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
    property
  )}/sitemaps/${encodeURIComponent(SITEMAP_URL)}`
  const res = await fetch(endpoint, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  // The API returns 200/204 with an empty body on success.
  if (res.status !== 200 && res.status !== 204) {
    throw new Error(`Sitemap submit failed (${res.status}): ${(await res.text()).slice(0, 300)}`)
  }
}

async function main() {
  const property = process.env.GSC_PROPERTY
  const sa = readServiceAccount()

  if (!sa || !property) {
    console.log(
      '↷ Sitemap submission skipped — set GSC_SERVICE_ACCOUNT_JSON and GSC_PROPERTY to enable.'
    )
    return
  }

  console.log(`→ Submitting ${SITEMAP_URL} to Search Console property "${property}"…`)
  const token = await getAccessToken(sa, SCOPE)
  await submitSitemap(token, property)
  console.log('✓ Sitemap submitted to Google Search Console.')
}

main().catch((err) => {
  console.error('✗ Sitemap submission failed:', err.message)
  process.exit(1)
})
