// A decorative "code window" illustration for the hero section. Pure SVG +
// the existing `animate-float`/`animate-blink` CSS classes (see globals.css) —
// no new animation infra, no client JS, no network request. Desktop-only
// (`hidden lg:block` on the wrapper in HeroSection) so it never affects
// mobile LCP/CLS. Uses `fill-ds-*`/`stroke-ds-*` utilities (not raw CSS
// custom properties) so it repaints correctly if the user switches themes.

const CODE_LINES: { x: number; width: number; color: string }[] = [
  { x: 48, width: 56, color: 'fill-ds-purple/70' },
  { x: 48, width: 150, color: 'fill-ds-muted/50' },
  { x: 64, width: 36, color: 'fill-ds-accent/70' },
  { x: 80, width: 96, color: 'fill-ds-muted/50' },
  { x: 80, width: 64, color: 'fill-ds-accent/70' },
  { x: 64, width: 48, color: 'fill-ds-purple/70' },
  { x: 48, width: 110, color: 'fill-ds-muted/50' },
  { x: 48, width: 28, color: 'fill-ds-accent/70' },
]

export function HeroGraphic() {
  return (
    <div aria-hidden="true" className="animate-float">
      <svg
        viewBox="0 0 400 260"
        className="border-ds-border fill-ds-surface w-full rounded-xl border shadow-2xl shadow-black/40"
      >
        {/* Window chrome */}
        <rect x="0" y="0" width="400" height="260" rx="14" className="fill-ds-surface" />
        <line x1="0" y1="34" x2="400" y2="34" className="stroke-ds-border" strokeWidth="1" />
        <circle cx="20" cy="17" r="5" className="fill-ds-error/80" />
        <circle cx="37" cy="17" r="5" className="fill-ds-warning/80" />
        <circle cx="54" cy="17" r="5" className="fill-ds-success/80" />
        <rect x="80" y="10" width="88" height="14" rx="4" className="fill-ds-surface2" />
        <text
          x="90"
          y="20"
          className="fill-ds-muted"
          fontFamily="var(--font-mono)"
          fontSize="9"
          letterSpacing="0.02em"
        >
          hero.tsx
        </text>

        {/* Code lines */}
        {CODE_LINES.map((line, i) => {
          const y = 56 + i * 22
          return (
            <g key={i}>
              <text
                x="30"
                y={y + 8}
                textAnchor="end"
                className="fill-ds-muted/60"
                fontFamily="var(--font-mono)"
                fontSize="8"
              >
                {i + 1}
              </text>
              <rect x={line.x} y={y} width={line.width} height="8" rx="4" className={line.color} />
            </g>
          )
        })}

        {/* Blinking cursor at the end of the last line */}
        <rect
          x={CODE_LINES[CODE_LINES.length - 1].x + CODE_LINES[CODE_LINES.length - 1].width + 8}
          y={56 + (CODE_LINES.length - 1) * 22}
          width="8"
          height="10"
          className="fill-ds-accent animate-blink"
        />
      </svg>
    </div>
  )
}
