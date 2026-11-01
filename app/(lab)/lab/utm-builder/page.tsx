import { H1_HEADLINE } from '@/lib/utils/typography'
import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { LabToolSchema } from '@/components/lab/LabToolSchema'
import { UtmToolkitNav } from '@/components/lab/UtmToolkitNav'
import { UtmBuilder } from '@/components/lab/UtmBuilder'
import { UtmTemplateButton } from '@/components/lab/UtmTemplateButton'
import { FaqSection } from '@/components/sections/FaqSection'

const FAQ = [
  {
    question: 'Is my data sent anywhere?',
    answer:
      'No. Links, rules, saved lists and QR codes are made in your browser. The saved list, your own channels and your team rules are kept on this device only. Team rules travel inside a link you copy; nothing is uploaded.',
  },
  {
    question: 'Why does GA4 show some of my traffic as Unassigned?',
    answer:
      'GA4 sorts traffic into channels by reading source and medium. If the medium is something it does not recognise, such as ppc-ads, the visit lands in Unassigned. The builder shows the GA4 channel under every link and, for Unassigned, how to fix it.',
  },
  {
    question: 'What do team rules do?',
    answer:
      'You list the channels people may use and pick one separator for campaign names. The form then offers only those channels and writes names with that separator. Saved rows that break the rules are flagged, and each export records which version of the rules it followed.',
  },
  {
    question: 'Do the QR codes expire?',
    answer:
      'No. They are static: the full link is stored in the pattern itself, so there is no redirect service and no subscription. The trade-off is that a printed code cannot be pointed somewhere else later.',
  },
  {
    question: 'What are the ad-platform values like {keyword}?',
    answer:
      'Google Ads and Meta replace a placeholder with a real value for every click, so one tagged link can cover many ads. Add them under More options. Such a link only works once pasted into the ad platform, so it has no QR code.',
  },
  {
    question: 'What is the campaign pack?',
    answer:
      'One file you can send to a client, a printer or your team: every saved link with its GA4 channel and a QR code, plus any naming problems. It opens in any browser and prints to PDF. It is made on your device.',
  },
  {
    question: 'Does it shorten links or count clicks?',
    answer:
      'No. Shortening and click counting need a server that stores your links, which would break the promise that nothing leaves your browser. Use the Share and Copy buttons, or your own shortener, on top of the tagged link.',
  },
]

export const metadata: Metadata = buildMetadata({
  title: 'UTM Builder — Free Campaign URL Generator',
  description:
    'Free UTM builder: team naming rules, GA4 channel check, sheet import, ad-platform values, QR codes with a print kit, CSV export. Runs in your browser.',
  canonical: '/lab/utm-builder',
})

export default function UtmBuilderPage() {
  return (
    <>
      <LabToolSchema slug="utm-builder" path="/lab/utm-builder" />

      <main className="bg-ds-bg min-h-screen">
        <UtmToolkitNav current="build" />
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
          <div className="border-ds-border bg-ds-surface mx-auto max-w-5xl rounded-2xl border p-5 sm:p-8">
            <UtmBuilder />
          </div>
          <p className="text-ds-muted mx-auto mt-4 max-w-5xl text-center text-sm">
            Already have links?{' '}
            <Link href="/lab/utm-link-checker" className="text-ds-accent-strong underline">
              Check them for mistakes
            </Link>
            . Need a code for WhatsApp, Wi-Fi or a contact?{' '}
            <Link href="/lab/qr-code-generator" className="text-ds-accent-strong underline">
              Make one here
            </Link>
            .
          </p>
        </section>

        <section className="border-ds-border border-t px-6 py-16">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-ds-text mb-4 text-xl font-bold">
              A naming convention you can copy
            </h2>
            <ol className="text-ds-muted mb-6 list-decimal space-y-2 pl-5 leading-relaxed">
              <li>Everything lowercase. GA4 treats Email and email as different values.</li>
              <li>One separator between words, a hyphen or an underscore, never both.</li>
              <li>
                Source is the platform (google, newsletter). Medium is the type of traffic (cpc,
                email, social).
              </li>
              <li>
                Campaign names follow one pattern, for example offer-year-month:
                spring-sale-2026-03.
              </li>
              <li>
                Never tag links inside your own site; it overwrites where the visit really came
                from.
              </li>
              <li>
                Keep a log of what you tagged. The saved list adds date, owner and rules version for
                this.
              </li>
            </ol>
            <div className="mb-10">
              <UtmTemplateButton />
            </div>
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

        <p className="text-ds-muted mx-auto max-w-3xl px-6 pb-8 text-center text-sm">
          More:{' '}
          <Link
            href="/blog/utm-naming-convention-for-teams"
            className="text-ds-accent-strong underline"
          >
            a naming convention for teams
          </Link>{' '}
          and{' '}
          <Link
            href="/blog/ga4-campaign-names-split-by-capital-letters"
            className="text-ds-accent-strong underline"
          >
            fixing campaign names split by capital letters
          </Link>
          .
        </p>

        <FaqSection
          items={FAQ}
          title="UTM builder questions"
          intro="Privacy, GA4 channels, team rules and QR codes."
          ask={false}
        />

        <p className="text-ds-muted border-ds-border border-t px-6 py-8 text-center font-mono text-xs">
          Sample tool by Adesh Shukla — fully client-side, nothing you enter here is sent anywhere.
        </p>
      </main>
    </>
  )
}
