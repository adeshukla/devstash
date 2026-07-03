'use client'

import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui'
import { trackEvent, ANALYTICS_EVENTS } from '@/lib/analytics/events'

interface TourSlide {
  title: string
  body: string
}

const TOUR_SLIDES: TourSlide[] = [
  {
    title: 'Enter a topic',
    body: 'Give it a topic, a few target keywords, a tone, and a target length — same inputs a real content brief would have.',
  },
  {
    title: 'Step 1 — Draft generation',
    body: 'The first LLM call writes a raw draft blog post from your inputs, with real code examples where relevant.',
  },
  {
    title: 'Step 2 — Humanizing pass',
    body: 'A second call rewrites the draft to strip "AI-tell" phrases (“in conclusion”, “leverage”, “delve into”…) and sound like a real developer wrote it.',
  },
  {
    title: 'Step 3 — SEO frontmatter',
    body: 'A third call generates title, slug, description, category, tags, and reading time as JSON — the same frontmatter shape this blog actually uses.',
  },
  {
    title: 'Live metrics',
    body: 'See real token usage and latency for every step, plus how many AI-tell phrases were actually removed.',
  },
]

const TOUR_SEEN_KEY = 'devstash:ai-content-pipeline:tour-seen'

interface AiPipelineTourProps {
  open: boolean
  step: number
  onStepChange: (step: number) => void
  onClose: () => void
}

export function AiPipelineTour({ open, step, onStepChange, onClose }: AiPipelineTourProps) {
  if (!open) return null

  function finish() {
    trackEvent(ANALYTICS_EVENTS.aiPipelineTourCompleted)
    onClose()
  }

  const isLast = step === TOUR_SLIDES.length - 1

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="How the AI content pipeline works"
    >
      <div className="border-ds-border bg-ds-surface relative w-full max-w-md rounded-2xl border p-6">
        <div key={step} className="tour-slide-enter">
          <p className="text-ds-accent mb-2 font-mono text-xs">
            STEP {step + 1} OF {TOUR_SLIDES.length}
          </p>
          <h2 className="text-ds-text mb-2 text-lg font-bold">{TOUR_SLIDES[step].title}</h2>
          <p className="text-ds-muted text-sm leading-relaxed">{TOUR_SLIDES[step].body}</p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          {TOUR_SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to step ${i + 1}`}
              aria-current={i === step ? 'step' : undefined}
              onClick={() => onStepChange(i)}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === step ? 'bg-ds-accent w-4' : 'bg-ds-border w-1.5'
              )}
            />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-ds-muted hover:text-ds-text font-mono text-xs transition-colors"
          >
            Skip
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="ghost" size="sm" onClick={() => onStepChange(step - 1)}>
                Back
              </Button>
            )}
            {!isLast ? (
              <Button size="sm" onClick={() => onStepChange(step + 1)}>
                Next
              </Button>
            ) : (
              <Button size="sm" onClick={finish}>
                Done
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export { TOUR_SEEN_KEY }
