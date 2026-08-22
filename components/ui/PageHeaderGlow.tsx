// Shared header atmosphere — grid texture + one cursor-parallax aurora blob.
// First introduced on the homepage hero and the Contact page; extracted here
// so every page-level header carries the same depth instead of each one
// re-inventing (or omitting) it. Drop as the first child of a
// `relative overflow-hidden` header <section>.

import { MouseParallax } from './MouseParallax'

interface PageHeaderGlowProps {
  color?: 'accent' | 'purple'
  side?: 'left' | 'right'
}

export function PageHeaderGlow({ color = 'accent', side = 'right' }: PageHeaderGlowProps) {
  const blobColor = color === 'purple' ? 'bg-ds-purple' : 'bg-ds-accent'
  // Percentages here resolve against this absolutely-positioned wrapper's
  // own width, which spans the FULL section edge-to-edge (not the
  // max-w-Nxl content column inside it) — so a negative left offset (as
  // opposed to the homepage hero's proven `left-1/4` positive offset,
  // mirrored below) compounds with the translate and pushes the blob well
  // past the section's overflow-hidden clip on wide viewports. Invisible on
  // desktop, still visible on mobile purely because the section itself is
  // narrower there — not an intentional responsive behavior.
  const blobPosition = side === 'left' ? 'left-1/4 -translate-x-1/2' : 'right-1/4 translate-x-1/2'

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--color-ds-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-ds-border)_1px,transparent_1px)] bg-[size:64px_64px] opacity-25"
      />
      <MouseParallax strength={-14} className="pointer-events-none absolute inset-0 -z-10">
        <div
          aria-hidden="true"
          className={`animate-aurora absolute -top-32 h-[380px] w-[380px] rounded-full opacity-[0.14] blur-3xl ${blobColor} ${blobPosition}`}
        />
      </MouseParallax>
    </>
  )
}
