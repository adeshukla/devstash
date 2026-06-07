export type ProjectStatus = 'live' | 'wip' | 'archived'

export type ProjectCategory = 'web-app' | 'automation' | 'tool' | 'clone' | 'open-source'

export interface Project {
  slug: string
  title: string
  description: string
  longDescription: string
  status: ProjectStatus
  featured: boolean
  order: number
  category: ProjectCategory
  tech: string[]
  liveUrl?: string
  githubUrl?: string
  image: string
  images?: string[]
  startDate: string
  endDate?: string
  highlights: string[]
}
