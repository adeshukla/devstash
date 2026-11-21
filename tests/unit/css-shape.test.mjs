import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseShapeCss } from '../../lib/lab/cssShape.ts'

const presets = { triangle: 'clip-path: polygon(50% 0%, 100% 100%, 0% 100%);' }

test('pasted CSS: a preset, a polygon, corner radii; anything else is refused', () => {
  assert.deepEqual(parseShapeCss('clip-path:  polygon(50% 0%, 100% 100%, 0% 100%)', presets), {
    mode: 'preset',
    key: 'triangle',
  })
  const poly = parseShapeCss(
    '.a { clip-path: polygon(0% 0%, 90.5% 10%, 50% 120%, 5% 80%); }',
    presets
  )
  assert.equal(poly?.mode, 'polygon')
  assert.deepEqual(poly?.points[2], { x: 50, y: 100 }) // clamped into the box
  assert.deepEqual(parseShapeCss('border-radius: 30%;', presets), {
    mode: 'corners',
    corners: { tl: 30, tr: 30, br: 30, bl: 30 },
  })
  assert.deepEqual(parseShapeCss('border-radius: 10% 20%', presets)?.corners, {
    tl: 10,
    tr: 20,
    br: 10,
    bl: 20,
  })
  assert.equal(parseShapeCss('border-radius: 12px;', presets), null)
  assert.equal(parseShapeCss('border-radius: 40% 60% / 30% 70%;', presets), null)
  assert.equal(parseShapeCss('clip-path: polygon(0 0, 10px 10px, 5% 5%)', presets), null)
  assert.equal(parseShapeCss('nonsense', presets), null)
})
