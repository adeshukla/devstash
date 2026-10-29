import { test } from 'node:test'
import assert from 'node:assert/strict'
import { slugify, readingTime, validateFrontmatter } from '../../lib/automation/utils.ts'

test('slugify makes kebab-case and drops punctuation', () => {
  assert.equal(slugify('  Hello, World! Next.js 16  '), 'hello-world-nextjs-16')
  assert.equal(slugify('under_score and--dashes'), 'under-score-and-dashes')
})

test('readingTime is at least one minute and rounds up at 200 wpm', () => {
  assert.equal(readingTime(''), 1)
  assert.equal(readingTime('word '.repeat(200)), 1)
  assert.equal(readingTime('word '.repeat(201)), 2)
})

test('validateFrontmatter throws naming the missing fields', () => {
  assert.throws(
    () => validateFrontmatter({ title: 'x' }, 'post.mdx'),
    /missing required fields: .*slug/
  )
})
