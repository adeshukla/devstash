// components/layout/Breadcrumb.tsx
import Link from 'next/link'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildBreadcrumbSchema } from '@/lib/schema/builders'
import type { BreadcrumbItem } from '@/types/seo'

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  if (items.length < 2) return null

  return (
    <>
      {/* JSON-LD BreadcrumbList schema */}
      <JsonLd data={buildBreadcrumbSchema(items)} />

      {/* Visible breadcrumb trail */}
      <nav aria-label="Breadcrumb">
        <ol
          className="m-0 flex list-none flex-wrap items-center gap-1 p-0"
          itemScope
          itemType="https://schema.org/BreadcrumbList"
        >
          {items.map((item, index) => {
            const isLast = index === items.length - 1

            return (
              <li
                key={item.url}
                className="flex items-center gap-1"
                itemScope
                itemType="https://schema.org/ListItem"
                itemProp="itemListElement"
              >
                <meta itemProp="position" content={String(index + 1)} />

                {isLast ? (
                  <span
                    className="text-ds-muted font-mono text-[12px]"
                    itemProp="name"
                    aria-current="page"
                  >
                    {item.name}
                  </span>
                ) : (
                  <>
                    <Link
                      href={item.url}
                      className="text-ds-muted hover:text-ds-accent font-mono text-[12px] transition-colors"
                      itemProp="item"
                    >
                      <span itemProp="name">{item.name}</span>
                    </Link>
                    {/* Separator */}
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      aria-hidden="true"
                      className="text-ds-border flex-shrink-0"
                    >
                      <path
                        d="M4 2l4 4-4 4"
                        stroke="currentColor"
                        strokeWidth="1.25"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}
