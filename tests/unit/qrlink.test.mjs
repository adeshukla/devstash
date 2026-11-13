import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkUsername, checkDestination } from '../../lib/qrlink/rules.ts'

test('usernames: clean, lowercase, strict', () => {
  assert.deepEqual(checkUsername(' Adesh-QR '), { name: 'adesh-qr' })
  for (const bad of ['ab', 'a'.repeat(21), '-abc', 'abc-', 'a--b', 'a_b', 'हिंदी', 'admin', 'LAB'])
    assert.ok('error' in checkUsername(bad), bad)
})

test('destinations: public web pages only, never another changeable link', () => {
  assert.equal(checkDestination('example.com/menu').url, 'https://example.com/menu')
  for (const bad of [
    'http://127.0.0.1/',
    'file:///etc/passwd',
    'javascript:alert(1)',
    'https://devstash.me/q/abc',
    '',
  ])
    assert.ok('error' in checkDestination(bad), bad)
})

import { checkPassword, hashPassword, verifyPassword } from '../../lib/qrlink/password.ts'

test('passwords: length, common list, site name, email name and repeats are refused', () => {
  const bad = [
    'short',
    'password123',
    'Password1234',
    'qwertyuiop',
    'devstash-rocks-99',
    'aaaaaaaaaaaa',
    '1234567890',
    'x'.repeat(129),
  ]
  for (const pw of bad) assert.ok(checkPassword(pw), pw)
  assert.ok(checkPassword('adesh-shukla-2026', 'adesh@gmail.com'), 'email name')
  assert.equal(checkPassword('mango-river-lantern-42'), null)
  assert.equal(checkPassword('mango-river-lantern-42', 'adesh@gmail.com'), null)
})

test('passwords: hash round-trip, wrong password and missing account fail', () => {
  const h = hashPassword('correct horse battery')
  assert.ok(verifyPassword('correct horse battery', h))
  assert.ok(!verifyPassword('wrong horse battery', h))
  assert.ok(!verifyPassword('correct horse battery', null))
  assert.notEqual(hashPassword('same input here'), hashPassword('same input here'))
  assert.ok(!h.includes('correct'))
})

test('usernames: brand names people trust are reserved', () => {
  for (const n of ['paypal', 'google', 'whatsapp', 'sbi']) assert.ok('error' in checkUsername(n), n)
})
