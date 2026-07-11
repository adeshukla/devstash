// lib/ai/humanInputMarkers.ts
//
// The scaffold step inserts a placeholder wherever the post would be stronger
// with the author's real, first-hand substance (tested code, a real metric, an
// actual anecdote) instead of fabricating it. The marker shape is defined once
// here so the draft prompt, the "human input needed" metric, and the UI
// highlight all agree on exactly what a placeholder looks like — the same
// single-source-of-truth approach as lib/ai/aiTellPhrases.ts.
//
// Shape: [TODO: what real input is needed]

// Raw regex source (no flags) so callers can compose it — e.g. the UI builds a
// combined highlight pattern from this plus the AI-tell phrases.
export const HUMAN_INPUT_MARKER_SOURCE = '\\[TODO:[^\\]]*\\]'

/** How many human-input placeholders the scaffold left for the author to fill. */
export function countHumanInputMarkers(text: string): number {
  return (text.match(new RegExp(HUMAN_INPUT_MARKER_SOURCE, 'gi')) ?? []).length
}

/** Whether a string is exactly one placeholder marker (used by the UI highlighter). */
export function isHumanInputMarker(segment: string): boolean {
  return new RegExp(`^${HUMAN_INPUT_MARKER_SOURCE}$`, 'i').test(segment)
}
