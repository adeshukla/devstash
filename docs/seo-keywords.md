# SEO keywords and discoverability plan

Written 2026-10-29. This is judgement, not tool data: no keyword-volume tool
(Ahrefs, Search Console exports) was available when it was written. Check
Search Console → Performance after 4–6 weeks and replace guesses with real queries.

## Principle

A new site with no backlinks cannot win broad terms ("frontend developer",
"interview prep"). It can win **specific, low-competition phrases** where the page
is the best answer on the web. Target those first.

## Where each page can realistically rank

| Page               | Primary phrase                                                                                           | Why it is winnable                                                                |
| ------------------ | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Home               | `Adesh Shukla UI developer`                                                                              | Your name: nobody else competes for it                                            |
| Home / About       | `UI developer Ghaziabad`, `frontend developer Ghaziabad`                                                 | Local, low volume, few strong pages                                               |
| Services           | `freelance frontend developer India`, `PPC landing page developer India`                                 | Specific niche, 200+ landing pages is a real differentiator                       |
| Lab: UTM builder   | `UTM builder`, `campaign URL builder free`                                                               | Many tools, but yours preserves existing params and flags a missing `utm_` prefix |
| Lab: meta tag tool | `meta tag generator with google preview`                                                                 | Long-tail beats `meta tag generator`                                              |
| Lab: CSS tool      | `cubic-bezier editor`, `css shapes generator`                                                            | Tools that rank are single-purpose; yours bundles several                         |
| Lab: illustration  | `free svg illustration generator animated`                                                               | Honest wording: it is procedural, not AI, so it is NOT titled "AI"                |
| Pare (subdomain)   | `compress images in browser no upload`, `convert to avif webp offline`                                   | Strong differentiator: no upload, WebAssembly                                     |
| Blog (error posts) | `tailwind v4 classes not working`, `next.js 16 params undefined`, `usesearchparams suspense build error` | People paste the exact error. These are your fastest wins                         |

## What was changed in code (2026-10-29)

- `robots.txt` no longer blocks `/_next/`. Googlebot needs the JS and CSS there
  to render pages; blocking it can stop pages being understood.
- 19 blog posts had search titles over 60 characters (they were cut off in
  results). Each now has a `seoTitle` of 49 characters or fewer; the H1 is unchanged.
  `pnpm lint:content` warns on any new post that needs one.
- Home, Services and two Lab titles/descriptions shortened to fit and aimed at the
  phrases above. The illustration tool no longer says "AI" in its title.
- Services priority raised in the sitemap (it is a money page).

## Legitimate ways to speed up discovery (do these)

1. **Search Console: add every subdomain as its own property** and submit its
   sitemap (praxis, pare, build-components, showcase). Request indexing for the
   home page and each case study.
2. **Bing Webmaster Tools:** import from Search Console. IndexNow is already live.
3. **Backlinks, in order of effort:** GitHub README links and profile
   (`docs/launch-posts.md`), dev.to / Hashnode posts with `canonical` set to the
   devstash.me URL, one Show HN for Pare, LinkedIn posts linking the case studies.
4. **Answer real questions:** a Stack Overflow or Reddit answer to the exact errors
   your blog posts solve, linking the post where it genuinely helps.
5. **Profile consistency:** same name, role and `devstash.me` link on LinkedIn,
   GitHub, X, dev.to. The Person schema already lists these as `sameAs`.
6. **Freshness:** update `updatedAt` only when a post really changes. The sitemap
   uses it as `lastmod`, and Google stops trusting it if it is wrong.

## What not to do

No keyword stuffing, no bought links, no private blog networks, no fake reviews or
testimonials (RULE 5), no hidden text. They get sites penalised and the site's
whole pitch is that it is honest.

## Measure

| Check                 | When                   | Where                        |
| --------------------- | ---------------------- | ---------------------------- |
| Pages indexed         | weekly for 6 weeks     | Search Console → Pages       |
| Queries and positions | after 4–6 weeks        | Search Console → Performance |
| New referring domains | after each launch post | Search Console → Links       |
