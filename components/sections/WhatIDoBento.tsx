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
// Replaced with one coherent moment: a request moving through the pipeline
// once — each node reacts as the dot reaches it, the connectors fill behind
// it, Output ends checked — and then it stays finished. The earlier version
// looped two dots forever, which still read as decoration, not a run.

import type { CSSProperties } from 'react'
import Link from 'next/link'
import { Icon } from '@/components/icons/Icon'
import type { IconName } from '@/components/icons/Icon'
import { projectBrand } from '@/components/icons/ProjectMark'
import { Reveal } from '@/components/ui/Reveal'

// Each claim points at the shipped work that backs it, with that project's
// own logo — the same marks as the Projects deck above.
type Proof = { slug: string; name: string; href: string }
const PROOF: Record<'frontend' | 'seo' | 'automation', Proof[]> = {
  frontend: [
    { slug: 'pare', name: 'Pare', href: '/projects/pare' },
    { slug: 'build-components', name: 'Build Components', href: '/projects/build-components' },
  ],
  seo: [
    {
      slug: 'meta-tag-generator',
      name: 'Meta Tag Generator',
      href: '/projects/meta-tag-generator',
    },
    { slug: 'utm-builder', name: 'UTM Link Builder', href: '/projects/utm-builder' },
  ],
  automation: [
    {
      slug: 'ai-content-pipeline',
      name: 'AI content pipeline',
      href: '/lab/ai-content-pipeline',
    },
  ],
}

function ProofLinks({ items }: { items: Proof[] }) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-2">
      <span className="text-ds-muted mr-1 font-mono text-xs tracking-wide uppercase">
        See it in
      </span>
      {items.map(({ slug, name, href }) => {
        const { Mark } = projectBrand(slug)
        return (
          <Link
            key={slug}
            href={href}
            className="ring-hover border-ds-border bg-ds-surface2 text-ds-text focus-visible:outline-ds-accent inline-flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <span className="block h-6 w-6 shrink-0 overflow-hidden rounded-full [&>svg]:h-full [&>svg]:w-full">
              <Mark />
            </span>
            {name}
          </Link>
        )
      })}
    </div>
  )
}

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
// `step` (0 or 1) picks this connector's slot in the one-shot sequence — see
// the .flow rules in globals.css. The grey track is always there; the
// gradient fills it as the dot passes and stays filled.
function FlowConnector({ step, flowLabel }: { step: number; flowLabel?: string }) {
  const k = { '--k': step } as CSSProperties
  return (
    <div className="flex flex-col items-center gap-1.5 sm:w-16" aria-hidden="true">
      {/* 2px track (was 4px): a 4px gradient bar between 1px-bordered boxes
          was the heaviest line in the card. */}
      <span className="bg-ds-border2 relative h-8 w-0.5 shrink-0 overflow-visible rounded-full sm:h-0.5 sm:w-12">
        <span
          className="flow-fill from-ds-accent to-ds-purple absolute inset-0 rounded-full bg-gradient-to-b sm:bg-gradient-to-r"
          style={k}
        />
        <span
          className="pipeline-dot bg-ds-accent absolute top-0 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full opacity-0 shadow-[0_0_8px_2px_var(--color-ds-accent)] sm:top-1/2 sm:left-0 sm:translate-x-0 sm:-translate-y-1/2"
          style={k}
        />
      </span>
      {flowLabel && (
        <span
          className="flow-label text-ds-muted hidden font-mono text-[10px] tracking-wide whitespace-nowrap sm:block"
          style={k}
        >
          {flowLabel}
        </span>
      )}
    </div>
  )
}

export function WhatIDoBento() {
  return (
    <section className="py-16">
      <div className="max-w-site mx-auto px-6">
        <div className="mb-12 max-w-2xl">
          <h2 className="text-ds-text text-3xl font-bold tracking-tight sm:text-4xl">
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
                  className="ring-hover border-ds-border bg-ds-surface2 flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5"
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
            {/* These are Google's "good" thresholds, used as the budget every
                page is held to — labelled as such so they can't read as a
                measured result. */}
            <p className="border-ds-border text-ds-muted mt-6 border-t pt-6 font-mono text-xs tracking-wide uppercase">
              Performance budget · every page
            </p>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3 sm:gap-x-8">
              {(
                [
                  { label: 'LCP under', value: '2.5s' },
                  { label: 'CLS under', value: '0.1' },
                  { label: 'INP under', value: '200ms' },
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
            <ProofLinks items={PROOF.frontend} />
          </div>

          {/* ── SEO-Ready — an actual SERP preview, the thing this claim produces ── */}
          <div className="border-ds-border bg-ds-surface rounded-card border p-8 lg:col-span-5">
            <p className="text-ds-muted mb-3 font-mono text-xs tracking-wide uppercase">
              Search preview
            </p>
            <div className="border-ds-border bg-ds-surface2 rounded-lg border p-4">
              <p className="text-ds-success truncate font-mono text-xs">
                devstash.me › projects › css-shapes-playground
              </p>
              <p className="text-ds-accent-strong mt-1.5 truncate text-base">
                CSS Shapes &amp; Animation Playground | DevStash
              </p>
              <p className="text-ds-muted mt-1 line-clamp-2 text-sm leading-relaxed">
                A real, working CSS showcase — a live shape + color customizer, animated borders,
                and layered shadows, with copyable CSS on every single demo.
              </p>
            </div>
            <h3 className="text-ds-text mt-6 text-xl font-semibold sm:text-2xl">
              SEO-Ready by Default
            </h3>
            <p className="text-ds-muted mt-3 leading-relaxed">
              Structured data, metadata, and sitemaps wired in from day one on every page — this
              site&apos;s own search visibility runs on the same system.
            </p>
            <ProofLinks items={PROOF.seo} />
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
                <ProofLinks items={PROOF.automation} />
              </div>

              {/* Plays each time the strip scrolls into view: Trigger fires, the
                  payload travels, the pipeline node works, the draft travels,
                  Output checks — then it rests on that finished state. Its own
                  Reveal, not the bento's: that one fires when the section top
                  arrives, long before this card at the bottom is on screen. */}
              <Reveal className="flow lg:shrink-0" repeat>
                <div
                  className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center lg:justify-start"
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
                      <div
                        className={`flow-node flow-node-${i} border-ds-border2 bg-ds-surface2 flex w-40 flex-col items-center gap-2.5 rounded-xl border-[1.5px] px-6 py-4`}
                      >
                        <Icon name={icon} className="flow-icon text-ds-accent h-6 w-6" />
                        <span className="text-ds-muted font-mono text-xs whitespace-nowrap">
                          {label}
                        </span>
                      </div>
                      {i < arr.length - 1 && <FlowConnector step={i} flowLabel={flowLabel} />}
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
