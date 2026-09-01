// components/lab/illustrationFinish.ts
//
// How shapes are filled and lit.
//
// Every shape used to take a flat token colour, which is why compositions read
// as diagram-flat no matter how good the layout was. Finish adds the two things
// that actually separate a considered illustration from a chart: a gradient
// across the form, and light around it.
//
// The markup is generated once here and shared by both render paths (React and
// the serialized standalone string) so a copied SVG looks identical to the
// preview, gradients and filters included.

import { resolveToken, type ColorKey, type Theme } from './designTokens'

export type FinishKey = 'flat' | 'gradient' | 'duotone' | 'glow'

export const FINISH_LABELS: Record<FinishKey, string> = {
  // "Solid", not "Flat" — Backdrop already has a "Flat" option, and two
  // controls offering the same word is a genuine ambiguity for the user.
  flat: 'Solid',
  gradient: 'Gradient',
  duotone: 'Duotone',
  glow: 'Glow',
}

export const ALL_FINISHES: FinishKey[] = ['flat', 'gradient', 'duotone', 'glow']

/** Stable per-composition ids so two illustrations on one page cannot collide. */
export function finishIds(seed: number) {
  return {
    gradA: `igA${seed}`,
    gradB: `igB${seed}`,
    glow: `igGlow${seed}`,
  }
}

/**
 * Which paint a shape should use. Duotone alternates the two gradients so a
 * composition reads as two related families rather than one flat wash.
 */
export function shapeFill(
  finish: FinishKey,
  token: ColorKey,
  index: number,
  seed: number,
  theme: Theme
): string {
  if (finish === 'flat') return resolveToken(token, theme)
  const ids = finishIds(seed)
  if (finish === 'duotone') return `url(#${index % 2 === 0 ? ids.gradA : ids.gradB})`
  return `url(#${ids.gradA})`
}

/** Shapes get a soft bloom only under the 'glow' finish. */
export function glowFilter(finish: FinishKey, seed: number): string | undefined {
  return finish === 'glow' ? `url(#${finishIds(seed).glow})` : undefined
}

export interface GradientStop {
  offset: string
  color: string
  opacity?: string
}

export interface FinishDefs {
  gradients: { id: string; x1: string; y1: string; x2: string; y2: string; stops: GradientStop[] }[]
  glow?: { id: string; stdDeviation: number }
}

/**
 * The <defs> a finish needs, as data — so the React renderer and the string
 * serializer emit the same thing without duplicating the markup.
 */
export function finishDefs(
  finish: FinishKey,
  colors: [ColorKey, ColorKey],
  seed: number,
  theme: Theme
): FinishDefs | null {
  if (finish === 'flat') return null
  const ids = finishIds(seed)
  const a = resolveToken(colors[0], theme)
  const b = resolveToken(colors[1], theme)

  const gradients = [
    {
      id: ids.gradA,
      x1: '0%',
      y1: '0%',
      x2: '100%',
      y2: '100%',
      stops: [
        { offset: '0%', color: a },
        // Not a hard stop to the second hue: easing through a lighter mid keeps
        // the transition from banding on large shapes.
        { offset: '100%', color: b },
      ],
    },
  ]

  if (finish === 'duotone') {
    gradients.push({
      id: ids.gradB,
      x1: '100%',
      y1: '0%',
      x2: '0%',
      y2: '100%',
      stops: [
        { offset: '0%', color: b },
        { offset: '100%', color: a },
      ],
    })
  }

  return {
    gradients,
    glow: finish === 'glow' ? { id: ids.glow, stdDeviation: 2.4 } : undefined,
  }
}

/** Serialized <defs> for the standalone SVG. */
export function finishDefsToSvg(defs: FinishDefs | null): string {
  if (!defs) return ''
  const grads = defs.gradients
    .map(
      (g) =>
        `<linearGradient id="${g.id}" x1="${g.x1}" y1="${g.y1}" x2="${g.x2}" y2="${g.y2}">${g.stops
          .map(
            (s) =>
              `<stop offset="${s.offset}" stop-color="${s.color}"${s.opacity ? ` stop-opacity="${s.opacity}"` : ''} />`
          )
          .join('')}</linearGradient>`
    )
    .join('')
  const glow = defs.glow
    ? `<filter id="${defs.glow.id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${defs.glow.stdDeviation}" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>`
    : ''
  return grads + glow
}
