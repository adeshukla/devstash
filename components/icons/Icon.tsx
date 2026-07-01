import type { ReactNode, SVGProps } from 'react'

// ─── Icon names ───────────────────────────────────────────────────────────────
// Every name below is consumed by a real content field (a project's `tech`
// array, or a tool/resource/blog post's `category`) except the small set of
// functional UI icons (download, external-link, copy, check).

export type IconName =
  // Tool categories
  | 'editor'
  | 'terminal'
  | 'browser'
  | 'design'
  | 'productivity'
  | 'ai'
  | 'devtools'
  // Resource categories
  | 'docs'
  | 'article'
  | 'course'
  | 'repo'
  | 'video'
  // Blog categories
  | 'automation'
  | 'frontend'
  | 'performance'
  | 'tutorials'
  | 'career'
  // Functional UI
  | 'download'
  | 'external-link'
  | 'copy'
  | 'check'
  | 'github'
  // Tech-stack marks (verified against content/projects/*.json `tech` values)
  | 'react'
  | 'nextjs'
  | 'typescript'
  | 'tailwind'
  | 'redux'
  | 'firebase'
  | 'vite'
  | 'github-actions'
  | 'gemini'

// ─── Path data ────────────────────────────────────────────────────────────────
// Stroke-based line icons (24x24), except `github` which stays filled to match
// the mark already used in components/layout/Footer.tsx.

const STROKE_ICONS: Record<Exclude<IconName, 'github'>, ReactNode> = {
  // Tool categories
  editor: (
    <>
      <path d="M8 6 2 12l6 6" />
      <path d="m16 6 6 6-6 6" />
    </>
  ),
  terminal: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="m7 9 4 3-4 3" />
      <path d="M13 16h4" />
    </>
  ),
  browser: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 8h18" />
      <circle cx="6.5" cy="6" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="9" cy="6" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  design: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.2 0-.9.7-1.5 1.5-1.5H16a4 4 0 0 0 4-4c0-4.4-3.6-8-8-8Z" />
      <circle cx="7.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="11" cy="7" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="9" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  productivity: (
    <>
      <path d="m4 7 2 2 3-3" />
      <path d="M11 7h9" />
      <path d="m4 14 2 2 3-3" />
      <path d="M11 14h9" />
    </>
  ),
  ai: (
    <>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="m6.5 6.5 2.5 2.5M15 15l2.5 2.5M6.5 17.5 9 15M15 9l2.5-2.5" />
    </>
  ),
  devtools: (
    <path d="M14.5 3.5a4 4 0 0 0-5.4 4.6L3 14.2V19h4.8l6.1-6.1a4 4 0 0 0 4.6-5.4l-2.9 2.9-2-2 2.9-2.9Z" />
  ),
  // Resource categories
  docs: (
    <>
      <path d="M5 4h9l5 5v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
      <path d="M14 4v5h5" />
      <path d="M8 13h8M8 17h5" />
    </>
  ),
  article: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <path d="M7 8h4v4H7zM13 8h4M13 11h4M7 15h10M7 17.5h6" />
    </>
  ),
  course: (
    <>
      <path d="m2 8 10-4 10 4-10 4L2 8Z" />
      <path d="M6 10v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" />
    </>
  ),
  repo: (
    <>
      <circle cx="6" cy="5" r="2" />
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="8" r="2" />
      <path d="M6 7v10" />
      <path d="M6 12c0-2.8 2.2-3 6-3.5 4-.5 6-.7 6-2.5" />
    </>
  ),
  video: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8.5v7l6-3.5-6-3.5Z" fill="currentColor" stroke="none" />
    </>
  ),
  // Blog categories
  automation: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />,
  frontend: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <path d="M9 4v16" />
    </>
  ),
  performance: (
    <>
      <path d="M4 15a8 8 0 1 1 16 0" />
      <path d="M12 15 16 9" />
      <circle cx="12" cy="15" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  tutorials: (
    <>
      <path d="m4 6 1.5 1.5L8 5" />
      <path d="M11 6h9" />
      <path d="m4 12 1.5 1.5L8 11" />
      <path d="M11 12h9" />
      <path d="m4 18 1.5 1.5L8 17" />
      <path d="M11 18h9" />
    </>
  ),
  career: (
    <>
      <rect x="3" y="8" width="18" height="12" rx="1.5" />
      <path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M3 13h18" />
    </>
  ),
  // Functional UI
  download: (
    <>
      <path d="M12 4v11" />
      <path d="m7 11 5 5 5-5" />
      <path d="M5 20h14" />
    </>
  ),
  'external-link': (
    <>
      <path d="M9 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
      <path d="M14 4h6v6" />
      <path d="M20 4 11 13" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="1.5" />
      <path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
    </>
  ),
  check: <path d="m5 12 5 5L20 7" />,
  // Tech-stack marks
  react: (
    <>
      <circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none" />
      <ellipse cx="12" cy="12" rx="10" ry="4" />
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
    </>
  ),
  nextjs: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 8.5v7" />
      <path d="M9 8.5 16 17" />
      <path d="M15 8.5V14" />
    </>
  ),
  typescript: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M7 9h4M9 9v7" />
      <path d="M14.5 15.3c.4.4 1 .7 1.7.7.9 0 1.6-.5 1.6-1.3 0-2-3.5-1-3.5-3.2 0-1 .9-1.5 1.8-1.5.7 0 1.3.3 1.6.7" />
    </>
  ),
  tailwind: (
    <>
      <path d="M6 12.5c.7-2.8 2.3-4.2 4.8-4.2 3.3 0 3.8 2.5 5.4 2.9 1.2.3 2.2-.2 3-1.4-.7 2.8-2.3 4.2-4.8 4.2-3.3 0-3.8-2.5-5.4-2.9-1.2-.3-2.2.2-3 1.4Z" />
      <path d="M2 16.5c.7-2.8 2.3-4.2 4.8-4.2 3.3 0 3.8 2.5 5.4 2.9 1.2.3 2.2-.2 3-1.4-.7 2.8-2.3 4.2-4.8 4.2-3.3 0-3.8-2.5-5.4-2.9-1.2-.3-2.2.2-3 1.4Z" />
    </>
  ),
  redux: (
    <>
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <path d="M15.5 9.5c1.8.3 3 1.2 3 2.4 0 1.6-2.2 2.9-5.2 3.2" />
      <path d="M9.2 6.6c-1 1.6-1.1 3.2-.2 4.2 1.1 1.2 3.6.9 5.9-.6" />
      <path d="M8.3 16.8c1.7.8 3.3.8 4.1-.2 1-1.3.1-3.6-2-5.5" />
    </>
  ),
  firebase: <path d="M7 18 9.5 3.5 13 12.5l1.7-2.3L17 18l-5 2.5L7 18Z" />,
  vite: <path d="M12 2 21 6l-1.7 15L12 22l-7.3-1L3 6l9-4Z" />,
  'github-actions': (
    <>
      <path d="M4 12a8 8 0 0 1 13.7-5.7L20 8" />
      <path d="M20 4v4h-4" />
      <path d="M20 12a8 8 0 0 1-13.7 5.7L4 16" />
      <path d="M4 20v-4h4" />
    </>
  ),
  gemini: (
    <path d="M12 3c.6 3.8 1.9 6.1 4.5 6.5-2.6.4-3.9 2.7-4.5 6.5-.6-3.8-1.9-6.1-4.5-6.5 2.6-.4 3.9-2.7 4.5-6.5Z" />
  ),
}

const FILLED_ICONS: Record<'github', ReactNode> = {
  github: (
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  ),
}

// ─── Component ────────────────────────────────────────────────────────────────

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
}

export function Icon({ name, ...props }: IconProps) {
  if (name === 'github') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
        {FILLED_ICONS.github}
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {STROKE_ICONS[name]}
    </svg>
  )
}
