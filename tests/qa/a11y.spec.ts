import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Automated WCAG regression check — axe-core catches the mechanical subset of
 * accessibility (contrast, missing labels/alt text, invalid ARIA, heading
 * order, etc.). It's a floor, not a substitute for a manual screen-reader
 * pass, but it's the floor that's cheap to enforce on every PR.
 *
 * Scoped to the same route list as responsive.spec.ts's ROUTES so both QA
 * checks cover the same surface area.
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

for (const route of ROUTES) {
  test(`no automatically-detectable a11y violations on ${route}`, async ({ page }) => {
    // Default 30s is tight against a dev server compiling a route on first
    // hit (see the same note in responsive.spec.ts) — axe's own DOM walk
    // adds more on top of that for content-heavy pages.
    test.setTimeout(60_000)
    // Reveal/MountReveal already special-case prefers-reduced-motion (see
    // their own docstrings) to skip the fade/slide entirely — asking for
    // that here is more reliable than racing a fixed waitForTimeout against
    // every route's actual animation delay+duration. A fixed wait caught a
    // real false positive: axe sampled a MountReveal badge still mid-fade
    // (opacity 0→1, not yet settled), read its blended-with-background
    // color, and flagged a contrast "failure" that doesn't exist once the
    // element is actually visible.
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(route, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(200)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    const summary = results.violations.map(
      (v) =>
        `\n  [${v.impact}] ${v.id} — ${v.help} (${v.nodes.length} node(s))\n` +
        v.nodes
          .slice(0, 3)
          .map((n) => `    ${n.target.join(' ')}`)
          .join('\n')
    )

    expect(results.violations, `${route}:${summary.join('')}`).toEqual([])
  })
}
