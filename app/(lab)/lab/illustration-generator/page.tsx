import { H1_HEADLINE } from '@/lib/utils/typography'
import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { LabToolSchema } from '@/components/lab/LabToolSchema'
import { IllustrationGenerator } from '@/components/lab/IllustrationGenerator'
import { FaqSection } from '@/components/sections/FaqSection'

const FAQ = [
  {
    question: 'Is this AI image generation?',
    answer:
      'No. Your description is turned into a number that drives a small procedural composer, which places real SVG shapes, charts and networks. There is no image-generation model and no external call.',
  },
  {
    question: 'Why does the same text always give the same picture?',
    answer:
      'The picture is calculated from your text, so the same description gives the same layout. Shuffle layout changes the arrangement without touching your text.',
  },
  {
    question: 'What can I download?',
    answer:
      'The illustration as SVG or PNG, the SVG code to copy, or a link that reopens it. You can also save a named look on this device.',
  },
  {
    question: 'Will it draw exactly what I describe?',
    answer:
      'No. It picks abstract motifs from keywords in your description, such as networks, bars or geometric shapes, and you can override them. The figures are flat and stylised, not realistic.',
  },
  {
    question: 'Is my description sent anywhere?',
    answer: 'No. It is all local geometry in your browser.',
  },
]

export const metadata: Metadata = buildMetadata({
  title: 'Free SVG Illustration Generator, Animated',
  description:
    'A real tool that composes a unique, theme-aware animated SVG illustration from a description — procedural generation, not a fixed list of presets to pick from.',
  canonical: '/lab/illustration-generator',
})

export default function IllustrationGeneratorPage() {
  return (
    <>
      <LabToolSchema slug="illustration-generator" path="/lab/illustration-generator" />

      <main className="bg-ds-bg min-h-screen">
        <section className="border-ds-border border-b px-6 py-8 text-center sm:py-12">
          <div className="mx-auto max-w-2xl">
            <p className="text-ds-accent mb-4 font-mono text-sm">ILLUSTRATION GENERATOR</p>
            <h1 className={`${H1_HEADLINE}`}>Describe it, get a one-off illustration.</h1>
            <p className="text-ds-muted mt-4 text-lg leading-relaxed">
              Type what it is for and get an animated SVG composed from shapes, charts and networks.
              Same text, same picture; shuffle for a new arrangement. Download SVG or PNG, or copy a
              link that reopens it.
            </p>
          </div>
        </section>

        <section className="px-6 py-8 sm:py-12">
          <div className="border-ds-border bg-ds-surface mx-auto max-w-4xl rounded-2xl border p-5 sm:p-8">
            <IllustrationGenerator />
          </div>
        </section>

        <section className="border-ds-border border-t px-6 py-16">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-ds-text mb-4 text-xl font-bold">How this actually works</h2>
            <p className="text-ds-muted leading-relaxed">
              Your description is hashed into a deterministic seed, which drives a small procedural
              composer. In Abstract style it auto-picks 2–4 motif primitives by keyword match (fully
              overridable), then places and colors real SVG shapes from that seed. In Character
              style it builds people the way modular illustration kits like unDraw and Humaaans do —
              separate, swappable layers (head, hair, clothing, pose) sharing consistent proportions
              instead of one fixed drawing — with a real blazer, lapels, collar, optional tie,
              cuffed sleeves, and shoes, plus a masculine/feminine style control that swaps the
              hairstyle and silhouette. These are deliberately flat, stylized figures, not an
              attempt at photorealism — that isn&apos;t something hand-authored SVG can credibly
              deliver. Every shape&apos;s color resolves through a shared token system that can be
              evaluated for either theme, which is what lets clicking the light or dark preview
              switch the copied code to that theme&apos;s actual literal colors instead of one
              generic export. Same input always produces the same layout; hitting
              &quot;Shuffle&quot; changes the seed for a new arrangement without touching your text.
              No image-generation API, no external calls — it&apos;s all local geometry. The second
              tab (&quot;Match a site scene&quot;) is the older, separate tool that maps a topic to
              one of the 16 hand-built scenes this site&apos;s own blog/project cards use.
            </p>
          </div>
        </section>

        <FaqSection
          items={FAQ}
          title="Illustration generator questions"
          intro="How it makes a picture, what you can download, and what it does not do."
          ask={false}
        />

        <p className="text-ds-muted border-ds-border border-t px-6 py-8 text-center font-mono text-xs">
          Free tool by Adesh Shukla — fully client-side, no image-generation API involved.
        </p>
      </main>
    </>
  )
}
