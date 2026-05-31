'use client'

import { useEffect, useRef, useState } from 'react'

// ─── Logo Mark ────────────────────────────────────────────────
function LogoMark({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="100" height="100" rx="22" fill="#0B0F19" />
      <rect width="100" height="100" rx="22" stroke="#1F2937" strokeWidth="2" />
      <path
        d="M23 34L46 50L23 66"
        stroke="#3B82F6"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="53" y="57" width="26" height="7" rx="3.5" fill="#8B5CF6" />
    </svg>
  )
}

// ─── Typing Hook ──────────────────────────────────────────────
function useTyping(words: string[], speed = 65, pause = 2800) {
  const [display, setDisplay] = useState('')
  const [wordIndex, setWordIndex] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const word = words[wordIndex % words.length]
    let i = 0
    setDisplay('')
    const type = () => {
      if (i < word.length) {
        setDisplay(word.slice(0, ++i))
        timerRef.current = setTimeout(type, speed)
      } else {
        timerRef.current = setTimeout(() => {
          setWordIndex((w) => w + 1)
        }, pause)
      }
    }
    timerRef.current = setTimeout(type, speed)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [wordIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  return display
}

// ─── Cycling Word Hook ────────────────────────────────────────
function useCyclingWord(words: string[], interval = 2800) {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex((i) => (i + 1) % words.length)
        setVisible(true)
      }, 260)
    }, interval)
    return () => clearInterval(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { word: words[index], visible }
}

// ─── Main Page ────────────────────────────────────────────────
export default function ComingSoonPage() {
  const typedCmd = useTyping(['deploying soon...', 'pnpm run build ✓', 'vercel --prod'], 65, 2800)
  const { word: cyclingWord, visible: wordVisible } = useCyclingWord([
    'waiting',
    'shipping',
    'building',
    'crafting',
  ])

  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('https://formspree.io/f/mbdbqbng', {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      })
      if (res.ok) {
        setEmail('')
        setStatus('success')
        setTimeout(() => setStatus('idle'), 5000)
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  const chips = [
    'React',
    'Next.js',
    'TypeScript',
    'Tailwind CSS',
    'Redux Toolkit',
    'Firebase',
    'n8n',
    'Ollama',
  ]

  return (
    <>
      {/* ── Background ── */}
      <div className="pointer-events-none fixed inset-0" aria-hidden="true">
        {/* Grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        {/* Glow */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: '-20%',
            width: 700,
            height: 700,
            background: 'radial-gradient(ellipse, rgba(59,130,246,0.07) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* ── Page ── */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-6">
        {/* Logo */}
        <div
          className="mb-14 flex items-center gap-3"
          style={{ animation: 'fadeDown 0.6s ease both' }}
        >
          <LogoMark size={44} />
          <span
            className="text-xl font-medium tracking-tight"
            style={{ fontFamily: 'var(--font-mono)', color: '#F3F4F6' }}
          >
            <span style={{ color: '#3B82F6' }}>&lt;</span>
            <span>devstash</span>
            <span style={{ color: '#3B82F6' }}>/&gt;</span>
          </span>
        </div>

        {/* Terminal card */}
        <main
          className="w-full max-w-[640px] overflow-hidden rounded-2xl"
          style={{
            background: '#111827',
            border: '1px solid rgba(59,130,246,0.25)',
            boxShadow: '0 0 0 1px rgba(59,130,246,0.05), 0 40px 80px rgba(0,0,0,0.5)',
            animation: 'fadeUp 0.7s 0.1s ease both',
          }}
        >
          {/* Title bar */}
          <div
            className="flex items-center gap-2 border-b px-4 py-3"
            style={{ background: '#161f2e', borderColor: 'rgba(59,130,246,0.15)' }}
          >
            <div className="flex gap-[7px]" aria-hidden="true">
              <div className="h-3 w-3 rounded-full" style={{ background: '#FF5F57' }} />
              <div className="h-3 w-3 rounded-full" style={{ background: '#FEBC2E' }} />
              <div className="h-3 w-3 rounded-full" style={{ background: '#28C840' }} />
            </div>
            <span
              className="mx-auto pr-12 text-xs"
              style={{ fontFamily: 'var(--font-mono)', color: '#9CA3AF' }}
            >
              adesh@devstash:~
            </span>
          </div>

          {/* Body */}
          <div className="px-8 pt-8 pb-10 sm:px-9">
            {/* Prompt line */}
            <div
              className="mb-7 flex items-center gap-2 text-[13px]"
              style={{ fontFamily: 'var(--font-mono)', color: '#9CA3AF' }}
              aria-hidden="true"
            >
              <span style={{ color: '#60A5FA' }}>$</span>
              <span style={{ color: '#D1D5DB' }}>git push origin main —</span>
              <span style={{ color: '#D1D5DB' }}>{typedCmd}</span>
              <span
                className="inline-block h-4 w-[9px] rounded-sm align-middle"
                style={{ background: '#3B82F6', animation: 'blink 1.1s step-end infinite' }}
              />
            </div>

            {/* Headline */}
            <h1
              className="mb-3 text-[clamp(1.625rem,5vw,3.25rem)] leading-[1.1] font-bold tracking-tight"
              style={{ color: '#F3F4F6' }}
            >
              Something
              <br />
              worth{' '}
              <span
                style={{
                  color: '#60A5FA',
                  display: 'inline-block',
                  transition: 'opacity 0.25s, transform 0.25s',
                  opacity: wordVisible ? 1 : 0,
                  transform: wordVisible ? 'translateY(0)' : 'translateY(8px)',
                }}
              >
                {cyclingWord}
              </span>
              <br />
              for.
            </h1>

            {/* Sub */}
            <p className="mb-9 max-w-[480px] text-base leading-[1.7]" style={{ color: '#9CA3AF' }}>
              <strong style={{ color: '#F3F4F6', fontWeight: 500 }}>Adesh Shukla</strong> — Frontend
              Developer building a developer ecosystem that ships fast, looks sharp, and tells the
              whole story.
              <br />
              React · Next.js · Design-first engineering. Landing soon.
            </p>

            {/* Stack chips */}
            <div className="mb-10 flex flex-wrap gap-2" aria-label="Tech stack">
              {chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full px-3 py-[5px] text-[11px]"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: '#A5B4FC',
                    background: 'rgba(59,130,246,0.1)',
                    border: '1px solid rgba(59,130,246,0.2)',
                    letterSpacing: '0.02em',
                  }}
                >
                  {chip}
                </span>
              ))}
            </div>

            {/* Notify form */}
            <p
              className="mb-2 text-[13px] tracking-widest"
              style={{ fontFamily: 'var(--font-mono)', color: '#9CA3AF' }}
            >
              <span style={{ color: '#3B82F6' }}>// </span>
              get notified when it&apos;s live
            </p>

            <form
              onSubmit={handleSubmit}
              className="flex max-w-[440px]"
              aria-label="Notify me form"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                aria-label="Email address"
                autoComplete="email"
                className="h-[46px] flex-1 rounded-l-lg border-y border-l px-4 text-[15px] transition-colors outline-none"
                style={{
                  background: '#161f2e',
                  borderColor: 'rgba(59,130,246,0.3)',
                  color: '#F3F4F6',
                  fontFamily: 'var(--font-sans)',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#3B82F6')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(59,130,246,0.3)')}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="h-[46px] rounded-r-lg px-5 text-[15px] font-medium text-white transition-colors disabled:opacity-70"
                style={{
                  background: status === 'loading' ? '#2563EB' : '#3B82F6',
                  fontFamily: 'var(--font-sans)',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.background = '#60A5FA')}
                onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.background = '#3B82F6')}
              >
                {status === 'loading' ? '...' : 'Notify me'}
              </button>
            </form>

            {/* Success / Error messages */}
            {status === 'success' && (
              <div
                className="mt-3 flex items-center gap-2 text-[13px]"
                style={{ fontFamily: 'var(--font-mono)', color: '#4ADE80' }}
                role="status"
                aria-live="polite"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="7" stroke="#4ADE80" strokeWidth="1.5" />
                  <path
                    d="M5 8l2 2 4-4"
                    stroke="#4ADE80"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                you&apos;re on the list. see you soon.
              </div>
            )}
            {status === 'error' && (
              <p
                className="mt-3 text-[13px]"
                style={{ fontFamily: 'var(--font-mono)', color: '#F87171' }}
                role="alert"
              >
                something went wrong — try again.
              </p>
            )}

            {/* Divider */}
            <div
              className="my-9 h-px w-full"
              style={{ background: 'rgba(59,130,246,0.12)' }}
              aria-hidden="true"
            />

            {/* Status row */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div
                className="flex items-center gap-2 text-[12px]"
                style={{ fontFamily: 'var(--font-mono)', color: '#4ADE80' }}
                aria-label="Status: building in public"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: '#4ADE80', animation: 'pulse 2.4s ease infinite' }}
                  aria-hidden="true"
                />
                building in public
              </div>

              <nav className="flex gap-4" aria-label="Social links">
                {[
                  { label: 'github', href: 'https://github.com/adeshukla' },
                  { label: 'linkedin', href: 'https://linkedin.com/in/adeshukla' },
                  { label: 'email', href: 'mailto:hello@devstash.me' },
                ].map(({ label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="text-[12px] transition-colors"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: '#9CA3AF',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) => ((e.target as HTMLAnchorElement).style.color = '#60A5FA')}
                    onMouseLeave={(e) => ((e.target as HTMLAnchorElement).style.color = '#9CA3AF')}
                  >
                    {label}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer
          className="mt-6 text-center text-[11px] tracking-wide"
          style={{
            fontFamily: 'var(--font-mono)',
            color: '#1F2937',
            animation: 'fadeUp 0.8s 0.3s ease both',
          }}
        >
          © 2025 devstash.me &nbsp;·&nbsp; crafted with ☕ in Ghaziabad
        </footer>
      </div>

      {/* ── Keyframe animations ── */}
      <style>{`
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </>
  )
}
