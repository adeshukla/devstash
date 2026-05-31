import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'DevStash — Coming Soon',
  description:
    'A modern developer ecosystem showcasing engineering, automation, AI workflows, and frontend systems.',
  openGraph: {
    title: 'DevStash — Coming Soon',
    description: 'A modern developer ecosystem for engineering, automation, and AI workflows.',
    url: 'https://devstash.me',
    siteName: 'DevStash',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-[#0B0F19] text-[#F3F4F6] antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
