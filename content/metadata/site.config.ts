// content/metadata/site.config.ts

export const siteConfig = {
  name: 'DevStash',
  domain: 'devstash.me',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  title: 'DevStash — Modern Developer Ecosystem',
  description:
    'A modern developer ecosystem showcasing engineering, automation, AI workflows, frontend systems, and developer resources.',
  ogImage: '/og/default.png',
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
