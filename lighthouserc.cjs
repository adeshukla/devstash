// Lighthouse CI configuration (Phase 7).
// Collects Lighthouse audits for key pages against a locally-served production
// build (`pnpm start`) and fails CI if performance, accessibility, SEO, or
// best-practices fall below 0.9. Results upload to temporary public storage.
// Pairs with .github/workflows/lighthouse.yml, which runs `lhci autorun`.
// CommonJS + `.cjs` so @lhci/cli reads it reliably regardless of module type.
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm start',
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/blog',
        'http://localhost:3000/projects',
        'http://localhost:3000/about',
      ],
      numberOfRuns: 1,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
}
