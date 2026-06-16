# Adesh Shukla — Résumé (source)

> **This is the editable source for your résumé.** It uses only verified
> information from the site (with `TODO:` markers where I don't have the data —
> fill those before exporting). To produce the PDF served at
> `/resume-adesh-shukla.pdf`, see **[How to export to PDF](#how-to-export-to-pdf)**
> at the bottom, then replace `public/resume-adesh-shukla.pdf`.

---

# Adesh Shukla

**Frontend Developer** · React · Next.js · TypeScript · Automation

Ghaziabad, UP, India · Open to Noida / Delhi NCR & Remote
[hello@devstash.me](mailto:hello@devstash.me) ·
Portfolio: [devstash.me](https://devstash.me) ·
GitHub: [github.com/adeshukla](https://github.com/adeshukla) ·
LinkedIn: [linkedin.com/in/adeshukla](https://www.linkedin.com/in/adeshukla)

<!-- TODO: add phone number if you want it on the résumé -->

---

## Summary

Frontend developer with a designer's eye and 6+ years building for the web —
from Figma mockups to deployed, performant Next.js applications. I turn designs
into high-performance, SEO-ready products and automate the repetitive parts of
the workflow (content pipelines, CI quality gates, AI workflows). Currently
building **DevStash** (devstash.me), a developer ecosystem covering engineering,
automation, and AI workflows.

---

## Skills

- **Frontend:** React, Next.js 16 (App Router, RSC), TypeScript (strict),
  Tailwind CSS v4, Redux Toolkit
- **Tooling & DevOps:** Vite, pnpm, Webpack, Husky, Prettier, GitHub Actions
  (CI: type-check, build, Lighthouse), Vercel
- **Automation & AI:** n8n, Groq API, Ollama (local LLMs), Google Sheets API,
  Resend
- **Backend & Data:** Node.js, Next.js API Routes, Firebase Auth, REST APIs
- **Design:** Figma, UI/UX, design systems, design tokens
- **SEO & Web Perf:** structured data (JSON-LD), dynamic OG images, Core Web
  Vitals, Lighthouse 90+

---

## Experience

### Frontend Developer — Chetu India Pvt. Ltd.

_2024 – Present · Internal marketing web team_

- Build high-conversion PPC landing pages (200+) for US-based clients.
- <!-- TODO: add 2–3 measurable achievements, e.g. "Improved LCP from X to Ys",
  "Increased conversion by N%", "Reduced build time / page weight by N%". -->

<!-- TODO: Add earlier roles to cover the full 6+ years (company, title, dates,
2–3 bullet points each). The site only documents the role above. -->

---

## Selected Projects

### DevStash — Developer Ecosystem & Personal Platform

_[devstash.me](https://devstash.me) · [source](https://github.com/adeshukla)_

- Built a content-driven developer platform with **Next.js 16 App Router**,
  TypeScript (strict), and **Tailwind CSS v4** design tokens.
- File-based MDX blog pipeline (`next-mdx-remote`, gray-matter) with a
  local-only admin (auth, post create/edit/delete, image upload).
- **SEO-first:** per-page metadata, canonical URLs, JSON-LD, and a dynamic
  `next/og` image endpoint; GA4 + GTM analytics with custom event tracking.
- **Automation:** MDX frontmatter linter, broken-link checker, and Lighthouse CI
  wired into pre-commit + GitHub Actions.

### Netflix GPT — AI-Powered Netflix Clone

_[netflix-gpt.vercel.app](https://netflix-gpt.vercel.app) · [source](https://github.com/adeshukla/netflix-gpt)_

- Full-stack Netflix clone with **React, Vite, Redux Toolkit, and Firebase
  Auth** (email/password, persistent sessions).
- Integrated **Google Gemini API** for a GPT search feature — natural-language /
  mood prompts return real movie recommendations.
- Fully responsive (mobile → 4K); GitHub Actions CI/CD (type-check + build on
  every PR).

---

## Education

<!-- TODO: Add degree, institution, and year. -->

---

## Links

- Portfolio: https://devstash.me
- GitHub: https://github.com/adeshukla
- LinkedIn: https://www.linkedin.com/in/adeshukla
- Email: hello@devstash.me

---

## How to export to PDF

Pick whichever is easiest — the file the site serves is
`public/resume-adesh-shukla.pdf`:

1. **Fill in the `TODO:` items above** (phone optional, achievements, earlier
   roles, education). Don't ship a résumé with TODOs in it.
2. **Generate the PDF** from this markdown using any of:
   - VS Code extension "Markdown PDF" → right-click → _Markdown PDF: Export
     (pdf)_.
   - Paste into a résumé builder (e.g. Reactive Resume, FlowCV, or even Google
     Docs) and **Print → Save as PDF** for nicer typography.
   - `md-to-pdf` / `pandoc` if you have them locally.
3. **Replace** `public/resume-adesh-shukla.pdf` with the exported file (keep the
   exact filename — the nav/about "Download résumé" buttons link to it).
4. Commit + push.

> Why not auto-generate the PDF here? A résumé PDF is a binary with layout/typography
> that's best controlled by you (and the source still has TODOs only you can
> fill). This markdown is the single source you edit; export when it's final.
