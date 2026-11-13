import { test, expect, type APIRequestContext } from '@playwright/test'
import type { PlaywrightWorkerArgs } from '@playwright/test'

type Playwright = PlaywrightWorkerArgs['playwright']

// Security tests for changeable QR links (sign-up, sign-in, reset, claim, redirect). They need a
// server with the store switched on, i.e. `pnpm dev` (in-memory store). On a production build
// the feature is off, so every test skips instead of failing.

const rnd = () => Math.random().toString(36).slice(2, 10)
const ipv4 = () =>
  `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`
const STRONG = 'mango-river-lantern-42'

test.describe('changeable QR links: security', () => {
  let origin = ''

  test.beforeEach(async ({ request, baseURL }) => {
    origin = new URL(baseURL!).origin
    const me = await request.get('/api/qr')
    const mail = await request.get('/api/qr/dev-mail?to=x@example.test')
    test.skip(
      !(await me.json()).available || mail.status() === 404,
      'Store or test mail is off here'
    )
  })

  /** A client with its own cookies and its own client address, so tests never share rate limits. */
  const client = (request: APIRequestContext, ip = ipv4()) => {
    const headers = { origin, 'x-forwarded-for': ip }
    const post = (data: unknown) => request.post('/api/qr', { headers, data })
    return {
      post,
      me: async () => (await request.get('/api/qr', { headers })).json(),
      async mailed(to: string, kind: 'confirm' | 'reset') {
        const body = await (
          await request.get(`/api/qr/dev-mail?to=${encodeURIComponent(to)}`)
        ).json()
        return new RegExp(`[?]${kind}=([\\w-]+)`).exec(body.text ?? '')?.[1] ?? ''
      },
      async account(email = `${rnd()}@example.test`, password = STRONG) {
        expect((await post({ action: 'signup', email, password })).status()).toBe(200)
        const token = await this.mailed(email, 'confirm')
        expect((await post({ action: 'confirm', token })).status()).toBe(200)
        return { email, password }
      },
    }
  }
  const fresh = async (playwright: Playwright, baseURL: string) =>
    playwright.request.newContext({ baseURL })

  test('refuses other sites, oversized bodies and junk', async ({ request }) => {
    const c = client(request)
    const body = { action: 'logout' }
    expect(
      (
        await request.post('/api/qr', { headers: { origin: 'https://evil.example' }, data: body })
      ).status()
    ).toBe(403)
    expect((await request.post('/api/qr', { data: body })).status()).toBe(403)
    const big = await request.post('/api/qr', {
      headers: { origin, 'x-forwarded-for': ipv4(), 'content-type': 'application/json' },
      data: JSON.stringify({ action: 'claim', name: 'x', url: 'a'.repeat(11_000) }),
    })
    expect(big.status()).toBe(413)
    const junk = await request.post('/api/qr', {
      headers: { origin, 'x-forwarded-for': ipv4(), 'content-type': 'application/json' },
      data: '{not json',
    })
    expect(junk.status()).toBe(400)
    expect((await c.post({ action: 'drop-database' })).status()).toBe(400)
    expect((await request.put('/api/qr', { headers: { origin } })).status()).toBe(405)
  })

  test('changing a link needs a sign-in', async ({ request }) => {
    const c = client(request)
    for (const body of [
      { action: 'claim', name: 'abcdef', url: 'https://example.com' },
      { action: 'update', url: 'https://example.com' },
      { action: 'retire' },
    ])
      expect((await c.post(body)).status(), body.action).toBe(401)
  })

  test('sign-up: weak passwords are refused and the email must be confirmed first', async ({
    request,
  }) => {
    const c = client(request)
    const email = `${rnd()}@example.test`
    for (const password of [
      'short',
      'password123',
      'qwertyuiop',
      'devstash-2026-x',
      'aaaaaaaaaaaa',
    ])
      expect(
        (await c.post({ action: 'signup', email: `${rnd()}@example.test`, password })).status(),
        password
      ).toBe(422)
    // Not an account until the link is opened.
    expect((await c.post({ action: 'signup', email, password: STRONG })).status()).toBe(200)
    expect((await c.post({ action: 'login', email, password: STRONG })).status()).toBe(401)
    const token = await c.mailed(email, 'confirm')
    expect(token.length).toBeGreaterThan(20)
    expect((await c.post({ action: 'confirm', token })).status()).toBe(200)
    expect((await c.me()).email).toBe(email)
    // A link works once, and a reset link is not a confirm link.
    expect((await c.post({ action: 'confirm', token })).status()).toBe(400)
    expect((await c.post({ action: 'confirm', token: 'A'.repeat(40) })).status()).toBe(400)
  })

  test('the email name cannot be the password', async ({ request }) => {
    const c = client(request)
    const name = `person${rnd()}`
    const r = await c.post({
      action: 'signup',
      email: `${name}@example.test`,
      password: `${name}-2026-ok`,
    })
    expect(r.status()).toBe(422)
  })

  test('claiming: rules, redirect, update, retire; names are never reused', async ({
    request,
    playwright,
    baseURL,
  }) => {
    const c = client(request)
    await c.account()
    const name = `qa-${rnd()}`
    for (const bad of [
      'ab',
      'admin',
      'paypal',
      'has space',
      '-lead',
      'a--b',
      'UPPER_x',
      'x'.repeat(21),
    ])
      expect(
        (await c.post({ action: 'claim', name: bad, url: 'https://example.com' })).status(),
        bad
      ).toBe(422)
    for (const url of [
      'javascript:alert(1)',
      'data:text/html,hi',
      'file:///etc/passwd',
      'http://127.0.0.1/',
      'http://169.254.169.254/',
      'http://[::1]/',
      `${origin}/q/other`,
      'https://user:pw@example.com',
    ])
      expect((await c.post({ action: 'claim', name, url })).status(), url).toBe(422)
    expect(
      (
        await c.post({ action: 'claim', name: name.toUpperCase(), url: 'https://example.com/one' })
      ).status()
    ).toBe(200)
    expect(
      (await c.post({ action: 'claim', name: `${name}-2`, url: 'https://example.com' })).status()
    ).toBe(409)

    const hop = async () => request.get(`/q/${name}`, { maxRedirects: 0 })
    let r = await hop()
    expect(r.status()).toBe(307)
    expect(r.headers().location).toBe('https://example.com/one')
    expect(r.headers()['cache-control']).toContain('no-store')
    expect(r.headers()['x-robots-tag']).toContain('noindex')
    expect((await c.post({ action: 'update', url: 'https://example.org/two' })).status()).toBe(200)
    r = await hop()
    expect(r.headers().location).toBe('https://example.org/two')
    expect((await c.post({ action: 'update', url: 'javascript:alert(1)' })).status()).toBe(422)

    // Someone else cannot take the name while it is live, nor after it is retired.
    const other = await fresh(playwright, baseURL!)
    const o = client(other)
    await o.account()
    expect((await o.post({ action: 'claim', name, url: 'https://example.net' })).status()).toBe(409)
    expect((await c.post({ action: 'retire' })).status()).toBe(200)
    expect((await hop()).status()).toBe(404)
    expect((await o.post({ action: 'claim', name, url: 'https://example.net' })).status()).toBe(409)
    expect((await hop()).status()).toBe(404)
    await other.dispose()
  })

  test('the redirect route only answers valid names and never guesses', async ({ request }) => {
    for (const bad of ['nobody-here', 'ab', 'UPPER', 'a_b', 'x'.repeat(40)]) {
      const r = await request.get(`/q/${bad}`, { maxRedirects: 0 })
      expect(r.status(), bad).toBe(404)
      expect(r.headers()['x-robots-tag']).toContain('noindex')
    }
  })

  test('a password reset ends other sign-ins, and a weak password keeps the link', async ({
    request,
    playwright,
    baseURL,
  }) => {
    const a = client(request)
    const { email } = await a.account()
    const other = await fresh(playwright, baseURL!)
    const b = client(other)
    expect((await b.post({ action: 'login', email, password: STRONG })).status()).toBe(200)
    expect((await b.me()).email).toBe(email)

    expect((await b.post({ action: 'forgot', email })).status()).toBe(200)
    const token = await b.mailed(email, 'reset')
    expect((await b.post({ action: 'reset', token, password: 'password123' })).status()).toBe(422)
    // The link survived the weak attempt.
    await new Promise((r) => setTimeout(r, 20))
    expect(
      (await b.post({ action: 'reset', token, password: 'copper-fox-window-77' })).status()
    ).toBe(200)
    expect(
      (await b.post({ action: 'reset', token, password: 'copper-fox-window-88' })).status()
    ).toBe(400)

    expect((await a.me()).email, 'the older sign-in is gone').toBeNull()
    expect((await b.me()).email, 'the new one works').toBe(email)
    const c = client(request)
    expect((await c.post({ action: 'login', email, password: STRONG })).status()).toBe(401)
    expect(
      (await c.post({ action: 'login', email, password: 'copper-fox-window-77' })).status()
    ).toBe(200)
    await other.dispose()
  })

  test('nothing reveals whether an email has an account', async ({ request }) => {
    const c = client(request)
    const { email } = await c.account()
    const known = await c.post({ action: 'forgot', email })
    const unknown = await c.post({ action: 'forgot', email: `${rnd()}@example.test` })
    expect([known.status(), await known.json()]).toEqual([unknown.status(), await unknown.json()])
    const wrongKnown = await c.post({ action: 'login', email, password: 'not-the-password-1' })
    const wrongUnknown = await c.post({
      action: 'login',
      email: `${rnd()}@example.test`,
      password: 'not-the-password-1',
    })
    expect(wrongKnown.status()).toBe(401)
    expect([wrongKnown.status(), await wrongKnown.json()]).toEqual([
      wrongUnknown.status(),
      await wrongUnknown.json(),
    ])
    // Signing up again with an existing email answers the same as a new one.
    const again = await c.post({ action: 'signup', email, password: STRONG })
    expect(again.status()).toBe(200)
  })

  test('guessing passwords is slowed down', async ({ request }) => {
    const c = client(request)
    const { email } = await c.account()
    const statuses: number[] = []
    for (let i = 0; i < 12; i++)
      statuses.push(
        (await c.post({ action: 'login', email, password: `wrong-guess-${i}-xx` })).status()
      )
    expect(statuses.slice(0, 10).every((s) => s === 401)).toBe(true)
    expect(statuses.at(-1)).toBe(429)
    // Even the right password waits while the limit holds.
    expect((await c.post({ action: 'login', email, password: STRONG })).status()).toBe(429)
  })

  test('sending emails is limited so nobody can be flooded', async ({ request }) => {
    const c = client(request)
    const email = `${rnd()}@example.test`
    const statuses: number[] = []
    for (let i = 0; i < 5; i++) statuses.push((await c.post({ action: 'forgot', email })).status())
    expect(statuses.slice(0, 3)).toEqual([200, 200, 200])
    expect(statuses.slice(3)).toEqual([429, 429])
  })

  test('the session cookie is HttpOnly and SameSite, and responses are never cached', async ({
    request,
  }) => {
    const c = client(request)
    const email = `${rnd()}@example.test`
    await c.post({ action: 'signup', email, password: STRONG })
    const token = await c.mailed(email, 'confirm')
    const res = await c.post({ action: 'confirm', token })
    const cookie = res.headers()['set-cookie'] ?? ''
    expect(cookie).toContain('devstash_qr=')
    expect(cookie.toLowerCase()).toContain('httponly')
    expect(cookie.toLowerCase()).toContain('samesite=lax')
    expect(res.headers()['cache-control']).toContain('no-store')
    const me = await request.get('/api/qr')
    expect(me.headers()['cache-control']).toContain('no-store')
    expect(JSON.stringify(await me.json())).not.toMatch(/s1\$|password|hash/i)
  })

  test('Google sign-in refuses a missing or wrong state', async ({ request }) => {
    const r = await request.get('/api/qr/google?code=abc&state=forged', { maxRedirects: 0 })
    expect(r.status()).toBe(307)
    expect(r.headers().location).toMatch(/\/lab\/changeable-qr\?error=google/)
    // Never an open redirect: the return address is the site's own.
    expect(new URL(r.headers().location).origin).toBe(origin)
    const forged = await request.get('/api/qr/google?code=abc&state=forged', {
      maxRedirects: 0,
      headers: { 'x-forwarded-host': 'evil.example' },
    })
    expect(new URL(forged.headers().location).host).not.toBe('evil.example')
  })

  test('a forged Host header cannot point emails at another site', async ({ request }) => {
    const email = `${rnd()}@example.test`
    const r = await request.post('/api/qr', {
      headers: { origin, 'x-forwarded-for': ipv4(), 'x-forwarded-host': 'evil.example' },
      data: { action: 'forgot', email },
    })
    // Same-origin check compares Origin with the forwarded host, so a mismatch is simply refused.
    expect([200, 403]).toContain(r.status())
    if (r.status() === 200) {
      const mail = await (
        await request.get(`/api/qr/dev-mail?to=${encodeURIComponent(email)}`)
      ).json()
      expect(mail.text).not.toContain('evil.example')
    }
  })
})
