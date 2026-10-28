// One source of truth for page <h1> sizes, so every page reads at the same scale.
// DISPLAY: short page names ("Projects", "Contact"). HEADLINE: sentence-style
// titles (a blog post, a case study, a lab tool). The home hero keeps its own
// size in HeroSection — it is the LCP element and is tuned separately.
// The 36px / 32px floors keep long words inside a 300px screen.
export const H1_DISPLAY =
  'text-ds-text font-bold leading-[1.02] tracking-[-0.035em] text-[clamp(36px,6vw,72px)] [overflow-wrap:anywhere]'
export const H1_HEADLINE =
  'text-ds-text font-bold leading-[1.08] tracking-[-0.03em] text-[clamp(30px,4.6vw,56px)] [overflow-wrap:anywhere]'
