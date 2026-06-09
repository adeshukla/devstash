// components/ui/Pagination.tsx
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

interface PaginationProps {
  currentPage: number
  totalPages: number
  baseUrl: string // e.g. "/blog" or "/blog/category/frontend"
  searchParams?: Record<string, string>
}

function buildUrl(base: string, page: number, extra: Record<string, string>): string {
  const params = new URLSearchParams(extra)
  if (page > 1) params.set('page', String(page))
  const qs = params.toString()
  return qs ? `${base}?${qs}` : base
}

export function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  searchParams = {},
}: PaginationProps) {
  if (totalPages <= 1) return null

  // Show at most 5 page numbers around current
  const pages: (number | '...')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i)
    } else if (
      pages[pages.length - 1] !== '...' &&
      (i === currentPage - 2 || i === currentPage + 2)
    ) {
      pages.push('...')
    }
  }

  const prevUrl = currentPage > 1 ? buildUrl(baseUrl, currentPage - 1, searchParams) : null
  const nextUrl = currentPage < totalPages ? buildUrl(baseUrl, currentPage + 1, searchParams) : null

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
      {/* Prev */}
      {prevUrl ? (
        <Link
          href={prevUrl}
          className="border-ds-border text-ds-muted hover:border-ds-border2 hover:text-ds-text flex h-9 w-9 items-center justify-center rounded border transition-colors"
          aria-label="Previous page"
        >
          ←
        </Link>
      ) : (
        <span className="border-ds-border text-ds-border flex h-9 w-9 cursor-not-allowed items-center justify-center rounded border">
          ←
        </span>
      )}

      {/* Pages */}
      {pages.map((page, i) =>
        page === '...' ? (
          <span
            key={`ellipsis-${i}`}
            className="text-ds-muted flex h-9 w-9 items-center justify-center"
          >
            …
          </span>
        ) : (
          <Link
            key={page}
            href={buildUrl(baseUrl, page, searchParams)}
            aria-current={page === currentPage ? 'page' : undefined}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded border text-sm font-medium transition-colors',
              page === currentPage
                ? 'border-ds-accent bg-ds-accent text-white'
                : 'border-ds-border text-ds-muted hover:border-ds-border2 hover:text-ds-text'
            )}
          >
            {page}
          </Link>
        )
      )}

      {/* Next */}
      {nextUrl ? (
        <Link
          href={nextUrl}
          className="border-ds-border text-ds-muted hover:border-ds-border2 hover:text-ds-text flex h-9 w-9 items-center justify-center rounded border transition-colors"
          aria-label="Next page"
        >
          →
        </Link>
      ) : (
        <span className="border-ds-border text-ds-border flex h-9 w-9 cursor-not-allowed items-center justify-center rounded border">
          →
        </span>
      )}
    </nav>
  )
}
