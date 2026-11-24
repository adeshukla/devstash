import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isLiveOn, todayInIndia } from '../../lib/markdown/schedule.ts'

test('a post dated today or earlier is live, a future one is not', () => {
  assert.equal(isLiveOn('2026-11-25', '2026-11-25'), true)
  assert.equal(isLiveOn('2026-11-24', '2026-11-25'), true)
  assert.equal(isLiveOn('2026-11-27', '2026-11-25'), false)
  assert.equal(isLiveOn('2026-11-27T00:00:00Z', '2026-11-27'), true)
})

test('"today" is the India date, not UTC', () => {
  // 20:00 UTC on the 25th is already 01:30 on the 26th in India.
  assert.equal(todayInIndia(new Date('2026-11-25T20:00:00Z')), '2026-11-26')
})
