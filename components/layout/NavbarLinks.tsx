// components/layout/NavbarLinks.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

interface NavItem {
  label: string
  href: string
}

interface NavbarLinksProps {
  items: readonly NavItem[]
}

export function NavbarLinks({ items }: NavbarLinksProps) {
  const pathname = usePathname()

  return (
    <>
      {items.map(({ label, href }) => {
        const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'relative inline-flex h-9 items-center px-3 text-[13px] font-medium',
              'rounded-lg transition-colors duration-200',
              'hover:text-ds-text hover:bg-white/5',
              isActive ? 'text-ds-text' : 'text-ds-muted'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            {label}
            {/* Active indicator dot */}
            {isActive && (
              <span
                className="bg-ds-accent absolute bottom-1 left-1/2 h-1 w-2/3 -translate-x-1/2 rounded-full"
                aria-hidden="true"
              />
            )}
          </Link>
        )
      })}
    </>
  )
}
