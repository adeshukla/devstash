import testimonialsData from '@/content/testimonials/testimonials.json'
import { TestimonialsCarousel } from '@/components/ui/TestimonialsCarousel'
import type { Testimonial } from '@/types/testimonial'

// Filters out placeholder entries (content/testimonials/testimonials.json
// ships with `[TODO: ...]` quotes and `PLACEHOLDER-*` LinkedIn URLs until
// real recommendations are pasted in) so the section self-gates on its own
// data — merge freely, it stays invisible in production until the JSON has
// real quotes, then appears automatically with no flag to remember to flip.
const testimonials = (testimonialsData as Testimonial[]).filter(
  (t) => !t.quote.includes('[TODO') && !t.linkedinUrl.includes('PLACEHOLDER')
)

// Server Component — data loads at build time, carousel interactivity is
// isolated to the client-only TestimonialsCarousel.
export function Testimonials() {
  if (testimonials.length === 0) return null

  return (
    <section className="border-ds-border border-t py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 max-w-2xl">
          <p className="text-ds-accent font-mono text-sm">{'// what people say'}</p>
          <h2 className="text-ds-text mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            From people I&apos;ve worked with
          </h2>
        </div>
        <TestimonialsCarousel testimonials={testimonials} />
      </div>
    </section>
  )
}
