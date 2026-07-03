'use client'

import { Fragment } from 'react'
import { CssCodeBlock } from '@/components/lab/CssCodeBlock'
import { AI_TELL_PHRASES } from '@/lib/ai/aiTellPhrases'
import type { PipelineResponse } from '@/types/aiPipeline'

// Case-insensitive alternation of every AI-tell phrase, used only for the
// visual <mark> highlight here — the actual pass/fail count comes from the
// server (lib/ai/aiTellPhrases.ts's countAiTellPhrases), this just re-finds
// the same phrases in the already-returned text to show where they are.
const HIGHLIGHT_PATTERN = new RegExp(
  `(${AI_TELL_PHRASES.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
  'gi'
)

function highlightAiTellPhrases(text: string) {
  const parts = text.split(HIGHLIGHT_PATTERN)
  return parts.map((part, i) =>
    AI_TELL_PHRASES.some((p) => p.toLowerCase() === part.toLowerCase()) ? (
      <mark key={i} className="bg-ds-warning/30 text-ds-text rounded px-0.5">
        {part}
      </mark>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  )
}

function MetricCard({ label, tokens, ms }: { label: string; tokens: number; ms: number }) {
  return (
    <div className="border-ds-border bg-ds-surface2 rounded-lg border p-3">
      <p className="text-ds-muted mb-1 font-mono text-[11px] tracking-wide uppercase">{label}</p>
      <p className="text-ds-text text-sm font-medium">{tokens} tokens</p>
      <p className="text-ds-muted text-xs">{ms}ms</p>
    </div>
  )
}

export function AiPipelineResults({ result }: { result: PipelineResponse }) {
  const { draft, humanized, frontmatter, metrics } = result

  return (
    <div className="mt-8 flex flex-col gap-6">
      {/* Metrics */}
      <div>
        <h3 className="text-ds-text mb-3 text-sm font-semibold">Live metrics</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <MetricCard
            label="Draft"
            tokens={metrics.draft.promptTokens + metrics.draft.completionTokens}
            ms={metrics.draft.latencyMs}
          />
          <MetricCard
            label="Humanize"
            tokens={metrics.humanize.promptTokens + metrics.humanize.completionTokens}
            ms={metrics.humanize.latencyMs}
          />
          <MetricCard
            label="Frontmatter"
            tokens={metrics.frontmatter.promptTokens + metrics.frontmatter.completionTokens}
            ms={metrics.frontmatter.latencyMs}
          />
        </div>
        <p className="text-ds-muted mt-3 text-xs">
          Total latency: {metrics.totalLatencyMs}ms · AI-tell phrases:{' '}
          {metrics.aiTellEval.beforeCount} found in draft → {metrics.aiTellEval.afterCount} left
          after humanizing
        </p>
      </div>

      {/* Draft (with AI-tell phrases highlighted) */}
      <div>
        <h3 className="text-ds-text mb-2 text-sm font-semibold">Raw draft</h3>
        <div className="border-ds-border bg-ds-surface2 max-h-64 overflow-y-auto rounded-lg border p-4 text-sm leading-relaxed whitespace-pre-wrap">
          {highlightAiTellPhrases(draft)}
        </div>
      </div>

      {/* Humanized */}
      <div>
        <h3 className="text-ds-text mb-2 text-sm font-semibold">After humanizing pass</h3>
        <div className="border-ds-border bg-ds-surface2 max-h-64 overflow-y-auto rounded-lg border p-4 text-sm leading-relaxed whitespace-pre-wrap">
          {highlightAiTellPhrases(humanized)}
        </div>
      </div>

      {/* Frontmatter */}
      <div>
        <h3 className="text-ds-text mb-2 text-sm font-semibold">SEO frontmatter</h3>
        <CssCodeBlock label="JSON" code={JSON.stringify(frontmatter, null, 2)} />
      </div>
    </div>
  )
}
