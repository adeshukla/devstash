'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button, Input } from '@/components/ui'
import { QrPanel } from './QrPanel'
import { trackLab } from './track'

type Me =
  | { available: false }
  | { available: true; email: null }
  | { available: true; email: string; link: { name: string; url: string } | null }

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

/** Sign in by email, claim a permanent address, and change where its QR code points. */
export function ChangeableQr() {
  const [me, setMe] = useState<Me | null>(null)
  const [token, setToken] = useState('')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
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
    const t = new URLSearchParams(window.location.search).get('token')
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the sign-in link once on mount
    if (t) setToken(t)
    else void load()
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

  const finishSignIn = () =>
    run({ action: 'verify', token }, () => {
      window.history.replaceState(null, '', window.location.pathname)
      setToken('')
      void load()
    })

  const box = 'border-ds-border bg-ds-bg rounded-xl border p-5'
  const err = error && (
    <p role="alert" className="text-ds-error mt-3 text-sm">
      {error}
    </p>
  )

  if (token)
    return (
      <div className={box}>
        <h2 className="text-ds-text text-lg font-semibold">Finish signing in</h2>
        <p className="text-ds-muted mt-1 text-sm">One click confirms this browser.</p>
        <Button className="mt-4" onClick={finishSignIn} loading={busy}>
          Sign in
        </Button>
        {err}
      </div>
    )

  if (!me) return <p className="text-ds-muted text-sm">Loading…</p>

  if (!me.available)
    return (
      <p className="text-ds-muted text-sm">
        Changeable QR links are not switched on here yet. The normal QR generator above still works.
      </p>
    )

  if (!me.email)
    return (
      <form
        className={box}
        onSubmit={(e) => {
          e.preventDefault()
          void run({ action: 'login', email }, () => setSent(true))
        }}
      >
        <h2 className="text-ds-text text-lg font-semibold">Sign in with your email</h2>
        {sent ? (
          <p role="status" className="text-ds-text mt-2 text-sm">
            Check your inbox. The link works once and lasts 15 minutes.
          </p>
        ) : (
          <>
            <p className="text-ds-muted mt-1 mb-4 text-sm">
              No password. We email you a link, and your address is used only to sign you in.
            </p>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button className="mt-4" type="submit" loading={busy}>
              Email me a sign-in link
            </Button>
          </>
        )}
        {err}
      </form>
    )

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
        <Button className="mt-4" type="submit" loading={busy}>
          Create my QR code
        </Button>
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
