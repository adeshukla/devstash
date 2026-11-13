'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button, Input } from '@/components/ui'
import { QrPanel } from './QrPanel'
import { trackLab } from './track'

type Me =
  | { available: false }
  | { available: true; email: null; google: boolean }
  | { available: true; email: string; google: boolean; link: { name: string; url: string } | null }

async function call(body: object): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('/api/qr', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = (await res.json()) as { error?: string }
    return res.ok ? { ok: true } : { ok: false, error: data.error ?? 'Something went wrong.' }
  } catch {
    return { ok: false, error: 'Could not reach the server. Check your connection.' }
  }
}

const ERRORS: Record<string, string> = {
  google: 'Google sign-in did not work. Try again, or use your email and password.',
  'google-off': 'Google sign-in is not switched on here.',
}

/** Sign in (email and password, or Google), claim a permanent address, and change where its QR code points. */
export function ChangeableQr() {
  const [me, setMe] = useState<Me | null>(null)
  const [confirmTok, setConfirmTok] = useState('')
  const [resetTok, setResetTok] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [sent, setSent] = useState('')
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [confirmRetire, setConfirmRetire] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/qr', { cache: 'no-store' })
      const data = (await res.json()) as Me
      setMe(data)
      if ('link' in data && data.link) setUrl(data.link.url)
    } catch {
      setMe({ available: false })
    }
  }, [])

  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const c = q.get('confirm')
    const r = q.get('reset')
    const e = q.get('error')
    /* eslint-disable react-hooks/set-state-in-effect -- reads the emailed link and Google's answer once on mount */
    if (c) setConfirmTok(c)
    else if (r) setResetTok(r)
    else {
      if (e) setError(ERRORS[e] ?? '')
      void load()
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [load])

  async function run(body: object, after?: () => void) {
    setBusy(true)
    setError('')
    setSaved(false)
    const r = await call(body)
    setBusy(false)
    if (!r.ok) return setError(r.error ?? '')
    after?.()
  }

  const signedIn = () => {
    window.history.replaceState(null, '', window.location.pathname)
    setConfirmTok('')
    setResetTok('')
    setPw('')
    void load()
  }

  const box = 'border-ds-border bg-ds-bg rounded-xl border p-5'
  const err = error && (
    <p role="alert" className="text-ds-error mt-3 text-sm">
      {error}
    </p>
  )

  if (confirmTok)
    return (
      <div className={box}>
        <h2 className="text-ds-text text-lg font-semibold">Confirm your email</h2>
        <p className="text-ds-muted mt-1 text-sm">One click finishes creating your account.</p>
        <Button
          className="mt-4"
          loading={busy}
          onClick={() => void run({ action: 'confirm', token: confirmTok }, signedIn)}
        >
          Confirm and sign in
        </Button>
        {err}
      </div>
    )

  if (resetTok)
    return (
      <form
        className={box}
        onSubmit={(e) => {
          e.preventDefault()
          void run({ action: 'reset', token: resetTok, password: pw }, signedIn)
        }}
      >
        <h2 className="text-ds-text text-lg font-semibold">Choose a new password</h2>
        <Input
          className="mt-4"
          label="New password"
          type="password"
          autoComplete="new-password"
          hint="At least 10 characters, nothing common."
          required
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
        <Button className="mt-4" type="submit" loading={busy}>
          Save password and sign in
        </Button>
        {err}
      </form>
    )

  if (!me) return <p className="text-ds-muted text-sm">Loading…</p>

  if (!me.available)
    return (
      <p className="text-ds-muted text-sm">
        Changeable QR links are not switched on here yet. The normal QR generator above still works.
      </p>
    )

  if (!me.email) {
    const titles = {
      signin: 'Sign in',
      signup: 'Create your account',
      forgot: 'Reset your password',
    }
    const go = (m: typeof mode) => {
      setMode(m)
      setError('')
      setSent('')
    }
    const link = 'text-ds-accent text-sm underline underline-offset-2'
    return (
      <form
        className={box}
        onSubmit={(e) => {
          e.preventDefault()
          if (mode === 'signin') void run({ action: 'login', email, password: pw }, signedIn)
          else if (mode === 'signup')
            void run({ action: 'signup', email, password: pw }, () =>
              setSent('Check your inbox and open the link to confirm your email.')
            )
          else
            void run({ action: 'forgot', email }, () =>
              setSent('If that email has an account, a reset link is on its way.')
            )
        }}
      >
        <h2 className="text-ds-text text-lg font-semibold">{titles[mode]}</h2>
        {sent ? (
          <p role="status" className="text-ds-text mt-2 text-sm">
            {sent} The link works once and lasts an hour.
          </p>
        ) : (
          <>
            {me.google && mode !== 'forgot' && (
              <>
                <a
                  href="/api/qr/google"
                  className="border-ds-border2 text-ds-text hover:bg-ds-surface2 mt-4 inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium"
                >
                  Continue with Google
                </a>
                <p className="text-ds-muted my-3 text-xs">or use your email</p>
              </>
            )}
            <Input
              className="mt-4"
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {mode !== 'forgot' && (
              <Input
                className="mt-4"
                label="Password"
                type="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                hint={mode === 'signup' ? 'At least 10 characters, nothing common.' : undefined}
                required
                value={pw}
                onChange={(e) => setPw(e.target.value)}
              />
            )}
            <Button className="mt-4" type="submit" loading={busy}>
              {mode === 'signin'
                ? 'Sign in'
                : mode === 'signup'
                  ? 'Create account'
                  : 'Email me a reset link'}
            </Button>
          </>
        )}
        {err}
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          {mode !== 'signin' && (
            <button type="button" className={link} onClick={() => go('signin')}>
              I have an account
            </button>
          )}
          {mode !== 'signup' && (
            <button type="button" className={link} onClick={() => go('signup')}>
              Create an account
            </button>
          )}
          {mode === 'signin' && (
            <button type="button" className={link} onClick={() => go('forgot')}>
              Forgot password?
            </button>
          )}
        </div>
      </form>
    )
  }

  const link = me.link

  if (!link)
    return (
      <form
        className={box}
        onSubmit={(e) => {
          e.preventDefault()
          void run({ action: 'claim', name, url }, () => {
            trackLab('changeable-qr', 'claim')
            void load()
          })
        }}
      >
        <h2 className="text-ds-text text-lg font-semibold">Pick your permanent address</h2>
        <p className="text-ds-muted mt-1 mb-4 text-sm">
          The QR code will always contain this address. You can change where it leads, but not the
          name, so choose one you will be happy to print.
        </p>
        <Input
          label="Name"
          hint={`Your QR will open ${window.location.host}/q/${name.trim().toLowerCase() || 'yourname'}`}
          autoComplete="off"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          className="mt-4"
          label="Where should it lead?"
          type="url"
          placeholder="https://example.com/page"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button type="submit" loading={busy}>
            Create my QR code
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void run({ action: 'logout' }, load)}
          >
            Sign out ({me.email})
          </Button>
        </div>
        {err}
      </form>
    )

  const address = `${window.location.origin}/q/${link.name}`
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className={box}>
        <h2 className="text-ds-text text-lg font-semibold">Where your QR code leads</h2>
        <p className="text-ds-muted mt-1 mb-4 font-mono text-xs break-all">{address}</p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void run({ action: 'update', url }, () => {
              trackLab('changeable-qr', 'update')
              setSaved(true)
              void load()
            })
          }}
        >
          <Input
            label="Destination"
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Button className="mt-4" type="submit" loading={busy}>
            Save new destination
          </Button>
          {saved && (
            <p role="status" className="text-ds-success mt-3 text-sm">
              Saved. The same QR code now opens the new page.
            </p>
          )}
        </form>
        {err}
        <div className="border-ds-border mt-6 flex flex-wrap items-center gap-3 border-t pt-4">
          <Button variant="ghost" size="sm" onClick={() => void run({ action: 'logout' }, load)}>
            Sign out ({me.email})
          </Button>
          {confirmRetire ? (
            <Button
              variant="danger"
              size="sm"
              onClick={() =>
                void run({ action: 'retire' }, () => {
                  setConfirmRetire(false)
                  setUrl('')
                  setName('')
                  void load()
                })
              }
            >
              Yes, stop this code for good
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setConfirmRetire(true)}>
              Stop this code
            </Button>
          )}
        </div>
      </div>
      <QrPanel
        key={address}
        text={address}
        fileBase={`qr-${link.name}`}
        showText
        tool="changeable-qr"
        kind="link"
      />
    </div>
  )
}
