import { FaqSection } from '@/components/sections/FaqSection'
import { H1_HEADLINE } from '@/lib/utils/typography'
import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { buildOgImageUrl } from '@/lib/seo/ogImage'
import { Breadcrumb } from '@/components/layout'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildServicesSchema } from '@/lib/schema/builders'
import { Button } from '@/components/ui'
import { Icon } from '@/components/icons/Icon'
import type { IconName } from '@/components/icons/Icon'

const title = 'Hire a Freelance Frontend Developer in India'
const description =
  'Freelance and contract frontend developer in India: Next.js and React builds, SEO-ready landing pages, accessibility and workflow automation. Reply within 24 hours.'

export const metadata: Metadata = buildMetadata({
  title,
  description,
  canonical: '/services',
  ogImage: buildOgImageUrl({ title, description, type: 'website' }),
})

const OFFERINGS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'frontend',
    title: 'Frontend Engineering',
    body: 'React and Next.js apps built to a real performance budget — Lighthouse 90+, tight Core Web Vitals, accessible by default.',
  },
  {
    icon: 'frontend',
    title: 'Landing Pages & Custom Websites',
    body: 'Hand-coded, responsive pages for ad campaigns and small businesses: built from scratch, not a template, and shaped around one conversion goal. 200+ PPC landing pages delivered for US clients.',
  },
  {
    icon: 'performance',
    title: 'Website Speed & Core Web Vitals',
    body: 'Slow site losing ad spend or rankings? I audit on mobile first and fix the real causes: images, fonts, render-blocking scripts and layout shift.',
  },
  {
    icon: 'performance',
    title: 'SEO-Ready Builds',
    body: 'Structured data, metadata, and sitemaps wired in from day one, not bolted on after launch.',
  },
  {
    icon: 'automation',
    title: 'Workflow Automation',
    body: 'n8n and LLM pipelines that handle the repetitive parts — deploy-triggered notifications, AI-assisted content workflows, internal tooling.',
  },
]

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
      'Yes. I am open to freelance and contract frontend work anywhere in India, remote or hybrid, with immediate to roughly 20 days notice.',
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

export default function ServicesPage() {
  return (
    <div>
      <JsonLd data={buildServicesSchema(OFFERINGS)} />
      <section className="border-ds-border border-b py-16">
        <div className="mx-auto max-w-3xl px-6">
          <Breadcrumb
            items={[
              { name: 'Home', url: 'https://devstash.me' },
              { name: 'Work With Me', url: 'https://devstash.me/services' },
            ]}
          />
          <p className="text-ds-accent mt-6 font-mono text-sm">Work with me</p>
          <h1 className={`${H1_HEADLINE} mt-3`}>Need a frontend built, or a workflow automated?</h1>
          <p className="text-ds-muted mt-3 max-w-lg">
            Open to freelance and contract frontend work — anywhere in India, remote or hybrid.
            Immediate to ~20 days notice.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-site mx-auto px-6">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {OFFERINGS.map((item) => (
              <div key={item.title}>
                <div className="border-ds-border bg-ds-surface text-ds-accent flex h-10 w-10 items-center justify-center rounded-lg border">
                  <Icon name={item.icon} className="h-5 w-5" />
                </div>
                <h2 className="text-ds-text mt-4 font-semibold">{item.title}</h2>
                <p className="text-ds-muted mt-2 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-ds-border border-t py-16 text-center">
        <div className="mx-auto max-w-md px-6">
          <h2 className="text-ds-text mb-3 text-xl font-bold">
            Let&apos;s talk about your project
          </h2>
          <p className="text-ds-muted mb-6 text-sm">
            Tell me what you&apos;re building — I&apos;ll reply within 24 hours.
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
