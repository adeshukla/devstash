import { H1_HEADLINE } from '@/lib/utils/typography'
import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { LabToolSchema } from '@/components/lab/LabToolSchema'
import { UtmBuilder } from '@/components/lab/UtmBuilder'

export const metadata: Metadata = buildMetadata({
  title: 'UTM Builder — Free Campaign URL Generator',
  description:
    'Free UTM link builder: pick the channel, name the campaign, see its GA4 channel, copy a link or QR code. Tag many pages, import a sheet, export CSV.',
  canonical: '/lab/utm-builder',
})

export default function UtmBuilderPage() {
  return (
    <>
      <LabToolSchema slug="utm-builder" path="/lab/utm-builder" />

      <main className="bg-ds-bg min-h-screen">
        <section className="border-ds-border border-b px-6 py-8 sm:py-12">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-ds-accent mb-4 font-mono text-sm">UTM LINK BUILDER</p>
            <h1 className={`${H1_HEADLINE}`}>Stop guessing which ad drove the click.</h1>
            <p className="text-ds-muted mt-4 text-lg leading-relaxed">
              Pick where you will share it, name the campaign, and copy a clean link or QR code. Do
              many pages and channels at once, then export. Runs in your browser; your saved list
              stays on this device.
            </p>
          </div>
        </section>

        <section className="px-6 py-8 sm:py-12">
          <div className="border-ds-border bg-ds-surface mx-auto max-w-2xl rounded-2xl border p-5 sm:p-8">
            <UtmBuilder />
          </div>
        </section>

        <section className="border-ds-border border-t px-6 py-16">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-ds-text mb-4 text-xl font-bold">Why term and content matter</h2>
            <p className="text-ds-muted leading-relaxed">
              Source, medium, and campaign get filled in on almost every tagged link — they&apos;re
              the three fields every analytics dashboard groups by default. Term and content are the
              ones people skip, and they&apos;re exactly the fields that answer the question that
              actually matters after a campaign runs: which specific ad variant or keyword drove
              this particular click, not just which platform it came from.
            </p>
          </div>
        </section>

        <p className="text-ds-muted border-ds-border border-t px-6 py-8 text-center font-mono text-xs">
          Sample tool by Adesh Shukla — fully client-side, nothing you enter here is sent anywhere.
        </p>
      </main>
    </>
  )
}
