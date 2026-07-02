import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { ShapeCustomizer } from '@/components/lab/ShapeCustomizer'
import { BorderCustomizer } from '@/components/lab/BorderCustomizer'
import { ShadowCustomizer } from '@/components/lab/ShadowCustomizer'
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
  outline: `.outline-btn {
  position: relative;
}
.outline-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  border: 2px solid var(--accent);
  transform: scale(1.18);
  opacity: 0;
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.outline-btn:hover::before {
  transform: scale(1.08);
  opacity: 1;
}`,
  iconSlide: `.icon-slide-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
.icon-slide-btn .arrow {
  display: inline-block;
  transition: transform 0.3s ease;
}
.icon-slide-btn:hover .arrow {
  transform: translateX(6px);
}`,
  press: `.press-btn {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 4px 0 0 color-mix(in srgb, var(--accent) 60%, black);
}
.press-btn:hover {
  transform: translateY(-2px);
}
.press-btn:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 0 color-mix(in srgb, var(--accent) 60%, black);
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
            Every demo below is real, running CSS — pick a color and build a shape three different
            ways in the customizer, and copy the exact code for anything on this page.
          </p>
        </div>
      </section>

      {/* ── Interactive customizer ── */}
      <section className="border-ds-border border-b px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-ds-text mb-2 text-2xl font-bold">Customize it yourself</h2>
          <p className="text-ds-muted mb-8">
            11 presets, 4 independent corner-radius sliders, or drag actual points on a polygon to
            build a shape that doesn't exist anywhere else — then add an animation and copy the
            exact CSS for what's on screen.
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

      {/* ── Border customizer ── */}
      <section className="border-ds-border bg-ds-surface2/30 border-t px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-ds-text mb-2 text-2xl font-bold">Border functions</h2>
          <p className="text-ds-muted mb-8">
            6 real border techniques — gradient sweep, conic spin, marching ants, dashed rotate,
            double ring, and glow pulse — each with its own color, width, speed, and easing
            (including a custom cubic-bezier curve).
          </p>
          <BorderCustomizer />
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
            <DemoCard
              title="Outline halo"
              description="A ::before border scales in from outside and settles into place on hover."
              cssCode={BUTTON_CSS.outline}
            >
              <button
                type="button"
                className="outline-btn bg-ds-accent rounded-xl px-6 py-3 font-medium text-white"
              >
                Hover me
              </button>
            </DemoCard>
            <DemoCard
              title="Icon slide"
              description="A nested arrow span slides on hover — no JS, just a scoped child transition."
              cssCode={BUTTON_CSS.iconSlide}
            >
              <button
                type="button"
                className="icon-slide-btn bg-ds-accent rounded-xl px-6 py-3 font-medium text-white"
              >
                Get started <span className="arrow">→</span>
              </button>
            </DemoCard>
            <DemoCard
              title="Tactile press"
              description="A hard drop-shadow 'ledge' that compresses on :active — color-mix() for the shadow tone."
              cssCode={BUTTON_CSS.press}
            >
              <button
                type="button"
                className="press-btn bg-ds-accent rounded-xl px-6 py-3 font-medium text-white"
              >
                Press me
              </button>
            </DemoCard>
          </div>
        </div>
      </section>

      {/* ── Box-shadow animations ── */}
      <section className="border-ds-border bg-ds-surface2/30 border-t px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-ds-text mb-2 text-2xl font-bold">Box-shadow functions</h2>
          <p className="text-ds-muted mb-8">
            Glow pulse, depth lift, neon layering, and inset press — with color, blur, and spread
            control.
          </p>
          <ShadowCustomizer />
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

        .outline-btn { position: relative; }
        .outline-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          border: 2px solid var(--accent);
          transform: scale(1.18);
          opacity: 0;
          transition: transform 0.3s ease, opacity 0.3s ease;
        }
        .outline-btn:hover::before { transform: scale(1.08); opacity: 1; }

        .icon-slide-btn { display: inline-flex; align-items: center; gap: 0.5rem; }
        .icon-slide-btn .arrow { display: inline-block; transition: transform 0.3s ease; }
        .icon-slide-btn:hover .arrow { transform: translateX(6px); }

        .press-btn {
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          box-shadow: 0 4px 0 0 color-mix(in srgb, var(--accent) 60%, black);
        }
        .press-btn:hover { transform: translateY(-2px); }
        .press-btn:active {
          transform: translateY(2px);
          box-shadow: 0 2px 0 0 color-mix(in srgb, var(--accent) 60%, black);
        }

        @media (prefers-reduced-motion: reduce) {
          .blob-shape, .clip-morph, .conic-ring, .flip-card-inner, .ripple-btn::after {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </main>
  )
}
