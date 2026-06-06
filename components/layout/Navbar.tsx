// components/layout/Navbar.tsx
import Link from 'next/link'
import { NavbarLinks } from './NavbarLinks'
import { MobileNav } from './MobileNav'

// ── Logo Mark ─────────────────────────────────────────────────
function NavLogo() {
  return (
    <Link
      href="/"
      className="group flex items-center gap-2.5 no-underline"
      aria-label="DevStash home"
    >
      <svg width="30" height="30" viewBox="0 0 100 100" fill="none" aria-hidden="true">
        <rect width="100" height="100" rx="22" fill="#0B0F19" />
        <rect width="100" height="100" rx="22" stroke="#1F2937" strokeWidth="2" />
        <path
          d="M23 34L46 50L23 66"
          stroke="#3B82F6"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="53" y="57" width="26" height="7" rx="3.5" fill="#8B5CF6" />
      </svg>
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
  { label: 'Blog', href: '/blog' },
  { label: 'Resources', href: '/resources' },
  { label: 'Tools', href: '/tools' },
  { label: 'About', href: '/about' },
] as const

// ── Navbar (Server Component) ─────────────────────────────────
export function Navbar() {
  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{
        background: 'rgba(11,15,25,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <nav
        className="mx-auto flex h-[58px] max-w-6xl items-center justify-between px-4 sm:px-6"
        aria-label="Main navigation"
      >
        {/* Left — Logo */}
        <NavLogo />

        {/* Center/Right — Desktop links (Client island) */}
        <div className="hidden items-center gap-1 md:flex">
          <NavbarLinks items={navItems} />
          <Link
            href="/contact"
            className="bg-ds-accent ml-3 inline-flex h-9 items-center rounded-lg px-4 text-[13px] font-semibold text-white transition-colors hover:bg-blue-400"
          >
            Contact
          </Link>
        </div>

        {/* Right — Mobile trigger (Client Component) */}
        <div className="flex md:hidden">
          <MobileNav items={navItems} />
        </div>
      </nav>
    </header>
  )
}
