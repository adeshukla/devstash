// scripts/indexing/gsc-auth.mjs
//
// Shared Search Console auth: service-account JWT -> access token, built with
// node:crypto so there is no googleapis dependency. Used by submit-sitemap.mjs
// and check-index-status.mjs.

import crypto from 'node:crypto'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/** Read the service account from either a full JSON blob or discrete env vars. */
export function readServiceAccount() {
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
export async function getAccessToken({ email, privateKey }, scope) {
  // GitHub secrets often store the PEM with literal "\n" — restore real newlines.
  const key = privateKey.replace(/\\n/g, '\n')
  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = base64url(
    JSON.stringify({ iss: email, scope, aud: TOKEN_URL, iat: now, exp: now + 3600 })
  )
  const signingInput = `${header}.${claim}`

  const signer = crypto.createSign('RSA-SHA256')
  signer.update(signingInput)
  signer.end()
  const jwt = `${signingInput}.${base64url(signer.sign(key))}`

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
