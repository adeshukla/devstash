// scripts/seo/check-project-mdx.mjs
//
// content/projects/*.json's `longDescription` field is rendered through
// MDXRemote (app/(main)/projects/[slug]/page.tsx) even though it's currently
// hand-authored plain prose, not markdown someone wrote with MDX rules in
// mind. A single stray `<word>` (e.g. "the finished <title>/<meta> block")
// parses as an unclosed JSX tag and fails prerendering for THAT route only
// at `pnpm build` time — on Vercel, that surfaces as a deploy failure, not a
// local warning. This compiles every project's longDescription through the
// exact same MDX pipeline ahead of time so a bad edit fails fast in
// `pnpm lint:content` / CI instead of mid-deploy.

import fs from 'fs'
import path from 'path'
import { compile } from '@mdx-js/mdx'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'

const PROJECTS_DIR = path.join(process.cwd(), 'content/projects')

async function main() {
  if (!fs.existsSync(PROJECTS_DIR)) {
    console.log('No content/projects directory found — nothing to check.')
    return
  }

  const files = fs.readdirSync(PROJECTS_DIR).filter((f) => f.endsWith('.json'))
  const errors = []

  for (const file of files) {
    const raw = fs.readFileSync(path.join(PROJECTS_DIR, file), 'utf-8')
    let data
    try {
      data = JSON.parse(raw)
    } catch (err) {
      errors.push(`${file}: invalid JSON — ${err.message}`)
      continue
    }

    if (!data.longDescription) continue

    try {
      await compile(data.longDescription, {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
      })
    } catch (err) {
      errors.push(`${file}: longDescription fails to compile as MDX — ${err.message}`)
    }
  }

  if (errors.length > 0) {
    console.error(`✗ ${errors.length} project file(s) have invalid longDescription MDX:\n`)
    for (const e of errors) console.error(`  ${e}`)
    console.error(
      '\nA raw `<word>` is usually the cause (MDX reads it as a JSX tag) — wrap it in backticks\n' +
        'instead, e.g. `<title>` renders literally and safely as inline code.'
    )
    process.exit(1)
  }

  console.log(`✓ ${files.length} project file(s) — longDescription all compile as valid MDX.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
