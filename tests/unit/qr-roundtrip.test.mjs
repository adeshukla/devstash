import { test } from 'node:test'
import assert from 'node:assert/strict'
import jsQR from 'jsqr'
import { makeQr } from '../../lib/lab/qr.ts'
import {
  websitePayload,
  whatsappPayload,
  phonePayload,
  emailPayload,
  wifiPayload,
  contactPayload,
  upiPayload,
  textPayload,
} from '../../lib/lab/qrPayload.ts'
import { buildWhatsAppLink } from '../../lib/lab/whatsapp.ts'

/**
 * Round trip: build a code the way the Lab does, draw it as pixels, and read it back with an
 * independent decoder (jsQR). What comes out must equal what went in, for every kind and every
 * damage-tolerance level. This is the check a phone camera would make.
 */
async function scan(text, level = 'M', scale = 6) {
  const qr = await makeQr(text, level)
  const px = qr.size * scale
  const data = new Uint8ClampedArray(px * px * 4).fill(255)
  for (const m of qr.path.matchAll(/M(\d+) (\d+)h1v1h-1z/g)) {
    const x0 = Number(m[1]) * scale
    const y0 = Number(m[2]) * scale
    for (let y = y0; y < y0 + scale; y++)
      for (let x = x0; x < x0 + scale; x++) {
        const i = (y * px + x) * 4
        data[i] = data[i + 1] = data[i + 2] = 0
      }
  }
  const out = jsQR(data, px, px)
  return out ? out.data : null
}

const contact = {
  first: 'Adesh',
  last: 'Shukla',
  org: 'DevStash',
  title: 'Developer',
  phone: '+919876543210',
  email: 'a@example.com',
  url: 'https://devstash.me',
}

const CASES = {
  website: websitePayload('devstash.me/lab?utm_source=poster&utm_medium=qr&utm_campaign=diwali-26')
    .payload,
  whatsapp: whatsappPayload('+91 98765 43210', 'Hi, price list please & thanks').payload,
  'whatsapp with campaign code': buildWhatsAppLink({
    country: '91',
    number: '98765 43210',
    message: 'Hi',
    ref: 'diwali-poster',
  }).link,
  phone: phonePayload('+91 98765 43210').payload,
  email: emailPayload('a@example.com', 'Hello there', 'Body & more').payload,
  wifi: wifiPayload('My;Net:work', 'p;a:ss,"word', 'WPA', false).payload,
  upi: upiPayload('adesh@okhdfcbank', 'Adesh Shukla', '100.50', 'Lunch & drinks').payload,
  'upi with Hindi payee': upiPayload('adesh@okhdfcbank', 'आदेश शुक्ला', '10', '').payload,
  contact: contactPayload(contact).payload,
  text: textPayload('Plain text with a newline\nand a second line').payload,
  'text, 1000 characters': textPayload('x'.repeat(1000)).payload,
}

for (const [name, payload] of Object.entries(CASES)) {
  test(`QR round trip: ${name}`, async () => {
    assert.ok(payload, 'the payload exists')
    for (const level of ['L', 'M', 'Q', 'H']) {
      if (level === 'H' && payload.length > 700) continue // too long to fit at the toughest level
      assert.equal(await scan(payload, level), payload, `level ${level}`)
    }
  })
}

test('QR round trip: non-Latin text comes back as the same text, not garbled', async () => {
  for (const [name, text] of [
    ['Hindi text', 'दिवाली सेल: 50% छूट'],
    ['Hindi contact card', contactPayload({ ...contact, first: 'आदेश', last: 'शुक्ला' }).payload],
    ['accents and a symbol', 'Café ₹499 — naïve'],
  ]) {
    assert.equal(await scan(text, 'M'), text, name)
  }
})

/**
 * Styled codes: round dots drawn as circles, and a logo covering the middle fifth of the code.
 * The corner squares stay square. A decoder must still read it back at the toughest level.
 */
async function scanStyled(text, { dots = false, logo = false } = {}) {
  const qr = await makeQr(text, 'H')
  const scale = 8
  const px = qr.size * scale
  const data = new Uint8ClampedArray(px * px * 4).fill(255)
  const finder = (x, y) => {
    const b = qr.size - 4 - 7
    return (x < 11 && y < 11) || (x >= b && y < 11) || (x < 11 && y >= b)
  }
  for (const [cx, cy] of qr.cells) {
    for (let y = 0; y < scale; y++)
      for (let x = 0; x < scale; x++) {
        if (dots && !finder(cx, cy)) {
          const dx = x + 0.5 - scale / 2
          const dy = y + 0.5 - scale / 2
          if (dx * dx + dy * dy > (0.47 * scale) ** 2) continue
        }
        const i = ((cy * scale + y) * px + cx * scale + x) * 4
        data[i] = data[i + 1] = data[i + 2] = 0
      }
  }
  if (logo) {
    const side = (qr.size - 8) * 0.2 * scale * 1.24 // logo plus its padding
    const o = Math.round((px - side) / 2)
    for (let y = o; y < o + side; y++)
      for (let x = o; x < o + side; x++) {
        const i = (y * px + x) * 4
        data[i] = data[i + 1] = data[i + 2] = 128
      }
  }
  const out = jsQR(data, px, px)
  return out ? out.data : null
}

test('QR round trip: round dots and a centre logo still scan at the toughest level', async () => {
  const url = 'https://devstash.me/lab?utm_source=poster&utm_medium=qr&utm_campaign=diwali-26'
  assert.equal(await scanStyled(url, { dots: true }), url, 'round dots')
  assert.equal(await scanStyled(url, { logo: true }), url, 'logo')
  assert.equal(await scanStyled(url, { dots: true, logo: true }), url, 'dots and logo')
})
