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
