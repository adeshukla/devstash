import type { Metadata } from 'next'
import { DM_Sans, JetBrains_Mono } from 'next/font/google'
import { siteConfig } from '@/content/metadata/site.config'
import { buildOgImageUrl } from '@/lib/seo/ogImage'
import { Analytics, GtmNoScript } from '@/components/layout/Analytics'
import { AnalyticsClicks } from '@/components/layout/AnalyticsClicks'
import './globals.css'

// Must match components/ui/ThemeToggle.tsx's STORAGE_KEY exactly.
const THEME_STORAGE_KEY = 'devstash-theme'

// Runs before the browser paints anything, so an explicit saved theme that
// differs from the OS preference is applied on the very first paint.
// Deliberately a PLAIN <script> tag below, NOT next/script's <Script
// strategy="beforeInteractive">: that component queues inline script content
// into a self.__next_s array for Next's runtime to process later instead of
// executing it synchronously at parse time — verified by inspecting the
// actual server-rendered HTML, where the "beforeInteractive" Script version
// rendered as `(self.__next_s=self.__next_s||[]).push([0,{children:"..."}])`
// rather than a directly-executing script. That queuing can happen after
// content has already painted, defeating the whole point. A raw script tag
// is parsed and run synchronously exactly where it sits, which is what
// actually prevents the flash.
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var d=t==='light'||t==='dark'?t:(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.setAttribute('data-theme',d)}catch(e){}})()`

const dmSans = DM_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
})

// Default OG/Twitter card for any route that doesn't set its own (notably the
// client-component home page, which cannot export metadata). Uses the dynamic
// /api/og endpoint so the root URL always has a valid social preview.
const defaultOgImage = buildOgImageUrl({
  title: siteConfig.name,
  description: siteConfig.description,
  type: 'website',
})

export const metadata: Metadata = {
  title: { default: siteConfig.title, template: '%s | DevStash' },
  description: siteConfig.description,
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  alternates: {
    canonical: '/',
    types: {
      'application/rss+xml': '/feed.xml',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    images: [
      { url: defaultOgImage, width: 1200, height: 630, alt: siteConfig.name, type: 'image/png' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: siteConfig.twitterHandle,
    creator: siteConfig.twitterHandle,
    title: siteConfig.title,
    description: siteConfig.description,
    images: [{ url: defaultOgImage, alt: siteConfig.name }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
  ...(process.env.BING_SITE_VERIFICATION
    ? { other: { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } }
    : {}),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-ds-bg text-ds-text min-h-screen antialiased" suppressHydrationWarning>
        <script
          id="theme-init"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
        <GtmNoScript />
        {children}
        <Analytics />
        <AnalyticsClicks />
      </body>
    </html>
  )
}
