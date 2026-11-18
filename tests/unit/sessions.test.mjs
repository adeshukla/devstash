import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  addSession,
  updateSession,
  renameSession,
  duplicateSession,
  removeSession,
  toFile,
  parseSessionFile,
  mergeImported,
  uniqueName,
  cleanName,
  str,
  oneOf,
  MAX_SESSIONS,
  MAX_NAME,
  MAX_DATA_CHARS,
} from '../../lib/lab/sessions.ts'

const T0 = new Date('2026-11-18T10:00:00Z')
const T1 = new Date('2026-11-18T11:00:00Z')

test('a session is saved with a unique name, newest first, and can be updated and renamed', () => {
  let r = addSession([], 'Diwali sale', { url: 'https://a.in' }, T0, 'a')
  assert.equal(r.error, '')
  r = addSession(r.list, ' diwali   SALE ', { url: 'https://b.in' }, T0, 'b')
  assert.deepEqual(
    r.list.map((s) => s.name),
    ['diwali SALE 2', 'Diwali sale']
  )
  const up = updateSession(r.list, 'a', { url: 'https://c.in' }, T1)
  assert.equal(up.list.find((s) => s.id === 'a').data.url, 'https://c.in')
  assert.equal(up.list.find((s) => s.id === 'a').updatedAt, T1.toISOString())
  const rn = renameSession(up.list, 'a', 'diwali sale 2', T1)
  assert.equal(rn.list.find((s) => s.id === 'a').name, 'diwali sale 2 2') // 'diwali SALE 2' is taken
  assert.equal(updateSession(up.list, 'nope', {}, T1).error, 'That session no longer exists.')
})

test('names are cleaned, capped, and never empty', () => {
  assert.equal(cleanName('  a \n  b  '), 'a b')
  assert.equal(uniqueName('', []), 'Untitled')
  assert.equal(uniqueName('x'.repeat(200), []).length, MAX_NAME)
  const taken = ['x'.repeat(MAX_NAME)]
  const next = uniqueName('x'.repeat(MAX_NAME), taken)
  assert.ok(next.length <= MAX_NAME && next !== taken[0])
})

test('the list is capped and one session cannot be huge', () => {
  let list = []
  for (let i = 0; i < MAX_SESSIONS; i++) list = addSession(list, `s${i}`, {}, T0, `id${i}`).list
  assert.equal(list.length, MAX_SESSIONS)
  assert.match(addSession(list, 'one more', {}, T0, 'x').error, /Delete one first/)
  assert.match(
    addSession([], 'big', { text: 'x'.repeat(MAX_DATA_CHARS + 1) }, T0, 'y').error,
    /too big/
  )
})

test('duplicate makes an independent copy; remove deletes only that one', () => {
  const a = addSession([], 'Plan', { rows: [{ n: 1 }] }, T0, 'a').list
  const d = duplicateSession(a, 'a', T1, 'b')
  assert.equal(d.list[0].name, 'Plan copy')
  d.list[0].data.rows[0].n = 99
  assert.equal(a[0].data.rows[0].n, 1)
  assert.deepEqual(
    removeSession(d.list, 'a').map((s) => s.id),
    ['b']
  )
})

test('a sessions file round-trips and refuses other files, other tools and junk', () => {
  const list = addSession([], 'Mine', { a: 'हिंदी ✓' }, T0, 'a').list
  const text = JSON.stringify(toFile('whatsapp-link', list, T1))
  const ok = parseSessionFile(text, 'whatsapp-link')
  assert.equal(ok.error, '')
  assert.equal(ok.sessions[0].data.a, 'हिंदी ✓')
  assert.match(parseSessionFile(text, 'qr-code').error, /different tool/)
  assert.match(
    parseSessionFile('{"app":"other","sessions":[]}', 'whatsapp-link').error,
    /not a sessions file/
  )
  assert.match(parseSessionFile('not json', 'whatsapp-link').error, /not a sessions file/)
  assert.match(
    parseSessionFile(
      JSON.stringify({ app: 'devstash-sessions', tool: 't', sessions: [{ id: 1 }] }),
      't'
    ).error,
    /no sessions/
  )
})

test('importing never overwrites: ids and names are made unique, and the cap is kept', () => {
  const mine = addSession([], 'Plan', { v: 1 }, T0, 'a').list
  const incoming = [
    {
      id: 'a',
      name: 'Plan',
      createdAt: T0.toISOString(),
      updatedAt: T0.toISOString(),
      data: { v: 2 },
    },
  ]
  let n = 0
  const m = mergeImported(mine, incoming, () => `new${++n}`)
  assert.equal(m.added, 1)
  assert.deepEqual(m.list.map((s) => s.name).sort(), ['Plan', 'Plan 2'])
  assert.equal(new Set(m.list.map((s) => s.id)).size, 2)
  assert.equal(mine[0].data.v, 1)
  // Cap
  let full = []
  for (let i = 0; i < MAX_SESSIONS; i++) full = addSession(full, `s${i}`, {}, T0, `i${i}`).list
  const capped = mergeImported(full, incoming, () => 'z')
  assert.equal(capped.added, 0)
  assert.equal(capped.skipped, 1)
})

test('saved data is read back safely: wrong types and oversize text fall back', () => {
  assert.equal(str('hi'), 'hi')
  assert.equal(str(5, 'x'), 'x')
  assert.equal(str('a'.repeat(50), 'x', 10), 'x')
  assert.equal(oneOf('b', ['a', 'b'], 'a'), 'b')
  assert.equal(oneOf('zzz', ['a', 'b'], 'a'), 'a')
  assert.equal(oneOf({}, ['a', 'b'], 'a'), 'a')
})
