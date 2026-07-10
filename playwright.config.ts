import { defineConfig, devices } from '@playwright/test'

// Smoke tests run against an already-deployed URL (prod or a Vercel preview) —
// there is no local webServer. SMOKE_BASE_URL is provided by the CI workflow
// from the deployment's target_url; it falls back to production for manual runs.
const baseURL = process.env.SMOKE_BASE_URL || 'https://devstash.me'

export default defineConfig({
  testDir: './tests/smoke',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
