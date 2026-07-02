'use client'

import { useMemo, useState } from 'react'
import { CssCodeBlock } from './CssCodeBlock'
import {
  CubicBezierEditor,
  DEFAULT_BEZIER,
  bezierToCss,
  type BezierPoint,
} from './CubicBezierEditor'

const COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Amber', value: '#f59e0b' },
]

type Technique =
  | 'gradientSweep'
  | 'conicSpin'
  | 'marchingAnts'
  | 'dashedRotate'
  | 'doubleRing'
  | 'glowPulse'

const TECHNIQUES: { key: Technique; label: string }[] = [
  { key: 'gradientSweep', label: 'Gradient sweep' },
  { key: 'conicSpin', label: 'Conic spin' },
  { key: 'marchingAnts', label: 'Marching ants' },
  { key: 'dashedRotate', label: 'Dashed rotate' },
  { key: 'doubleRing', label: 'Double ring' },
  { key: 'glowPulse', label: 'Glow pulse' },
]

/**
 * Six real border techniques, each with color/width/speed/easing control —
 * turns the border section from a fixed gallery into something you can
 * actually tune, not just look at.
 */
export function BorderCustomizer() {
  const [technique, setTechnique] = useState<Technique>('gradientSweep')
  const [color, setColor] = useState(COLORS[0].value)
  const [width, setWidth] = useState(3)
  const [duration, setDuration] = useState(3)
  const [easing, setEasing] = useState<'linear' | 'ease-in-out' | 'custom'>('linear')
  const [bezier, setBezier] = useState<[BezierPoint, BezierPoint]>(DEFAULT_BEZIER)

  const easingCss = easing === 'custom' ? bezierToCss(bezier) : easing

  const { previewStyle, previewInnerStyle, css } = useMemo(() => {
    const anim = `${duration}s ${easingCss} infinite`
    switch (technique) {
      case 'gradientSweep':
        return {
          previewStyle: {
            border: `${width}px solid transparent`,
            borderRadius: '16px',
            background: `linear-gradient(var(--color-ds-surface), var(--color-ds-surface)) padding-box, linear-gradient(90deg, ${color}, transparent, ${color}) border-box`,
            backgroundSize: '300% 100%, 300% 100%',
            animation: `bcGradientSweep ${anim}`,
          } as React.CSSProperties,
          previewInnerStyle: undefined,
          css: `.gradient-border {
  border: ${width}px solid transparent;
  border-radius: 16px;
  background:
    linear-gradient(#0b0f19, #0b0f19) padding-box,
    linear-gradient(90deg, ${color}, transparent, ${color}) border-box;
  background-size: 300% 100%, 300% 100%;
  animation: gradientSweep ${anim};
}
@keyframes gradientSweep {
  to { background-position: 300% 0, 300% 0; }
}`,
        }
      case 'conicSpin':
        return {
          previewStyle: {
            padding: `${width}px`,
            borderRadius: '16px',
            background: `conic-gradient(from 0deg, ${color}, transparent 50%, ${color})`,
            animation: `bcConicSpin ${anim}`,
          } as React.CSSProperties,
          previewInnerStyle: {
            borderRadius: '13px',
            background: 'var(--color-ds-surface)',
            height: '100%',
          } as React.CSSProperties,
          css: `.conic-border {
  padding: ${width}px;
  border-radius: 16px;
  background: conic-gradient(from 0deg, ${color}, transparent 50%, ${color});
  animation: conicSpin ${anim};
}
.conic-border-inner {
  border-radius: 13px;
  background: #0b0f19;
  height: 100%;
}
@keyframes conicSpin {
  to { transform: rotate(360deg); }
}`,
        }
      case 'marchingAnts':
        return {
          previewStyle: {
            border: `${width}px solid transparent`,
            borderRadius: '12px',
            background: `linear-gradient(var(--color-ds-surface), var(--color-ds-surface)) padding-box, repeating-linear-gradient(45deg, ${color} 0 10px, transparent 10px 20px) border-box`,
            animation: `bcMarchingAnts ${anim}`,
          } as React.CSSProperties,
          previewInnerStyle: undefined,
          css: `.marching-border {
  border: ${width}px solid transparent;
  border-radius: 12px;
  background:
    linear-gradient(#0b0f19, #0b0f19) padding-box,
    repeating-linear-gradient(45deg, ${color} 0 10px, transparent 10px 20px) border-box;
  animation: marchingAnts ${anim};
}
@keyframes marchingAnts {
  to { background-position: 0 0, 28px 0; }
}`,
        }
      case 'dashedRotate':
        return {
          previewStyle: {
            border: `${width}px dashed ${color}`,
            borderRadius: '50%',
            animation: `bcDashedRotate ${anim}`,
          } as React.CSSProperties,
          previewInnerStyle: undefined,
          css: `.dashed-border {
  border: ${width}px dashed ${color};
  border-radius: 50%;
  animation: dashedRotate ${anim};
}
@keyframes dashedRotate {
  to { transform: rotate(360deg); }
}`,
        }
      case 'doubleRing':
        return {
          previewStyle: {
            border: `${width}px solid ${color}`,
            borderRadius: '16px',
            boxShadow: `0 0 0 ${width * 2}px transparent, 0 0 0 ${width * 3}px ${color}`,
            animation: `bcDoubleRing ${anim}`,
            '--bc-color': color,
            '--bc-width': `${width}px`,
          } as React.CSSProperties,
          previewInnerStyle: undefined,
          css: `.double-ring {
  border: ${width}px solid ${color};
  border-radius: 16px;
  box-shadow: 0 0 0 ${width * 2}px transparent, 0 0 0 ${width * 3}px ${color};
  animation: doubleRing ${anim};
}
@keyframes doubleRing {
  0%, 100% { box-shadow: 0 0 0 ${width * 2}px transparent, 0 0 0 ${width * 3}px ${color}; }
  50% { box-shadow: 0 0 0 ${width}px transparent, 0 0 0 ${width * 2}px ${color}; }
}`,
        }
      case 'glowPulse':
        return {
          previewStyle: {
            border: `${width}px solid ${color}`,
            borderRadius: '16px',
            animation: `bcGlowPulse ${anim}`,
            '--bc-color': color,
          } as React.CSSProperties,
          previewInnerStyle: undefined,
          css: `.glow-border {
  border: ${width}px solid ${color};
  border-radius: 16px;
  animation: glowPulse ${anim};
}
@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 6px 0 ${color}; }
  50% { box-shadow: 0 0 20px 4px ${color}; }
}`,
        }
    }
  }, [technique, color, width, duration, easingCss])

  return (
    <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[280px_1fr]">
      <div className="border-ds-border bg-ds-surface flex aspect-square items-center justify-center rounded-2xl border p-8">
        <div className="h-32 w-32" style={previewStyle}>
          {previewInnerStyle && <div style={previewInnerStyle} />}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div>
          <p className="text-ds-muted mb-3 font-mono text-xs tracking-wide uppercase">
            Technique ({TECHNIQUES.length} functions)
          </p>
          <div className="flex flex-wrap gap-2">
            {TECHNIQUES.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTechnique(t.key)}
                aria-pressed={technique === t.key}
                className={
                  technique === t.key
                    ? 'bg-ds-accent rounded-lg px-3 py-1.5 text-sm font-medium text-white'
                    : 'border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent rounded-lg border px-3 py-1.5 text-sm transition-colors'
                }
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-ds-muted mb-3 font-mono text-xs tracking-wide uppercase">Color</p>
            <div className="flex flex-wrap gap-3">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  aria-label={`Set color to ${c.name}`}
                  aria-pressed={color === c.value}
                  className="h-8 w-8 shrink-0 rounded-full transition-transform hover:scale-110"
                  style={{
                    background: c.value,
                    boxShadow:
                      color === c.value
                        ? `0 0 0 2px var(--color-ds-bg), 0 0 0 4px ${c.value}`
                        : undefined,
                  }}
                />
              ))}
            </div>
          </div>

          <label className="text-ds-muted flex flex-col gap-1 text-xs">
            Width — {width}px
            <input
              type="range"
              min={1}
              max={8}
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="accent-ds-accent"
            />
          </label>

          <label className="text-ds-muted flex flex-col gap-1 text-xs">
            Speed — {duration}s
            <input
              type="range"
              min={1}
              max={8}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="accent-ds-accent"
            />
          </label>
        </div>

        <div>
          <p className="text-ds-muted mb-3 font-mono text-xs tracking-wide uppercase">Easing</p>
          <div className="flex flex-wrap gap-2">
            {(['linear', 'ease-in-out', 'custom'] as const).map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEasing(e)}
                aria-pressed={easing === e}
                className={
                  easing === e
                    ? 'bg-ds-accent rounded-lg px-3 py-1.5 text-sm font-medium text-white'
                    : 'border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent rounded-lg border px-3 py-1.5 text-sm transition-colors'
                }
              >
                {e}
              </button>
            ))}
          </div>
          {easing === 'custom' && (
            <div className="mt-3">
              <CubicBezierEditor value={bezier} onChange={setBezier} />
            </div>
          )}
        </div>

        <CssCodeBlock code={css} />
      </div>

      <style>{`
        @keyframes bcGradientSweep { to { background-position: 300% 0, 300% 0; } }
        @keyframes bcConicSpin { to { transform: rotate(360deg); } }
        @keyframes bcMarchingAnts { to { background-position: 0 0, 28px 0; } }
        @keyframes bcDashedRotate { to { transform: rotate(360deg); } }
        @keyframes bcDoubleRing {
          0%, 100% { box-shadow: 0 0 0 calc(var(--bc-width, 3px) * 2) transparent, 0 0 0 calc(var(--bc-width, 3px) * 3) var(--bc-color, #3b82f6); }
          50% { box-shadow: 0 0 0 var(--bc-width, 3px) transparent, 0 0 0 calc(var(--bc-width, 3px) * 2) var(--bc-color, #3b82f6); }
        }
        @keyframes bcGlowPulse {
          0%, 100% { box-shadow: 0 0 6px 0 var(--bc-color, #3b82f6); }
          50% { box-shadow: 0 0 20px 4px var(--bc-color, #3b82f6); }
        }
      `}</style>
    </div>
  )
}
