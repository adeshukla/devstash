// Which AI crawlers a robots.txt blocks. Pure, no React and no "@/" imports so node:test can
// run it. The crawler list below comes from each vendor's own documentation, read on
// 2026-11-09. Vendors add and rename crawlers, so re-check it from time to time.

export type CrawlerKind = 'training' | 'search' | 'user' | 'control' | 'dataset'

export interface Crawler {
  /** The exact robots.txt user-agent token. */
  token: string
  owner: string
  kind: CrawlerKind
  note: string
}

export const KIND_LABEL: Record<CrawlerKind, string> = {
  training: 'AI training',
  search: 'AI search',
  user: 'Fetches when a person asks',
  control: 'Training opt-out token',
  dataset: 'Open web archive',
}

export const CRAWLERS: Crawler[] = [
  {
    token: 'GPTBot',
    owner: 'OpenAI',
    kind: 'training',
    note: 'Collects content that may be used to train OpenAI models.',
  },
  {
    token: 'OAI-SearchBot',
    owner: 'OpenAI',
    kind: 'search',
    note: 'Surfaces sites in ChatGPT search results.',
  },
  {
    token: 'ChatGPT-User',
    owner: 'OpenAI',
    kind: 'user',
    note: 'Visits a page when a person asks ChatGPT to. OpenAI says robots.txt rules may not apply.',
  },
  {
    token: 'ClaudeBot',
    owner: 'Anthropic',
    kind: 'training',
    note: 'Collects web content that may contribute to training Claude.',
  },
  {
    token: 'Claude-SearchBot',
    owner: 'Anthropic',
    kind: 'search',
    note: 'Improves the quality of Claude search answers.',
  },
  {
    token: 'Claude-User',
    owner: 'Anthropic',
    kind: 'user',
    note: 'Visits a page when a person asks Claude a question.',
  },
  {
    token: 'PerplexityBot',
    owner: 'Perplexity',
    kind: 'search',
    note: 'Surfaces sites in Perplexity search. Perplexity says it is not used for training.',
  },
  {
    token: 'Perplexity-User',
    owner: 'Perplexity',
    kind: 'user',
    note: 'Visits a page when a person asks. Perplexity says it generally ignores robots.txt.',
  },
  {
    token: 'Google-Extended',
    owner: 'Google',
    kind: 'control',
    note: 'A robots.txt control, not a separate crawler: whether Google may use your content for Gemini training and grounding. It does not affect Google Search.',
  },
  {
    token: 'Applebot-Extended',
    owner: 'Apple',
    kind: 'control',
    note: 'A robots.txt control, not a crawler: whether Apple may use content Applebot crawled to train its models.',
  },
  {
    token: 'CCBot',
    owner: 'Common Crawl',
    kind: 'dataset',
    note: 'Builds an open archive of the web that other people reuse.',
  },
  {
    token: 'meta-externalagent',
    owner: 'Meta',
    kind: 'training',
    note: 'Crawls the web to train AI models or to index content for Meta products.',
  },
  {
    token: 'meta-externalfetcher',
    owner: 'Meta',
    kind: 'user',
    note: 'Fetches links at a user’s request. Meta says it may bypass robots.txt.',
  },
]

/** What "opt out of AI training" writes: the crawlers and tokens that are about training or archiving. */
export const TRAINING_TOKENS = CRAWLERS.filter(
  (c) => c.kind === 'training' || c.kind === 'control' || c.kind === 'dataset'
).map((c) => c.token)

interface Rule {
  allow: boolean
  pattern: string
}
interface Group {
  agents: string[]
  rules: Rule[]
}

/** Reads robots.txt into groups. Comments and unknown lines (Sitemap, Crawl-delay) are ignored. */
export function parseRobots(text: string): Group[] {
  const groups: Group[] = []
  let cur: Group | null = null
  let lastWasAgent = false
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim()
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/)
    if (!m) continue
    const key = m[1].toLowerCase()
    const value = m[2].trim()
    if (key === 'user-agent') {
      // Consecutive user-agent lines share one set of rules.
      if (!cur || !lastWasAgent) {
        cur = { agents: [], rules: [] }
        groups.push(cur)
      }
      cur.agents.push(value.toLowerCase())
      lastWasAgent = true
    } else if (key === 'allow' || key === 'disallow') {
      lastWasAgent = false
      if (cur) cur.rules.push({ allow: key === 'allow', pattern: value })
    }
  }
  return groups
}

/** A robots.txt path pattern: "*" matches anything, a trailing "$" anchors the end. */
function matches(pattern: string, path: string): boolean {
  const anchored = pattern.endsWith('$')
  const body = anchored ? pattern.slice(0, -1) : pattern
  const re = body.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
  return new RegExp(`^${re}${anchored ? '$' : ''}`).test(path)
}

export type Via = 'own' | 'wildcard' | 'none'

/**
 * Whether a crawler may fetch a path. The crawler's own group wins over "*"; with no group at
 * all everything is allowed. Inside a group the longest matching rule wins, and Allow beats
 * Disallow when they are equally long. An empty Disallow allows everything.
 */
export function isAllowed(
  groups: Group[],
  token: string,
  path: string
): { allowed: boolean; via: Via } {
  const t = token.toLowerCase()
  let chosen = groups.filter((g) => g.agents.includes(t))
  let via: Via = 'own'
  if (!chosen.length) {
    chosen = groups.filter((g) => g.agents.includes('*'))
    via = 'wildcard'
  }
  if (!chosen.length) return { allowed: true, via: 'none' }
  let best: Rule | null = null
  for (const r of chosen.flatMap((g) => g.rules)) {
    if (!r.pattern || !matches(r.pattern, path)) continue
    if (
      !best ||
      r.pattern.length > best.pattern.length ||
      (r.pattern.length === best.pattern.length && r.allow && !best.allow)
    )
      best = r
  }
  return { allowed: best ? best.allow : true, via }
}

export type Status = 'blocked' | 'allowed' | 'partial'

export interface CrawlerResult extends Crawler {
  status: Status
  via: Via
}

const SAMPLE_PAGE = '/blog/example-post'

/** One result per known crawler: blocked everywhere, allowed everywhere, or only some paths. */
export function checkCrawlers(robotsTxt: string): CrawlerResult[] {
  const groups = parseRobots(robotsTxt)
  return CRAWLERS.map((c) => {
    const root = isAllowed(groups, c.token, '/')
    const page = isAllowed(groups, c.token, SAMPLE_PAGE)
    const status: Status =
      !root.allowed && !page.allowed
        ? 'blocked'
        : root.allowed && page.allowed
          ? 'allowed'
          : 'partial'
    return { ...c, status, via: root.via }
  })
}
