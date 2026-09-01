// components/lab/LabPreview.tsx
//
// A small live preview per lab entry. This is the thing that makes /lab read as
// a lab rather than a directory: every entry demonstrates what it does instead
// of describing it. Server Component — pure CSS/SVG, no client JS, no images.
//
// Each preview is deliberately abstract. It shows the SHAPE of the tool's
// output (a pipeline filling, a shape morphing, a SERP result resolving), never
// a fake screenshot of a result the tool didn't produce.
//
// All motion is defined in globals.css under the `lab-*` keyframes and is
// disabled wholesale by the existing prefers-reduced-motion block there.

type PreviewKind =
  | 'pipeline'
  | 'shapes'
  | 'illustration'
  | 'meta'
  | 'utm'
  | 'page-form'
  | 'page-listing'
  | 'page-trial'

const FRAME =
  'relative overflow-hidden rounded-lg border border-ds-border bg-ds-surface2 aspect-[16/9] w-full'

/** Three stages filling left to right, one after another. */
function Pipeline() {
  const stages = ['Scaffold', 'Copy-edit', 'Frontmatter']
  return (
    <div className={FRAME}>
      <div className="absolute inset-0 flex flex-col justify-center gap-3 p-5">
        {stages.map((stage, i) => (
          <div key={stage} className="flex items-center gap-3">
            <span className="text-ds-muted w-20 shrink-0 text-[10px] leading-none">{stage}</span>
            <span className="bg-ds-border/50 relative h-2 flex-1 overflow-hidden rounded-full">
              <span
                className="lab-fill from-ds-accent to-ds-purple absolute inset-y-0 left-0 rounded-full bg-gradient-to-r"
                style={{ animationDelay: `${i * 0.55}s` }}
              />
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Forms morphing their own border-radius — what the playground edits. */
function Shapes() {
  return (
    <div className={FRAME}>
      <div className="absolute inset-0 flex items-center justify-center gap-5">
        <span className="lab-morph from-ds-accent/80 to-ds-purple/80 block h-16 w-16 bg-gradient-to-br sm:h-20 sm:w-20" />
        <span className="lab-morph border-ds-accent/50 block h-10 w-10 border-2 [animation-delay:-2.5s] sm:h-12 sm:w-12" />
        <span className="lab-morph bg-ds-purple/30 block h-7 w-7 [animation-delay:-5s] sm:h-8 sm:w-8" />
      </div>
    </div>
  )
}

/** Strokes drawing themselves in, the way the generator composes an SVG. */
function Illustration() {
  return (
    <div className={FRAME}>
      <svg
        viewBox="0 0 160 70"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
        focusable="false"
      >
        <g
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          className="stroke-ds-accent"
          opacity="0.85"
        >
          <path className="lab-draw" d="M24 50 C44 50 44 24 64 24 S92 50 112 30" />
          <path
            className="lab-draw [animation-delay:.4s]"
            d="M24 58 C52 58 52 40 84 40 S120 56 136 44"
          />
        </g>
        <circle cx="64" cy="24" r="4" className="fill-ds-purple lab-blink" />
        <circle cx="112" cy="30" r="3" className="fill-ds-accent lab-blink [animation-delay:.6s]" />
      </svg>
    </div>
  )
}

/** A search result resolving — title, url, then the snippet. */
function Meta() {
  return (
    <div className={FRAME}>
      <div className="absolute inset-0 flex flex-col justify-center gap-1.5 p-4">
        <span className="bg-ds-accent/70 lab-rise h-2 w-2/3 rounded" />
        <span className="bg-ds-success/50 lab-rise h-1.5 w-2/5 rounded [animation-delay:.15s]" />
        <span className="bg-ds-border lab-rise h-1.5 w-full rounded [animation-delay:.3s]" />
        <span className="bg-ds-border lab-rise h-1.5 w-4/5 rounded [animation-delay:.45s]" />
      </div>
    </div>
  )
}

/**
 * Campaign parameters appending onto a base URL one by one. The param names are
 * real UTM keys — this is the tool's actual output shape, not decoration.
 */
function Utm() {
  const params = ['utm_source', 'utm_medium', 'utm_campaign']
  return (
    <div className={FRAME}>
      <div className="absolute inset-0 flex flex-col justify-center gap-2 p-5">
        <span className="text-ds-muted text-[10px] leading-none">example.com/pricing</span>
        <div className="flex flex-wrap gap-1.5">
          {params.map((p, i) => (
            <span
              key={p}
              // accent-strong, not accent: at 10px on the tinted chip the
              // regular accent lands at 4:1, just under the AA floor.
              className="lab-pop border-ds-accent/40 bg-ds-accent/10 text-ds-accent-strong rounded border px-1.5 py-0.5 text-[10px] leading-none"
              style={{ animationDelay: `${0.25 + i * 0.3}s` }}
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Landing-page samples: a browser frame with the page's own shape inside. */
function PageFrame({ kind }: { kind: 'page-form' | 'page-listing' | 'page-trial' }) {
  return (
    <div className={FRAME}>
      <div className="border-ds-border bg-ds-surface absolute inset-x-0 top-0 flex h-5 items-center gap-1 border-b px-2">
        <span className="bg-ds-border h-1.5 w-1.5 rounded-full" />
        <span className="bg-ds-border h-1.5 w-1.5 rounded-full" />
        <span className="bg-ds-border h-1.5 w-1.5 rounded-full" />
      </div>
      <div className="absolute inset-x-0 top-5 bottom-0 p-3">
        {kind === 'page-form' && (
          <div className="flex h-full gap-2">
            <div className="flex flex-1 flex-col justify-center gap-1.5">
              <span className="bg-ds-border h-2 w-4/5 rounded" />
              <span className="bg-ds-border/60 h-1.5 w-3/5 rounded" />
            </div>
            <div className="border-ds-accent/40 bg-ds-bg flex w-2/5 flex-col justify-center gap-1 rounded border p-1.5">
              <span className="bg-ds-border h-1.5 w-full rounded" />
              <span className="bg-ds-accent lab-pulse h-2 w-full rounded" />
            </div>
          </div>
        )}
        {kind === 'page-listing' && (
          <div className="flex h-full gap-2">
            <div className="bg-ds-border/40 flex-1 rounded" />
            <div className="flex w-1/3 flex-col justify-center gap-1">
              <span className="bg-ds-border h-1.5 w-full rounded" />
              <span className="bg-ds-border h-1.5 w-2/3 rounded" />
              <span className="bg-ds-accent lab-pulse h-2 w-full rounded" />
            </div>
          </div>
        )}
        {kind === 'page-trial' && (
          <div className="flex h-full flex-col items-center justify-center gap-1.5">
            <span className="bg-ds-border h-2 w-3/5 rounded" />
            <span className="bg-ds-border/60 h-1.5 w-2/5 rounded" />
            <span className="bg-ds-accent lab-pulse mt-1 h-2.5 w-1/3 rounded" />
          </div>
        )}
      </div>
    </div>
  )
}

export function LabPreview({ kind }: { kind: PreviewKind }) {
  switch (kind) {
    case 'pipeline':
      return <Pipeline />
    case 'shapes':
      return <Shapes />
    case 'illustration':
      return <Illustration />
    case 'meta':
      return <Meta />
    case 'utm':
      return <Utm />
    default:
      return <PageFrame kind={kind} />
  }
}

export type { PreviewKind }
