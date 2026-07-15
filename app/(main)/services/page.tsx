import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { buildOgImageUrl } from '@/lib/seo/ogImage'
import { Breadcrumb } from '@/components/layout'
import { Button } from '@/components/ui'
import { Icon } from '@/components/icons/Icon'
import type { IconName } from '@/components/icons/Icon'

const title = 'Work With Me — Frontend Development & Automation'
const description =
  'Freelance and contract frontend development, SEO-ready builds, and workflow automation from Adesh Shukla — for teams that need a Next.js site or internal tool built right.'

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

export default function ServicesPage() {
  return (
    <main>
      <section className="border-ds-border border-b py-16">
        <div className="mx-auto max-w-3xl px-6">
          <Breadcrumb
            items={[
              { name: 'Home', url: 'https://devstash.me' },
              { name: 'Work With Me', url: 'https://devstash.me/services' },
            ]}
          />
          <p className="text-ds-accent mt-4 font-mono text-sm">Work with me</p>
          <h1 className="text-ds-text mt-2 text-4xl font-bold">
            Need a frontend built, or a workflow automated?
          </h1>
          <p className="text-ds-muted mt-3 max-w-lg">
            Open to freelance and contract frontend work — Noida / Delhi NCR or remote. Immediate to
            ~20 days notice.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6">
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
            Tell me what you&apos;re building — I&apos;ll reply within 48 hours.
          </p>
          <Button href="/contact" variant="primary" size="lg">
            Get in Touch
          </Button>
        </div>
      </section>
    </main>
  )
}
