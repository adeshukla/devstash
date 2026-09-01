import 'server-only'

/**
 * Theme, reveal, layout and hero visual for the generated landing page.
 *
 * These were previously left to the model with a prompt rule plus a JS
 * failsafe. That failed twice in real use — pages arrived blank until the
 * reveal class was removed by hand, and the theme toggle did nothing — so they
 * are no longer requested, they are imposed. This stylesheet is injected LAST
 * in <head> so it wins on equal specificity, with !important only where it must
 * override something the model wrote.
 *
 * The visual language follows the site's own landing pages
 * (app/(lab)/lab/saas-trial-signup): centred, compact, a mono uppercase
 * eyebrow, one soft accent blob, section-based rhythm.
 */

/**
 * The reveal problem, solved by deleting the failure mode rather than guarding
 * it: content is never hidden by opacity at all. The entrance is a pure CSS
 * animation whose final keyframe is fully visible, with fill-mode both — so a
 * dead observer, a JS error or a throttled tab all still end with content on
 * screen. No JS is involved in making anything visible.
 */
export const REVEAL_SAFE_CSS = `
  [class*="reveal"], [class*="fade"], [class*="animate-in"] {
    opacity: 1 !important;
    transform: none !important;
    animation: ds-enter .6s ease-out both;
  }
  @keyframes ds-enter {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    [class*="reveal"], [class*="fade"], [class*="animate-in"] { animation: none; }
  }`

/**
 * The palette, plus the three-block structure that makes a toggle work in BOTH
 * directions. The :not([data-theme="light"]) guard is the piece models leave
 * out, which strands every visitor whose OS is set to dark.
 */
export const THEME_CSS = `
  /* Accent and muted differ per theme for contrast reasons, not taste. The
     brand blue #3B82F6 only reaches 3.67:1 on white and slate-500 muted only
     4.34:1 on the light surface — both below the 4.5:1 AA floor for normal
     text, and axe flags every one. Light mode therefore uses a darker accent
     (#2563EB, 5.0:1 both as text on white and behind white CTA text) and a
     darker muted (#475569). Dark mode keeps the brand blue, which has ample
     contrast against the near-black background. */
  :root {
    --bg:#FFFFFF; --surface:#F8FAFC; --surface-2:#F1F5F9;
    --border:#E2E8F0; --text:#0F172A; --muted:#475569;
    --accent:#2563EB; --accent-2:#7C3AED;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --bg:#0B0F19; --surface:#111827; --surface-2:#161F2E;
      --border:#1F2937; --text:#F3F4F6; --muted:#9CA3AF;
      --accent:#3B82F6; --accent-2:#8B5CF6;
    }
  }
  :root[data-theme="dark"] {
    --bg:#0B0F19; --surface:#111827; --surface-2:#161F2E;
    --border:#1F2937; --text:#F3F4F6; --muted:#9CA3AF;
    --accent:#3B82F6; --accent-2:#8B5CF6;
  }
  html, body { background: var(--bg) !important; color: var(--text) !important; }
  body { transition: background-color .25s ease, color .25s ease; }`

export const LAYOUT_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.7; overflow-wrap: break-word; -webkit-font-smoothing: antialiased;
  }
  img, svg, video { max-width: 100%; height: auto; }
  section { padding: clamp(3rem,8vw,6rem) 1.25rem; }
  h1, h2, h3, h4 { letter-spacing: -.02em; margin: 0 0 .5em; text-wrap: balance; }
  h1 { font-size: clamp(2rem,5.5vw,3.25rem); line-height: 1.08; font-weight: 800; }
  h2 { font-size: clamp(1.5rem,3.6vw,2.125rem); line-height: 1.2; font-weight: 700; }
  h3 { font-size: clamp(1.125rem,2.2vw,1.3125rem); line-height: 1.3; font-weight: 650; }
  h4 { font-size: 1rem; line-height: 1.4; font-weight: 650; }
  p { line-height: 1.75; }
  a { color: var(--accent); }
  :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

  /* Header: compact wordmark left, real 40px toggle right. */
  .ds-header {
    position: sticky !important; top: 0 !important; z-index: 50;
    display: flex; align-items: center; justify-content: space-between; gap: 1rem;
    padding: .7rem clamp(1rem,4vw,2rem);
    background: color-mix(in srgb, var(--bg) 82%, transparent);
    backdrop-filter: blur(12px); border-bottom: 1px solid var(--border);
  }
  .ds-mark {
    font-weight: 700; letter-spacing: -.02em; font-size: .95rem; color: var(--text);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0;
  }
  .ds-toggle {
    display: inline-flex; align-items: center; justify-content: center;
    width: 40px; height: 40px; flex: 0 0 40px; padding: 0;
    border: 1px solid var(--border); border-radius: 10px;
    background: var(--surface); color: var(--text); cursor: pointer;
    transition: border-color .2s ease;
  }
  .ds-toggle:hover { border-color: var(--accent); }
  .ds-toggle svg { width: 18px; height: 18px; display: block; }

  .ds-footer {
    border-top: 1px solid var(--border); padding: 2.25rem 1.25rem;
    text-align: center; color: var(--muted); font-size: .875rem;
  }

  /* Responsive guards: nothing may widen the page at 300px. */
  pre, table { max-width: 100%; }
  pre { overflow-x: auto; }
  @media (max-width: 360px) { section { padding-left: 1rem; padding-right: 1rem; } }`

/**
 * The toggle, owned end to end rather than requested. Adopts whatever control
 * the model produced — they have shipped 8px-wide buttons and dead handlers —
 * restyles it, and binds it to one implementation that is actually tested.
 */
export const THEME_TOGGLE_JS = `
<script>
  (function () {
    var root = document.documentElement
    var KEY = 'ds-theme'
    var SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
    var MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>'

    function current() {
      var set = root.getAttribute('data-theme')
      if (set === 'dark' || set === 'light') return set
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    function paint(btn) {
      var dark = current() === 'dark'
      btn.innerHTML = dark ? SUN : MOON
      btn.setAttribute('aria-pressed', String(dark))
      btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme')
    }
    function apply(theme) {
      root.setAttribute('data-theme', theme)
      try { localStorage.setItem(KEY, theme) } catch (e) {}
      Array.prototype.forEach.call(document.querySelectorAll('.ds-toggle'), paint)
    }

    try {
      var saved = localStorage.getItem(KEY)
      if (saved === 'dark' || saved === 'light') root.setAttribute('data-theme', saved)
    } catch (e) {}

    function wire() {
      var sel = '.ds-toggle,[aria-pressed],[aria-label*="theme" i],[aria-label*="dark" i],[class*="theme-toggle"]'
      var seen = []
      Array.prototype.forEach.call(document.querySelectorAll(sel), function (el) {
        if (el.closest('form') || seen.indexOf(el) > -1) return
        seen.push(el)
        el.classList.add('ds-toggle')
        el.removeAttribute('style')
        paint(el)
        el.addEventListener('click', function (e) {
          e.preventDefault()
          apply(current() === 'dark' ? 'light' : 'dark')
        })
      })
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire)
    else wire()
  })()
</script>`

/**
 * A compact animated SVG for the hero, replacing the full-width blob panel that
 * ate a whole screen to say nothing. Pure inline SVG + CSS — no image file, no
 * network request, and it degrades to a static graphic under reduced motion.
 */
export const HERO_VISUAL_HTML = `
<div class="ds-visual" aria-hidden="true">
  <svg viewBox="0 0 240 140" role="presentation" focusable="false">
    <defs>
      <linearGradient id="dsG" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="var(--accent)"/>
        <stop offset="100%" stop-color="var(--accent-2)"/>
      </linearGradient>
    </defs>
    <g stroke="url(#dsG)" fill="none" stroke-width="1.5" opacity=".6">
      <path class="ds-line" d="M12 96 C60 96 60 44 108 44 S156 96 228 44"/>
      <path class="ds-line ds-line-2" d="M12 118 C70 118 70 70 128 70 S180 110 228 76"/>
    </g>
    <g fill="url(#dsG)">
      <circle class="ds-dot" cx="108" cy="44" r="5"/>
      <circle class="ds-dot ds-dot-2" cx="128" cy="70" r="4"/>
      <circle class="ds-dot ds-dot-3" cx="228" cy="44" r="3.5"/>
    </g>
    <rect x="12" y="18" width="70" height="7" rx="3.5" fill="var(--border)"/>
    <rect x="12" y="32" width="44" height="7" rx="3.5" fill="var(--border)"/>
  </svg>
</div>`

export const HERO_VISUAL_CSS = `
  .ds-visual { width: 100%; max-width: 420px; margin: 2.5rem auto 0; }
  .ds-visual svg { width: 100%; height: auto; display: block; }
  .ds-line { stroke-dasharray: 300; stroke-dashoffset: 300; animation: ds-draw 2.2s ease-out forwards; }
  .ds-line-2 { animation-delay: .35s; }
  .ds-dot { animation: ds-pulse 3s ease-in-out infinite; }
  .ds-dot-2 { animation-delay: .6s; }
  .ds-dot-3 { animation-delay: 1.2s; }
  @keyframes ds-draw { to { stroke-dashoffset: 0; } }
  @keyframes ds-pulse { 0%,100% { opacity:.4 } 50% { opacity:1 } }
  @media (prefers-reduced-motion: reduce) {
    .ds-line { animation: none; stroke-dashoffset: 0; }
    .ds-dot { animation: none; }
  }`
