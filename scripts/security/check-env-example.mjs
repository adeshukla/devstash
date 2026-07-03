#!/usr/bin/env node
// scripts/security/check-env-example.mjs
//
// Guards against the exact incident that hit this repo twice: a real secret
// (Resend key, reCAPTCHA keys) pasted into .env.example instead of a
// placeholder. .env.example is committed and public, so every value in it
// must be empty or an obvious placeholder — never something that could
// actually authenticate against a real service.
//
// READ-ONLY: this script never modifies any file.
// Run via: node scripts/security/check-env-example.mjs   (pnpm check:env-example)

import fs from 'node:fs'
import path from 'node:path'

const CWD = process.cwd()
const ENV_EXAMPLE_PATH = path.join(CWD, '.env.example')

const supportsColor = process.stdout.isTTY && !process.env.NO_COLOR
const paint = (code, s) => (supportsColor ? `\x1b[${code}m${s}\x1b[0m` : s)
const red = (s) => paint('31', s)
const green = (s) => paint('32', s)
const bold = (s) => paint('1', s)

// A value is an acceptable placeholder if it's obviously not a real secret:
// empty, all-caps/X filler (G-XXXXXXXXXX, GTM-XXXXXXX), angle-bracket or
// <your-...> style, or a literal "TODO"/"CHANGEME".
const PLACEHOLDER_PATTERN =
  /^(|[<].*[>]|[A-Z0-9-]*X{4,}[A-Z0-9-]*|TODO.*|CHANGE[_-]?ME.*|your[-_].+)$/i

// Keys that are allowed a real, non-placeholder value because the value
// itself isn't a credential (e.g. the canonical production URL is meant to
// be public knowledge, unlike an API key or session secret).
const NON_SECRET_KEYS = new Set(['NEXT_PUBLIC_SITE_URL'])

function main() {
  if (!fs.existsSync(ENV_EXAMPLE_PATH)) {
    console.log('No .env.example found — nothing to check.')
    process.exit(0)
  }

  const lines = fs.readFileSync(ENV_EXAMPLE_PATH, 'utf8').split('\n')
  const offenders = []

  lines.forEach((rawLine, i) => {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) return

    const eq = line.indexOf('=')
    if (eq === -1) return

    const key = line.slice(0, eq).trim()
    const value = line.slice(eq + 1).trim()

    if (!NON_SECRET_KEYS.has(key) && !PLACEHOLDER_PATTERN.test(value)) {
      offenders.push({ line: i + 1, key, value })
    }
  })

  if (offenders.length > 0) {
    console.log(bold(red('\n✗ .env.example contains what looks like a real secret:')))
    for (const o of offenders) {
      // Never echo the actual value back into CI logs — name and line only.
      console.log(`    ${red('ERROR')} line ${o.line}: ${o.key} has a non-placeholder value`)
    }
    console.log(
      red(
        '\n.env.example is committed and public — every value must be blank or an obvious placeholder (e.g. G-XXXXXXXXXX).'
      )
    )
    process.exit(1)
  }

  console.log(green(`✓ .env.example — all ${lines.length} line(s) clean (no real-looking secrets)`))
  process.exit(0)
}

main()
