// Renders docs/resume.html -> public/resume-adesh-shukla.pdf.
//
// The résumé used to be exported by hand (open the HTML, Ctrl+P, Save as PDF).
// That is how a two-page PDF once shipped while the notes said one page: the
// manual export and the check were done at different widths. This script does
// the export the same way every time and asserts the page count from the PDF
// itself, so "it is one page" is measured rather than assumed.
//
//   pnpm resume:pdf
import { chromium } from '@playwright/test'
import { readFileSync, statSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

const ROOT = process.cwd()
const SRC = path.join(ROOT, 'docs/resume.html')
const OUT = path.join(ROOT, 'public/resume-adesh-shukla.pdf')

const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto(pathToFileURL(SRC).href, { waitUntil: 'networkidle' })
// docs/resume.html sets `@page { size: A4; margin: 12mm 13mm }`. preferCSSPageSize
// honours that instead of Chromium's own defaults, so the PDF matches the layout
// the stylesheet was written for.
await page.pdf({ path: OUT, preferCSSPageSize: true, printBackground: true })
await browser.close()

const raw = readFileSync(OUT).toString('latin1')
const pages = Number((raw.match(/\/Count\s+(\d+)/) || [])[1])
console.log(`  ${path.relative(ROOT, OUT)} — ${pages} page(s), ${statSync(OUT).size} bytes`)

if (pages !== 1) {
  console.error(`  FAIL: résumé must fit on one page, got ${pages}. Trim docs/resume.html.`)
  process.exit(1)
}
