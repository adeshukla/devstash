// Server-only — uses Node.js 'fs'. Never import in Client Components.
import fs from 'fs'
import path from 'path'
import type { Project, ProjectCategory } from '@/types/project'

const PROJECTS_DIR = path.join(process.cwd(), 'content/projects')

// ─── CORE READERS ────────────────────────────────────────────────────

export function getAllProjects(): Project[] {
  if (!fs.existsSync(PROJECTS_DIR)) return []

  const files = fs.readdirSync(PROJECTS_DIR).filter((f) => f.endsWith('.json'))

  return files
    .map((filename) => {
      const fullPath = path.join(PROJECTS_DIR, filename)
      const raw = fs.readFileSync(fullPath, 'utf-8')
      return JSON.parse(raw) as Project
    })
    .sort((a, b) => a.order - b.order)
}

export function getProjectBySlug(slug: string): Project | null {
  // The slug arrives straight from the URL when a request misses the
  // statically generated params, so gate it before it touches the
  // filesystem — otherwise "../../something" becomes a path-traversal read.
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) return null

  const fullPath = path.join(PROJECTS_DIR, `${slug}.json`)
  if (!fs.existsSync(fullPath)) return null

  const raw = fs.readFileSync(fullPath, 'utf-8')
  return JSON.parse(raw) as Project
}

// ─── FILTERS ─────────────────────────────────────────────────────────

export function getFeaturedProjects(limit = 3): Project[] {
  return getAllProjects()
    .filter((p) => p.featured)
    .slice(0, limit)
}

export function getProjectsByCategory(category: ProjectCategory): Project[] {
  return getAllProjects().filter((p) => p.category === category)
}

export function getLiveProjects(): Project[] {
  return getAllProjects().filter((p) => p.status === 'live')
}

// ─── CASE-STUDY OUTCOME ──────────────────────────────────────────────
//
// `caseStudy.outcome` follows the project's no-fabricated-metrics rule: where
// there is no real traffic or usage data, the field records WHY rather than
// inventing a number. Those entries were authored with a leading `// TODO:`
// marker, which was being rendered verbatim to visitors — a portfolio page
// reading "Outcome: // TODO: no usage data" looks unfinished rather than
// deliberately honest.
//
// The marker stays in the JSON (it's a genuine signal that real numbers are
// still owed once a project has them); this just parses it out so the UI can
// present the two cases differently.

const OUTCOME_PENDING_MARKER = /^\s*\/\/\s*TODO:\s*/i

export interface ParsedOutcome {
  /** Marker stripped, ready to render. */
  text: string
  /** True when no real metrics exist yet and the text explains why. */
  pending: boolean
}

export function parseCaseStudyOutcome(outcome: string | undefined): ParsedOutcome | null {
  if (!outcome?.trim()) return null

  const pending = OUTCOME_PENDING_MARKER.test(outcome)
  const text = outcome.replace(OUTCOME_PENDING_MARKER, '').trim()

  return text ? { text, pending } : null
}
