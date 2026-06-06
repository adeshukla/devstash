// types/content.ts

export type SortOrder = 'asc' | 'desc'

export type ContentStatus = 'completed' | 'in-progress' | 'archived'

export type ProjectType = 'web-app' | 'tool' | 'automation' | 'library'

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  perPage: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface FilterOptions {
  category?: string
  tag?: string
  sort?: SortOrder
  page?: number
  limit?: number
}
