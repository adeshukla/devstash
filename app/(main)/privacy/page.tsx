import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { buildOgImageUrl } from '@/lib/seo/ogImage'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildWebSiteSchema } from '@/lib/schema/builders'

const title = 'Privacy Policy — How DevStash Handles Your Data'
const description =
  'How DevStash (devstash.me) collects, uses, and protects your personal information, including contact form submissions, analytics data, and cookie usage.'

export const metadata: Metadata = buildMetadata({
  title,
  description,
  canonical: '/privacy',
  ogImage: buildOgImageUrl({ title, description, type: 'website' }),
})

// TODO: Review before launch. Update LAST_UPDATED.
const LAST_UPDATED = '2025-06-01'

export default function PrivacyPage() {
  return (
    <>
      <JsonLd data={buildWebSiteSchema()} />

      <main>
        <section className="border-ds-border border-b py-16">
          <div className="mx-auto max-w-3xl px-6">
            <p className="text-ds-accent font-mono text-sm">Legal</p>
            <h1 className="text-ds-text mt-2 text-4xl font-bold">Privacy Policy</h1>
            <p className="text-ds-muted mt-3 font-mono text-sm">
              Last updated:{' '}
              <time dateTime={LAST_UPDATED}>
                {new Date(LAST_UPDATED).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-3xl px-6">
            <div className="text-ds-muted flex flex-col gap-10">
              <PolicySection title="1. Overview">
                <p>
                  DevStash (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates
                  devstash.me. This Privacy Policy explains how we collect, use, and protect your
                  personal information when you visit our website.
                </p>
              </PolicySection>

              <PolicySection title="2. Information We Collect">
                <ul>
                  <li>
                    <strong className="text-ds-text">Contact form submissions</strong> — name, email
                    address, and message content when you use our contact form.
                  </li>
                  <li>
                    <strong className="text-ds-text">Analytics data</strong> — page views, referral
                    sources, and device information via Google Analytics 4 (anonymised IP). No
                    cross-site tracking.
                  </li>
                  <li>
                    <strong className="text-ds-text">Email newsletter</strong> — email address only,
                    via Formspree, if you subscribed during our coming-soon period.
                  </li>
                </ul>
                <p>
                  We do <strong className="text-ds-text">not</strong> collect payment information,
                  passwords, or sensitive personal data.
                </p>
              </PolicySection>

              <PolicySection title="3. How We Use Your Information">
                <ul>
                  <li>To respond to your contact form inquiries.</li>
                  <li>To understand how visitors use our website (analytics).</li>
                  <li>
                    To send occasional email updates if you opted in (you can unsubscribe any time).
                  </li>
                </ul>
                <p>We do not sell, rent, or share your data with third parties for marketing.</p>
              </PolicySection>

              <PolicySection title="4. Third-Party Services">
                <p>We use the following services that may process your data:</p>
                <ul>
                  <li>
                    <strong className="text-ds-text">Vercel</strong> — hosting and deployment
                    (servers in the USA/EU).
                  </li>
                  <li>
                    <strong className="text-ds-text">Google Analytics 4</strong> — anonymised
                    analytics.
                  </li>
                  <li>
                    <strong className="text-ds-text">Resend</strong> — contact form email delivery.
                  </li>
                  <li>
                    <strong className="text-ds-text">Cloudflare</strong> — DNS management.
                  </li>
                </ul>
              </PolicySection>

              <PolicySection title="5. Cookies">
                <p>
                  We use only essential cookies and Google Analytics cookies (anonymised). No
                  advertising cookies. You can disable cookies in your browser settings.
                </p>
              </PolicySection>

              <PolicySection title="6. Data Retention">
                <p>
                  Contact form messages are retained only as long as necessary to respond to your
                  inquiry. Analytics data is retained per Google&apos;s default retention settings
                  (14 months).
                </p>
              </PolicySection>

              <PolicySection title="7. Your Rights">
                <p>
                  You have the right to access, correct, or delete your personal data. To exercise
                  these rights, contact us at{' '}
                  <a
                    href="mailto:hello@devstash.me"
                    className="text-ds-accent underline-offset-4 hover:underline"
                  >
                    hello@devstash.me
                  </a>
                  .
                </p>
              </PolicySection>

              <PolicySection title="8. Changes to This Policy">
                <p>
                  We may update this policy periodically. The &ldquo;Last updated&rdquo; date above
                  reflects the most recent revision. Continued use of the site constitutes
                  acceptance of any changes.
                </p>
              </PolicySection>

              <PolicySection title="9. Contact">
                <p>
                  Questions about this policy? Email{' '}
                  <a
                    href="mailto:hello@devstash.me"
                    className="text-ds-accent underline-offset-4 hover:underline"
                  >
                    hello@devstash.me
                  </a>
                  .
                </p>
              </PolicySection>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-ds-text text-lg font-semibold">{title}</h2>
      <div className="[&_ul>li]:before:bg-ds-accent flex flex-col gap-3 text-sm leading-relaxed [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-4 [&_ul>li]:relative [&_ul>li]:before:absolute [&_ul>li]:before:top-[0.6em] [&_ul>li]:before:-left-3 [&_ul>li]:before:h-1 [&_ul>li]:before:w-1 [&_ul>li]:before:rounded-full">
        {children}
      </div>
    </div>
  )
}
