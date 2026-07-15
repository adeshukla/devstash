import testimonialsData from '@/content/testimonials/testimonials.json'
import { TestimonialsCarousel } from '@/components/ui/TestimonialsCarousel'
import type { Testimonial } from '@/types/testimonial'

const testimonials = testimonialsData as Testimonial[]

// Server Component — data loads at build time, carousel interactivity is
// isolated to the client-only TestimonialsCarousel.
export function Testimonials() {
  if (testimonials.length === 0) return null

  return (
    <section className="border-ds-border border-t py-16">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-10 max-w-2xl">
          <p className="text-ds-accent font-mono text-sm">{'// what people say'}</p>
          <h2 className="text-ds-text mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            From people I&apos;ve worked with
          </h2>
        </div>
        <TestimonialsCarousel testimonials={testimonials} />
      </div>
    </section>
  )
}
