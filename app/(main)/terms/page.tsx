import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { buildOgImageUrl } from '@/lib/seo/ogImage'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildWebSiteSchema } from '@/lib/schema/builders'
import { siteConfig } from '@/content/metadata/site.config'

const title = 'Terms of Service — Using the DevStash Website'
const description =
  'The terms and conditions for using devstash.me — acceptable use, intellectual property, disclaimers, liability limits, external links, and governing law.'

export const metadata: Metadata = buildMetadata({
  title,
  description,
  canonical: '/terms',
  ogImage: buildOgImageUrl({ title, description, type: 'website' }),
})

// TODO: Review before launch. Update LAST_UPDATED.
const LAST_UPDATED = '2025-06-01'

export default function TermsPage() {
  return (
    <>
      <JsonLd data={buildWebSiteSchema()} />

      <main>
        <section className="border-ds-border border-b py-16">
          <div className="mx-auto max-w-3xl px-6">
            <p className="text-ds-accent font-mono text-sm">Legal</p>
            <h1 className="text-ds-text mt-2 text-4xl font-bold">Terms of Service</h1>
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
            <div className="text-ds-muted flex flex-col gap-10 text-sm leading-relaxed">
              <TermsSection title="1. Acceptance of Terms">
                <p>
                  By accessing devstash.me (&ldquo;the Site&rdquo;), you agree to be bound by these
                  Terms of Service. If you do not agree, please do not use the Site.
                </p>
              </TermsSection>

              <TermsSection title="2. Use of the Site">
                <p>
                  The Site is provided for informational and portfolio purposes. You agree not to:
                </p>
                <ul>
                  <li>Use the Site for unlawful purposes.</li>
                  <li>Attempt to gain unauthorised access to any part of the Site.</li>
                  <li>Copy, reproduce, or redistribute content without permission.</li>
                  <li>
                    Use automated tools to scrape or index the Site beyond standard search engine
                    crawling.
                  </li>
                </ul>
              </TermsSection>

              <TermsSection title="3. Intellectual Property">
                <p>
                  All content on the Site — including text, code snippets, design, and graphics — is
                  owned by Adesh Shukla unless otherwise stated. Open source code on{' '}
                  <a
                    href={siteConfig.author.github}
                    className="text-ds-accent underline-offset-4 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub
                  </a>{' '}
                  is governed by the licence in each repository.
                </p>
              </TermsSection>

              <TermsSection title="4. Disclaimer of Warranties">
                <p>
                  The Site is provided &ldquo;as is&rdquo; without any warranty of any kind. We make
                  no guarantees regarding availability, accuracy, or fitness for a particular
                  purpose. Use the Site at your own risk.
                </p>
              </TermsSection>

              <TermsSection title="5. Limitation of Liability">
                <p>
                  To the fullest extent permitted by law, DevStash shall not be liable for any
                  indirect, incidental, or consequential damages arising from your use of the Site.
                </p>
              </TermsSection>

              <TermsSection title="6. External Links">
                <p>
                  The Site may link to third-party websites. We are not responsible for the content,
                  privacy practices, or reliability of those sites.
                </p>
              </TermsSection>

              <TermsSection title="7. Changes to Terms">
                <p>
                  We may update these Terms at any time. The &ldquo;Last updated&rdquo; date above
                  reflects the most recent revision. Continued use of the Site after changes
                  constitutes acceptance.
                </p>
              </TermsSection>

              <TermsSection title="8. Governing Law">
                <p>
                  {/* TODO: Confirm jurisdiction */}
                  These Terms are governed by the laws of India. Any disputes shall be subject to
                  the jurisdiction of courts in Ghaziabad, Uttar Pradesh.
                </p>
              </TermsSection>

              <TermsSection title="9. Contact">
                <p>
                  Questions? Email us at{' '}
                  <a
                    href="mailto:hello@devstash.me"
                    className="text-ds-accent underline-offset-4 hover:underline"
                  >
                    hello@devstash.me
                  </a>
                  .
                </p>
              </TermsSection>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

function TermsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-ds-text text-lg font-semibold">{title}</h2>
      <div className="[&_ul>li]:before:bg-ds-accent flex flex-col gap-3 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-4 [&_ul>li]:relative [&_ul>li]:before:absolute [&_ul>li]:before:top-[0.6em] [&_ul>li]:before:-left-3 [&_ul>li]:before:h-1 [&_ul>li]:before:w-1 [&_ul>li]:before:rounded-full">
        {children}
      </div>
    </div>
  )
}
