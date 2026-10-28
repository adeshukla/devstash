// Generates the intro timeline CSS for the footer room: every joint of the
// character is solved per frame (30 fps) so feet stay planted, mugs stay level
// and hands land exactly on what they grab. Lights and screens share the clock.
// usage: node scripts/footer-room/gen.mjs scripts/footer-room/scene.dc.html scripts/footer-room/rig.html (then build.mjs)
import { readFileSync, writeFileSync } from 'node:fs'

const [file, rigFile] = process.argv.slice(2)
const TOTAL = 20.5
const FPS = 60
const NF = TOTAL * FPS
const F = Array.from({ length: NF + 1 }, (_, i) => i / FPS)

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const lerp = (a, b, u) => a + (b - a) * u
const E = {
  l: (u) => u,
  s: (u) => (1 - Math.cos(Math.PI * u)) / 2,
  io: (u) => (u < 0.5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2),
  o: (u) => 1 - (1 - u) ** 3,
  i: (u) => u ** 3,
  q: (u) => 1 - (1 - u) ** 2,
}
const mix = (a, b, u) => (Array.isArray(a) ? a.map((x, i) => lerp(x, b[i], u)) : lerp(a, b, u))
// keys([[t, value, ease], ...]): ease shapes the segment arriving at that key
function keys(list) {
  return (t) => {
    if (t <= list[0][0]) return list[0][1]
    for (let i = 1; i < list.length; i++) {
      const [t1, v1, e = 's'] = list[i]
      if (t <= t1) {
        const [t0, v0] = list[i - 1]
        return mix(v0, v1, E[e]((t - t0) / (t1 - t0)))
      }
    }
    return list[list.length - 1][1]
  }
}
const span = (t, t0, t1, e = 's') => E[e](clamp((t - t0) / (t1 - t0), 0, 1))

// rotate(a) maps the limb vector (0, L) onto (-L sin a, L cos a)
const rad = (a) => (a * Math.PI) / 180
const angOf = (x, y) => (Math.atan2(-x, y) * 180) / Math.PI
const rot = (x, y, a) => [
  x * Math.cos(rad(a)) - y * Math.sin(rad(a)),
  x * Math.sin(rad(a)) + y * Math.cos(rad(a)),
]
const wrap = (a) => ((((a + 180) % 360) + 360) % 360) - 180
// two-bone IK: returns [upper angle, lower angle relative to upper]; pref picks the bend side
function ik(S, H, L1, L2, pref) {
  const dx = H[0] - S[0],
    dy = H[1] - S[1],
    D = Math.hypot(dx, dy) || 1e-6
  const Dc = clamp(D, Math.abs(L1 - L2) + 0.01, L1 + L2 - 0.01),
    ux = dx / D,
    uy = dy / D
  const a = (L1 * L1 - L2 * L2 + Dc * Dc) / (2 * Dc),
    h = Math.sqrt(Math.max(0, L1 * L1 - a * a))
  let px = -uy,
    py = ux
  if (px * pref[0] + py * pref[1] < 0) {
    px = -px
    py = -py
  }
  const Ex = S[0] + a * ux + h * px,
    Ey = S[1] + a * uy + h * py
  const a1 = angOf(Ex - S[0], Ey - S[1])
  return [a1, wrap(angOf(S[0] + ux * Dc - Ex, S[1] + uy * Dc - Ey) - a1)]
}
const fk = (S, a1, a2, L1, L2) => {
  const e = rot(0, L1, a1),
    h = rot(0, L2, a1 + a2)
  return [S[0] + e[0] + h[0], S[1] + e[1] + h[1]]
}

// ---------------------------------------------------------------- the walk
// 175 cm man at 1.9 px/cm: 118 px steps (62 cm) at 130 steps/min, about 1.35 m/s
const T = 0.46 // s per step
const S = 118
const V = S / T
const C = 0.5 * S // foot ahead of the hip at contact
const LMAX = 80 + 72 - 0.4
const HEEL = [-9, 8],
  TOE = [28, 8],
  TOE_OFF = 26,
  HEEL_STRIKE = -12,
  LIFT = 9 // swing-foot clearance (5 read as shuffling)
const XN = 1128 // last planted foot: he stops left of the coaster so the mug lands in view
const STOP_X = 1130
const hipLin = (t) => 200 + V * (t - 1.9) // passes the light switch as light 1 comes on
const cN = 1.9 + (XN - C - 200) / V
const tStop = cN + 1.6 * T
function hipX(t) {
  if (t <= cN) return hipLin(t)
  if (t >= tStop) return STOP_X
  const D = tStop - cN,
    u = (t - cN) / D
  return (
    (2 * u ** 3 - 3 * u ** 2 + 1) * (XN - C) +
    (u ** 3 - 2 * u ** 2 + u) * V * D +
    (-2 * u ** 3 + 3 * u ** 2) * STOP_X
  )
}
const plants = { A: [], B: [] }
for (let j = 40; j >= 0; j--) {
  const c = cN - j * T
  plants[j % 2 === 0 ? 'B' : 'A'].push({
    X: XN - j * S,
    c,
    o: j === 0 ? Infinity : c + 1.16 * T,
    hs: HEEL_STRIKE,
  })
}
plants.A.push({ X: STOP_X + 2, c: cN + T, o: Infinity, hs: -5 }) // short closing step, feet together

function stance(p, t) {
  let ang = 0,
    piv = [p.X + HEEL[0], 0],
    loc = HEEL
  const tHS = p.c + 0.14 * T
  if (t < tHS) ang = p.hs * (1 - span(t, p.c, tHS, 'q'))
  else if (p.o !== Infinity && t > p.o - 0.4 * T) {
    ang = TOE_OFF * span(t, p.o - 0.4 * T, p.o, 'l') ** 2
    piv = [p.X + TOE[0], 0]
    loc = TOE
  }
  const r = rot(loc[0], loc[1], ang)
  return { x: piv[0] - r[0], y: piv[1] - r[1], ang }
}
// Hermite segment: position and velocity both continuous where the swing meets the stance
const herm = (p0, p1, v0, v1, D, u) =>
  (2 * u ** 3 - 3 * u ** 2 + 1) * p0 +
  (u ** 3 - 2 * u ** 2 + u) * D * v0 +
  (-2 * u ** 3 + 3 * u ** 2) * p1 +
  (u ** 3 - u ** 2) * D * v1
const H = 0.008
const vOut = (p, t) => {
  const a = stance(p, t - H),
    b = stance(p, t)
  return [(b.x - a.x) / H, (b.y - a.y) / H, (b.ang - a.ang) / H]
}
const vIn = (p, t) => {
  const a = stance(p, t),
    b = stance(p, t + H)
  return [(b.x - a.x) / H, (b.y - a.y) / H, (b.ang - a.ang) / H]
}
function foot(leg, t) {
  const ps = plants[leg]
  for (let i = 0; i < ps.length; i++) {
    const p = ps[i],
      n = ps[i + 1]
    if (t >= p.c && t <= p.o) return stance(p, t)
    if (n && t > p.o && t < n.c) {
      const a = stance(p, p.o),
        b = stance(n, n.c),
        va = vOut(p, p.o),
        vb = vIn(n, n.c)
      const D = n.c - p.o,
        u = (t - p.o) / D
      return {
        x: herm(a.x, b.x, va[0], vb[0], D, u),
        y: herm(a.y, b.y, va[1], vb[1], D, u) - LIFT * Math.sin(Math.PI * u) ** 2,
        ang: herm(a.ang, b.ang, va[2], vb[2], D, u),
        swing: true,
      }
    }
  }
  return stance(ps[0], ps[0].c)
}
const speed = (t) => clamp((hipX(t + 0.01) - hipX(t - 0.01)) / 0.02 / V, 0, 1)
// hip height: a little under full leg reach so the knee never snaps straight (that snap was the jerk)
const reach = F.map((t) => {
  const sp = speed(t)
  let lim = 159.6 - 0.6 * sp
  for (const leg of ['A', 'B']) {
    const f = foot(leg, t)
    if (!f.swing)
      lim = Math.min(
        lim,
        Math.sqrt(Math.max(0, LMAX * LMAX - (f.x - hipX(t)) ** 2)) - f.y - (0.3 + 0.3 * sp)
      )
  }
  return lim
})
const win = (arr, i, r) => arr.slice(Math.max(0, i - r), i + r + 1)
const lo = reach.map((_, i) => Math.min(...win(reach, i, 1)))
const GW = [1, 2, 1]
const hipH = lo.map((_, i) => {
  let s = 0,
    w = 0
  for (let k = -1; k <= 1; k++) {
    const v = lo[clamp(i + k, 0, lo.length - 1)]
    s += v * GW[k + 1]
    w += GW[k + 1]
  }
  return s / w // the min window equals the blur window, so this never exceeds the reach
})

const W = F.map((t, i) => {
  const hx = hipX(t),
    ty = 160 - hipH[i],
    legs = {}
  for (const leg of ['A', 'B']) {
    const f = foot(leg, t)
    const [th, sh] = ik([0, -160], [f.x - hx, f.y - ty], 80, 72, [1, 0])
    legs[leg] = { th, sh, ft: f.ang - th - sh, fx: f.x }
  }
  return { hx, ty, sp: speed(t), legs }
})

// profile upper body: slight forward lean while walking, near (right) arm carries the mug
// tall, upright posture: barely any lean, a light nod to the music
const lean = (i) => 2.6 * W[i].sp
const carry = (t) => [
  -6 + 2.6 * Math.sin((Math.PI * t) / T),
  -86 + 1.6 * Math.sin((2 * Math.PI * t) / T),
]
const farU = (i) => clamp(0.34 * (W[i].legs.B.fx - W[i].hx), -24, 24)
const nod = (t) => 1.3 * Math.sin((Math.PI * t) / 0.5) ** 2

// ------------------------------------------------- back view: turn, mug, headphones, chair, sit
const SWAP = 6.39
const turnS = keys([
    [6.25, 1],
    [SWAP, 0.5, 'i'],
  ]),
  turnO = (t) => (t < SWAP ? 1 : 0)
const bS = keys([
    [SWAP, 0.5],
    [6.56, 1, 'o'],
  ]),
  bO = (t) => (t < SWAP ? 0 : 1)

const bdx = keys([
  [9.0, -120],
  [9.3, -124],
  [9.5, -120],
  [9.75, -120],
  [10.25, -22],
  [11.4, -22],
  [11.9, 0],
])
const bdy = keys([
  [10.45, 0],
  [10.95, 4, 'io'],
  [11.4, 4],
  [11.9, 0],
])
const cdx = keys([
  [9.0, 0],
  [9.42, -23, 'io'],
  [9.55, -22],
  [11.4, -22],
  [11.9, 0],
])
const cdy = keys([
  [9.0, 0],
  [9.42, 4, 'io'],
  [11.4, 4],
  [11.9, 0],
])
// Standing lift. The back-view legs are 24 px shorter than the profile legs, so the
// upper body stands 28 px higher than it was (-52 -> -80): he no longer shrinks when
// he turns around. It overlaps the leg tops by ~6 px, so no gap opens. Seated keys unchanged.
const uy = keys([
  [6.6, -80],
  [6.95, -80],
  [7.15, -77.5],
  [7.36, -77.5],
  [7.6, -80], // knees give a little as he sets the mug down
  [9.0, -80],
  [9.25, -81.5],
  [9.45, -80], // effort of pulling the chair
  [9.75, -80],
  [9.87, -82.5],
  [10.0, -80],
  [10.12, -82.5],
  [10.25, -80], // two side steps
  [10.45, -80],
  [10.95, 0, 'io'],
  [11.03, 3, 'o'],
  [11.12, -0.6],
  [11.22, 0], // lowers, cushion takes the weight
  [11.9, 0],
  [12.4, 3],
  [18.95, 3],
  [19.25, -1],
  [19.6, 3], // leans back; stretch after the sip
])
const thigh = keys([
  [10.5, 1],
  [10.98, 0.12, 'io'],
])
const legL = keys([
  [9.75, [0, 0]],
  [9.99, [-10, 0]],
  [10.09, [-2, -8], 'o'],
  [10.21, [4, 0], 'i'],
  [10.27, [0, 0]],
  [11.4, [0, 0]],
  [11.55, [-5, 0]],
  [11.9, [0, 0]],
])
const legR = keys([
  [9.75, [0, 0]],
  [9.85, [-6, -8], 'o'],
  [10.01, [6, 0], 'i'],
  [10.25, [0, 0]],
  [11.45, [0, 0]],
  [11.6, [-5, 0]],
  [11.9, [0, 0]],
])
const cSeat = keys([
  [10.95, 0],
  [11.03, 2.5, 'o'],
  [11.12, -0.6],
  [11.22, 0],
])
const cBack = keys([
  [11.9, 0],
  [12.4, 4],
])
const slide = keys([
  [8.1, 0],
  [8.4, 26],
]) // headphones from ears to neck

// leaning forward over the hips while lowering: from behind, the torso foreshortens about the hip
const bLean = keys([
  [10.45, 1],
  [10.75, 0.93],
  [10.95, 1],
])
const HIP = -104
const SL = [-38, -200],
  SR = [40, -196] // shoulders in upper-body coords
const toUp = (X, Y, t) => [X - (1250 + bdx(t)), HIP + (Y - (486 + bdy(t)) - uy(t) - HIP) / bLean(t)]
const chairPt = (px, py, t) => toUp(1250 + cdx(t) + px, 486 + cdy(t) + py, t)

// 3D arms for the back view. Space: x right, y down, z away from the camera (into the room).
// The scene is a slight oblique projection, screen y = y3 - K*z (that is why the desk top shows as a band),
// so a hand reaching forward to the desk foreshortens its arm instead of swinging it sideways.
const K = 0.12,
  AU = 58,
  AF = 54 // upper arm and forearm, shoulder to wrist about 112 px (59 cm)
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k]
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const len3 = (a) => Math.sqrt(dot3(a, a))
// two-bone IK in 3D; the pole says where the elbow points; returns screen angles and foreshortening
function ik3(S, T, pole) {
  const d = sub3(T, S),
    D = len3(d) || 1e-6,
    Dc = clamp(D, Math.abs(AU - AF) + 0.5, AU + AF - 0.5)
  const u = mul3(d, 1 / D)
  const a = (AU * AU - AF * AF + Dc * Dc) / (2 * Dc),
    h = Math.sqrt(Math.max(0, AU * AU - a * a))
  let p = sub3(pole, mul3(u, dot3(pole, u)))
  const pl = len3(p)
  p = pl < 1e-6 ? [0, 0, -1] : mul3(p, 1 / pl)
  const Eb = add3(add3(S, mul3(u, a)), mul3(p, h)),
    Hd = add3(S, mul3(u, Dc))
  const pr = (V) => [V[0], V[1] - K * V[2]]
  const s = pr(S),
    e = pr(Eb),
    w = pr(Hd)
  const v1 = [e[0] - s[0], e[1] - s[1]],
    v2 = [w[0] - e[0], w[1] - e[1]]
  return {
    a1: angOf(...v1),
    s1: Math.max(0.16, Math.hypot(...v1) / AU),
    a2: angOf(...v2),
    s2: Math.max(0.16, Math.hypot(...v2) / AF),
  }
}
// targets: t => [x, y (screen, upper-body coords), z relative to his body plane]
const Zb = (t) => -25 - bdy(t) / K // his body plane: lower on screen = closer to the camera
const Zc = (t) => -45 - cdy(t) / K // chair centre
const W3 = (X, Y, Z) => (t) => [...toUp(X, Y, t), Z - Zb(t)] // a point in the room, Z from the desk front
const C3 = (px, py, dz) => (t) => [...chairPt(px, py, t), Zc(t) + dz - Zb(t)] // a point on the chair
const B3 = (x, y, z) => () => [x, y, z] // a point that moves with his body
// [time, target, pole, ease]: target and pole blend in 3D, then the arm is solved for every frame
function armTrack(S2, list) {
  const S = [S2[0], S2[1], 0] // the shoulder sits on his body plane
  return (t) => {
    let i = 1
    while (i < list.length - 1 && t > list[i][0]) i++
    const [t0, f0, p0] = list[i - 1],
      [t1, f1, p1, e = 's'] = list[i]
    const u = t <= t0 ? 0 : t >= t1 ? 1 : E[e]((t - t0) / (t1 - t0))
    const Tg = mix(f0(t), f1(t), u)
    return ik3(S, [Tg[0], Tg[1] + K * Tg[2], Tg[2]], mix(p0, p1, u))
  }
}
const PR = {
  hang: [0.25, 0, -1],
  carry: [0.7, 0.5, -1],
  place: [0.9, 0.5, -0.5],
  ear: [0.6, 1, -0.7],
  pull: [1, 0.4, 0.2],
  rest: [0.35, 0.2, -1],
  key: [0.25, 1, -0.7],
}
const PL = Object.fromEntries(Object.entries(PR).map(([k, p]) => [k, [-p[0], p[1], p[2]]]))
const cupR = (t) => [24, -238 + slide(t), 2],
  cupL = (t) => [-24, -238 + slide(t), 2]
const MUG = [1184, 316, 58] // desk mug handle on screen, 58 px back from the desk front
const mugAt = W3(...MUG)
const hangR = B3(44, -86, -6),
  hangL = B3(-42, -90, -6)
const kbR = W3(1322, 326, 42),
  kbL = W3(1268, 327, 40)
// right hand: carries the mug in, sets it on the coaster, headphones, pulls the chair, armrest, keyboard
const rightArm = armTrack(SR, [
  [6.3, B3(24, -161, 44), PR.carry],
  [6.6, B3(24, -161, 44), PR.carry],
  [6.95, W3(1186, 300, 58), PR.place], // lifted over the desk edge
  [7.22, mugAt, PR.place, 'o'], // set down softly
  [7.36, mugAt, PR.place],
  [7.5, W3(1188, 304, 50), PR.place, 'o'], // lets go, hand lifts off
  [7.8, hangR, PR.hang],
  [8.1, cupR, PR.ear],
  [8.4, cupR, PR.ear, 'l'], // slides the headphones down to his neck
  [8.7, hangR, PR.hang],
  [8.75, hangR, PR.hang],
  [9.0, C3(-47, -186, -18), PR.pull],
  [9.5, C3(-47, -186, -18), PR.pull, 'l'], // follows the chair as he pulls it out
  [9.75, hangR, PR.hang],
  [10.25, hangR, PR.hang],
  [10.45, C3(44, -151, 12), PR.rest], // hands on the armrests, elbows back
  [12.2, C3(44, -151, 12), PR.rest, 'l'],
  [12.6, kbR, PR.key],
])
const lips = B3(-16, -226, 34) // in front of the face: from behind, the head hides most of the mug
const leftArm = armTrack(SL, [
  [7.8, hangL, PL.hang],
  [8.1, cupL, PL.ear],
  [8.4, cupL, PL.ear, 'l'],
  [8.7, hangL, PL.hang],
  [10.25, hangL, PL.hang],
  [10.45, C3(-44, -151, 12), PL.rest],
  [12.2, C3(-44, -151, 12), PL.rest, 'l'],
  [12.6, kbL, PL.key],
  [16.0, kbL, PL.key],
  [16.45, mugAt, [-0.5, 0.5, -0.8]], // reaches forward for the mug
  [16.62, W3(1184, 296, 58), [-0.45, 0.8, -0.2], 'o'], // lifts it off the desk
  [16.9, B3(-30, -196, 30), [-0.35, 1, 0.4]], // brings it in past the chest
  [17.12, lips, [-0.3, 1, 0.55], 'o'], // slows into the mouth, elbow low and forward
  [17.95, lips, [-0.3, 1, 0.55]],
  [18.15, B3(-30, -196, 30), [-0.35, 1, 0.4]],
  [18.32, W3(1184, 296, 58), [-0.45, 0.8, -0.2]],
  [18.45, mugAt, [-0.5, 0.5, -0.8], 'o'], // sets it down
  [18.9, kbL, PL.key],
])
const tap = keys([
  [12.65, 0],
  [12.75, 10, 'o'],
  [12.92, 0],
])
// keep screen angles continuous across the +/-180 seam so CSS never spins the long way
function unwrapArm(arr) {
  for (let k = 1; k < arr.length; k++)
    for (const key of ['a1', 'a2']) {
      while (arr[k][key] - arr[k - 1][key] > 180) arr[k][key] -= 360
      while (arr[k][key] - arr[k - 1][key] < -180) arr[k][key] += 360
    }
  return arr
}
const tilt = keys([
  [17.12, 0],
  [17.42, 18, 'o'],
  [17.85, 30],
  [18.12, 0, 'io'], // levels off while lowering, not while still at his lips
])
const headTilt = keys([
  [17.1, 0],
  [17.42, 7, 'o'],
  [17.9, 8],
  [18.2, 0],
])
const faceL = keys([
  [16.55, 0],
  [16.72, 1, 'l'],
  [19.2, 1],
  [19.37, 0, 'l'],
])
const deskMug = (t) => t >= 7.36 && !(t >= 16.45 && t < 18.45)

// -------------------------------------------------------------- lighting
const ramp = (t0, d = 0.45) =>
  keys([
    [t0, 0],
    [t0 + 0.08, 0.55, 'o'],
    [t0 + d, 1],
  ])
const L = {
  ov: keys([
    [2.0, 0.66],
    [2.45, 0.48, 'o'],
    [3.2, 0.48],
    [3.65, 0.32, 'o'],
    [4.3, 0.32],
    [4.75, 0.18, 'o'],
    [11.2, 0.18],
    [11.8, 0.12],
    [13.5, 0.12],
    [14.0, 0.1],
  ]),
  cg: keys([
    [2.0, 1],
    [4.75, 0.4],
  ]),
  p1: ramp(2.0),
  p2: ramp(3.2),
  p3: ramp(4.3),
  neon: keys([
    [4.8, 0],
    [4.84, 1, 'l'],
    [4.9, 0.1, 'l'],
    [5.0, 0.9, 'l'],
    [5.06, 0.2, 'l'],
    [5.2, 1, 'l'],
  ]),
  lamp: keys([
    [11.2, 0],
    [11.3, 0.6, 'o'],
    [11.8, 1],
  ]),
  scrB: keys([
    [12.8, 0],
    [12.9, 0.7, 'o'],
    [13.0, 0.45],
    [13.35, 1],
  ]),
  kbl: keys([
    [12.8, 0],
    [13.15, 1],
  ]),
  scrA: keys([
    [13.5, 0],
    [13.6, 0.6, 'o'],
    [13.7, 0.35],
    [14.2, 1],
  ]),
}

// ---------------------------------------------------------------- emit
// time warp: the sit (10.5-11.0 s on the authoring clock) plays over 0.8 s, everything after shifts 0.3 s
const warp = (t) => (t <= 10.5 ? t : t <= 11.3 ? 10.5 + (t - 10.5) * 0.625 : t - 0.3)
const Fw = F.map(warp)
const n1 = (v) => +v.toFixed(1),
  n2 = (v) => +v.toFixed(2),
  n3 = (v) => +v.toFixed(3)
const R = (a) => `transform:rotate(${n1(a)}deg)`
const O = (o) => `opacity:${n3(o)}`
const tr = []
const track = (cls, fn) => tr.push([cls, fn])

track('g-wRoot', (i) => `transform:translate(${n2(W[i].hx)}px,${n2(W[i].ty)}px)`)
track('g-wFade', (i) => `transform:scaleX(${n3(turnS(Fw[i]))});${O(turnO(Fw[i]))}`)
track('g-wShadow', (i) => `transform:translateX(${n2(W[i].hx)}px);${O(turnO(Fw[i]))}`)
track('g-wLean', (i) => R(lean(i)))
for (const leg of ['A', 'B']) {
  track(`g-wT${leg}`, (i) => R(W[i].legs[leg].th))
  track(`g-wS${leg}`, (i) => R(W[i].legs[leg].sh))
  track(`g-wK${leg}`, (i) => R(W[i].legs[leg].ft))
}
track('g-wFU', (i) => R(farU(i)))
track('g-wFF', (i) => R(-8 + 0.7 * Math.min(0, farU(i))))
track('g-wNU', (i) => R(carry(Fw[i])[0]))
track('g-wNF', (i) => R(carry(Fw[i])[1]))
track('g-wMug', (i) => {
  const a = carry(Fw[i])
  return R(-(lean(i) + a[0] + a[1]))
})
track('g-wHead', (i) => R(nod(Fw[i]) - 0.5 * lean(i)))
track('fr-dMug', (i) => O(deskMug(Fw[i]) ? 1 : 0))

track('g-bRoot', (i) => {
  const t = Fw[i]
  return `transform:translate(${n2(bdx(t))}px,${n2(bdy(t))}px) scaleX(${n3(bS(t))});${O(bO(t))}`
})
track('g-bLegL', (i) => {
  const v = legL(Fw[i])
  return `transform:translate(${n2(v[0])}px,${n2(v[1])}px)`
})
track('g-bLegR', (i) => {
  const v = legR(Fw[i])
  return `transform:translate(${n2(v[0])}px,${n2(v[1])}px)`
})
track('g-bThL', (i) => `transform:scaleY(${n3(thigh(Fw[i]))})`)
track('g-bThR', (i) => `transform:scaleY(${n3(thigh(Fw[i]))})`)
track('g-bUp', (i) => `transform:translateY(${n2(uy(Fw[i]))}px)`)
track('g-bLean', (i) => `transform:scaleY(${n3(bLean(Fw[i]))})`)
const RA = unwrapArm(Fw.map(rightArm)),
  LA = unwrapArm(Fw.map(leftArm))
const SY = (s) => `transform:scaleY(${n3(s)})`,
  TY = (y) => `transform:translateY(${n2(y)}px)`
track('g-rU', (i) => R(RA[i].a1))
track('g-rUs', (i) => SY(RA[i].s1))
track('g-rEj', (i) => TY(AU * RA[i].s1))
track('g-rF', (i) => R(RA[i].a2 - RA[i].a1 + tap(Fw[i])))
track('g-rFs', (i) => SY(RA[i].s2))
track('g-rHj', (i) => TY(AF * RA[i].s2))
track('g-rMug', (i) => `${R(-(RA[i].a2 + tap(Fw[i])))};${O(Fw[i] < 7.36 ? 1 : 0)}`)
track('g-lU', (i) => R(LA[i].a1))
track('g-lUs', (i) => SY(LA[i].s1))
track('g-lEj', (i) => TY(AU * LA[i].s1))
track('g-lF', (i) => R(LA[i].a2 - LA[i].a1))
track('g-lFs', (i) => SY(LA[i].s2))
track('g-lHj', (i) => TY(AF * LA[i].s2))
track('g-hMug', (i) => {
  const t = Fw[i]
  return `${R(-LA[i].a2 + tilt(t))};${O(t >= 16.45 && t < 18.45 ? 1 : 0)}`
})
track('g-bHpOn', (i) => `transform:translateY(${n2(slide(Fw[i]))}px);${O(Fw[i] < 8.4 ? 1 : 0)}`)
track('g-bHpN', (i) => O(Fw[i] < 8.4 ? 0 : 1))
track('g-bHead', (i) => R(headTilt(Fw[i])))
track('g-headL', (i) => O(faceL(Fw[i])))
track('g-headR', (i) => O(1 - faceL(Fw[i])))
track('g-cPos', (i) => `transform:translate(${n2(cdx(Fw[i]))}px,${n2(cdy(Fw[i]))}px)`)
track('g-cSeat', (i) => `transform:translateY(${n2(cSeat(Fw[i]))}px)`)
track('g-cBack', (i) => `transform:translateY(${n2(cBack(Fw[i]))}px)`)
track('g-rim', (i) => O(L.scrA(Fw[i]) * 0.35))

track('fr-dim', (i) => `filter:brightness(${n3(1 - 0.92 * L.ov(Fw[i]))})`) // the room darkness, applied evenly to him
track('fr-sw', (i) => `transform:translateY(${n2(7 * span(Fw[i], 1.95, 2.02, 'o'))}px)`)
for (const k of Object.keys(L)) track(`fr-${k}`, (i) => O(L[k](Fw[i])))

let css = `/* intro timeline: generated by gen.mjs, ${TOTAL} s at ${FPS} fps */\n`
for (const [cls, fn] of tr) {
  const d = F.map((_, i) => fn(i))
  const nums = d.map((v) => (v.match(/-?[\d.]+(?=deg|px|\)|;|$)/g) || []).map(Number))
  // keep a frame only when linear interpolation between kept frames would drift past the tolerance
  const fits = (a, b) => {
    for (let j = a + 1; j < b; j++) {
      if (nums[j].length !== nums[a].length) return false
      for (let k = 0; k < nums[j].length; k++) {
        const tol = Math.abs(nums[a][k]) <= 1 && Math.abs(nums[b][k]) <= 1 ? 0.008 : 0.1
        if (Math.abs(lerp(nums[a][k], nums[b][k], (j - a) / (b - a)) - nums[j][k]) > tol)
          return false
      }
    }
    return true
  }
  const keep = [0]
  for (let i = 2; i <= NF; i++) if (!fits(keep[keep.length - 1], i)) keep.push(i - 1)
  keep.push(NF)
  const kf = keep.map((i) => `${+((i / NF) * 100).toFixed(3)}%{${d[i]}}`)
  css += `.${cls}{animation:${cls} ${TOTAL}s linear both}\n@keyframes ${cls}{${kf.join('')}}\n`
}
css += `
/* chips rise 14.3-16.1 s, then bob */
.fr-cr{animation:fr-cr .9s cubic-bezier(.2,.8,.2,1) both}
.fr-cr.c1{animation-delay:14.6s}.fr-cr.c2{animation-delay:14.95s}.fr-cr.c3{animation-delay:15.3s}.fr-cr.c4{animation-delay:15.65s}.fr-cr.c5{animation-delay:16s}
@keyframes fr-cr{from{opacity:0;transform:translateY(70px)}to{opacity:1;transform:translateY(0)}}
.fr-cb{animation:fr-cb 4s ease-in-out infinite}
.fr-cb.c1{animation-delay:15.9s}.fr-cb.c2{animation-delay:16.3s}.fr-cb.c3{animation-delay:16.7s}.fr-cb.c4{animation-delay:17.1s}.fr-cb.c5{animation-delay:17.5s}
@keyframes fr-cb{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
.fr-typ{animation:fr-typ 1.4s ease-in-out 20s infinite}
@keyframes fr-typ{0%,100%{transform:rotate(0deg)}30%{transform:rotate(-5deg)}60%{transform:rotate(2deg)}}

`

let html = readFileSync(file, 'utf8')
const cut = (s, a, b, mid) => {
  const i = s.indexOf(a),
    j = s.indexOf(b)
  if (i < 0 || j < 0 || j < i) throw new Error(`markers not found: ${a} / ${b}`)
  return s.slice(0, i) + mid + s.slice(j)
}
html = cut(html, '/* intro timeline', '/* ambient loops', css)
// the characters are drawn last, above the room lighting, and dimmed evenly by .fr-dim
html = cut(html, '<!-- chair + seated developer', '</svg>\n</sc-if>', readFileSync(rigFile, 'utf8'))
writeFileSync(file, html)
console.log(
  `tracks ${tr.length}, css ${(css.length / 1024).toFixed(1)} KB, stop ${tStop.toFixed(2)} s`
)
