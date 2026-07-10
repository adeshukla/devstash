import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { buildOgImageUrl } from '@/lib/seo/ogImage'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildPersonSchema } from '@/lib/schema/builders'
import { siteConfig } from '@/content/metadata/site.config'
import { stack } from '@/lib/site/stack'
import { Badge, Button, Reveal, MouseParallax } from '@/components/ui'
import { Icon } from '@/components/icons/Icon'
import { CategoryIllustration } from '@/components/illustrations/CategoryIllustration'

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
          <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 px-6 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
            <div>
              <p className="text-ds-accent mb-3 font-mono text-sm">{'// about'}</p>
              <h1 className="text-ds-text text-4xl font-bold tracking-tight sm:text-5xl">
                Hey, I&apos;m Adesh.
              </h1>
              <div className="text-ds-muted mt-6 flex max-w-2xl flex-col gap-4 text-lg leading-relaxed">
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
                <Button
                  href="/resume-adesh-shukla.pdf"
                  download
                  data-analytics-event="cv_viewed"
                  variant="ghost"
                  iconRight={<Icon name="download" className="h-4 w-4" />}
                >
                  Download résumé
                </Button>
              </div>
            </div>

            <MouseParallax strength={12} className="mx-auto w-full max-w-sm lg:mx-0">
              <div className="border-ds-border bg-ds-surface2 aspect-[4/3] overflow-hidden rounded-2xl border">
                <CategoryIllustration category="frontend" kind="blog" seed="about-hero" />
              </div>
            </MouseParallax>
          </div>
        </section>

        {/* ── Skills ── */}
        <section className="py-16">
          <div className="mx-auto max-w-4xl px-6">
            <Reveal>
              <h2 className="text-ds-text mb-8 flex items-baseline gap-3 text-2xl font-bold">
                <span className="text-ds-accent font-mono text-base font-normal">01 —</span>
                Tech I use
              </h2>
            </Reveal>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(SKILLS).map(([category, items], i) => (
                <Reveal key={category} delay={i * 60}>
                  <div>
                    <h3 className="text-ds-accent mb-3 font-mono text-sm font-medium">
                      {category}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {items.map((skill) => (
                        <Badge key={skill} variant="default">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Experience timeline ── */}
        <section className="border-ds-border border-t py-16">
          <div className="mx-auto max-w-4xl px-6">
            <Reveal>
              <h2 className="text-ds-text mb-10 flex items-baseline gap-3 text-2xl font-bold">
                <span className="text-ds-accent font-mono text-base font-normal">02 —</span>
                Experience
              </h2>
            </Reveal>
            <ol className="flex flex-col gap-0">
              {TIMELINE.map((item, i) => (
                <Reveal key={item.company} delay={i * 80}>
                  <li className="group flex gap-6">
                    <div className="flex flex-col items-center">
                      <div className="bg-ds-accent ring-ds-bg mt-1 h-3 w-3 shrink-0 rounded-full ring-4 transition-transform group-hover:scale-125" />
                      {i < TIMELINE.length - 1 && <div className="bg-ds-border mt-1 w-px flex-1" />}
                    </div>
                    <div className="border-ds-border hover:border-ds-accent hover:bg-ds-surface -ml-px flex-1 rounded-lg border-l-2 py-1 pb-10 pl-4 transition-colors">
                      <p className="text-ds-muted font-mono text-xs">{item.year}</p>
                      <h3 className="text-ds-text mt-1 font-semibold">{item.role}</h3>
                      <p className="text-ds-accent text-sm">{item.company}</p>
                      <p className="text-ds-muted mt-2 text-sm">{item.desc}</p>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Currently ── */}
        <section className="border-ds-border border-t py-16">
          <div className="mx-auto max-w-4xl px-6">
            <Reveal>
              <h2 className="text-ds-text mb-6 flex items-baseline gap-3 text-2xl font-bold">
                <span className="text-ds-accent font-mono text-base font-normal">03 —</span>
                Currently
              </h2>
            </Reveal>
            <ul className="flex flex-col gap-3">
              {CURRENTLY.map((item, i) => (
                <Reveal key={item} delay={i * 60}>
                  <li className="text-ds-muted">{item}</li>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* ── CTA strip ── */}
        <section className="border-ds-border bg-ds-surface border-t py-16">
          <Reveal className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="text-ds-text flex items-baseline justify-center gap-3 text-2xl font-bold">
              <span className="text-ds-accent font-mono text-base font-normal">04 —</span>
              Want to work together?
            </h2>
            <p className="text-ds-muted mt-3">
              I&apos;m open to frontend roles and freelance collabs. Drop me a line.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Button href="/contact" size="lg">
                Contact me
              </Button>
              <Button
                href="/resume-adesh-shukla.pdf"
                download
                data-analytics-event="cv_viewed"
                variant="outline"
                size="lg"
                iconRight={<Icon name="download" className="h-4 w-4" />}
              >
                Download résumé
              </Button>
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
