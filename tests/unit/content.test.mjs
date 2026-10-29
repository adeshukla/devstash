// Invariants the content and SEO work depends on. Runs on the files, no server.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import matter from 'gray-matter'

const read = (dir) =>
  fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.mdx') || f.endsWith('.json'))
    .map((f) => ({ f, text: fs.readFileSync(`${dir}/${f}`, 'utf8') }))

const posts = read('content/blogs').map(({ f, text }) => ({ f, ...matter(text) }))
const projects = read('content/projects').map(({ f, text }) => ({ f, ...JSON.parse(text) }))

test('every post has FAQs, so the Quick answers section and FAQ markup exist', () => {
  for (const p of posts) assert.ok(p.data.faqs?.length >= 2, `${p.f} needs 2+ faqs`)
})

test('search titles fit: seoTitle <= 49, or the title itself fits with the brand suffix', () => {
  for (const p of posts) {
    const shown = p.data.seoTitle ?? p.data.title
    assert.ok(
      shown.length + 11 <= 62,
      `${p.f}: "${shown}" is ${shown.length + 11} chars in results`
    )
  }
})

test('descriptions are 120-160 chars', () => {
  for (const p of posts)
    assert.ok(p.data.description.length >= 120 && p.data.description.length <= 160, p.f)
})

test('every project has at most 3 cover stats and a case study', () => {
  for (const p of projects) {
    assert.ok((p.coverStats ?? []).length <= 3, `${p.slug} has too many cover stats`)
    assert.ok(p.caseStudy?.problem, `${p.slug} needs a case study`)
  }
})

test('robots.txt does not block render-critical /_next/ assets', () => {
  const robots = fs.readFileSync('app/robots.ts', 'utf8')
  assert.ok(!/disallow:\s*\[[^\]]*'\/_next\/'/.test(robots))
})
