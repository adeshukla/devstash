import Link from 'next/link'
import type { ReactNode } from 'react'

// No Navbar/Footer — these are standalone landing-page samples meant to look
// like real, isolated PPC pages, not pages inside the DevStash site shell.
export default function LabLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <div className="fixed bottom-4 left-4 z-50">
        <Link
          href="/projects"
          className="border-ds-border bg-ds-surface/90 text-ds-muted hover:border-ds-accent hover:text-ds-accent inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-xs backdrop-blur transition-colors"
        >
          ← devstash.me sample
        </Link>
      </div>
    </>
  )
}
