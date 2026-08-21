// components/layout/Navbar.tsx
import Link from 'next/link'
import { NavbarLinks } from './NavbarLinks'
import { MobileNav } from './MobileNav'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LogoMark } from '@/components/ui/LogoMark'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/icons/Icon'
import { siteConfig } from '@/content/metadata/site.config'

// ── Logo Mark ─────────────────────────────────────────────────
function NavLogo() {
  return (
    <Link
      href="/"
      className="group flex items-center gap-3 no-underline"
      aria-label="DevStash home"
    >
      {/* A static drop-shadow (not box-shadow — this follows the mark's
          rounded-square silhouette rather than sitting behind a rectangle),
          low opacity so it reads as ambient polish, not a badge. */}
      <span
        style={{
          filter:
            'drop-shadow(0 0 6px color-mix(in srgb, var(--color-ds-accent) 25%, transparent))',
        }}
      >
        <LogoMark size={38} />
      </span>
      <span
        className="text-ds-text text-[21px] leading-none font-bold tracking-tight"
        style={{ letterSpacing: '-0.04em' }}
      >
        <span className="text-ds-accent">Dev</span>Stash
      </span>
    </Link>
  )
}

// ── Nav items config ──────────────────────────────────────────
export const navItems = [
  { label: 'Projects', href: '/projects' },
  { label: 'Lab', href: '/lab' },
  { label: 'Blog', href: '/blog' },
  { label: 'Resources', href: '/resources' },
  { label: 'Tools', href: '/tools' },
  { label: 'About', href: '/about' },
] as const

// ── Navbar (Server Component) ─────────────────────────────────
export function Navbar() {
  return (
    <header className="bg-ds-bg/85 relative sticky top-0 z-50 w-full backdrop-blur-[16px]">
      {/* A flat border-b read as thin/generic against the taller bar below —
          the same accent→purple duo as everywhere else in the site (cards,
          buttons, the active-nav indicator), just as a 1px hairline instead
          of a flat border color, so the chrome itself carries the brand. */}
      <div
        aria-hidden="true"
        className="from-ds-accent/40 via-ds-purple/40 absolute inset-x-0 bottom-0 h-px bg-gradient-to-r to-transparent"
      />
      <nav
        className="mx-auto flex h-[84px] max-w-6xl items-center justify-between px-4 sm:px-6"
        aria-label="Main navigation"
      >
        {/* Left — Logo */}
        <NavLogo />

        {/* Center/Right — Desktop links (Client island). lg, not md: with six
            links + GitHub + theme + résumé + contact the row overflows and the
            résumé button wraps between 768–1024px, so tablets get the mobile
            nav instead. */}
        <div className="hidden items-center gap-1 lg:flex">
          <NavbarLinks items={navItems} />
          <a
            href={siteConfig.author.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="gradient-ring-hover border-ds-border text-ds-muted hover:text-ds-accent ml-2 flex h-10 w-10 items-center justify-center rounded-lg border transition-colors"
          >
            <Icon name="github" className="h-5 w-5" />
          </a>
          <ThemeToggle className="gradient-ring-hover border-ds-border text-ds-muted hover:text-ds-accent ml-2 flex h-10 w-10 items-center justify-center rounded-lg border transition-colors" />
          <a
            href="/resume-adesh-shukla.pdf"
            download
            data-analytics-event="cv_viewed"
            className="gradient-ring-hover border-ds-border text-ds-muted hover:text-ds-accent ml-3 inline-flex h-10 items-center rounded-lg border px-3.5 text-[13px] font-medium whitespace-nowrap transition-colors"
          >
            Résumé ↓
          </a>
          <Button href="/contact" size="md" className="ml-2 font-semibold">
            Contact
          </Button>
        </div>

        {/* Right — Mobile trigger (Client Component) */}
        <div className="flex lg:hidden">
          <MobileNav items={navItems} />
        </div>
      </nav>
    </header>
  )
}
