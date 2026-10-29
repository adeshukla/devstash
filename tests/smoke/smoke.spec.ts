import { test, expect, type Page } from '@playwright/test'

// Post-deploy smoke tests: catch the class of failures that a green build can
// still ship — a route that 500s at request time, a page that throws on render,
// an API route that's gone. Runs against the live deployment (see
// playwright.config.ts + .github/workflows/smoke.yml).

/**
 * Navigate and assert the page loaded without an HTTP error and without any
 * uncaught runtime exception (which is how e.g. a bad next/image src surfaces).
 */
async function visit(page: Page, path: string) {
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(err.message))

  const res = await page.goto(path, { waitUntil: 'domcontentloaded' })
  expect(res, `no response for ${path}`).not.toBeNull()
  expect(res!.status(), `${path} returned ${res!.status()}`).toBeLessThan(400)

  expect(pageErrors, `uncaught errors on ${path}: ${pageErrors.join(' | ')}`).toEqual([])
}

test('home page loads with a heading', async ({ page }) => {
  await visit(page, '/')
  await expect(page.locator('h1')).toBeVisible()
})

test('lab hub loads and lists live demos', async ({ page }) => {
  await visit(page, '/lab')
  await expect(page.locator('h1')).toBeVisible()
  // The hub lists the flagship and the tools; each links to its own demo page.
  await expect(page.locator('a[href="/lab/ai-content-pipeline"]').first()).toBeVisible()
  await expect(page.locator('a[href="/lab/utm-builder"]').first()).toBeVisible()
})

test('a lab demo renders', async ({ page }) => {
  await visit(page, '/lab/utm-builder')
  await expect(page.locator('h1')).toBeVisible()
})

test('projects page loads', async ({ page }) => {
  await visit(page, '/projects')
  await expect(page.locator('h1')).toBeVisible()
})

test('blog list loads', async ({ page }) => {
  await visit(page, '/blog')
  await expect(page.locator('h1')).toBeVisible()
})

test('ai-pipeline API route is alive', async ({ request }) => {
  // GET is intentionally 405 (POST-only). A 404/5xx would mean the route is
  // broken or missing.
  const res = await request.get('/api/ai-pipeline')
  expect(res.status()).toBe(405)
})
