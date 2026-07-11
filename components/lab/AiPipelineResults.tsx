'use client'

import { Fragment, useState } from 'react'
import { CssCodeBlock } from '@/components/lab/CssCodeBlock'
import { copyText } from '@/lib/utils/clipboard'
import { AI_TELL_PHRASES } from '@/lib/ai/aiTellPhrases'
import { HUMAN_INPUT_MARKER_SOURCE, isHumanInputMarker } from '@/lib/ai/humanInputMarkers'
import type { PipelineResponse } from '@/types/aiPipeline'

// One combined case-insensitive pattern that captures both AI-tell phrases and
// [TODO: ...] human-input markers, so a single split() pass can highlight each
// kind differently. The actual counts come from the server (countAiTellPhrases
// / countHumanInputMarkers); this just re-finds the same shapes to show where
// they are in the already-returned text.
const AI_TELL_ALT = AI_TELL_PHRASES.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
const HIGHLIGHT_PATTERN = new RegExp(`(${HUMAN_INPUT_MARKER_SOURCE}|${AI_TELL_ALT})`, 'gi')

function highlight(text: string) {
  const parts = text.split(HIGHLIGHT_PATTERN)
  return parts.map((part, i) => {
    if (!part) return <Fragment key={i} />
    if (isHumanInputMarker(part)) {
      return (
        <mark
          key={i}
          className="border-ds-accent/40 bg-ds-accent/15 text-ds-accent rounded border border-dashed px-1 font-mono text-[13px]"
        >
          {part}
        </mark>
      )
    }
    if (AI_TELL_PHRASES.some((p) => p.toLowerCase() === part.toLowerCase())) {
      return (
        <mark key={i} className="bg-ds-warning/30 text-ds-text rounded px-0.5">
          {part}
        </mark>
      )
    }
    return <Fragment key={i}>{part}</Fragment>
  })
}

/** Same clipboard pattern as CssCodeBlock's copy button — this one copies the
 * raw pipeline text (scaffold / copy-edited output) rather than a code block. */
function CopyTextButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (!(await copyText(text))) return
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={label}
      className={
        copied
          ? 'text-ds-success font-mono text-xs'
          : 'text-ds-muted hover:text-ds-accent font-mono text-xs transition-colors'
      }
    >
      {copied ? 'Copied ✓' : 'Copy'}
    </button>
  )
}

function MetricCard({
  label,
  tokens,
  ms,
  provider,
}: {
  label: string
  tokens: number
  ms: number
  provider: string
}) {
  return (
    <div className="border-ds-border bg-ds-surface2 rounded-lg border p-3">
      <p className="text-ds-muted mb-1 font-mono text-[11px] tracking-wide uppercase">{label}</p>
      <p className="text-ds-text text-sm font-medium">{tokens} tokens</p>
      <p className="text-ds-muted text-xs">
        {ms}ms · via {provider}
      </p>
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
            provider={metrics.draft.provider}
          />
          <MetricCard
            label="Humanize"
            tokens={metrics.humanize.promptTokens + metrics.humanize.completionTokens}
            ms={metrics.humanize.latencyMs}
            provider={metrics.humanize.provider}
          />
          <MetricCard
            label="Frontmatter"
            tokens={metrics.frontmatter.promptTokens + metrics.frontmatter.completionTokens}
            ms={metrics.frontmatter.latencyMs}
            provider={metrics.frontmatter.provider}
          />
        </div>
        <p className="text-ds-muted mt-3 text-xs">
          Total latency: {metrics.totalLatencyMs}ms · AI-tell phrases:{' '}
          {metrics.aiTellEval.beforeCount} found in draft → {metrics.aiTellEval.afterCount} left
          after humanizing
        </p>
      </div>

      {/* Human-input callout — the honest part: the scaffold marks what it
          won't fabricate, so the author knows exactly what to fill in. */}
      {metrics.humanInputMarkers > 0 && (
        <div className="border-ds-accent/30 bg-ds-accent/10 rounded-lg border p-4">
          <p className="text-ds-text text-sm font-medium">
            {metrics.humanInputMarkers}{' '}
            {metrics.humanInputMarkers === 1 ? 'spot needs' : 'spots need'} your real input
          </p>
          <p className="text-ds-muted mt-1 text-xs leading-relaxed">
            The scaffold left <span className="text-ds-accent font-mono">[TODO: …]</span>{' '}
            placeholders instead of inventing code, metrics, or experience it doesn&apos;t have.
            Fill these with your own tested code and real numbers before publishing — that&apos;s
            what makes a post genuine (and what no humanizing pass can fake).
          </p>
        </div>
      )}

      {/* Draft (AI-tell phrases + human-input markers highlighted) */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-ds-text text-sm font-semibold">Raw scaffold</h3>
          <CopyTextButton text={draft} label="Copy raw scaffold text" />
        </div>
        <div className="border-ds-border bg-ds-surface2 max-h-64 overflow-y-auto rounded-lg border p-4 text-sm leading-relaxed whitespace-pre-wrap">
          {highlight(draft)}
        </div>
      </div>

      {/* Humanized */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-ds-text text-sm font-semibold">After copy-edit pass</h3>
          <CopyTextButton text={humanized} label="Copy copy-edited text" />
        </div>
        <div className="border-ds-border bg-ds-surface2 max-h-64 overflow-y-auto rounded-lg border p-4 text-sm leading-relaxed whitespace-pre-wrap">
          {highlight(humanized)}
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
