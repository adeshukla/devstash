interface FaqItem {
  question: string
  answer: string
}

/** Native <details>/<summary> accordion — no client JS needed. */
export function LabFaq({ items }: { items: FaqItem[] }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <details
          key={item.question}
          className="group border-ds-border bg-ds-surface rounded-xl border px-5 py-4 open:pb-4"
        >
          <summary className="text-ds-text flex cursor-pointer list-none items-center justify-between gap-4 font-medium marker:content-none">
            {item.question}
            <span
              className="text-ds-muted shrink-0 font-mono text-sm transition-transform group-open:rotate-45"
              aria-hidden="true"
            >
              +
            </span>
          </summary>
          <p className="text-ds-muted mt-3 text-sm leading-relaxed">{item.answer}</p>
        </details>
      ))}
    </div>
  )
}
