import { Button, CardTilt, Reveal } from '@/components/ui'
import { siteConfig } from '@/content/metadata/site.config'

// Closing call to action, placed after the FAQ. The three steps are the same
// ones as the process on /services, so the promise here matches the page.
const NEXT = [
  {
    title: 'You write',
    body: 'A few lines on the goal, the deadline and where the traffic comes from.',
  },
  {
    title: 'I reply within 24 hours',
    body: 'With questions, or a quote if the scope is already clear.',
  },
  {
    title: 'We agree the scope',
    body: 'A written scope and a fixed quote before any work starts.',
  },
] as const

export function CtaBand({
  title = 'Have a site to build or fix? Let’s talk.',
  body = 'Tell me what you are building. Landing pages, custom websites, speed fixes and frontend contracts are all fair game.',
  primary = { label: 'Start a project', href: '/contact' },
  secondary = { label: 'Read my résumé', href: '/resume-adesh-shukla.pdf' },
}: {
  title?: string
  body?: string
  primary?: { label: string; href: string }
  secondary?: { label: string; href: string }
}) {
  return (
    <section className="border-ds-border border-t py-16 lg:py-20">
      <div className="max-w-site mx-auto px-6">
        <Reveal>
          <CardTilt>
            <div className="card-spotlight card-glow rounded-card border-ds-border bg-ds-surface relative overflow-hidden border p-5 sm:p-12 lg:p-14">
              <div
                aria-hidden="true"
                className="bg-ds-accent/15 pointer-events-none absolute -top-28 -right-24 h-72 w-72 rounded-full blur-3xl"
              />
              <div
                aria-hidden="true"
                className="bg-ds-purple/10 pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full blur-3xl"
              />

              <div className="relative grid items-center gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
                <div>
                  <p className="text-ds-muted flex items-center gap-2 font-mono text-xs">
                    <span className="bg-ds-success h-2 w-2 rounded-full" aria-hidden="true" />
                    Open now · reply within 24 hours
                  </p>
                  <h2 className="text-ds-text mt-4 text-2xl font-bold tracking-tight sm:text-4xl">
                    {title}
                  </h2>
                  <p className="text-ds-muted mt-4 max-w-lg text-base leading-relaxed sm:text-lg">
                    {body}
                  </p>
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Button href={primary.href} size="lg">
                      {primary.label}
                    </Button>
                    <Button
                      href={secondary.href}
                      variant="outline"
                      size="lg"
                      target={secondary.href.endsWith('.pdf') ? '_blank' : undefined}
                      rel={secondary.href.endsWith('.pdf') ? 'noopener noreferrer' : undefined}
                    >
                      {secondary.label}
                    </Button>
                  </div>
                  <p className="text-ds-muted mt-5 text-sm">
                    Prefer email?{' '}
                    <a
                      href={`mailto:${siteConfig.author.email}`}
                      className="text-ds-accent underline-offset-4 hover:underline"
                    >
                      {siteConfig.author.email}
                    </a>
                  </p>
                </div>

                <div>
                  <p className="text-ds-muted mb-4 font-mono text-xs tracking-wide uppercase">
                    What happens next
                  </p>
                  <ol className="flex flex-col">
                    {NEXT.map((s, i) => (
                      <li key={s.title} className="relative flex gap-4 pb-6 last:pb-0">
                        {i < NEXT.length - 1 && (
                          <span
                            aria-hidden="true"
                            className="bg-ds-border2 absolute top-9 bottom-1 left-[15px] w-px"
                          />
                        )}
                        <span className="border-ds-border2 bg-ds-surface2 text-ds-accent flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-xs">
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-ds-text font-semibold">{s.title}</p>
                          <p className="text-ds-muted mt-1 text-sm leading-relaxed">{s.body}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </CardTilt>
        </Reveal>
      </div>
    </section>
  )
}
