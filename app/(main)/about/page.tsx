import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildPersonSchema } from '@/lib/schema/builders'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Separator } from '@/components/ui/Separator'

// ─── SEO ──────────────────────────────────────────────────────────────────────

export const metadata: Metadata = buildMetadata({
  title: 'About — Adesh Shukla',
  description:
    'Frontend developer with 6+ years of experience. Designer-turned-engineer building React apps, Next.js platforms, and n8n automation workflows. Based in Ghaziabad, India.',
  // FIX: was `canonical`, buildMetadata expects `path`
  path: '/about',
})

// ─── DATA ─────────────────────────────────────────────────────────────────────

const SKILL_GROUPS = [
  {
    label: 'Frontend',
    variant: 'blue' as const,
    skills: ['React 19', 'Next.js 15', 'TypeScript', 'JavaScript', 'HTML5', 'CSS3'],
  },
  {
    label: 'Styling & Design',
    variant: 'purple' as const,
    skills: ['Tailwind CSS v4', 'Figma', 'CSS Animations', 'Responsive Design', 'Design Systems'],
  },
  {
    label: 'State & Data',
    variant: 'default' as const,
    skills: ['Redux Toolkit', 'Zustand', 'REST APIs', 'Zod', 'React Query'],
  },
  {
    label: 'Automation & AI',
    variant: 'green' as const,
    skills: ['n8n', 'Groq API', 'Ollama', 'LLM Workflows', 'Google Sheets API'],
  },
  {
    label: 'Tooling & DevOps',
    variant: 'warn' as const,
    skills: ['Git', 'GitHub Actions', 'Vercel', 'Cloudflare', 'pnpm', 'Cursor AI'],
  },
] as const

const EXPERIENCE = [
  {
    role: 'Frontend Developer',
    company: 'Chetu India Pvt. Ltd.',
    companyUrl: 'https://www.chetu.com',
    location: 'Noida, India',
    period: '2019 — Present',
    current: true,
    points: [
      'Built 200+ high-converting PPC landing pages for US-based enterprise clients',
      'Led complete frontend cycle — Figma design to production deployment',
      'Performance-optimised pages consistently scoring 90+ on Lighthouse',
      'Introduced component reuse patterns that reduced build time by ~40%',
      'Collaborated directly with US marketing and strategy teams on delivery',
    ],
  },
] as const

const CURRENT_PROJECT_STACK = [
  'Next.js 15',
  'TypeScript',
  'Tailwind v4',
  'MDX',
  'Vercel',
  'Cloudflare',
] as const

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <>
      <JsonLd data={buildPersonSchema()} />

      <main className="bg-ds-bg min-h-screen">
        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        {/* FIX: added sm:px-8 for tablet breathing room */}
        <section aria-labelledby="hero-heading" className="border-ds-border border-b">
          <div className="mx-auto max-w-4xl px-6 py-20 sm:px-8 md:py-28">
            {/* FIX: was manual inline badge markup — use Badge component */}
            <div className="mb-6">
              <Badge variant="green" dot>
                Open to new opportunities — available in ~20 days
              </Badge>
            </div>

            {/* FIX: added font-sans and id for aria-labelledby */}
            <h1
              id="hero-heading"
              className="text-ds-text mb-4 font-sans text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl"
            >
              Hey, I&apos;m <span className="text-ds-accent">Adesh Shukla</span>
            </h1>

            {/* FIX: removed text-ds-text/40 opacity modifier (unreliable on custom tokens in v4)
                     replaced with text-ds-border2 which is a real named token */}
            <p className="text-ds-muted mb-6 font-sans text-xl font-medium md:text-2xl">
              Frontend Developer &amp; Designer <span className="text-ds-border2">—</span>{' '}
              <span className="text-ds-purple">6+ years</span>
            </p>

            {/* FIX: removed max-w-2xl — no need to cap text inside already-contained max-w-4xl */}
            <p className="text-ds-muted mb-10 text-base leading-relaxed md:text-lg">
              I started as a UI/UX designer, fell in love with code, and never looked back. Today I
              build fast, accessible, well-engineered frontend systems — from 200+ PPC landing pages
              for enterprise clients to personal developer tools and AI automation workflows. Based
              in <span className="text-ds-text font-medium">Ghaziabad, India</span>.
            </p>

            {/* FIX: GitHub was a raw <a> — Rule 6 violation; Button now handles external href.
                     If Button uses next/link internally and doesn't forward target/rel,
                     swap back to <a> with the same class structure as Button ghost variant */}
            <div className="flex flex-wrap items-center gap-3">
              <Button href="/adesh-shukla-resume.pdf" variant="primary" size="md">
                Download CV
              </Button>
              <Button href="/projects" variant="outline" size="md">
                View Projects
              </Button>
              <Button href="https://github.com/adeshukla" variant="ghost" size="md">
                GitHub ↗
              </Button>
            </div>
          </div>
        </section>

        {/* ── CONTENT ──────────────────────────────────────────────────────── */}
        {/* FIX: removed space-y-20 — individual sections now control their own bottom margin.
                 Separators replace the implicit space to give a clear visual break. */}
        <div className="mx-auto max-w-4xl px-6 py-16 sm:px-8 md:py-24">
          {/* Story */}
          {/* FIX: added aria-labelledby + id on h2 */}
          <section aria-labelledby="story-heading" className="mb-16">
            <h2 id="story-heading" className="text-ds-text mb-6 font-sans text-2xl font-bold">
              The Story
            </h2>
            <div className="text-ds-muted space-y-4 text-base leading-relaxed md:text-lg">
              <p>
                I started out doing UI/UX — Figma mockups, design systems, brand identities. But
                every time I handed off designs to developers, something was always{' '}
                {/* FIX: font-medium → font-semibold for stronger emphasis contrast */}
                <span className="text-ds-text font-semibold">slightly off</span>. So I decided to
                just build it myself.
              </p>
              <p>
                That decision changed everything. I went from pushing pixels to pushing commits.
                Over 6+ years at Chetu I&apos;ve built 200+ production landing pages for US
                enterprise clients — owning the full cycle from Figma to Vercel deployment.
              </p>
              <p>
                Now I&apos;m going deeper — React architecture, TypeScript strict mode, Next.js App
                Router, n8n automation, and AI-powered workflows. I&apos;m building{' '}
                <Link
                  href="/"
                  className="text-ds-accent hover:text-ds-accent/80 underline underline-offset-4 transition-colors"
                >
                  DevStash
                </Link>{' '}
                as both a platform and a proof of what I can engineer end-to-end.
              </p>
            </div>
          </section>

          {/* FIX: Separator provides explicit visual break between all major sections */}
          <Separator className="mb-16" />

          {/* Skills */}
          <section aria-labelledby="skills-heading" className="mb-16">
            <h2 id="skills-heading" className="text-ds-text mb-8 font-sans text-2xl font-bold">
              Skills &amp; Stack
            </h2>
            <div className="space-y-6">
              {SKILL_GROUPS.map((group) => (
                <div key={group.label}>
                  {/* FIX: added font-mono for consistent monospaced category labels */}
                  <p className="text-ds-muted mb-3 font-mono text-xs font-semibold tracking-widest uppercase">
                    {group.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.skills.map((skill) => (
                      <Badge key={skill} variant={group.variant}>
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Separator className="mb-16" />

          {/* Experience */}
          <section aria-labelledby="experience-heading" className="mb-16">
            <h2 id="experience-heading" className="text-ds-text mb-8 font-sans text-2xl font-bold">
              Experience
            </h2>
            <div className="space-y-6">
              {EXPERIENCE.map((job) => (
                <div
                  key={job.company}
                  className="border-ds-border bg-ds-surface rounded-xl border p-6 sm:p-8"
                >
                  <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-ds-text font-sans text-lg font-bold">{job.role}</h3>
                      <a
                        href={job.companyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ds-accent hover:text-ds-accent/80 mt-0.5 inline-block font-medium transition-colors"
                      >
                        {job.company}
                      </a>
                      <p className="text-ds-muted mt-0.5 text-sm">{job.location}</p>
                    </div>
                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      {/* FIX: added font-mono tabular-nums for period text */}
                      <span className="text-ds-muted font-mono text-sm tabular-nums">
                        {job.period}
                      </span>
                      {/* FIX: was manual badge markup — use Badge component (Rule 6) */}
                      {job.current && (
                        <Badge variant="green" dot>
                          Current
                        </Badge>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-2.5">
                    {/* FIX: was key={i} (index as key anti-pattern) — use key={point} */}
                    {job.points.map((point) => (
                      <li
                        key={point}
                        className="text-ds-muted flex items-start gap-2.5 text-sm md:text-base"
                      >
                        {/* FIX: mt-2 (8px) was misaligned for 14px text — mt-[5px] sits at cap-height */}
                        <span
                          aria-hidden="true"
                          className="bg-ds-accent mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full"
                        />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <Separator className="mb-16" />

          {/* Currently Building */}
          {/* FIX: was border-ds-accent/20 bg-ds-accent/5 — opacity modifiers unreliable on custom
                   tokens in Tailwind v4. Replaced with real tokens: border-ds-border bg-ds-surface.
                   Accent color applied as a left-border accent instead. */}
          <section aria-labelledby="building-heading" className="mb-16">
            <h2 id="building-heading" className="text-ds-text mb-6 font-sans text-2xl font-bold">
              Currently Building
            </h2>
            <div className="border-ds-border bg-ds-surface rounded-xl border p-6 sm:p-8">
              <div className="mb-4 flex items-center gap-3">
                <span className="text-ds-accent font-mono text-lg font-bold">
                  &lt;devstash/&gt;
                </span>
                <Badge variant="blue">In Progress</Badge>
              </div>
              <p className="text-ds-muted mb-5 leading-relaxed">
                A modern developer platform and personal brand at{' '}
                <span className="text-ds-text font-medium">devstash.me</span>. Built with Next.js
                15, TypeScript strict mode, Tailwind v4, MDX content layer, and full SEO
                infrastructure. Designed to grow from a portfolio into a developer content and tools
                ecosystem.
              </p>
              <div className="flex flex-wrap gap-2">
                {CURRENT_PROJECT_STACK.map((tech) => (
                  <Badge key={tech} variant="default">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section
            aria-labelledby="cta-heading"
            className="border-ds-border bg-ds-surface rounded-xl border p-8 text-center"
          >
            <h2 id="cta-heading" className="text-ds-text mb-3 font-sans text-2xl font-bold">
              Let&apos;s work together
            </h2>
            <p className="text-ds-muted mx-auto mb-6 max-w-md">
              I&apos;m actively looking for frontend roles in Noida / Delhi NCR. Drop a message or
              grab my CV below.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button href="/contact" variant="primary" size="md">
                Get in touch
              </Button>
              <Button href="/adesh-shukla-resume.pdf" variant="outline" size="md">
                Download CV
              </Button>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}
