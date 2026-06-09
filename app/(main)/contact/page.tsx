import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { Breadcrumb } from '@/components/layout'
import { ContactForm } from '@/components/contact/ContactForm'

export const metadata: Metadata = buildMetadata({
  title: 'Contact — DevStash',
  description:
    'Get in touch with Adesh Shukla. Open to frontend roles, freelance projects, and collaboration. Based in Ghaziabad / Delhi NCR.',
  canonical: 'https://devstash.me/contact',
})

// ─── Social links ─────────────────────────────────────────────────────────────

const SOCIAL_LINKS = [
  {
    label: 'GitHub',
    href: 'https://github.com/adeshukla',
    handle: '@adeshukla',
    icon: '⌥',
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/in/adeshukla', // TODO: Verify URL
    handle: 'Adesh Shukla',
    icon: '⌘',
  },
  {
    label: 'Twitter / X',
    href: 'https://x.com/adeshukla', // TODO: Verify URL or remove
    handle: '@adeshukla',
    icon: '𝕏',
  },
] as const

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContactPage() {
  return (
    <main>
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
          <h1 className="text-ds-text mt-4 text-4xl font-bold">Get in touch</h1>
          <p className="text-ds-muted mt-3 max-w-lg">
            Open to frontend roles in Noida / Delhi NCR, freelance projects, or just a chat about
            code, automation, or bikes.
          </p>
        </div>
      </section>

      {/* ── Two-column layout ── */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-3">
            {/* Left — meta info */}
            <aside className="flex flex-col gap-10 lg:col-span-1">
              {/* Response time */}
              <div>
                <h2 className="text-ds-accent mb-2 font-mono text-sm font-medium">Response time</h2>
                <p className="text-ds-muted text-sm">
                  I aim to reply within 48 hours. For urgent inquiries, DM me on LinkedIn.
                </p>
              </div>

              {/* Location */}
              <div>
                <h2 className="text-ds-accent mb-2 font-mono text-sm font-medium">Location</h2>
                <p className="text-ds-muted text-sm">
                  Ghaziabad, UP — open to Noida / Delhi NCR roles and remote.
                </p>
              </div>

              {/* Availability */}
              <div>
                <h2 className="text-ds-accent mb-2 font-mono text-sm font-medium">Availability</h2>
                <p className="text-ds-muted text-sm">
                  Immediate to ~20 days notice. Open to contract and full-time.
                </p>
              </div>

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
                          className="border-ds-border bg-ds-surface text-ds-muted group-hover:border-ds-accent group-hover:text-ds-accent flex h-8 w-8 items-center justify-center rounded-lg border font-mono text-xs transition-colors"
                          aria-hidden="true"
                        >
                          {link.icon}
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
            </aside>

            {/* Right — form */}
            <div className="lg:col-span-2">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
