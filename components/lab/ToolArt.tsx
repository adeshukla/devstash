import type { ReactNode } from 'react'
import './ToolArt.css'

// One small picture per Lab tool, drawn in the site's own tokens. It shows what the tool does, rests
// in its finished state, and plays when the row or cover is hovered, focused or open. Server
// Component, no JS: every move is a CSS transform or opacity (see ToolArt.css).

const QR_MODULES: [number, number][] = [
  [44, 10],
  [50, 10],
  [46, 15],
  [52, 19],
  [44, 24],
  [50, 28],
  [57, 26],
  [62, 24],
  [44, 33],
  [50, 37],
  [57, 33],
  [62, 37],
  [57, 47],
  [62, 43],
  [50, 47],
  [44, 46],
]

const ART: Record<string, ReactNode> = {
  'utm-builder': (
    <>
      <rect className="card" x="6" y="8" width="84" height="14" rx="7" />
      <circle className="fa" cx="15" cy="15" r="2.5" />
      <rect className="fm" x="22" y="13.5" width="34" height="3" rx="1.5" />
      <g className="k-slide">
        <rect className="fa" x="6" y="30" width="26" height="12" rx="6" />
        <rect className="fl" x="12" y="34.5" width="14" height="3" rx="1.5" />
      </g>
      <g className="k-slide d1">
        <rect className="fp" x="35" y="30" width="26" height="12" rx="6" />
        <rect className="fl" x="41" y="34.5" width="14" height="3" rx="1.5" />
      </g>
      <g className="k-slide d2">
        <rect className="fs" x="64" y="30" width="26" height="12" rx="6" />
        <rect className="fl" x="70" y="34.5" width="14" height="3" rx="1.5" />
      </g>
      <rect className="fm k-growx d3" x="6" y="50" width="62" height="4" rx="2" />
    </>
  ),
  'utm-link-checker': (
    <>
      <rect className="card" x="6" y="8" width="84" height="14" rx="7" />
      <rect className="fm" x="14" y="13.5" width="32" height="3" rx="1.5" />
      <rect className="fw k-bad" x="50" y="13.5" width="22" height="3" rx="1.5" />
      <rect className="fa k-scanx" x="6" y="6" width="2.5" height="18" rx="1.25" />
      <circle className="fs-soft" cx="20" cy="43" r="10" />
      <path className="ss k-draw d1" pathLength="100" d="M15 43 l4 4 l8 -9" />
      <rect className="fm" x="36" y="37" width="44" height="3.5" rx="1.75" />
      <rect className="fm" x="36" y="46" width="28" height="3.5" rx="1.75" />
    </>
  ),
  'utm-report-cleaner': (
    <>
      <rect className="fm k-sink" x="8" y="8" width="62" height="7" rx="3.5" />
      <rect className="fm k-sink d1" x="8" y="19" width="50" height="7" rx="3.5" />
      <rect className="fm k-sink d2" x="8" y="30" width="56" height="7" rx="3.5" />
      <rect className="fa k-growx d3" x="8" y="47" width="80" height="10" rx="5" />
    </>
  ),
  'ga4-event-builder': (
    <>
      <rect className="fa k-grow" x="12" y="40" width="12" height="16" rx="3" />
      <rect className="fp k-grow d1" x="30" y="28" width="12" height="28" rx="3" />
      <rect className="fa k-grow d2" x="48" y="16" width="12" height="40" rx="3" />
      <rect className="fm" x="8" y="58" width="80" height="2" rx="1" />
      <circle className="fs" cx="77" cy="18" r="5" />
      <circle className="k-ping ring" cx="77" cy="18" r="5" />
    </>
  ),
  'og-image-maker': (
    <g className="k-float">
      <rect className="card" x="8" y="6" width="80" height="50" rx="6" />
      <path className="fa-soft" d="M8 32V12a6 6 0 0 1 6-6h68a6 6 0 0 1 6 6v20Z" />
      <circle className="fp" cx="68" cy="17" r="5.5" />
      <path className="fa" d="M8 32 30 17l16 9 12-6 30 12Z" />
      <rect className="fm k-growx d1" x="14" y="39" width="48" height="4" rx="2" />
      <rect className="fm k-growx d2" x="14" y="47" width="30" height="3" rx="1.5" />
    </g>
  ),
  'meta-tag-generator': (
    <>
      <rect className="card" x="6" y="6" width="84" height="52" rx="6" />
      <rect className="fa k-growx" x="14" y="14" width="52" height="5" rx="2.5" />
      <rect className="fs k-growx d1" x="14" y="24" width="26" height="3" rx="1.5" />
      <rect className="fm k-growx d2" x="14" y="32" width="68" height="3" rx="1.5" />
      <rect className="fm k-growx d3" x="14" y="39" width="58" height="3" rx="1.5" />
      <rect className="fm k-growx d3" x="14" y="46" width="40" height="3" rx="1.5" />
    </>
  ),
  'qr-code-generator': (
    <>
      {[
        [26, 10],
        [57, 10],
        [26, 41],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect className="ssm" x={x + 1.5} y={y + 1.5} width="10" height="10" rx="2" />
          <rect className="fa" x={x + 4.5} y={y + 4.5} width="4" height="4" rx="1" />
        </g>
      ))}
      {QR_MODULES.map(([x, y], i) => (
        <rect
          key={`${x}-${y}`}
          className={i % 3 === 0 ? 'fp k-pop d1' : i % 3 === 1 ? 'fa k-pop d2' : 'fm k-pop d3'}
          x={x}
          y={y}
          width="4"
          height="4"
          rx="1"
        />
      ))}
      <rect className="fa-line k-scany" x="22" y="10" width="52" height="2.5" rx="1.25" />
    </>
  ),
  'whatsapp-link-generator': (
    <>
      <g className="k-pop">
        <rect className="card" x="8" y="9" width="48" height="17" rx="8.5" />
        <rect className="fm" x="15" y="15" width="26" height="3" rx="1.5" />
        <rect className="fm" x="15" y="20" width="16" height="3" rx="1.5" />
      </g>
      <g className="k-pop d1">
        <rect className="fs" x="40" y="30" width="48" height="17" rx="8.5" />
        <rect className="fl" x="47" y="36" width="28" height="3" rx="1.5" />
        <rect className="fl" x="47" y="41" width="18" height="3" rx="1.5" />
      </g>
      <circle className="fm k-bounce" cx="14" cy="55" r="2" />
      <circle className="fm k-bounce d1" cx="21" cy="55" r="2" />
      <circle className="fm k-bounce d2" cx="28" cy="55" r="2" />
    </>
  ),
  'css-shapes-playground': (
    <>
      <rect className="fa k-morph" x="10" y="14" width="28" height="28" rx="14" />
      <rect className="ssp k-morph d1" x="46" y="22" width="22" height="22" rx="3" />
      <rect className="fs k-morph d2" x="72" y="38" width="14" height="14" rx="7" />
    </>
  ),
  'illustration-generator': (
    <>
      <path className="sa k-draw" pathLength="100" d="M6 46C22 8 38 8 50 30S78 54 90 20" />
      <circle className="fp k-pop d1" cx="22" cy="16" r="5" />
      <circle className="fa k-pop d2" cx="72" cy="48" r="4" />
      <rect className="fs k-pop d3" x="62" y="10" width="8" height="8" rx="2" />
    </>
  ),
  'ai-content-pipeline': (
    <>
      <rect className="card" x="4" y="22" width="24" height="20" rx="5" />
      <rect className="card" x="36" y="22" width="24" height="20" rx="5" />
      <rect className="card" x="68" y="22" width="24" height="20" rx="5" />
      <rect className="fm" x="28" y="31" width="8" height="2" />
      <rect className="fm" x="60" y="31" width="8" height="2" />
      <rect className="fa" x="9" y="29" width="14" height="3" rx="1.5" />
      <rect className="fm" x="9" y="35" width="9" height="3" rx="1.5" />
      <rect className="fp" x="41" y="29" width="14" height="3" rx="1.5" />
      <rect className="fm" x="41" y="35" width="9" height="3" rx="1.5" />
      <rect className="fs" x="73" y="29" width="14" height="3" rx="1.5" />
      <rect className="fm" x="73" y="35" width="9" height="3" rx="1.5" />
      <circle className="fa k-travel" cx="16" cy="14" r="3" />
    </>
  ),
}
ART['changeable-qr'] = ART['qr-code-generator']

export const hasToolArt = (slug: string) => slug in ART

/** The tool's picture, or nothing for a slug without one. Decorative: hidden from screen readers. */
export function ToolArt({ slug }: { slug: string }) {
  const art = ART[slug]
  if (!art) return null
  return (
    <svg className="ta" viewBox="0 0 96 64" aria-hidden="true" focusable="false">
      {art}
    </svg>
  )
}
