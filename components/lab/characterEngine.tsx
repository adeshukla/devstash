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

// Clothing/skin detail colors that don't change between themes — hair,
// face linework, and shoes stay the same regardless of light/dark mode.
const HAIR = '#2b2320'
const HAIR_ALT = '#4a2f1c'
const FACE = '#2a2118'
const SHOE = '#20242e'
const SCREEN_DARK = '#0f1420'

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
      // GSAP's DrawSVG plugin progressively reveals a stroke by tweening
      // stroke-dashoffset; this is the same idea done with a plain CSS
      // keyframe (pathLength="1" makes the dash math shape-independent).
      motion?: 'drawIn'
      motionDelay?: number
    }
  | {
      kind: 'group'
      children: CPart[]
      motion?: 'wave' | 'floaty' | 'breathe' | 'growUp' | 'waveSmooth' | 'blink'
      originX?: number
      originY?: number
      // A per-instance animation-delay (seconds), randomized at composition
      // time. Multiple people breathing/blinking in perfect lockstep reads
      // as mechanical — real GSAP demos stagger otherwise-identical loops
      // with gsap.utils.random() per element for exactly this reason.
      motionDelay?: number
    }

type Pose = 'idle' | 'wave' | 'present' | 'celebrate' | 'reach'

// person() substitutes the real skin tone in place of this sentinel so
// limb-building helpers don't need skin threaded through every call site.
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

/** A robust capsule between two points at (possibly different) widths,
 * built from two elliptical end-caps rather than a hand-tuned bezier
 * bulge — correct at any angle, not just near-vertical, so the same
 * helper covers every arm and leg regardless of pose. */
function limb(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  w1: number,
  w2: number,
  fill: Paint
): CPart {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len
  const ny = dx / len
  const p1a = { x: x1 + nx * w1, y: y1 + ny * w1 }
  const p1b = { x: x1 - nx * w1, y: y1 - ny * w1 }
  const p2a = { x: x2 + nx * w2, y: y2 + ny * w2 }
  const p2b = { x: x2 - nx * w2, y: y2 - ny * w2 }
  return {
    kind: 'path',
    d: `M ${p1a.x} ${p1a.y} L ${p2a.x} ${p2a.y} A ${w2} ${w2} 0 0 1 ${p2b.x} ${p2b.y} L ${p1b.x} ${p1b.y} A ${w1} ${w1} 0 0 1 ${p1a.x} ${p1a.y} Z`,
    fill,
  }
}

/** One arm — a capsule limb plus a small hand blob at the end, optionally
 * wrapped in a motion group that rotates the whole rigid arm around the
 * shoulder (the wave gesture). */
function armPart(
  shoulderX: number,
  shoulderY: number,
  handX: number,
  handY: number,
  s: number,
  outfit: Paint,
  motion?: 'waveSmooth'
): CPart {
  const children: CPart[] = [
    limb(shoulderX, shoulderY, handX, handY, 6 * s, 4 * s, outfit),
    { kind: 'circle', cx: handX, cy: handY, r: 4 * s, fill: SKIN_PLACEHOLDER },
  ]
  if (motion) {
    return { kind: 'group', motion, originX: shoulderX, originY: shoulderY, children }
  }
  return { kind: 'group', children }
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
  // Flips which way "present"/"reach" gestures point — used so two people
  // facing each other (handshake) both reach toward the middle instead of
  // both reaching the same screen direction.
  mirror?: boolean
  rng: Rng
}

/** A flat corporate-illustration figure in the unDraw/Storyset vein: one
 * smooth silhouette for the torso (no separate blazer/lapel panels), robust
 * capsule limbs, and a near-featureless face (small dot eyes, a hint of a
 * smile, no eyebrows/blush) — the reference style is deliberately minimal,
 * not a cartoon/chibi mascot. One shared geometry so every scene stays
 * visually consistent. */
function person(opts: PersonOptions): CPart {
  const { cx, groundY, scale: s, skin, style, outfit, accent, pose, seated, mirror, rng } = opts
  const dir = mirror ? -1 : 1
  const legH = (seated ? 20 : 34) * s
  const headR = 14 * s
  const neckH = 3 * s
  const torsoH = 40 * s
  const shoulderHalfW = 18 * s
  const hipHalfW = 20 * s
  const torsoBottom = groundY - legH
  const torsoTop = torsoBottom - torsoH
  const headCy = torsoTop - neckH - headR
  const hairColor = rng() > 0.65 ? HAIR_ALT : HAIR

  // Narrow neckline, straight diagonal tapers to the hips, one rounded
  // bottom hem (a true semicircle since the arc radius equals half the
  // chord width) — the trailing Z draws the left taper as a plain straight
  // line back to the start point. Deliberately NOT a hand-tuned multi-point
  // bezier: every segment here is a shape whose direction is unambiguous
  // (a line, or an arc between two known points), so there's no room for a
  // curve to bulge the wrong way.
  const torso: CPart = {
    kind: 'path',
    d: `M ${cx - shoulderHalfW} ${torsoTop}
        Q ${cx} ${torsoTop - 4 * s}, ${cx + shoulderHalfW} ${torsoTop}
        L ${cx + hipHalfW} ${torsoBottom}
        A ${hipHalfW} ${hipHalfW} 0 0 1 ${cx - hipHalfW} ${torsoBottom}
        Z`,
    fill: outfit,
  }

  const shoulderY = torsoTop + 10 * s
  const leftShoulderX = cx - shoulderHalfW * 0.75
  const rightShoulderX = cx + shoulderHalfW * 0.75

  const leftArm =
    pose === 'celebrate'
      ? armPart(
          leftShoulderX,
          shoulderY,
          leftShoulderX - 16 * s,
          shoulderY - 28 * s,
          s,
          outfit,
          'waveSmooth'
        )
      : armPart(leftShoulderX, shoulderY, leftShoulderX - 2 * s, shoulderY + 30 * s, s, outfit)

  const rightArm =
    pose === 'wave' || pose === 'celebrate'
      ? armPart(
          rightShoulderX,
          shoulderY,
          rightShoulderX + 16 * s,
          shoulderY - 28 * s,
          s,
          outfit,
          'waveSmooth'
        )
      : pose === 'present'
        ? armPart(
            rightShoulderX,
            shoulderY,
            rightShoulderX + 34 * s * dir,
            shoulderY + 6 * s,
            s,
            outfit
          )
        : pose === 'reach'
          ? armPart(
              rightShoulderX,
              shoulderY,
              rightShoulderX + 30 * s * dir,
              shoulderY + 8 * s,
              s,
              outfit
            )
          : armPart(
              rightShoulderX,
              shoulderY,
              rightShoulderX + 2 * s,
              shoulderY + 30 * s,
              s,
              outfit
            )

  // The torso's rounded hip hem bulges down by hipHalfW at its very center,
  // so starting the legs right at torsoBottom would mean the torso paints
  // over most (or all) of the leg before it ever pokes out — reading as a
  // gap between two disconnected shapes. Starting a few px inside the
  // hem's actual curve (computed from the circle it traces, not guessed)
  // guarantees the leg begins exactly where the hip silhouette ends.
  const legGap = 7 * s
  const hipHemAtLeg = Math.sqrt(Math.max(hipHalfW * hipHalfW - legGap * legGap, 0))
  const legTop = torsoBottom + hipHemAtLeg - 4 * s
  const legs: CPart[] = [
    limb(cx - legGap, legTop, cx - legGap, groundY - 4 * s, 6 * s, 5 * s, accent),
    limb(cx + legGap, legTop, cx + legGap, groundY - 4 * s, 6 * s, 5 * s, accent),
  ]
  const shoes: CPart[] = seated
    ? []
    : [
        { kind: 'circle', cx: cx - legGap, cy: groundY - 3 * s, r: 4.5 * s, fill: SHOE },
        { kind: 'circle', cx: cx + legGap, cy: groundY - 3 * s, r: 4.5 * s, fill: SHOE },
      ]

  // Deliberately minimal — small dot eyes and a hint of a smile, no
  // eyebrows/big filled mouth/blush. That near-featureless face is the
  // actual reference style, not an oversight.
  const face: CPart[] = [
    { kind: 'circle', cx: cx - 4 * s, cy: headCy, r: 1.4 * s, fill: FACE },
    { kind: 'circle', cx: cx + 4 * s, cy: headCy, r: 1.4 * s, fill: FACE },
    {
      kind: 'path',
      d: `M ${cx - 3 * s} ${headCy + 6 * s} Q ${cx} ${headCy + 8 * s}, ${cx + 3 * s} ${headCy + 6 * s}`,
      stroke: FACE,
      strokeWidth: 1 * s,
    },
  ]

  // Eyelids sit over the eyes, normally scaled to nothing and periodically
  // scaling up to cover them — a cheap, high-life-to-effort periodic blink.
  const lidR = 2.6 * s
  const blink: CPart = {
    kind: 'group',
    motion: 'blink',
    motionDelay: rng() * 4,
    children: [
      {
        kind: 'rect',
        x: cx - 4 * s - lidR,
        y: headCy - lidR,
        w: lidR * 2,
        h: lidR * 2,
        fill: skin,
      },
      {
        kind: 'rect',
        x: cx + 4 * s - lidR,
        y: headCy - lidR,
        w: lidR * 2,
        h: lidR * 2,
        fill: skin,
      },
    ],
  }

  const children: CPart[] = [
    ...legs,
    ...shoes,
    torso,
    leftArm,
    rightArm,
    { kind: 'circle', cx, cy: headCy, r: headR, fill: skin },
    ...hairShapes(style, cx, headCy, headR, hairColor),
    ...face,
    blink,
  ]

  // A per-instance delay so multiple people on screen (team, boardroom)
  // don't breathe in perfect lockstep — see the CPart.motionDelay comment.
  return withSkin(
    [{ kind: 'group', motion: 'breathe', motionDelay: rng() * 3.2, children }],
    skin
  )[0]
}

/** Three greeting strokes near the waving hand, each one drawn in (not just
 * faded in) and staggered — the DrawSVG-style reveal + per-element stagger
 * that the GSAP reference examples use to avoid everything moving in
 * lockstep, echoing the dashed motion-lines in the reference illustration. */
function greetingArcs(cx: number, cy: number, color: Paint): CPart {
  const arcs: CPart[] = [0, 1, 2].map((i) => ({
    kind: 'path',
    d: `M ${cx + 10 + i * 8} ${cy - 6 - i * 3} q ${6 + i * 2} ${-4} ${0} ${-10 - i * 2}`,
    stroke: color,
    strokeWidth: 2,
    motion: 'drawIn',
    motionDelay: i * 0.3,
  }))
  return { kind: 'group', motion: 'floaty', children: arcs }
}

function sceneWave(
  rng: Rng,
  skin: string,
  style: PersonStyle,
  colors: [ColorKey, ColorKey]
): CPart[] {
  const p = person({
    cx: 185,
    groundY: 195,
    scale: 1.5,
    skin,
    style,
    outfit: colors[0],
    accent: colors[1],
    pose: 'wave',
    rng,
  })
  return [p, greetingArcs(255, 42, colors[1])]
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
    mirror: true,
    rng,
  })
  const clasp: CPart = { kind: 'circle', cx: 218, cy: 128, r: 6, fill: skin, opacity: 0.9 }
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
    const drawIn = motionOn && part.motion === 'drawIn'
    return (
      <path
        key={key}
        d={part.d}
        fill={part.fill ? resolvePaint(part.fill, 'live') : 'none'}
        stroke={part.stroke ? resolvePaint(part.stroke, 'live') : undefined}
        strokeWidth={part.strokeWidth}
        strokeLinecap="round"
        opacity={part.opacity}
        pathLength={drawIn ? 1 : undefined}
        className={drawIn ? 'ig-char-draw' : undefined}
        style={drawIn && part.motionDelay ? { animationDelay: `${part.motionDelay}s` } : undefined}
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
  const styleWithDelay =
    style && part.motionDelay
      ? { ...style, animationDelay: `${part.motionDelay}s` }
      : part.motionDelay
        ? { animationDelay: `${part.motionDelay}s` }
        : style
  return (
    <g key={key} className={cls} style={styleWithDelay}>
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
@keyframes igCharDraw {
  0%, 10% { stroke-dashoffset: 1; opacity: 0.9; }
  55%, 75% { stroke-dashoffset: 0; opacity: 0.9; }
  100% { stroke-dashoffset: 0; opacity: 0; }
}
.ig-char-wave { animation: igCharWave 1.6s ease-in-out infinite; }
.ig-char-floaty { animation: igCharFloaty 2.4s ease-in-out infinite; }
.ig-char-breathe { animation: igCharBreathe 3.2s ease-in-out infinite; }
.ig-char-grow { animation: igCharGrow 1.1s cubic-bezier(0.34, 1.4, 0.64, 1) both; }
.ig-char-wave-smooth { animation: igCharWaveSmooth 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) infinite; }
.ig-char-blink { animation: igCharBlink 4s ease-in-out infinite; }
.ig-char-draw { stroke-dasharray: 1; stroke-dashoffset: 1; animation: igCharDraw 2.2s cubic-bezier(0.22, 1, 0.36, 1) infinite; }
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
    const drawIn = motionOn && part.motion === 'drawIn'
    const drawAttrs = drawIn
      ? ` pathLength="1" class="ig-char-draw"${part.motionDelay ? ` style="animation-delay: ${part.motionDelay}s;"` : ''}`
      : ''
    return `<path d="${part.d}"${fill}${stroke}${opacity}${drawAttrs} />`
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
  const delayDecl = motionOn && part.motionDelay ? ` animation-delay: ${part.motionDelay}s;` : ''
  const style =
    part.motion === 'wave' || part.motion === 'waveSmooth'
      ? ` style="transform-origin: ${part.originX}px ${part.originY}px;${delayDecl}"`
      : part.motion === 'growUp'
        ? ` style="transform-origin: ${part.originX}px ${part.originY}px; transform-box: view-box;${delayDecl}"`
        : part.motion === 'floaty' || part.motion === 'breathe' || part.motion === 'blink'
          ? ` style="transform-box: fill-box; transform-origin: ${part.motion === 'breathe' ? 'bottom' : 'center'};${delayDecl}"`
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
