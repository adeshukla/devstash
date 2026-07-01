import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { UtmBuilder } from '@/components/lab/UtmBuilder'

export const metadata: Metadata = buildMetadata({
  title: 'UTM Builder — Landing Page Sample',
  description:
    'A real, working UTM link builder for PPC landing pages — built from actually tagging 200+ campaign URLs, not a mockup.',
  canonical: '/lab/utm-builder',
  noIndex: true,
})

export default function UtmBuilderPage() {
  return (
    <main className="bg-ds-bg min-h-screen">
      <section className="border-ds-border border-b px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-ds-accent mb-4 font-mono text-sm">UTM LINK BUILDER</p>
          <h1 className="text-ds-text text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
            Stop guessing which ad drove the click.
          </h1>
          <p className="text-ds-muted mt-6 text-lg leading-relaxed">
            A working UTM builder — no backend, nothing saved, just a clean tagged URL you can paste
            straight into your ad platform.
          </p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="border-ds-border bg-ds-surface mx-auto max-w-2xl rounded-2xl border p-8">
          <UtmBuilder />
        </div>
      </section>

      <section className="border-ds-border border-t px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-ds-text mb-4 text-xl font-bold">Why term and content matter</h2>
          <p className="text-ds-muted leading-relaxed">
            Source, medium, and campaign get filled in on almost every tagged link — they're the
            three fields every analytics dashboard groups by default. Term and content are the ones
            people skip, and they're exactly the fields that answer the question that actually
            matters after a campaign runs: which specific ad variant or keyword drove this
            particular click, not just which platform it came from.
          </p>
        </div>
      </section>

      <p className="text-ds-muted border-ds-border border-t px-6 py-8 text-center font-mono text-xs">
        Sample tool by Adesh Shukla — fully client-side, nothing you enter here is sent anywhere.
      </p>
    </main>
  )
}
