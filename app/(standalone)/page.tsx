'use client'

import { useEffect, useRef, useState } from 'react'

// ─── Logo Mark ────────────────────────────────────────────────
function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
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

// ─── Typing hook ──────────────────────────────────────────────
function useTyping(words: string[], speed = 70, pause = 3000) {
  const [display, setDisplay] = useState('')
  const [idx, setIdx] = useState(0)
  const t = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const word = words[idx % words.length]
    let i = 0
    setDisplay('')
    const tick = () => {
      if (i < word.length) {
        setDisplay(word.slice(0, ++i))
        t.current = setTimeout(tick, speed)
      } else {
        t.current = setTimeout(() => setIdx((n) => n + 1), pause)
      }
    }
    t.current = setTimeout(tick, speed)
    return () => {
      if (t.current) clearTimeout(t.current)
    }
  }, [idx]) // eslint-disable-line

  return display
}

// ─── Cycling word hook ────────────────────────────────────────
function useCycling(words: string[], ms = 3000) {
  const [i, setI] = useState(0)
  const [show, setShow] = useState(true)
  useEffect(() => {
    const timer = setInterval(() => {
      setShow(false)
      setTimeout(() => {
        setI((n) => (n + 1) % words.length)
        setShow(true)
      }, 280)
    }, ms)
    return () => clearInterval(timer)
  }, []) // eslint-disable-line
  return { word: words[i], show }
}

// ─── Page ─────────────────────────────────────────────────────
export default function ComingSoonPage() {
  const typedCmd = useTyping(['deploying soon...', 'pnpm run build ✓', 'vercel --prod'])
  const { word, show } = useCycling(['waiting', 'shipping', 'building', 'crafting'])

  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      })
      setStatus(res.ok ? 'success' : 'error')
      if (res.ok) {
        setEmail('')
        setTimeout(() => setStatus('idle'), 5000)
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
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(59,130,246,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.04) 1px,transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div
          className="absolute left-1/2 -translate-x-1/2 -translate-y-1/4"
          style={{
            width: 600,
            height: 600,
            background: 'radial-gradient(ellipse,rgba(59,130,246,0.06) 0%,transparent 70%)',
          }}
        />
      </div>

      {/* ── Main layout ── */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6">
        {/* Logo */}
        <div
          className="mb-10 flex items-center gap-3"
          style={{ animation: 'fadeDown .6s ease both' }}
        >
          <LogoMark size={40} />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 18,
              fontWeight: 500,
              color: '#F3F4F6',
            }}
          >
            <span style={{ color: '#3B82F6' }}>&lt;</span>devstash
            <span style={{ color: '#3B82F6' }}>/&gt;</span>
          </span>
        </div>

        {/* Card */}
        <main
          className="w-full overflow-hidden"
          style={{
            maxWidth: 600,
            background: '#111827',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 16,
            boxShadow: '0 0 0 1px rgba(59,130,246,0.04), 0 32px 64px rgba(0,0,0,0.5)',
            animation: 'fadeUp .7s .1s ease both',
          }}
        >
          {/* Title bar */}
          <div
            style={{
              background: '#161f2e',
              borderBottom: '1px solid rgba(59,130,246,0.12)',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {/* Traffic lights */}
            <div style={{ display: 'flex', gap: 6 }} aria-hidden="true">
              {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
                <div
                  key={c}
                  style={{ width: 12, height: 12, borderRadius: '50%', background: c }}
                />
              ))}
            </div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: '#9CA3AF',
                margin: '0 auto',
                paddingRight: 44,
              }}
            >
              adesh@devstash:~
            </span>
          </div>

          {/* Body */}
          <div style={{ padding: 'clamp(24px, 5vw, 40px)' }}>
            {/* Prompt line */}
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: '#9CA3AF',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 28,
              }}
              aria-hidden="true"
            >
              <span style={{ color: '#60A5FA' }}>$</span>
              <span style={{ color: '#D1D5DB' }}>git push origin main —</span>
              <span style={{ color: '#D1D5DB' }}>{typedCmd}</span>
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 14,
                  background: '#3B82F6',
                  borderRadius: 1,
                  animation: 'blink 1.1s step-end infinite',
                  flexShrink: 0,
                }}
              />
            </div>

            {/* Headline */}
            <h1
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'clamp(2rem, 6vw, 3.25rem)',
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
                color: '#F3F4F6',
                marginBottom: 16,
              }}
            >
              Something worth{' '}
              <span
                style={{
                  color: '#60A5FA',
                  display: 'inline-block',
                  transition: 'opacity .25s, transform .25s',
                  opacity: show ? 1 : 0,
                  transform: show ? 'translateY(0)' : 'translateY(6px)',
                }}
              >
                {word}
              </span>{' '}
              for.
            </h1>

            {/* Sub */}
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.75,
                color: '#9CA3AF',
                marginBottom: 28,
                maxWidth: 480,
              }}
            >
              <strong style={{ color: '#F3F4F6', fontWeight: 500 }}>Adesh Shukla</strong> — Frontend
              Developer building a developer ecosystem that ships fast, looks sharp, and tells the
              whole story. React · Next.js · Design-first engineering. Landing soon.
            </p>

            {/* Chips */}
            <div
              style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}
              aria-label="Tech stack"
            >
              {chips.map((chip) => (
                <span
                  key={chip}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: '#A5B4FC',
                    background: 'rgba(59,130,246,0.1)',
                    border: '1px solid rgba(59,130,246,0.2)',
                    padding: '4px 12px',
                    borderRadius: 100,
                    letterSpacing: '0.02em',
                  }}
                >
                  {chip}
                </span>
              ))}
            </div>

            {/* Notify label */}
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: '#9CA3AF',
                marginBottom: 10,
                letterSpacing: '0.05em',
              }}
            >
              <span style={{ color: '#3B82F6' }}>// </span>
              get notified when it&apos;s live
            </p>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 440 }}
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                aria-label="Email address"
                autoComplete="email"
                style={{
                  width: '100%',
                  height: 46,
                  background: '#161f2e',
                  border: '1px solid rgba(59,130,246,0.3)',
                  borderRadius: 8,
                  padding: '0 14px',
                  fontSize: 14,
                  color: '#F3F4F6',
                  fontFamily: 'var(--font-sans)',
                  outline: 'none',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#3B82F6')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(59,130,246,0.3)')}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                style={{
                  width: '100%',
                  height: 46,
                  background: '#3B82F6',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#fff',
                  fontFamily: 'var(--font-sans)',
                  cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                  opacity: status === 'loading' ? 0.7 : 1,
                  transition: 'background .2s',
                }}
                onMouseEnter={(e) => {
                  if (status !== 'loading') e.currentTarget.style.background = '#60A5FA'
                }}
                onMouseLeave={(e) => {
                  if (status !== 'loading') e.currentTarget.style.background = '#3B82F6'
                }}
              >
                {status === 'loading' ? 'Sending...' : 'Notify me'}
              </button>
            </form>

            {/* Status messages */}
            {status === 'success' && (
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: '#4ADE80',
                  marginTop: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
                role="status"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
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
              </p>
            )}
            {status === 'error' && (
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: '#F87171',
                  marginTop: 10,
                }}
                role="alert"
              >
                something went wrong — try again.
              </p>
            )}

            {/* Divider */}
            <div
              style={{ height: 1, background: 'rgba(59,130,246,0.1)', margin: '28px 0' }}
              aria-hidden="true"
            />

            {/* Status row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: '#4ADE80',
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#4ADE80',
                    display: 'inline-block',
                    animation: 'pulse2 2.4s ease infinite',
                  }}
                  aria-hidden="true"
                />
                building in public
              </div>
              <nav style={{ display: 'flex', gap: 20 }} aria-label="Social links">
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
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      color: '#9CA3AF',
                      textDecoration: 'none',
                      transition: 'color .2s',
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
          style={{
            marginTop: 24,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: '#374151',
            letterSpacing: '0.03em',
            animation: 'fadeUp .8s .3s ease both',
          }}
        >
          © 2026 devstash.me &nbsp;·&nbsp; crafted with ☕ in Ghaziabad
        </footer>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes fadeDown { from{opacity:0;transform:translateY(-14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(16px)}  to{opacity:1;transform:translateY(0)} }
        @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pulse2   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.85)} }
      `}</style>
    </>
  )
}
