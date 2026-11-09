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
// Every preview is one SVG on a 480x270 canvas (16:9) that fills its frame, so
// the content scales with the card instead of floating small in the middle.
// Text inside is 13+ canvas units, which stays readable at phone width.
//
// All motion is defined in ./LabPreview.css (the `lab-*` keyframes, gated on
// prefers-reduced-motion: no-preference), so it only ships with /lab. Text is
// never faded: it only scales or slides, so contrast holds throughout.

import './LabPreview.css'

type PreviewKind =
  'pipeline' | 'shapes' | 'illustration' | 'meta' | 'utm' | 'qr' | 'check' | 'merge' | 'chat'

const FRAME =
  'relative overflow-hidden rounded-lg border border-ds-border bg-ds-surface2 aspect-[16/9] w-full'

function Canvas({ children }: { children: React.ReactNode }) {
  return (
    <div className={FRAME}>
      <svg
        viewBox="0 0 480 270"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
        focusable="false"
      >
        {children}
      </svg>
    </div>
  )
}

const MONO = 'font-mono'

/** Three stages filling in turn, like the real step list. */
function Pipeline() {
  const stages = ['Scaffold', 'Copy-edit', 'Frontmatter']
  return (
    <Canvas>
      {stages.map((stage, i) => {
        const y = 56 + i * 68
        return (
          <g key={stage}>
            <text
              x="36"
              y={y + 18}
              className={`fill-ds-text ${MONO}`}
              fontSize="17"
              fontWeight="600"
            >
              {stage}
            </text>
            <rect x="170" y={y} width="274" height="26" rx="13" className="fill-ds-border/60" />
            <rect
              x="170"
              y={y}
              width="274"
              height="26"
              rx="13"
              className="lab-grow fill-ds-accent"
              style={{ animationDelay: `${i * 0.55}s` }}
            />
            <circle cx="430" cy={y + 13} r="5" className="fill-ds-purple lab-blink" />
          </g>
        )
      })}
    </Canvas>
  )
}

/** Forms morphing their own border-radius, with the CSS they would copy out. */
function Shapes() {
  return (
    <div className={FRAME}>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
        <div className="flex items-center justify-center gap-6 sm:gap-9">
          <span className="lab-morph from-ds-accent/80 to-ds-purple/80 block h-24 w-24 bg-gradient-to-br sm:h-32 sm:w-32" />
          <span className="lab-morph border-ds-accent/60 block h-16 w-16 border-[3px] [animation-delay:-2.5s] sm:h-20 sm:w-20" />
          <span className="lab-morph bg-ds-purple/35 block h-10 w-10 [animation-delay:-5s] sm:h-14 sm:w-14" />
          <span className="lab-morph from-ds-success/60 to-ds-accent/50 hidden h-14 w-14 bg-gradient-to-tr [animation-delay:-1.2s] sm:block" />
        </div>
        <span className="border-ds-border bg-ds-surface text-ds-muted rounded-md border px-3 py-1.5 font-mono text-[11px] leading-none sm:text-[13px]">
          border-radius: 42% 58% 63% 37% / 47% 42% 58% 53%
        </span>
      </div>
    </div>
  )
}

/** A composed scene drawing itself in, with its palette swatches popping up. */
function Illustration() {
  return (
    <Canvas>
      <circle cx="372" cy="78" r="38" className="fill-ds-purple/25" />
      <circle cx="372" cy="78" r="22" className="fill-ds-purple lab-blink" />
      <path
        pathLength="100"
        d="M20 200 C80 120 130 120 190 170 S300 200 360 140 S440 110 464 130"
        className="lab-draw100 stroke-ds-accent"
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        pathLength="100"
        d="M20 228 C90 170 150 190 210 214 S330 226 380 190 S440 176 464 184"
        className="lab-draw100 stroke-ds-purple/70 [animation-delay:.4s]"
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="190" cy="170" r="8" className="fill-ds-accent lab-blink [animation-delay:.6s]" />
      <circle cx="94" cy="86" r="5" className="fill-ds-text/60 lab-blink [animation-delay:1s]" />
      <circle
        cx="140"
        cy="54"
        r="3.5"
        className="fill-ds-text/50 lab-blink [animation-delay:1.4s]"
      />
      {[
        ['fill-ds-accent', 36],
        ['fill-ds-purple', 70],
        ['fill-ds-success', 104],
        ['fill-ds-warning', 138],
      ].map(([cls, x], i) => (
        <rect
          key={cls as string}
          x={x as number}
          y="238"
          width="24"
          height="16"
          rx="5"
          className={`${cls} lab-pop`}
          style={{ animationDelay: `${0.3 + i * 0.25}s` }}
        />
      ))}
    </Canvas>
  )
}

/** A Google result resolving: favicon, address, title, then lines of snippet. */
function Meta() {
  return (
    <Canvas>
      <rect
        x="40"
        y="38"
        width="400"
        height="194"
        rx="16"
        className="fill-ds-surface stroke-ds-border"
      />
      <circle cx="68" cy="72" r="11" className="fill-ds-accent/30" />
      <text x="90" y="77" className={`fill-ds-muted ${MONO}`} fontSize="14">
        example.com › page
      </text>
      <text
        x="62"
        y="116"
        className="lab-slide fill-ds-accent-strong"
        fontSize="22"
        fontWeight="600"
      >
        Your page title shows up here…
      </text>
      <rect
        x="62"
        y="136"
        width="352"
        height="9"
        rx="4.5"
        className="lab-grow fill-ds-border [animation-delay:.3s]"
      />
      <rect
        x="62"
        y="156"
        width="318"
        height="9"
        rx="4.5"
        className="lab-grow fill-ds-border [animation-delay:.5s]"
      />
      <rect
        x="62"
        y="176"
        width="200"
        height="9"
        rx="4.5"
        className="lab-grow fill-ds-border [animation-delay:.7s]"
      />
      <g className="lab-pop" style={{ animationDelay: '.9s' }}>
        <rect
          x="62"
          y="198"
          width="132"
          height="24"
          rx="12"
          className="fill-ds-success/15 stroke-ds-success/50"
        />
        <text x="76" y="215" className={`fill-ds-success ${MONO}`} fontSize="13">
          title fits
        </text>
      </g>
    </Canvas>
  )
}

/**
 * Campaign parameters appending onto a base URL one by one. The param names are
 * real UTM keys, and the channel chip is what the tool really reports.
 */
function Utm() {
  const params = ['utm_source', 'utm_medium', 'utm_campaign']
  return (
    <Canvas>
      <rect
        x="36"
        y="48"
        width="408"
        height="48"
        rx="12"
        className="fill-ds-surface stroke-ds-border"
      />
      <text x="54" y="79" className={`fill-ds-text ${MONO}`} fontSize="18">
        example.com/pricing
      </text>
      {params.map((p, i) => (
        <g key={p} className="lab-pop" style={{ animationDelay: `${0.25 + i * 0.3}s` }}>
          <rect
            x={36 + i * 138}
            y="124"
            width="128"
            height="38"
            rx="10"
            className="fill-ds-accent/12 stroke-ds-accent/40"
          />
          <text
            x={100 + i * 138}
            y="149"
            textAnchor="middle"
            className={`fill-ds-accent-strong ${MONO}`}
            fontSize="14"
          >
            {p}
          </text>
        </g>
      ))}
      <g className="lab-pop" style={{ animationDelay: '1.3s' }}>
        <rect
          x="36"
          y="192"
          width="190"
          height="42"
          rx="21"
          className="fill-ds-success/15 stroke-ds-success/50"
        />
        <text x="56" y="218" className="fill-ds-success" fontSize="16" fontWeight="600">
          GA4: Paid Search
        </text>
      </g>
      <rect
        x="244"
        y="205"
        width="200"
        height="14"
        rx="7"
        className="lab-grow fill-ds-border [animation-delay:1.5s]"
      />
    </Canvas>
  )
}

/** A QR code assembling: the three finder squares, then data modules popping in. */
function Qr() {
  const size = 9
  const cell = 20
  const x0 = 150
  const y0 = 45
  const finder = (cx: number, cy: number) => (
    <g key={`${cx}-${cy}`}>
      <rect
        x={x0 + cx * cell}
        y={y0 + cy * cell}
        width={cell * 3}
        height={cell * 3}
        rx="4"
        className="fill-ds-accent"
      />
      <rect
        x={x0 + cx * cell + 6}
        y={y0 + cy * cell + 6}
        width={cell * 3 - 12}
        height={cell * 3 - 12}
        rx="2"
        className="fill-ds-surface2"
      />
      <rect
        x={x0 + cx * cell + 20}
        y={y0 + cy * cell + 20}
        width="20"
        height="20"
        rx="2"
        className="fill-ds-accent"
      />
    </g>
  )
  const data = [
    [4, 0],
    [5, 1],
    [3, 2],
    [4, 3],
    [6, 3],
    [7, 4],
    [5, 4],
    [3, 4],
    [2, 5],
    [8, 5],
    [4, 5],
    [6, 6],
    [5, 7],
    [7, 7],
    [3, 8],
    [4, 6],
    [8, 8],
    [6, 8],
    [5, 2],
    [0, 4],
  ]
  return (
    <Canvas>
      {finder(0, 0)}
      {finder(size - 3, 0)}
      {finder(0, size - 3)}
      {data.map(([cx, cy], i) => (
        <rect
          key={`${cx}-${cy}`}
          x={x0 + cx * cell + 2}
          y={y0 + cy * cell + 2}
          width={cell - 4}
          height={cell - 4}
          rx="3"
          className="fill-ds-accent/85 lab-pop"
          style={{ animationDelay: `${(i % 7) * 0.12}s` }}
        />
      ))}
      <text x="240" y="252" textAnchor="middle" className={`fill-ds-muted ${MONO}`} fontSize="14">
        static · never expires
      </text>
    </Canvas>
  )
}

/** Links being checked: one passes, one is flagged, one passes, then a summary. */
function Check() {
  const rows = [
    { label: 'utm_medium=email', ok: true },
    { label: 'utm_medium=Email', ok: false },
    { label: 'utm_source=google', ok: true },
  ]
  return (
    <Canvas>
      {rows.map((r, i) => {
        const y = 36 + i * 60
        return (
          <g key={r.label}>
            <rect
              x="36"
              y={y}
              width="408"
              height="48"
              rx="12"
              className="fill-ds-surface stroke-ds-border"
            />
            <text x="56" y={y + 31} className={`fill-ds-text ${MONO}`} fontSize="17">
              {r.label}
            </text>
            <g className="lab-pop" style={{ animationDelay: `${0.25 + i * 0.3}s` }}>
              <rect
                x="372"
                y={y + 9}
                width="56"
                height="30"
                rx="15"
                className={
                  r.ok
                    ? 'fill-ds-success/15 stroke-ds-success/50'
                    : 'fill-ds-warning/20 stroke-ds-warning/60'
                }
              />
              <text
                x="400"
                y={y + 30}
                textAnchor="middle"
                className={r.ok ? 'fill-ds-success' : 'fill-ds-warning-strong'}
                fontSize="14"
                fontWeight="600"
              >
                {r.ok ? 'ok' : 'fix'}
              </text>
            </g>
          </g>
        )
      })}
      <text x="36" y="246" className={`fill-ds-muted ${MONO}`} fontSize="14">
        1 problem · GA4 channel shown
      </text>
    </Canvas>
  )
}

/** Three spellings, each a bar, merging into one clean row. */
function Merge() {
  const rows = [
    { label: 'Spring_Sale', w: 190 },
    { label: 'spring sale', w: 120 },
    { label: 'SPRING-SALE', w: 60 },
  ]
  return (
    <Canvas>
      {rows.map((r, i) => {
        const y = 32 + i * 42
        return (
          <g key={r.label}>
            <text x="36" y={y + 20} className={`fill-ds-muted ${MONO}`} fontSize="16">
              {r.label}
            </text>
            <rect
              x="170"
              y={y + 4}
              width={r.w}
              height="22"
              rx="11"
              className="lab-grow fill-ds-border"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          </g>
        )
      })}
      <path d="M36 166 H444" className="stroke-ds-border" strokeWidth="2" strokeDasharray="5 7" />
      <text x="36" y="214" className="fill-ds-text" fontSize="19" fontWeight="700">
        spring-sale
      </text>
      <rect
        x="170"
        y="198"
        width="274"
        height="26"
        rx="13"
        className="lab-grow fill-ds-accent [animation-delay:1s]"
      />
      <g className="lab-pop" style={{ animationDelay: '1.4s' }}>
        <rect
          x="334"
          y="234"
          width="110"
          height="26"
          rx="13"
          className="fill-ds-accent/12 stroke-ds-accent/40"
        />
        <text
          x="389"
          y="252"
          textAnchor="middle"
          className={`fill-ds-accent-strong ${MONO}`}
          fontSize="13"
        >
          3 merged
        </text>
      </g>
    </Canvas>
  )
}

/** A chat bubble with the message already typed, above the wa.me link that opens it. */
function Chat() {
  return (
    <Canvas>
      <rect
        x="40"
        y="34"
        width="300"
        height="92"
        rx="18"
        className="fill-ds-surface stroke-ds-border"
      />
      <path d="M52 126 L40 146 L82 126 Z" className="fill-ds-surface stroke-ds-border" />
      <text x="62" y="68" className="fill-ds-text" fontSize="18" fontWeight="600">
        Hi, please share
      </text>
      <text x="62" y="96" className="fill-ds-text" fontSize="18" fontWeight="600">
        your price list.
      </text>
      <rect
        x="62"
        y="106"
        width="96"
        height="9"
        rx="4.5"
        className="lab-grow fill-ds-accent/40 [animation-delay:.3s]"
      />
      <rect
        x="40"
        y="176"
        width="400"
        height="54"
        rx="14"
        className="fill-ds-surface stroke-ds-border"
      />
      <text x="60" y="209" className={`fill-ds-accent-strong ${MONO}`} fontSize="16">
        wa.me/919876543210
      </text>
    </Canvas>
  )
}

export function LabPreview({ kind }: { kind: PreviewKind }) {
  switch (kind) {
    case 'chat':
      return <Chat />
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
    case 'qr':
      return <Qr />
    case 'check':
      return <Check />
    case 'merge':
      return <Merge />
  }
}

export type { PreviewKind }
