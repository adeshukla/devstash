import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'

// Client-only behaviour, nothing above the fold: own chunk, hydrated after the
// page (see the note in components/layout/Footer.tsx).
const ExitIntentOffer = dynamic(() =>
  import('@/components/layout/ExitIntentOffer').then((m) => m.ExitIntentOffer)
)
import { SpeedInsights } from '@vercel/speed-insights/next'
import type { ReactNode } from 'react'

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <Suspense>
        <ExitIntentOffer />
      </Suspense>
      {/* Inject Speed Insights right before the closing body tag */}
      <SpeedInsights />
    </>
  )
}
