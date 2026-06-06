# DevStash — AI Context File

## Project

- Name: DevStash (devstash.me)
- Stack: Next.js 15 App Router, TypeScript, Tailwind CSS v4, pnpm
- Developer: Adesh Shukla, Ghaziabad
- Status: Phase 2 complete, starting Phase 3

## Critical Rules

- Tailwind v4: tokens in globals.css @theme block (NOT tailwind.config.ts)
- Package manager: pnpm ONLY (never npm/yarn)
- ESLint: deferred — only Prettier via lint-staged
- suppressHydrationWarning on body (Grammarly/Dark Reader extensions)

## Completed Phases

- Phase 0: Scaffold, GitHub, Vercel, env setup, Prettier+Husky
- Phase 1: Tailwind v4 tokens, DM Sans+JetBrains Mono fonts, site.config.ts, buildMetadata.ts, CI pipeline
- Phase 2: Button, Card, Badge, Input, Separator, Skeleton, Navbar, MobileNav, Footer, Breadcrumb, JsonLd, Schema builders, OG image API, Route groups

## Route Structure

- app/(standalone)/page.tsx → Coming Soon (no navbar)
- app/(main)/layout.tsx → Navbar + Footer wrapper
- app/(main)/preview/ → Component preview (delete before launch)

## Known Issues Fixed

- CRLF: git config --global core.autocrlf true
- Turbopack: removed --turbopack flag, using webpack
- Hydration: suppressHydrationWarning on body

## Next: Phase 3

- TypeScript types: BlogPost, Project
- MDX pipeline: gray-matter, rehype-slug, rehype-pretty-code
- lib/markdown/blog.ts + projects.ts
- app/sitemap.ts + robots.ts

## Environment Variables

- NEXT_PUBLIC_SITE_URL
- NEXT_PUBLIC_GA_ID
- RESEND_API_KEY
- GOOGLE_SITE_VERIFICATION

## Key Decisions

- Blog at /blog subfolder (never subdomain)
- File-based content (MDX/JSON) → CMS-ready data layer
- Server Components default, Client only when needed
