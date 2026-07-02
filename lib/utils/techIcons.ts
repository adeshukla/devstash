import type { IconName } from '@/components/icons/Icon'

// Matched against the literal `tech` strings actually used in content/projects/*.json.
// Anything not listed here just falls back to a plain text badge.
export const TECH_ICONS: Partial<Record<string, IconName>> = {
  React: 'react',
  'Next.js': 'nextjs',
  TypeScript: 'typescript',
  'Tailwind CSS': 'tailwind',
  'Redux Toolkit': 'redux',
  Firebase: 'firebase',
  Vite: 'vite',
  'GitHub Actions': 'github-actions',
  'Gemini AI': 'gemini',
}
