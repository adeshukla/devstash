import { H1_HEADLINE } from '@/lib/utils/typography'
import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { LabToolSchema } from '@/components/lab/LabToolSchema'
import { QrGenerator } from '@/components/lab/QrGenerator'
import { FaqSection } from '@/components/sections/FaqSection'

export const metadata: Metadata = buildMetadata({
  title: 'Free QR Code Generator: WhatsApp, Wi-Fi, Contact',
  description:
    'Free QR codes that never expire: website, WhatsApp chat, Wi-Fi, contact card, email, phone or text. Save as PNG or SVG, or print. No signup; runs in your browser.',
  canonical: '/lab/qr-code-generator',
})

const FAQ = [
  {
    question: 'Do these QR codes expire?',
    answer:
      'No. They are static: what you type is stored inside the pattern itself, so there is no redirect service and no subscription. The trade-off is that a printed code cannot be pointed somewhere else later.',
  },
  {
    question: 'Is what I type sent anywhere?',
    answer:
      'No. The code is made in your browser. Nothing is uploaded or stored on a server, including Wi-Fi passwords and contact details.',
  },
  {
    question: 'How do I get a WhatsApp number right?',
    answer:
      'Enter the full number with the country code first and no leading 0, for example 91 98765 43210 for India. The code opens a chat with that number, with your message ready to send.',
  },
  {
    question: 'Is a Wi-Fi QR code safe to print?',
    answer:
      'Anyone who scans it can read the password, so print it only where guests should have access. Changing the password later means printing a new code.',
  },
  {
    question: 'Which file should I download?',
    answer:
      'PNG for documents and screens, at the width you pick. SVG for print shops and signs, because it stays sharp at any size. Use the print button for a quick paper copy.',
  },
  {
    question: 'Will my code scan?',
    answer:
      'Keep a dark code on a light background, leave the blank border around it, and print it at least 2 cm wide. The tool warns when your colours risk an unreadable code.',
  },
]

export default function QrCodeGeneratorPage() {
  return (
    <>
      <LabToolSchema slug="qr-code-generator" path="/lab/qr-code-generator" />

      <main className="bg-ds-bg min-h-screen">
        <section className="border-ds-border border-b px-6 py-8 sm:py-12">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-ds-accent mb-4 font-mono text-sm">QR CODE GENERATOR</p>
            <h1 className={`${H1_HEADLINE}`}>QR codes that never expire.</h1>
            <p className="text-ds-muted mt-4 text-lg leading-relaxed">
              Make a code for a website, a WhatsApp chat, Wi-Fi, a contact card, an email, a phone
              number or text. Save it as PNG or SVG, or print it. Free, no signup, and nothing
              leaves your browser.
            </p>
          </div>
        </section>

        <section className="px-6 py-8 sm:py-12">
          <div className="border-ds-border bg-ds-surface mx-auto max-w-5xl rounded-2xl border p-5 sm:p-8">
            <QrGenerator />
          </div>
        </section>

        <FaqSection
          items={FAQ}
          title="QR code questions"
          intro="Expiry, privacy, WhatsApp numbers and printing."
          ask={false}
        />

        <p className="text-ds-muted border-ds-border border-t px-6 py-8 text-center font-mono text-xs">
          Sample tool by Adesh Shukla — fully client-side, nothing you enter here is sent anywhere.
        </p>
      </main>
    </>
  )
}
