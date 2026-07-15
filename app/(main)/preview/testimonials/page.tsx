import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { Testimonials } from '@/components/sections/Testimonials'

// Design-review-only route: noindex, not linked from nav/footer/sitemap.
// DELETE this route (or move Testimonials into the real page) once the
// design is approved and real quotes replace the [TODO] placeholders in
// content/testimonials/testimonials.json.
export const metadata: Metadata = buildMetadata({
  title: 'Preview — Testimonials',
  description: 'Internal design review — not a public page.',
  canonical: '/preview/testimonials',
  noIndex: true,
})

export default function TestimonialsPreviewPage() {
  return (
    <main>
      <div className="border-ds-warning/30 bg-ds-warning/10 px-6 py-3 text-center">
        <p className="text-ds-warning font-mono text-xs">
          DESIGN REVIEW ONLY — not linked anywhere, noindex. Quotes below are placeholders.
        </p>
      </div>
      <Testimonials />
    </main>
  )
}
