import Link from 'next/link'
import { FaqSection } from '@/components/sections/FaqSection'
import { ServicesExplorer, type ServiceItem } from '@/components/sections/ServicesExplorer'
import { H1_HEADLINE } from '@/lib/utils/typography'
import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { buildOgImageUrl } from '@/lib/seo/ogImage'
import { Breadcrumb } from '@/components/layout'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildServicesSchema } from '@/lib/schema/builders'
import { Button, Reveal } from '@/components/ui'
import { Icon } from '@/components/icons/Icon'
import { projectBrand } from '@/components/icons/ProjectMark'

const title = 'Hire a Freelance Frontend Developer in India'
const description =
  'Freelance and contract frontend developer in India: Next.js and React builds, SEO-ready landing pages, accessibility and workflow automation. Reply within 24 hours.'

export const metadata: Metadata = buildMetadata({
  title,
  description,
  canonical: '/services',
  ogImage: buildOgImageUrl({ title, description, type: 'website' }),
})

const SERVICES: ServiceItem[] = [
  {
    key: 'landing',
    icon: 'frontend',
    visual: 'landing',
    title: 'Landing Pages for Ads',
    tag: 'Google Ads · PPC campaigns',
    body: 'Hand-coded, responsive pages for ad campaigns, shaped around one conversion goal. 200+ PPC landing pages delivered for US clients.',
    gets: [
      'One goal per page: a headline that matches the ad and a single clear action',
      'Fast on a real phone, built to the LCP, CLS and INP budget',
      'Form and UTM-ready tracking hooks for your ad platform',
      'Accessible markup: visible labels, keyboard support, readable contrast',
    ],
    fit: 'Best for a campaign that is about to launch, or a page whose clicks are not turning into enquiries.',
    proof: [
      {
        label: 'Google Ads landing page checklist',
        href: '/blog/google-ads-landing-page-checklist',
      },
      { label: 'Lessons from 200+ pages', href: '/blog/ppc-landing-page-conversion-lessons' },
      { label: 'UTM Link Builder', href: '/projects/utm-builder' },
    ],
  },
  {
    key: 'site',
    icon: 'frontend',
    visual: 'site',
    title: 'Custom Websites',
    tag: 'Small business · brand sites',
    body: 'Built from scratch in React and Next.js: not a template and not a page-builder plugin stack. Metadata, structured data and a sitemap are wired in from day one.',
    gets: [
      'Designed around your pages and goals, with no theme underneath',
      'SEO built in: titles, canonical URLs, Open Graph, JSON-LD and a sitemap',
      'Responsive on phones, tablets and desktops',
      'Only the code each page needs, so it stays fast',
    ],
    fit: 'Best when a template has hit its limit, or a site needs a specific flow that themes fight.',
    proof: [
      {
        label: 'Custom website vs template',
        href: '/blog/custom-website-vs-template-small-business',
      },
      { label: 'Build Components', href: '/projects/build-components' },
    ],
  },
  {
    key: 'speed',
    icon: 'performance',
    visual: 'speed',
    title: 'Website Speed & Core Web Vitals',
    tag: 'Mobile audit and fix',
    body: 'Slow site losing ad spend or rankings? I audit on mobile first and fix the real causes: images, fonts, render-blocking scripts and layout shift.',
    gets: [
      'A mobile audit in PageSpeed Insights and Lighthouse before anything changes',
      'Fixes for what is actually slow, not a generic checklist',
      'A before-and-after you can re-run yourself',
      'A straight answer if the platform itself is the limit',
    ],
    fit: 'Best for a site that scores badly on phones, or paid traffic that bounces before the page appears.',
    proof: [
      { label: 'Why a site is slow on mobile', href: '/blog/why-is-my-website-slow-on-mobile' },
      {
        label: 'Core Web Vitals for landing pages',
        href: '/blog/core-web-vitals-high-traffic-landing-pages',
      },
      { label: 'Pare', href: '/projects/pare' },
    ],
  },
  {
    key: 'app',
    icon: 'frontend',
    visual: 'app',
    title: 'Frontend Engineering',
    tag: 'React · Next.js · TypeScript',
    body: 'React and Next.js apps built to a real performance budget: Lighthouse 90+, tight Core Web Vitals, accessible by default.',
    gets: [
      'Next.js App Router, TypeScript and Tailwind, structured to stay maintainable',
      'Accessible components: semantic HTML, keyboard support, screen-reader checks',
      'Design-to-code from Figma, tokens first and components second',
      'Open to contract work or a remote role on your team',
    ],
    fit: 'Best for a product team that needs frontend capacity, or a build that must be fast and accessible from the start.',
    proof: [
      { label: 'Praxis', href: '/projects/praxis' },
      { label: 'Motion Lab', href: '/projects/motion-lab' },
      { label: 'Next.js 16 App Router patterns', href: '/blog/nextjs-16-app-router-patterns' },
    ],
  },
  {
    key: 'automation',
    icon: 'automation',
    visual: 'automation',
    title: 'Workflow Automation',
    tag: 'n8n · LLM pipelines',
    body: 'n8n and LLM pipelines that handle the repetitive parts: deploy-triggered notifications, AI-assisted content workflows, internal tooling.',
    gets: [
      'Triggers, LLM steps and outputs wired together in n8n',
      'Rate-limit handling and fallbacks so a run does not stall',
      'Drafts that flag what only a person can supply, instead of inventing it',
      'A clear note of what to automate and what to leave manual',
    ],
    fit: 'Best for a repeated task that eats hours each week and follows the same steps every time.',
    proof: [
      { label: 'AI content pipeline', href: '/lab/ai-content-pipeline' },
      { label: 'n8n and Groq patterns', href: '/blog/n8n-groq-workflow-patterns' },
    ],
  },
]

const FACTS = [
  ['Availability', 'Open now'],
  ['Notice', 'Immediate to ~20 days'],
  ['Works', 'Remote, clients worldwide'],
  ['Pricing', 'Quoted per project'],
  ['Reply', 'Within 24 hours'],
] as const

const STEPS = [
  {
    n: '01',
    title: 'Brief',
    body: 'You tell me the goal, the deadline and where the traffic comes from.',
  },
  {
    n: '02',
    title: 'Scope & quote',
    body: 'A written scope and a fixed quote for it, so the total is known up front.',
  },
  {
    n: '03',
    title: 'Build',
    body: 'Mobile-first, held to the performance budget and checked before it ships.',
  },
  {
    n: '04',
    title: 'Launch',
    body: 'Live with metadata, tracking hooks and a sitemap in place, and a hand-over.',
  },
] as const

const ENGAGEMENTS = [
  {
    title: 'Fixed-scope project',
    body: 'A landing page, a website or a speed fix with a clear start and finish.',
  },
  {
    title: 'Contract',
    body: 'Ongoing frontend work alongside your team, remote, for as long as it is useful.',
  },
  {
    title: 'Full-time role',
    body: 'Open to remote frontend roles at companies that care about speed and accessibility.',
  },
] as const

const FAQ = [
  {
    question: 'What kind of work do you take on?',
    answer:
      'Frontend engineering with React and Next.js, SEO-ready builds with structured data, metadata and sitemaps wired in from day one, and workflow automation with n8n and LLM pipelines.',
  },
  {
    question: 'Do you build custom websites or use templates?',
    answer:
      'Custom. Pages are hand-coded in React and Next.js (or plain HTML and CSS for a simple landing page), so you are not carrying a page-builder plugin stack that slows the site down.',
  },
  {
    question: 'Can you build landing pages for Google Ads campaigns?',
    answer:
      'Yes. I have built 200+ PPC landing pages for US clients: one clear goal per page, fast on mobile, accessible, with form and tracking hooks ready for your ad platform.',
  },
  {
    question: 'Can you speed up my slow website?',
    answer:
      'Usually, yes. I start with a mobile Lighthouse and Core Web Vitals audit, then fix what is actually slow, such as oversized images, font loading, blocking scripts and layout shift. I will tell you up front if the platform itself is the limit.',
  },
  {
    question: 'Are you available for freelance or contract work?',
    answer:
      'Yes. I am open to freelance and contract frontend work remotely for clients worldwide, including the US, with immediate to roughly 20 days notice.',
  },
  {
    question: 'How much does a project cost?',
    answer:
      'I do not publish fixed rates because scope varies a lot between a landing page and an internal tool. Tell me what you are building through the contact page and I will reply within 24 hours.',
  },
  {
    question: 'What performance standard do you build to?',
    answer:
      'A real performance budget: a Lighthouse score above 90 on mobile and desktop as the target, tight Core Web Vitals, and accessibility handled by default rather than at the end.',
  },
  {
    question: 'Do you handle SEO as part of a build?',
    answer:
      'Yes. Metadata, canonical URLs, Open Graph tags, JSON-LD structured data and a sitemap are part of the build itself instead of something added after launch.',
  },
  {
    question: 'Can I see examples of your work first?',
    answer:
      'The Projects page has case studies covering the problem, the decisions and what I would change, and the Lab has working tools you can use in your browser with no signup.',
  },
]

const SHIPPED = ['pare', 'praxis', 'build-components', 'motion-lab'] as const
const SHIPPED_NAMES: Record<(typeof SHIPPED)[number], string> = {
  pare: 'Pare',
  praxis: 'Praxis',
  'build-components': 'Build Components',
  'motion-lab': 'Motion Lab',
}

const linkCls = 'text-ds-accent underline-offset-4 hover:underline'

export default function ServicesPage() {
  return (
    <div>
      <JsonLd data={buildServicesSchema(SERVICES)} />

      {/* ── Hero ── */}
      <section className="border-ds-border border-b py-16 lg:py-20">
        <div className="max-w-site mx-auto px-6">
          <Breadcrumb
            items={[
              { name: 'Home', url: 'https://devstash.me' },
              { name: 'Work With Me', url: 'https://devstash.me/services' },
            ]}
          />
          <div className="mt-8 grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
            <div>
              <p className="text-ds-muted flex items-center gap-2 font-mono text-xs">
                <span className="bg-ds-success h-2 w-2 rounded-full" aria-hidden="true" />
                Available for freelance and contract work
              </p>
              <h1 className={`${H1_HEADLINE} mt-5`}>
                <span className="text-ds-muted mb-[0.14em] block text-[0.58em] font-semibold tracking-[-0.02em]">
                  Freelance frontend developer
                </span>
                custom websites, landing pages &amp; speed fixes.
              </h1>
              <p className="text-ds-muted mt-6 max-w-xl text-lg leading-relaxed">
                I build fast, accessible, SEO-ready sites and landing pages for clients in the US
                and worldwide. 6+ years in, with 200+ PPC landing pages delivered for US clients.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button href="/contact" size="lg">
                  Start a project
                </Button>
                <Button href="/projects" variant="outline" size="lg">
                  See the work
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <span className="text-ds-muted font-mono text-xs">shipped:</span>
                {SHIPPED.map((slug) => {
                  const { Mark } = projectBrand(slug)
                  return (
                    <Link
                      key={slug}
                      href={`/projects/${slug}`}
                      aria-label={SHIPPED_NAMES[slug]}
                      title={SHIPPED_NAMES[slug]}
                      className="ring-hover border-ds-border block h-9 w-9 overflow-hidden rounded-lg border [&>svg]:h-full [&>svg]:w-full"
                    >
                      <Mark />
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="border-ds-border bg-ds-surface rounded-card border p-6 sm:p-8">
              <p className="text-ds-muted font-mono text-xs tracking-wide uppercase">At a glance</p>
              <dl className="divide-ds-border mt-4 divide-y">
                {FACTS.map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-6 py-3.5">
                    <dt className="text-ds-muted text-sm">{k}</dt>
                    <dd className="text-ds-text text-right font-mono text-sm">{v}</dd>
                  </div>
                ))}
              </dl>
              <Button href="/contact" className="mt-4 w-full">
                Tell me about your project
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Services explorer ── */}
      <section className="py-16 lg:py-20">
        <div className="max-w-site mx-auto px-6">
          <Reveal>
            <p className="text-ds-accent font-mono text-sm">What I build</p>
            <h2 className="text-ds-text mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              Pick a service to see what you get
            </h2>
          </Reveal>
          <div className="mt-10">
            <ServicesExplorer services={SERVICES} />
          </div>
        </div>
      </section>

      {/* ── Included in every build ── */}
      <section className="border-ds-border border-t py-16 lg:py-20">
        <div className="max-w-site mx-auto px-6">
          <Reveal>
            <p className="text-ds-accent font-mono text-sm">Every build</p>
            <h2 className="text-ds-text mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              The same standard on a landing page or a full app
            </h2>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
            <Reveal className="border-ds-border bg-ds-surface rounded-card border p-8 lg:col-span-7">
              <p className="text-ds-muted font-mono text-xs tracking-wide uppercase">
                Performance budget · every page
              </p>
              <div className="mt-5 flex flex-wrap gap-x-10 gap-y-5">
                {(
                  [
                    ['2.5s', 'LCP under'],
                    ['200ms', 'INP under'],
                    ['0.1', 'CLS under'],
                  ] as const
                ).map(([value, label]) => (
                  <div key={label}>
                    <p className="text-ds-text font-mono text-3xl font-semibold">{value}</p>
                    <p className="text-ds-muted mt-1 font-mono text-xs tracking-wide uppercase">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-ds-muted mt-6 max-w-md text-sm leading-relaxed">
                Google&apos;s &quot;good&quot; thresholds, used as hard limits for every page, not
                one-off scores.
              </p>
            </Reveal>

            <Reveal
              delay={80}
              className="border-ds-border bg-ds-surface rounded-card border p-8 lg:col-span-5"
            >
              <p className="text-ds-muted font-mono text-xs tracking-wide uppercase">
                Search preview
              </p>
              <div className="border-ds-border bg-ds-surface2 mt-4 rounded-lg border p-4">
                <p className="text-ds-success truncate font-mono text-xs">devstash.me › services</p>
                <p className="text-ds-accent-strong mt-1.5 truncate text-base">{title}</p>
                <p className="text-ds-muted mt-1 line-clamp-2 text-sm leading-relaxed">
                  {description}
                </p>
              </div>
              <p className="text-ds-muted mt-5 text-sm leading-relaxed">
                Titles, canonical URLs, Open Graph, structured data and a sitemap ship with the
                build.
              </p>
            </Reveal>

            <Reveal
              delay={120}
              className="border-ds-border bg-ds-surface rounded-card border p-8 lg:col-span-5"
            >
              <p className="text-ds-muted font-mono text-xs tracking-wide uppercase">
                Accessible by default
              </p>
              <ul className="mt-4 flex flex-col gap-3">
                {[
                  'Semantic HTML before ARIA',
                  'Everything reachable by keyboard',
                  'Visible labels and clear error messages',
                ].map((t) => (
                  <li key={t} className="text-ds-muted flex gap-3 text-sm">
                    <Icon name="check" className="text-ds-success mt-0.5 h-4 w-4 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
              <Link
                href="/blog/screen-reader-accessibility-checklist"
                className={`${linkCls} mt-5 inline-block text-sm`}
              >
                The checklist I use →
              </Link>
            </Reveal>

            <Reveal
              delay={160}
              className="border-ds-border bg-ds-surface rounded-card border p-8 lg:col-span-7"
            >
              <p className="text-ds-muted font-mono text-xs tracking-wide uppercase">
                Responsive, tested wide to narrow
              </p>
              <div className="mt-5 flex items-end gap-2.5 sm:gap-4" aria-hidden="true">
                {[
                  ['w-7 sm:w-10', '375'],
                  ['w-10 sm:w-20', '768'],
                  ['w-16 sm:w-32', '1024'],
                  ['w-24 sm:w-44', '1440'],
                ].map(([cls, label]) => (
                  <div key={label} className="flex flex-col items-center gap-2">
                    <div
                      className={`border-ds-border2 bg-ds-surface2 hover:border-ds-accent h-[72px] rounded-md border-[1.5px] transition-colors ${cls}`}
                    />
                    <span className="text-ds-muted font-mono text-[11px]">{label}</span>
                  </div>
                ))}
              </div>
              <p className="text-ds-muted mt-5 max-w-md text-sm leading-relaxed">
                Layouts are checked from very small phones up to wide desktops, so nothing overflows
                or hides behind a breakpoint.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Process ── */}
      <section className="border-ds-border border-t py-16 lg:py-20">
        <div className="max-w-site mx-auto px-6">
          <Reveal>
            <p className="text-ds-accent font-mono text-sm">How a project runs</p>
            <h2 className="text-ds-text mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              Four steps, no surprises on the invoice
            </h2>
          </Reveal>
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal as="li" key={s.n} delay={i * 80} className="list-none">
                <div className="ring-hover border-ds-border bg-ds-surface h-full rounded-xl border p-6">
                  <span className="text-ds-accent font-mono text-sm">{s.n}</span>
                  <h3 className="text-ds-text mt-3 text-lg font-semibold">{s.title}</h3>
                  <p className="text-ds-muted mt-2 text-sm leading-relaxed">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Ways to work together ── */}
      <section className="border-ds-border border-t py-16 lg:py-20">
        <div className="max-w-site mx-auto px-6">
          <Reveal>
            <p className="text-ds-accent font-mono text-sm">Ways to work together</p>
            <h2 className="text-ds-text mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              A project, a contract or a team seat
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {ENGAGEMENTS.map((e, i) => (
              <Reveal key={e.title} delay={i * 80}>
                <div className="ring-hover border-ds-border bg-ds-surface h-full rounded-xl border p-6">
                  <h3 className="text-ds-text text-lg font-semibold">{e.title}</h3>
                  <p className="text-ds-muted mt-2 text-sm leading-relaxed">{e.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="text-ds-muted mt-6 text-sm">
            Hiring for a role?{' '}
            <a
              href="/resume-adesh-shukla.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className={linkCls}
            >
              Read my résumé
            </a>{' '}
            or see the{' '}
            <Link href="/about" className={linkCls}>
              about page
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className="border-ds-border border-t py-16 text-center lg:py-20">
        <div className="mx-auto max-w-xl px-6">
          <h2 className="text-ds-text mb-3 text-3xl font-bold tracking-tight">
            Let&apos;s talk about your project
          </h2>
          <p className="text-ds-muted mb-8">
            Tell me what you&apos;re building and where the traffic comes from. I&apos;ll reply
            within 24 hours.
          </p>
          <Button href="/contact" variant="primary" size="lg">
            Get in Touch
          </Button>
        </div>
      </section>

      <FaqSection items={FAQ} intro="Straight answers on scope, availability and how I work." />
    </div>
  )
}
