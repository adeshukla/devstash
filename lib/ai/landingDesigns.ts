import 'server-only'
import {
  escapeHtml,
  CONTACT_FORM_HTML,
  CONTACT_FORM_CSS,
  CONTACT_FORM_JS,
} from '@/lib/ai/landingPageParts'
import { REVEAL_SAFE_CSS, THEME_TOGGLE_JS } from '@/lib/ai/landingPageChrome'
import {
  articleOutline,
  buildContentSections,
  CONTENT_SECTIONS_CSS,
} from '@/lib/ai/contentSections'
import type { DemoFrontmatter, PageCopy, PageDesignId } from '@/types/aiPipeline'

/**
 * Hand-built page designs for the pipeline's landing page.
 *
 * The model used to write the whole HTML document against one fixed layout
 * spec, so every run came back as the same centred hero, the same blurred
 * gradient blob and the same three cards. Now the model writes only the copy
 * (validated JSON) and every design here renders it: its own type, palette,
 * hero and section structure, all responsive down to 300px because the CSS is
 * ours, not the model's. Rendering is deterministic, so one run can return
 * every design and the visitor picks.
 *
 * Every design includes the full humanised article (buildContentSections) and
 * the same contact form. No network requests: system font stacks only.
 */

interface Palette {
  bg: string
  surface: string
  surface2: string
  border: string
  text: string
  muted: string
  accent: string
  onAccent: string
  accent2: string
  /** Solid hero block (used by the designs that have one). */
  heroBg: string
  onHero: string
  onHeroMuted: string
}

interface RenderContext {
  copy: PageCopy
  fm: DemoFrontmatter
  outline: { id: string; heading: string }[]
}

interface Design {
  id: PageDesignId
  name: string
  blurb: string
  light: Palette
  dark: Palette
  fontBody: string
  fontDisplay: string
  css: string
  hero: (ctx: RenderContext) => string
  features: (ctx: RenderContext) => string
  closing: (ctx: RenderContext) => string
}

const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, Cambria, serif'
const ROUNDED = 'ui-rounded, "SF Pro Rounded", system-ui, -apple-system, "Segoe UI", sans-serif'
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

const e = escapeHtml

function tags(fm: DemoFrontmatter, cls = 'tag'): string {
  return fm.tags
    .slice(0, 5)
    .map((t) => `<li class="${cls}">${e(t)}</li>`)
    .join('')
}

const pad2 = (n: number) => String(n).padStart(2, '0')

// ─── Designs ─────────────────────────────────────────────────────────────────

const editorial: Design = {
  id: 'editorial',
  name: 'Editorial',
  blurb: 'Serif type on warm paper, ruled like a magazine feature.',
  light: {
    bg: '#FBF8F3',
    surface: '#F4EFE7',
    surface2: '#ECE5DA',
    border: '#DDD3C4',
    text: '#1F1A14',
    muted: '#5A5045',
    accent: '#A63F1B',
    onAccent: '#FFFFFF',
    accent2: '#7A5C2E',
    heroBg: '#1F1A14',
    onHero: '#FBF8F3',
    onHeroMuted: '#D9CFC1',
  },
  dark: {
    bg: '#16120F',
    surface: '#1F1A15',
    surface2: '#29221B',
    border: '#3A3128',
    text: '#F2ECE3',
    muted: '#B9AD9D',
    accent: '#E58A62',
    onAccent: '#1A120C',
    accent2: '#CDA86D',
    heroBg: '#F2ECE3',
    onHero: '#16120F',
    onHeroMuted: '#4A4036',
  },
  fontBody: SERIF,
  fontDisplay: SERIF,
  css: `
  .ed-hero { padding: clamp(3.5rem,9vw,7rem) 1.25rem clamp(2.5rem,6vw,4rem); }
  .ed-meta { display: flex; flex-wrap: wrap; gap: .4rem 1.25rem; margin: 0 0 2rem; padding: 0 0 1rem;
    list-style: none; border-bottom: 1px solid var(--border);
    font: 600 .75rem/1.5 ${MONO}; letter-spacing: .14em; text-transform: uppercase; color: var(--accent); }
  .ed-hero h1 { font-size: clamp(2.25rem,6.6vw,4.4rem); line-height: 1.03; font-weight: 600; letter-spacing: -.025em; margin: 0; }
  .ed-lead { font-size: clamp(1.125rem,2.4vw,1.4rem); line-height: 1.55; font-style: italic; color: var(--muted); max-width: 38ch; margin: 1.5rem 0 2rem; }
  .ed-points { list-style: none; margin: 0 auto; padding: 0; max-width: 1080px; display: grid; grid-template-columns: 1fr; border-top: 2px solid var(--text); }
  .ed-point { padding: 1.75rem 0; border-bottom: 1px solid var(--border); min-width: 0; }
  @media (min-width: 820px) {
    .ed-points { grid-template-columns: repeat(3, minmax(0,1fr)); }
    .ed-point { padding: 1.75rem 1.75rem 1.75rem 0; border-bottom: 0; }
    .ed-point + .ed-point { padding-left: 1.75rem; border-left: 1px solid var(--border); }
  }
  .ed-num { display: block; font: 600 .78rem ${MONO}; letter-spacing: .12em; color: var(--accent); margin-bottom: .75rem; }
  .ed-point h3 { font-size: 1.35rem; font-weight: 600; margin: 0 0 .5rem; }
  .ed-point p { margin: 0; color: var(--muted); }
  .ed-close { text-align: center; padding: clamp(4rem,10vw,7rem) 1.25rem; border-top: 1px solid var(--border); }
  .ed-close h2 { font-size: clamp(1.9rem,5vw,3rem); font-weight: 600; font-style: italic; max-width: 22ch; margin: 0 auto 1rem; }
  .ed-close p { color: var(--muted); max-width: 50ch; margin: 0 auto 2rem; }`,
  hero: ({ copy, fm }) => `
<section class="ed-hero">
  <div class="ds-narrow">
    <ul class="ed-meta"><li>${e(fm.category)}</li><li>${fm.readingTime} min read</li></ul>
    <h1>${e(copy.heroTitle)}</h1>
    <p class="ed-lead">${e(copy.heroLead)}</p>
    <a class="btn" href="#contact">${e(copy.cta)}</a>
  </div>
</section>`,
  features: ({ copy }) => `
<section class="ds-section reveal" aria-label="Key points">
  <ol class="ed-points">
    ${copy.features.map((f, i) => `<li class="ed-point"><span class="ed-num">${pad2(i + 1)}</span><h3>${e(f.title)}</h3><p>${e(f.body)}</p></li>`).join('')}
  </ol>
</section>`,
  closing: ({ copy }) => `
<section class="ed-close reveal">
  <h2>${e(copy.closingTitle)}</h2>
  ${copy.closingLead ? `<p>${e(copy.closingLead)}</p>` : ''}
  <a class="btn" href="#contact">${e(copy.cta)}</a>
</section>`,
}

const split: Design = {
  id: 'split',
  name: 'Product split',
  blurb: 'Crisp product layout: copy on one side, a live contents card on the other.',
  light: {
    bg: '#FFFFFF',
    surface: '#F6F7FB',
    surface2: '#EDEFF6',
    border: '#DFE2EC',
    text: '#111827',
    muted: '#4B5563',
    accent: '#4338CA',
    onAccent: '#FFFFFF',
    accent2: '#0369A1',
    heroBg: '#111827',
    onHero: '#FFFFFF',
    onHeroMuted: '#CBD5E1',
  },
  dark: {
    bg: '#0D0F15',
    surface: '#141720',
    surface2: '#1B1F2C',
    border: '#262B3B',
    text: '#EEF0F6',
    muted: '#A3A9BC',
    accent: '#A5B4FC',
    onAccent: '#11132A',
    accent2: '#7DD3FC',
    heroBg: '#EEF0F6',
    onHero: '#0D0F15',
    onHeroMuted: '#3B4256',
  },
  fontBody: SANS,
  fontDisplay: SANS,
  css: `
  .sp-hero { padding: clamp(3rem,8vw,6rem) 1.25rem; }
  .sp-grid { display: grid; gap: clamp(2rem,5vw,4rem); grid-template-columns: 1fr; align-items: center; }
  @media (min-width: 900px) { .sp-grid { grid-template-columns: minmax(0,1.15fr) minmax(0,.85fr); } }
  .sp-hero h1 { font-size: clamp(2.1rem,5.2vw,3.6rem); line-height: 1.05; font-weight: 750; letter-spacing: -.03em; margin: 0; }
  .sp-lead { font-size: clamp(1.05rem,2vw,1.2rem); color: var(--muted); max-width: 52ch; margin: 1.25rem 0 1.75rem; }
  .sp-actions { display: flex; flex-wrap: wrap; align-items: center; gap: .75rem 1.25rem; }
  .sp-actions .tags { margin: 0; }
  .sp-toc { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 1.25rem; min-width: 0;
    box-shadow: 0 30px 60px -40px rgba(0, 0, 0, .45); }
  .sp-toc-h { margin: 0 0 .75rem .5rem; font: 600 .72rem ${MONO}; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
  .sp-toc ol { list-style: none; margin: 0; padding: 0; display: grid; gap: .15rem; }
  .sp-toc a { display: grid; grid-template-columns: 2.1rem minmax(0,1fr); gap: .5rem; padding: .7rem .6rem; border-radius: 10px;
    color: var(--text); text-decoration: none; font-size: .95rem; line-height: 1.4; transition: background .2s ease; }
  .sp-toc a:hover { background: var(--surface2); }
  .sp-toc span { font: 600 .78rem/1.8 ${MONO}; color: var(--accent); }
  .sp-cards { list-style: none; margin: 0 auto; padding: 0; display: grid; gap: 1rem; grid-template-columns: 1fr; }
  @media (min-width: 760px) { .sp-cards { grid-template-columns: repeat(3, minmax(0,1fr)); } }
  .sp-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 1.5rem; min-width: 0; }
  .sp-icon { display: inline-grid; place-items: center; width: 2.25rem; height: 2.25rem; border-radius: 10px; margin-bottom: 1rem;
    background: color-mix(in srgb, var(--accent) 14%, transparent); color: var(--accent); font: 700 .85rem ${MONO}; }
  .sp-card h3 { margin: 0 0 .4rem; font-size: 1.1rem; }
  .sp-card p { margin: 0; color: var(--muted); font-size: .97rem; }
  .sp-band { display: grid; gap: 1.5rem; grid-template-columns: 1fr; align-items: center; background: var(--surface2);
    border: 1px solid var(--border); border-radius: 24px; padding: clamp(1.75rem,5vw,3rem); }
  @media (min-width: 760px) { .sp-band { grid-template-columns: minmax(0,1fr) auto; } }
  .sp-band h2 { margin: 0 0 .35rem; }
  .sp-band p { margin: 0; color: var(--muted); }`,
  hero: ({ copy, fm, outline }) => `
<section class="sp-hero">
  <div class="ds-wrap sp-grid">
    <div>
      <p class="eyebrow">${e(fm.category)} · ${fm.readingTime} min read</p>
      <h1>${e(copy.heroTitle)}</h1>
      <p class="sp-lead">${e(copy.heroLead)}</p>
      <div class="sp-actions">
        <a class="btn" href="#contact">${e(copy.cta)}</a>
        <ul class="tags">${tags(fm)}</ul>
      </div>
    </div>
    ${
      outline.length
        ? `<nav class="sp-toc" aria-label="In this page"><p class="sp-toc-h">In this page</p><ol>${outline
            .slice(0, 6)
            .map(
              (o, i) => `<li><a href="#${o.id}"><span>${pad2(i + 1)}</span>${e(o.heading)}</a></li>`
            )
            .join('')}</ol></nav>`
        : ''
    }
  </div>
</section>`,
  features: ({ copy }) => `
<section class="ds-section reveal" aria-label="Key points">
  <ul class="ds-wrap sp-cards">
    ${copy.features.map((f, i) => `<li class="sp-card"><span class="sp-icon" aria-hidden="true">${pad2(i + 1)}</span><h3>${e(f.title)}</h3><p>${e(f.body)}</p></li>`).join('')}
  </ul>
</section>`,
  closing: ({ copy }) => `
<section class="ds-section reveal">
  <div class="ds-wrap sp-band">
    <div><h2>${e(copy.closingTitle)}</h2>${copy.closingLead ? `<p>${e(copy.closingLead)}</p>` : ''}</div>
    <a class="btn" href="#contact">${e(copy.cta)}</a>
  </div>
</section>`,
}

const bento: Design = {
  id: 'bento',
  name: 'Bento grid',
  blurb: 'Rounded tiles of different sizes; the main point gets the big one.',
  light: {
    bg: '#F4F4F2',
    surface: '#FFFFFF',
    surface2: '#EBEBE8',
    border: '#E0E0DC',
    text: '#18181B',
    muted: '#52525B',
    accent: '#047857',
    onAccent: '#FFFFFF',
    accent2: '#A16207',
    heroBg: '#18181B',
    onHero: '#FFFFFF',
    onHeroMuted: '#D4D4D8',
  },
  dark: {
    bg: '#0B0B0C',
    surface: '#161618',
    surface2: '#1E1E21',
    border: '#2A2A2E',
    text: '#F4F4F5',
    muted: '#A1A1AA',
    accent: '#34D399',
    onAccent: '#052E1F',
    accent2: '#FACC15',
    heroBg: '#F4F4F5',
    onHero: '#0B0B0C',
    onHeroMuted: '#3F3F46',
  },
  fontBody: ROUNDED,
  fontDisplay: ROUNDED,
  css: `
  .bn-hero { padding: clamp(3rem,8vw,5.5rem) 1.25rem 1.5rem; text-align: center; }
  .bn-hero h1 { font-size: clamp(2.1rem,5.6vw,3.75rem); line-height: 1.04; font-weight: 800; letter-spacing: -.035em; margin: 0 auto; max-width: 20ch; }
  .bn-lead { color: var(--muted); font-size: clamp(1.05rem,2.2vw,1.25rem); max-width: 56ch; margin: 1.1rem auto 1.75rem; }
  .bn-hero .tags { justify-content: center; margin-top: 1.5rem; }
  .bn-grid { list-style: none; margin: 0 auto; padding: 0; display: grid; gap: 1rem; grid-template-columns: 1fr; }
  @media (min-width: 700px) { .bn-grid { grid-template-columns: repeat(2, minmax(0,1fr)); } }
  @media (min-width: 1000px) { .bn-grid { grid-template-columns: repeat(4, minmax(0,1fr)); } .bn-wide { grid-column: span 2; grid-row: span 2; } }
  .bn-tile { background: var(--surface); border: 1px solid var(--border); border-radius: 24px; padding: 1.5rem;
    display: flex; flex-direction: column; gap: .5rem; min-width: 0; }
  .bn-tile h3 { margin: 0; font-size: 1.15rem; }
  .bn-tile p { margin: 0; color: var(--muted); font-size: .97rem; }
  .bn-wide { background: var(--accent); border-color: transparent; justify-content: flex-end; min-height: 240px; }
  .bn-wide h3 { color: var(--on-accent); font-size: clamp(1.4rem,3vw,2rem); line-height: 1.15; }
  .bn-wide p { color: var(--on-accent); opacity: .88; font-size: 1.05rem; }
  .bn-stat { font-size: clamp(2rem,5vw,2.75rem); font-weight: 800; letter-spacing: -.03em; line-height: 1; color: var(--text); }
  .bn-label { font-size: .85rem; color: var(--muted); }
  .bn-close { text-align: center; background: var(--surface); border: 1px solid var(--border); border-radius: 28px; padding: clamp(2rem,6vw,3.5rem) 1.5rem; }
  .bn-close h2 { margin: 0 auto .5rem; max-width: 24ch; }
  .bn-close p { color: var(--muted); max-width: 52ch; margin: 0 auto 1.5rem; }`,
  hero: ({ copy, fm }) => `
<section class="bn-hero">
  <div class="ds-narrow">
    <p class="eyebrow">${e(fm.category)}</p>
    <h1>${e(copy.heroTitle)}</h1>
    <p class="bn-lead">${e(copy.heroLead)}</p>
    <a class="btn" href="#contact">${e(copy.cta)}</a>
    <ul class="tags">${tags(fm)}</ul>
  </div>
</section>`,
  features: ({ copy, fm, outline }) => {
    const [first, ...rest] = copy.features
    return `
<section class="ds-section reveal" aria-label="Key points">
  <ul class="ds-wrap bn-grid">
    <li class="bn-tile bn-wide"><h3>${e(first.title)}</h3><p>${e(first.body)}</p></li>
    ${rest.map((f) => `<li class="bn-tile"><h3>${e(f.title)}</h3><p>${e(f.body)}</p></li>`).join('')}
    <li class="bn-tile"><span class="bn-stat">${fm.readingTime} min</span><span class="bn-label">to read the whole thing</span></li>
    <li class="bn-tile"><span class="bn-stat">${outline.length || 1}</span><span class="bn-label">${outline.length === 1 ? 'section' : 'sections'} below</span></li>
  </ul>
</section>`
  },
  closing: ({ copy }) => `
<section class="ds-section reveal">
  <div class="ds-wrap bn-close">
    <h2>${e(copy.closingTitle)}</h2>
    ${copy.closingLead ? `<p>${e(copy.closingLead)}</p>` : ''}
    <a class="btn" href="#contact">${e(copy.cta)}</a>
  </div>
</section>`,
}

const minimal: Design = {
  id: 'minimal',
  name: 'Minimal',
  blurb: 'Large type, hairlines and white space. Nothing decorative.',
  light: {
    bg: '#FFFFFF',
    surface: '#FAFAFA',
    surface2: '#F4F4F5',
    border: '#E4E4E7',
    text: '#09090B',
    muted: '#52525B',
    accent: '#09090B',
    onAccent: '#FFFFFF',
    accent2: '#B91C1C',
    heroBg: '#09090B',
    onHero: '#FFFFFF',
    onHeroMuted: '#D4D4D8',
  },
  dark: {
    bg: '#09090B',
    surface: '#111113',
    surface2: '#18181B',
    border: '#27272A',
    text: '#FAFAFA',
    muted: '#A1A1AA',
    accent: '#FAFAFA',
    onAccent: '#09090B',
    accent2: '#F87171',
    heroBg: '#FAFAFA',
    onHero: '#09090B',
    onHeroMuted: '#3F3F46',
  },
  fontBody: SANS,
  fontDisplay: SANS,
  css: `
  .mn-hero { padding: clamp(4rem,12vw,9rem) 1.25rem clamp(3rem,7vw,5rem); }
  .mn-hero h1 { font-size: clamp(2.5rem,8vw,5.5rem); line-height: .98; font-weight: 700; letter-spacing: -.045em; max-width: 15ch; margin: 0; }
  .mn-lead { font-size: clamp(1.1rem,2.3vw,1.35rem); color: var(--muted); max-width: 46ch; margin: 1.75rem 0 2.25rem; }
  .mn-link { display: inline-flex; align-items: center; gap: .5rem; font-weight: 600; color: var(--text);
    text-decoration: underline; text-decoration-color: var(--accent-2); text-decoration-thickness: 2px; text-underline-offset: 6px; }
  .mn-link:hover { text-decoration-thickness: 3px; }
  .mn-list { list-style: none; margin: 0 auto; padding: 0; }
  .mn-row { display: grid; grid-template-columns: 1fr; gap: .4rem 2rem; padding: 1.75rem 0; border-top: 1px solid var(--border); min-width: 0; }
  .mn-row:last-child { border-bottom: 1px solid var(--border); }
  @media (min-width: 760px) { .mn-row { grid-template-columns: 3rem minmax(0,1fr) minmax(0,1.6fr); align-items: baseline; } }
  .mn-n { font: 500 .85rem ${MONO}; color: var(--muted); }
  .mn-row h3 { margin: 0; font-size: 1.25rem; }
  .mn-row p { margin: 0; color: var(--muted); }
  .mn-close { padding: clamp(4rem,10vw,7rem) 1.25rem; }
  .mn-close h2 { font-size: clamp(1.9rem,5.5vw,3.25rem); letter-spacing: -.035em; max-width: 20ch; margin: 0 0 1.5rem; }`,
  hero: ({ copy, fm }) => `
<section class="mn-hero">
  <div class="ds-wrap">
    <p class="eyebrow">${e(fm.category)} — ${fm.readingTime} min</p>
    <h1>${e(copy.heroTitle)}</h1>
    <p class="mn-lead">${e(copy.heroLead)}</p>
    <a class="mn-link" href="#contact">${e(copy.cta)} <span aria-hidden="true">→</span></a>
  </div>
</section>`,
  features: ({ copy }) => `
<section class="ds-section reveal" aria-label="Key points">
  <ol class="ds-wrap mn-list">
    ${copy.features.map((f, i) => `<li class="mn-row"><span class="mn-n">${pad2(i + 1)}</span><h3>${e(f.title)}</h3><p>${e(f.body)}</p></li>`).join('')}
  </ol>
</section>`,
  closing: ({ copy }) => `
<section class="mn-close reveal">
  <div class="ds-wrap">
    <h2>${e(copy.closingTitle)}</h2>
    <a class="mn-link" href="#contact">${e(copy.cta)} <span aria-hidden="true">→</span></a>
  </div>
</section>`,
}

const bold: Design = {
  id: 'bold',
  name: 'Bold block',
  blurb: 'A solid colour hero and oversized numbers. Loud, but flat — no gradients.',
  light: {
    bg: '#FFFFFF',
    surface: '#F5F7FF',
    surface2: '#EBEFFD',
    border: '#DCE2F5',
    text: '#0B1020',
    muted: '#4A5168',
    accent: '#1D4ED8',
    onAccent: '#FFFFFF',
    accent2: '#C2410C',
    heroBg: '#1D4ED8',
    onHero: '#FFFFFF',
    onHeroMuted: '#DBE5FF',
  },
  dark: {
    bg: '#0A0E1A',
    surface: '#111729',
    surface2: '#18203A',
    border: '#26304F',
    text: '#EEF2FF',
    muted: '#A5AECB',
    accent: '#93B4FF',
    onAccent: '#0A0E1A',
    accent2: '#FDBA74',
    heroBg: '#1E3A8A',
    onHero: '#FFFFFF',
    onHeroMuted: '#C7D6FF',
  },
  fontBody: SANS,
  fontDisplay: SANS,
  css: `
  .bd-hero { background: var(--hero-bg); color: var(--on-hero); padding: clamp(4rem,11vw,8rem) 1.25rem; }
  .bd-hero .eyebrow { color: var(--on-hero-muted); }
  .bd-hero h1 { color: var(--on-hero); font-size: clamp(2.4rem,7.6vw,5.2rem); font-weight: 850; line-height: 1; letter-spacing: -.045em; max-width: 17ch; margin: 0; }
  .bd-lead { color: var(--on-hero-muted); font-size: clamp(1.1rem,2.3vw,1.35rem); max-width: 48ch; margin: 1.5rem 0 2.25rem; }
  .bd-hero .btn { background: var(--on-hero); color: var(--hero-bg); }
  .bd-hero .tags { margin-top: 1.75rem; }
  .bd-hero .tag { color: var(--on-hero-muted); border-color: color-mix(in srgb, var(--on-hero) 35%, transparent); }
  .bd-cols { list-style: none; margin: 0 auto; padding: 0; display: grid; gap: clamp(1.5rem,4vw,3rem); grid-template-columns: 1fr; }
  @media (min-width: 800px) { .bd-cols { grid-template-columns: repeat(3, minmax(0,1fr)); } }
  .bd-col { min-width: 0; }
  .bd-big { display: block; font-size: clamp(3rem,8vw,4.5rem); font-weight: 850; line-height: 1; letter-spacing: -.05em; color: var(--accent); margin-bottom: .75rem; }
  .bd-col h3 { margin: 0 0 .4rem; font-size: 1.2rem; }
  .bd-col p { margin: 0; color: var(--muted); }
  .bd-close { background: var(--hero-bg); color: var(--on-hero); text-align: center; padding: clamp(3.5rem,9vw,6rem) 1.25rem; }
  .bd-close h2 { color: var(--on-hero); font-size: clamp(1.9rem,5.5vw,3.25rem); max-width: 22ch; margin: 0 auto 1rem; }
  .bd-close p { color: var(--on-hero-muted); max-width: 50ch; margin: 0 auto 2rem; }
  .bd-close .btn { background: var(--on-hero); color: var(--hero-bg); }`,
  hero: ({ copy, fm }) => `
<section class="bd-hero">
  <div class="ds-wrap">
    <p class="eyebrow">${e(fm.category)} · ${fm.readingTime} min read</p>
    <h1>${e(copy.heroTitle)}</h1>
    <p class="bd-lead">${e(copy.heroLead)}</p>
    <a class="btn" href="#contact">${e(copy.cta)}</a>
    <ul class="tags">${tags(fm)}</ul>
  </div>
</section>`,
  features: ({ copy }) => `
<section class="ds-section reveal" aria-label="Key points">
  <ol class="ds-wrap bd-cols">
    ${copy.features.map((f, i) => `<li class="bd-col"><span class="bd-big" aria-hidden="true">${pad2(i + 1)}</span><h3>${e(f.title)}</h3><p>${e(f.body)}</p></li>`).join('')}
  </ol>
</section>`,
  closing: ({ copy }) => `
<section class="bd-close reveal">
  <h2>${e(copy.closingTitle)}</h2>
  ${copy.closingLead ? `<p>${e(copy.closingLead)}</p>` : ''}
  <a class="btn" href="#contact">${e(copy.cta)}</a>
</section>`,
}

export const DESIGNS: Design[] = [editorial, split, bento, minimal, bold]
export const DESIGN_IDS = DESIGNS.map((d) => d.id) as [PageDesignId, ...PageDesignId[]]

// ─── Shared shell ────────────────────────────────────────────────────────────

function paletteVars(p: Palette): string {
  return `--bg:${p.bg};--surface:${p.surface};--surface-2:${p.surface2};--surface2:${p.surface2};--border:${p.border};--text:${p.text};--muted:${p.muted};--accent:${p.accent};--on-accent:${p.onAccent};--accent-2:${p.accent2};--hero-bg:${p.heroBg};--on-hero:${p.onHero};--on-hero-muted:${p.onHeroMuted};`
}

/** Light by default; dark from the OS unless the visitor chose light, or when
 * they chose dark. All three blocks are needed for the toggle to work both ways. */
function themeCss(d: Design): string {
  return `
  :root { ${paletteVars(d.light)} --font-body:${d.fontBody}; --font-display:${d.fontDisplay}; color-scheme: light; }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ${paletteVars(d.dark)} color-scheme: dark; } }
  :root[data-theme="dark"] { ${paletteVars(d.dark)} color-scheme: dark; }`
}

const BASE_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; }
  @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
  body { margin: 0; background: var(--bg); color: var(--text); font-family: var(--font-body);
    font-size: 1.0625rem; line-height: 1.7; overflow-wrap: break-word; -webkit-font-smoothing: antialiased;
    transition: background-color .25s ease, color .25s ease; }
  h1, h2, h3, h4 { font-family: var(--font-display); letter-spacing: -.02em; line-height: 1.2; margin: 0 0 .5em; text-wrap: balance; color: var(--text); }
  h2 { font-size: clamp(1.6rem,3.8vw,2.3rem); }
  p { margin: 0 0 1rem; }
  a { color: var(--accent); }
  img, svg, video { max-width: 100%; height: auto; }
  :focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
  .ds-wrap { width: 100%; max-width: 1120px; margin: 0 auto; }
  .ds-narrow { width: 100%; max-width: 760px; margin: 0 auto; }
  section { padding-left: 1.25rem; padding-right: 1.25rem; }
  @media (max-width: 360px) { section { padding-left: 1rem; padding-right: 1rem; } }

  .ds-header { position: sticky; top: 0; z-index: 50; display: flex; align-items: center; gap: 1rem;
    padding: .7rem clamp(1rem,4vw,2rem); background: color-mix(in srgb, var(--bg) 85%, transparent);
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); }
  .ds-mark { font-family: var(--font-display); font-weight: 700; font-size: 1rem; letter-spacing: -.02em; color: var(--text);
    text-decoration: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; margin-right: auto; }
  .ds-header-link { font-size: .9rem; font-weight: 600; color: var(--text); text-decoration: none; white-space: nowrap; }
  .ds-header-link:hover { color: var(--accent); }
  .ds-toggle { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; flex: 0 0 40px;
    padding: 0; border: 1px solid var(--border); border-radius: 10px; background: var(--surface); color: var(--text); cursor: pointer; }
  .ds-toggle:hover { border-color: var(--accent); }
  .ds-toggle svg { width: 18px; height: 18px; display: block; }
  @media (max-width: 380px) { .ds-header-link { display: none; } }

  .eyebrow { margin: 0 0 1.25rem; font: 600 .75rem/1.5 ${MONO}; letter-spacing: .12em; text-transform: uppercase; color: var(--accent); }
  .btn { display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: .8rem 1.5rem;
    border-radius: 12px; background: var(--accent); color: var(--on-accent); font-weight: 650; font-size: 1rem;
    text-decoration: none; transition: transform .2s ease, filter .2s ease; }
  .btn:hover { transform: translateY(-1px); filter: brightness(1.06); }
  .tags { list-style: none; display: flex; flex-wrap: wrap; gap: .5rem; margin: 1.25rem 0 0; padding: 0; }
  .tag { font: 500 .75rem/1.4 ${MONO}; padding: .3rem .65rem; border-radius: 999px; border: 1px solid var(--border); color: var(--muted); }

  .ds-footer { border-top: 1px solid var(--border); padding: 2.25rem 1.25rem; text-align: center; color: var(--muted); font-size: .875rem; }
  .ds-footer p { margin: 0; }

  /* Article sections and form inherit the design's fonts and colours. */
  .ds-prose p, .ds-prose li { color: var(--muted); }
  .ds-prose a { color: var(--accent); }
  .ds-prose code { font-family: ${MONO}; font-size: .9em; background: var(--surface-2); border: 1px solid var(--border); border-radius: 5px; padding: .1em .35em; }
  .ds-prose pre { background: var(--surface-2); border: 1px solid var(--border); border-radius: 12px; padding: 1rem; overflow-x: auto; max-width: 100%; }
  .ds-prose pre code { background: none; border: 0; padding: 0; }
  .ds-prose table { width: 100%; border-collapse: collapse; }
  .ds-prose .table-wrap { overflow-x: auto; }
  .ds-prose th, .ds-prose td { text-align: left; padding: .55rem .7rem; border-bottom: 1px solid var(--border); }
  .lead-submit { background: var(--accent) !important; color: var(--on-accent) !important; min-height: 48px; }
  .contact-section h2 { font-family: var(--font-display); }`

// ─── Page ────────────────────────────────────────────────────────────────────

function head(fm: DemoFrontmatter, copy: PageCopy, d: Design): string {
  const canonical = `https://devstash.me/blog/${fm.slug}`
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: fm.title,
    description: fm.description,
    keywords: fm.tags.join(', '),
    articleSection: fm.category,
    author: { '@type': 'Person', name: 'Adesh Shukla', url: 'https://devstash.me' },
    mainEntityOfPage: canonical,
  }).replace(/</g, '\\u003c')
  return `<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(fm.title)}</title>
<meta name="description" content="${e(fm.description)}">
<meta name="keywords" content="${e(fm.tags.join(', '))}">
<meta name="author" content="Adesh Shukla">
<meta name="robots" content="index,follow">
<meta name="theme-color" content="${d.light.bg}">
<link rel="canonical" href="${e(canonical)}">
<meta property="og:type" content="article">
<meta property="og:title" content="${e(fm.title)}">
<meta property="og:description" content="${e(fm.description)}">
<meta property="og:url" content="${e(canonical)}">
<meta property="article:section" content="${e(fm.category)}">
${fm.tags.map((t) => `<meta property="article:tag" content="${e(t)}">`).join('\n')}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${e(fm.title)}">
<meta name="twitter:description" content="${e(copy.heroLead)}">
<script type="application/ld+json">${jsonLd}</script>
<style>
${themeCss(d)}
${BASE_CSS}
${REVEAL_SAFE_CSS}
${CONTENT_SECTIONS_CSS}
${CONTACT_FORM_CSS}
${d.css}
</style>
</head>`
}

/** One complete, self-contained HTML document in the given design. */
export function renderLandingPage(
  designId: PageDesignId,
  copy: PageCopy,
  fm: DemoFrontmatter,
  articleMarkdown: string
): string {
  const d = DESIGNS.find((x) => x.id === designId) ?? DESIGNS[0]
  const ctx: RenderContext = { copy, fm, outline: articleOutline(articleMarkdown) }
  const year = new Date().getFullYear()
  return `<!doctype html>
<html lang="en">
${head(fm, copy, d)}
<body>
<header class="ds-header">
  <a class="ds-mark" href="#top">${e(copy.brand)}</a>
  <a class="ds-header-link" href="#contact">Contact</a>
  <button class="ds-toggle" type="button" aria-label="Switch theme"></button>
</header>
<main id="top">
${d.hero(ctx)}
${d.features(ctx)}
${buildContentSections(articleMarkdown)}
${d.closing(ctx)}
${CONTACT_FORM_HTML}
</main>
<footer class="ds-footer"><p>© ${year} ${e(copy.brand)}. All rights reserved.</p></footer>
${THEME_TOGGLE_JS}
${CONTACT_FORM_JS}
</body>
</html>`
}
