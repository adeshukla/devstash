// lib/ai/aiTellPhrases.ts
//
// The fixed list of "AI-tell" phrases the humanizing pass is instructed to
// remove. Exported as data (not hardcoded twice) so the prompt sent to Groq
// and the before/after eval count are provably checking the same thing.

export const AI_TELL_PHRASES = [
  'in conclusion',
  "it's worth noting",
  'it is important to note',
  'delve',
  'leverage',
  'comprehensive',
  'robust',
  'seamless',
  'unleash',
  'moreover',
  'furthermore',
  "in today's fast-paced world",
  'in the realm of',
  'unlock the power of',
  "whether you're a beginner or an expert",
] as const

function escapeRegExp(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// One combined, word-boundary regex over the whole list. Word boundaries stop
// substring false positives (e.g. "robust" inside "robustness") that the old
// naive split() count produced, and the `\b` anchors work for every phrase
// here since they all start and end with a word character.
const AI_TELL_REGEX = new RegExp(`\\b(?:${AI_TELL_PHRASES.map(escapeRegExp).join('|')})\\b`, 'gi')

export function countAiTellPhrases(text: string): number {
  return (text.match(AI_TELL_REGEX) ?? []).length
}
