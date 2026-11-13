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

test('passwords: length rules, hash round-trip, wrong password and missing account fail', () => {
  assert.ok(checkPassword('short'))
  assert.equal(checkPassword('long enough pw'), null)
  const h = hashPassword('correct horse')
  assert.ok(verifyPassword('correct horse', h))
  assert.ok(!verifyPassword('wrong horse', h))
  assert.ok(!verifyPassword('correct horse', null))
  assert.notEqual(hashPassword('x'.repeat(8)), hashPassword('x'.repeat(8)))
})
