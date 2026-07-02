'use client'

import { useMemo, useState } from 'react'
import { CssCodeBlock } from './CssCodeBlock'

const COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Amber', value: '#f59e0b' },
]

type Technique = 'glowPulse' | 'depthLift' | 'neonLayers' | 'insetPress'

const TECHNIQUES: { key: Technique; label: string }[] = [
  { key: 'glowPulse', label: 'Glow pulse' },
  { key: 'depthLift', label: 'Depth lift' },
  { key: 'neonLayers', label: 'Neon layers' },
  { key: 'insetPress', label: 'Inset press' },
]

/**
 * Four box-shadow techniques with live color/blur/spread control — same
 * "actually tune it" treatment as the shape and border customizers.
 */
export function ShadowCustomizer() {
  const [technique, setTechnique] = useState<Technique>('glowPulse')
  const [color, setColor] = useState(COLORS[0].value)
  const [blur, setBlur] = useState(24)
  const [spread, setSpread] = useState(4)

  const { previewStyle, css } = useMemo(() => {
    switch (technique) {
      case 'glowPulse':
        return {
          previewStyle: {
            background: color,
            animation: 'shGlowPulse 2.4s ease-in-out infinite',
            '--sh-color': color,
            '--sh-blur': `${blur}px`,
            '--sh-spread': `${spread}px`,
          } as React.CSSProperties,
          css: `.glow-box {
  background: ${color};
  animation: glowPulse 2.4s ease-in-out infinite;
}
@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 ${Math.round(blur / 2)}px 0 ${color}; }
  50%      { box-shadow: 0 0 ${blur}px ${spread}px ${color}; }
}`,
        }
      case 'depthLift':
        return {
          previewStyle: {
            background: 'var(--color-ds-surface2)',
            border: '1px solid var(--color-ds-border)',
            boxShadow: '0 2px 6px -2px rgba(0,0,0,0.3)',
            transition: 'box-shadow 0.3s ease, transform 0.3s ease',
          } as React.CSSProperties,
          css: `.depth-box {
  box-shadow: 0 2px 6px -2px rgba(0,0,0,0.3);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}
.depth-box:hover {
  transform: translateY(-4px);
  box-shadow: 0 ${blur}px ${blur * 2}px -12px rgba(0,0,0,0.5);
}`,
        }
      case 'neonLayers':
        return {
          previewStyle: {
            background: '#0b0f19',
            boxShadow: `0 0 ${Math.round(blur / 3)}px ${color}, 0 0 ${blur}px ${color}, 0 0 ${blur * 2}px ${color}`,
          } as React.CSSProperties,
          css: `.neon-box {
  background: #0b0f19;
  box-shadow:
    0 0 ${Math.round(blur / 3)}px ${color},
    0 0 ${blur}px ${color},
    0 0 ${blur * 2}px ${color};
}`,
        }
      case 'insetPress':
        return {
          previewStyle: {
            background: 'var(--color-ds-surface2)',
            boxShadow: `inset 0 ${Math.round(spread / 2)}px ${blur}px rgba(0,0,0,0.4)`,
          } as React.CSSProperties,
          css: `.inset-box {
  background: var(--color-ds-surface2);
  box-shadow: inset 0 ${Math.round(spread / 2)}px ${blur}px rgba(0,0,0,0.4);
}`,
        }
    }
  }, [technique, color, blur, spread])

  return (
    <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[280px_1fr]">
      <div className="border-ds-border bg-ds-surface flex aspect-square items-center justify-center rounded-2xl border p-8">
        <div className="h-24 w-24 rounded-2xl" style={previewStyle} />
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
          {technique !== 'depthLift' && technique !== 'insetPress' && (
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
          )}

          <label className="text-ds-muted flex flex-col gap-1 text-xs">
            Blur — {blur}px
            <input
              type="range"
              min={8}
              max={48}
              value={blur}
              onChange={(e) => setBlur(Number(e.target.value))}
              className="accent-ds-accent"
            />
          </label>

          <label className="text-ds-muted flex flex-col gap-1 text-xs">
            Spread — {spread}px
            <input
              type="range"
              min={0}
              max={16}
              value={spread}
              onChange={(e) => setSpread(Number(e.target.value))}
              className="accent-ds-accent"
            />
          </label>
        </div>

        <CssCodeBlock code={css} />
      </div>

      <style>{`
        @keyframes shGlowPulse {
          0%, 100% { box-shadow: 0 0 calc(var(--sh-blur, 24px) / 2) 0 var(--sh-color, #3b82f6); }
          50%      { box-shadow: 0 0 var(--sh-blur, 24px) var(--sh-spread, 4px) var(--sh-color, #3b82f6); }
        }
      `}</style>
    </div>
  )
}
