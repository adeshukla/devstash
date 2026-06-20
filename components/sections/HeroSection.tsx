import { Button, AnimatedCounter, TerminalTyping } from '@/components/ui'

// Server Component — no 'use client'
export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      {/* Subtle grid background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--color-ds-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-ds-border)_1px,transparent_1px)] bg-[size:64px_64px] opacity-25"
      />
      {/* Animated aurora blobs */}
      <div
        aria-hidden="true"
        className="animate-aurora bg-ds-accent pointer-events-none absolute -top-40 left-1/4 -z-10 h-[460px] w-[460px] -translate-x-1/2 rounded-full opacity-[0.10] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="animate-aurora bg-ds-purple pointer-events-none absolute -top-20 right-0 -z-10 h-[380px] w-[380px] rounded-full opacity-[0.08] blur-3xl [animation-delay:-7s]"
      />

      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-col gap-6">
          {/* Terminal typing kicker */}
          <div className="border-ds-border bg-ds-surface/60 inline-flex w-fit items-center rounded-lg border px-3 py-1.5 text-sm backdrop-blur">
            <TerminalTyping
              prompt="adesh@devstash:~$"
              phrases={[
                'building developer tools',
                'shipping Next.js apps',
                'automating workflows',
                'writing about frontend',
              ]}
            />
          </div>

          {/* Availability indicator */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="bg-ds-success absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
              <span className="bg-ds-success relative inline-flex h-2 w-2 rounded-full" />
            </span>
            <span className="text-ds-muted font-mono text-sm">
              Available for frontend roles · Noida / Delhi NCR · Remote
            </span>
          </div>

          {/* Main heading */}
          <h1 className="text-ds-text text-4xl leading-tight font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Web interfaces that ship —{' '}
            <span className="text-gradient-animate">fast, accessible, built to last.</span>
          </h1>

          {/* Sub-copy */}
          <p className="text-ds-muted max-w-2xl text-lg leading-relaxed">
            I&apos;m Adesh Shukla — a frontend developer with a designer&apos;s eye. I build with
            React and Next.js, turn Figma into high-performance, SEO-ready products, and automate
            the repetitive parts of the workflow.
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
                { label: 'Years Frontend Eng', value: '6+' },
                { label: 'Posts by 2027 (AI-Powered)', value: '50+' },
                { label: 'Lighthouse Avg Score', value: '90+' },
              ] as const
            ).map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <AnimatedCounter value={value} className="text-ds-text text-2xl font-bold" />
                <span className="text-ds-muted text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
