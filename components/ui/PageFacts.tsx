import { CountUp } from './CountUp'

export interface PageFact {
  value: number
  label: string
  /** Unit after the number, e.g. " min" */
  suffix?: string
  /** Short status after the value, e.g. "all live" (success colour) */
  note?: string
}

/**
 * The inner-page header's evidence row: a ruled strip of real numbers under
 * the h1 — the home hero's "show the proof" idea at page scale. Values must
 * be computed from content at build time, never typed in, and must stay true
 * over time (counts, not dates). They count up as the strip scrolls in. 2
 * columns on phones, up to 4 in a row from sm, divided by hairlines.
 */
export function PageFacts({ items }: { items: PageFact[] }) {
  return (
    <dl className="border-ds-border mt-10 grid grid-cols-2 gap-y-5 border-t pt-5 sm:grid-cols-4">
      {items.map(({ value, label, suffix, note }, i) => (
        <div
          key={label}
          className={`flex flex-col-reverse gap-2 pr-4 ${i > 0 ? 'sm:border-ds-border sm:border-l sm:pl-5' : ''}`}
        >
          <dt className="text-ds-muted font-mono text-[11px] tracking-[0.12em] uppercase">
            {label}
          </dt>
          <dd className="text-ds-text text-[28px] leading-none font-bold tracking-tight">
            <CountUp value={value} suffix={suffix} />
            {note && (
              <span className="text-ds-success ml-2 align-middle font-mono text-xs font-medium tracking-normal">
                ● {note}
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}
