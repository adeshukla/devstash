// Companion to HeroGraphic's "build status" window — same non-decorative
// principle applied to the About hero: a themed readout of facts already
// stated in this exact page's copy (role, location, experience, stack,
// current status), not invented flavor text standing in for a real photo.
// Pure CSS stagger (animate-fade-up + per-line delay, identical technique to
// HeroGraphic) — no client JS, stays a Server Component, never touches LCP.

const FIELDS: { key: string; value: string }[] = [
  { key: 'role', value: "'Frontend Developer'" },
  { key: 'based', value: "'Ghaziabad, India'" },
  { key: 'experience', value: "'6+ years'" },
  { key: 'stack', value: "['React', 'Next.js', 'TypeScript']" },
  { key: 'building', value: "'DevStash'" },
  { key: 'status', value: "'open to frontend roles'" },
]

export function AboutProfileCard() {
  return (
    <div
      aria-hidden="true"
      className="border-ds-border bg-ds-surface animate-float w-full overflow-hidden rounded-xl border shadow-2xl shadow-black/40"
    >
      {/* Window chrome — same three-dot treatment as HeroGraphic's terminal,
          so the two feel like one system rather than two different widgets. */}
      <div className="border-ds-border flex h-12 items-center gap-3 border-b px-5">
        <div className="flex gap-2">
          <span className="bg-ds-error/80 h-3 w-3 rounded-full" />
          <span className="bg-ds-warning/80 h-3 w-3 rounded-full" />
          <span className="bg-ds-success/80 h-3 w-3 rounded-full" />
        </div>
        <span className="text-ds-muted font-mono text-xs tracking-wide">adesh.ts</span>
      </div>

      <div className="flex flex-col gap-2.5 px-6 py-8 font-mono text-[13.5px] leading-relaxed sm:text-[15px]">
        <p
          className="animate-fade-up motion-reduce:animate-none"
          style={{ animationDelay: '80ms' }}
        >
          <span className="text-ds-purple">const</span> <span className="text-ds-text">adesh</span>{' '}
          <span className="text-ds-muted">= {'{'}</span>
        </p>
        {FIELDS.map(({ key, value }, i) => (
          <p
            key={key}
            className="animate-fade-up pl-4 motion-reduce:animate-none"
            style={{ animationDelay: `${200 + i * 130}ms` }}
          >
            <span className="text-ds-accent">{key}</span>
            <span className="text-ds-muted">: </span>
            <span className="text-ds-success">{value}</span>
            <span className="text-ds-muted">,</span>
          </p>
        ))}
        <p
          className="animate-fade-up text-ds-muted flex items-center motion-reduce:animate-none"
          style={{ animationDelay: `${200 + FIELDS.length * 130 + 100}ms` }}
        >
          {'}'}
          <span
            aria-hidden="true"
            className="bg-ds-accent animate-blink ml-1.5 inline-block h-4 w-2"
          />
        </p>
      </div>
    </div>
  )
}
