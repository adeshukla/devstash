// content/metadata/site.config.ts

export const siteConfig = {
  name: 'DevStash',
  domain: 'devstash.me',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  title: 'DevStash — Modern Developer Ecosystem',
  description:
    'A modern developer ecosystem showcasing engineering, automation, AI workflows, frontend systems, and developer resources.',
  // Dynamic, branded default OG card (edge route). No static /og/default.png
  // exists — every page builds its own via buildOgImageUrl(), so this is only
  // a last-resort fallback and must point at something that actually resolves.
  ogImage: '/api/og',
  twitterHandle: '@devstash_me',
  author: {
    name: 'Adesh Shukla',
    email: 'hello@devstash.me',
    github: 'https://github.com/adeshukla',
    linkedin: 'https://www.linkedin.com/in/adeshukla',
    x: 'https://x.com/adeshukla',
  },
} as const

export type SiteConfig = typeof siteConfig
