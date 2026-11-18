'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui'
import { TOURS } from '@/lib/lab/tours'
import { OgTour, type TourStep } from './OgTour'
import { resolveClickable } from './tourTarget'
import { trackLab } from './track'

/**
 * "Take a 1-minute tour" for a tool. It opens only when asked for, walks through the page one
 * part at a time, and gives focus back to the button when it closes.
 */
export function LabTour({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const data = TOURS[slug]
  if (!data) return null

  const steps: TourStep[] = data.map((s) => ({
    target: s.target,
    title: s.title,
    body: s.body,
    action: s.click
      ? { label: s.click.label, run: () => resolveClickable(s.click!.target)?.click() }
      : undefined,
  }))

  return (
    <>
      <div ref={wrap} className="mt-5 flex justify-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            trackLab(slug, 'tour_open')
            setOpen(true)
          }}
        >
          Take a 1-minute tour
        </Button>
      </div>
      {open && (
        <OgTour
          steps={steps}
          onClose={() => {
            setOpen(false)
            wrap.current?.querySelector('button')?.focus()
          }}
        />
      )}
    </>
  )
}
