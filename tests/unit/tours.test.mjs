import { test } from 'node:test'
import assert from 'node:assert/strict'
import { TOURS } from '../../lib/lab/tours.ts'

test('every Lab tour has 2 to 7 steps, each with a target, a short title and a plain body', () => {
  assert.ok(Object.keys(TOURS).length >= 8)
  for (const [slug, steps] of Object.entries(TOURS)) {
    assert.ok(steps.length >= 2 && steps.length <= 7, `${slug}: ${steps.length} steps`)
    const targets = new Set()
    for (const s of steps) {
      assert.ok(s.target.length > 0, `${slug}: empty target`)
      assert.ok(!targets.has(s.target), `${slug}: two steps point at ${s.target}`)
      targets.add(s.target)
      assert.ok(s.title.length > 0 && s.title.length <= 40, `${slug}: title "${s.title}"`)
      assert.ok(s.body.length >= 40 && s.body.length <= 330, `${slug}: body of "${s.title}"`)
      if (s.click) assert.ok(s.click.label && s.click.target, `${slug}: incomplete click`)
    }
    // A tour that only works when something optional is on the page still needs a base.
    assert.ok(
      steps.some((s) => !s.optional),
      `${slug}: every step is optional`
    )
  }
})

test('tour text makes no promises the tools do not keep', () => {
  const all = Object.values(TOURS)
    .flat()
    .map((s) => `${s.title} ${s.body}`)
    .join(' ')
    .toLowerCase()
  for (const word of ['guarantee', 'always works', 'instantly', 'ai-powered'])
    assert.ok(!all.includes(word), `found "${word}"`)
})
