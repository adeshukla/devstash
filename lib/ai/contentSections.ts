import 'server-only'
import { renderArticleHtml } from '@/lib/ai/landingPageParts'

/**
 * Turns the pipeline's own humanised article into a varied set of landing-page
 * sections.
 *
 * The page previously dumped the whole article into one long column, which
 * read as a blog post rather than a landing page — and asking the model for
 * "more sections" only ever produced three near-identical card rows. So the
 * variety is built here instead, from the real content: the article is split
 * on its H2 boundaries and each group is rendered with a layout chosen from
 * the shape of what it actually contains.
 *
 * This also guarantees the requirement that the page and the generated content
 * match exactly — every word rendered comes from the humanised output, never a
 * paraphrase.
 */

interface Group {
  heading: string
  body: string
}

const TODO_MARKER = /\[TODO:[^\]]*\]/gi
// The scaffold emits "[TODO: ...]", but not always with brackets — bare
// "TODO: provide real numbers" lines were reaching the rendered page, which
// is the one place an author's private note must never appear.
const TODO_LINE = /^[ \t>*_-]*\**\s*TODO\b[^\n]*$/gim

/** Split the article on H2/setext boundaries, keeping each heading with its body. */
function splitIntoGroups(markdown: string): { intro: string; groups: Group[] } {
  const src = markdown.replace(TODO_MARKER, '').replace(TODO_LINE, '').replace(/\r/g, '').trim()
  const lines = src.split('\n')

  const groups: Group[] = []
  const introLines: string[] = []
  let current: { heading: string; lines: string[] } | null = null
  let inCode = false

  const isHeading = (i: number): string | null => {
    const line = lines[i]
    if (inCode) return null
    const atx = line.match(/^\s{0,3}(#{1,3})\s+(.+?)\s*#*\s*$/)
    if (atx) return atx[2].trim()
    // Setext: text underlined by === or ---
    const next = lines[i + 1]
    if (next && /^\s*(={3,}|-{3,})\s*$/.test(next) && line.trim() && !/^\s*[-*+]\s/.test(line)) {
      return line.trim()
    }
    return null
  }

  for (let i = 0; i < lines.length; i++) {
    if (/^\s*```/.test(lines[i])) inCode = !inCode

    const heading = isHeading(i)
    if (heading) {
      if (current) groups.push({ heading: current.heading, body: current.lines.join('\n').trim() })
      current = { heading, lines: [] }
      // Skip a setext underline so it isn't treated as an <hr> later.
      if (/^\s*(={3,}|-{3,})\s*$/.test(lines[i + 1] ?? '')) i++
      continue
    }

    if (current) current.lines.push(lines[i])
    else introLines.push(lines[i])
  }
  if (current) groups.push({ heading: current.heading, body: current.lines.join('\n').trim() })

  return { intro: introLines.join('\n').trim(), groups }
}

/** Bullet items at the top level of a block, used to build cards and checklists. */
function extractBullets(body: string): string[] {
  const out: string[] = []
  let inCode = false
  for (const line of body.split('\n')) {
    if (/^\s*```/.test(line)) inCode = !inCode
    if (inCode) continue
    const m = line.match(/^\s{0,3}[-*+]\s+(.+)$/)
    if (m) out.push(m[1].trim())
  }
  return out
}

function extractOrdered(body: string): string[] {
  const out: string[] = []
  let inCode = false
  for (const line of body.split('\n')) {
    if (/^\s*```/.test(line)) inCode = !inCode
    if (inCode) continue
    const m = line.match(/^\s{0,3}\d+[.)]\s+(.+)$/)
    if (m) out.push(m[1].trim())
  }
  return out
}

/** Strip list lines so a layout can render prose and its list separately. */
function withoutLists(body: string): string {
  let inCode = false
  return body
    .split('\n')
    .filter((line) => {
      if (/^\s*```/.test(line)) inCode = !inCode
      if (inCode) return true
      return !/^\s{0,3}([-*+]|\d+[.)])\s+/.test(line)
    })
    .join('\n')
    .trim()
}

function hasCode(body: string): boolean {
  return /```/.test(body)
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function slugId(s: string, i: number): string {
  const base = s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 40)
  return base ? `${base}-${i}` : `section-${i}`
}

// ─── Layouts ─────────────────────────────────────────────────────────────────

function sectionOpen(id: string, cls: string, labelledBy: string): string {
  return `<section id="${id}" class="${cls} reveal" aria-labelledby="${labelledBy}">`
}

/** Prose + a pulled-out list rendered as a side panel. */
function layoutSplit(g: Group, id: string, alt: boolean): string {
  const bullets = extractBullets(g.body)
  const prose = renderArticleHtml(withoutLists(g.body))
  const items = bullets
    .map((b) => `<li>${renderArticleHtml(b).replace(/^<p>|<\/p>$/g, '')}</li>`)
    .join('')
  return `
${sectionOpen(id, `ds-section ds-split${alt ? ' ds-alt' : ''}`, `${id}-h`)}
  <div class="ds-wrap ds-split-grid">
    <div class="ds-split-main">
      <h2 id="${id}-h">${escapeAttr(g.heading)}</h2>
      ${prose}
    </div>
    ${items ? `<aside class="ds-panel"><p class="ds-panel-label">Key points</p><ul class="ds-check">${items}</ul></aside>` : ''}
  </div>
</section>`
}

/** Numbered steps, for groups that are genuinely sequential. */
function layoutSteps(g: Group, id: string, alt: boolean): string {
  const steps = extractOrdered(g.body)
  const prose = renderArticleHtml(withoutLists(g.body))
  const items = steps
    .map(
      (s, i) =>
        `<li class="ds-step"><span class="ds-step-n" aria-hidden="true">${i + 1}</span><div>${renderArticleHtml(s).replace(/^<p>|<\/p>$/g, '')}</div></li>`
    )
    .join('')
  return `
${sectionOpen(id, `ds-section ds-steps${alt ? ' ds-alt' : ''}`, `${id}-h`)}
  <div class="ds-wrap">
    <h2 id="${id}-h">${escapeAttr(g.heading)}</h2>
    ${prose}
    <ol class="ds-step-list">${items}</ol>
  </div>
</section>`
}

/** Bullet-heavy groups become a responsive card grid. */
function layoutCards(g: Group, id: string, alt: boolean): string {
  const bullets = extractBullets(g.body)
  const prose = renderArticleHtml(withoutLists(g.body))
  const cards = bullets
    .map((b) => {
      // "**Label** — rest" becomes a card title plus body.
      const m = b.match(/^\*\*(.+?)\*\*[\s—:-]*(.*)$/)
      const title = m ? m[1] : b.split(/[.:]/)[0].slice(0, 60)
      const rest = m ? m[2] : b.slice(title.length).replace(/^[\s.:—-]+/, '')
      return `<li class="ds-card">
        <h3>${renderArticleHtml(title).replace(/^<p>|<\/p>$/g, '')}</h3>
        ${rest ? `<p>${renderArticleHtml(rest).replace(/^<p>|<\/p>$/g, '')}</p>` : ''}
      </li>`
    })
    .join('')
  return `
${sectionOpen(id, `ds-section${alt ? ' ds-alt' : ''}`, `${id}-h`)}
  <div class="ds-wrap">
    <h2 id="${id}-h">${escapeAttr(g.heading)}</h2>
    ${prose}
    <ul class="ds-card-grid">${cards}</ul>
  </div>
</section>`
}

/** Code-bearing groups get a two-column explain/code treatment. */
function layoutCode(g: Group, id: string, alt: boolean): string {
  const body = renderArticleHtml(g.body)
  return `
${sectionOpen(id, `ds-section ds-code${alt ? ' ds-alt' : ''}`, `${id}-h`)}
  <div class="ds-wrap">
    <h2 id="${id}-h">${escapeAttr(g.heading)}</h2>
    <div class="ds-prose">${body}</div>
  </div>
</section>`
}

/** Plain prose, kept narrow for readability. */
function layoutProse(g: Group, id: string, alt: boolean): string {
  return `
${sectionOpen(id, `ds-section${alt ? ' ds-alt' : ''}`, `${id}-h`)}
  <div class="ds-narrow">
    <h2 id="${id}-h">${escapeAttr(g.heading)}</h2>
    <div class="ds-prose">${renderArticleHtml(g.body)}</div>
  </div>
</section>`
}

/**
 * Choose a layout from what the group actually contains, so variety comes from
 * the content rather than from rotating templates at random.
 */
function renderGroup(g: Group, index: number): string {
  const id = slugId(g.heading, index)
  const alt = index % 2 === 1
  const bullets = extractBullets(g.body)
  const ordered = extractOrdered(g.body)

  if (hasCode(g.body)) return layoutCode(g, id, alt)
  if (ordered.length >= 2) return layoutSteps(g, id, alt)
  if (bullets.length >= 3) return layoutCards(g, id, alt)
  if (bullets.length >= 1) return layoutSplit(g, id, alt)
  return layoutProse(g, id, alt)
}

/**
 * The whole content area: a lead paragraph, then one varied section per H2.
 * Returns '' when there is nothing usable, so the caller can skip it.
 */
export function buildContentSections(markdown: string): string {
  const { intro, groups } = splitIntoGroups(markdown)
  if (!intro && groups.length === 0) return ''

  const lead = intro
    ? `
<section class="ds-section ds-lead reveal" aria-label="Overview">
  <div class="ds-narrow ds-prose">${renderArticleHtml(intro)}</div>
</section>`
    : ''

  return lead + groups.map(renderGroup).join('\n')
}

export const CONTENT_SECTIONS_CSS = `
  .ds-section { padding: clamp(3rem,7vw,5.5rem) 1.25rem; }
  .ds-section.ds-alt { background: var(--surface); }
  .ds-section > * { min-width: 0; }
  .ds-lead .ds-prose > p:first-child { font-size: clamp(1.0625rem,2.2vw,1.25rem); color: var(--text); }

  /* Visual hierarchy: one clear step between each level, tighter leading as
     type gets larger, looser leading for body copy. */
  .ds-section h2 { font-size: clamp(1.5rem,3.6vw,2.125rem); line-height: 1.2; margin: 0 0 1rem; }
  .ds-section h3 { font-size: clamp(1.125rem,2.2vw,1.3125rem); line-height: 1.3; margin: 0 0 .5rem; }
  .ds-prose p, .ds-prose li { font-size: clamp(.9375rem,1.6vw,1.0625rem); line-height: 1.75; color: var(--muted); }
  .ds-prose p { margin: 0 0 1.1rem; max-width: 68ch; }
  .ds-prose strong { color: var(--text); font-weight: 650; }

  .ds-split-grid { display: grid; gap: clamp(1.5rem,4vw,2.5rem); grid-template-columns: 1fr; align-items: start; }
  @media (min-width: 860px) { .ds-split-grid { grid-template-columns: 1.35fr .9fr; } }
  .ds-panel { background: var(--surface-2); border: 1px solid var(--border); border-radius: 16px; padding: 1.5rem; min-width: 0; }
  .ds-panel-label { margin: 0 0 .75rem; font-size: .75rem; letter-spacing: .09em; text-transform: uppercase; color: var(--accent); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  .ds-check { list-style: none; margin: 0; padding: 0; display: grid; gap: .75rem; }
  .ds-check li { position: relative; padding-left: 1.6rem; font-size: .9375rem; line-height: 1.6; color: var(--muted); }
  .ds-check li::before { content: ""; position: absolute; left: 0; top: .55em; width: .55rem; height: .55rem; border-radius: 50%; background: var(--accent); }

  .ds-card-grid { list-style: none; margin: 1.5rem 0 0; padding: 0; display: grid; gap: 1rem; grid-template-columns: 1fr; }
  @media (min-width: 620px) { .ds-card-grid { grid-template-columns: repeat(2, minmax(0,1fr)); } }
  @media (min-width: 980px) { .ds-card-grid { grid-template-columns: repeat(3, minmax(0,1fr)); } }
  .ds-card { background: var(--surface-2); border: 1px solid var(--border); border-radius: 14px; padding: 1.35rem; min-width: 0; transition: transform .2s ease, border-color .2s ease; }
  .ds-card:hover { transform: translateY(-3px); border-color: var(--accent); }
  .ds-card h3 { margin: 0 0 .4rem; font-size: 1.0625rem; color: var(--text); }
  .ds-card p { margin: 0; font-size: .9375rem; line-height: 1.65; color: var(--muted); }

  .ds-step-list { list-style: none; margin: 1.5rem 0 0; padding: 0; display: grid; gap: 1rem; }
  .ds-step { display: grid; grid-template-columns: auto 1fr; gap: 1rem; align-items: start; background: var(--surface-2); border: 1px solid var(--border); border-radius: 14px; padding: 1.25rem; min-width: 0; }
  .ds-step-n { display: inline-flex; align-items: center; justify-content: center; width: 2rem; height: 2rem; border-radius: 50%; background: var(--accent); color: #fff; font-weight: 700; font-size: .875rem; }
  .ds-step div { min-width: 0; font-size: .9375rem; line-height: 1.7; color: var(--muted); }`
