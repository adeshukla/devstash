// components/blog/MDXComponents.tsx
import Image from 'next/image'
import Link from 'next/link'
import type { MDXComponents } from 'mdx/types'
import { ImageGallery } from '@/components/ui'
import { CopyCodeButton } from '@/components/blog/CopyCodeButton'
import { cn } from '@/lib/utils/cn'

// ─── Callout ────────────────────────────────────────────────────────────────

interface CalloutProps {
  type?: 'info' | 'warning' | 'tip' | 'danger'
  title?: string
  children: React.ReactNode
}

function Callout({ type = 'info', title, children }: CalloutProps) {
  const config = {
    info: { border: 'border-ds-accent', bg: 'bg-ds-accent/5', icon: 'ℹ' },
    warning: { border: 'border-ds-warning', bg: 'bg-ds-warning/5', icon: '⚠' },
    tip: { border: 'border-ds-success', bg: 'bg-ds-success/5', icon: '💡' },
    danger: { border: 'border-ds-error', bg: 'bg-ds-error/5', icon: '🚨' },
  }
  const { border, bg, icon } = config[type]

  return (
    <div className={cn('my-6 rounded-lg border-l-4 p-4', border, bg)}>
      {title && (
        <p className="text-ds-text mb-1 font-semibold">
          <span className="mr-2">{icon}</span>
          {title}
        </p>
      )}
      <div className="text-ds-muted text-sm [&>p]:mb-0">{children}</div>
    </div>
  )
}

// ─── MDX Component Map ───────────────────────────────────────────────────────

export const mdxComponents: MDXComponents = {
  // Headings — scroll-mt-24 accounts for sticky navbar height
  h1: ({ children }) => (
    <h1 className="text-ds-text mt-10 mb-6 font-sans text-3xl font-bold tracking-tight">
      {children}
    </h1>
  ),
  h2: ({ children, id }) => (
    <h2 id={id} className="text-ds-text mt-10 mb-4 scroll-mt-24 font-sans text-2xl font-semibold">
      <a
        href={`#${id}`}
        className="group hover:text-ds-accent inline-flex items-center gap-2 no-underline transition-colors"
      >
        {children}
        <span className="text-ds-muted text-base font-normal opacity-0 transition-opacity select-none group-hover:opacity-100">
          #
        </span>
      </a>
    </h2>
  ),
  h3: ({ children, id }) => (
    <h3 id={id} className="text-ds-text mt-8 mb-3 scroll-mt-24 font-sans text-xl font-semibold">
      <a
        href={`#${id}`}
        className="group hover:text-ds-accent inline-flex items-center gap-2 no-underline transition-colors"
      >
        {children}
        <span className="text-ds-muted text-sm font-normal opacity-0 transition-opacity select-none group-hover:opacity-100">
          #
        </span>
      </a>
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-ds-text mt-6 mb-2 font-sans text-lg font-semibold">{children}</h4>
  ),

  // Body
  p: ({ children }) => <p className="text-ds-muted mb-4 leading-7">{children}</p>,

  // Links
  a: ({ href, children }) => {
    const isExternal = href?.startsWith('http') || href?.startsWith('//')
    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-ds-accent hover:text-ds-accent/80 underline underline-offset-4 transition-colors"
        >
          {children}
        </a>
      )
    }
    return (
      <Link
        href={href ?? '#'}
        className="text-ds-accent hover:text-ds-accent/80 underline underline-offset-4 transition-colors"
      >
        {children}
      </Link>
    )
  },

  // Inline code — rehype-pretty-code handles fenced blocks; this handles `backticks`
  code: ({ children, className }) => {
    if (className) return <code className={className}>{children}</code>
    return (
      <code className="bg-ds-surface2 text-ds-accent rounded px-1.5 py-0.5 font-mono text-[0.85em]">
        {children}
      </code>
    )
  },

  // Code block wrapper — rehype-pretty-code injects syntax styles into the pre/code
  pre: ({ children, ...props }) => (
    <div className="group border-ds-border bg-ds-surface relative my-6 overflow-hidden rounded-lg border">
      <CopyCodeButton />
      <pre {...props} className="overflow-x-auto p-4 text-sm leading-relaxed">
        {children}
      </pre>
    </div>
  ),

  // Blockquote
  blockquote: ({ children }) => (
    <blockquote className="border-ds-accent text-ds-muted my-6 border-l-4 pl-5 italic [&>p]:mb-2">
      {children}
    </blockquote>
  ),

  // Lists
  ul: ({ children }) => (
    <ul className="text-ds-muted my-4 list-disc space-y-1.5 pl-6">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="text-ds-muted my-4 list-decimal space-y-1.5 pl-6">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-7">{children}</li>,

  // Divider
  hr: () => <hr className="border-ds-border my-10" />,

  // Tables
  table: ({ children }) => (
    <div className="border-ds-border my-6 overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-ds-surface2">{children}</thead>,
  th: ({ children }) => (
    <th className="border-ds-border text-ds-text border-b px-4 py-3 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-ds-border text-ds-muted border-b px-4 py-3 last:border-b-0">
      {children}
    </td>
  ),

  // Images
  img: ({ src, alt }) => {
    if (!src) return null
    return (
      <figure className="my-8">
        <Image
          src={src}
          alt={alt ?? ''}
          width={720}
          height={400}
          className="border-ds-border w-full rounded-lg border object-cover"
        />
        {alt && <figcaption className="text-ds-muted mt-2 text-center text-sm">{alt}</figcaption>}
      </figure>
    )
  },

  // Custom Components
  Callout,
  ImageGallery,
}
