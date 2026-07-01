import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { ShapeCustomizer } from '@/components/lab/ShapeCustomizer'
import { CssCodeBlock } from '@/components/lab/CssCodeBlock'

export const metadata: Metadata = buildMetadata({
  title: 'CSS Shapes & Animation Playground — Landing Page Sample',
  description:
    'A real, working showcase of modern CSS — a live shape + color customizer, animated borders, CTA button animations, and box-shadow effects, with copyable CSS on every demo.',
  canonical: '/lab/css-shapes-playground',
  noIndex: true,
})

const SHAPE_GALLERY_CSS = {
  blob: `.blob {
  border-radius: 42% 58% 65% 35% / 45% 45% 55% 55%;
  animation: blobMorph 6s ease-in-out infinite;
}
@keyframes blobMorph {
  0%, 100% { border-radius: 42% 58% 65% 35% / 45% 45% 55% 55%; }
  25%      { border-radius: 65% 35% 40% 60% / 55% 60% 40% 45%; }
  50%      { border-radius: 35% 65% 55% 45% / 40% 55% 45% 60%; }
  75%      { border-radius: 58% 42% 45% 55% / 60% 40% 60% 40%; }
}`,
  clip: `.clip-morph {
  animation: clipMorph 4s ease-in-out infinite alternate;
}
@keyframes clipMorph {
  0%   { clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%); }
  100% { clip-path: polygon(50% 15%, 85% 0%, 100% 70%, 60% 100%, 10% 85%); }
}`,
  ring: `.conic-ring {
  border-radius: 50%;
  background: conic-gradient(from 0deg, var(--accent), transparent 70%);
  animation: ringSpin 3s linear infinite;
}
@keyframes ringSpin {
  to { transform: rotate(360deg); }
}`,
  flip: `.flip-card { perspective: 800px; }
.flip-card-inner {
  transition: transform 0.6s;
  transform-style: preserve-3d;
}
.flip-card:hover .flip-card-inner {
  transform: rotateY(180deg);
}
.flip-card-face { backface-visibility: hidden; }
.flip-card-back { transform: rotateY(180deg); }`,
}

const BORDER_CSS = {
  gradient: `.gradient-border {
  border: 3px solid transparent;
  background:
    linear-gradient(#111827, #111827) padding-box,
    linear-gradient(90deg, var(--accent), transparent, var(--accent)) border-box;
  background-size: 300% 100%, 300% 100%;
  animation: borderSlide 3s linear infinite;
}
@keyframes borderSlide {
  to { background-position: 300% 0, 300% 0; }
}`,
  conic: `.conic-border {
  padding: 3px;
  border-radius: 16px;
  background: conic-gradient(from 0deg, var(--accent), transparent 50%, var(--accent));
  animation: spin 4s linear infinite;
}
.conic-border-inner {
  border-radius: 13px;
  background: #111827;
  height: 100%;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}`,
  ants: `.marching-border {
  border: 3px solid transparent;
  border-radius: 12px;
  background:
    linear-gradient(#111827, #111827) padding-box,
    repeating-linear-gradient(45deg, var(--accent) 0 10px, transparent 10px 20px) border-box;
  animation: marchAnts 1s linear infinite;
}
@keyframes marchAnts {
  to { background-position: 0 0, 28px 0; }
}`,
}

const BUTTON_CSS = {
  shine: `.shine-btn {
  position: relative;
  overflow: hidden;
}
.shine-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%);
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}
.shine-btn:hover::before {
  transform: translateX(100%);
}`,
  ripple: `.ripple-btn {
  position: relative;
}
.ripple-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: 0 0 0 0 var(--accent);
  animation: ripple 1.8s ease-out infinite;
}
@keyframes ripple {
  to { box-shadow: 0 0 0 14px transparent; }
}`,
  lift: `.lift-btn {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.lift-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px -6px var(--accent);
}`,
}

const SHADOW_CSS = {
  glow: `.glow-box {
  animation: glowPulse 2.4s ease-in-out infinite;
}
@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 12px 0 var(--accent); }
  50%      { box-shadow: 0 0 32px 8px var(--accent); }
}`,
  depth: `.depth-box {
  box-shadow: 0 2px 6px -2px rgba(0,0,0,0.3);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}
.depth-box:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px -12px rgba(0,0,0,0.5);
}`,
}

function DemoCard({
  title,
  description,
  cssCode,
  children,
}: {
  title: string
  description: string
  cssCode: string
  children: React.ReactNode
}) {
  return (
    <div className="border-ds-border bg-ds-surface flex flex-col gap-5 rounded-2xl border p-6">
      <div className="flex h-48 items-center justify-center">{children}</div>
      <div>
        <h3 className="text-ds-text font-semibold">{title}</h3>
        <p className="text-ds-muted mt-1 text-sm">{description}</p>
      </div>
      <CssCodeBlock code={cssCode} />
    </div>
  )
}

export default function CssShapesPlaygroundPage() {
  return (
    <main className="bg-ds-bg min-h-screen">
      {/* ── Hero ── */}
      <section className="border-ds-border border-b px-6 py-20 text-center sm:py-24">
        <div className="mx-auto max-w-2xl">
          <p className="text-ds-accent mb-4 font-mono text-sm">
            CSS SHAPES &amp; ANIMATION PLAYGROUND
          </p>
          <h1 className="text-ds-text text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
            Modern CSS, actually working.
          </h1>
          <p className="text-ds-muted mt-6 text-lg leading-relaxed">
            Every demo below is real, running CSS — pick a color and shape in the customizer, and
            copy the exact code for anything on this page.
          </p>
        </div>
      </section>

      {/* ── Interactive customizer ── */}
      <section className="border-ds-border border-b px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-ds-text mb-2 text-2xl font-bold">Customize it yourself</h2>
          <p className="text-ds-muted mb-8">
            Change the color, change the shape, toggle the spin — the CSS below updates live to
            match exactly what you're looking at.
          </p>
          <ShapeCustomizer />
        </div>
      </section>

      {/* ── Shape gallery ── */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-ds-text mb-8 text-2xl font-bold">Shape &amp; motion gallery</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <DemoCard
              title="Morphing blob"
              description="Four border-radius keyframes, each corner a different percentage."
              cssCode={SHAPE_GALLERY_CSS.blob}
            >
              <div className="blob-shape h-32 w-32" />
            </DemoCard>
            <DemoCard
              title="Clip-path polygon"
              description="Animating clip-path between two point sets — the browser tweens every vertex."
              cssCode={SHAPE_GALLERY_CSS.clip}
            >
              <div className="clip-morph h-32 w-32" />
            </DemoCard>
            <DemoCard
              title="Conic-gradient ring"
              description="conic-gradient() fading to transparent, rotated with a plain CSS animation."
              cssCode={SHAPE_GALLERY_CSS.ring}
            >
              <div className="conic-ring h-32 w-32 rounded-full" />
            </DemoCard>
            <DemoCard
              title="3D flip card"
              description="perspective + rotateY on hover — real 3D, not a fade crossover."
              cssCode={SHAPE_GALLERY_CSS.flip}
            >
              <div className="flip-card h-32 w-32">
                <div className="flip-card-inner">
                  <div className="flip-card-face flip-card-front">Hover</div>
                  <div className="flip-card-face flip-card-back">👋</div>
                </div>
              </div>
            </DemoCard>
          </div>
        </div>
      </section>

      {/* ── Border animations ── */}
      <section className="border-ds-border bg-ds-surface2/30 border-t px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-ds-text mb-8 text-2xl font-bold">Border animations</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <DemoCard
              title="Sliding gradient border"
              description="A padding-box/border-box double background, animated via background-position."
              cssCode={BORDER_CSS.gradient}
            >
              <div className="gradient-border flex h-28 w-28 items-center justify-center rounded-xl" />
            </DemoCard>
            <DemoCard
              title="Rotating conic border"
              description="An outer conic-gradient div wraps a solid inner div — the 'border' is really the gap."
              cssCode={BORDER_CSS.conic}
            >
              <div className="conic-border h-28 w-28">
                <div className="conic-border-inner" />
              </div>
            </DemoCard>
            <DemoCard
              title="Marching ants"
              description="A repeating-linear-gradient border-box background, animated into motion."
              cssCode={BORDER_CSS.ants}
            >
              <div className="marching-border h-28 w-28" />
            </DemoCard>
          </div>
        </div>
      </section>

      {/* ── CTA button animations ── */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-ds-text mb-8 text-2xl font-bold">CTA button animations</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <DemoCard
              title="Shine sweep"
              description="A gradient pseudo-element slides across on hover — try it."
              cssCode={BUTTON_CSS.shine}
            >
              <button
                type="button"
                className="shine-btn bg-ds-accent rounded-xl px-6 py-3 font-medium text-white"
              >
                Hover me
              </button>
            </DemoCard>
            <DemoCard
              title="Ripple pulse"
              description="A box-shadow ring expands and fades on a continuous loop."
              cssCode={BUTTON_CSS.ripple}
            >
              <button
                type="button"
                className="ripple-btn bg-ds-accent rounded-xl px-6 py-3 font-medium text-white"
              >
                Always pulsing
              </button>
            </DemoCard>
            <DemoCard
              title="Lift on hover"
              description="translateY plus a matching shadow — the classic tactile lift."
              cssCode={BUTTON_CSS.lift}
            >
              <button
                type="button"
                className="lift-btn bg-ds-accent rounded-xl px-6 py-3 font-medium text-white"
              >
                Hover me
              </button>
            </DemoCard>
          </div>
        </div>
      </section>

      {/* ── Box-shadow animations ── */}
      <section className="border-ds-border bg-ds-surface2/30 border-t px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-ds-text mb-8 text-2xl font-bold">Box-shadow animations</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <DemoCard
              title="Pulsing glow"
              description="box-shadow blur and spread animate on a loop — a breathing glow."
              cssCode={SHADOW_CSS.glow}
            >
              <div className="glow-box bg-ds-accent h-24 w-24 rounded-2xl" />
            </DemoCard>
            <DemoCard
              title="Depth lift on hover"
              description="A flat, close shadow becomes a large, soft one on hover — implies elevation."
              cssCode={SHADOW_CSS.depth}
            >
              <div className="depth-box bg-ds-surface2 border-ds-border h-24 w-24 rounded-2xl border" />
            </DemoCard>
          </div>
        </div>
      </section>

      <p className="text-ds-muted border-ds-border border-t px-6 py-8 text-center font-mono text-xs">
        Sample project by Adesh Shukla — every effect above is live CSS, copyable from this page.
      </p>

      <style>{`
        :root {
          --accent: var(--color-ds-accent);
        }

        /* ── Shape gallery ── */
        .blob-shape {
          background: var(--accent);
          animation: blobMorph 6s ease-in-out infinite;
        }
        @keyframes blobMorph {
          0%, 100% { border-radius: 42% 58% 65% 35% / 45% 45% 55% 55%; }
          25%      { border-radius: 65% 35% 40% 60% / 55% 60% 40% 45%; }
          50%      { border-radius: 35% 65% 55% 45% / 40% 55% 45% 60%; }
          75%      { border-radius: 58% 42% 45% 55% / 60% 40% 60% 40%; }
        }
        .clip-morph {
          background: var(--accent);
          animation: clipMorph 4s ease-in-out infinite alternate;
        }
        @keyframes clipMorph {
          0%   { clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%); }
          100% { clip-path: polygon(50% 15%, 85% 0%, 100% 70%, 60% 100%, 10% 85%); }
        }
        .conic-ring {
          background: conic-gradient(from 0deg, var(--accent), transparent 70%);
          animation: ringSpin 3s linear infinite;
        }
        @keyframes ringSpin {
          to { transform: rotate(360deg); }
        }
        .flip-card { perspective: 800px; }
        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.6s;
          transform-style: preserve-3d;
        }
        .flip-card:hover .flip-card-inner {
          transform: rotateY(180deg);
        }
        .flip-card-face {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          backface-visibility: hidden;
          border-radius: 16px;
          font-weight: 600;
          color: white;
        }
        .flip-card-front { background: var(--accent); }
        .flip-card-back { background: var(--accent); transform: rotateY(180deg); font-size: 2rem; }

        /* ── Borders ── */
        .gradient-border {
          border: 3px solid transparent;
          background:
            linear-gradient(var(--color-ds-surface), var(--color-ds-surface)) padding-box,
            linear-gradient(90deg, var(--accent), transparent, var(--accent)) border-box;
          background-size: 300% 100%, 300% 100%;
          animation: borderSlide 3s linear infinite;
        }
        @keyframes borderSlide {
          to { background-position: 300% 0, 300% 0; }
        }
        .conic-border {
          padding: 3px;
          border-radius: 16px;
          background: conic-gradient(from 0deg, var(--accent), transparent 50%, var(--accent));
          animation: ringSpin 4s linear infinite;
        }
        .conic-border-inner {
          border-radius: 13px;
          background: var(--color-ds-surface);
          height: 100%;
        }
        .marching-border {
          border: 3px solid transparent;
          border-radius: 12px;
          background:
            linear-gradient(var(--color-ds-surface), var(--color-ds-surface)) padding-box,
            repeating-linear-gradient(45deg, var(--accent) 0 10px, transparent 10px 20px) border-box;
          animation: marchAnts 1s linear infinite;
        }
        @keyframes marchAnts {
          to { background-position: 0 0, 28px 0; }
        }

        /* ── Buttons ── */
        .shine-btn { position: relative; overflow: hidden; }
        .shine-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.45) 50%, transparent 70%);
          transform: translateX(-100%);
          transition: transform 0.6s ease;
        }
        .shine-btn:hover::before { transform: translateX(100%); }

        .ripple-btn { position: relative; }
        .ripple-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          box-shadow: 0 0 0 0 var(--accent);
          animation: ripple 1.8s ease-out infinite;
          pointer-events: none;
        }
        @keyframes ripple {
          to { box-shadow: 0 0 0 14px transparent; }
        }

        .lift-btn { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .lift-btn:hover { transform: translateY(-3px); box-shadow: 0 10px 24px -6px var(--accent); }

        /* ── Box shadows ── */
        .glow-box { animation: glowPulse 2.4s ease-in-out infinite; }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 12px 0 var(--accent); }
          50%      { box-shadow: 0 0 32px 8px var(--accent); }
        }
        .depth-box {
          box-shadow: 0 2px 6px -2px rgba(0,0,0,0.3);
          transition: box-shadow 0.3s ease, transform 0.3s ease;
        }
        .depth-box:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px -12px rgba(0,0,0,0.5);
        }

        @media (prefers-reduced-motion: reduce) {
          .blob-shape, .clip-morph, .conic-ring, .flip-card-inner,
          .gradient-border, .conic-border, .marching-border,
          .ripple-btn::after, .glow-box {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </main>
  )
}
