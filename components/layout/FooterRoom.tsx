import Link from 'next/link'
import type { CSSProperties } from 'react'
import { projectBrand } from '@/components/icons/ProjectMark'
import { CopyEmail } from './CopyEmail'
import { FooterLottie } from './FooterLottie'
import { FooterWindow } from './FooterWindow'
import { Reveal } from '@/components/ui/Reveal'

// Shipped products with their own brand, pinned on the board. Same marks and
// colours as the home deck and project covers.
const PINS: { slug: string; name: string; tilt: number }[] = [
  { slug: 'pare', name: 'Pare', tilt: -2.5 },
  { slug: 'praxis', name: 'Praxis', tilt: 2 },
  { slug: 'build-components', name: 'Build Components', tilt: 1.5 },
  { slug: 'motion-lab', name: 'Motion Lab', tilt: -1.5 },
]

/**
 * The footer's closing band, drawn as one room across the full width: a wall
 * on the left (a window onto Ghaziabad's real-time sky, a pinboard of shipped
 * work, a sticky note with the email) and the desk on the right (the Lottie,
 * with the stack bursting out of the monitor).
 * One floor line runs under both. Replaced the sign-off terminal.
 * Everything is visible at rest; arrival only adds motion (`.footer-room`).
 */
export function FooterRoom({ email }: { email: string }) {
  return (
    <div className="footer-room relative grid grid-cols-[minmax(0,1fr)] items-end gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <div className="grid grid-cols-[minmax(0,1fr)] items-end gap-7 pb-7 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="sm:col-span-2">
          <p className="text-ds-accent font-mono text-xs tracking-widest uppercase">
            {'// end of page'}
          </p>
          <p className="text-ds-text mt-3 text-2xl leading-tight font-bold tracking-tight sm:text-3xl">
            Thanks for scrolling all the way down.
          </p>
        </div>

        <FooterWindow />

        <Reveal className="footer-board">
          <p className="text-ds-muted mb-3 font-mono text-[11px] tracking-[0.12em] uppercase">
            Shipped &amp; live
          </p>
          <ul className="m-0 grid list-none grid-cols-2 gap-x-3 gap-y-3.5 p-0">
            {PINS.map(({ slug, name, tilt }, i) => {
              const { Mark, color } = projectBrand(slug)
              return (
                <li key={slug} className="min-w-0">
                  <Link
                    href={`/projects/${slug}`}
                    className="footer-pin"
                    style={{ '--r': `${tilt}deg`, '--c': color, '--i': i } as CSSProperties}
                  >
                    <span className="block h-7 w-7 shrink-0 overflow-hidden rounded-lg [&>svg]:h-full [&>svg]:w-full">
                      <Mark />
                    </span>
                    <span className="min-w-0">{name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
          <div className="footer-note">
            <p className="font-bold">Say hi</p>
            <p>Open to frontend roles anywhere in India · remote/hybrid.</p>
            <CopyEmail email={email} />
            <Link href="/contact" className="footer-note-link">
              or use the contact form →
            </Link>
          </div>
        </Reveal>
      </div>

      <div className="flex justify-center lg:justify-end">
        <FooterLottie />
      </div>
      <div aria-hidden="true" className="footer-floor" />
    </div>
  )
}
