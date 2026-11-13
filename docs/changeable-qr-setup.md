# Changeable QR links: setting up the keys

The tool lives at `/lab/changeable-qr`. It stays switched off (shows "not switched on here yet")
until the database keys and `SESSION_SECRET` exist. Everything below is free.

## What you need

| Variable                                             | Required   | What it is                                                            |
| ---------------------------------------------------- | ---------- | --------------------------------------------------------------------- |
| `SESSION_SECRET`                                     | yes        | Encrypts the sign-in cookie. At least 32 characters.                  |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | yes        | The database (accounts, names, links, rate limits).                   |
| `RESEND_API_KEY`                                     | yes        | Sends the confirm and reset emails. Already set for the contact form. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`           | for Google | "Continue with Google". Leave blank to hide the button.               |
| `SAFE_BROWSING_API_KEY`                              | optional   | Refuses links Google flags as phishing or malware.                    |
| `QR_BLOCKLIST`                                       | optional   | Comma list of names or sites to switch off at once.                   |

## 1. SESSION_SECRET

Run this and copy the output:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Use a different value for Preview and Production. Changing it later signs everyone out.

## 2. Database (Upstash Redis)

1. Sign up at upstash.com and choose **Create database** (type Redis).
2. Pick the region closest to your visitors (Mumbai if offered, otherwise Singapore). Keep TLS on.
3. **Leave eviction off.** With it on, Upstash may delete old keys when full, which would delete
   people's QR addresses.
4. Open the database, **REST API** section: copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
   (the normal token, not the read-only one).

If you add Upstash from the Vercel marketplace instead, it creates `KV_REST_API_URL` and
`KV_REST_API_TOKEN`. The code accepts those names too.

## 3. Google sign-in

1. Go to console.cloud.google.com and create a project (for example "DevStash").
2. **APIs & Services → OAuth consent screen**: user type **External**, app name DevStash, your support
   email, authorised domain `devstash.me`. Scopes: the default `openid` and `email` are enough.
3. Set the publishing status to **In production**. Basic email scopes need no Google review, and
   staying in "Testing" limits sign-in to 100 hand-picked users.
4. **Credentials → Create credentials → OAuth client ID → Web application**. Under **Authorised
   redirect URIs** add all three:
   - `https://devstash.me/api/qr/google`
   - `https://staging.devstash.me/api/qr/google`
   - `http://localhost:3000/api/qr/google`
5. Copy the client ID and secret into `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

## 4. Safe Browsing (optional)

In the same Google project enable the **Safe Browsing API**, then **Credentials → Create credentials →
API key**, and restrict the key to that API. Check Google's terms: the free Safe Browsing API is meant
for non-commercial use. The check never blocks a save if Google is slow or down.

## 5. Put them in Vercel

Project → **Settings → Environment Variables**. Add each variable, tick **Preview** first (that is
staging), and mark the secrets as **Sensitive**. Add **Production** only when you are ready to ship.
Then redeploy the `dev` branch (push, or **Redeploy** on the latest preview deployment): variables
only reach new deployments.

## 6. Local development

Copy the same values into `.env.local`. Without the database keys, local development uses an
in-memory store, so the tool still works and resets when the server restarts. Addresses ending in
`@example.test` never send real email; the tests read them from `/api/qr/dev-mail` (development only).

## 7. Check it works on staging

1. Open `/lab/changeable-qr`, create an account with an email you own, open the confirmation link.
2. Pick a name and a link, download the QR, scan it: it should open the link.
3. Change the link and scan the same QR again: it should open the new one.
4. Sign out, then try "Forgot password" and "Continue with Google".

## Switching a code off

Add its name (or a site, which also blocks its subdomains) to `QR_BLOCKLIST` in Vercel and redeploy.
A blocked code answers "not active" straight away. The name stays reserved.

## Security tests

```bash
pnpm test:unit                  # password and name rules
pnpm exec playwright test -c playwright.qa.config.ts tests/qa/qrlink.spec.ts
```

The second runs against `pnpm dev`. On a production build the feature is off, so those tests skip.
