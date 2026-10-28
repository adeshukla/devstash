import { JsonLd } from '@/components/seo/JsonLd'
import { LabFaq } from '@/components/lab/LabFaq'
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
}: {
  items: FAQItem[]
  title?: string
  intro?: string
}) {
  return (
    <section className="border-ds-border border-t py-16">
      <JsonLd data={buildFAQSchema(items)} />
      <div className="max-w-site mx-auto grid gap-10 px-6 lg:grid-cols-[5fr_7fr]">
        <div>
          <h2 className="text-ds-text text-2xl font-bold tracking-tight">{title}</h2>
          {intro && <p className="text-ds-muted mt-3 max-w-md leading-relaxed">{intro}</p>}
        </div>
        <LabFaq items={items} />
      </div>
    </section>
  )
}
