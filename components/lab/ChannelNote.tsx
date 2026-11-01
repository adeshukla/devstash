import { ga4Channel } from '@/lib/lab/utm'

/**
 * One line under a link: which GA4 channel its source and medium land in.
 * Unassigned gets the warning colour because it is the usual reason campaign
 * traffic goes missing from reports.
 */
export function ChannelNote({ source, medium }: { source: string; medium: string }) {
  const channel = ga4Channel(source, medium)
  if (!channel) return null
  const lost = channel === 'Unassigned'
  return (
    <p className={`mt-1.5 text-sm ${lost ? 'text-ds-warning-strong' : 'text-ds-muted'}`}>
      GA4 channel: <strong className="font-semibold">{channel}</strong>
      {lost && ' — not recognised. Use a standard type of traffic such as cpc, email or social.'}
    </p>
  )
}
