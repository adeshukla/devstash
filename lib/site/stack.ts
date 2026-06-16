// lib/site/stack.ts
//
// Single source of truth for tech-stack version labels and the current year.
// Versions are DERIVED from package.json so marketing/UI copy stays accurate
// automatically when dependencies are bumped (no hardcoded "Next.js 15").
//
// Note: import this only from Server Components / server code — it reads
// package.json, which we don't want bundled into client code.
import pkg from '../../package.json'

type DepMap = Record<string, string>

const deps = (pkg.dependencies ?? {}) as DepMap
const devDeps = (pkg.devDependencies ?? {}) as DepMap

/** Extract the major version number from a semver range like "^16.2.6" → "16". */
function major(range: string | undefined): string {
  if (!range) return ''
  const match = range.replace(/^[^0-9]*/, '').match(/^(\d+)/)
  return match ? match[1] : ''
}

/** Tech-stack labels derived from the actual installed versions. */
export const stack = {
  next: `Next.js ${major(deps.next)}`,
  react: `React ${major(deps.react)}`,
  typescript: 'TypeScript',
  tailwind: `Tailwind CSS v${major(devDeps.tailwindcss)}`,
} as const

/** Current calendar year — use for copyright lines so they never go stale. */
export function currentYear(): number {
  return new Date().getFullYear()
}
