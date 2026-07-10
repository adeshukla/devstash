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

import crypto from 'node:crypto'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SCOPE = 'https://www.googleapis.com/auth/webmasters'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://devstash.me'
const SITEMAP_URL = process.env.SITEMAP_URL || `${SITE_URL}/sitemap.xml`

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/** Read the service account from either a full JSON blob or discrete env vars. */
function readServiceAccount() {
  const json = process.env.GSC_SERVICE_ACCOUNT_JSON
  if (json && json.trim()) {
    try {
      const parsed = JSON.parse(json)
      if (parsed.client_email && parsed.private_key) {
        return { email: parsed.client_email, privateKey: parsed.private_key }
      }
    } catch {
      throw new Error('GSC_SERVICE_ACCOUNT_JSON is set but is not valid JSON.')
    }
  }
  const email = process.env.GSC_SA_EMAIL
  const privateKey = process.env.GSC_SA_PRIVATE_KEY
  if (email && privateKey) return { email, privateKey }
  return null
}

/** Exchange a signed service-account JWT for a short-lived access token. */
async function getAccessToken({ email, privateKey }) {
  // GitHub secrets often store the PEM with literal "\n" — restore real newlines.
  const key = privateKey.replace(/\\n/g, '\n')
  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = base64url(
    JSON.stringify({ iss: email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 })
  )
  const signingInput = `${header}.${claim}`

  const signer = crypto.createSign('RSA-SHA256')
  signer.update(signingInput)
  signer.end()
  const signature = signer
    .sign(key)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  const jwt = `${signingInput}.${signature}`

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  if (!res.ok) {
    throw new Error(`Token exchange failed (${res.status}): ${(await res.text()).slice(0, 300)}`)
  }
  const data = await res.json()
  if (!data.access_token) throw new Error('Token exchange returned no access_token.')
  return data.access_token
}

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
  const token = await getAccessToken(sa)
  await submitSitemap(token, property)
  console.log('✓ Sitemap submitted to Google Search Console.')
}

main().catch((err) => {
  console.error('✗ Sitemap submission failed:', err.message)
  process.exit(1)
})
