import type { Metadata } from 'next'
import Script from 'next/script'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { buildOgImageUrl } from '@/lib/seo/ogImage'
import { siteConfig } from '@/content/metadata/site.config'
import { Breadcrumb } from '@/components/layout'
import { ContactForm } from '@/components/contact/ContactForm'
import { Reveal, Card, Separator } from '@/components/ui'
import { Icon } from '@/components/icons/Icon'
import type { IconName } from '@/components/icons/Icon'

// reCAPTCHA v3 site key is public by design (it's meant to be embedded in
// client JS) — only renders once a real key is set, so the form works
// exactly as before until then. afterInteractive (not lazyOnload) because
// the token needs to be ready by the time someone submits, not just
// eventually — unlike GA/Clarity this isn't fire-and-forget instrumentation.
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

const title = 'Contact Adesh Shukla — Frontend Developer'
const description =
  'Get in touch with Adesh Shukla about frontend roles, freelance projects, or collaboration. Based in Ghaziabad and open to Noida / Gurugram and remote/hybrid.'

export const metadata: Metadata = buildMetadata({
  title,
  description,
  canonical: '/contact',
  ogImage: buildOgImageUrl({ title, description, type: 'website' }),
})

// ─── Social links (single source: content/metadata/site.config.ts) ─────────────

const SOCIAL_LINKS: { label: string; href: string; handle: string; icon: IconName }[] = [
  {
    label: 'GitHub',
    href: siteConfig.author.github,
    handle: '@adeshukla',
    icon: 'github',
  },
  {
    label: 'LinkedIn',
    href: siteConfig.author.linkedin,
    handle: 'Adesh Shukla',
    icon: 'linkedin',
  },
  {
    label: 'Twitter / X',
    href: siteConfig.author.x,
    handle: '@adeshukla',
    icon: 'x',
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContactPage() {
  return (
    <main>
      {RECAPTCHA_SITE_KEY ? (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`}
          strategy="afterInteractive"
        />
      ) : null}

      {/* ── Header ── */}
      {/* Breadcrumb handles its own buildBreadcrumbSchema JsonLd internally */}
      <section className="border-ds-border border-b py-16">
        <div className="mx-auto max-w-5xl px-6">
          <Breadcrumb
            items={[
              { name: 'Home', url: 'https://devstash.me' },
              { name: 'Contact', url: 'https://devstash.me/contact' },
            ]}
          />
          <h1 className="text-ds-text mt-6 text-4xl font-bold">Get in touch</h1>
          <p className="text-ds-muted mt-3 max-w-lg">
            Open to frontend roles in Noida / Gurugram, freelance projects, or just a chat about
            code, automation, or bikes.
          </p>
        </div>
      </section>

      {/* ── Two-column layout ── */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-3">
            {/* Left — meta info */}
            <Reveal as="aside" className="lg:col-span-1">
              <Card padding="lg" className="flex flex-col gap-8">
                {/* Response time */}
                <div>
                  <h2 className="text-ds-accent mb-2 font-mono text-sm font-medium">
                    Response time
                  </h2>
                  <p className="text-ds-muted text-sm">
                    I aim to reply within 48 hours. For urgent inquiries, DM me on LinkedIn.
                  </p>
                </div>

                {/* Location */}
                <div>
                  <h2 className="text-ds-accent mb-2 font-mono text-sm font-medium">Location</h2>
                  <p className="text-ds-muted text-sm">
                    Ghaziabad, UP — open to Noida / Gurugram roles and remote/hybrid.
                  </p>
                </div>

                {/* Availability */}
                <div>
                  <h2 className="text-ds-accent mb-2 font-mono text-sm font-medium">
                    Availability
                  </h2>
                  <p className="text-ds-muted text-sm">
                    Immediate to ~20 days notice. Open to contract and full-time.
                  </p>
                </div>

                <Separator />

                {/* Social links */}
                <div>
                  <h2 className="text-ds-accent mb-4 font-mono text-sm font-medium">Elsewhere</h2>
                  <ul className="flex flex-col gap-3">
                    {SOCIAL_LINKS.map((link) => (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group text-ds-muted hover:text-ds-text flex items-center gap-3 text-sm transition-colors"
                        >
                          <span
                            className="border-ds-border bg-ds-surface2 text-ds-muted group-hover:border-ds-accent group-hover:text-ds-accent flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_8px_18px_-8px_color-mix(in_srgb,var(--color-ds-accent)_45%,transparent)]"
                            aria-hidden="true"
                          >
                            <Icon name={link.icon} className="h-4 w-4" />
                          </span>
                          <span className="flex flex-col">
                            <span className="text-ds-text font-medium">{link.label}</span>
                            <span className="text-ds-muted text-xs">{link.handle}</span>
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            </Reveal>

            {/* Right — form */}
            <Reveal delay={80} className="lg:col-span-2">
              <ContactForm />
            </Reveal>
          </div>
        </div>
      </section>
    </main>
  )
}
