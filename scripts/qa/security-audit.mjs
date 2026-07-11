#!/usr/bin/env node
// scripts/qa/security-audit.mjs
//
// Static security audit — dependency-free and project-agnostic (copy this file
// into any Next.js/Node repo and run `node scripts/qa/security-audit.mjs`).
// It scans source for the classes of mistakes that keep recurring:
//
//   E1  client-exposed secrets  — NEXT_PUBLIC_ env names that look like secrets
//   E2  eval / new Function     — arbitrary code execution surface
//   E3  hardcoded credentials   — key-shaped literals committed into source
//   E4  missing security headers— next.config must set the baseline four
//   W1  dangerouslySetInnerHTML — listed for manual review (every use must escape)
//   W2  fs reads near request params — possible path traversal, review the guard
//   W3  target="_blank" without rel="noopener" — reverse tabnabbing
//
// Errors exit 1 (fail CI); warnings print for review. Run via `pnpm qa:security`.

import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const SCAN_DIRS = ['app', 'components', 'lib', 'scripts', 'pages', 'src'].filter((d) =>
  fs.existsSync(path.join(ROOT, d))
)
const EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'dist', 'build'])

const errors = []
const warnings = []

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) yield* walk(path.join(dir, entry.name))
    } else if (EXTS.has(path.extname(entry.name))) {
      yield path.join(dir, entry.name)
    }
  }
}

const SECRET_LITERALS = [
  /(?:gsk|sk|rk|re|pk|ghp|gho|xox[bap])_[A-Za-z0-9_-]{24,}/, // common API-key shapes
  /AKIA[0-9A-Z]{16}/, // AWS access key
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
]

for (const dir of SCAN_DIRS) {
  for (const file of walk(path.join(ROOT, dir))) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/')
    if (rel.endsWith('security-audit.mjs')) continue // don't flag our own patterns
    const src = fs.readFileSync(file, 'utf8')
    const lines = src.split('\n')

    lines.forEach((line, i) => {
      const loc = `${rel}:${i + 1}`
      if (/NEXT_PUBLIC_[A-Z0-9_]*(SECRET|TOKEN|PASSWORD|PRIVATE|API_KEY)/.test(line)) {
        errors.push(`E1 ${loc} — NEXT_PUBLIC_ name looks like a secret (client-exposed!)`)
      }
      if (/\beval\s*\(|new Function\s*\(/.test(line) && !line.trim().startsWith('//')) {
        errors.push(`E2 ${loc} — eval()/new Function() found`)
      }
      for (const re of SECRET_LITERALS) {
        if (re.test(line)) errors.push(`E3 ${loc} — hardcoded credential-shaped literal`)
      }
      if (/dangerouslySetInnerHTML/.test(line)) {
        warnings.push(`W1 ${loc} — dangerouslySetInnerHTML (verify the input is escaped)`)
      }
      if (/target="_blank"/.test(line) && !/noopener/.test(line)) {
        // rel often sits on the following line of a JSX attribute list
        const nearby = lines.slice(i, i + 3).join(' ')
        if (!/noopener/.test(nearby)) {
          warnings.push(`W3 ${loc} — target="_blank" without rel="noopener"`)
        }
      }
    })

    // W2: request params + fs reads in the same file → check traversal guards
    const usesParams = /\b(searchParams|params)\b/.test(src)
    const readsFs = /readFileSync|readFile\(|createReadStream/.test(src)
    if (usesParams && readsFs) {
      warnings.push(`W2 ${rel} — reads fs AND touches request params; verify path guards`)
    }
  }
}

// E4: baseline security headers in next.config
const configFile = ['next.config.ts', 'next.config.mjs', 'next.config.js']
  .map((f) => path.join(ROOT, f))
  .find((f) => fs.existsSync(f))
if (configFile) {
  const cfg = fs.readFileSync(configFile, 'utf8')
  for (const header of [
    'X-Content-Type-Options',
    'X-Frame-Options',
    'Referrer-Policy',
    'Permissions-Policy',
  ]) {
    if (!cfg.includes(header)) {
      errors.push(`E4 ${path.basename(configFile)} — missing security header: ${header}`)
    }
  }
}

console.log(`Security audit — scanned ${SCAN_DIRS.join(', ')}\n`)
for (const w of warnings) console.log(`  ⚠ ${w}`)
for (const e of errors) console.log(`  ✗ ${e}`)
console.log(`\n${errors.length} error(s), ${warnings.length} warning(s)`)
process.exit(errors.length > 0 ? 1 : 0)
