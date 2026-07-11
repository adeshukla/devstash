// types/aiPipeline.ts
//
// Shared types for the /lab/ai-content-pipeline demo tool: a 3-step Groq LLM
// chain (draft → humanize → SEO frontmatter) exposed via app/api/ai-pipeline.

export type PipelineTone = 'technical' | 'conversational' | 'tutorial'

export interface PipelineRequest {
  topic: string
  keywords: string[]
  tone: PipelineTone
  targetLength: number
  userApiKey?: string
}

export interface StepMetrics {
  promptTokens: number
  completionTokens: number
  latencyMs: number
  provider: string
}

export interface PipelineMetrics {
  draft: StepMetrics
  humanize: StepMetrics
  frontmatter: StepMetrics
  totalLatencyMs: number
  aiTellEval: {
    beforeCount: number
    afterCount: number
  }
  // How many [TODO: ...] placeholders the scaffold left for the author to fill
  // with real, first-hand substance (tested code, a real metric, an anecdote)
  // instead of fabricating them.
  humanInputMarkers: number
}

// Subset of BlogFrontmatter (types/blog.ts) — the demo only generates these
// fields, not the full frontmatter (author/createdAt/canonical/etc. don't make
// sense for a throwaway demo run).
export interface DemoFrontmatter {
  title: string
  slug: string
  description: string
  category: string
  tags: string[]
  readingTime: number
}

export interface PipelineResponse {
  draft: string
  humanized: string
  frontmatter: DemoFrontmatter
  metrics: PipelineMetrics
  remainingFreeRuns: number
  usedByok: boolean
}

export interface PipelineErrorResponse {
  error: string
  requiresByok?: boolean
}
