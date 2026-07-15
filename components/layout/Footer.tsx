// components/layout/Footer.tsx
import Link from 'next/link'
import { siteConfig } from '@/content/metadata/site.config'
import { LogoMark } from '@/components/ui/LogoMark'
import { Icon } from '@/components/icons/Icon'
import type { IconName } from '@/components/icons/Icon'

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
]

const legalLinks = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Use', href: '/terms' },
]

const socialLinks: { label: string; href: string; icon: IconName }[] = [
  { label: 'GitHub', href: siteConfig.author.github, icon: 'github' },
  { label: 'LinkedIn', href: siteConfig.author.linkedin, icon: 'linkedin' },
  { label: 'Twitter / X', href: siteConfig.author.x, icon: 'x' },
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
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
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
              <ul className="m-0 grid list-none grid-cols-2 gap-x-10 gap-y-3 p-0">
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
                      <Icon name={icon} className="h-4 w-4" />
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
