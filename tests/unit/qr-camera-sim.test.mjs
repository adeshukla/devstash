import { test } from 'node:test'
import assert from 'node:assert/strict'
import sharp from 'sharp'
import jsQR from 'jsqr'
import {
  MultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
  BinaryBitmap,
  HybridBinarizer,
  RGBLuminanceSource,
} from '@zxing/library'
import { makeQr, qrSvg } from '../../lib/lab/qr.ts'

/**
 * Camera simulation. The shipped SVG (the exact string the Lab downloads) is rasterised, then
 * damaged the way a phone photo of a print is: small, blurred, tilted on a grey surface, heavily
 * compressed. Two unrelated decoders must read it: jsQR, and ZXing, which is what Android's scanner
 * family descends from. Passing here is strong evidence, not proof; a real phone is the last check.
 */
const URL_TEXT = 'https://devstash.me/lab?utm_source=poster&utm_medium=qr&utm_campaign=diwali-26'

async function makeLogo() {
  const png = await sharp({
    create: { width: 96, height: 96, channels: 4, background: '#3b82f6' },
  })
    .composite([
      {
        input: Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><circle cx="48" cy="48" r="26" fill="#fff"/></svg>'
        ),
      },
    ])
    .png()
    .toBuffer()
  return `data:image/png;base64,${png.toString('base64')}`
}

function readWithZxing({ data, width, height }) {
  const lum = new Uint8ClampedArray(width * height)
  for (let i = 0; i < lum.length; i++) {
    lum[i] = (data[i * 4] * 306 + data[i * 4 + 1] * 601 + data[i * 4 + 2] * 117) >> 10
  }
  const reader = new MultiFormatReader()
  reader.setHints(
    new Map([
      [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]],
      [DecodeHintType.TRY_HARDER, true],
    ])
  )
  const log = console.error
  console.error = () => {}
  try {
    return reader
      .decode(new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(lum, width, height))))
      .getText()
  } catch {
    return null
  } finally {
    console.error = log
  }
}

async function readBack(pipeline) {
  const { data, info } = await pipeline.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const px = new Uint8ClampedArray(data)
  const a = jsQR(px, info.width, info.height)?.data ?? null
  const b = readWithZxing({ data: px, width: info.width, height: info.height })
  return { jsqr: a, zxing: b }
}

// k nudges the size a little: a phone is never at one exact distance, and every decoder has a few
// unlucky pixel grids (a plain square code also misses ZXing at 500 px). Reading at any nudge counts.
const NUDGES = [1, 1.07, 0.93]
const DAMAGE = {
  'clean, large': (img, k) => img.resize(Math.round(600 * k)),
  'small on screen (140 px)': (img, k) => img.resize(Math.round(140 * k)),
  'out of focus': (img, k) => img.resize(Math.round(400 * k)).blur(2.2),
  'heavy JPEG (quality 25)': async (img, k) =>
    sharp(
      await img
        .resize(Math.round(320 * k))
        .jpeg({ quality: 25 })
        .toBuffer()
    ),
  'tilted 18 degrees on grey': async (img, k) =>
    sharp(
      await img
        .resize(Math.round(360 * k))
        .extend({ top: 60, bottom: 60, left: 60, right: 60, background: '#9a9a9a' })
        .rotate(18, { background: '#9a9a9a' })
        .toBuffer()
    ),
  'dim, low light': (img, k) => img.resize(Math.round(360 * k)).linear(0.55, 10),
}

const STYLES = [
  ['square', { shape: 'square' }],
  ['dots', { shape: 'dots' }],
  ['rounded', { shape: 'rounded' }],
  ['dots + logo', { shape: 'dots', logo: true }],
  ['rounded + logo', { shape: 'rounded', logo: true }],
]

for (const [name, opts] of STYLES) {
  test(`camera sim: ${name}`, async () => {
    const logo = opts.logo ? await makeLogo() : undefined
    const qr = await makeQr(URL_TEXT, logo ? 'H' : 'M')
    const svg = qrSvg(qr, {
      fg: '#0b0f19',
      bg: '#ffffff',
      label: '',
      shape: opts.shape,
      logo,
    })
    const fails = []
    for (const [dname, damage] of Object.entries(DAMAGE)) {
      const seen = { zxing: false, jsqr: false }
      for (const k of NUDGES) {
        const base = sharp(Buffer.from(svg), { density: 300 })
        const out = await readBack(await damage(base, k))
        seen.zxing ||= out.zxing === URL_TEXT
        seen.jsqr ||= out.jsqr === URL_TEXT
      }
      // Android-style scanners use ZXing-family decoding; both must read it.
      if (!seen.zxing) fails.push(`${dname}: ZXing`)
      if (!seen.jsqr) fails.push(`${dname}: jsQR`)
    }
    assert.deepEqual(fails, [], `unreadable under: ${fails.join(', ')}`)
  })
}
