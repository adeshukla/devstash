// lib/ai/aiTellPhrases.ts
//
// The fixed list of "AI-tell" phrases the humanizing pass is instructed to
// remove. Exported as data (not hardcoded twice) so the prompt sent to Groq
// and the before/after eval count are provably checking the same thing.

export const AI_TELL_PHRASES = [
  'in conclusion',
  "it's worth noting",
  'delve into',
  'leverage',
  'comprehensive',
] as const

export function countAiTellPhrases(text: string): number {
  const lower = text.toLowerCase()
  return AI_TELL_PHRASES.reduce((count, phrase) => count + (lower.split(phrase).length - 1), 0)
}
