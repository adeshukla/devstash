import type { CSSProperties, ReactNode } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { HeroStage } from '@/components/ui/HeroStage'
import { projectBrand } from '@/components/icons/ProjectMark'

// Server Component. Everything visible — including the <h1>, the page's LCP
// element — is server-rendered and painted from the first frame. HeroStage
// (client) only adds behaviour: the first-visit design → code → live intro,
// the "View as" switch, the word animations and the evidence-panel cycling.
//
// Never wrap the <h1> in MountReveal or anything that starts it hidden —
// that has cost LCP twice before. The intro overlays sit ON TOP of the live
// hero instead, so the heading is already painted underneath them.

// Set before first paint on a first visit this session (same plain-<script>
// pattern as the theme init in app/layout.tsx), so the design overlay is up
// from the very first frame instead of flashing in after hydration.
const INTRO_INIT = `(function(){try{if(!sessionStorage.getItem('ds-hero-intro-seen')&&!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.setAttribute('data-hero-intro','')}catch(e){}})()`

const SHIPPED = ['pare', 'praxis', 'build-components', 'motion-lab'] as const
const SHIPPED_NAMES: Record<(typeof SHIPPED)[number], string> = {
  pare: 'Pare',
  praxis: 'Praxis',
  'build-components': 'Build Components',
  'motion-lab': 'Motion Lab',
}

const i = (n: number) => ({ '--i': n }) as CSSProperties

function Word({ k, text, children }: { k: string; text: string; children?: ReactNode }) {
  return (
    <span className={`hero-w hero-w-${k}`} data-k={k}>
      {[...text].map((c, n) => (
        <span key={n} className="ch" style={i(n)}>
          {c === ' ' ? ' ' : c}
        </span>
      ))}
      {children}
    </span>
  )
}

const itemClass =
  'hero-item border-ds-border bg-ds-bg grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border px-3 py-2.5'
const icoClass = 'grid h-8 w-8 place-items-center rounded-lg font-mono text-[11px] font-bold'

function EvidencePanel() {
  return (
    <section
      className="hero-panel border-ds-border bg-ds-surface overflow-hidden rounded-[20px] border shadow-[0_40px_80px_-50px_rgb(0_0_0/0.6)]"
      aria-label="What each promise means in practice"
    >
      <div className="border-ds-border relative flex border-b" role="tablist">
        {(
          [
            ['fast', 'fast'],
            ['acc', 'accessible'],
            ['last', 'built to last'],
          ] as const
        ).map(([k, label], n) => (
          <button
            key={k}
            type="button"
            role="tab"
            id={`hero-tab-${k}`}
            aria-controls={`hero-view-${k}`}
            aria-selected={n === 0}
            data-k={k}
            className="hero-tab text-ds-muted hover:text-ds-text aria-selected:text-ds-text flex-1 px-2 py-3.5 font-mono text-[13px] font-semibold transition-colors"
          >
            {label}
          </button>
        ))}
        <span className="hero-ind absolute -bottom-px left-0 h-0.5 w-1/3 overflow-hidden rounded-sm">
          <i />
        </span>
      </div>

      <div className="grid">
        <div
          id="hero-view-fast"
          role="tabpanel"
          aria-labelledby="hero-tab-fast"
          data-k="fast"
          className="hero-view on flex flex-col gap-3.5 p-6"
        >
          <h2 className="text-ds-text text-lg font-bold tracking-tight">
            The speed budget every page is held to
          </h2>
          <p className="text-ds-muted -mt-1.5 text-[13.5px] leading-snug">
            Google&apos;s &ldquo;good&rdquo; thresholds, used as hard limits — not one-off scores.
          </p>
          {(
            [
              ['LCP', 'Main content painted', 'largest element on screen', '< 2.5s'],
              ['CLS', 'Nothing jumps around', 'layout shift while loading', '< 0.1'],
              ['INP', 'Responds to every tap', 'delay after an interaction', '< 200ms'],
            ] as const
          ).map(([ico, title, sub, val], n) => (
            <div key={ico} className={itemClass} style={i(n)}>
              <span className={`${icoClass} bg-ds-accent/15 text-ds-accent-strong`}>{ico}</span>
              <span>
                <b className="text-ds-text block text-sm font-semibold">{title}</b>
                <small className="text-ds-muted text-xs">{sub}</small>
              </span>
              <span className="text-ds-text font-mono text-[13px] font-semibold">{val}</span>
            </div>
          ))}
          <p className="text-ds-muted mt-auto font-mono text-xs">
            {'// heavy extras (video, animations) load only when you reach them'}
          </p>
        </div>

        <div
          id="hero-view-acc"
          role="tabpanel"
          aria-labelledby="hero-tab-acc"
          data-k="acc"
          inert
          className="hero-view flex flex-col gap-3.5 p-6"
        >
          <h2 className="text-ds-text text-lg font-bold tracking-tight">
            Contrast, measured live in your browser
          </h2>
          <p className="text-ds-muted -mt-1.5 text-[13.5px] leading-snug">
            Computed right now from this page&apos;s own colours, with the WCAG 2 formula.
          </p>
          {(
            [
              ['text', 'Headings', 'text on background'],
              ['muted', 'Body text', 'muted on background'],
              ['link', 'Links', 'blue on background'],
              ['btn', 'Buttons', 'white on blue'],
            ] as const
          ).map(([pair, title, sub], n) => (
            <div key={pair} className={itemClass} style={i(n)} data-pair={pair}>
              <span className="hero-sw border-ds-border2 grid h-8 w-8 place-items-center rounded-lg border text-sm font-bold">
                Aa
              </span>
              <span>
                <b className="text-ds-text block text-sm font-semibold">{title}</b>
                <small className="text-ds-muted text-xs">{sub}</small>
              </span>
              <span className="text-ds-text font-mono text-[13px] font-semibold whitespace-nowrap">
                <span className="hero-ratio">—</span>
                <span className="hero-grade ml-2 rounded-md px-1.5 py-0.5 text-[11px]" />
              </span>
            </div>
          ))}
          <p className="text-ds-muted mt-auto font-mono text-xs">
            {'// plus automated axe checks on 9 routes, keyboard focus on everything'}
          </p>
        </div>

        <div
          id="hero-view-last"
          role="tabpanel"
          aria-labelledby="hero-tab-last"
          data-k="last"
          inert
          className="hero-view flex flex-col gap-3.5 p-6"
        >
          <h2 className="text-ds-text text-lg font-bold tracking-tight">What keeps it standing</h2>
          <p className="text-ds-muted -mt-1.5 text-[13.5px] leading-snug">
            Checks the site actually runs — not adjectives.
          </p>
          {(
            [
              ['TS', 'TypeScript, strict mode', '0 errors before anything ships'],
              ['CI', 'Typecheck, lint and build on every push', 'GitHub Actions'],
              ['QA', 'Responsive from 320px phones to 1440px', 'automated overflow checks'],
              ['{}', 'Structured data on every page', 'for search engines and AI answers'],
            ] as const
          ).map(([ico, title, sub], n) => (
            <div key={ico} className={itemClass} style={i(n)}>
              <span className={`${icoClass} bg-ds-purple/20 text-ds-purple`}>{ico}</span>
              <span>
                <b className="text-ds-text block text-sm font-semibold">{title}</b>
                <small className="text-ds-muted text-xs">{sub}</small>
              </span>
              <span className="text-ds-success font-mono text-sm" aria-label="passing">
                ✓
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Design overlay: the same hero as a wireframe with spec labels ──
const tag =
  'bg-ds-accent absolute -top-[22px] left-0 z-[2] rounded px-1.5 py-1 font-mono text-[10.5px] leading-none font-semibold whitespace-nowrap text-white'
const block = 'bg-ds-surface2 block rounded-md'

function DesignView() {
  return (
    <div className="grid h-full gap-12 pt-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center">
      <div className="outline-ds-accent/55 relative outline-1 outline-offset-[10px] outline-dashed">
        <span className={tag}>Frame · 1.15fr column</span>
        <i className={`${block} mb-6 h-3 w-[58%]`} />
        <div className="relative mb-6 grid gap-3">
          <span className={tag}>h1 · DM Sans 700 · 80 / 1.03</span>
          <i className={`${block} bg-ds-text/15 h-[clamp(30px,4.4vw,62px)] w-[72%]`} />
          <i className={`${block} bg-ds-text/15 h-[clamp(30px,4.4vw,62px)] w-[96%]`} />
          <i className={`${block} bg-ds-text/15 h-[clamp(30px,4.4vw,62px)] w-[64%]`} />
        </div>
        <div className="relative mb-6 grid gap-3">
          <span className={tag}>p · 17 / 1.65 · muted</span>
          <i className={`${block} h-3 w-[98%]`} />
          <i className={`${block} h-3 w-[90%]`} />
          <i className={`${block} h-3 w-[56%]`} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="border-ds-accent text-ds-accent rounded-xl border-[1.5px] px-4 py-3 font-mono text-xs font-semibold">
            Button / Primary
          </span>
          <span className="border-ds-border2 text-ds-muted rounded-xl border-[1.5px] border-dashed px-4 py-3 font-mono text-xs font-semibold">
            Button / Outline
          </span>
        </div>
      </div>
      <div className="outline-ds-accent/55 bg-ds-surface/60 relative hidden rounded-[20px] p-5 outline-1 outline-offset-[10px] outline-dashed lg:block">
        <span className={tag}>Evidence panel · tabs × 3</span>
        <div className="mb-5 grid grid-cols-3 gap-3">
          <i className={`${block} h-3.5`} />
          <i className={`${block} h-3.5`} />
          <i className={`${block} h-3.5`} />
        </div>
        <div className="grid gap-3">
          {[0, 1, 2, 3].map((n) => (
            <i key={n} className={`${block} h-14 rounded-xl`} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Code overlay: a simplified version of the component that renders it ──
const k = (s: string) => <span className="text-ds-purple">{s}</span>
const t = (s: string) => <span className="text-ds-accent">{s}</span>
const a = (s: string) => <span className="text-ds-warning">{s}</span>
const s = (v: string) => <span className="text-ds-success">{v}</span>
const CODE: ReactNode[] = [
  <>
    {k('export function')} {t('Hero')}() {'{'}
  </>,
  <>
    {'  '}
    {k('return')} (
  </>,
  <>
    {'    <'}
    {t('section')} {a('className')}={s('"grid lg:grid-cols-[1.15fr_.85fr] gap-12"')}
    {'>'}
  </>,
  <>
    {'      <'}
    {t('Status')}
    {'>'}Available for frontend roles · Anywhere in India{'</'}
    {t('Status')}
    {'>'}
  </>,
  <>
    {'      <'}
    {t('h1')}
    {'>'}
  </>,
  <>{'        Web interfaces that ship —'}</>,
  <>
    {'        <'}
    {t('Word')} {a('fx')}={s('"streak"')}
    {'>'}fast{'</'}
    {t('Word')}
    {'>'}, {'<'}
    {t('Word')} {a('fx')}={s('"focus-ring"')}
    {'>'}accessible{'</'}
    {t('Word')}
    {'>'},
  </>,
  <>
    {'        <'}
    {t('Word')} {a('fx')}={s('"stack"')}
    {'>'}built to last{'</'}
    {t('Word')}
    {'>'}.
  </>,
  <>
    {'      </'}
    {t('h1')}
    {'>'}
  </>,
  <>
    {'      <'}
    {t('Button')} {a('href')}={s('"/projects"')}
    {'>'}View Projects{'</'}
    {t('Button')}
    {'>'}
  </>,
  <>
    {'      <'}
    {t('EvidencePanel')} {a('tabs')}={'{['}
    {s("'fast'")}, {s("'accessible'")}, {s("'built to last'")}
    {']}'} /{'>'}
  </>,
  <>
    {'    </'}
    {t('section')}
    {'>'}
  </>,
  <>{'  )'}</>,
  <>{'}'}</>,
]

function CodeView() {
  return (
    <div className="flex h-full items-center pt-8">
      <div className="border-ds-border bg-ds-surface w-full overflow-hidden rounded-2xl border">
        <div className="border-ds-border text-ds-muted flex items-center gap-2 border-b px-4 py-3 font-mono text-xs">
          <span className="bg-ds-error/80 h-2.5 w-2.5 rounded-full" />
          <span className="bg-ds-warning/80 h-2.5 w-2.5 rounded-full" />
          <span className="bg-ds-success/80 h-2.5 w-2.5 rounded-full" />
          <span className="text-ds-text ml-2">HeroSection.tsx</span>
          <span className="ml-auto">simplified</span>
        </div>
        <pre className="hero-code text-ds-text m-0 overflow-x-auto px-6 py-5 font-mono text-[clamp(11px,1.25vw,15px)] leading-[1.85]">
          <code>
            {CODE.map((line, n) => (
              <span key={n} className="hero-ln" style={i(n)}>
                {line}
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  )
}

export function HeroSection() {
  return (
    <section className="relative pt-6 pb-16 sm:pt-10 sm:pb-24 lg:pb-28">
      <script
        id="hero-intro-init"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: INTRO_INIT }}
      />
      <div className="mx-auto max-w-7xl px-6">
        <HeroStage design={<DesignView />} code={<CodeView />}>
          <div className="grid gap-12 pt-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center lg:gap-14">
            <div>
              <p className="text-ds-muted flex items-center gap-2 font-mono text-[13px]">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="bg-ds-success absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                  <span className="bg-ds-success relative inline-flex h-2 w-2 rounded-full" />
                </span>
                Available for frontend roles · Anywhere in India · Remote/Hybrid
              </p>

              <h1 className="text-ds-text mt-5 mb-6 text-[clamp(36px,5.6vw,80px)] leading-[1.03] font-bold tracking-[-0.035em]">
                <span className="text-ds-muted mb-[0.14em] block text-[0.58em] font-semibold tracking-[-0.02em]">
                  Web interfaces that ship —
                </span>
                <Word k="fast" text="fast" />,{' '}
                <Word k="acc" text="accessible">
                  <span className="hero-ring" />
                </Word>
                ,<br />
                <Word k="last" text="built to last">
                  <span className="hero-base" />
                </Word>
                .
              </h1>

              {/* Keep the <strong> followed by punctuation rather than a
                  space: JSX trims leading whitespace on a new line, and
                  Prettier rewrites a `{' '}` fix straight back. */}
              <p className="text-ds-muted max-w-[54ch] text-base leading-relaxed sm:text-[17px]">
                I&apos;m Adesh Shukla. I started in accounts, got drawn in by UX, and came out an
                analyst who builds front-ends.{' '}
                <strong className="text-ds-text font-semibold">6+ years</strong> on the web, mostly
                landing pages at volume —{' '}
                <strong className="text-ds-text font-semibold">200+</strong> for US clients.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-x-9 gap-y-5">
                <div className="flex flex-wrap gap-3">
                  <Button href="/projects" size="lg">
                    View Projects
                  </Button>
                  <Button href="/contact" variant="outline" size="lg">
                    Get in Touch
                  </Button>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-ds-muted font-mono text-xs">shipped:</span>
                  {SHIPPED.map((slug) => {
                    const { Mark } = projectBrand(slug)
                    return (
                      <Link
                        key={slug}
                        href={`/projects/${slug}`}
                        aria-label={SHIPPED_NAMES[slug]}
                        title={SHIPPED_NAMES[slug]}
                        className="block h-7 w-7 overflow-hidden rounded-lg transition-transform duration-300 hover:-translate-y-0.5 hover:-rotate-6 [&>svg]:h-full [&>svg]:w-full"
                      >
                        <Mark />
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>

            <EvidencePanel />
          </div>
        </HeroStage>
      </div>
    </section>
  )
}
