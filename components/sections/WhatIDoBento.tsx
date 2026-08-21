// Replaces the old "3 identical icon-in-a-box cards" grid — same generic
// pattern as a hundred SaaS/portfolio templates. Same three claims, same
// copy, but each one now gets a visual actually built from what it's
// claiming instead of a stock Lucide icon: real tech-stack marks for
// frontend, an actual SERP-style preview for SEO, a real pipeline diagram
// for automation. Asymmetric sizing (7/5 split, then full-width) instead of
// three equal columns — the grid a real designer draws for this content,
// not the one a card component defaults to.
//
// Type scale: measured Praxis's own bento section (a reference explicitly
// requested) before touching this a third time — its card headings run
// 36px/weight 400, section heading 60px, against this file's previous
// 16px/24px. That gap, not missing motion, is what read as "small" and
// "dead". Scaled up accordingly below.
//
// Motion: previously every card carried an ambient aurora glow, and the
// automation nodes each bobbed independently via animate-float. Measuring
// Praxis's actual bento cards found *zero* hover state and *zero*
// auto-animation on them — the "alive" feeling there comes from scale,
// whitespace, and real content, not motion. Cut the ambient glow entirely.
// The three independently-bobbing nodes were also reported as jittery —
// three uncoordinated loops don't read as one thing, they read as noise.
// Replaced with one coherent moment: a small dot traveling along each
// connector line in sequence (transform/opacity only, no layout-triggering
// `left`/`top`), reading as "a request moving through the pipeline" rather
// than decoration.

import { Icon } from '@/components/icons/Icon'
import type { IconName } from '@/components/icons/Icon'

const STACK: { name: string; icon: IconName }[] = [
  { name: 'React', icon: 'react' },
  { name: 'Next.js', icon: 'nextjs' },
  { name: 'TypeScript', icon: 'typescript' },
  { name: 'Tailwind CSS', icon: 'tailwind' },
]

// Vertical below sm (nodes stack in a column there), horizontal from sm up
// (nodes sit in a row) — a single connector that only ever pointed sideways
// broke the "pipeline" story the moment the row wrapped: two nodes in the
// same row would get a line between them, but the wrap boundary itself had
// no connector at all, so it read as two unrelated groups instead of one
// flow. The dot's animation axis switches with it via .pipeline-dot in
// globals.css (animation-name only, same duration/easing both ways).
//
// A hairline + a bare dot read as "two disconnected boxes with a decoration
// between them", not a pipeline — this is a real conduit (thicker, filled,
// glowing) carrying something with a name, not an abstract line. The label
// only shows at sm+ where there's room for it without crowding the stacked
// mobile layout.
function FlowConnector({ delay = '0s', flowLabel }: { delay?: string; flowLabel?: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 sm:w-16" aria-hidden="true">
      <span className="relative h-8 w-1 shrink-0 overflow-visible rounded-full sm:h-1 sm:w-12">
        <span className="from-ds-accent to-ds-purple absolute inset-0 rounded-full bg-gradient-to-b opacity-70 sm:bg-gradient-to-r" />
        <span
          className="pipeline-dot bg-ds-accent absolute top-0 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full opacity-0 shadow-[0_0_10px_3px_var(--color-ds-accent)] sm:top-1/2 sm:left-0 sm:translate-x-0 sm:-translate-y-1/2"
          style={{ animationDelay: delay }}
        />
      </span>
      {flowLabel && (
        <span className="text-ds-muted hidden font-mono text-[10px] tracking-wide whitespace-nowrap sm:block">
          {flowLabel}
        </span>
      )}
    </div>
  )
}

export function WhatIDoBento() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 max-w-2xl">
          <p className="text-ds-accent font-mono text-sm">{'// what i do'}</p>
          <h2 className="text-ds-text mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Frontend, SEO, and the automation that ties it together
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* ── Frontend Engineering — real stack marks, not a generic icon ── */}
          <div className="border-ds-border bg-ds-surface rounded-card border p-8 lg:col-span-7">
            <div className="flex flex-wrap gap-2.5">
              {STACK.map(({ name, icon }) => (
                <div
                  key={name}
                  className="gradient-ring-hover border-ds-border bg-ds-surface2 flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5"
                >
                  <Icon name={icon} className="text-ds-accent h-5 w-5 shrink-0" />
                  <span className="text-ds-text font-mono text-sm">{name}</span>
                </div>
              ))}
            </div>
            <h3 className="text-ds-text mt-6 text-xl font-semibold sm:text-2xl">
              Frontend Engineering
            </h3>
            <p className="text-ds-muted mt-3 max-w-md leading-relaxed">
              React and Next.js apps built to a real performance budget — Lighthouse 90+, tight Core
              Web Vitals, accessible by default.
            </p>
            <div className="border-ds-border mt-6 flex flex-wrap gap-x-6 gap-y-3 border-t pt-6 sm:gap-x-8">
              {(
                [
                  { label: 'LCP', value: '<2.5s' },
                  { label: 'CLS', value: '<0.1' },
                  { label: 'INP', value: '<200ms' },
                ] as const
              ).map(({ label, value }) => (
                <div key={label}>
                  <p className="text-ds-text font-mono text-lg font-semibold sm:text-xl">{value}</p>
                  <p className="text-ds-muted mt-1 font-mono text-xs tracking-wide uppercase">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── SEO-Ready — an actual SERP preview, the thing this claim produces ── */}
          <div className="border-ds-border bg-ds-surface rounded-card border p-8 lg:col-span-5">
            <p className="text-ds-muted mb-3 font-mono text-xs tracking-wide uppercase">
              Search preview
            </p>
            <div className="border-ds-border bg-ds-surface2 rounded-lg border p-4">
              <p className="text-ds-success truncate font-mono text-xs">
                devstash.me › projects › netflix-gpt
              </p>
              <p className="text-ds-accent mt-1.5 truncate text-base">
                Netflix GPT — Case Study | DevStash
              </p>
              <p className="text-ds-muted mt-1 line-clamp-2 text-sm leading-relaxed">
                A full-stack Netflix clone powered by Gemini AI for smart movie recommendations —
                architecture, decisions, and the real build.
              </p>
            </div>
            <h3 className="text-ds-text mt-6 text-xl font-semibold sm:text-2xl">
              SEO-Ready by Default
            </h3>
            <p className="text-ds-muted mt-3 leading-relaxed">
              Structured data, metadata, and sitemaps wired in from day one on every page — this
              site&apos;s own search visibility runs on the same system.
            </p>
          </div>

          {/* ── Workflow Automation — the actual pipeline shape, not a lightning-bolt icon ── */}
          <div className="border-ds-border bg-ds-surface rounded-card border p-8 lg:col-span-12">
            {/* Text and the node strip only go side-by-side at lg (1024px) —
                sharing a row any earlier is what caused the overflow: at
                640-767px the two were already competing for width in a
                single-column card at the same breakpoint the node row also
                tried to go horizontal, guaranteeing they didn't both fit.
                Below lg they stack, so the node row gets the card's full
                width to itself and comfortably goes horizontal on its own,
                smaller sm (640px) breakpoint. */}
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
              <div className="lg:flex-1">
                <h3 className="text-ds-text text-xl font-semibold sm:text-2xl">
                  Workflow Automation
                </h3>
                <p className="text-ds-muted mt-3 max-w-lg leading-relaxed">
                  n8n and LLM pipelines that handle the repetitive parts — from deploy-triggered
                  search-engine notifications to AI-assisted content workflows.
                </p>
              </div>

              <div
                className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center lg:shrink-0 lg:justify-start"
                aria-hidden="true"
              >
                {(
                  [
                    { label: 'Trigger', icon: 'automation' as IconName, flowLabel: 'payload' },
                    { label: 'LLM pipeline', icon: 'ai' as IconName, flowLabel: 'draft' },
                    { label: 'Output', icon: 'check' as IconName, flowLabel: undefined },
                  ] as const
                ).map(({ label, icon, flowLabel }, i, arr) => (
                  <div key={label} className="flex flex-col items-center gap-2 sm:flex-row">
                    {/* Fixed width on every node (not content-driven) so the
                        three stay visually even regardless of label length —
                        "Trigger" and "LLM pipeline" sizing themselves
                        independently was the "uneven boxes" of it. */}
                    <div className="border-ds-border bg-ds-surface2 flex w-40 flex-col items-center gap-2.5 rounded-xl border px-6 py-4">
                      <Icon name={icon} className="text-ds-accent h-6 w-6" />
                      <span className="text-ds-muted font-mono text-xs whitespace-nowrap">
                        {label}
                      </span>
                    </div>
                    {i < arr.length - 1 && (
                      <FlowConnector delay={i === 0 ? '0s' : '0.9s'} flowLabel={flowLabel} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
