import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { LabForm } from '@/components/lab/LabForm'
import { LabFaq } from '@/components/lab/LabFaq'

export const metadata: Metadata = buildMetadata({
  title: 'Maple Court Residences — Landing Page Sample',
  description:
    'Original real-estate listing lead-gen landing page sample by Adesh Shukla — sticky inquiry form, key-facts strip, working demo form included.',
  canonical: '/lab/real-estate-listing',
  noIndex: true,
})

const FACTS = [
  { label: 'Beds', value: '3' },
  { label: 'Baths', value: '2' },
  { label: 'Sq. ft.', value: '1,450' },
  { label: 'Price', value: '$429,000' },
]

const ROOMS = [
  { label: 'Living Room', note: 'East-facing, morning light' },
  { label: 'Kitchen', note: 'Recently renovated' },
  { label: 'Primary Bedroom', note: 'Walk-in closet' },
  { label: 'Balcony', note: 'Private, city view' },
]

const HIGHLIGHTS = [
  'Move-in ready — recently renovated kitchen and bathrooms',
  '5-minute walk to transit, 12 minutes to downtown',
  'Private balcony with east-facing morning light',
  'Dedicated parking spot included',
]

const NEIGHBORHOOD = [
  { title: 'Transit', desc: '5 min walk to the metro line, 12 min to downtown.' },
  { title: 'Groceries', desc: 'Full-size grocery store two blocks over.' },
  { title: 'Schools', desc: 'Rated well by local district scores within 1 mile.' },
]

const TESTIMONIALS = [
  {
    quote:
      'The tour was scheduled within an hour of asking. Whole process felt unusually organized.',
    name: 'Chloe R.',
    role: 'Buyer, illustrative example',
  },
]

const FAQS = [
  {
    question: 'Is the listed price negotiable?',
    answer:
      'Offers are considered on a case-by-case basis after a tour — reach out to discuss specifics.',
  },
  {
    question: 'When is the unit available?',
    answer: 'Move-in ready now — the listing reflects current, up-to-date availability.',
  },
  {
    question: 'Are pets allowed in the building?',
    answer: 'Building policy allows pets under 25kg — ask on the tour for full details.',
  },
]

export default function RealEstateListingLandingPage() {
  return (
    <main className="bg-ds-bg min-h-screen">
      {/* ── Hero ── */}
      <section className="border-ds-border relative flex h-72 items-end border-b bg-[linear-gradient(135deg,var(--color-ds-surface)_0%,var(--color-ds-surface2)_100%)] sm:h-96">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-ds-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-ds-border)_1px,transparent_1px)] bg-[size:48px_48px] opacity-30"
        />
        <div className="relative mx-auto w-full max-w-5xl px-6 pb-8">
          <p className="text-ds-accent font-mono text-sm">FOR SALE · MAPLE COURT</p>
          <h1 className="text-ds-text mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Maple Court Residences, Unit 4B
          </h1>
        </div>
      </section>

      {/* ── Facts strip ── */}
      <section className="border-ds-border bg-ds-surface border-b px-6 py-6">
        <div className="mx-auto flex max-w-5xl flex-wrap gap-x-10 gap-y-4">
          {FACTS.map((f) => (
            <div key={f.label}>
              <p className="text-ds-text text-xl font-bold">{f.value}</p>
              <p className="text-ds-muted text-sm">{f.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Room gallery (illustrative placeholders, not real photos) ── */}
      <section className="px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {ROOMS.map((room) => (
              <div
                key={room.label}
                className="border-ds-border bg-ds-surface flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center"
              >
                <span className="text-ds-border2 font-mono text-2xl select-none">▢</span>
                <p className="text-ds-text text-sm font-medium">{room.label}</p>
                <p className="text-ds-muted text-xs">{room.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Body + sticky form ── */}
      <section className="px-6 py-8">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-12 lg:grid-cols-[1fr_360px]">
          {/* Details */}
          <div>
            <h2 className="text-ds-text text-2xl font-bold">About this home</h2>
            <p className="text-ds-muted mt-4 leading-relaxed">
              A bright, recently renovated 3-bedroom unit in a quiet, well-maintained building.
              Close to transit and everyday essentials, with thoughtful upgrades throughout.
            </p>

            <h3 className="text-ds-text mt-10 font-semibold">Highlights</h3>
            <ul className="mt-4 flex flex-col gap-3">
              {HIGHLIGHTS.map((h) => (
                <li key={h} className="flex items-start gap-3">
                  <span className="bg-ds-accent mt-2 h-1.5 w-1.5 shrink-0 rounded-full" />
                  <span className="text-ds-muted">{h}</span>
                </li>
              ))}
            </ul>

            <h3 className="text-ds-text mt-10 font-semibold">Neighborhood</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {NEIGHBORHOOD.map((n) => (
                <div key={n.title}>
                  <p className="text-ds-text text-sm font-medium">{n.title}</p>
                  <p className="text-ds-muted mt-1 text-sm">{n.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sticky inquiry form */}
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <div className="border-ds-border bg-ds-surface rounded-2xl border p-6">
              <h2 className="text-ds-text font-semibold">Request a tour</h2>
              <p className="text-ds-muted mt-1 text-sm">
                An agent typically responds within an hour.
              </p>
              <div className="mt-5">
                <LabForm
                  formType="real-estate"
                  submitLabel="Schedule a tour →"
                  loadingLabel="Sending…"
                  successTitle="Request sent."
                  successNote="This demo form sent a real email — check it worked. In a real listing this would notify the agent."
                  layout="stack"
                />
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* ── Testimonial ── */}
      <section className="border-ds-border mt-8 border-t px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-ds-muted mb-6 font-mono text-xs">
            Illustrative example — written to show layout, not a real buyer
          </p>
          {TESTIMONIALS.map((t) => (
            <div key={t.name}>
              <p className="text-ds-text text-lg leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <p className="text-ds-muted mt-4 text-sm">
                <span className="text-ds-text font-medium">{t.name}</span> · {t.role}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-ds-border bg-ds-surface border-t px-6 py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-ds-text mb-8 text-2xl font-bold">Questions</h2>
          <LabFaq items={FAQS} />
        </div>
      </section>

      <p className="text-ds-muted border-ds-border border-t px-6 py-8 text-center font-mono text-xs">
        Sample landing page by Adesh Shukla — not a real listing or agency. The form above sends a
        real email to demonstrate a working submit flow.
      </p>
    </main>
  )
}
