import { H1_HEADLINE } from '@/lib/utils/typography'
import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { LabToolSchema } from '@/components/lab/LabToolSchema'
import { Ga4EventBuilder } from '@/components/lab/Ga4EventBuilder'
import { FaqSection } from '@/components/sections/FaqSection'

export const metadata: Metadata = buildMetadata({
  title: 'GA4 Event Builder: dataLayer and gtag Code',
  description:
    'Build a GA4 custom event, check its name and parameters against Google’s limits, and copy the dataLayer push for Tag Manager or the gtag.js call. Free.',
  canonical: '/lab/ga4-event-builder',
})

const FAQ = [
  {
    question: 'What makes GA4 drop an event?',
    answer:
      'GA4 does not log events, parameters or user properties that go over its limits. An event name must start with a letter, use only letters, numbers and underscores, and be at most 40 characters. A name on Google’s reserved list, such as page_view, scroll or click, cannot be used for your own event. The builder checks all of this as you type.',
  },
  {
    question: 'Are event names case sensitive?',
    answer:
      'Yes. Google’s documentation says my_event and My_Event are two different events, and the usual advice is lowercase with underscores so everyone on the team spells it the same way.',
  },
  {
    question: 'How many parameters can an event have?',
    answer:
      'Up to 25. A parameter name can be at most 40 characters and a value at most 100, apart from a few that get more room: page_title 300, page_referrer 420 and page_location 1,000. Names cannot start with an underscore, firebase_, ga_, google_ or gtag.',
  },
  {
    question: 'Tag Manager dataLayer or gtag.js?',
    answer:
      'Use the dataLayer push if you run Google Tag Manager: the push only announces the event, and a Custom Event trigger and a GA4 event tag, with each parameter read from a Data Layer Variable, send it to GA4. Use the gtag.js call if you load the Google tag directly. Google does not process events that run above the Google tag snippet.',
  },
  {
    question: 'Why can I not see my parameter in reports?',
    answer:
      'A custom parameter is collected but only shows up in standard reports and explorations after you register it as a custom dimension (or metric) in Admin. Recommended events such as purchase use parameters Google already knows.',
  },
  {
    question: 'Can I send an email address or phone number?',
    answer:
      'No. Google’s policy says you must not pass data it could recognise as personally identifiable, such as email addresses, personal mobile numbers or social security numbers. The builder flags values that look like an email address and warns about long digit strings.',
  },
]

export default function Ga4EventBuilderPage() {
  return (
    <>
      <LabToolSchema slug="ga4-event-builder" path="/lab/ga4-event-builder" />

      <main className="bg-ds-bg min-h-screen">
        <section className="border-ds-border border-b px-6 py-8 sm:py-12">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-ds-accent mb-4 font-mono text-sm">GA4 EVENT BUILDER</p>
            <h1 className={`${H1_HEADLINE}`}>Build a GA4 event and check it before it ships.</h1>
            <p className="text-ds-muted mt-4 text-lg leading-relaxed">
              Name the event, add its parameters, and get the Tag Manager dataLayer push or the
              gtag.js call. Google&apos;s naming rules, size limits and personal-data policy are
              checked as you type, so GA4 does not silently drop it. Free, and nothing leaves your
              browser.
            </p>
          </div>
        </section>

        <section className="px-6 py-8 sm:py-12">
          <div className="border-ds-border bg-ds-surface mx-auto max-w-5xl rounded-2xl border p-5 sm:p-8">
            <Ga4EventBuilder />
          </div>
        </section>

        <FaqSection
          items={FAQ}
          title="GA4 event questions"
          intro="What GA4 accepts, how to send it, and why it may not show up."
          ask={false}
        />

        <p className="text-ds-muted border-ds-border border-t px-6 py-8 text-center font-mono text-xs">
          Free tool by Adesh Shukla — fully client-side, nothing you enter here is sent anywhere.
          Rules from Google&apos;s documentation, which changes; check it for anything critical.
        </p>
      </main>
    </>
  )
}
