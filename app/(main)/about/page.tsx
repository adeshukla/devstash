import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { buildOgImageUrl } from '@/lib/seo/ogImage'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildPersonSchema } from '@/lib/schema/builders'
import { siteConfig } from '@/content/metadata/site.config'
import { stack } from '@/lib/site/stack'
import { Badge, Button, Reveal } from '@/components/ui'
import { Icon } from '@/components/icons/Icon'

const title = 'About Adesh Shukla — Frontend Developer'
const description =
  'Frontend developer with 6+ years across React, Next.js, and UI systems. A designer-turned-developer based in Ghaziabad, NCR, now open to frontend roles.'

export const metadata: Metadata = buildMetadata({
  title,
  description,
  canonical: '/about',
  ogImage: buildOgImageUrl({ title, description, type: 'website' }),
  // ogType 'profile' removed — MetadataOptions only supports 'website' | 'article'
})

// ─── Static data ──────────────────────────────────────────────────────────────

const SKILLS: Record<string, string[]> = {
  Frontend: [stack.react, stack.next, stack.typescript, stack.tailwind, 'Redux Toolkit'],
  Tooling: ['Vite', 'pnpm', 'Webpack', 'Husky', 'Prettier'],
  Automation: ['n8n', 'Groq API', 'Ollama', 'Google Sheets API', 'Resend'],
  Design: ['Figma', 'UI/UX Design', 'Design Systems', 'Tailwind UI'],
  Backend: ['Node.js', 'Next.js API Routes', 'Firebase Auth', 'REST APIs'],
}

const TIMELINE = [
  {
    year: 'Jul 2021 – Present',
    role: 'Frontend Developer',
    company: 'Chetu India Pvt. Ltd.',
    desc: 'Building 200+ high-conversion PPC landing pages for US-based clients. Internal marketing web team.',
  },
  {
    year: 'Jul 2020 – Jun 2021',
    role: 'Frontend Developer',
    company: 'IS Global',
    desc: 'General frontend development — building and maintaining websites and UIs with HTML, CSS, JavaScript, and React.',
  },
]

const CURRENTLY = [
  '🔨 Building DevStash — personal developer ecosystem',
  `📚 Deep-diving into ${stack.next} App Router & RSC patterns`,
  '🤖 Automating workflows with n8n and local LLMs (Ollama)',
  '🔍 Open to frontend roles · Noida / Delhi NCR · immediate–20 days notice',
  // TODO: Keep this section updated
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <>
      <JsonLd data={buildPersonSchema()} />

      <main>
        {/* ── Hero ── */}
        <section className="border-ds-border border-b py-20">
          <div className="mx-auto max-w-4xl px-6">
            <p className="text-ds-accent mb-3 font-mono text-sm">{'// about'}</p>
            <h1 className="text-ds-text text-4xl font-bold tracking-tight sm:text-5xl">
              {/* TODO: Finalise headline */}
              Hey, I&apos;m Adesh.
            </h1>
            <div className="text-ds-muted mt-6 flex max-w-2xl flex-col gap-4 text-lg leading-relaxed">
              {/* TODO: Update bio with final copy */}
              <p>
                Frontend developer with a designer&apos;s eye and an automation enthusiast&apos;s
                brain. I&apos;ve been building for the web for 6+ years — from Figma mockups to
                deployed, performant Next.js apps.
              </p>
              <p>
                Currently at Chetu India building landing pages for US clients. Also building{' '}
                <span className="text-ds-accent">DevStash</span> — a personal platform that&apos;s
                more developer ecosystem than portfolio.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/projects">See my work</Button>
              <Button href="/contact" variant="outline">
                Let&apos;s connect
              </Button>
              <a
                href="/resume-adesh-shukla.pdf"
                download
                data-analytics-event="cv_viewed"
                className="border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent focus-visible:ring-ds-accent focus-visible:ring-offset-ds-bg inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-5 text-[14px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                Download résumé
                <Icon name="download" className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* ── Skills ── */}
        <section className="py-16">
          <Reveal className="mx-auto max-w-4xl px-6">
            <h2 className="text-ds-text mb-8 text-2xl font-bold">Tech I use</h2>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(SKILLS).map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-ds-accent mb-3 font-mono text-sm font-medium">{category}</h3>
                  <div className="flex flex-wrap gap-2">
                    {items.map((skill) => (
                      <Badge key={skill} variant="default">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ── Experience timeline ── */}
        <section className="border-ds-border border-t py-16">
          <Reveal className="mx-auto max-w-4xl px-6">
            <h2 className="text-ds-text mb-10 text-2xl font-bold">Experience</h2>
            <ol className="flex flex-col gap-0">
              {TIMELINE.map((item, i) => (
                <li key={item.company} className="flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className="bg-ds-accent ring-ds-bg mt-1 h-3 w-3 shrink-0 rounded-full ring-4" />
                    {i < TIMELINE.length - 1 && <div className="bg-ds-border mt-1 w-px flex-1" />}
                  </div>
                  <div className="pb-10">
                    <p className="text-ds-muted font-mono text-xs">{item.year}</p>
                    <h3 className="text-ds-text mt-1 font-semibold">{item.role}</h3>
                    <p className="text-ds-accent text-sm">{item.company}</p>
                    <p className="text-ds-muted mt-2 text-sm">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
        </section>

        {/* ── Currently ── */}
        <section className="border-ds-border border-t py-16">
          <Reveal className="mx-auto max-w-4xl px-6">
            <h2 className="text-ds-text mb-6 text-2xl font-bold">Currently</h2>
            <ul className="flex flex-col gap-3">
              {CURRENTLY.map((item) => (
                <li key={item} className="text-ds-muted">
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </section>

        {/* ── CTA strip ── */}
        <section className="border-ds-border bg-ds-surface border-t py-16">
          <Reveal className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="text-ds-text text-2xl font-bold">Want to work together?</h2>
            <p className="text-ds-muted mt-3">
              I&apos;m open to frontend roles and freelance collabs. Drop me a line.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Button href="/contact" size="lg">
                Contact me
              </Button>
              <a
                href="/resume-adesh-shukla.pdf"
                download
                data-analytics-event="cv_viewed"
                className="border-ds-accent text-ds-accent hover:bg-ds-accent focus-visible:ring-ds-accent focus-visible:ring-offset-ds-bg inline-flex h-12 items-center justify-center gap-2.5 rounded-xl border px-6 text-[15px] font-medium transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                Download résumé
                <Icon name="download" className="h-4 w-4" />
              </a>
              <Button href={siteConfig.author.github} variant="ghost" size="lg">
                GitHub →
              </Button>
            </div>
          </Reveal>
        </section>
      </main>
    </>
  )
}
