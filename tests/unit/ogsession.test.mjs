import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULTS } from '../../lib/lab/ogImage.ts'
import { ogFromSession, ogToSession } from '../../lib/lab/ogSession.ts'
import { hexOr, numIn } from '../../lib/lab/sessions.ts'

test('an OG design is saved without its pictures, and comes back the same', () => {
  const withPics = {
    ...DEFAULTS,
    photo: 'data:image/png;base64,AAAA',
    photoW: 800,
    photoH: 600,
    logo: 'data:image/png;base64,BBBB',
    accent: '#112233',
    title: { ...DEFAULTS.title, text: 'Spring sale' },
  }
  const saved = ogToSession(withPics)
  for (const k of ['photo', 'photoW', 'photoH', 'logo']) assert.ok(!(k in saved), k)
  const back = ogFromSession(JSON.parse(JSON.stringify(saved)))
  assert.equal(back.accent, '#112233')
  assert.equal(back.title.text, 'Spring sale')
  assert.equal(back.photo, DEFAULTS.photo)
  assert.equal(back.logo, DEFAULTS.logo)
})

test('a tampered or damaged design file falls back to safe defaults', () => {
  const back = ogFromSession({
    layout: '"><script>alert(1)</script>',
    accent: 'red;background:url(x)',
    width: 'wide',
    height: Infinity,
    frame: 'yes',
    bgType: 'photo',
    title: { text: 'x'.repeat(5000), color: '<b>', font: 'serif" onload="x', size: 'big' },
    unknownKey: 'ignored',
  })
  assert.equal(back.layout, DEFAULTS.layout)
  assert.equal(back.accent, DEFAULTS.accent)
  assert.equal(back.width, DEFAULTS.width)
  assert.equal(back.height, DEFAULTS.height)
  assert.equal(back.frame, DEFAULTS.frame)
  // A photo background cannot be restored without the photo.
  assert.equal(back.bgType, DEFAULTS.bgType)
  assert.equal(back.title.text, DEFAULTS.title.text)
  assert.equal(back.title.color, DEFAULTS.title.color)
  assert.equal(back.title.font, DEFAULTS.title.font)
  assert.equal(back.title.size, DEFAULTS.title.size)
  assert.ok(!('unknownKey' in back))
})

test('numbers and colours read from saved data stay inside their limits', () => {
  assert.equal(numIn(5, 1, 8, 3), 5)
  assert.equal(numIn(99, 1, 8, 3), 3)
  assert.equal(numIn('5', 1, 8, 3), 3)
  assert.equal(numIn(NaN, 1, 8, 3), 3)
  assert.equal(hexOr('#A1b2C3', '#000000'), '#A1b2C3')
  assert.equal(hexOr('red', '#000000'), '#000000')
  assert.equal(hexOr('#12345', '#000000'), '#000000')
  assert.equal(hexOr(undefined, '#000000'), '#000000')
})
