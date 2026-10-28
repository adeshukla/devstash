import type { CSSProperties } from 'react'
import Link from 'next/link'
import { Icon, type IconName } from '@/components/icons/Icon'

export interface IndexEntry {
  id: string
  title: string
  href: string
  /** Small mono line under the title — the source host, for example. */
  meta?: string
  paid?: boolean
  description: string
  /** Brand colour (hex) for the hover, or "mono" for black-and-white brands. Default: the site accent. */
  brand?: string
}

export interface IndexGroup {
  key: string
  label: string
  icon: IconName
  entries: IndexEntry[]
}

// "mono" brands (Vercel, Next.js, …) are black or white: use the text colour so
// they show in both themes.
const brandVar = (brand?: string) =>
  brand
    ? ({ '--brand': brand === 'mono' ? 'var(--color-ds-text)' : brand } as CSSProperties)
    : undefined

/**
 * The /resources and /tools body: one row per category at the full site width
 * — the category on the left (sticky on wide screens, so you always know which
 * group you are in), its entries as cards on the right. Replaced a single
 * 768px reading column that left most of a 1440px screen empty.
 */
export function CategoryIndex({ groups }: { groups: IndexGroup[] }) {
  return (
    <div className="max-w-site mx-auto px-6">
      {groups.map(({ key, label, icon, entries }) => (
        <section
          key={key}
          aria-labelledby={`cat-${key}`}
          className="border-ds-border grid gap-5 border-t py-10 first:border-t-0 lg:grid-cols-[15rem_1fr] lg:gap-12"
        >
          <div className="lg:sticky lg:top-24 lg:self-start">
            <h2
              id={`cat-${key}`}
              className="text-ds-text flex items-center gap-3 text-lg font-semibold"
            >
              <span className="bg-ds-accent/10 text-ds-accent-strong grid h-9 w-9 shrink-0 place-items-center rounded-lg">
                <Icon name={icon} className="h-4 w-4" />
              </span>
              {label}
            </h2>
            <p className="text-ds-muted mt-2 font-mono text-xs">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </p>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {entries.map((e) => (
              <li key={e.id} className="flex">
                <Link
                  href={e.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={brandVar(e.brand)}
                  className="brand-card group border-ds-border bg-ds-surface focus-visible:ring-ds-accent focus-visible:ring-offset-ds-bg rounded-card flex w-full flex-col border p-5 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-ds-text font-semibold">{e.title}</h3>
                    <Icon
                      name="external-link"
                      className="brand-icon text-ds-muted mt-1 h-3.5 w-3.5 shrink-0"
                    />
                  </div>
                  {(e.meta || e.paid || e.brand) && (
                    <p className="text-ds-muted mt-1 flex items-center gap-2 font-mono text-xs">
                      <span
                        aria-hidden="true"
                        className="brand-dot h-2 w-2 shrink-0 rounded-full"
                      />
                      {[e.meta, e.paid ? 'paid' : null].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <p className="text-ds-muted mt-3 text-sm leading-relaxed">{e.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
