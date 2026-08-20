// scripts/automation/optimize-images.mjs
//
// Recompresses raster images under public/images to WebP, capped to a sane
// max dimension, and reports the size saved. next/image already re-encodes
// on request, but a 4MB source PNG still bloats the repo/deploy and pays a
// full-size decode on the *first* cold-cache request — this fixes that at
// the source instead of relying on the CDN transform alone.
//
// Usage:
//   node scripts/automation/optimize-images.mjs           # convert + report
//   node scripts/automation/optimize-images.mjs --check    # CI mode: fail if
//                                                            any oversized
//                                                            raster has no
//                                                            optimized sibling

import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const IMAGES_DIR = path.join(process.cwd(), 'public/images')
const MAX_WIDTH = 1600
const WEBP_QUALITY = 82
// Any source PNG/JPG at or above this size must have a same-directory .webp
// sibling — this is the threshold the CI guard enforces.
const SIZE_THRESHOLD_BYTES = 300 * 1024

const isCheckMode = process.argv.includes('--check')

function walk(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(full)
    if (/\.(png|jpe?g)$/i.test(entry.name)) return [full]
    return []
  })
}

async function convertOne(file) {
  const webpPath = file.replace(/\.(png|jpe?g)$/i, '.webp')
  const srcStat = fs.statSync(file)

  const image = sharp(file)
  const meta = await image.metadata()
  const resize = meta.width && meta.width > MAX_WIDTH ? { width: MAX_WIDTH } : {}

  await image.resize(resize).webp({ quality: WEBP_QUALITY }).toFile(webpPath)

  const outStat = fs.statSync(webpPath)
  return { file, webpPath, before: srcStat.size, after: outStat.size }
}

async function main() {
  const files = walk(IMAGES_DIR)
  const oversized = files.filter((f) => fs.statSync(f).size >= SIZE_THRESHOLD_BYTES)

  if (isCheckMode) {
    const missing = oversized.filter((f) => !fs.existsSync(f.replace(/\.(png|jpe?g)$/i, '.webp')))
    if (missing.length > 0) {
      console.error(
        `✗ ${missing.length} image(s) over ${SIZE_THRESHOLD_BYTES / 1024}KB have no optimized .webp sibling:`
      )
      for (const f of missing) {
        console.error(
          `    ${path.relative(process.cwd(), f)} (${(fs.statSync(f).size / 1024).toFixed(0)}KB)`
        )
      }
      console.error(
        '\nRun `node scripts/automation/optimize-images.mjs` and commit the .webp output,'
      )
      console.error('then swap the reference in content/ or the component to the .webp path.')
      process.exit(1)
    }
    console.log(`✓ No oversized raster images without an optimized .webp sibling.`)
    return
  }

  if (oversized.length === 0) {
    console.log('No images over the size threshold — nothing to do.')
    return
  }

  console.log(
    `Converting ${oversized.length} image(s) ≥ ${SIZE_THRESHOLD_BYTES / 1024}KB to WebP…\n`
  )
  let totalBefore = 0
  let totalAfter = 0
  for (const file of oversized) {
    const result = await convertOne(file)
    totalBefore += result.before
    totalAfter += result.after
    const pct = (100 * (1 - result.after / result.before)).toFixed(0)
    console.log(
      `  ${path.relative(process.cwd(), file)} — ${(result.before / 1024).toFixed(0)}KB → ${(result.after / 1024).toFixed(0)}KB (-${pct}%)`
    )
  }
  console.log(
    `\nTotal: ${(totalBefore / 1024 / 1024).toFixed(1)}MB → ${(totalAfter / 1024 / 1024).toFixed(1)}MB`
  )
  console.log(
    '\nOriginal PNG/JPG files were left in place — update references to the new .webp path, verify, then delete the originals.'
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
