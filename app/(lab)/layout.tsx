import Link from 'next/link'
import type { ReactNode } from 'react'

// No Navbar/Footer — Lab tools are standalone pages. The way back is a normal
// in-flow link at the top, not a fixed pill: a fixed pill sat on top of content
// on narrow screens (it covered a heading at 300px).
export default function LabLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <nav aria-label="Lab" className="bg-ds-bg px-6 pt-4">
        <Link
          href="/lab"
          className="border-ds-border bg-ds-surface text-ds-muted hover:border-ds-accent hover:text-ds-accent inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-xs transition-colors"
        >
          ← devstash.me/lab
        </Link>
      </nav>
      {children}
    </>
  )
}
