// The hero's secondary visual — a small "build status" terminal window.
// Previously a fake syntax-highlighted code snippet (random colored bars
// standing in for "code"): decoration with no relationship to Adesh
// specifically, the single most recognizable "generic AI-template portfolio"
// tell. Replaced with something true instead of decorative: the actual
// checks this site's own CI pipeline runs on every push (see
// .github/workflows/ci.yml — typecheck, lint, build) and the same claims
// already made across the site (structured data on every page, WCAG-audited
// a11y, a Lighthouse 90+ target). Nothing here is invented.
//
// It plays out like a real build, once: the command types itself, a progress
// bar runs, each check spins then ticks, and the status in the title bar goes
// from "building" to "passing". Pure CSS (.build-* in globals.css, timed by
// --d per line) — no client JS, so this stays a Server Component and never
// touches hero LCP. Under reduced motion every animation collapses to its end
// state, so the finished build shows straight away.

import type { CSSProperties } from 'react'

const CHECKS: { label: string; detail: string }[] = [
  { label: 'TypeScript', detail: 'strict mode, 0 errors' },
  { label: 'Lighthouse', detail: '90+ target, every route' },
  { label: 'WCAG AA', detail: 'audited' },
  { label: 'Structured data', detail: 'every page' },
]

// Seconds: when the first check starts, and the gap between checks.
const FIRST = 1.1
const STEP = 0.6
const DONE = FIRST + CHECKS.length * STEP + 0.2

const delay = (s: number) => ({ '--d': `${s}s` }) as CSSProperties

export function HeroGraphic() {
  return (
    <div
      aria-hidden="true"
      className="border-ds-border bg-ds-surface animate-float w-full overflow-hidden rounded-xl border shadow-2xl shadow-black/40"
    >
      {/* Window chrome */}
      <div className="border-ds-border flex h-12 items-center gap-3 border-b px-5">
        <div className="flex gap-2">
          <span className="bg-ds-error/80 h-3 w-3 rounded-full" />
          <span className="bg-ds-warning/80 h-3 w-3 rounded-full" />
          <span className="bg-ds-success/80 h-3 w-3 rounded-full" />
        </div>
        <span className="text-ds-muted font-mono text-xs tracking-wide">devstash — pnpm build</span>
        {/* building → passing */}
        <span className="ml-auto grid font-mono text-xs">
          <span
            className="build-status-wip text-ds-warning flex items-center gap-1.5 [grid-area:1/1]"
            style={delay(DONE)}
          >
            <span className="bg-ds-warning h-1.5 w-1.5 animate-pulse rounded-full" />
            building
          </span>
          <span
            className="build-status-ok text-ds-success flex items-center gap-1.5 [grid-area:1/1]"
            style={delay(DONE)}
          >
            <span className="bg-ds-success h-1.5 w-1.5 rounded-full" />
            passing
          </span>
        </span>
      </div>

      <div className="flex flex-col gap-4 px-6 py-8 font-mono text-[15px]">
        <div>
          <p className="text-ds-muted">
            <span className="text-ds-accent">$</span> <span className="build-type">pnpm build</span>
          </p>
          {/* Progress across the whole run */}
          <span className="bg-ds-border mt-3 block h-0.5 overflow-hidden rounded-full">
            <span
              className="build-bar bg-ds-accent block h-full"
              style={
                { '--d': `${FIRST - 0.2}s`, '--len': `${DONE - FIRST + 0.2}s` } as CSSProperties
              }
            />
          </span>
        </div>

        {CHECKS.map(({ label, detail }, i) => (
          <p
            key={label}
            className="build-line flex items-baseline gap-2"
            style={delay(FIRST + i * STEP)}
          >
            <span className="grid w-[1ch] place-items-center self-center">
              <span className="build-spin [grid-area:1/1]" />
              <span className="build-tick text-ds-success [grid-area:1/1]">✓</span>
            </span>
            <span className="text-ds-text">{label}</span>
            <span className="build-detail text-ds-muted">— {detail}</span>
          </p>
        ))}

        <p className="build-line text-ds-accent mt-1 flex items-baseline gap-2" style={delay(DONE)}>
          Ready on devstash.me
          <span className="bg-ds-accent animate-blink inline-block h-4 w-2" />
        </p>
      </div>
    </div>
  )
}
