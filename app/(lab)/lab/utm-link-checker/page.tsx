import { H1_HEADLINE } from '@/lib/utils/typography'
import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { LabToolSchema } from '@/components/lab/LabToolSchema'
import { UtmToolkitNav } from '@/components/lab/UtmToolkitNav'
import { UtmChecker } from '@/components/lab/UtmChecker'
import { FaqSection } from '@/components/sections/FaqSection'

export const metadata: Metadata = buildMetadata({
  title: 'UTM Link Checker: Find Tagging Mistakes',
  description:
    'Paste tagged links to see each UTM parameter, the GA4 channel it lands in, what is wrong and a cleaned link. Free, runs in your browser, nothing is uploaded.',
  canonical: '/lab/utm-link-checker',
})

const CHANNELS = [
  [
    'Paid Search',
    'A search site as source (google, bing…) and a paid medium: cpc, ppc, paid-search or anything starting with paid.',
  ],
  [
    'Paid Social',
    'A social site as source (facebook, instagram, linkedin…) and a paid medium such as paid-social or cpc.',
  ],
  ['Paid Video', 'A video site as source (youtube…) and a paid medium.'],
  ['Display', 'Medium display, banner, expandable, interstitial or cpm.'],
  ['Paid Other', 'A paid medium with a source GA4 does not recognise.'],
  [
    'Organic Social',
    'A social site as source and medium social, social-network, social-media or sm.',
  ],
  ['Organic Video', 'A video site as source and a medium containing video.'],
  ['Organic Search', 'A search site as source and medium organic.'],
  ['Referral', 'Medium referral, app or link.'],
  ['Email', 'Medium email or e-mail.'],
  ['Affiliates', 'Medium affiliate.'],
  ['Audio', 'Medium audio.'],
  ['SMS', 'Source or medium sms.'],
  ['Mobile Push Notifications', 'Medium ending in push, or containing mobile or notification.'],
  [
    'Unassigned',
    'Everything else. This is where a medium GA4 does not know, such as ppc-ads, ends up.',
  ],
]

const FAQ = [
  {
    question: 'What does the checker look at?',
    answer:
      'Each link is read for the five main UTM parameters. It flags missing source or medium, capital letters and spaces, misspelled names such as UTM_Source, duplicates, parameters placed after a #, and combinations GA4 files under Unassigned. It also builds a cleaned link.',
  },
  {
    question: 'Is it sending my links anywhere?',
    answer: 'No. The check runs in your browser and nothing is uploaded or stored.',
  },
  {
    question: 'Why do capital letters matter?',
    answer:
      'GA4 treats Email and email as two different values, so one campaign can split across several rows in a report. The cleaned link lowercases the values.',
  },
  {
    question: 'Can it test whether a link really works?',
    answer:
      'No. Browsers do not let a web page fetch other sites, so it cannot follow redirects or check that tags survive them. To test, click the live link and look at the address bar on the landing page.',
  },
  {
    question: 'Is the channel table exact?',
    answer:
      'It is a simplified copy of Google’s default channel group, without the Direct, Shopping and Cross-network cases. If your GA4 property has a custom channel group, your reports can differ.',
  },
]

export default function UtmLinkCheckerPage() {
  return (
    <>
      <LabToolSchema slug="utm-link-checker" path="/lab/utm-link-checker" />

      <main className="bg-ds-bg min-h-screen">
        <UtmToolkitNav current="check" />
        <section className="border-ds-border border-b px-6 py-8 sm:py-12">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-ds-accent mb-4 font-mono text-sm">UTM LINK CHECKER</p>
            <h1 className={`${H1_HEADLINE}`}>Is your UTM link tagged right?</h1>
            <p className="text-ds-muted mt-4 text-lg leading-relaxed">
              Paste the links you already use. See what each tag says, which GA4 channel it lands
              in, what is wrong, and a cleaned version to copy. Free, and nothing leaves your
              browser.
            </p>
          </div>
        </section>

        <section className="px-6 py-8 sm:py-12">
          <div className="border-ds-border bg-ds-surface mx-auto max-w-3xl rounded-2xl border p-5 sm:p-8">
            <UtmChecker />
          </div>
        </section>

        <section className="border-ds-border border-t px-6 py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-ds-text mb-2 text-xl font-bold">
              How GA4 sorts traffic into channels
            </h2>
            <p className="text-ds-muted mb-6 leading-relaxed">
              GA4 reads source and medium and drops each visit into the first channel that matches.
              This is a simplified copy of{' '}
              <a
                href="https://support.google.com/analytics/answer/9756891"
                className="text-ds-accent-strong underline"
                rel="noopener noreferrer"
              >
                Google&apos;s default channel group
              </a>
              , without the Direct, Shopping and Cross-network cases.
            </p>
            <div className="border-ds-border overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[16rem] text-left text-sm">
                <caption className="sr-only">GA4 default channels and what they match</caption>
                <thead className="bg-ds-surface2 text-ds-text">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Channel
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      What GA4 looks for
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {CHANNELS.map(([name, rule]) => (
                    <tr key={name} className="border-ds-border border-t">
                      <th scope="row" className="text-ds-text px-4 py-3 align-top font-medium">
                        {name}
                      </th>
                      <td className="text-ds-muted px-4 py-3">{rule}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <p className="text-ds-muted mx-auto max-w-3xl px-6 pb-8 text-center text-sm">
          Want your whole team to tag the same way?{' '}
          <Link
            href="/blog/utm-naming-convention-for-teams"
            className="text-ds-accent-strong underline"
          >
            Read the naming convention guide
          </Link>
          .
        </p>

        <FaqSection
          items={FAQ}
          title="Link checker questions"
          intro="What it checks, what it cannot, and how GA4 sorts traffic."
          ask={false}
        />

        <p className="text-ds-muted border-ds-border border-t px-6 py-8 text-center font-mono text-xs">
          Free tool by Adesh Shukla — fully client-side, nothing you enter here is sent anywhere.
        </p>
      </main>
    </>
  )
}
