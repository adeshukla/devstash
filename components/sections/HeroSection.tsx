import { Button, TerminalTyping, HeroGraphic, MouseParallax, MountReveal } from '@/components/ui'

// Server Component — no 'use client'
export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-28 lg:py-40">
      {/* Subtle grid background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--color-ds-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-ds-border)_1px,transparent_1px)] bg-[size:64px_64px] opacity-25"
      />
      {/* Animated aurora blobs — drift on their own keyframe, plus a subtle
          cursor-parallax offset layered on top for a "living" background. */}
      <MouseParallax strength={-18} className="pointer-events-none absolute inset-0 -z-10">
        <div
          aria-hidden="true"
          className="animate-aurora bg-ds-accent absolute -top-40 left-1/4 h-[460px] w-[460px] -translate-x-1/2 rounded-full opacity-[0.16] blur-3xl"
        />
        <div
          aria-hidden="true"
          className="animate-aurora bg-ds-purple absolute -top-20 right-0 h-[380px] w-[380px] rounded-full opacity-[0.14] blur-3xl [animation-delay:-7s]"
        />
        <div
          aria-hidden="true"
          className="animate-aurora bg-ds-accent absolute top-32 left-0 h-[320px] w-[320px] rounded-full opacity-[0.1] blur-3xl [animation-delay:-12s]"
        />
      </MouseParallax>

      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 xl:grid-cols-[1.35fr_1.1fr] xl:items-center xl:gap-16">
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Terminal typing kicker */}
            <MountReveal>
              <div className="border-ds-border bg-ds-surface/60 inline-flex w-fit items-center rounded-lg border px-3 py-1.5 text-sm backdrop-blur">
                <TerminalTyping
                  // Full host prefix + longest phrase don't fit a 375px
                  // viewport on one line — drop the host on tiny screens
                  // and keep the "~$" so it still reads as a prompt.
                  prompt={
                    <>
                      <span className="max-[479px]:hidden">adesh@devstash:</span>~$
                    </>
                  }
                  phrases={[
                    'building developer tools',
                    'shipping Next.js apps',
                    'automating workflows',
                    'writing about frontend',
                  ]}
                />
              </div>
            </MountReveal>

            {/* Availability indicator */}
            <MountReveal delay={80}>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="bg-ds-success absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                  <span className="bg-ds-success relative inline-flex h-2 w-2 rounded-full" />
                </span>
                <span className="text-ds-muted font-mono text-sm">
                  Available for frontend roles · Noida / Gurugram · Remote/Hybrid
                </span>
              </div>
            </MountReveal>

            {/* Main heading — deliberately NOT wrapped in MountReveal.
                This <h1> is the homepage's LCP element, and `animate-fade-up`
                is `fadeUp 0.5s ease both`: `both` holds it at opacity 0 for
                the delay, then fades in over 500ms, so a delay={160} wrapper
                kept it from being fully painted until ~660ms after styles
                applied. LCP counts when the element actually paints, so that
                animation was pure LCP cost on the one element that must not
                pay it. The surrounding blocks still stagger in around it —
                the headline just doesn't wait its turn. */}
            <h1 className="text-ds-text text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
              Web interfaces that ship —{' '}
              <span className="text-gradient-animate">fast, accessible, built to last.</span>
            </h1>

            {/* Sub-copy */}
            <MountReveal delay={240}>
              {/* "6+ years" is the strongest recruiter/E-E-A-T signal on the
                  site and was previously stated only on /about — the page
                  fewest visitors reach. Same claim, surfaced on the first screen.

                  Keep the <strong> followed by a period rather than a space:
                  JSX trims the leading whitespace of a multi-line text node, so
                  `</strong> and a…` silently renders as `yearsand a`, and
                  Prettier rewrites the `{' '}` that would fix it straight back
                  into that broken literal space. */}
              <p className="text-ds-muted max-w-2xl text-base leading-relaxed sm:text-lg">
                I&apos;m Adesh Shukla — a frontend developer with a designer&apos;s eye, building
                for the web for <strong className="text-ds-text font-semibold">6+ years</strong>. I
                build with React and Next.js, turn Figma into high-performance, SEO-ready products,
                and automate the repetitive parts of the workflow.
              </p>
            </MountReveal>

            {/* CTAs */}
            <MountReveal delay={320}>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Button href="/projects" size="lg">
                  View Projects
                </Button>
                <Button href="/contact" variant="outline" size="lg">
                  Get in Touch
                </Button>
              </div>
            </MountReveal>
          </div>

          <MountReveal delay={200} className="xl:mx-0">
            <MouseParallax strength={14} className="mx-auto w-full max-w-lg xl:mx-0 xl:max-w-none">
              <HeroGraphic />
            </MouseParallax>
          </MountReveal>
        </div>
      </div>
    </section>
  )
}
