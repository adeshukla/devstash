import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { LabForm } from '@/components/lab/LabForm'
import { LabFaq } from '@/components/lab/LabFaq'

export const metadata: Metadata = buildMetadata({
  title: 'Pulse — Landing Page Sample',
  description:
    'Original SaaS free-trial signup landing page sample built by Adesh Shukla — single-CTA layout, no-card-required framing, working demo form.',
  canonical: '/lab/saas-trial-signup',
  noIndex: true,
})

const FEATURES = [
  {
    title: 'Real-time dashboards',
    desc: 'See every metric that matters the moment it changes — no refresh, no delay.',
  },
  {
    title: 'One-line install',
    desc: 'Drop in a single snippet. No SDK juggling, no config files to maintain.',
  },
  {
    title: 'Team alerts',
    desc: 'Route anomalies straight to Slack or email before they become incidents.',
  },
]

const PLANS = [
  {
    name: 'Starter',
    price: '$0',
    period: '/mo',
    desc: 'For side projects finding their first users.',
    features: ['Up to 1,000 tracked events/mo', '1 dashboard', '7-day data retention'],
    cta: 'Start free trial',
    highlighted: false,
  },
  {
    name: 'Team',
    price: '$29',
    period: '/mo',
    desc: 'For small teams shipping weekly.',
    features: [
      'Up to 100k tracked events/mo',
      'Unlimited dashboards',
      '90-day data retention',
      'Slack alerts',
    ],
    cta: 'Start free trial',
    highlighted: true,
  },
  {
    name: 'Scale',
    price: 'Custom',
    period: '',
    desc: 'For products with real traffic and real stakes.',
    features: ['Unlimited events', 'SSO + audit log', '1-year data retention', 'Priority support'],
    cta: 'Talk to sales',
    highlighted: false,
  },
]

const TESTIMONIALS = [
  {
    quote:
      'We swapped three dashboards for one. Nobody on the team opens a spreadsheet to check numbers anymore.',
    name: 'Priya M.',
    role: 'Eng Lead, illustrative example',
  },
  {
    quote:
      'Installed it in one sprint. The alerting alone paid for the Team plan in the first week.',
    name: 'Daniel K.',
    role: 'Founder, illustrative example',
  },
]

const FAQS = [
  {
    question: 'Do I need a credit card to start?',
    answer:
      'No. The 14-day trial starts with just your email — no card required, and it does not auto-charge when the trial ends.',
  },
  {
    question: 'How long does setup actually take?',
    answer:
      'Most teams are seeing their first events within 5 minutes of installing the snippet. No backend changes needed.',
  },
  {
    question: 'Can I switch plans later?',
    answer:
      'Yes, upgrade or downgrade anytime from the billing page — changes apply immediately, prorated for the current cycle.',
  },
]

export default function SaasTrialLandingPage() {
  return (
    <main className="bg-ds-bg min-h-screen">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-6 py-24 sm:py-32">
        <div
          aria-hidden="true"
          className="bg-ds-accent pointer-events-none absolute -top-32 left-1/2 -z-10 h-[420px] w-[420px] -translate-x-1/2 rounded-full opacity-[0.12] blur-3xl"
        />
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-ds-accent mb-4 font-mono text-sm">PULSE — PRODUCT ANALYTICS</p>
          <h1 className="text-ds-text text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
            Know what your users do — before they tell you.
          </h1>
          <p className="text-ds-muted mt-6 text-lg leading-relaxed">
            Pulse turns raw product events into dashboards your whole team actually reads. Start
            seeing real data in under five minutes.
          </p>

          <div className="mx-auto mt-10 max-w-md">
            <LabForm
              formType="saas-trial"
              submitLabel="Start free trial →"
              loadingLabel="Starting…"
              successTitle="You're in."
              successNote="This demo form sent a real email — check it worked. In a real product this would drop you straight into onboarding."
            />
          </div>
          <p className="text-ds-muted mt-3 font-mono text-xs">
            No credit card required · 14-day trial · Cancel anytime
          </p>
        </div>
      </section>

      {/* ── Feature grid ── */}
      <section className="border-ds-border border-t px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title}>
                <div className="bg-ds-accent/10 mb-4 flex h-10 w-10 items-center justify-center rounded-lg">
                  <span className="bg-ds-accent block h-2.5 w-2.5 rounded-full" />
                </div>
                <h3 className="text-ds-text font-semibold">{f.title}</h3>
                <p className="text-ds-muted mt-2 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="border-ds-border bg-ds-surface border-t px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="text-ds-text text-2xl font-bold sm:text-3xl">
              Simple, usage-based pricing
            </h2>
            <p className="text-ds-muted mt-3">
              Start free. Upgrade only when you outgrow the trial.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={
                  plan.highlighted
                    ? 'border-ds-accent bg-ds-bg relative rounded-2xl border-2 p-6'
                    : 'border-ds-border bg-ds-bg rounded-2xl border p-6'
                }
              >
                {plan.highlighted && (
                  <span className="bg-ds-accent absolute -top-3 left-6 rounded-full px-3 py-1 text-xs font-semibold text-white">
                    Most popular
                  </span>
                )}
                <h3 className="text-ds-text font-semibold">{plan.name}</h3>
                <p className="text-ds-muted mt-1 text-sm">{plan.desc}</p>
                <p className="mt-4">
                  <span className="text-ds-text text-3xl font-bold">{plan.price}</span>
                  <span className="text-ds-muted text-sm">{plan.period}</span>
                </p>
                <ul className="mt-6 flex flex-col gap-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="text-ds-muted flex items-start gap-2 text-sm">
                      <span className="bg-ds-accent mt-1.5 h-1 w-1 shrink-0 rounded-full" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <p className="text-ds-muted mb-8 text-center font-mono text-xs">
            Illustrative examples — written to show layout, not real customers
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="border-ds-border bg-ds-surface rounded-2xl border p-6">
                <p className="text-ds-text leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <p className="text-ds-muted mt-4 text-sm">
                  <span className="text-ds-text font-medium">{t.name}</span> · {t.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-ds-border border-t px-6 py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-ds-text mb-8 text-2xl font-bold">Questions</h2>
          <LabFaq items={FAQS} />
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="border-ds-border bg-ds-surface border-t px-6 py-20 text-center">
        <h2 className="text-ds-text text-2xl font-bold sm:text-3xl">
          Five minutes to your first dashboard.
        </h2>
        <div className="mx-auto mt-8 max-w-sm">
          <LabForm
            formType="saas-trial"
            submitLabel="Start free trial →"
            loadingLabel="Starting…"
            successTitle="You're in."
            successNote="This demo form sent a real email — check it worked."
            layout="stack"
          />
        </div>
        <p className="text-ds-muted mt-10 font-mono text-xs">
          Sample landing page by Adesh Shukla — Pulse is not a real product. The form above sends a
          real email to demonstrate a working submit flow.
        </p>
      </section>
    </main>
  )
}
