import { H1_DISPLAY } from '@/lib/utils/typography'
import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { buildOgImageUrl } from '@/lib/seo/ogImage'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildIntroVideoSchema, buildPersonSchema } from '@/lib/schema/builders'
import { siteConfig } from '@/content/metadata/site.config'
import { stack } from '@/lib/site/stack'
import { Badge, Button, Reveal, AboutProfileCard } from '@/components/ui'
import { PageFacts } from '@/components/ui/PageFacts'
import { getAllProjects } from '@/lib/markdown/projects'
import { getAllPosts } from '@/lib/markdown/blog'
import { Icon, type IconName } from '@/components/icons/Icon'
import { IntroVideo } from '@/components/ui/IntroVideo'

const title = 'About Adesh Shukla — UI Developer'
const description =
  'UI developer, 6+ years — 200+ PPC landing pages for US clients, plus CSS, responsive layout, accessibility and page-speed work. Based in India, working remotely. Open to UI roles.'

export const metadata: Metadata = buildMetadata({
  title,
  description,
  canonical: '/about',
  ogImage: buildOgImageUrl({ title, description, type: 'website' }),
  // ogType 'profile' removed — MetadataOptions only supports 'website' | 'article'
})

// ─── Static data ──────────────────────────────────────────────────────────────

// Ordered by what can actually be defended in an interview, strongest first —
// not by what looks most impressive in a list. A skills grid is a set of claims
// someone will ask follow-up questions about, so anything here has to survive
// "show me" and "why did you do it that way".
const SKILLS: Record<string, string[]> = {
  Interface: ['HTML', 'CSS', stack.tailwind, 'Responsive Layout', 'Design Systems'],
  'Accessibility & SEO': [
    'WCAG 2.1 AA',
    'axe-core',
    'Semantic HTML',
    'Structured Data',
    'Sitemaps',
  ],
  Performance: ['Core Web Vitals', 'Lighthouse', 'LCP / CLS / INP', 'Perf Budgets'],
  Design: ['Figma', 'UI/UX Design', 'Design-to-Code Handoff'],
  Tooling: ['Git', 'pnpm', 'Prettier', 'Playwright'],
}

// Reuses the site's existing drawn-icon set (same marks the /tools and
// /resources category headers use) rather than adding new art — one icon
// per category, not per pill, so coverage stays 100% instead of some skills
// having a matching tech mark and others not.
const CATEGORY_ICONS: Record<string, IconName> = {
  Interface: 'frontend',
  'Accessibility & SEO': 'browser',
  Performance: 'performance',
  Design: 'design',
  Tooling: 'devtools',
}

const TIMELINE = [
  {
    year: 'Jul 2021 – Present',
    // Matches the payslip designation, so the site, the résumé and Chetu's own
    // HR record all say the same thing. The Team Lead period is covered in the
    // résumé bullets rather than in the title line.
    role: 'UI Developer',
    company: 'Chetu India Pvt. Ltd.',
    desc: 'Building 200+ high-conversion PPC landing pages for US-based clients. Internal marketing web team.',
  },
  {
    // Company name and dates aligned to docs/resume.html, which was rebuilt
    // from the original résumé PDF. This entry previously said "IS Global",
    // "Jul 2020 – Jun 2021", and claimed React — three separate ways for a
    // recruiter reading the site and the résumé side by side to see two
    // different histories.
    year: 'Feb 2020 – Jul 2021',
    role: 'Frontend Developer',
    company: 'IS Software Solutions Pvt. Ltd.',
    desc: 'Responsive pages and admin panel UIs with HTML, CSS, JavaScript and Bootstrap, plus WordPress template and layout work.',
  },
]

// Drawn icons, not emoji — emoji standing in for an icon system reads as
// unfinished next to the rest of the site's hand-drawn 24x24 stroke set.
const CURRENTLY: { icon: IconName; text: string }[] = [
  { icon: 'devtools', text: 'Building DevStash — personal developer ecosystem' },
  { icon: 'docs', text: `Deep-diving into ${stack.next} App Router & RSC patterns` },
  { icon: 'automation', text: 'Automating workflows with n8n and local LLMs (Ollama)' },
  {
    icon: 'career',
    text: 'Open to frontend roles · remote worldwide, or hybrid in India · immediate–20 days notice',
  },
  // TODO: Keep this section updated
]

// ─── Page ─────────────────────────────────────────────────────────────────────

// Section heading used by every block below: mono index + title, and an
// optional one-line lede. Full site width (max-w-site), like the home page.
function SectionHead({ n, title, lede }: { n: string; title: string; lede?: string }) {
  return (
    <Reveal>
      <p className="text-ds-accent font-mono text-sm">{n} —</p>
      <h2 className="text-ds-text mt-2 text-[clamp(28px,3vw,40px)] leading-tight font-bold tracking-tight">
        {title}
      </h2>
      {lede && <p className="text-ds-muted mt-3 max-w-[60ch] leading-relaxed">{lede}</p>}
    </Reveal>
  )
}

export default function AboutPage() {
  // Counted from the content at build time, so these can never drift out of date.
  const projectCount = getAllProjects().length
  const postCount = getAllPosts().length

  return (
    <>
      <JsonLd data={buildPersonSchema()} />
      <JsonLd data={buildIntroVideoSchema()} />

      <div>
        {/* ── Hero: the story on the left, the path as four steps on the right ── */}
        <section className="border-ds-border border-b pt-12 pb-14 sm:pt-20 sm:pb-16">
          <div className="max-w-site mx-auto grid grid-cols-1 items-center gap-12 px-6 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
            <div>
              <p className="text-ds-accent font-mono text-sm">{'// about'}</p>
              <h1 className={`${H1_DISPLAY} mt-3`}>Hey, I&apos;m Adesh.</h1>
              <p className="text-ds-text mt-5 max-w-[30ch] text-[clamp(20px,2vw,28px)] leading-snug font-semibold tracking-tight">
                Someone who checks the numbers, then builds the page.
              </p>
              <div className="text-ds-muted mt-6 flex max-w-[62ch] flex-col gap-4 text-base leading-relaxed sm:text-lg">
                <p>
                  I started in accounts — a CA student, then tax compliance. UX is what pulled me
                  toward the web: I tried designing in tools like Figma, and what came out was an
                  analyst and a front-end developer.
                </p>
                <p>
                  6+ years on the web since. Most of it has been landing pages at volume — CSS,
                  responsive layout, keeping an older codebase alive, and fixing the accessibility
                  and speed problems that show up once a page is actually live. Currently at Chetu
                  India building landing pages for US clients, and building{' '}
                  <span className="text-ds-accent-strong">DevStash</span> on the side.
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
                  variant="resume"
                  iconRight={<Icon name="download" className="h-4 w-4" />}
                >
                  Download résumé
                </Button>
              </div>
            </div>

            <div className="mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end">
              <AboutProfileCard />
            </div>
          </div>

          {/* The proof in four numbers — two he has stated, two counted from the site. */}
          <div className="max-w-site mx-auto px-6">
            <PageFacts
              items={[
                { value: 6, suffix: '+', label: 'years on the web' },
                { value: 200, suffix: '+', label: 'landing pages, US clients' },
                { value: projectCount, label: 'projects shipped' },
                { value: postCount, label: 'blog posts' },
              ]}
            />
          </div>
        </section>

        {/* ── Intro video — click-to-load, so only the poster costs the page anything ── */}
        <section className="py-16 sm:py-20" aria-labelledby="intro-video-heading">
          <div className="max-w-site mx-auto grid grid-cols-1 items-center gap-10 px-6 lg:grid-cols-[1fr_1.7fr] lg:gap-16">
            <Reveal>
              <p className="text-ds-accent font-mono text-sm">01 —</p>
              <h2
                id="intro-video-heading"
                className="text-ds-text mt-2 text-[clamp(28px,3vw,40px)] leading-tight font-bold tracking-tight"
              >
                The 80-second version
              </h2>
              <p className="text-ds-muted mt-3 max-w-[44ch] leading-relaxed">
                What I build, narrated — Pare, Build Components, Praxis, Motion Lab and the AI
                pipeline. Captions on, no autoplay.
              </p>
            </Reveal>
            <Reveal delay={80}>
              <IntroVideo />
            </Reveal>
          </div>
        </section>

        {/* ── Skills: all five groups in one row on wide screens ── */}
        <section className="border-ds-border border-t py-16 sm:py-20">
          <div className="max-w-site mx-auto px-6">
            <SectionHead
              n="02"
              title="Tech I use"
              lede="Ordered by what I can defend in an interview, not by what looks impressive in a list."
            />
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {Object.entries(SKILLS).map(([category, items], i) => (
                <Reveal key={category} delay={i * 60}>
                  {/* A labelled group, not a link — so no hover state */}
                  <div className="border-ds-border bg-ds-surface/60 rounded-card h-full border p-5">
                    <h3 className="text-ds-text mb-4 flex items-center gap-2.5 font-semibold">
                      <span className="bg-ds-accent/10 text-ds-accent-strong grid h-8 w-8 shrink-0 place-items-center rounded-lg">
                        <Icon name={CATEGORY_ICONS[category]} className="h-4 w-4" />
                      </span>
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

        {/* ── Experience + Currently, side by side ── */}
        <section className="border-ds-border border-t py-16 sm:py-20">
          <div className="max-w-site mx-auto grid grid-cols-1 gap-14 px-6 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
            <div>
              <SectionHead n="03" title="Experience" />
              <ol className="mt-10 flex flex-col">
                {TIMELINE.map((item, i) => (
                  <Reveal key={item.company} delay={i * 80} as="li" className="flex gap-6">
                    <div className="flex flex-col items-center">
                      <div className="relative mt-1.5 flex h-3 w-3 shrink-0 items-center justify-center">
                        {/* Current role (newest first) gets the site's live-status ping */}
                        {i === 0 && (
                          <span
                            aria-hidden="true"
                            className="bg-ds-accent absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                          />
                        )}
                        <div className="bg-ds-accent ring-ds-bg relative h-3 w-3 rounded-full ring-4" />
                      </div>
                      {i < TIMELINE.length - 1 && (
                        <div className="from-ds-accent to-ds-purple mt-1 w-px flex-1 bg-gradient-to-b" />
                      )}
                    </div>
                    <div className="border-ds-border bg-ds-surface/60 rounded-card mb-6 flex-1 border p-5">
                      <p className="text-ds-muted font-mono text-xs">{item.year}</p>
                      <h3 className="text-ds-text mt-1 text-lg font-semibold">{item.role}</h3>
                      <p className="text-ds-accent-strong text-sm">{item.company}</p>
                      <p className="text-ds-muted mt-2 leading-relaxed">{item.desc}</p>
                    </div>
                  </Reveal>
                ))}
              </ol>
            </div>

            <div>
              <SectionHead n="04" title="Currently" />
              <ul className="mt-10 grid gap-3">
                {CURRENTLY.map(({ icon, text }, i) => (
                  <Reveal
                    key={text}
                    delay={i * 60}
                    as="li"
                    className="border-ds-border bg-ds-surface/60 rounded-card text-ds-muted flex items-start gap-3 border p-4"
                  >
                    <span
                      className="bg-ds-accent/10 text-ds-accent-strong flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                      aria-hidden="true"
                    >
                      <Icon name={icon} className="h-4 w-4" />
                    </span>
                    <span className="pt-1 leading-relaxed">{text}</span>
                  </Reveal>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── What is DevStash ── plain, literal sentences on purpose: this is
            what an assistant quotes when asked "what is DevStash", and the
            name is shared with several unrelated products. */}
        <section className="border-ds-border border-t py-16 sm:py-20">
          <div className="max-w-site mx-auto grid grid-cols-1 gap-8 px-6 lg:grid-cols-[1fr_2fr] lg:gap-20">
            <SectionHead n="05" title="What is DevStash?" />
            <div className="text-ds-muted flex max-w-[70ch] flex-col gap-4 text-lg leading-relaxed">
              <p>
                DevStash (devstash.me) is the personal site of Adesh Shukla, a UI developer in
                India. It holds his project case studies, a blog about frontend development, Next.js
                and workflow automation, and a set of free browser tools in the{' '}
                <Link
                  href="/lab"
                  className="text-ds-accent-strong decoration-ds-accent/40 hover:decoration-ds-accent underline underline-offset-2"
                >
                  Lab
                </Link>
                .
              </p>
              <p>
                Some of his projects run on their own subdomains of devstash.me: Pare
                (pare.devstash.me), a browser-only asset optimizer; Build Components
                (build-components.devstash.me), configurable UI components exported as plain code;
                Praxis (praxis.devstash.me), frontend interview practice; and the Motion Lab
                (showcase.devstash.me), animated landing pages built to a performance budget.
              </p>
              <p>
                DevStash is not connected to the other products that use the same name, such as
                devstash.io, devstash.app or devstash.dev.
              </p>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="border-ds-border bg-ds-surface border-t py-16 sm:py-20">
          <Reveal className="max-w-site mx-auto flex flex-col items-start justify-between gap-8 px-6 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-ds-text text-[clamp(28px,3vw,40px)] leading-tight font-bold tracking-tight">
                Want to work together?
              </h2>
              <p className="text-ds-muted mt-3 text-lg">
                I&apos;m open to frontend roles and freelance collabs. Drop me a line.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button href="/contact" size="lg">
                Contact me
              </Button>
              <Button
                href="/resume-adesh-shukla.pdf"
                download
                data-analytics-event="cv_viewed"
                variant="resume"
                size="lg"
                iconRight={<Icon name="download" className="h-4 w-4" />}
              >
                Download résumé
              </Button>
              <Button
                href={siteConfig.author.github}
                variant="ghost"
                size="lg"
                iconLeft={<Icon name="github" className="h-4 w-4" />}
              >
                GitHub
              </Button>
            </div>
          </Reveal>
        </section>
      </div>
    </>
  )
}
