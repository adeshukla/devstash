// components/layout/Footer.tsx
import Link from 'next/link'
import { siteConfig } from '@/content/metadata/site.config'
import { LogoMark } from '@/components/ui/LogoMark'

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Projects', href: '/projects' },
  { label: 'Lab', href: '/lab' },
  { label: 'Blog', href: '/blog' },
  { label: 'Resources', href: '/resources' },
  { label: 'Tools', href: '/tools' },
  { label: 'Contact', href: '/contact' },
  { label: 'Work With Me', href: '/services' },
  { label: 'Uses', href: '/uses' },
  { label: 'Now', href: '/now' },
]

const legalLinks = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Use', href: '/terms' },
]

const socialLinks = [
  {
    label: 'GitHub',
    href: siteConfig.author.github,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: siteConfig.author.linkedin,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer
      className="border-ds-border bg-ds-surface relative w-full overflow-hidden border-t"
      aria-label="Site footer"
    >
      {/* Same subtle grid + aurora-glow treatment as the hero, toned down —
          fills the empty margin outside the centered content wrapper on wide
          desktop screens instead of leaving flat, empty background there. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--color-ds-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-ds-border)_1px,transparent_1px)] bg-[size:64px_64px] opacity-[0.15]"
      />
      <div
        aria-hidden="true"
        className="bg-ds-accent absolute -bottom-32 left-1/2 -z-10 h-[420px] w-[420px] -translate-x-1/2 rounded-full opacity-[0.06] blur-3xl"
      />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {/* Top row */}
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand */}
          <div className="max-w-xs">
            <Link
              href="/"
              className="mb-3 inline-flex items-center gap-2.5 no-underline"
              aria-label="DevStash home"
            >
              <LogoMark size={28} />
              <span
                className="text-ds-text text-[16px] font-bold"
                style={{ letterSpacing: '-0.04em' }}
              >
                <span className="text-ds-accent">Dev</span>Stash
              </span>
            </Link>
            <p className="text-ds-muted text-[13px] leading-[1.7]">
              A modern developer ecosystem for engineering, automation, AI workflows, and frontend
              systems.
            </p>
            {/* Contact */}
            <address className="mt-4 not-italic">
              <a
                href={`mailto:${siteConfig.author.email}`}
                className="link-underline text-ds-muted hover:text-ds-accent font-mono text-[13px] transition-colors"
              >
                {siteConfig.author.email}
              </a>
            </address>
          </div>

          {/* Nav links */}
          <div>
            <p className="text-ds-muted mb-3 font-mono text-[11px] tracking-widest uppercase">
              Navigation
            </p>
            <nav aria-label="Footer navigation">
              <ul className="m-0 grid list-none grid-cols-2 gap-x-6 gap-y-2 p-0">
                {navLinks.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="link-underline text-ds-muted hover:text-ds-text text-[13px] transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Social links */}
          <div>
            <p className="text-ds-muted mb-3 font-mono text-[11px] tracking-widest uppercase">
              Connect
            </p>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {socialLinks.map(({ label, href, icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group text-ds-muted hover:text-ds-text flex items-center gap-2.5 text-[13px] transition-colors"
                  >
                    <span
                      className="border-ds-border bg-ds-bg/40 group-hover:border-ds-accent flex h-7 w-7 items-center justify-center rounded-md border transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_6px_16px_-6px_color-mix(in_srgb,var(--color-ds-accent)_45%,transparent)]"
                      aria-hidden="true"
                    >
                      {icon}
                    </span>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom row */}
        <div className="border-ds-border mt-10 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-ds-muted font-mono text-[12px]">
            © {year} {siteConfig.name} · crafted with ☕ in Ghaziabad
          </p>
          <nav aria-label="Legal links">
            <ul className="m-0 flex list-none gap-4 p-0">
              {legalLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="link-underline text-ds-muted hover:text-ds-text font-mono text-[12px] transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  )
}
