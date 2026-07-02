// A local heuristic text drafter — NOT an LLM call. It splits your pasted
// content into sentences, scores them by word-frequency overlap with the
// rest of the text plus a lead-paragraph bias (classic extractive
// summarization), then assembles several title/description *candidates*
// from different sentences/clauses/keywords so the "Shuffle" control has
// real variety to cycle through. Deterministic, client-side, honest about
// what it is: sentence extraction + phrase composition, not generation.

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

function buildFrequency(sentences: string[]): Map<string, number> {
  const freq = new Map<string, number>()
  for (const s of sentences) {
    for (const w of words(s)) {
      if (STOPWORDS.has(w)) continue
      freq.set(w, (freq.get(w) ?? 0) + 1)
    }
  }
  return freq
}

/** Word-frequency score with a lead-paragraph bias — real writing usually
 * states its topic early, so sentences in the first third get a boost
 * rather than the pick being decided purely by keyword density. */
function scoreSentences(sentences: string[], freq: Map<string, number>): number[] {
  const leadZone = Math.max(2, Math.ceil(sentences.length / 3))
  return sentences.map((s, i) => {
    const ws = words(s).filter((w) => !STOPWORDS.has(w))
    if (ws.length === 0) return 0
    const total = ws.reduce((sum, w) => sum + (freq.get(w) ?? 0), 0)
    const base = total / Math.sqrt(ws.length)
    return i < leadZone ? base * 1.25 : base
  })
}

/** Sentence indices ordered strongest-first — the base ranking every
 * candidate (title or description) is drawn from. */
function rankedIndices(scores: number[]): number[] {
  return scores.map((_, i) => i).sort((a, b) => scores[b] - scores[a])
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

/** Splits a sentence into clause-sized fragments on comma/dash/colon/
 * semicolon boundaries — the unit "condensed multi-clause" descriptions and
 * the keyword-combo title are stitched from, instead of a whole sentence. */
function splitClauses(sentence: string): string[] {
  return sentence
    .split(/\s*(?:,|;|—|--|:)\s*/)
    .map((c) => c.trim())
    .filter((c) => c.length >= 12)
}

/** The strongest-scoring clause within one sentence, by the same
 * word-frequency weighting used for whole sentences. Falls back to the full
 * sentence if it has no comma/dash/colon boundaries to split on. */
function bestClause(sentence: string, freq: Map<string, number>): string {
  const clauses = splitClauses(sentence)
  if (clauses.length === 0) return sentence
  let best = clauses[0]
  let bestScore = -Infinity
  for (const clause of clauses) {
    const ws = words(clause).filter((w) => !STOPWORDS.has(w))
    if (ws.length === 0) continue
    const score = ws.reduce((sum, w) => sum + (freq.get(w) ?? 0), 0) / Math.sqrt(ws.length)
    if (score > bestScore) {
      bestScore = score
      best = clause
    }
  }
  return best
}

function topKeywords(freq: Map<string, number>, n: number, exclude: Set<string>): string[] {
  return [...freq.entries()]
    .filter(([word]) => !exclude.has(word) && word.length > 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([word]) => word)
}

function titleCaseWord(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

/** Caps a fragment at maxWords with no ellipsis — used where the final
 * `truncate()` call already handles overflow, so an inner ellipsis here
 * would just double up with the outer one. */
function capWords(text: string, maxWords: number): string {
  const arr = text.trim().split(/\s+/)
  return arr.length <= maxWords ? text.trim() : arr.slice(0, maxWords).join(' ')
}

/** Composes a title from an anchor clause plus separate high-frequency
 * keywords, rather than a sentence copy — the "assembled from analyzed
 * content" candidate the shuffle needs alongside the sentence-derived ones. */
function buildKeywordComboTitle(
  sentences: string[],
  ranked: number[],
  freq: Map<string, number>
): string {
  const anchorClause = capWords(bestClause(sentences[ranked[0]], freq), 8)
  const anchorWords = new Set(words(anchorClause))
  const extraKeywords = topKeywords(freq, 6, anchorWords)
    .filter((w) => !anchorWords.has(w))
    .slice(0, 2)
  if (extraKeywords.length === 0) return ''
  const keywordPhrase = extraKeywords.map(titleCaseWord).join(' & ')
  const cleanAnchor = capitalize(humanize(anchorClause).replace(/[.?!,;:—-]+$/, ''))
  return `${cleanAnchor}: ${keywordPhrase}`
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

/** Drops empty/duplicate candidates and caps the list length, preserving
 * the strongest-first order they were generated in. */
function dedupeCandidates(list: string[], max: number): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of list) {
    const cleaned = raw.trim()
    if (!cleaned || seen.has(cleaned)) continue
    seen.add(cleaned)
    out.push(cleaned)
    if (out.length >= max) break
  }
  return out
}

export interface DraftCandidates {
  titleCandidates: string[]
  descriptionCandidates: string[]
}

/** Drafts several title/description candidates from pasted content or a
 * topic sentence — real extractive summarization (word-frequency + lead-bias
 * scoring) plus clause/keyword composition, not a model call. Callers pick
 * candidates[0] initially and cycle through the rest via "Shuffle". */
export function draftFromContent(raw: string): DraftCandidates {
  const trimmed = raw.trim()
  if (!trimmed) return { titleCandidates: [], descriptionCandidates: [] }

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
    // short line) — use that line for both fields rather than leaving them
    // blank. Only one candidate is possible with this little input.
    const title = truncate(capitalize(humanize(firstLineText).replace(/[.?!]+$/, '')), 60)
    const description = truncate(humanize(firstLineText), 160)
    return {
      titleCandidates: title ? [title] : [],
      descriptionCandidates: description ? [description] : [],
    }
  }

  const freq = buildFrequency(sentences)
  const scores = scoreSentences(sentences, freq)
  const ranked = rankedIndices(scores)

  // Title candidates: the heading line (if any), short phrases pulled from
  // the top-ranked sentences, and one keyword-composed title — never a
  // whole sentence copied verbatim.
  const titleRaw: string[] = []
  if (looksLikeHeading) titleRaw.push(capitalize(humanize(firstLineText)))
  for (const idx of ranked.slice(0, 3)) {
    const phrase = extractPhrase(sentences[idx])
    titleRaw.push(capitalize(humanize(phrase).replace(/[.?!,;:—-]+$/, '')))
  }
  const comboTitle = buildKeywordComboTitle(sentences, ranked, freq)
  if (comboTitle) titleRaw.push(comboTitle)
  const titleCandidates = dedupeCandidates(titleRaw, 4).map((t) => truncate(t, 60))

  // Description candidates: the top-ranked sentences (padded with a
  // neighbor if short, same as before) plus one condensed candidate that
  // stitches the strongest clause of the two best sentences together, so
  // you can't always find one whole original sentence in the result.
  const descRaw: string[] = []
  for (const idx of ranked.slice(0, 3)) {
    let text = sentences[idx]
    if (text.length < 130 && sentences.length > 1) {
      const neighbor = sentences[idx + 1] ?? sentences[idx - 1]
      if (neighbor) text = `${text} ${neighbor}`.trim()
    }
    // Filler stripping in humanize() can leave a sentence starting mid-clause
    // (its original leading phrase removed) — re-capitalize so it doesn't
    // read as a lowercase fragment.
    descRaw.push(capitalize(text))
  }
  if (ranked.length >= 2) {
    const clauseA = bestClause(sentences[ranked[0]], freq)
    const clauseB = bestClause(sentences[ranked[1]], freq)
    if (clauseA && clauseB && clauseA !== clauseB) {
      const cleanA = capitalize(humanize(clauseA).replace(/[.?!,;:—-]+$/, ''))
      const cleanB = humanize(clauseB).replace(/[.?!]+$/, '')
      descRaw.push(`${cleanA} — ${cleanB}.`)
    }
  }
  const descriptionCandidates = dedupeCandidates(descRaw, 4).map((d) => truncate(d, 160))

  return { titleCandidates, descriptionCandidates }
}
