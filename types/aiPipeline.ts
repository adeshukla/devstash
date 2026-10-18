// types/aiPipeline.ts
//
// Shared types for the /lab/ai-content-pipeline demo tool: a 3-step Groq LLM
// chain (draft → humanize → SEO frontmatter) exposed via app/api/ai-pipeline.

export type PipelineTone = 'technical' | 'conversational' | 'tutorial'

/** Hand-built page designs in lib/ai/landingDesigns.ts. */
export type PageDesignId = 'editorial' | 'split' | 'bento' | 'minimal' | 'bold'

/** The only part of the landing page the model writes; every design renders it. */
export interface PageCopy {
  brand: string
  heroTitle: string
  heroLead: string
  cta: string
  features: { title: string; body: string }[]
  closingTitle: string
  closingLead: string
}

export interface HtmlVariant {
  id: PageDesignId
  name: string
  blurb: string
  html: string
}

export interface PipelineRequest {
  topic: string
  keywords: string[]
  tone: PipelineTone
  targetLength: number
  userApiKey?: string
  // Explicit opt-in (a checkbox in the UI, unchecked by default) for a 4th
  // LLM call that generates a standalone HTML landing page from the same
  // content. Off by default because it's an extra step with its own token
  // cost and latency, not because it's unsafe.
  generateHtmlPage?: boolean
  /** Which design to show first; 'auto' picks one at random per run. */
  design?: PageDesignId | 'auto'
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
  // null unless generateHtmlPage was requested on this run.
  htmlPage: StepMetrics | null
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
  // Standalone HTML document text, or null if generateHtmlPage wasn't checked
  // for this run. Never persisted server-side — same "nothing saved" contract
  // as the rest of the pipeline.
  htmlPage: string | null
  // The same page in every design (same copy, same article), so the visitor
  // can switch styles without another LLM call. Empty when htmlPage is null.
  htmlVariants: HtmlVariant[]
  // Which variant htmlPage is.
  htmlDesign: PageDesignId | null
  metrics: PipelineMetrics
  remainingFreeRuns: number
  usedByok: boolean
}

export interface PipelineErrorResponse {
  error: string
  requiresByok?: boolean
}
