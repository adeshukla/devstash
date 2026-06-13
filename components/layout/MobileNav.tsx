// components/layout/MobileNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'

interface NavItem {
  label: string
  href: string
}

interface MobileNavProps {
  items: readonly NavItem[]
}

export function MobileNav({ items }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const pathname = usePathname()

  // Close on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Sync dialog open/close
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open) {
      dialog.showModal()
      document.body.style.overflow = 'hidden'
    } else {
      dialog.close()
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Close on Escape (dialog handles this natively, just sync state)
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const handler = () => setOpen(false)
    dialog.addEventListener('close', handler)
    return () => dialog.removeEventListener('close', handler)
  }, [])

  return (
    <>
      {/* Hamburger / Close button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
        aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={open}
        aria-controls="mobile-nav-dialog"
      >
        {open ? (
          // X icon
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M2 2l12 12M14 2L2 14"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          // Hamburger icon
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M2 4h12M2 8h12M2 12h8"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>

      {/* Dialog — accessible, traps focus, closes on Escape */}
      <dialog
        ref={dialogRef}
        id="mobile-nav-dialog"
        aria-label="Navigation menu"
        className="fixed inset-0 m-0 h-full max-h-full w-full max-w-full bg-transparent p-0 backdrop:bg-black/60"
        style={{ border: 'none' }}
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(false)
        }}
      >
        <div
          className="absolute top-0 right-0 flex h-full w-72 flex-col"
          style={{
            background: '#111827',
            borderLeft: '1px solid rgba(255,255,255,0.06)',
            animation: open ? 'slideIn .25s ease' : undefined,
          }}
        >
          {/* Header */}
          <div className="border-ds-border flex h-[58px] items-center justify-between border-b px-5">
            <span
              className="text-ds-text text-[16px] font-bold tracking-tight"
              style={{ letterSpacing: '-0.04em' }}
            >
              <span className="text-ds-accent">Dev</span>Stash
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-ds-muted hover:text-ds-text flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
              aria-label="Close menu"
              autoFocus
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M2 2l12 12M14 2L2 14"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex flex-1 flex-col gap-1 p-4" aria-label="Mobile navigation">
            {items.map(({ label, href }) => {
              const isActive = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-4 py-3 text-[14px] font-medium',
                    'transition-colors duration-200',
                    isActive
                      ? 'bg-ds-accent/10 text-ds-accent'
                      : 'text-ds-muted hover:text-ds-text hover:bg-white/5'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {isActive && (
                    <span
                      className="bg-ds-accent h-1.5 w-1.5 flex-shrink-0 rounded-full"
                      aria-hidden="true"
                    />
                  )}
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Contact CTA + Résumé */}
          <div className="border-ds-border flex flex-col gap-2 border-t p-4">
            <a
              href="/resume-adesh-shukla.pdf"
              download
              data-analytics-event="cv_viewed"
              className="border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent flex h-11 w-full items-center justify-center rounded-lg border text-[14px] font-medium transition-colors"
            >
              Download résumé ↓
            </a>
            <Link
              href="/contact"
              className="bg-ds-accent flex h-11 w-full items-center justify-center rounded-lg text-[14px] font-semibold text-white transition-colors hover:bg-blue-400"
            >
              Contact
            </Link>
          </div>
        </div>

        <style>{`
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
          }
        `}</style>
      </dialog>
    </>
  )
}
