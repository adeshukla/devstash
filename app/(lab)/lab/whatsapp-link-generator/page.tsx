import { H1_HEADLINE } from '@/lib/utils/typography'
import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { LabToolSchema } from '@/components/lab/LabToolSchema'
import { WhatsAppLink } from '@/components/lab/WhatsAppLink'
import { FaqSection } from '@/components/sections/FaqSection'

export const metadata: Metadata = buildMetadata({
  title: 'WhatsApp Link Generator: Chat Link and QR Code',
  description:
    'Make a WhatsApp click-to-chat link with a message already typed, a campaign code and a QR code. Pick a country, no signup, runs in your browser.',
  canonical: '/lab/whatsapp-link-generator',
})

const FAQ = [
  {
    question: 'What is a WhatsApp click-to-chat link?',
    answer:
      'A link that starts with wa.me followed by a phone number, and optionally a message. Anyone who taps it opens a WhatsApp chat with that number, with your message already typed. They still have to press send.',
  },
  {
    question: 'Do I need to type the country code?',
    answer:
      'Pick the country and type the number as people dial it locally. The tool adds the country code, removes a leading 0, and does not add the code twice if you typed it. You can also paste a full number that starts with +. The link shows the number it will open, so check it before you share it.',
  },
  {
    question: 'Can I see which ad or poster a chat came from?',
    answer:
      'Not with UTM tags. A wa.me link opens WhatsApp, not your website, so there is no page to carry them. The campaign code is added to the message instead, for example [ref: diwali-poster]. The sender can edit the message before sending, so treat it as a strong hint, not exact counting.',
  },
  {
    question: 'Is the message sent automatically?',
    answer:
      'No. WhatsApp opens the chat with your text in the box and the person presses send. The message can be up to 1000 characters in this tool.',
  },
  {
    question: 'Does the QR code expire?',
    answer:
      'No. It holds the link itself, with no redirect service in between, so a printed code keeps working. You cannot change where it points later, so test it before you print.',
  },
  {
    question: 'Is the number I type sent anywhere?',
    answer:
      'No. The link and the QR code are made in your browser, and nothing is uploaded or stored.',
  },
]

export default function WhatsAppLinkGeneratorPage() {
  return (
    <>
      <LabToolSchema slug="whatsapp-link-generator" path="/lab/whatsapp-link-generator" />

      <main className="bg-ds-bg min-h-screen">
        <section className="border-ds-border border-b px-6 py-8 sm:py-12">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-ds-accent mb-4 font-mono text-sm">WHATSAPP LINK GENERATOR</p>
            <h1 className={`${H1_HEADLINE}`}>A WhatsApp link that opens the right chat.</h1>
            <p className="text-ds-muted mt-4 text-lg leading-relaxed">
              Pick a country, add the number and a message, and get a click-to-chat link, a QR code
              to print and a snippet for your website. Add a campaign code to see which poster or ad
              each chat came from. Free, no signup, and nothing leaves your browser.
            </p>
          </div>
        </section>

        <section className="px-6 py-8 sm:py-12">
          <div className="border-ds-border bg-ds-surface mx-auto max-w-5xl rounded-2xl border p-5 sm:p-8">
            <WhatsAppLink />
          </div>
        </section>

        <FaqSection
          items={FAQ}
          title="WhatsApp link questions"
          intro="What the link does, what it cannot track, and what stays on your device."
          ask={false}
        />

        <p className="text-ds-muted border-ds-border border-t px-6 py-8 text-center font-mono text-xs">
          Free tool by Adesh Shukla — fully client-side, nothing you enter here is sent anywhere.
        </p>
      </main>
    </>
  )
}
