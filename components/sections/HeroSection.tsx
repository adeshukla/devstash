import { Button } from '@/components/ui'

// Server Component — no 'use client'
export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      {/* Subtle grid background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--color-ds-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-ds-border)_1px,transparent_1px)] bg-[size:64px_64px] opacity-25"
      />
      {/* Glow blob */}
      <div
        aria-hidden="true"
        className="bg-ds-accent pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full opacity-[0.06] blur-3xl"
      />

      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-col gap-6">
          {/* Availability indicator */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="bg-ds-success absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
              <span className="bg-ds-success relative inline-flex h-2 w-2 rounded-full" />
            </span>
            <span className="text-ds-muted font-mono text-sm">
              {/* TODO: Update availability status dynamically */}
              Available for frontend roles · Noida / Delhi NCR
            </span>
          </div>

          {/* Main heading */}
          <h1 className="text-ds-text text-4xl leading-tight font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {/* TODO: Finalise headline */}
            Building interfaces that <span className="text-ds-accent">actually work.</span>
          </h1>

          {/* Sub-copy */}
          <p className="text-ds-muted max-w-2xl text-lg leading-relaxed">
            {/* TODO: Update with final bio copy */}
            Frontend developer with a designer&apos;s eye. I specialise in React, Next.js, and
            automation workflows — turning Figma designs into high-performance, SEO-ready web
            experiences.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Button href="/projects" size="lg">
              View Projects
            </Button>
            <Button href="/contact" variant="outline" size="lg">
              Get in Touch
            </Button>
          </div>

          {/* Quick stats */}
          <div className="border-ds-border mt-6 flex flex-wrap gap-10 border-t pt-8">
            {(
              [
                { label: 'Years experience', value: '6+' },
                { label: 'Landing pages shipped', value: '200+' },
                // TODO: Update with real numbers before launch
                { label: 'Open source projects', value: '5+' },
              ] as const
            ).map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-ds-text text-2xl font-bold">{value}</span>
                <span className="text-ds-muted text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
