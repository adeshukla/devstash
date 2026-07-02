// Literal light/dark values for the ds-* tokens, mirrored from
// app/globals.css (@theme block + [data-theme='light'] override). Live
// previews use var(--color-ds-X, ...) so they stay theme-reactive in the
// browser; exported/copied SVGs need real hex values baked in per theme,
// since a pasted SVG elsewhere won't have this site's CSS custom properties.

export type ColorKey =
  | 'bg'
  | 'surface'
  | 'surface2'
  | 'accent'
  | 'purple'
  | 'success'
  | 'warning'
  | 'error'
  | 'muted'

export type Theme = 'dark' | 'light'

export const DARK_TOKENS: Record<ColorKey, string> = {
  bg: '#0b0f19',
  surface: '#111827',
  surface2: '#161f2e',
  accent: '#3b82f6',
  purple: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  muted: '#9ca3af',
}

export const LIGHT_TOKENS: Record<ColorKey, string> = {
  bg: '#ffffff',
  surface: '#f8fafc',
  surface2: '#eef1f6',
  accent: '#2563eb',
  purple: '#7c3aed',
  success: '#047857',
  warning: '#b45309',
  error: '#dc2626',
  muted: '#586375',
}

/** Theme-reactive CSS value for live, in-browser rendering — resolves via
 * the actual custom property when available, falls back to the dark value. */
export function cssVar(key: ColorKey): string {
  return `var(--color-ds-${key}, ${DARK_TOKENS[key]})`
}

/** Literal hex for a specific theme — used only when serializing a
 * standalone, exportable SVG string. */
export function resolveToken(key: ColorKey, theme: Theme): string {
  return (theme === 'light' ? LIGHT_TOKENS : DARK_TOKENS)[key]
}

function mixHex(hexA: string, hexB: string, ratioA: number): string {
  const a = parseInt(hexA.slice(1), 16)
  const b = parseInt(hexB.slice(1), 16)
  const channel = (shift: number) => {
    const av = (a >> shift) & 255
    const bv = (b >> shift) & 255
    return Math.round(av * ratioA + bv * (1 - ratioA))
      .toString(16)
      .padStart(2, '0')
  }
  return `#${channel(16)}${channel(8)}${channel(0)}`
}

/** Live-render background tint (theme-reactive color-mix). */
export function cssBgTint(tint: 'surface2' | 'accentTint' | 'purpleTint'): string {
  if (tint === 'surface2') return cssVar('surface2')
  const mixColor = tint === 'accentTint' ? 'accent' : 'purple'
  return `color-mix(in srgb, ${cssVar(mixColor)} 6%, ${cssVar('surface2')})`
}

/** Literal background tint for a specific export theme. */
export function resolveBgTint(
  tint: 'surface2' | 'accentTint' | 'purpleTint',
  theme: Theme
): string {
  if (tint === 'surface2') return resolveToken('surface2', theme)
  const mixColor = tint === 'accentTint' ? 'accent' : 'purple'
  return mixHex(resolveToken(mixColor, theme), resolveToken('surface2', theme), 0.06)
}
