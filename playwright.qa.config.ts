import { defineConfig, devices } from '@playwright/test'

// QA suite (responsive/overflow checks) — unlike the smoke tests, this runs
// against a LOCAL server that Playwright starts itself, so `pnpm qa:responsive`
// is self-contained. Set QA_BASE_URL to point it at staging/prod instead.
const baseURL = process.env.QA_BASE_URL || 'http://localhost:3000'

export default defineConfig({
  testDir: './tests/qa',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  // Analytics choice is pre-set to 'denied' so the cookie banner never covers a control under test.
  use: {
    baseURL,
    trace: 'on-first-retry',
    storageState: {
      cookies: [],
      origins: [
        {
          origin: new URL(baseURL).origin,
          localStorage: [{ name: 'devstash-consent', value: 'denied' }],
        },
      ],
    },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.QA_BASE_URL
    ? undefined
    : {
        command: 'pnpm dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120_000,
      },
})
