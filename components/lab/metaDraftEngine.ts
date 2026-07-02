// A local heuristic text drafter — NOT an LLM call. It splits your pasted
// content into sentences, scores them by word-frequency overlap with the
// rest of the text plus a lead-paragraph bias (classic extractive
// summarization), picks a short phrase from the strongest sentence for the
// title, and a *different* strong sentence for the description so the two
// fields say different things instead of repeating each other. Deterministic,
// client-side, honest about what it is: sentence extraction + cleanup, not
// generation.

const FILLER_REPLACEMENTS: [RegExp, string][] = [
  [/\bin today's fast-paced world,?\s*/gi, ''],
  [/\bin this day and age,?\s*/gi, ''],
  [/\bit is worth noting that\s*/gi, ''],
  [/\bit's worth noting that\s*/gi, ''],
  [/\bin conclusion,?\s*/gi, ''],
  [/\bdelve into\b/gi, 'look at'],
  [/\bdelving into\b/gi, 'looking at'],
  [/\bleverage[sd]?\b/gi, 'use'],
  [/\bleveraging\b/gi, 'using'],
  [/\butiliz(e|es|ed)\b/gi, 'use'],
  [/\butilizing\b/gi, 'using'],
  [/\bcomprehensive\b/gi, 'complete'],
  [/\bin order to\b/gi, 'to'],
  [/\ba plethora of\b/gi, 'many'],
  [/\bvery\s+/gi, ''],
  [/\breally\s+/gi, ''],
]

const STOPWORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'but',
  'of',
  'to',
  'in',
  'on',
  'for',
  'with',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'it',
  'this',
  'that',
  'as',
  'at',
  'by',
  'from',
  'into',
  'your',
  'you',
  'we',
  'our',
  'us',
  'they',
  'their',
  'he',
  'she',
  'his',
  'her',
  'not',
  'so',
  'if',
  'then',
  'than',
  'can',
  'will',
  'has',
  'have',
  'had',
  'do',
  'does',
  'did',
  'all',
  'more',
  'most',
  'also',
])

function humanize(text: string): string {
  let out = text
  for (const [pattern, replacement] of FILLER_REPLACEMENTS) {
    out = out.replace(pattern, replacement)
  }
  return out.replace(/\s+/g, ' ').trim()
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'])/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function words(sentence: string): string[] {
  return sentence.toLowerCase().match(/[a-z0-9']+/g) ?? []
}

/** Word-frequency score with a lead-paragraph bias — real writing usually
 * states its topic early, so sentences in the first third get a boost
 * rather than the pick being decided purely by keyword density. */
function scoreSentences(sentences: string[]): number[] {
  const freq = new Map<string, number>()
  for (const s of sentences) {
    for (const w of words(s)) {
      if (STOPWORDS.has(w)) continue
      freq.set(w, (freq.get(w) ?? 0) + 1)
    }
  }
  const leadZone = Math.max(2, Math.ceil(sentences.length / 3))
  return sentences.map((s, i) => {
    const ws = words(s).filter((w) => !STOPWORDS.has(w))
    if (ws.length === 0) return 0
    const total = ws.reduce((sum, w) => sum + (freq.get(w) ?? 0), 0)
    const base = total / Math.sqrt(ws.length)
    return i < leadZone ? base * 1.25 : base
  })
}

function bestIndexExcluding(scores: number[], exclude: Set<number>): number {
  let bestIndex = -1
  let bestScore = -Infinity
  scores.forEach((score, i) => {
    if (exclude.has(i)) return
    if (score > bestScore) {
      bestScore = score
      bestIndex = i
    }
  })
  return bestIndex
}

/** Pulls a short headline-style phrase out of a full sentence — cuts at the
 * first natural clause boundary (comma/dash/colon) if that yields a
 * reasonable length, otherwise caps at a word count. This is what keeps the
 * title from just being a truncated copy of the description sentence. */
function extractPhrase(sentence: string, maxWords = 10): string {
  const clauseMatch = sentence.match(/^(.{15,70}?)(?:,\s|\s—\s|\s-\s|:\s)/)
  if (clauseMatch) return clauseMatch[1].trim()
  const wordsArr = sentence.trim().split(/\s+/)
  if (wordsArr.length <= maxWords) return sentence.trim()
  return wordsArr.slice(0, maxWords).join(' ') + '…'
}

function capitalize(text: string): string {
  if (!text) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  const slice = text.slice(0, max - 1)
  const lastSpace = slice.lastIndexOf(' ')
  // Only break at a word boundary if it doesn't throw away too much —
  // otherwise a hard character cut beats an unhelpfully short result.
  const cut = lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice
  return cut.trimEnd() + '…'
}

export interface DraftResult {
  title: string
  description: string
}

/** Drafts a title/description from pasted content or a topic sentence.
 * Real extractive summarization (word-frequency + lead-bias scoring), not a
 * model call — title and description are deliberately drawn from different
 * sentences so they don't just repeat each other. */
export function draftFromContent(raw: string): DraftResult {
  const trimmed = raw.trim()
  if (!trimmed) return { title: '', description: '' }

  // A short first line reads like an intentional heading — pull it out for
  // the title and score the *rest* of the text for the description, so the
  // heading itself doesn't end up glued onto the first description sentence.
  const lines = trimmed.split('\n').map((l) => l.trim())
  const firstLineIndex = lines.findIndex((l) => l.length > 0)
  const rawFirstLine = firstLineIndex >= 0 ? lines[firstLineIndex] : ''
  const firstLineText = rawFirstLine.replace(/^#+\s*/, '')
  const looksLikeHeading =
    !!firstLineText && firstLineText.length <= 80 && firstLineText.split(/\s+/).length <= 14

  const bodySource = looksLikeHeading ? lines.slice(firstLineIndex + 1).join(' ') : trimmed
  const sentences = splitSentences(humanize(bodySource))

  if (sentences.length === 0) {
    // No body left after pulling out the heading (or the whole paste was one
    // short line) — use that line for both fields rather than leaving the
    // description blank.
    const title = truncate(capitalize(humanize(firstLineText).replace(/[.?!]+$/, '')), 60)
    const description = truncate(humanize(firstLineText), 160)
    return { title, description }
  }

  const scores = scoreSentences(sentences)

  // Title source: the heading line if there was one, otherwise the single
  // strongest sentence — reduced to a short phrase, not copied whole.
  const titleSentenceIndex = looksLikeHeading ? -1 : bestIndexExcluding(scores, new Set())
  const titleSource = looksLikeHeading ? firstLineText : sentences[titleSentenceIndex]
  const title = truncate(
    capitalize(humanize(extractPhrase(titleSource)).replace(/[.?!,;:—-]+$/, '')),
    60
  )

  // Description: the strongest sentence that ISN'T the one the title came
  // from, so the two fields read as complementary rather than duplicated.
  const exclude = titleSentenceIndex >= 0 ? new Set([titleSentenceIndex]) : new Set<number>()
  let descIndex = bestIndexExcluding(scores, exclude)
  if (descIndex === -1) descIndex = titleSentenceIndex >= 0 ? titleSentenceIndex : 0

  let description = sentences[descIndex]
  if (description.length < 130 && sentences.length > 1) {
    const neighbor = sentences[descIndex + 1] ?? sentences[descIndex - 1]
    if (neighbor && neighbor !== sentences[titleSentenceIndex]) {
      description = `${description} ${neighbor}`.trim()
    }
  }
  description = truncate(description, 160)

  return { title, description }
}
