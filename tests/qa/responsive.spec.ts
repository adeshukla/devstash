import { test, expect } from '@playwright/test'

/**
 * Responsive overflow audit — the single invariant that makes a page "usable"
 * at any size: no horizontal overflow. Runs every key route at widths from a
 * smartwatch (200px — Apple Watch Ultra is ~205pt) up to desktop. A failure
 * names the widest offending element so the fix is obvious.
 */

const ROUTES = [
  '/',
  '/about',
  '/projects',
  '/projects/netflix-gpt',
  '/blog',
  '/blog/understanding-css-cubic-bezier-easing',
  '/lab',
  '/contact',
  '/resources',
  '/tools',
]

// width × representative height (portrait-ish for small, landscape for large)
const VIEWPORTS: [number, number][] = [
  [200, 250], // smartwatch
  [280, 400], // tiny/foldable cover screen
  [320, 568], // iPhone SE gen1
  [375, 812], // common phone
  [768, 1024], // tablet portrait
  [1024, 768], // tablet landscape / small laptop
  [1440, 900], // desktop
]

for (const [width, height] of VIEWPORTS) {
  test(`no horizontal overflow at ${width}x${height}`, async ({ page }) => {
    // 10 routes per test, each possibly compiling on first hit in dev mode.
    test.setTimeout(180_000)
    await page.setViewportSize({ width, height })

    for (const route of ROUTES) {
      // NOT networkidle: the dev server's HMR websocket (and analytics
      // beacons in prod) keep the network permanently busy — it times out.
      await page.goto(route, { waitUntil: 'domcontentloaded' })
      // Let layout, fonts, and entrance animations settle before measuring.
      await page.waitForTimeout(600)

      // What a user actually experiences, not raw scrollWidth (which Chrome
      // inflates from the intrinsic width of content inside overflow-x-auto
      // descendants — a scrolling <pre>/table is fine and shouldn't fail this):
      //   (a) the page must not be horizontally scrollable, and
      //   (b) no element outside a scroll container may poke past the viewport.
      const result = await page.evaluate(() => {
        const doc = document.documentElement
        window.scrollTo(50, 0)
        const canScrollX = window.scrollX
        window.scrollTo(0, 0)

        const insideScroller = (el: HTMLElement) => {
          for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
            if (/(auto|scroll|hidden|clip)/.test(getComputedStyle(p).overflowX)) return true
          }
          return false
        }
        const limit = Math.max(doc.clientWidth, window.innerWidth)
        let widest: { tag: string; cls: string; right: number } | null = null
        for (const el of document.querySelectorAll<HTMLElement>('body *')) {
          const r = el.getBoundingClientRect()
          // position:fixed never creates scrollable overflow (canScrollX above
          // covers scrollability) — and parking fixed widgets off-screen is a
          // legitimate pattern (reCAPTCHA badge, slide-in drawers, toasts).
          if (getComputedStyle(el).position === 'fixed') continue
          if (r.right > limit + 1 && !insideScroller(el)) {
            if (!widest || r.right > widest.right) {
              widest = {
                tag: el.tagName.toLowerCase(),
                cls: (el.className && String(el.className).slice(0, 80)) || '',
                right: Math.round(r.right),
              }
            }
          }
        }
        return { canScrollX, widest }
      })

      expect(
        result.canScrollX,
        `${route} is horizontally scrollable at ${width}px (scrolled to x=${result.canScrollX})`
      ).toBe(0)
      expect(
        result.widest,
        `${route} at ${width}px: <${result.widest?.tag} class="${result.widest?.cls}"> ` +
          `extends to x=${result.widest?.right} past the ${width}px viewport`
      ).toBeNull()
    }
  })
}
