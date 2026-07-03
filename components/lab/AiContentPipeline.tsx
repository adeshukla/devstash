'use client'

import { useEffect, useState } from 'react'
import { Button, Input } from '@/components/ui'
import { AiPipelineTour, TOUR_SEEN_KEY } from '@/components/lab/AiPipelineTour'
import { AiPipelineResults } from '@/components/lab/AiPipelineResults'
import { trackAndLog, ANALYTICS_EVENTS } from '@/lib/analytics/events'
import type { PipelineResponse, PipelineTone } from '@/types/aiPipeline'

const TONE_OPTIONS: { label: string; value: PipelineTone }[] = [
  { label: 'Technical', value: 'technical' },
  { label: 'Conversational', value: 'conversational' },
  { label: 'Tutorial', value: 'tutorial' },
]

const LENGTH_OPTIONS = [
  { label: '~300 words', value: 300 },
  { label: '~600 words', value: 600 },
  { label: '~900 words', value: 900 },
  { label: '~1200 words', value: 1200 },
]

interface FormState {
  status: 'idle' | 'loading' | 'error'
  message: string
}

const selectClass =
  'h-11 w-full rounded-lg border border-ds-border bg-ds-surface2 px-4 text-[14px] text-ds-text outline-none transition-colors duration-200 focus:border-ds-accent'

export function AiContentPipeline() {
  const [topic, setTopic] = useState('')
  const [keywordsInput, setKeywordsInput] = useState('')
  const [tone, setTone] = useState<PipelineTone>('technical')
  const [targetLength, setTargetLength] = useState(600)
  const [topicError, setTopicError] = useState<string | undefined>()

  const [capReached, setCapReached] = useState(false)
  const [byokKey, setByokKey] = useState('')
  const [formState, setFormState] = useState<FormState>({ status: 'idle', message: '' })
  const [result, setResult] = useState<PipelineResponse | null>(null)

  const [tourOpen, setTourOpen] = useState(false)
  const [tourStep, setTourStep] = useState(0)

  useEffect(() => {
    if (!window.localStorage.getItem(TOUR_SEEN_KEY)) {
      setTourOpen(true)
    }
  }, [])

  function closeTour() {
    setTourOpen(false)
    window.localStorage.setItem(TOUR_SEEN_KEY, '1')
  }

  function reopenTour() {
    setTourStep(0)
    setTourOpen(true)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const trimmedTopic = topic.trim()
    if (trimmedTopic.length < 3) {
      setTopicError('Topic must be at least 3 characters.')
      return
    }
    setTopicError(undefined)

    if (capReached && !byokKey.trim()) {
      setFormState({ status: 'error', message: 'Paste your Groq API key to keep going.' })
      return
    }

    const keywords = keywordsInput
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
      .slice(0, 8)

    setFormState({ status: 'loading', message: '' })

    try {
      const res = await fetch('/api/ai-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: trimmedTopic,
          keywords,
          tone,
          targetLength,
          userApiKey: capReached ? byokKey.trim() : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.requiresByok) {
          setCapReached(true)
          setFormState({ status: 'idle', message: data.error ?? '' })
          return
        }
        throw new Error(data.error ?? 'Something went wrong. Please try again.')
      }

      const pipelineResult = data as PipelineResponse
      setResult(pipelineResult)
      setFormState({ status: 'idle', message: '' })
      trackAndLog(ANALYTICS_EVENTS.aiPipelineRun, {
        tone,
        usedByok: String(pipelineResult.usedByok),
        remainingFreeRuns: pipelineResult.remainingFreeRuns,
      })
    } catch (err) {
      setFormState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      })
    }
  }

  const isLoading = formState.status === 'loading'

  return (
    <div>
      <AiPipelineTour
        open={tourOpen}
        step={tourStep}
        onStepChange={setTourStep}
        onClose={closeTour}
      />

      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={reopenTour}
          className="text-ds-muted hover:text-ds-accent font-mono text-xs transition-colors"
        >
          How it works
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <Input
          label="Topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          error={topicError}
          disabled={isLoading}
          required
          placeholder="Why your Next.js images are still slow"
        />

        <Input
          label="Keywords"
          value={keywordsInput}
          onChange={(e) => setKeywordsInput(e.target.value)}
          disabled={isLoading}
          placeholder="next/image, lcp, core web vitals"
          hint="Comma-separated, up to 8."
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-ds-text text-[13px] font-medium">Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as PipelineTone)}
              disabled={isLoading}
              className={selectClass}
            >
              {TONE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-ds-text text-[13px] font-medium">Target length</label>
            <select
              value={targetLength}
              onChange={(e) => setTargetLength(Number(e.target.value))}
              disabled={isLoading}
              className={selectClass}
            >
              {LENGTH_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {capReached && (
          <div className="border-ds-accent/30 bg-ds-accent/10 flex flex-col gap-3 rounded-lg border p-4">
            <p className="text-ds-text text-sm">
              {formState.message ||
                "You've used today's free runs. Paste your own Groq API key to keep going."}
            </p>
            <Input
              label="Your Groq API key"
              type="password"
              value={byokKey}
              onChange={(e) => setByokKey(e.target.value)}
              disabled={isLoading}
              placeholder="gsk_..."
              hint="Used only for this request — never stored or logged."
            />
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline text-ds-accent w-fit text-xs"
            >
              Get a free Groq API key →
            </a>
          </div>
        )}

        {formState.status === 'error' && !capReached && (
          <div
            role="alert"
            className="border-ds-error/30 bg-ds-error/10 text-ds-error rounded-lg border px-4 py-3 text-sm"
          >
            {formState.message}
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          loading={isLoading}
          disabled={isLoading}
          className="self-start"
        >
          {isLoading ? 'Generating…' : 'Run the pipeline'}
        </Button>
      </form>

      {result && <AiPipelineResults result={result} />}
    </div>
  )
}
