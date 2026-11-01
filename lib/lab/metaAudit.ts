// Checks the head tags a page already has: what is missing, too long, repeated
// or malformed. Pure, no React and no "@/" imports so node:test can run it. It
// reads text with simple patterns, not a full HTML parser: fine for the flat
// tags that live in a <head>, and it never throws.

export interface AuditIssue {
  level: 'problem' | 'tip'
  text: string
}

export interface AuditResult {
  title: string
  description: string
  /** One line per notable thing found, for the "what we read" list. */
  found: string[]
  issues: AuditIssue[]
}

const decode = (s: string) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')

function attrs(tag: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const m of tag.matchAll(/([a-zA-Z:_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g))
    out[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4] ?? '')
  return out
}

/** Reads a pasted <head> (or whole page) and reports what is wrong with its tags. */
export function auditHead(html: string): AuditResult {
  const empty: AuditResult = { title: '', description: '', found: [], issues: [] }
  if (!html.trim()) return empty

  const titles = [...html.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/gi)].map((m) =>
    decode(m[1].trim())
  )
  const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => attrs(m[0]))
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => attrs(m[0]))
  const meta = (key: string) =>
    metas.filter((m) => (m.name ?? m.property ?? '').toLowerCase() === key)
  const first = (key: string) => meta(key)[0]?.content?.trim() ?? ''

  const issues: AuditIssue[] = []
  const found: string[] = []
  const add = (level: AuditIssue['level'], text: string) => issues.push({ level, text })

  const title = titles[0] ?? ''
  if (!titles.length)
    add(
      'problem',
      'There is no <title>. Search results and browser tabs will have nothing to show.'
    )
  else {
    found.push(`Title (${title.length} characters): ${title}`)
    if (titles.length > 1) add('problem', `There are ${titles.length} <title> tags. Keep one.`)
    if (!title) add('problem', 'The <title> is empty.')
    else if (title.length > 60)
      add(
        'tip',
        `The title is ${title.length} characters. Google cuts titles off at roughly 60, so the end may not show.`
      )
    else if (title.length < 30)
      add(
        'tip',
        `The title is only ${title.length} characters. A fuller title (about 30 to 60) gives search more to work with.`
      )
  }

  const descs = meta('description')
  const description = first('description')
  if (!descs.length)
    add('problem', 'There is no meta description. Search engines will pick a snippet themselves.')
  else {
    found.push(`Description (${description.length} characters): ${description}`)
    if (descs.length > 1) add('problem', `There are ${descs.length} meta descriptions. Keep one.`)
    if (!description) add('problem', 'The meta description is empty.')
    else if (description.length > 160)
      add(
        'tip',
        `The description is ${description.length} characters. Roughly 160 is where it gets cut.`
      )
    else if (description.length < 70)
      add(
        'tip',
        `The description is only ${description.length} characters. About 130 to 160 reads best in results.`
      )
  }

  const canonicals = links.filter((l) =>
    (l.rel ?? '').toLowerCase().split(/\s+/).includes('canonical')
  )
  if (!canonicals.length)
    add(
      'tip',
      'There is no canonical link. Add one so duplicate addresses do not split your ranking.'
    )
  else {
    found.push(`Canonical: ${canonicals[0].href ?? ''}`)
    if (canonicals.length > 1)
      add('problem', `There are ${canonicals.length} canonical links. Keep one.`)
    if (!/^https?:\/\//i.test(canonicals[0].href ?? ''))
      add('tip', 'The canonical link should be a full https:// address.')
  }

  if (!meta('viewport').length)
    add('problem', 'There is no viewport meta tag, so phones may show the page zoomed out.')
  if (
    !metas.some((m) => m.charset) &&
    !metas.some((m) => (m['http-equiv'] ?? '').toLowerCase() === 'content-type')
  )
    add(
      'tip',
      'There is no charset declaration. Add <meta charset="utf-8"> near the top of the head.'
    )

  const robots = first('robots').toLowerCase()
  if (robots.includes('noindex'))
    add(
      'problem',
      'The robots tag says noindex, so search engines are told not to list this page. Remove it unless that is on purpose.'
    )

  const og = ['og:title', 'og:description', 'og:image', 'og:url', 'og:type']
  const missingOg = og.filter((k) => !first(k))
  if (missingOg.length === og.length)
    add(
      'tip',
      'There are no Open Graph tags, so shared links on Facebook, LinkedIn and others use guesses.'
    )
  else if (missingOg.length) add('tip', `Open Graph tags missing: ${missingOg.join(', ')}.`)
  const ogImage = first('og:image')
  if (ogImage && !/^https?:\/\//i.test(ogImage))
    add('problem', 'og:image must be a full https:// address, or social sites will not find it.')
  const ogUrl = first('og:url')
  if (ogUrl && canonicals[0]?.href && ogUrl !== canonicals[0].href)
    add('tip', 'og:url and the canonical link are different. They usually should match.')
  if (!first('twitter:card'))
    add('tip', 'There is no twitter:card tag, so X shows a plain link instead of a card.')

  return { title, description, found, issues }
}
