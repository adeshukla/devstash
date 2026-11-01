import { H1_HEADLINE } from '@/lib/utils/typography'
import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { LabToolSchema } from '@/components/lab/LabToolSchema'
import { UtmToolkitNav } from '@/components/lab/UtmToolkitNav'
import { ReportCleaner } from '@/components/lab/ReportCleaner'
import { FaqSection } from '@/components/sections/FaqSection'

export const metadata: Metadata = buildMetadata({
  title: 'GA4 Report Cleaner: Merge Split UTM Rows',
  description:
    'Paste a GA4 or Looker Studio export and merge rows that are the same campaign written differently. Get merged totals, a mapping list and a Looker Studio field. Free.',
  canonical: '/lab/utm-report-cleaner',
})

const FAQ = [
  {
    question: 'Why is one campaign split across several rows?',
    answer:
      'GA4 treats Spring_Sale, spring-sale and SPRING-SALE as three different values, so one campaign shows up as three rows and each looks smaller than the whole. The cleaner finds rows that match once capitals, spaces and separators are ignored.',
  },
  {
    question: 'Does it change my data in GA4?',
    answer:
      'No. GA4 keeps the values it received. The tool cleans your copy of the report and gives you the mapping, so your sheet or Looker Studio report can show merged rows. Fixing the cause means tagging links consistently.',
  },
  {
    question: 'What does it add up?',
    answer:
      'Columns that can be added: sessions, users, events, conversions, key events, views, clicks, impressions, cost, revenue, purchases, transactions and orders. Rates and averages, such as engagement rate, cannot be added, so they are listed as left out.',
  },
  {
    question: 'How do I use the Looker Studio field?',
    answer:
      'Copy it, add a calculated field in your Looker Studio data source, paste the formula, and use that field instead of the original one in your charts. It maps each split spelling to the clean one.',
  },
  {
    question: 'Is my report uploaded anywhere?',
    answer:
      'No. The report is read in your browser and nothing is sent or stored. The example is made-up data.',
  },
  {
    question: 'Will it catch every kind of split?',
    answer:
      'It catches capitals, spaces, hyphens, underscores and dots, and common short source names such as fb, ig and li. Two genuinely different spellings, such as spring-sale and spring-promo, are different values and are left alone.',
  },
]

export default function UtmReportCleanerPage() {
  return (
    <>
      <LabToolSchema slug="utm-report-cleaner" path="/lab/utm-report-cleaner" />

      <main className="bg-ds-bg min-h-screen">
        <UtmToolkitNav current="clean" />
        <section className="border-ds-border border-b px-6 py-8 sm:py-12">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-ds-accent mb-4 font-mono text-sm">REPORT CLEANER</p>
            <h1 className={`${H1_HEADLINE}`}>One campaign, three rows?</h1>
            <p className="text-ds-muted mt-4 text-lg leading-relaxed">
              Paste an export from GA4 or Looker Studio. Rows that are the same campaign written
              differently are merged, with totals and a list you can paste back into your sheet.
              Free, and nothing leaves your browser.
            </p>
          </div>
        </section>

        <section className="px-6 py-8 sm:py-12">
          <div className="border-ds-border bg-ds-surface mx-auto max-w-3xl rounded-2xl border p-5 sm:p-8">
            <ReportCleaner />
          </div>
        </section>

        <FaqSection
          items={FAQ}
          title="Report cleaner questions"
          intro="Why rows split, what is merged, and what stays the same in GA4."
          ask={false}
        />

        <p className="text-ds-muted border-ds-border border-t px-6 py-8 text-center font-mono text-xs">
          Sample tool by Adesh Shukla — fully client-side, nothing you enter here is sent anywhere.
        </p>
      </main>
    </>
  )
}
