'use client'

import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'devstash-theme'

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M8 1v1.4M8 13.6V15M15 8h-1.4M2.4 8H1M12.7 3.3l-1 1M4.3 11.7l-1 1M12.7 12.7l-1-1M4.3 4.3l-1-1"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M14 9.2A6 6 0 116.8 2a4.8 4.8 0 007.2 7.2z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Toggles `data-theme` on <html> between 'light' and 'dark' and persists the
 * choice to localStorage. The actual first-paint theme is decided by a
 * beforeInteractive inline script in app/layout.tsx (THEME_INIT_SCRIPT) that
 * runs before the browser paints anything — this component just reads
 * whatever `data-theme` that script already applied, to sync React state.
 * Do not re-resolve/re-apply the theme here; that was the old approach and
 * it caused a flash whenever the saved theme differed from OS preference
 * (paint happens with the OS theme, then this useEffect — which only runs
 * post-hydration — would flip it visibly).
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null)

  useEffect(() => {
    const applied = document.documentElement.getAttribute('data-theme')
    setTheme(applied === 'light' ? 'light' : 'dark')
  }, [])

  function toggle() {
    const next: Theme = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // localStorage unavailable (private mode, etc.) — theme just won't persist.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      className={
        className ??
        'border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent flex h-9 w-9 items-center justify-center rounded-lg border transition-colors'
      }
    >
      {/* Render nothing theme-specific until mounted, to avoid an icon flash
          that doesn't match the pre-painted theme. */}
      {theme === 'light' ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}
