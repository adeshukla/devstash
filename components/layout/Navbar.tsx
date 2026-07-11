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
      className="group flex items-center gap-2.5 no-underline"
      aria-label="DevStash home"
    >
      <LogoMark size={30} />
      <span
        className="text-ds-text text-[17px] leading-none font-bold tracking-tight"
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
    <header className="bg-ds-bg/85 border-ds-border sticky top-0 z-50 w-full border-b backdrop-blur-[16px]">
      <nav
        className="mx-auto flex h-[58px] max-w-6xl items-center justify-between px-4 sm:px-6"
        aria-label="Main navigation"
      >
        {/* Left — Logo */}
        <NavLogo />

        {/* Center/Right — Desktop links (Client island) */}
        <div className="hidden items-center gap-1 md:flex">
          <NavbarLinks items={navItems} />
          <a
            href={siteConfig.author.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent ml-2 flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
          >
            <Icon name="github" className="h-4 w-4" />
          </a>
          <ThemeToggle className="border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent ml-2 flex h-9 w-9 items-center justify-center rounded-lg border transition-colors" />
          <a
            href="/resume-adesh-shukla.pdf"
            download
            data-analytics-event="cv_viewed"
            className="border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent ml-3 inline-flex h-9 items-center rounded-lg border px-3 text-[13px] font-medium transition-colors"
          >
            Résumé ↓
          </a>
          <Button href="/contact" size="sm" className="ml-2 font-semibold">
            Contact
          </Button>
        </div>

        {/* Right — Mobile trigger (Client Component) */}
        <div className="flex md:hidden">
          <MobileNav items={navItems} />
        </div>
      </nav>
    </header>
  )
}
