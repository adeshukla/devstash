import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ExitIntentOffer } from '@/components/layout/ExitIntentOffer'
import { SpeedInsights } from '@vercel/speed-insights/next'
import type { ReactNode } from 'react'

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <ExitIntentOffer />
      {/* Inject Speed Insights right before the closing body tag */}
      <SpeedInsights />
    </>
  )
}
