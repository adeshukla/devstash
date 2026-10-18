import 'server-only'

/**
 * The two pieces of page chrome every generated design shares: an entrance
 * animation that can never leave content hidden, and a theme toggle that works
 * in both directions. Palettes, type and layout live in lib/ai/landingDesigns.ts.
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
