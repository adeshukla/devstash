import { JsonLd } from '@/components/seo/JsonLd'
import { LabFaq } from '@/components/lab/LabFaq'
import { Button } from '@/components/ui'
import { buildFAQSchema } from '@/lib/schema/builders'
import type { FAQItem } from '@/types/seo'

/**
 * Visible Q&A + matching FAQPage JSON-LD. The markup is only valid when the
 * same text is on the page, so both come from the one `items` array.
 */
export function FaqSection({
  items,
  title = 'Frequently asked questions',
  intro,
  ask = true,
}: {
  items: FAQItem[]
  title?: string
  intro?: string
  /** Show the "ask me directly" card. Off on the contact page itself. */
  ask?: boolean
}) {
  return (
    <section className="border-ds-border border-t py-16 lg:py-20">
      <JsonLd data={buildFAQSchema(items)} />
      <div className="max-w-site mx-auto grid gap-10 px-6 lg:grid-cols-[5fr_7fr] lg:gap-16">
        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <p className="text-ds-accent font-mono text-sm">FAQ</p>
          <h2 className="text-ds-text mt-3 text-2xl font-bold tracking-tight [overflow-wrap:anywhere] sm:text-3xl">
            {title}
          </h2>
          {intro && <p className="text-ds-muted mt-3 max-w-md leading-relaxed">{intro}</p>}
          <p className="text-ds-muted mt-4 font-mono text-xs">{items.length} questions</p>

          {ask && (
            <div className="border-ds-border bg-ds-surface mt-8 max-w-md rounded-xl border p-5">
              <p className="text-ds-text font-medium">Not answered here?</p>
              <p className="text-ds-muted mt-1.5 text-sm leading-relaxed">
                Ask directly. I reply within 24 hours.
              </p>
              <Button href="/contact" variant="outline" size="sm" className="mt-4">
                Ask a question →
              </Button>
            </div>
          )}
        </div>
        <LabFaq items={items} defaultOpen />
      </div>
    </section>
  )
}
