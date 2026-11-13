import { H1_HEADLINE } from '@/lib/utils/typography'
import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { LabToolSchema } from '@/components/lab/LabToolSchema'
import { ChangeableQr } from '@/components/lab/ChangeableQr'
import { FaqSection } from '@/components/sections/FaqSection'

const TITLE = 'Changeable QR Code: Update the Link Later'
const DESC =
  'Print one QR code and change where it leads later. Sign in with your email, claim a permanent address, and point it at any web page. Free, no password.'

export const metadata: Metadata = buildMetadata({
  title: TITLE,
  description: DESC,
  canonical: '/lab/changeable-qr',
})

const FAQ = [
  {
    question: 'How can the link change if the QR code stays the same?',
    answer:
      'The code holds a short address on this site, such as /q/yourname. When someone scans it, this site looks up where that name currently points and sends them there. You change the destination, never the code.',
  },
  {
    question: 'What do you store?',
    answer:
      'Your email address, the name you pick and the destination link. The email is used only to sign you in. Scans are not tracked or counted.',
  },
  {
    question: 'Can I change the name later?',
    answer:
      'No. The name is inside every printed code, so it is permanent. If you stop a code, its name stays reserved and nobody else can take it over.',
  },
  {
    question: 'What can a code point to?',
    answer:
      'Any public web page. Private network addresses, other changeable QR links and non-web addresses are refused. Codes that are used to mislead people will be switched off.',
  },
  {
    question: 'Why not use this for Wi-Fi or contact cards?',
    answer:
      'Those store their data inside the code, so they cannot be redirected. Use the normal QR generator for them; it runs in your browser and stores nothing.',
  },
]

export default function ChangeableQrPage() {
  return (
    <>
      <LabToolSchema
        slug="changeable-qr"
        path="/lab/changeable-qr"
        title={TITLE}
        description={DESC}
      />
      <main className="bg-ds-bg min-h-screen">
        <section className="border-ds-border border-b px-6 py-8 sm:py-12">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-ds-accent mb-4 font-mono text-sm">CHANGEABLE QR CODE</p>
            <h1 className={H1_HEADLINE}>Print once. Change the link later.</h1>
            <p className="text-ds-muted mt-4 text-lg leading-relaxed">
              Your website moved? A campaign page changed? The printed QR code keeps working: you
              just point it at the new page. Free, and you sign in with an email link, no password.
            </p>
          </div>
        </section>
        <section className="px-6 py-8 sm:py-12">
          <div className="border-ds-border bg-ds-surface mx-auto max-w-5xl rounded-2xl border p-5 sm:p-8">
            <ChangeableQr />
          </div>
        </section>
        <FaqSection
          items={FAQ}
          title="Changeable QR questions"
          intro="What is stored, and what is not."
          ask={false}
        />
        <p className="text-ds-muted border-ds-border border-t px-6 py-8 text-center font-mono text-xs">
          Free tool by Adesh Shukla. Need a code that never touches a server? Use the{' '}
          <a className="text-ds-accent underline" href="/lab/qr-code-generator">
            normal QR generator
          </a>
          .
        </p>
      </main>
    </>
  )
}
