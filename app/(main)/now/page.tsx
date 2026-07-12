import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { buildOgImageUrl } from '@/lib/seo/ogImage'
import { Breadcrumb } from '@/components/layout'
import { Card } from '@/components/ui'

const title = 'Now — What Adesh Is Working On'
const description =
  'What Adesh Shukla is currently focused on — projects, learning, and availability. A nownownow.com-style page, updated periodically, not a static bio.'

export const metadata: Metadata = buildMetadata({
  title,
  description,
  canonical: '/now',
  ogImage: buildOgImageUrl({ title, description, type: 'website' }),
})

// [TODO: Adesh — update this date whenever you edit the page below.
// A /now page is only useful if it's actually kept current.]
const LAST_UPDATED = '2026-07-12'

export default function NowPage() {
  return (
    <main>
      <section className="border-ds-border border-b py-16">
        <div className="mx-auto max-w-2xl px-6">
          <Breadcrumb
            items={[
              { name: 'Home', url: 'https://devstash.me' },
              { name: 'Now', url: 'https://devstash.me/now' },
            ]}
          />
          <p className="text-ds-accent mt-4 font-mono text-sm">/now</p>
          <h1 className="text-ds-text mt-2 text-4xl font-bold">What I&apos;m doing now</h1>
          <p className="text-ds-muted mt-3 font-mono text-sm">
            Last updated:{' '}
            <time dateTime={LAST_UPDATED}>
              {new Date(LAST_UPDATED).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>{' '}
            —{' '}
            <a
              href="https://nownownow.com/about"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ds-accent underline-offset-4 hover:underline"
            >
              what&apos;s a /now page?
            </a>
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6">
          <Card padding="lg">
            <h2 className="text-ds-text mb-2 text-lg font-semibold">Building</h2>
            <p className="text-ds-muted text-sm leading-relaxed">
              DevStash itself — most recently the honest, non-fabricating AI blog pipeline in{' '}
              <a href="/lab/ai-content-pipeline" className="text-ds-accent hover:underline">
                /lab
              </a>
              , plus recruiter-facing case studies and site-wide QA/security automation.
            </p>
          </Card>

          <Card padding="lg">
            <h2 className="text-ds-text mb-2 text-lg font-semibold">Open to</h2>
            <p className="text-ds-muted text-sm leading-relaxed">
              Frontend roles in Noida / Delhi NCR or remote, plus freelance and contract work. See{' '}
              <a href="/contact" className="text-ds-accent hover:underline">
                /contact
              </a>{' '}
              for details.
            </p>
          </Card>

          <Card padding="lg" className="border-dashed">
            <h2 className="text-ds-muted mb-2 text-lg font-semibold">Learning</h2>
            <p className="text-ds-muted font-mono text-sm">
              [TODO: what you&apos;re currently reading/learning/exploring]
            </p>
          </Card>

          <Card padding="lg" className="border-dashed">
            <h2 className="text-ds-muted mb-2 text-lg font-semibold">Outside of code</h2>
            <p className="text-ds-muted font-mono text-sm">
              [TODO: optional — bikes, hobbies, whatever&apos;s true and worth sharing]
            </p>
          </Card>
        </div>
      </section>
    </main>
  )
}
