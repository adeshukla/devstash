'use client'

import { useSyncExternalStore, type ReactNode } from 'react'
import { readConsent, subscribeConsent } from '@/lib/consent'

/** Renders its children only after the visitor has accepted analytics. Used around GA4 and Clarity. */
export function ConsentGate({ children }: { children: ReactNode }) {
  // The server never knows the choice, so it renders nothing; the browser decides after hydration.
  const consent = useSyncExternalStore(subscribeConsent, readConsent, () => 'unset' as const)
  return consent === 'granted' ? <>{children}</> : null
}
