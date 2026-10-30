import './LabFaq.css'

interface FaqItem {
  question: string
  answer: string
}

/**
 * Native <details>/<summary> accordion — no client JS needed. Numbered, with a
 * hover and an open state, and the answer eases in (LabFaq.css) unless the
 * visitor has asked for less motion.
 */
export function LabFaq({
  items,
  defaultOpen = false,
}: {
  items: FaqItem[]
  /** Open the first answer on load, so a reader sees how it works at once. */
  defaultOpen?: boolean
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      {items.map((item, i) => (
        <details
          key={item.question}
          open={defaultOpen && i === 0}
          className="group border-ds-border bg-ds-surface hover:border-ds-border2 open:border-ds-accent/40 rounded-xl border transition-colors"
        >
          <summary className="focus-visible:outline-ds-accent flex cursor-pointer list-none items-center gap-3 rounded-xl px-4 py-3.5 marker:content-none focus-visible:outline-2 focus-visible:-outline-offset-2 sm:gap-4 sm:px-5 sm:py-4 [&::-webkit-details-marker]:hidden">
            <span
              className="text-ds-muted group-open:text-ds-accent hidden w-6 shrink-0 font-mono text-xs transition-colors sm:block"
              aria-hidden="true"
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="text-ds-text min-w-0 flex-1 font-medium [overflow-wrap:anywhere]">
              {item.question}
            </span>
            <span
              className="border-ds-border text-ds-muted group-open:border-ds-accent group-open:text-ds-accent group-hover:border-ds-border2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-base leading-none transition-[transform,color,border-color] duration-300 group-open:rotate-45"
              aria-hidden="true"
            >
              +
            </span>
          </summary>
          <div className="faq-answer px-4 pb-4 sm:px-5 sm:pb-5 sm:pl-[3.75rem]">
            <p className="text-ds-muted text-sm leading-relaxed">{item.answer}</p>
          </div>
        </details>
      ))}
    </div>
  )
}
