import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { IllustrationGenerator } from '@/components/lab/IllustrationGenerator'

export const metadata: Metadata = buildMetadata({
  title: 'Illustration Generator — DevStash Sample Project',
  description:
    'A real tool that composes a unique, theme-aware animated SVG illustration from a description — procedural generation, not a fixed list of presets to pick from.',
  canonical: '/lab/illustration-generator',
  noIndex: true,
})

export default function IllustrationGeneratorPage() {
  return (
    <main className="bg-ds-bg min-h-screen">
      <section className="border-ds-border border-b px-6 py-20 text-center sm:py-24">
        <div className="mx-auto max-w-2xl">
          <p className="text-ds-accent mb-4 font-mono text-sm">ILLUSTRATION GENERATOR</p>
          <h1 className="text-ds-text text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
            Describe it, get a one-off illustration.
          </h1>
          <p className="text-ds-muted mt-6 text-lg leading-relaxed">
            Two styles. <strong className="text-ds-text">Abstract</strong> composes shapes, charts,
            and networks from six motif primitives.{' '}
            <strong className="text-ds-text">Character</strong> builds flat-icon corporate scenes
            with real clothing — a figure waving hello, presenting to a growing chart, a full
            boardroom presentation, a team, a handshake, a celebration, or an idea moment — with
            your own skin tone, masculine/feminine figure style, and outfit palette. Click either
            preview to make the copied SVG use that theme's real colors.
          </p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="border-ds-border bg-ds-surface mx-auto max-w-4xl rounded-2xl border p-8">
          <IllustrationGenerator />
        </div>
      </section>

      <section className="border-ds-border border-t px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-ds-text mb-4 text-xl font-bold">How this actually works</h2>
          <p className="text-ds-muted leading-relaxed">
            Your description is hashed into a deterministic seed, which drives a small procedural
            composer. In Abstract style it auto-picks 2–4 motif primitives by keyword match (fully
            overridable), then places and colors real SVG shapes from that seed. In Character style
            it builds people the way modular illustration kits like unDraw and Humaaans do —
            separate, swappable layers (head, hair, clothing, pose) sharing consistent proportions
            instead of one fixed drawing — with a real blazer, lapels, collar, optional tie, cuffed
            sleeves, and shoes, plus a masculine/feminine style control that swaps the hairstyle and
            silhouette. These are deliberately flat, stylized figures, not an attempt at
            photorealism — that isn't something hand-authored SVG can credibly deliver. Every
            shape's color resolves through a shared token system that can be evaluated for either
            theme, which is what lets clicking the light or dark preview switch the copied code to
            that theme's actual literal colors instead of one generic export. Same input always
            produces the same layout; hitting "Shuffle" changes the seed for a new arrangement
            without touching your text. No image-generation API, no external calls — it's all local
            geometry. The second tab ("Match a site scene") is the older, separate tool that maps a
            topic to one of the 16 hand-built scenes this site's own blog/project cards use.
          </p>
        </div>
      </section>

      <p className="text-ds-muted border-ds-border border-t px-6 py-8 text-center font-mono text-xs">
        Sample tool by Adesh Shukla — fully client-side, no image-generation API involved.
      </p>
    </main>
  )
}
