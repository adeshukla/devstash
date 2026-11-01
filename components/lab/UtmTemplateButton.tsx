'use client'

import { Button } from '@/components/ui'
import { toCsv, type SheetRow } from '@/lib/lab/utm'

const row = (
  id: string,
  url: string,
  source: string,
  medium: string,
  campaign: string,
  term = '',
  content = ''
): SheetRow => ({
  id,
  url: `${url}?utm_source=${source}&utm_medium=${medium}&utm_campaign=${campaign}`,
  fields: { url, source, medium, campaign, term, content },
})

/** A starter sheet with the same columns the builder exports, plus three example rows. */
export function UtmTemplateButton() {
  function download() {
    const blob = new Blob(
      [
        toCsv([
          row('1', 'https://example.com/spring', 'google', 'cpc', 'spring-sale-2026-03'),
          row('2', 'https://example.com/spring', 'newsletter', 'email', 'spring-sale-2026-03'),
          row('3', 'https://example.com/spring', 'linkedin', 'social', 'spring-sale-2026-03'),
        ]),
      ],
      { type: 'text/csv' }
    )
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'utm-naming-template.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(a.href)
  }
  return (
    <Button type="button" variant="outline" size="sm" onClick={download}>
      Download the template (CSV)
    </Button>
  )
}
