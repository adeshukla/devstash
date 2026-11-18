import { H1_DISPLAY } from '@/lib/utils/typography'
import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { buildOgImageUrl } from '@/lib/seo/ogImage'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildWebSiteSchema } from '@/lib/schema/builders'
import { CookieSettingsButton } from '@/components/layout/ConsentBanner'

const title = 'Privacy Policy — How DevStash Handles Your Data'
const description =
  'What DevStash (devstash.me) collects, why, who processes it, how long it is kept, and how to use your rights under GDPR, India’s DPDP Act and CCPA.'

export const metadata: Metadata = buildMetadata({
  title,
  description,
  canonical: '/privacy',
  ogImage: buildOgImageUrl({ title, description, type: 'website' }),
})

const LAST_UPDATED = '2026-11-18'

const strong = 'text-ds-text'
const link = 'text-ds-accent underline underline-offset-4'

export default function PrivacyPage() {
  return (
    <>
      <JsonLd data={buildWebSiteSchema()} />

      <div>
        <section className="border-ds-border border-b py-16">
          <div className="mx-auto max-w-3xl px-6">
            <p className="text-ds-accent font-mono text-sm">Legal</p>
            <h1 className={`${H1_DISPLAY} mt-2`}>Privacy Policy</h1>
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
              <PolicySection title="1. Who is responsible">
                <p>
                  devstash.me is run by Adesh Shukla in Ghaziabad, India. For the laws that use
                  these terms, he is the &ldquo;data controller&rdquo; (GDPR) and the &ldquo;data
                  fiduciary&rdquo; (India&apos;s Digital Personal Data Protection Act, 2023). This
                  policy applies to every visitor, wherever you are. Contact:{' '}
                  <a href="mailto:hello@devstash.me" className={link}>
                    hello@devstash.me
                  </a>
                  .
                </p>
              </PolicySection>

              <PolicySection title="2. What we collect and why">
                <ul>
                  <li>
                    <strong className={strong}>Contact form</strong> — your name, email, the topic
                    you pick, your phone number if you give one, and your message. The form also
                    sends the first page you opened in that visit and where you came from (referring
                    site or campaign tags), so the owner can see what brought you here. Used to
                    reply to you. Basis: you asked us to get in touch (GDPR legitimate interest and
                    contract steps; DPDP consent given by submitting the form).
                  </li>
                  <li>
                    <strong className={strong}>Analytics — only if you accept.</strong> Google
                    Analytics 4 (page views, referral source, device) and Microsoft Clarity
                    (heatmaps and session recordings of how a page is used). Both set cookies.
                    Basis: your consent. If you reject, neither loads.
                  </li>
                  <li>
                    <strong className={strong}>Interaction log — only if you accept.</strong> When
                    you view or download the résumé, submit the contact form, click an outbound
                    link, run the AI demo or play the intro video, we record the page, the referring
                    page, your browser&apos;s timezone, your device and browser type, and the IP
                    address of the request, which is used only to work out an approximate,
                    city-level location. It is written to our hosting provider&apos;s server logs.
                    Some of these also send an email to the site owner with the same details. It
                    contains no name or email address unless you entered one in the contact form.
                    Basis: your consent.
                  </li>
                  <li>
                    <strong className={strong}>Changeable QR Code accounts</strong> — your email
                    address (typed in, or given to us by Google if you use Google sign-in), a
                    password (stored only as a one-way hash, never in readable form), the name you
                    pick and the web address your code opens. We send confirmation and reset emails.
                    We do not track who scans your code. Basis: it is needed to give you the service
                    you signed up for.
                  </li>
                  <li>
                    <strong className={strong}>Lab tools</strong> — the tools run in your browser.
                    What you type stays on your device, and saved sessions and drafts are kept in
                    your browser&apos;s storage, not on our servers. Three things do reach a server:
                    the AI content pipeline sends your topic and notes to our AI providers (Groq,
                    and Cerebras if Groq is unavailable) to write the draft; the OG image
                    maker&apos;s &ldquo;style from a web address&rdquo; fetches the address you
                    enter; and the Changeable QR Code, described above.
                  </li>
                  <li>
                    <strong className={strong}>Security and abuse protection</strong> — our host and
                    app keep short-lived counters tied to your IP address (up to an hour) to limit
                    abuse, and the host keeps standard server logs. Basis: legitimate interest in
                    keeping the site working and safe.
                  </li>
                </ul>
                <p>
                  We do <strong className={strong}>not</strong> collect payment details or sensitive
                  categories of personal data, and the site does not use advertising or cross-site
                  tracking.
                </p>
              </PolicySection>

              <PolicySection title="3. Who processes your data">
                <p>
                  These providers handle data for us. They may process it outside your country,
                  including in the USA, under their own transfer terms.
                </p>
                <ul>
                  <li>
                    <strong className={strong}>Vercel</strong> — hosting, server logs and
                    performance monitoring.
                  </li>
                  <li>
                    <strong className={strong}>Google</strong> — Analytics 4 (only if you accept)
                    and sign-in with Google for the Changeable QR Code.
                  </li>
                  <li>
                    <strong className={strong}>Microsoft</strong> — Clarity (only if you accept).
                  </li>
                  <li>
                    <strong className={strong}>Resend</strong> — contact form, notification and
                    account emails.
                  </li>
                  <li>
                    <strong className={strong}>Upstash</strong> — the database for Changeable QR
                    Code accounts.
                  </li>
                  <li>
                    <strong className={strong}>Groq and Cerebras</strong> — the AI content pipeline
                    text generation.
                  </li>
                  <li>
                    <strong className={strong}>Cloudflare</strong> — DNS only.
                  </li>
                </ul>
                <p>
                  We do not sell your personal information, and we do not share it for advertising
                  or cross-context behavioural advertising.
                </p>
              </PolicySection>

              <PolicySection title="4. Cookies and browser storage">
                <ul>
                  <li>
                    <strong className={strong}>Essential:</strong> your analytics choice and theme
                    (stored in your browser), a tab-only note of the first page you opened (used
                    only to fill in the contact form), your saved Lab sessions and drafts, and the
                    sign-in cookie for the Changeable QR Code (30 days).
                  </li>
                  <li>
                    <strong className={strong}>Analytics, only after you accept:</strong> Google
                    Analytics cookies (starting <code>_ga</code>) and Clarity cookies (
                    <code>_clck</code>, <code>_clsk</code>).
                  </li>
                </ul>
                <p>
                  You can change your choice at any time: <CookieSettingsButton className={link} />.
                  Choosing Reject removes the analytics cookies and stops the scripts.
                </p>
              </PolicySection>

              <PolicySection title="5. How long we keep it">
                <ul>
                  <li>
                    Contact messages: as long as needed to answer you, then deleted on request.
                  </li>
                  <li>
                    Google Analytics: Google&apos;s default retention setting (14 months). Clarity:
                    under Microsoft&apos;s retention settings.
                  </li>
                  <li>Server logs and the interaction log: under Vercel&apos;s log retention.</li>
                  <li>
                    Changeable QR Code account: until you delete it with the &ldquo;Delete my
                    account&rdquo; button in the tool. That removes your email link and password
                    hash and ends every sign-in. The chosen name stays reserved, without any
                    personal data, so nobody else can take over a code you have printed.
                  </li>
                </ul>
              </PolicySection>

              <PolicySection title="6. Your rights">
                <p>
                  <strong className={strong}>Everyone:</strong> you can ask to see, correct or
                  delete what we hold about you, and to withdraw consent at any time (footer
                  &ldquo;Cookie settings&rdquo;). Email{' '}
                  <a href="mailto:hello@devstash.me" className={link}>
                    hello@devstash.me
                  </a>
                  ; I aim to answer within one month.
                </p>
                <ul>
                  <li>
                    <strong className={strong}>EU and UK (GDPR):</strong> you may also ask us to
                    restrict or stop processing, to receive your data in a portable format, and you
                    may complain to your local data protection authority.
                  </li>
                  <li>
                    <strong className={strong}>India (DPDP Act):</strong> you may ask for a summary
                    of your data, ask for correction or erasure, name someone to act for you if you
                    die or cannot act, and use the grievance contact below. If we do not resolve it,
                    you may complain to the Data Protection Board of India.
                  </li>
                  <li>
                    <strong className={strong}>California (CCPA/CPRA):</strong> you may ask to know,
                    delete or correct your information. We do not sell or share it, so there is
                    nothing to opt out of, and we do not treat you differently for asking.
                  </li>
                </ul>
              </PolicySection>

              <PolicySection title="7. Children">
                <p>
                  The site is not meant for people under 18, and we do not knowingly collect their
                  data. If you think a child has sent us data, write to us and we will delete it.
                </p>
              </PolicySection>

              <PolicySection title="8. Security">
                <p>
                  The site is served over HTTPS, account passwords are stored as one-way hashes, and
                  access to the data above is limited to the owner and the providers listed. No
                  system is perfectly secure, so we cannot promise absolute safety.
                </p>
              </PolicySection>

              <PolicySection title="9. Grievances and contact">
                <p>
                  Grievance contact (DPDP Act) and general privacy questions: Adesh Shukla,{' '}
                  <a href="mailto:hello@devstash.me" className={link}>
                    hello@devstash.me
                  </a>
                  .
                </p>
              </PolicySection>

              <PolicySection title="10. Changes to this policy">
                <p>
                  We may update this policy. The &ldquo;Last updated&rdquo; date above shows the
                  latest revision, and we will ask for your analytics choice again if we start using
                  your data in a new way.
                </p>
              </PolicySection>
            </div>
          </div>
        </section>
      </div>
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
