// The hero's secondary visual — a small "build status" terminal window.
// Previously a fake syntax-highlighted code snippet (random colored bars
// standing in for "code"): decoration with no relationship to Adesh
// specifically, the single most recognizable "generic AI-template portfolio"
// tell. Replaced with something true instead of decorative: the actual
// checks this site's own CI pipeline runs on every push (see
// .github/workflows/ci.yml — typecheck, lint, build) and the same claims
// already made in the hero's own stat row and across the site (Lighthouse
// 90+, structured data on every page, WCAG-audited a11y). Nothing here is
// invented — it's a themed readout of facts stated elsewhere on the site.
//
// Pure CSS stagger (animate-fade-up + per-line delay, same primitive
// MountReveal already uses) — no client JS, so this stays a Server
// Component and never touches hero LCP.

const CHECKS: { label: string; detail: string }[] = [
  { label: 'TypeScript', detail: 'strict mode, 0 errors' },
  { label: 'Lighthouse', detail: '90+ every route' },
  { label: 'WCAG AA', detail: 'audited' },
  { label: 'Structured data', detail: 'every page' },
]

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
      </div>

      <div className="flex flex-col gap-4 px-6 py-8 font-mono text-[15px]">
        <p
          className="text-ds-muted animate-fade-up motion-reduce:animate-none"
          style={{ animationDelay: '80ms' }}
        >
          <span className="text-ds-accent">$</span> pnpm build
        </p>
        {CHECKS.map(({ label, detail }, i) => (
          <p
            key={label}
            className="animate-fade-up flex items-baseline gap-2 motion-reduce:animate-none"
            style={{ animationDelay: `${240 + i * 160}ms` }}
          >
            <span className="text-ds-success">✓</span>
            <span className="text-ds-text">{label}</span>
            <span className="text-ds-muted">— {detail}</span>
          </p>
        ))}
        <p
          className="text-ds-accent animate-fade-up mt-1 flex items-baseline gap-2 motion-reduce:animate-none"
          style={{ animationDelay: `${240 + CHECKS.length * 160 + 120}ms` }}
        >
          Ready on devstash.me
          <span className="bg-ds-accent animate-blink inline-block h-4 w-2" />
        </p>
      </div>
    </div>
  )
}
