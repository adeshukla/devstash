import type { ReactNode } from 'react'
import type { PaletteKey } from './illustrationEngine'
import { cssVar, resolveToken, type ColorKey, type Theme } from './designTokens'

export type CharacterScene =
  | 'wave'
  | 'present'
  | 'boardroom'
  | 'team'
  | 'handshake'
  | 'celebrate'
  | 'idea'
export type PersonStyle = 'masculine' | 'feminine'
export type Density = 1 | 2 | 3

export const CHARACTER_SCENES: CharacterScene[] = [
  'wave',
  'present',
  'boardroom',
  'team',
  'handshake',
  'celebrate',
  'idea',
]

export const CHARACTER_SCENE_LABELS: Record<CharacterScene, string> = {
  wave: 'Wave hello',
  present: 'Solo presenting',
  boardroom: 'Boardroom presentation',
  team: 'Team',
  handshake: 'Handshake / deal',
  celebrate: 'Celebrating',
  idea: 'Idea',
}

export const PERSON_STYLE_LABELS: Record<PersonStyle, string> = {
  masculine: 'Masculine',
  feminine: 'Feminine',
}

export const SKIN_TONES = [
  { name: 'Deep', value: '#8d5524' },
  { name: 'Tan', value: '#c68642' },
  { name: 'Light tan', value: '#e0ac69' },
  { name: 'Fair', value: '#f1c27d' },
  { name: 'Porcelain', value: '#ffdbac' },
]

// Clothing/skin detail colors that don't change between themes — a white
// shirt is white regardless of light/dark mode, same as skin and hair.
const HAIR = '#2b2320'
const HAIR_ALT = '#4a2f1c'
const FACE = '#2a2118'
const SHIRT = '#eef1f6'
const SHOE = '#20242e'
const SCREEN_DARK = '#0f1420'
const BLUSH = '#e8846b'

/** A color reference is either a ds-token key (resolved per render mode) or
 * a literal hex string (skin/hair/shirt/shoe — theme-invariant). */
type Paint = ColorKey | string
const TOKEN_KEYS = new Set<ColorKey>([
  'bg',
  'surface',
  'surface2',
  'accent',
  'purple',
  'success',
  'warning',
  'error',
  'muted',
])
function resolvePaint(paint: Paint, mode: 'live' | Theme): string {
  if (TOKEN_KEYS.has(paint as ColorKey)) {
    return mode === 'live' ? cssVar(paint as ColorKey) : resolveToken(paint as ColorKey, mode)
  }
  return paint
}

const PALETTES: Record<Exclude<PaletteKey, 'auto'>, [ColorKey, ColorKey]> = {
  'accent-purple': ['accent', 'purple'],
  warm: ['warning', 'error'],
  cool: ['accent', 'success'],
  mono: ['muted', 'muted'],
}

const AUTO_PALETTES: [ColorKey, ColorKey][] = [
  ['accent', 'purple'],
  ['accent', 'success'],
  ['purple', 'warning'],
  ['success', 'accent'],
]

const BG_TINTS: ColorKey[] = ['surface2', 'surface2', 'surface2']

function hashSeed(seed: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return Math.abs(hash)
}

function mulberry32(a: number) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Rng = () => number

export type CPart =
  | { kind: 'circle'; cx: number; cy: number; r: number; fill: Paint; opacity?: number }
  | {
      kind: 'rect'
      x: number
      y: number
      w: number
      h: number
      rx?: number
      fill: Paint
      opacity?: number
    }
  | {
      kind: 'path'
      d: string
      fill?: Paint
      stroke?: Paint
      strokeWidth?: number
      opacity?: number
    }
  | {
      kind: 'group'
      children: CPart[]
      motion?: 'wave' | 'floaty' | 'breathe' | 'growUp' | 'waveSmooth' | 'blink'
      originX?: number
      originY?: number
    }

type Pose = 'idle' | 'wave' | 'present' | 'celebrate' | 'reach'

function gestureArm(
  shoulderX: number,
  shoulderY: number,
  s: number,
  outfit: Paint,
  pose: Pose
): CPart {
  if (pose === 'wave' || pose === 'celebrate') {
    return {
      kind: 'group',
      motion: 'wave',
      originX: shoulderX,
      originY: shoulderY,
      children: [
        {
          kind: 'rect',
          x: shoulderX - 4 * s,
          y: shoulderY - 30 * s,
          w: 8 * s,
          h: 32 * s,
          rx: 4 * s,
          fill: outfit,
        },
        {
          kind: 'rect',
          x: shoulderX - 4 * s,
          y: shoulderY - 4 * s,
          w: 8 * s,
          h: 6 * s,
          fill: SHIRT,
          opacity: 0.9,
        },
        { kind: 'circle', cx: shoulderX, cy: shoulderY - 32 * s, r: 5 * s, fill: SKIN_PLACEHOLDER },
      ],
    }
  }
  if (pose === 'present') {
    return {
      kind: 'group',
      originX: shoulderX,
      originY: shoulderY,
      children: [
        {
          kind: 'rect',
          x: shoulderX,
          y: shoulderY - 2 * s,
          w: 30 * s,
          h: 8 * s,
          rx: 4 * s,
          fill: outfit,
        },
        {
          kind: 'circle',
          cx: shoulderX + 30 * s,
          cy: shoulderY + 2 * s,
          r: 5 * s,
          fill: SKIN_PLACEHOLDER,
        },
      ],
    }
  }
  if (pose === 'reach') {
    return {
      kind: 'group',
      originX: shoulderX,
      originY: shoulderY,
      children: [
        {
          kind: 'rect',
          x: shoulderX,
          y: shoulderY + 4 * s,
          w: 26 * s,
          h: 7 * s,
          rx: 3.5 * s,
          fill: outfit,
        },
        {
          kind: 'circle',
          cx: shoulderX + 26 * s,
          cy: shoulderY + 7.5 * s,
          r: 4.5 * s,
          fill: SKIN_PLACEHOLDER,
        },
      ],
    }
  }
  return {
    kind: 'group',
    children: [
      {
        kind: 'rect',
        x: shoulderX - 4 * s,
        y: shoulderY,
        w: 8 * s,
        h: 30 * s,
        rx: 4 * s,
        fill: outfit,
      },
      {
        kind: 'rect',
        x: shoulderX - 4 * s,
        y: shoulderY + 26 * s,
        w: 8 * s,
        h: 5 * s,
        fill: SHIRT,
        opacity: 0.9,
      },
      { kind: 'circle', cx: shoulderX, cy: shoulderY + 34 * s, r: 4.5 * s, fill: SKIN_PLACEHOLDER },
    ],
  }
}

// person() substitutes the real skin tone in place of this sentinel so
// gestureArm() doesn't need skin threaded through every call site.
const SKIN_PLACEHOLDER = '@@skin@@'
function withSkin(parts: CPart[], skin: string): CPart[] {
  return parts.map((p) => {
    if (p.kind === 'group') return { ...p, children: withSkin(p.children, skin) }
    if (
      (p.kind === 'circle' || p.kind === 'rect' || p.kind === 'path') &&
      p.fill === SKIN_PLACEHOLDER
    ) {
      return { ...p, fill: skin }
    }
    return p
  })
}

function hairShapes(
  style: PersonStyle,
  cx: number,
  headCy: number,
  headR: number,
  hairColor: string
): CPart[] {
  const cap: CPart = {
    kind: 'path',
    d: `M ${cx - headR} ${headCy} A ${headR} ${headR} 0 0 1 ${cx + headR} ${headCy} L ${cx + headR} ${headCy - headR * 0.35} A ${headR} ${headR * 0.75} 0 0 0 ${cx - headR} ${headCy - headR * 0.35} Z`,
    fill: hairColor,
  }
  if (style === 'masculine') return [cap]
  const bun: CPart = {
    kind: 'circle',
    cx,
    cy: headCy - headR * 1.1,
    r: headR * 0.4,
    fill: hairColor,
  }
  const sideLeft: CPart = {
    kind: 'path',
    d: `M ${cx - headR * 0.95} ${headCy - headR * 0.2} Q ${cx - headR * 1.35} ${headCy + headR * 0.9}, ${cx - headR * 0.55} ${headCy + headR * 1.15} L ${cx - headR * 0.35} ${headCy + headR * 0.85} Q ${cx - headR * 0.85} ${headCy + headR * 0.3}, ${cx - headR * 0.65} ${headCy - headR * 0.15} Z`,
    fill: hairColor,
  }
  const sideRight: CPart = {
    kind: 'path',
    d: `M ${cx + headR * 0.95} ${headCy - headR * 0.2} Q ${cx + headR * 1.35} ${headCy + headR * 0.9}, ${cx + headR * 0.55} ${headCy + headR * 1.15} L ${cx + headR * 0.35} ${headCy + headR * 0.85} Q ${cx + headR * 0.85} ${headCy + headR * 0.3}, ${cx + headR * 0.65} ${headCy - headR * 0.15} Z`,
    fill: hairColor,
  }
  return [cap, sideLeft, sideRight, bun]
}

interface PersonOptions {
  cx: number
  groundY: number
  scale: number
  skin: string
  style: PersonStyle
  outfit: Paint
  accent: Paint
  pose: Pose
  seated?: boolean
  rng: Rng
}

/** A single flat-icon corporate figure — head, hair, blazer-over-shirt torso
 * with lapels, tie/neckline detail, cuffed sleeves, trousers, and shoes,
 * built from one shared geometry so every scene stays visually consistent.
 * Deliberately stylized (flat shapes, simplified face) rather than aiming
 * for photorealism, which hand-authored SVG can't credibly deliver. */
function person(opts: PersonOptions): CPart {
  const { cx, groundY, scale: s, skin, style, outfit, accent, pose, seated, rng } = opts
  const legH = (seated ? 20 : 34) * s
  const headR = 15 * s
  const headCy = groundY - 100 * s
  const shoulderY = groundY - 78 * s
  const leftShoulderX = cx - 15 * s
  const rightShoulderX = cx + 15 * s
  const torsoTop = groundY - 80 * s
  const torsoH = 48 * s
  const torsoW = 36 * s
  const hairColor = rng() > 0.65 ? HAIR_ALT : HAIR

  const leftArmParts =
    pose === 'celebrate'
      ? [gestureArm(leftShoulderX, shoulderY, s, outfit, 'celebrate')]
      : [
          {
            kind: 'rect' as const,
            x: leftShoulderX - 6 * s,
            y: shoulderY,
            w: 8 * s,
            h: 30 * s,
            rx: 4 * s,
            fill: outfit,
          },
          {
            kind: 'rect' as const,
            x: leftShoulderX - 6 * s,
            y: shoulderY + 26 * s,
            w: 8 * s,
            h: 5 * s,
            fill: SHIRT,
            opacity: 0.9,
          },
          {
            kind: 'circle' as const,
            cx: leftShoulderX - 2 * s,
            cy: shoulderY + 34 * s,
            r: 4.5 * s,
            fill: SKIN_PLACEHOLDER,
          },
        ]

  const rightArm = gestureArm(rightShoulderX, shoulderY, s, outfit, pose)

  const panelW = torsoW * 0.42
  const clothing: CPart[] = [
    // shirt base
    { kind: 'rect', x: cx - torsoW / 2, y: torsoTop, w: torsoW, h: torsoH, rx: 8 * s, fill: SHIRT },
    // blazer panels either side, leaving a V of shirt showing
    {
      kind: 'rect',
      x: cx - torsoW / 2,
      y: torsoTop,
      w: panelW,
      h: torsoH,
      rx: 6 * s,
      fill: outfit,
    },
    {
      kind: 'rect',
      x: cx + torsoW / 2 - panelW,
      y: torsoTop,
      w: panelW,
      h: torsoH,
      rx: 6 * s,
      fill: outfit,
    },
    // lapel notches
    {
      kind: 'path',
      d: `M ${cx - torsoW * 0.06} ${torsoTop} L ${cx - torsoW * 0.02} ${torsoTop + 9 * s} L ${cx - torsoW * 0.18} ${torsoTop + 5 * s} Z`,
      fill: outfit,
    },
    {
      kind: 'path',
      d: `M ${cx + torsoW * 0.06} ${torsoTop} L ${cx + torsoW * 0.02} ${torsoTop + 9 * s} L ${cx + torsoW * 0.18} ${torsoTop + 5 * s} Z`,
      fill: outfit,
    },
  ]
  if (style === 'masculine' && rng() > 0.35) {
    clothing.push({
      kind: 'rect',
      x: cx - 2.2 * s,
      y: torsoTop + 3 * s,
      w: 4.4 * s,
      h: 24 * s,
      fill: accent,
    })
  }

  const legs: CPart[] = [
    { kind: 'rect', x: cx - 12 * s, y: groundY - legH, w: 9 * s, h: legH, rx: 3 * s, fill: accent },
    { kind: 'rect', x: cx + 3 * s, y: groundY - legH, w: 9 * s, h: legH, rx: 3 * s, fill: accent },
  ]
  const shoes: CPart[] = seated
    ? []
    : [
        {
          kind: 'rect',
          x: cx - 13 * s,
          y: groundY - 4 * s,
          w: 11 * s,
          h: 5 * s,
          rx: 2.5 * s,
          fill: SHOE,
        },
        {
          kind: 'rect',
          x: cx + 2 * s,
          y: groundY - 4 * s,
          w: 11 * s,
          h: 5 * s,
          rx: 2.5 * s,
          fill: SHOE,
        },
      ]

  const face: CPart[] = [
    { kind: 'circle', cx: cx - 5 * s, cy: headCy + 2 * s, r: 1.5 * s, fill: FACE },
    { kind: 'circle', cx: cx + 5 * s, cy: headCy + 2 * s, r: 1.5 * s, fill: FACE },
    {
      kind: 'path',
      d: `M ${cx - 7 * s} ${headCy - 4 * s} l 4 -1.5`,
      stroke: FACE,
      strokeWidth: 1.2 * s,
    },
    {
      kind: 'path',
      d: `M ${cx + 7 * s} ${headCy - 4 * s} l -4 -1.5`,
      stroke: FACE,
      strokeWidth: 1.2 * s,
    },
    {
      kind: 'path',
      d: `M ${cx - 5 * s} ${headCy + 7 * s} Q ${cx} ${headCy + 11 * s}, ${cx + 5 * s} ${headCy + 7 * s}`,
      stroke: FACE,
      strokeWidth: 1.4 * s,
    },
  ]

  const children: CPart[] = [
    ...legs,
    ...shoes,
    ...clothing,
    ...leftArmParts,
    rightArm,
    { kind: 'circle', cx, cy: headCy, r: headR, fill: skin },
    ...hairShapes(style, cx, headCy, headR, hairColor),
    ...face,
  ]

  return withSkin([{ kind: 'group', motion: 'breathe', children }], skin)[0]
}

// ---------------------------------------------------------------------------
// Chibi character v1 — hand-authored bezier silhouette, used ONLY by
// sceneWave() for now. Rects/circles stacked at odd proportions read as
// "programmatic" rather than a real character; this replaces the torso and
// limbs with smooth tapered <path> shapes and bigger, more expressive
// chibi/mascot proportions (big head, small body). Kept separate from
// person() so the other 6 scenes are untouched until this one is approved
// and the geometry is rolled out to them.

/** A tapered limb silhouette — wider at the joint end, narrower at the
 * extremity, with a slight outward belly instead of straight sides so it
 * reads as a limb rather than a ruler. */
function taperedLimb(
  x: number,
  topY: number,
  botY: number,
  topHalfW: number,
  botHalfW: number,
  bulge: number,
  fill: Paint
): CPart {
  const midY = topY + (botY - topY) * 0.55
  return {
    kind: 'path',
    d: `M ${x - topHalfW} ${topY}
        C ${x - topHalfW - bulge} ${midY}, ${x - botHalfW - bulge} ${botY - (botY - midY) * 0.6}, ${x - botHalfW} ${botY}
        L ${x + botHalfW} ${botY}
        C ${x + botHalfW + bulge} ${botY - (botY - midY) * 0.6}, ${x + topHalfW + bulge} ${midY}, ${x + topHalfW} ${topY}
        Z`,
    fill,
  }
}

interface ChibiPersonOptions {
  cx: number
  groundY: number
  scale: number
  skin: string
  style: PersonStyle
  outfit: Paint
  accent: Paint
  rng: Rng
}

/** A chibi/mascot-proportioned figure with a soft bezier torso, tapered
 * limbs, an expressive face (big eyes, eyebrows, filled smile, blush) and a
 * blink loop — v1 of the illustration-quality rework, waving hello. */
function personChibi(opts: ChibiPersonOptions): CPart {
  const { cx, groundY, scale: s, skin, style, outfit, accent, rng } = opts

  const headR = 24 * s
  const neckH = 3 * s
  const neckHalfW = 6 * s
  const torsoH = 30 * s
  const shoulderHalfW = 19 * s
  const waistHalfW = 14 * s
  const legH = 20 * s
  const torsoTop = groundY - legH - torsoH
  const torsoBottom = torsoTop + torsoH
  const headCy = torsoTop - neckH - headR
  const hairColor = rng() > 0.65 ? HAIR_ALT : HAIR

  const torsoOuter: CPart = {
    kind: 'path',
    d: `M ${cx - shoulderHalfW} ${torsoTop + 6 * s}
        C ${cx - shoulderHalfW} ${torsoTop + 1 * s}, ${cx - shoulderHalfW * 0.5} ${torsoTop - 2 * s}, ${cx - neckHalfW} ${torsoTop - 1 * s}
        L ${cx + neckHalfW} ${torsoTop - 1 * s}
        C ${cx + shoulderHalfW * 0.5} ${torsoTop - 2 * s}, ${cx + shoulderHalfW} ${torsoTop + 1 * s}, ${cx + shoulderHalfW} ${torsoTop + 6 * s}
        C ${cx + shoulderHalfW + 2 * s} ${torsoTop + torsoH * 0.45}, ${cx + waistHalfW + 3 * s} ${torsoTop + torsoH * 0.75}, ${cx + waistHalfW} ${torsoBottom - 4 * s}
        Q ${cx + waistHalfW * 0.6} ${torsoBottom + 3 * s}, ${cx} ${torsoBottom + 3 * s}
        Q ${cx - waistHalfW * 0.6} ${torsoBottom + 3 * s}, ${cx - waistHalfW} ${torsoBottom - 4 * s}
        C ${cx - waistHalfW - 3 * s} ${torsoTop + torsoH * 0.75}, ${cx - shoulderHalfW - 2 * s} ${torsoTop + torsoH * 0.45}, ${cx - shoulderHalfW} ${torsoTop + 6 * s}
        Z`,
    fill: outfit,
  }
  const shirtInsert: CPart = {
    kind: 'path',
    d: `M ${cx - neckHalfW * 0.9} ${torsoTop + 1 * s}
        L ${cx + neckHalfW * 0.9} ${torsoTop + 1 * s}
        L ${cx + neckHalfW * 0.5} ${torsoTop + 10 * s}
        Q ${cx} ${torsoTop + 13 * s}, ${cx - neckHalfW * 0.5} ${torsoTop + 10 * s}
        Z`,
    fill: SHIRT,
  }
  const clothing: CPart[] = [torsoOuter, shirtInsert]
  if (style === 'masculine' && rng() > 0.35) {
    clothing.push({
      kind: 'path',
      d: `M ${cx - 1.6 * s} ${torsoTop + 9 * s} L ${cx + 1.6 * s} ${torsoTop + 9 * s} L ${cx + 1 * s} ${torsoTop + 22 * s} L ${cx} ${torsoTop + 25 * s} L ${cx - 1 * s} ${torsoTop + 22 * s} Z`,
      fill: accent,
    })
  }

  const legGap = 6 * s
  const legs: CPart[] = [
    taperedLimb(cx - legGap, torsoBottom - 2 * s, groundY - 4 * s, 6 * s, 4.5 * s, 1 * s, accent),
    taperedLimb(cx + legGap, torsoBottom - 2 * s, groundY - 4 * s, 6 * s, 4.5 * s, 1 * s, accent),
  ]
  const shoes: CPart[] = [
    { kind: 'circle', cx: cx - legGap, cy: groundY - 3 * s, r: 4.5 * s, fill: SHOE },
    { kind: 'circle', cx: cx + legGap, cy: groundY - 3 * s, r: 4.5 * s, fill: SHOE },
  ]

  const leftShoulderX = cx - shoulderHalfW * 0.85
  const rightShoulderX = cx + shoulderHalfW * 0.85
  const armTop = torsoTop + 5 * s

  const leftArm: CPart = {
    kind: 'group',
    children: [
      taperedLimb(leftShoulderX, armTop, armTop + 22 * s, 5 * s, 3.6 * s, 0.6 * s, outfit),
      {
        kind: 'circle',
        cx: leftShoulderX,
        cy: armTop + 24 * s,
        r: 3.6 * s,
        fill: SKIN_PLACEHOLDER,
      },
    ],
  }
  // The waving arm gets its own motion key (not the shared "wave" every
  // other scene's gestureArm uses) so its easing can be tuned without
  // touching those scenes before this rework is approved.
  const rightArm: CPart = {
    kind: 'group',
    motion: 'waveSmooth',
    originX: rightShoulderX,
    originY: armTop,
    children: [
      taperedLimb(rightShoulderX, armTop - 20 * s, armTop, 3.6 * s, 5 * s, 0.6 * s, outfit),
      { kind: 'circle', cx: rightShoulderX, cy: armTop - 22 * s, r: 4 * s, fill: SKIN_PLACEHOLDER },
    ],
  }

  const eyeDy = -1 * s
  const eyeDx = 7 * s
  const eyeRy = 3.4 * s
  const eyeRx = 2.6 * s
  const face: CPart[] = [
    // big filled eyes read as friendly/expressive rather than dot-like
    { kind: 'circle', cx: cx - eyeDx, cy: headCy + eyeDy, r: eyeRy, fill: FACE },
    { kind: 'circle', cx: cx + eyeDx, cy: headCy + eyeDy, r: eyeRy, fill: FACE },
    // eyebrows
    {
      kind: 'path',
      d: `M ${cx - eyeDx - eyeRx} ${headCy + eyeDy - eyeRy - 2 * s} q ${eyeRx} -2, ${eyeRx * 2} 0`,
      stroke: FACE,
      strokeWidth: 1.4 * s,
    },
    {
      kind: 'path',
      d: `M ${cx + eyeDx - eyeRx} ${headCy + eyeDy - eyeRy - 2 * s} q ${eyeRx} -2, ${eyeRx * 2} 0`,
      stroke: FACE,
      strokeWidth: 1.4 * s,
    },
    // filled open smile — a wave/greeting expression, not a thin stroke arc
    {
      kind: 'path',
      d: `M ${cx - 6 * s} ${headCy + 8 * s} Q ${cx} ${headCy + 15 * s}, ${cx + 6 * s} ${headCy + 8 * s} Q ${cx} ${headCy + 12 * s}, ${cx - 6 * s} ${headCy + 8 * s} Z`,
      fill: FACE,
    },
    // blush
    {
      kind: 'circle',
      cx: cx - eyeDx - 1 * s,
      cy: headCy + 6 * s,
      r: 2.6 * s,
      fill: BLUSH,
      opacity: 0.4,
    },
    {
      kind: 'circle',
      cx: cx + eyeDx + 1 * s,
      cy: headCy + 6 * s,
      r: 2.6 * s,
      fill: BLUSH,
      opacity: 0.4,
    },
  ]

  // Eyelids sit over the eyes, normally scaled to nothing and periodically
  // scaling up to cover them — a cheap, high-life-to-effort periodic blink.
  const blink: CPart = {
    kind: 'group',
    motion: 'blink',
    children: [
      {
        kind: 'rect',
        x: cx - eyeDx - eyeRy,
        y: headCy + eyeDy - eyeRy,
        w: eyeRy * 2,
        h: eyeRy * 2,
        fill: skin,
      },
      {
        kind: 'rect',
        x: cx + eyeDx - eyeRy,
        y: headCy + eyeDy - eyeRy,
        w: eyeRy * 2,
        h: eyeRy * 2,
        fill: skin,
      },
    ],
  }

  const children: CPart[] = [
    ...legs,
    ...shoes,
    ...clothing,
    leftArm,
    rightArm,
    { kind: 'circle', cx, cy: headCy, r: headR, fill: skin },
    ...hairShapes(style, cx, headCy, headR, hairColor),
    ...face,
    blink,
  ]

  return withSkin([{ kind: 'group', motion: 'breathe', children }], skin)[0]
}

function greetingArcs(cx: number, cy: number, color: Paint): CPart {
  const arcs: CPart[] = [0, 1, 2].map((i) => ({
    kind: 'path',
    d: `M ${cx + 10 + i * 8} ${cy - 6 - i * 3} q ${6 + i * 2} ${-4} ${0} ${-10 - i * 2}`,
    stroke: color,
    strokeWidth: 2,
    opacity: 0.6 - i * 0.15,
  }))
  return { kind: 'group', motion: 'floaty', children: arcs }
}

function sceneWave(
  rng: Rng,
  skin: string,
  style: PersonStyle,
  colors: [ColorKey, ColorKey]
): CPart[] {
  const p = personChibi({
    cx: 185,
    groundY: 195,
    scale: 1.5,
    skin,
    style,
    outfit: colors[0],
    accent: colors[1],
    rng,
  })
  return [p, greetingArcs(260, 65, colors[1])]
}

function chartScreen(
  rng: Rng,
  x: number,
  y: number,
  w: number,
  h: number,
  colors: [ColorKey, ColorKey],
  density: Density,
  motion: 'growUp' | undefined
): CPart[] {
  const parts: CPart[] = [
    { kind: 'rect', x, y, w, h, rx: 4, fill: SCREEN_DARK },
    { kind: 'rect', x: x + 3, y: y + 3, w: w - 6, h: h - 6, rx: 2, fill: 'surface2' },
  ]
  const n = 3 + density
  const innerW = w - 16
  const barWidth = innerW / n - 4
  const baseline = y + h - 8
  for (let i = 0; i < n; i++) {
    const barH = (h - 20) * (0.3 + rng() * 0.6) * ((i + 1) / n)
    parts.push({
      kind: 'group',
      motion,
      originX: x + 8 + i * (barWidth + 4) + barWidth / 2,
      originY: baseline,
      children: [
        {
          kind: 'rect',
          x: x + 8 + i * (barWidth + 4),
          y: baseline - barH,
          w: barWidth,
          h: barH,
          rx: 1.5,
          fill: i === n - 1 ? colors[1] : colors[0],
          opacity: 0.9,
        },
      ],
    })
  }
  return parts
}

function scenePresent(
  rng: Rng,
  skin: string,
  style: PersonStyle,
  colors: [ColorKey, ColorKey],
  density: Density
): CPart[] {
  const p = person({
    cx: 145,
    groundY: 195,
    scale: 1.35,
    skin,
    style,
    outfit: colors[0],
    accent: colors[1],
    pose: 'present',
    rng,
  })
  const chart = chartScreen(rng, 195, 100, 150, 90, colors, density, 'growUp')
  return [p, { kind: 'group', children: chart }]
}

function windowProp(x: number, y: number, w: number, h: number): CPart {
  const blinds: CPart[] = []
  const rows = 4
  for (let i = 0; i < rows; i++) {
    blinds.push({
      kind: 'rect',
      x,
      y: y + (i * h) / rows + 2,
      w,
      h: 3,
      fill: 'surface2',
      opacity: 0.6,
    })
  }
  return {
    kind: 'group',
    children: [{ kind: 'rect', x, y, w, h, rx: 3, fill: 'surface', opacity: 0.7 }, ...blinds],
  }
}

function tableProp(x: number, y: number, w: number, h: number): CPart {
  return { kind: 'rect', x, y, w, h, rx: h / 2, fill: 'surface', opacity: 0.95 }
}

function sceneBoardroom(
  rng: Rng,
  skin: string,
  style: PersonStyle,
  colors: [ColorKey, ColorKey],
  density: Density
): CPart[] {
  const parts: CPart[] = []
  parts.push(windowProp(330, 20, 55, 70))

  const screen = chartScreen(rng, 20, 25, 110, 65, colors, density, 'growUp')
  parts.push({ kind: 'group', children: screen })

  // presenter standing beside the screen
  const presenter = person({
    cx: 165,
    groundY: 205,
    scale: 1.1,
    skin,
    style,
    outfit: colors[0],
    accent: colors[1],
    pose: 'present',
    rng,
  })
  parts.push(presenter)

  // conference table
  parts.push(tableProp(190, 178, 190, 14))

  // seated attendees behind the table
  const seatedCount = 1 + density
  const startX = 225
  const gap = 55
  const seatedSkins = SKIN_TONES.map((t) => t.value)
  const skinStartIndex = Math.max(seatedSkins.indexOf(skin), 0)
  for (let i = 0; i < seatedCount; i++) {
    const tone = seatedSkins[(skinStartIndex + i + 1) % seatedSkins.length]
    const attendeeStyle: PersonStyle =
      i % 2 === 0 ? style : style === 'masculine' ? 'feminine' : 'masculine'
    parts.push(
      person({
        cx: startX + i * gap,
        groundY: 208,
        scale: 0.85,
        skin: tone,
        style: attendeeStyle,
        outfit: i % 2 === 0 ? colors[1] : colors[0],
        accent: i % 2 === 0 ? colors[0] : colors[1],
        pose: 'idle',
        seated: true,
        rng,
      })
    )
  }

  return parts
}

function sceneTeam(
  rng: Rng,
  skin: string,
  style: PersonStyle,
  colors: [ColorKey, ColorKey],
  density: Density
): CPart[] {
  const count = 1 + density
  const spacing = 400 / (count + 1)
  const people: CPart[] = []
  const seatedSkins = SKIN_TONES.map((t) => t.value)
  const startIndex = Math.max(seatedSkins.indexOf(skin), 0)
  for (let i = 0; i < count; i++) {
    const cx = spacing * (i + 1)
    const jitter = (rng() - 0.5) * 6
    const tone = seatedSkins[(startIndex + i) % seatedSkins.length]
    const pose: Pose = i === Math.floor(count / 2) ? 'wave' : 'idle'
    const personStyle: PersonStyle =
      i % 2 === 0 ? style : style === 'masculine' ? 'feminine' : 'masculine'
    people.push(
      person({
        cx: cx + jitter,
        groundY: 200,
        scale: 1.05,
        skin: tone,
        style: personStyle,
        outfit: i % 2 === 0 ? colors[0] : colors[1],
        accent: i % 2 === 0 ? colors[1] : colors[0],
        pose,
        rng,
      })
    )
  }
  return people
}

function sceneHandshake(
  rng: Rng,
  skin: string,
  style: PersonStyle,
  colors: [ColorKey, ColorKey]
): CPart[] {
  const left = person({
    cx: 150,
    groundY: 195,
    scale: 1.3,
    skin,
    style,
    outfit: colors[0],
    accent: colors[1],
    pose: 'reach',
    rng,
  })
  const otherSkin =
    SKIN_TONES[(SKIN_TONES.findIndex((t) => t.value === skin) + 2) % SKIN_TONES.length].value
  const otherStyle: PersonStyle = style === 'masculine' ? 'feminine' : 'masculine'
  const right = person({
    cx: 250,
    groundY: 195,
    scale: 1.3,
    skin: otherSkin,
    style: otherStyle,
    outfit: colors[1],
    accent: colors[0],
    pose: 'reach',
    rng,
  })
  const clasp: CPart = { kind: 'circle', cx: 200, cy: 152, r: 6, fill: skin, opacity: 0.9 }
  return [left, right, clasp]
}

function confetti(rng: Rng, colors: [ColorKey, ColorKey], density: Density): CPart[] {
  const n = 6 + density * 3
  const pieces: CPart[] = []
  for (let i = 0; i < n; i++) {
    const x = 40 + rng() * 320
    const y = 20 + rng() * 90
    const size = 3 + rng() * 4
    pieces.push({
      kind: 'group',
      motion: 'floaty',
      children: [
        rng() > 0.5
          ? {
              kind: 'circle',
              cx: x,
              cy: y,
              r: size / 2,
              fill: i % 2 === 0 ? colors[0] : colors[1],
              opacity: 0.85,
            }
          : {
              kind: 'rect',
              x: x - size / 2,
              y: y - size / 2,
              w: size,
              h: size,
              rx: 1,
              fill: i % 2 === 0 ? colors[1] : colors[0],
              opacity: 0.85,
            },
      ],
    })
  }
  return pieces
}

function sceneCelebrate(
  rng: Rng,
  skin: string,
  style: PersonStyle,
  colors: [ColorKey, ColorKey],
  density: Density
): CPart[] {
  const peopleCount = density
  const people: CPart[] = []
  const spacing = 400 / (peopleCount + 1)
  for (let i = 0; i < peopleCount; i++) {
    people.push(
      person({
        cx: spacing * (i + 1),
        groundY: 200,
        scale: 1.2,
        skin,
        style: i % 2 === 0 ? style : style === 'masculine' ? 'feminine' : 'masculine',
        outfit: i % 2 === 0 ? colors[0] : colors[1],
        accent: i % 2 === 0 ? colors[1] : colors[0],
        pose: 'celebrate',
        rng,
      })
    )
  }
  return [...people, ...confetti(rng, colors, density)]
}

function lightbulb(cx: number, cy: number, colors: [ColorKey, ColorKey]): CPart {
  const rays: CPart[] = [0, 1, 2, 3].map((i) => {
    const angle = (i / 4) * Math.PI * 2 - Math.PI / 4
    const x1 = cx + Math.cos(angle) * 18
    const y1 = cy + Math.sin(angle) * 18
    const x2 = cx + Math.cos(angle) * 26
    const y2 = cy + Math.sin(angle) * 26
    return {
      kind: 'path' as const,
      d: `M ${x1} ${y1} L ${x2} ${y2}`,
      stroke: colors[1],
      strokeWidth: 2,
      opacity: 0.7,
    }
  })
  return {
    kind: 'group',
    motion: 'floaty',
    children: [
      { kind: 'circle', cx, cy, r: 15, fill: colors[1], opacity: 0.9 },
      { kind: 'rect', x: cx - 6, y: cy + 12, w: 12, h: 8, rx: 2, fill: colors[0] },
      ...rays,
    ],
  }
}

function sceneIdea(
  rng: Rng,
  skin: string,
  style: PersonStyle,
  colors: [ColorKey, ColorKey]
): CPart[] {
  const p = person({
    cx: 200,
    groundY: 195,
    scale: 1.5,
    skin,
    style,
    outfit: colors[0],
    accent: colors[1],
    pose: 'idle',
    rng,
  })
  return [p, lightbulb(200, 55, colors)]
}

const SCENE_GENERATORS: Record<
  CharacterScene,
  (
    rng: Rng,
    skin: string,
    style: PersonStyle,
    colors: [ColorKey, ColorKey],
    density: Density
  ) => CPart[]
> = {
  wave: (rng, skin, style, colors) => sceneWave(rng, skin, style, colors),
  present: (rng, skin, style, colors, density) => scenePresent(rng, skin, style, colors, density),
  boardroom: (rng, skin, style, colors, density) =>
    sceneBoardroom(rng, skin, style, colors, density),
  team: (rng, skin, style, colors, density) => sceneTeam(rng, skin, style, colors, density),
  handshake: (rng, skin, style, colors) => sceneHandshake(rng, skin, style, colors),
  celebrate: (rng, skin, style, colors, density) =>
    sceneCelebrate(rng, skin, style, colors, density),
  idea: (rng, skin, style, colors) => sceneIdea(rng, skin, style, colors),
}

export interface CharacterGeneratorOptions {
  scene: CharacterScene
  nonce: number
  density: Density
  palette: PaletteKey
  skinTone: string
  style: PersonStyle
}

export interface CharacterComposition {
  background: ColorKey
  parts: CPart[]
}

/** Composes a corporate scene from a shared person primitive — skin tone,
 * figure style, outfit colors, and team size are all real controls rather
 * than a fixed cast of pre-drawn characters. */
export function generateCharacterComposition(
  options: CharacterGeneratorOptions
): CharacterComposition {
  const { scene, nonce, density, palette, skinTone, style } = options
  const seed = hashSeed(`char::${scene}::${skinTone}::${palette}::${style}::${nonce}`)
  const rng = mulberry32(seed)
  const colors = palette === 'auto' ? AUTO_PALETTES[seed % AUTO_PALETTES.length] : PALETTES[palette]
  const background = BG_TINTS[seed % BG_TINTS.length]
  const parts = SCENE_GENERATORS[scene](rng, skinTone, style, colors, density)
  return { background, parts }
}

function renderPart(part: CPart, key: string | number, motionOn: boolean): ReactNode {
  if (part.kind === 'circle') {
    return (
      <circle
        key={key}
        cx={part.cx}
        cy={part.cy}
        r={part.r}
        fill={resolvePaint(part.fill, 'live')}
        opacity={part.opacity}
      />
    )
  }
  if (part.kind === 'rect') {
    return (
      <rect
        key={key}
        x={part.x}
        y={part.y}
        width={part.w}
        height={part.h}
        rx={part.rx}
        fill={resolvePaint(part.fill, 'live')}
        opacity={part.opacity}
      />
    )
  }
  if (part.kind === 'path') {
    return (
      <path
        key={key}
        d={part.d}
        fill={part.fill ? resolvePaint(part.fill, 'live') : 'none'}
        stroke={part.stroke ? resolvePaint(part.stroke, 'live') : undefined}
        strokeWidth={part.strokeWidth}
        strokeLinecap="round"
        opacity={part.opacity}
      />
    )
  }
  const cls =
    motionOn && part.motion
      ? {
          wave: 'ig-char-wave',
          floaty: 'ig-char-floaty',
          breathe: 'ig-char-breathe',
          growUp: 'ig-char-grow',
          waveSmooth: 'ig-char-wave-smooth',
          blink: 'ig-char-blink',
        }[part.motion]
      : undefined
  const style: React.CSSProperties | undefined =
    part.motion === 'wave' || part.motion === 'waveSmooth'
      ? { transformOrigin: `${part.originX}px ${part.originY}px` }
      : part.motion === 'growUp'
        ? {
            transformOrigin: `${part.originX}px ${part.originY}px`,
            transformBox: 'view-box' as const,
          }
        : part.motion === 'floaty' || part.motion === 'breathe' || part.motion === 'blink'
          ? ({
              transformBox: 'fill-box',
              transformOrigin: part.motion === 'breathe' ? 'bottom' : 'center',
            } as React.CSSProperties)
          : undefined
  return (
    <g key={key} className={cls} style={style}>
      {part.children.map((c, i) => renderPart(c, i, motionOn))}
    </g>
  )
}

export function renderCharacterComposition(
  comp: CharacterComposition,
  motionOn: boolean
): ReactNode {
  return (
    <>
      <rect width={400} height={225} fill={resolvePaint(comp.background, 'live')} />
      {comp.parts.map((p, i) => renderPart(p, i, motionOn))}
    </>
  )
}

export const CHARACTER_KEYFRAMES = `
@keyframes igCharWave { 0%, 100% { transform: rotate(-6deg); } 50% { transform: rotate(24deg); } }
@keyframes igCharFloaty { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
@keyframes igCharBreathe { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(1.015); } }
@keyframes igCharGrow { 0% { transform: scaleY(0); } 60% { transform: scaleY(1.06); } 100% { transform: scaleY(1); } }
@keyframes igCharWaveSmooth { 0%, 100% { transform: rotate(-8deg); } 50% { transform: rotate(28deg); } }
@keyframes igCharBlink { 0%, 92%, 100% { transform: scaleY(0); } 96% { transform: scaleY(1); } }
.ig-char-wave { animation: igCharWave 1.6s ease-in-out infinite; }
.ig-char-floaty { animation: igCharFloaty 2.4s ease-in-out infinite; }
.ig-char-breathe { animation: igCharBreathe 3.2s ease-in-out infinite; }
.ig-char-grow { animation: igCharGrow 1.1s cubic-bezier(0.34, 1.4, 0.64, 1) both; }
.ig-char-wave-smooth { animation: igCharWaveSmooth 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) infinite; }
.ig-char-blink { animation: igCharBlink 4s ease-in-out infinite; }
`.trim()

function partToSvg(part: CPart, motionOn: boolean, theme: Theme): string {
  if (part.kind === 'circle') {
    const opacity = part.opacity !== undefined ? ` opacity="${part.opacity}"` : ''
    return `<circle cx="${part.cx.toFixed(1)}" cy="${part.cy.toFixed(1)}" r="${part.r.toFixed(1)}" fill="${resolvePaint(part.fill, theme)}"${opacity} />`
  }
  if (part.kind === 'rect') {
    const rx = part.rx ? ` rx="${part.rx}"` : ''
    const opacity = part.opacity !== undefined ? ` opacity="${part.opacity}"` : ''
    return `<rect x="${part.x.toFixed(1)}" y="${part.y.toFixed(1)}" width="${part.w.toFixed(1)}" height="${part.h.toFixed(1)}"${rx} fill="${resolvePaint(part.fill, theme)}"${opacity} />`
  }
  if (part.kind === 'path') {
    const fill = ` fill="${part.fill ? resolvePaint(part.fill, theme) : 'none'}"`
    const stroke = part.stroke
      ? ` stroke="${resolvePaint(part.stroke, theme)}" stroke-width="${part.strokeWidth ?? 1}" stroke-linecap="round"`
      : ''
    const opacity = part.opacity !== undefined ? ` opacity="${part.opacity}"` : ''
    return `<path d="${part.d}"${fill}${stroke}${opacity} />`
  }
  const clsName = part.motion
    ? {
        wave: 'ig-char-wave',
        floaty: 'ig-char-floaty',
        breathe: 'ig-char-breathe',
        growUp: 'ig-char-grow',
        waveSmooth: 'ig-char-wave-smooth',
        blink: 'ig-char-blink',
      }[part.motion]
    : undefined
  const cls = motionOn && clsName ? ` class="${clsName}"` : ''
  const style =
    part.motion === 'wave' || part.motion === 'waveSmooth'
      ? ` style="transform-origin: ${part.originX}px ${part.originY}px;"`
      : part.motion === 'growUp'
        ? ` style="transform-origin: ${part.originX}px ${part.originY}px; transform-box: view-box;"`
        : part.motion === 'floaty' || part.motion === 'breathe' || part.motion === 'blink'
          ? ` style="transform-box: fill-box; transform-origin: ${part.motion === 'breathe' ? 'bottom' : 'center'};"`
          : ''
  const inner = part.children.map((c) => partToSvg(c, motionOn, theme)).join('\n  ')
  return `<g${cls}${style}>\n  ${inner}\n</g>`
}

/** Serializes a composition to a standalone SVG string for ONE specific
 * theme — literal hex values, matching whichever preview (light/dark) the
 * code was copied from. */
export function serializeCharacterComposition(
  comp: CharacterComposition,
  motionOn: boolean,
  theme: Theme
): string {
  const styleTag = motionOn ? `\n  <style>${CHARACTER_KEYFRAMES}</style>` : ''
  const body = comp.parts.map((p) => partToSvg(p, motionOn, theme)).join('\n')
  return `<svg viewBox="0 0 400 225" xmlns="http://www.w3.org/2000/svg">${styleTag}
  <rect width="400" height="225" fill="${resolvePaint(comp.background, theme)}" />
${body}
</svg>`
}
