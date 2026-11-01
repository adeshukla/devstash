// Inline SVG graphics for the generated landing pages: a small icon set, a hero
// illustration per kind of page, and soft background rings. Everything is drawn
// with the page's own CSS variables, so each design and both themes recolour it
// for free. Nothing here carries numbers or labels: the art is abstract on
// purpose, because a made-up chart or figure would be a made-up claim.
// Pure strings, no "server-only", so node:test can check them.

import type { PipelineContentType } from '@/types/aiPipeline'

const ICON_PATHS = {
  target:
    '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/>',
  chart: '<path d="M4 20v-6M10 20V6M16 20v-9M22 20H2"/>',
  users:
    '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><circle cx="17.5" cy="9" r="2.5"/><path d="M17 14.6c2.6.2 4.2 1.8 4.5 4.4"/>',
  shield:
    '<path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6l8-3z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16.5 9.5"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 7l8.5 6 8.5-6"/>',
  globe:
    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.8 2.6 4.2 5.6 4.2 9s-1.4 6.4-4.2 9c-2.8-2.6-4.2-5.6-4.2-9S9.2 5.6 12 3z"/>',
  sliders:
    '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  rocket:
    '<path d="M12 3c3.5 1.5 5.5 5 5.5 9l-2 3h-7l-2-3c0-4 2-7.5 5.5-9z"/><circle cx="12" cy="10" r="1.6"/><path d="M9.5 18l-1.5 3M14.5 18l1.5 3"/>',
  megaphone:
    '<path d="M4 10v4l12 5V5L4 10z"/><path d="M7 14.5l1 4.5h2.5l-.8-3.5"/><path d="M19 9.5c1 .8 1 4.2 0 5"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  calendar:
    '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16z"/><path d="M8 7.5h8"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/>',
} as const

export type IconName = keyof typeof ICON_PATHS

/** One line icon, 24x24, drawn in the surrounding text colour. */
export function iconSvg(name: IconName): string {
  return `<svg class="gi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICON_PATHS[name]}</svg>`
}

// First match wins, so the more specific words come first.
const KEYWORD_ICONS: [RegExp, IconName][] = [
  [/\b(secur\w*|safe\w*|privacy|protect\w*|trust\w*|complian\w*|risk)\b/i, 'shield'],
  [/\b(time|fast\w*|quick\w*|speed\w*|schedul\w*|deadline|hours?|minutes?|wait\w*)\b/i, 'clock'],
  [/\b(team|people|customers?|clients?|users?|staff|community|together|partner\w*)\b/i, 'users'],
  [
    /\b(data|analytics?|measure\w*|report\w*|track\w*|result\w*|growth|metrics?|numbers?)\b/i,
    'chart',
  ],
  [/\b(email|message|contact|talk|call|reply|support|ask|question\w*)\b/i, 'mail'],
  [/\b(goal|target|focus\w*|strategy|plan\w*|aim|priorit\w*)\b/i, 'target'],
  [/\b(campaign|reach|audience|market\w*|promot\w*|advert\w*|offer)\b/i, 'megaphone'],
  [/\b(launch\w*|start\w*|begin\w*|new|grow\w*|first)\b/i, 'rocket'],
  [/\b(learn\w*|guide|document\w*|read\w*|explain\w*|understand\w*|train\w*)\b/i, 'book'],
  [/\b(date|event|agenda|webinar|workshop|session|week\w*|month\w*)\b/i, 'calendar'],
  [/\b(online|web\w*|site|global|remote|digital|internet)\b/i, 'globe'],
  [/\b(set\w*|custom\w*|adjust\w*|tune|configur\w*|control\w*|choose|option\w*)\b/i, 'sliders'],
  [/\b(connect\w*|integrat\w*|link\w*|join\w*|share\w*)\b/i, 'link'],
  [/\b(stack|layer\w*|structure|system|process|step\w*|build\w*)\b/i, 'layers'],
  [/\b(done|complete\w*|checklist|verified|included|deliver\w*)\b/i, 'check'],
]

// Used when no keyword matches, in this order, so neighbours never repeat.
const FALLBACK_ORDER: IconName[] = [
  'spark',
  'check',
  'layers',
  'target',
  'users',
  'chart',
  'globe',
  'link',
]

/** An icon that suits the text, or a stable fallback by position. */
export function pickIcon(text: string, index: number): IconName {
  for (const [re, name] of KEYWORD_ICONS) if (re.test(text)) return name
  return FALLBACK_ORDER[index % FALLBACK_ORDER.length]
}

/** Icons for a list of items that avoids showing the same icon twice in a row. */
export function pickIcons(texts: string[]): IconName[] {
  const out: IconName[] = []
  texts.forEach((text, i) => {
    let name = pickIcon(text, i)
    if (out.length && out[out.length - 1] === name)
      name = FALLBACK_ORDER[(i + out.length) % FALLBACK_ORDER.length]
    out.push(name)
  })
  return out
}

/** The CSS that styles every graphic; each design adds its own placement rules. */
export const GRAPHICS_CSS = `
  .gi { width: 1.4rem; height: 1.4rem; display: block; flex: none; }
  .ico-badge { display: inline-grid; place-items: center; width: 2.6rem; height: 2.6rem; border-radius: 12px; flex: none;
    background: color-mix(in srgb, var(--accent) 14%, transparent); color: var(--accent); }
  .hero-art { display: block; width: 100%; height: auto; max-height: 26rem; color: var(--text); }
  .art-bg   { fill: var(--surface); stroke: var(--border); }
  .art-bg2  { fill: var(--surface-2); stroke: var(--border); }
  .art-line { fill: none; stroke: var(--border); stroke-width: 2; stroke-linecap: round; }
  .art-ink  { fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; opacity: .85; }
  .art-fill { fill: var(--accent); }
  .art-fill2 { fill: var(--accent-2); }
  .art-soft { fill: color-mix(in srgb, var(--accent) 18%, transparent); }
  .art-stroke { fill: none; stroke: var(--accent); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
  .art-muted { fill: color-mix(in srgb, var(--text) 14%, transparent); }
  .rings { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; color: var(--accent); }
  .rings circle { fill: none; stroke: currentColor; stroke-opacity: .16; stroke-width: 1.5; }
  @media (prefers-reduced-motion: no-preference) {
    .art-float { animation: art-float 7s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
    .art-float.b { animation-delay: -2.4s; }
    .art-float.c { animation-delay: -4.6s; }
  }
  @keyframes art-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }`

const SVG_OPEN = (label = '', box = '0 0 480 360') =>
  `<svg class="hero-art" viewBox="${box}" role="img" aria-label="${label}" focusable="false">`

/** Growth bars and a rising line inside a window. Abstract: no axis, no figures. */
function barsArt(): string {
  return `${SVG_OPEN('Abstract illustration of growth')}
<rect x="40" y="36" width="400" height="288" rx="22" class="art-bg"/>
<rect x="64" y="62" width="120" height="12" rx="6" class="art-muted"/>
<rect x="64" y="84" width="76" height="9" rx="4.5" class="art-muted" opacity=".6"/>
<path d="M72 290V230M128 290V200M184 290V214M240 290V170M296 290V140M352 290V104" class="art-line" style="stroke-width:30" stroke-linecap="round" opacity=".55"/>
<path d="M72 290V252M128 290V226M184 290V240M240 290V198M296 290V168M352 290V126" class="art-stroke" style="stroke-width:30" opacity=".9"/>
<path d="M64 232 C120 214 150 224 196 190 S280 150 330 118 S390 84 408 78" class="art-ink" style="stroke-width:3.4"/>
<g class="art-float"><circle cx="408" cy="78" r="15" class="art-fill"/><path d="M401 78l5 5 9-10" fill="none" stroke="var(--on-accent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g>
<g class="art-float b"><rect x="370" y="248" width="86" height="44" rx="14" class="art-bg2"/><circle cx="394" cy="270" r="9" class="art-fill2"/><rect x="410" y="263" width="34" height="8" rx="4" class="art-muted"/><rect x="410" y="276" width="22" height="7" rx="3.5" class="art-muted" opacity=".6"/></g>
</svg>`
}

/** Three connected steps, like the process a service page describes. */
function flowArt(): string {
  const node = (x: number, y: number, tone: string, ico: string) =>
    `<g class="art-float ${tone}"><rect x="${x}" y="${y}" width="112" height="112" rx="26" class="art-bg"/><circle cx="${x + 56}" cy="${y + 46}" r="22" class="art-soft"/><g transform="translate(${x + 38} ${y + 28}) scale(1.5)" fill="none" stroke="var(--accent)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ico}</g><rect x="${x + 24}" y="${y + 84}" width="64" height="8" rx="4" class="art-muted"/></g>`
  return `${SVG_OPEN('Abstract illustration of three connected steps', '0 78 480 240')}
<path d="M120 154 C168 154 168 200 216 200 S264 154 312 154" class="art-line" stroke-dasharray="3 12" style="stroke-width:3"/>
<path d="M168 262 C200 262 216 236 240 236" class="art-line" stroke-dasharray="3 12" style="stroke-width:3" opacity="0"/>
${node(24, 98, '', ICON_PATHS.target)}
${node(184, 144, 'b', ICON_PATHS.layers)}
${node(344, 98, 'c', ICON_PATHS.check)}
<rect x="84" y="290" width="312" height="14" rx="7" class="art-soft"/>
<rect x="84" y="290" width="168" height="14" rx="7" class="art-fill"/>
</svg>`
}

/** A product window with a sidebar, cards and one accent button. */
function windowArt(): string {
  return `${SVG_OPEN('Abstract illustration of an application window')}
<rect x="36" y="40" width="408" height="280" rx="22" class="art-bg"/>
<path d="M36 80h408" class="art-line"/>
<circle cx="64" cy="60" r="6" class="art-fill2"/><circle cx="84" cy="60" r="6" class="art-soft"/><circle cx="104" cy="60" r="6" class="art-soft"/>
<rect x="56" y="100" width="92" height="198" rx="14" class="art-bg2"/>
<rect x="68" y="116" width="68" height="10" rx="5" class="art-fill"/>
<rect x="68" y="140" width="56" height="8" rx="4" class="art-muted"/>
<rect x="68" y="160" width="62" height="8" rx="4" class="art-muted"/>
<rect x="68" y="180" width="48" height="8" rx="4" class="art-muted"/>
<rect x="168" y="100" width="132" height="86" rx="14" class="art-bg2"/>
<rect x="316" y="100" width="108" height="86" rx="14" class="art-soft"/>
<path d="M182 168c14-22 28-4 42-18s26-22 62-26" class="art-stroke"/>
<rect x="168" y="204" width="256" height="14" rx="7" class="art-muted"/>
<rect x="168" y="228" width="196" height="10" rx="5" class="art-muted" opacity=".6"/>
<rect x="168" y="256" width="104" height="36" rx="12" class="art-fill"/>
<g class="art-float"><rect x="326" y="244" width="116" height="54" rx="16" class="art-bg"/><circle cx="352" cy="271" r="12" class="art-fill2"/><rect x="372" y="259" width="52" height="9" rx="4.5" class="art-muted"/><rect x="372" y="276" width="36" height="8" rx="4" class="art-muted" opacity=".6"/></g>
</svg>`
}

/** A centre with orbiting nodes: a company and the people around it. */
function orbitArt(): string {
  const sat = (cx: number, cy: number, ico: string, tone: string) =>
    `<g class="art-float ${tone}"><circle cx="${cx}" cy="${cy}" r="34" class="art-bg"/><g transform="translate(${cx - 18} ${cy - 18}) scale(1.5)" fill="none" stroke="var(--accent)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ico}</g></g>`
  return `${SVG_OPEN('Abstract illustration of a company with people around it')}
<circle cx="240" cy="180" r="150" class="art-line" stroke-dasharray="2 12"/>
<circle cx="240" cy="180" r="100" class="art-line"/>
<circle cx="240" cy="180" r="58" class="art-soft"/>
<circle cx="240" cy="180" r="38" class="art-fill"/>
<g transform="translate(222 162) scale(1.5)" fill="none" stroke="var(--on-accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS.spark}</g>
${sat(240, 40, ICON_PATHS.users, '')}
${sat(380, 196, ICON_PATHS.globe, 'b')}
${sat(110, 224, ICON_PATHS.shield, 'c')}
${sat(300, 322, ICON_PATHS.chart, '')}
</svg>`
}

/** A month grid with one highlighted day and a pin, for events. */
function calendarArt(): string {
  const cells: string[] = []
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 6; c++) {
      const hit = r === 1 && c === 3
      cells.push(
        `<rect x="${64 + c * 56}" y="${130 + r * 46}" width="44" height="34" rx="10" class="${hit ? 'art-fill' : 'art-bg2'}"/>`
      )
    }
  return `${SVG_OPEN('Abstract illustration of a calendar with one day marked')}
<rect x="36" y="48" width="408" height="268" rx="24" class="art-bg"/>
<path d="M36 100h408" class="art-line"/>
<rect x="68" y="66" width="120" height="14" rx="7" class="art-muted"/>
<path d="M396 66l12 12 12-12" class="art-ink" style="stroke-width:3"/>
${cells.join('\n')}
<g class="art-float"><path d="M258 98c-14 0-24 10-24 23 0 17 24 38 24 38s24-21 24-38c0-13-10-23-24-23z" class="art-fill2"/><circle cx="258" cy="121" r="8" fill="var(--bg)"/></g>
<g class="art-float b"><rect x="330" y="262" width="104" height="48" rx="16" class="art-bg"/><circle cx="356" cy="286" r="11" class="art-soft"/><rect x="376" y="274" width="44" height="9" rx="4.5" class="art-muted"/><rect x="376" y="291" width="30" height="8" rx="4" class="art-muted" opacity=".6"/></g>
</svg>`
}

/** Concentric rings with an arrow and a check, for a sales page. */
function targetArt(): string {
  return `${SVG_OPEN('Abstract illustration of a target being hit')}
<circle cx="220" cy="190" r="140" class="art-bg"/>
<circle cx="220" cy="190" r="104" class="art-soft"/>
<circle cx="220" cy="190" r="68" class="art-bg2"/>
<circle cx="220" cy="190" r="32" class="art-fill"/>
<path d="M220 190L396 58" class="art-ink" style="stroke-width:4"/>
<path d="M372 58h28v28" class="art-ink" style="stroke-width:4"/>
<g class="art-float"><circle cx="388" cy="262" r="40" class="art-bg"/><circle cx="388" cy="262" r="26" class="art-fill2"/><path d="M376 262l9 9 16-18" fill="none" stroke="var(--bg)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>
<g class="art-float b"><rect x="40" y="60" width="104" height="44" rx="14" class="art-bg2"/><rect x="58" y="76" width="68" height="9" rx="4.5" class="art-muted"/></g>
</svg>`
}

const ART_FOR_TYPE: Record<PipelineContentType, () => string> = {
  marketing: barsArt,
  'case-study': barsArt,
  service: flowArt,
  explainer: flowArt,
  product: windowArt,
  technical: windowArt,
  company: orbitArt,
  event: calendarArt,
  sales: targetArt,
}

/** The hero illustration that fits the kind of page. */
export function heroArt(type: PipelineContentType): string {
  return ART_FOR_TYPE[type]()
}

/** Soft rings behind a closing call to action. Decorative. */
export function ringsSvg(): string {
  return `<svg class="rings" viewBox="0 0 600 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><circle cx="540" cy="40" r="90"/><circle cx="540" cy="40" r="150"/><circle cx="540" cy="40" r="210"/><circle cx="40" cy="220" r="70"/><circle cx="40" cy="220" r="130"/></svg>`
}
