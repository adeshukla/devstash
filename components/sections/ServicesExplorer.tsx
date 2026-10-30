'use client'

// Same split as the Projects explorer: a numbered list on the left, a sticky
// detail panel on the right (under the row on phones). The detail's cover is a
// small token-coloured scene of the thing being sold, inside the same
// cursor-following CardTilt frame the project covers use.

import { useState, type KeyboardEvent } from 'react'
import Link from 'next/link'
import { Button, CardTilt } from '@/components/ui'
import { Icon } from '@/components/icons/Icon'
import type { IconName } from '@/components/icons/Icon'
import { cn } from '@/lib/utils/cn'
import './ProjectsExplorer.css'

type Visual = 'landing' | 'site' | 'speed' | 'app' | 'automation'

export interface ServiceItem {
  key: string
  icon: IconName
  title: string
  tag: string
  body: string
  gets: string[]
  fit: string
  proof: { label: string; href: string }[]
  visual: Visual
}

const mono = { fontFamily: 'var(--font-mono)' }

// ── Cover scenes ─────────────────────────────────────────────────────────────

function LandingScene() {
  return (
    <svg viewBox="0 0 320 180" className="h-full w-full" aria-hidden="true">
      <rect
        x="56"
        y="18"
        width="208"
        height="144"
        rx="10"
        className="fill-ds-surface stroke-ds-border2"
        strokeWidth="2"
      />
      <rect x="74" y="36" width="120" height="10" rx="5" className="fill-ds-text/80" />
      <rect x="74" y="54" width="150" height="6" rx="3" className="fill-ds-muted/40" />
      <rect x="74" y="66" width="128" height="6" rx="3" className="fill-ds-muted/40" />
      <rect x="74" y="88" width="84" height="26" rx="7" className="fill-ds-accent animate-pulse2" />
      <text
        x="116"
        y="105"
        textAnchor="middle"
        className="fill-ds-bg"
        fontSize="10"
        fontWeight="700"
        style={mono}
      >
        Get a quote
      </text>
      <rect
        x="74"
        y="126"
        width="64"
        height="22"
        rx="5"
        className="fill-ds-surface2 stroke-ds-border"
      />
      <rect
        x="146"
        y="126"
        width="64"
        height="22"
        rx="5"
        className="fill-ds-surface2 stroke-ds-border"
      />
      <rect x="226" y="40" width="26" height="60" rx="6" className="fill-ds-purple/15" />
      <path
        d="M226 130l8-14 8 8 10-18"
        className="stroke-ds-success"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SiteScene() {
  return (
    <svg viewBox="0 0 320 180" className="h-full w-full" aria-hidden="true">
      <rect
        x="40"
        y="16"
        width="240"
        height="148"
        rx="10"
        className="fill-ds-surface stroke-ds-border2"
        strokeWidth="2"
      />
      <path d="M40 40h240" className="stroke-ds-border2" strokeWidth="2" />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={54 + i * 12} cy="28" r="3.5" className="fill-ds-muted/50" />
      ))}
      <rect x="56" y="52" width="40" height="8" rx="4" className="fill-ds-accent" />
      <rect x="196" y="53" width="22" height="6" rx="3" className="fill-ds-muted/40" />
      <rect x="226" y="53" width="22" height="6" rx="3" className="fill-ds-muted/40" />
      <rect x="56" y="74" width="110" height="12" rx="6" className="fill-ds-text/80" />
      <rect x="56" y="92" width="86" height="6" rx="3" className="fill-ds-muted/40" />
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={56 + i * 74}
          y="112"
          width="66"
          height="38"
          rx="6"
          className={
            i === 1 ? 'fill-ds-accent/15 stroke-ds-accent' : 'fill-ds-surface2 stroke-ds-border'
          }
          strokeWidth="1.5"
        />
      ))}
      <rect
        x="236"
        y="76"
        width="30"
        height="22"
        rx="5"
        className="fill-ds-purple/20 animate-float"
      />
    </svg>
  )
}

function SpeedScene() {
  const gauges = [
    { label: 'LCP', value: '< 2.5s', pct: 0.8 },
    { label: 'INP', value: '< 200ms', pct: 0.72 },
    { label: 'CLS', value: '< 0.1', pct: 0.88 },
  ]
  return (
    <svg viewBox="0 0 320 180" className="h-full w-full" aria-hidden="true">
      {gauges.map(({ label, value, pct }, i) => {
        const cx = 64 + i * 96
        const r = 30
        const c = 2 * Math.PI * r
        return (
          <g key={label}>
            <circle
              cx={cx}
              cy="82"
              r={r}
              className="stroke-ds-border2"
              strokeWidth="7"
              fill="none"
            />
            <circle
              cx={cx}
              cy="82"
              r={r}
              className="stroke-ds-success"
              strokeWidth="7"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${c * pct} ${c}`}
              transform={`rotate(-90 ${cx} 82)`}
            />
            <text
              x={cx}
              y="86"
              textAnchor="middle"
              className="fill-ds-text"
              fontSize="11"
              fontWeight="700"
              style={mono}
            >
              {label}
            </text>
            <text
              x={cx}
              y="132"
              textAnchor="middle"
              className="fill-ds-muted"
              fontSize="10"
              style={mono}
            >
              {value}
            </text>
          </g>
        )
      })}
      <text
        x="160"
        y="164"
        textAnchor="middle"
        className="fill-ds-muted/70"
        fontSize="9"
        style={mono}
      >
        Google&apos;s &quot;good&quot; thresholds
      </text>
    </svg>
  )
}

function AppScene() {
  const stack: IconName[] = ['react', 'nextjs', 'typescript', 'tailwind']
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-4 sm:gap-5 sm:px-6">
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {stack.map((name) => (
          <span
            key={name}
            className="border-ds-border bg-ds-surface text-ds-accent flex h-9 w-9 items-center justify-center rounded-xl border min-[360px]:h-11 min-[360px]:w-11 sm:h-14 sm:w-14"
          >
            <Icon name={name} className="h-6 w-6 sm:h-7 sm:w-7" />
          </span>
        ))}
      </div>
      <div className="border-ds-border bg-ds-surface w-full max-w-[260px] rounded-lg border px-4 py-3">
        <div className="bg-ds-border h-1.5 w-full overflow-hidden rounded-full">
          <div className="bg-ds-success animate-pulse2 h-full w-[92%] rounded-full" />
        </div>
        <p className="text-ds-muted mt-2 font-mono text-[11px]">Lighthouse target: 90+ on mobile</p>
      </div>
    </div>
  )
}

function AutomationScene() {
  const nodes = [
    { label: 'Trigger', icon: 'automation' as IconName },
    { label: 'LLM step', icon: 'ai' as IconName },
    { label: 'Output', icon: 'check' as IconName },
  ]
  return (
    <div className="flex h-full items-center justify-center gap-1 px-3 sm:gap-2 sm:px-4">
      {nodes.map(({ label, icon }, i) => (
        <div key={label} className="flex min-w-0 flex-1 items-center gap-1 sm:flex-none sm:gap-2">
          <div className="border-ds-border2 bg-ds-surface flex min-w-0 flex-1 flex-col items-center gap-2 rounded-xl border-[1.5px] px-1.5 py-3.5 sm:w-[84px] sm:flex-none sm:px-2">
            <Icon name={icon} className="text-ds-accent h-5 w-5" />
            <span className="text-ds-muted text-center font-mono text-[10px] [overflow-wrap:anywhere]">
              {label}
            </span>
          </div>
          {i < nodes.length - 1 && (
            <span className="from-ds-accent to-ds-purple h-0.5 w-2 shrink-0 rounded-full bg-gradient-to-r sm:w-6" />
          )}
        </div>
      ))}
    </div>
  )
}

function Cover({ visual }: { visual: Visual }) {
  switch (visual) {
    case 'landing':
      return <LandingScene />
    case 'site':
      return <SiteScene />
    case 'speed':
      return <SpeedScene />
    case 'app':
      return <AppScene />
    case 'automation':
      return <AutomationScene />
  }
}

// ── Detail panel ─────────────────────────────────────────────────────────────

function Detail({ service }: { service: ServiceItem }) {
  return (
    <div className="pe-swap flex flex-col gap-6">
      <CardTilt>
        <div className="card-spotlight card-glow rounded-xl">
          <div className="bg-ds-surface2 relative h-48 w-full overflow-hidden rounded-xl sm:h-60">
            <Cover visual={service.visual} />
          </div>
        </div>
      </CardTilt>

      <div className="flex flex-col gap-3">
        <span className="text-ds-muted font-mono text-xs">{service.tag}</span>
        <h3 className="text-ds-text text-2xl font-bold tracking-tight">{service.title}</h3>
        <p className="text-ds-muted leading-relaxed">{service.body}</p>
      </div>

      <div>
        <p className="text-ds-text mb-3 font-mono text-[11px] tracking-[0.12em] uppercase">
          What you get
        </p>
        <ul className="flex flex-col gap-3">
          {service.gets.map((g) => (
            <li key={g} className="text-ds-muted flex gap-3 text-sm leading-relaxed">
              <Icon name="check" className="text-ds-success mt-0.5 h-4 w-4 shrink-0" />
              {g}
            </li>
          ))}
        </ul>
        <p className="text-ds-muted border-ds-border mt-5 border-t pt-4 text-sm">{service.fit}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-ds-muted mr-1 font-mono text-xs tracking-wide uppercase">
          Related
        </span>
        {service.proof.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className="ring-hover border-ds-border bg-ds-surface2 text-ds-text focus-visible:outline-ds-accent inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {label}
            <span aria-hidden="true" className="text-ds-muted">
              →
            </span>
          </Link>
        ))}
      </div>

      <div className="pt-1">
        <Button href="/contact" size="sm">
          Discuss this →
        </Button>
      </div>
    </div>
  )
}

// ── Explorer ─────────────────────────────────────────────────────────────────

export function ServicesExplorer({ services }: { services: ServiceItem[] }) {
  const [activeKey, setActiveKey] = useState(services[0]?.key)
  const active = services.find((s) => s.key === activeKey) ?? services[0]

  function onKeyDown(e: KeyboardEvent<HTMLUListElement>) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const i = services.findIndex((s) => s.key === active.key)
    const next =
      services[(i + (e.key === 'ArrowDown' ? 1 : -1) + services.length) % services.length]
    setActiveKey(next.key)
    e.currentTarget.querySelector<HTMLButtonElement>(`[data-key="${next.key}"]`)?.focus()
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[5fr_7fr]">
      <ul
        className="border-ds-border divide-ds-border min-w-0 divide-y border-y"
        onKeyDown={onKeyDown}
        aria-label="Services"
      >
        {services.map((s, i) => {
          const isActive = s.key === active.key
          return (
            <li key={s.key}>
              <button
                type="button"
                data-key={s.key}
                aria-expanded={isActive}
                onClick={() => setActiveKey(s.key)}
                className="group relative isolate flex w-full items-center gap-4 py-5 pr-3 pl-5 text-left"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'from-ds-accent/10 absolute -inset-x-2 inset-y-1 -z-10 rounded-lg bg-gradient-to-r to-transparent transition-opacity duration-300',
                    isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  )}
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    'bg-ds-accent absolute top-3 bottom-3 left-0 w-0.5 origin-center rounded-full transition-transform duration-300',
                    isActive ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-50'
                  )}
                />
                <span
                  className={cn(
                    'w-6 shrink-0 font-mono text-xs transition-colors',
                    isActive ? 'text-ds-accent' : 'text-ds-muted group-hover:text-ds-accent'
                  )}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span
                    className={cn(
                      'font-semibold [overflow-wrap:anywhere] transition-colors',
                      isActive ? 'text-ds-accent' : 'text-ds-text group-hover:text-ds-accent'
                    )}
                  >
                    {s.title}
                  </span>
                  <span className="text-ds-muted truncate font-mono text-xs">{s.tag}</span>
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'shrink-0 transition-[transform,color] duration-300 group-hover:translate-x-1',
                    isActive
                      ? 'text-ds-accent rotate-90 lg:rotate-0'
                      : 'text-ds-muted group-hover:text-ds-accent'
                  )}
                >
                  →
                </span>
              </button>
              {isActive && (
                <div className="pt-1 pb-10 lg:hidden">
                  <Detail key={s.key} service={s} />
                </div>
              )}
            </li>
          )
        })}
      </ul>

      <div className="hidden lg:block">
        <div className="sticky top-24">
          <Detail key={active.key} service={active} />
        </div>
      </div>
    </div>
  )
}
