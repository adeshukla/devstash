import type { ReactNode } from 'react'
import './ToolArt.css'

// A small picture per Lab tool: a mini screen of the tool itself, with its own words and numbers, in
// the site's tokens. It rests in its finished state and plays while its cover is hovered or focused
// (and always on touch screens). Server Component, no JS: moves are CSS transform and opacity only.

/** The window every picture sits in: dots, a title, a divider. */
function Win({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <rect className="card" x="8" y="6" width="224" height="138" rx="10" />
      <circle className="fm" cx="22" cy="19" r="3" />
      <circle className="fm" cx="32" cy="19" r="3" />
      <circle className="fm" cx="42" cy="19" r="3" />
      <text className="tx" x="56" y="22">
        {title}
      </text>
      <rect className="fm" x="8" y="31" width="224" height="1" />
      {children}
    </>
  )
}

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

function Qr({ changeable }: { changeable: boolean }) {
  return (
    <Win title="QR code">
      {/* The code is drawn on a 44-unit grid and scaled into the window */}
      <g transform="translate(26 40) scale(1.7) translate(-26 -10)">
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
      </g>
      <text className="tt" x="124" y="58">
        Scan to open
      </text>
      <text className="tx" x="124" y="73">
        shop.example/menu
      </text>
      <rect className={changeable ? 'card' : 'fa'} x="124" y="86" width="38" height="16" rx="8" />
      <text
        className={changeable ? 'tx' : 'twh'}
        x="143"
        y="97"
        textAnchor="middle"
        style={{ fontSize: 9 }}
      >
        Fixed
      </text>
      <rect className={changeable ? 'fa' : 'card'} x="166" y="86" width="62" height="16" rx="8" />
      <text
        className={changeable ? 'twh' : 'tx'}
        x="197"
        y="97"
        textAnchor="middle"
        style={{ fontSize: 9 }}
      >
        Changeable
      </text>
      <text className="tgr" x="124" y="122">
        {changeable ? 'same code, new page' : 'never expires'}
      </text>
    </Win>
  )
}

const ART: Record<string, ReactNode> = {
  'meta-tag-generator': (
    <Win title="Google preview">
      <circle className="fa" cx="28" cy="52" r="5" />
      <text className="tx" x="38" y="55">
        shop.example
      </text>
      <text className="tac k-slide" x="22" y="77" style={{ fontSize: 11 }}>
        Shoes &amp; Socks | Spring Sale
      </text>
      <text className="tgr k-slide d1" x="22" y="93">
        https://shop.example/spring
      </text>
      <text className="tx k-slide d2" x="22" y="109">
        Free shipping on running shoes and
      </text>
      <text className="tx k-slide d3" x="22" y="122">
        socks. New spring range now in.
      </text>
      <g className="k-pop d3">
        <rect className="fs-soft" x="172" y="42" width="50" height="16" rx="8" />
        <text className="tgr" x="197" y="53" textAnchor="middle">
          27/60
        </text>
      </g>
    </Win>
  ),
  'og-image-maker': (
    <Win title="Share image">
      <text className="tx" x="226" y="22" textAnchor="end">
        1200×630
      </text>
      <g className="k-float">
        <rect className="card" x="40" y="42" width="160" height="92" rx="7" />
        <path className="fa-soft" d="M40 96V49a7 7 0 0 1 7-7h146a7 7 0 0 1 7 7v47Z" />
        <circle className="fp" cx="172" cy="62" r="8" />
        <path className="fa" d="M40 96 86 66l28 18 24-12 62 24Z" />
        <text className="tt k-slide d1" x="50" y="112" style={{ fontSize: 11, fontWeight: 700 }}>
          Spring sale: 20% off
        </text>
        <text className="tx k-slide d2" x="50" y="126">
          shop.example
        </text>
      </g>
    </Win>
  ),
  'utm-builder': (
    <Win title="Link builder">
      <rect className="card" x="22" y="42" width="196" height="22" rx="11" />
      <circle className="fa" cx="34" cy="53" r="3" />
      <text className="tt" x="44" y="57">
        shop.example/sale
      </text>
      <g className="k-slide">
        <rect className="fa" x="22" y="74" width="108" height="18" rx="9" />
        <text className="twh" x="76" y="86" textAnchor="middle" style={{ fontSize: 9 }}>
          source=newsletter
        </text>
      </g>
      <g className="k-slide d1">
        <rect className="fp" x="136" y="74" width="82" height="18" rx="9" />
        <text className="twh" x="177" y="86" textAnchor="middle" style={{ fontSize: 9 }}>
          medium=email
        </text>
      </g>
      <g className="k-slide d2">
        <rect className="fs" x="22" y="98" width="98" height="18" rx="9" />
        <text className="twh" x="71" y="110" textAnchor="middle" style={{ fontSize: 9 }}>
          campaign=spring
        </text>
      </g>
      <text className="tac k-slide d3" x="22" y="132" style={{ fontSize: 9 }}>
        /sale?utm_source=newsletter&amp;…
      </text>
    </Win>
  ),
  'utm-link-checker': (
    <Win title="Link checker">
      <text className="tt" x="22" y="57">
        …/sale?utm_medium=Email
      </text>
      <rect className="fw k-bad" x="130" y="61" width="30" height="2" rx="1" />
      <rect className="fa k-scanx" x="20" y="44" width="2.5" height="22" rx="1.25" />
      <circle className="fw" cx="28" cy="84" r="5" />
      <text className="twn" x="40" y="87">
        Medium should be lowercase
      </text>
      <circle className="fs-soft" cx="29" cy="112" r="10" />
      <path className="ss k-draw d1" pathLength="100" d="M24 112 l4 4 l8 -9" />
      <text className="tgr" x="46" y="109">
        Cleaned link
      </text>
      <text className="tx" x="46" y="123">
        …/sale?utm_medium=email
      </text>
    </Win>
  ),
  'utm-report-cleaner': (
    <Win title="Report cleaner">
      <text className="tx" x="22" y="48">
        campaign
      </text>
      <text className="tx" x="218" y="48" textAnchor="end">
        sessions
      </text>
      {[
        ['spring_sale', '120', 66, ''],
        ['Spring_Sale', '80', 80, 'd1'],
        ['spring-sale', '45', 94, 'd2'],
      ].map(([name, n, y, d]) => (
        <g key={name} className={`k-sink ${d}`}>
          <text className="tx" x="22" y={y}>
            {name}
          </text>
          <text className="tx" x="218" y={y} textAnchor="end">
            {n}
          </text>
        </g>
      ))}
      <rect className="fa-soft k-growx d3" x="18" y="108" width="204" height="24" rx="6" />
      <text className="tt" x="26" y="124" style={{ fontWeight: 700 }}>
        spring_sale
      </text>
      <text className="tt" x="214" y="124" textAnchor="end" style={{ fontWeight: 700 }}>
        245
      </text>
    </Win>
  ),
  'ga4-event-builder': (
    <Win title="GA4 event">
      <text className="tx" x="22" y="54">
        gtag(&apos;event&apos;, <tspan className="tac">&apos;sign_up&apos;</tspan>, {'{'}
      </text>
      <text className="tx" x="34" y="69">
        method: <tspan className="tgr">&apos;email&apos;</tspan>
      </text>
      <text className="tx" x="22" y="84">
        {'});'}
      </text>
      <g className="k-pop d1">
        <rect className="fs-soft" x="22" y="98" width="124" height="22" rx="11" />
        <path className="ss" d="M33 109l4 4 8-9" />
        <text className="tgr" x="52" y="113">
          event name is valid
        </text>
      </g>
      <circle className="fs" cx="196" cy="62" r="5" />
      <circle className="k-ping ring" cx="196" cy="62" r="5" />
      <text className="tx" x="196" y="84" textAnchor="middle">
        live
      </text>
    </Win>
  ),
  'qr-code-generator': <Qr changeable={false} />,
  'changeable-qr': <Qr changeable />,
  'whatsapp-link-generator': (
    <Win title="WhatsApp link">
      <g className="k-pop">
        <rect className="card" x="22" y="42" width="152" height="24" rx="12" />
        <text className="tx" x="34" y="58">
          Hi, can I get a quote?
        </text>
      </g>
      <g className="k-pop d1">
        <rect className="fs" x="70" y="74" width="150" height="24" rx="12" />
        <text className="twh" x="82" y="90">
          Hi! Sure, one moment.
        </text>
      </g>
      <rect className="card" x="22" y="108" width="146" height="22" rx="11" />
      <text className="tac" x="34" y="123">
        wa.me/91XXXXXXXXXX
      </text>
      <circle className="fm k-bounce" cx="190" cy="119" r="2.4" />
      <circle className="fm k-bounce d1" cx="199" cy="119" r="2.4" />
      <circle className="fm k-bounce d2" cx="208" cy="119" r="2.4" />
    </Win>
  ),
  'css-shapes-playground': (
    <Win title="Shape">
      <rect className="fa k-morph" x="26" y="46" width="46" height="46" rx="23" />
      <rect className="ssp k-morph d1" x="82" y="58" width="28" height="28" rx="4" />
      <rect className="fs k-morph d2" x="44" y="102" width="18" height="18" rx="9" />
      <text className="tx" x="120" y="62">
        border-radius:
      </text>
      <text className="tac" x="120" y="77">
        30% 70% 70% 30% /
      </text>
      <text className="tac" x="120" y="91">
        30% 30% 70% 70%;
      </text>
      <text className="tgr" x="120" y="116">
        Copy CSS
      </text>
    </Win>
  ),
  'illustration-generator': (
    <Win title="Illustration">
      <rect className="card" x="22" y="40" width="196" height="20" rx="6" />
      <text className="tx" x="32" y="54">
        quarterly sales dashboard
      </text>
      <path className="sa k-draw" pathLength="100" d="M22 122C58 70 92 70 122 100S182 128 218 78" />
      <circle className="fp k-pop d1" cx="62" cy="84" r="6" />
      <circle className="fa k-pop d2" cx="170" cy="116" r="5" />
      <rect className="fs k-pop d3" x="186" y="68" width="9" height="9" rx="2" />
    </Win>
  ),
  'ai-content-pipeline': (
    <Win title="AI pipeline">
      {[
        ['Scaffold', 22, 'fa'],
        ['Copy-edit', 86, 'fp'],
        ['SEO fields', 150, 'fs'],
      ].map(([label, x, c]) => (
        <g key={label as string}>
          <rect className="card" x={x as number} y="56" width="62" height="40" rx="6" />
          <rect className={c as string} x={(x as number) + 8} y="64" width="22" height="4" rx="2" />
          <text className="tt" x={(x as number) + 31} y="86" textAnchor="middle">
            {label}
          </text>
        </g>
      ))}
      <rect className="fm" x="84" y="76" width="2" height="2" />
      <rect className="fm" x="148" y="76" width="2" height="2" />
      <circle className="fa k-travel" cx="30" cy="44" r="3" />
      <text className="tx" x="120" y="122" textAnchor="middle">
        Leaves [TODO] where only you know
      </text>
    </Win>
  ),
}

export const hasToolArt = (slug: string) => slug in ART

/** The tool's picture, or nothing for a slug without one. Decorative: hidden from screen readers. */
export function ToolArt({ slug }: { slug: string }) {
  const art = ART[slug]
  if (!art) return null
  return (
    <svg className="ta" viewBox="0 0 240 150" aria-hidden="true" focusable="false">
      {art}
    </svg>
  )
}
