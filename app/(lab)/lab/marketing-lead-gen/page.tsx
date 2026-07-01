import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { LabForm } from '@/components/lab/LabForm'
import { LabFaq } from '@/components/lab/LabFaq'

export const metadata: Metadata = buildMetadata({
  title: 'Free Marketing Audit — Landing Page Sample',
  description:
    'Original lead-generation landing page sample by Adesh Shukla — low-friction lead magnet for a marketing agency, working demo form included.',
  canonical: '/lab/marketing-lead-gen',
  noIndex: true,
})

const STEPS = [
  { step: '01', label: 'Drop your site URL', desc: 'No login, no long form — just the basics.' },
  {
    step: '02',
    label: 'We run the audit',
    desc: 'SEO, page speed, and ad-spend leak checks — by a real person, not a bot.',
  },
  {
    step: '03',
    label: 'Get your report',
    desc: 'A short, plain-English breakdown sent to your inbox in 48 hours.',
  },
]

const TRUST_POINTS = [
  {
    title: 'No sales call required',
    desc: 'The audit itself is the pitch. You get the report either way.',
  },
  {
    title: 'A real person reviews it',
    desc: 'Not an automated scanner dump — someone actually looks at your funnel.',
  },
  { title: 'Plain-English findings', desc: 'No jargon, no 40-page PDF. Just what to fix first.' },
]

const TESTIMONIALS = [
  {
    quote:
      "The audit found a broken conversion tag we'd had for two months. Fixed it in an afternoon.",
    name: 'Ravi S.',
    role: 'Marketing Lead, illustrative example',
  },
  {
    quote: "Expected a sales pitch, got an actual audit. That's rare enough that I noticed.",
    name: 'Emma T.',
    role: 'Founder, illustrative example',
  },
]

const FAQS = [
  {
    question: 'Is this actually free, no catch?',
    answer:
      'Yes — the audit report is free. There is no follow-up sales call requirement to receive it.',
  },
  {
    question: 'What exactly gets checked?',
    answer:
      'Page speed and Core Web Vitals, basic on-page SEO, and common ad-tracking setup issues (broken pixels, mismatched UTM params).',
  },
  {
    question: 'How is my data used?',
    answer:
      'Your URL and email are used only to send the audit report — nothing is sold or shared with third parties.',
  },
]

export default function MarketingLeadGenLandingPage() {
  return (
    <main className="bg-ds-bg min-h-screen">
      {/* ── Hero ── */}
      <section className="border-ds-border border-b px-6 py-20 sm:py-28">
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-ds-purple mb-4 font-mono text-sm">FREE MARKETING AUDIT</p>
            <h1 className="text-ds-text text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
              Find out why your ads aren&apos;t converting — for free.
            </h1>
            <p className="text-ds-muted mt-6 max-w-md text-lg leading-relaxed">
              A 15-minute audit of your site and ad funnel. No sales call required to get it — just
              a report in your inbox.
            </p>
            <p className="text-ds-muted mt-6 font-mono text-xs">
              Limited to 10 audits this week · No card, no commitment
            </p>
          </div>

          {/* Lead-magnet card */}
          <div className="border-ds-border bg-ds-surface rounded-2xl border p-8">
            <h2 className="text-ds-text text-lg font-semibold">Get your free audit</h2>
            <div className="mt-6">
              <LabForm
                formType="marketing-audit"
                submitLabel="Send me my free audit →"
                loadingLabel="Sending…"
                successTitle="Request received."
                successNote="This demo form sent a real email — check it worked. In a real funnel this would trigger the audit workflow."
                accent="purple"
                layout="stack"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Process steps ── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.step}>
                <span className="text-ds-purple font-mono text-sm">{s.step}</span>
                <h3 className="text-ds-text mt-2 font-semibold">{s.label}</h3>
                <p className="text-ds-muted mt-2 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust points ── */}
      <section className="border-ds-border bg-ds-surface border-t px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {TRUST_POINTS.map((t) => (
              <div key={t.title}>
                <h3 className="text-ds-text font-semibold">{t.title}</h3>
                <p className="text-ds-muted mt-2 text-sm leading-relaxed">{t.desc}</p>
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
              <div key={t.name} className="border-ds-border bg-ds-bg rounded-2xl border p-6">
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
          Ten minutes from now, you&apos;ll know exactly what to fix.
        </h2>
        <div className="mx-auto mt-8 max-w-sm">
          <LabForm
            formType="marketing-audit"
            submitLabel="Get my free audit →"
            loadingLabel="Sending…"
            successTitle="Request received."
            successNote="This demo form sent a real email — check it worked."
            accent="purple"
            layout="stack"
          />
        </div>
        <p className="text-ds-muted mt-10 font-mono text-xs">
          Sample landing page by Adesh Shukla — not a real agency. The form above sends a real email
          to demonstrate a working submit flow.
        </p>
      </section>
    </main>
  )
}
