'use client'

import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui'
import { QrPanel } from './QrPanel'

/** Readable file name from the link, e.g. qr-google-spring-sale. */
function fileBase(url: string) {
  try {
    const p = new URL(url).searchParams
    const parts = [p.get('utm_source'), p.get('utm_campaign')].filter(Boolean)
    if (parts.length) return `qr-${parts.join('-')}`.slice(0, 76)
  } catch {}
  return 'utm-qr'
}

/**
 * QR code for one tagged link, in a native modal <dialog> (focus trap and Esc
 * come with it). The code is static: it holds the full link, so it never
 * expires, there is no shortener and nothing is stored. Mount it with
 * key={url} so each link starts from fresh state.
 */
export function UtmQr({ url, onClose }: { url: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    dialog.current?.showModal()
  }, [])

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      aria-label="QR code for this link"
      className="border-ds-border bg-ds-surface text-ds-text m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border p-5 backdrop:bg-black/60"
    >
      <h2 className="text-lg font-semibold">QR code</h2>
      <p className="text-ds-muted mt-1 mb-4 text-sm">
        A static code: the link is stored inside the pattern, so it never expires and there is no
        subscription.
      </p>
      <QrPanel text={url} fileBase={fileBase(url)} showText>
        <Button type="button" size="sm" variant="ghost" onClick={() => dialog.current?.close()}>
          Close
        </Button>
      </QrPanel>
    </dialog>
  )
}
