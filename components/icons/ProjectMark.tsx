import { LogoMark } from '@/components/ui/LogoMark'

// Each project's own brand colour and mark, copied from its repo (sources
// below) so a card is recognisable at a glance — these are other products'
// identities, not DevStash design tokens. Projects without a brand of their
// own (the DevStash Lab tools) fall back to the DevStash mark and accent.

interface ProjectBrand {
  /** Any CSS colour. Used only for decoration (bar, glow), never text. */
  color: string
  Mark: () => React.JSX.Element
}

const BRANDS: Record<string, ProjectBrand> = {
  // pare/scripts/make-brand-assets.mjs (MARK)
  pare: {
    color: '#4f46e5',
    Mark: () => (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <defs>
          <linearGradient id="pare-mark" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#4f46e5" />
            <stop offset="1" stopColor="#9333ea" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="8" fill="url(#pare-mark)" />
        <path
          d="M10 24V9h6.5a5 5 0 0 1 0 10H13"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  // praxis/app/icon.tsx
  praxis: {
    color: '#00d89d',
    Mark: () => (
      <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect width="32" height="32" rx="7" fill="#00d89d" />
        <g stroke="#04120e" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 12.5C14.5 11 11.5 10 8.5 10.3C7.7 10.4 7 11 7 11.9V21.4C7 22.3 7.8 23 8.7 22.9C11.4 22.6 14.3 23.5 16 25" />
          <path d="M16 12.5C17.5 11 20.5 10 23.5 10.3C24.3 10.4 25 11 25 11.9V21.4C25 22.3 24.2 23 23.3 22.9C20.6 22.6 17.7 23.5 16 25" />
          <path d="M16 12.5V25" />
        </g>
        <circle cx="16" cy="7.5" r="1.9" fill="#04120e" />
      </svg>
    ),
  },
  // build-components/app/icon.svg
  'build-components': {
    color: '#c2410c',
    Mark: () => (
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <rect width="40" height="40" rx="11" fill="#c2410c" />
        <rect x="9" y="10" width="22" height="4.5" rx="2.25" fill="#fff" />
        <rect x="9" y="18" width="14" height="4.5" rx="2.25" fill="#fff" opacity=".8" />
        <rect x="9" y="26" width="18" height="4.5" rx="2.25" fill="#fff" opacity=".6" />
      </svg>
    ),
  },
  // showcase/app/globals.css (:root --accent). Motion Lab has no logo, so this
  // is a plain monogram in its colour rather than an invented mark.
  'motion-lab': {
    color: 'oklch(0.72 0.17 60)',
    Mark: () => (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="oklch(0.72 0.17 60)" />
        <text
          x="16"
          y="21"
          textAnchor="middle"
          fontSize="13"
          fontWeight="700"
          fontFamily="var(--font-sans), sans-serif"
          fill="oklch(0.14 0.005 260)"
        >
          ML
        </text>
      </svg>
    ),
  },
}

const DEVSTASH: ProjectBrand = { color: 'var(--color-ds-accent)', Mark: () => <LogoMark /> }

export function projectBrand(slug: string): ProjectBrand {
  return BRANDS[slug] ?? DEVSTASH
}
