// The About hero's right-hand card: the career path as four steps — accounts
// → UX → analyst + front-end → DevStash. It replaced an `adesh.ts` code object
// that only repeated the copy beside it (role, location, stack) in a common
// portfolio trope. Every line is a fact Adesh has stated (see the About copy);
// no dates for the accounts years. Pure CSS stagger (animate-fade-up + delay),
// no client JS, stays a Server Component, never touches LCP. aria-hidden: the
// paragraphs next to it already say all of this to screen readers.

const STEPS: { kicker: string; title: string; detail: string; now?: boolean }[] = [
  {
    kicker: 'accounts',
    title: 'CA student, then tax compliance',
    detail: 'Where checking the numbers started.',
  },
  { kicker: 'ux', title: 'Pulled toward the web', detail: 'Tried designing in tools like Figma.' },
  {
    kicker: 'front-end',
    title: 'An analyst who builds front-ends',
    detail: '6+ years · 200+ landing pages for US clients at Chetu India.',
  },
  { kicker: 'now', title: 'Building DevStash', detail: 'Open to frontend roles.', now: true },
]

export function AboutProfileCard() {
  return (
    <div
      aria-hidden="true"
      className="border-ds-border bg-ds-surface w-full overflow-hidden rounded-xl border shadow-2xl shadow-black/40"
    >
      <div className="border-ds-border flex h-12 items-center justify-between border-b px-5">
        <span className="text-ds-muted font-mono text-xs tracking-wide">
          {'// the path so far'}
        </span>
        <span className="text-ds-muted font-mono text-xs">4 steps</span>
      </div>

      <div className="relative px-6 py-7">
        {/* The rail: one line behind the step dots, fading into the accent at "now". */}
        <span className="from-ds-border2 to-ds-accent absolute top-10 bottom-[5.25rem] left-[2.15rem] w-[1.5px] bg-gradient-to-b" />
        <ol>
          {STEPS.map(({ kicker, title, detail, now }, i) => (
            <li
              key={kicker}
              className="animate-fade-up relative flex gap-4 pb-6 last:pb-0 motion-reduce:animate-none"
              style={{ animationDelay: `${120 + i * 160}ms` }}
            >
              <span
                className={
                  now
                    ? 'bg-ds-accent ring-ds-accent/25 relative z-10 mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full ring-4'
                    : 'border-ds-border2 bg-ds-surface2 relative z-10 mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border-[1.5px]'
                }
              >
                <span
                  className={
                    now
                      ? 'h-1.5 w-1.5 rounded-full bg-white'
                      : 'bg-ds-muted h-1.5 w-1.5 rounded-full'
                  }
                />
              </span>
              <div className="min-w-0">
                <p
                  className={`font-mono text-[11px] tracking-wider uppercase ${now ? 'text-ds-accent-strong' : 'text-ds-muted'}`}
                >
                  {String(i + 1).padStart(2, '0')} · {kicker}
                </p>
                <p className="text-ds-text mt-0.5 text-[15px] font-semibold sm:text-base">
                  {title}
                </p>
                <p className="text-ds-muted mt-0.5 text-sm leading-relaxed">{detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
