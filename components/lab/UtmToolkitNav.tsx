import Link from 'next/link'

const TOOLS = [
  { id: 'build', label: 'Build links', href: '/lab/utm-builder' },
  { id: 'check', label: 'Check links', href: '/lab/utm-link-checker' },
  { id: 'clean', label: 'Clean reports', href: '/lab/utm-report-cleaner' },
] as const

/**
 * The three tools share one saved list, one set of team rules and one set of
 * remembered merges, so they are presented as one toolkit. The standalone QR
 * generator does not use any of that, so it is not part of it.
 */
export function UtmToolkitNav({ current }: { current: (typeof TOOLS)[number]['id'] }) {
  return (
    <nav aria-label="UTM toolkit" className="mx-auto max-w-5xl px-6 pt-6">
      <ul className="flex flex-wrap justify-center gap-2">
        {TOOLS.map((t) => {
          const active = t.id === current
          return (
            <li key={t.id}>
              <Link
                href={t.href}
                aria-current={active ? 'page' : undefined}
                className={
                  active
                    ? 'bg-ds-cta rounded-lg px-3 py-1.5 text-sm font-medium text-white'
                    : 'border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent rounded-lg border px-3 py-1.5 text-sm transition-colors'
                }
              >
                {t.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
