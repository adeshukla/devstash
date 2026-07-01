import type { GalleryImage } from '@/components/ui/ImageGallery'

export type ProjectStatus = 'live' | 'wip' | 'archived'

export type ProjectCategory = 'web-app' | 'automation' | 'tool' | 'clone' | 'open-source'

/** Mini case-study breakdown — used for original landing-page samples and
 * anonymized client work where the design reasoning matters as much as the result. */
export interface ProjectCaseStudy {
  problem: string
  approach: string
  decisions: string[]
  outcome?: string
  /** Set only when details are anonymized per a confidentiality agreement. */
  confidentialityNote?: string
}

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
  year?: number
  interface?: GalleryImage[]
  caseStudy?: ProjectCaseStudy
}
