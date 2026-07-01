// Shared brand mark — used in Navbar, Footer, and the 404 page. Uses
// fill-ds-*/stroke-ds-* token utilities (not raw hex) so the badge itself
// repaints for light mode instead of staying a fixed dark square while only
// the "DevStash" text next to it changes theme.
//
// The bar reads as a terminal cursor (">_") next to the arrow, so it blinks
// continuously via the existing `animate-blink` keyframe (already used for
// the cursor in HeroGraphic) — a small always-on animation that ties directly
// into the terminal branding instead of being motion for its own sake.
export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <rect width="100" height="100" rx="22" className="fill-ds-surface2" />
      <rect width="100" height="100" rx="22" className="stroke-ds-border" strokeWidth="2" />
      <path
        d="M23 34L46 50L23 66"
        className="stroke-ds-accent"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="53" y="57" width="26" height="7" rx="3.5" className="fill-ds-purple animate-blink" />
    </svg>
  )
}
