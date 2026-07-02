'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogoMark } from '@/components/ui/LogoMark'
import { Button } from '@/components/ui/Button'

// ─── Monitor SVG Illustration ─────────────────────────────────
function MonitorIllustration() {
  return (
    <svg viewBox="0 0 480 200" xmlns="http://www.w3.org/2000/svg" width="100%" aria-hidden="true">
      <defs>
        <linearGradient id="screenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#161f2e" />
          <stop offset="100%" stopColor="#111827" />
        </linearGradient>
        <linearGradient id="barGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <clipPath id="screenClip">
          <rect x="60" y="20" width="360" height="150" rx="6" />
        </clipPath>
      </defs>

      {/* Monitor body */}
      <rect
        x="40"
        y="10"
        width="400"
        height="165"
        rx="10"
        fill="#161f2e"
        stroke="rgba(59,130,246,0.2)"
        strokeWidth="1.5"
      />

      {/* Screen */}
      <rect x="60" y="20" width="360" height="145" rx="6" fill="url(#screenGrad)" />

      {/* Scan line */}
      <rect
        x="60"
        y="20"
        width="360"
        height="6"
        fill="rgba(59,130,246,0.2)"
        clipPath="url(#screenClip)"
        style={{ animation: 'scan 4s linear infinite' }}
      />

      {/* Window dots */}
      <circle cx="82" cy="36" r="5" fill="#FF5F57" />
      <circle cx="98" cy="36" r="5" fill="#FEBC2E" />
      <circle cx="114" cy="36" r="5" fill="#28C840" />
      <line x1="60" y1="48" x2="420" y2="48" stroke="rgba(59,130,246,0.12)" strokeWidth="1" />

      {/* Code lines — animated */}
      <rect x="80" y="62" width="0" height="8" rx="3" fill="#3B82F6" opacity="0.9">
        <animate attributeName="width" from="0" to="30" dur="0.3s" begin="0.3s" fill="freeze" />
      </rect>
      <rect x="116" y="62" width="0" height="8" rx="3" fill="#94A3B8" opacity="0.7">
        <animate attributeName="width" from="0" to="80" dur="0.4s" begin="0.6s" fill="freeze" />
      </rect>
      <rect x="202" y="62" width="0" height="8" rx="3" fill="#F87171" opacity="0.8">
        <animate attributeName="width" from="0" to="50" dur="0.3s" begin="1.0s" fill="freeze" />
      </rect>

      <rect x="80" y="80" width="0" height="8" rx="3" fill="#8B5CF6" opacity="0.6">
        <animate attributeName="width" from="0" to="20" dur="0.2s" begin="0.5s" fill="freeze" />
      </rect>
      <rect x="106" y="80" width="0" height="8" rx="3" fill="#94A3B8" opacity="0.5">
        <animate attributeName="width" from="0" to="110" dur="0.5s" begin="0.7s" fill="freeze" />
      </rect>

      {/* Error line highlight */}
      <rect x="72" y="96" width="340" height="14" rx="3" fill="rgba(248,113,113,0.1)" opacity="0">
        <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="1.2s" fill="freeze" />
      </rect>
      <rect x="80" y="99" width="0" height="8" rx="3" fill="#F87171" opacity="0.9">
        <animate attributeName="width" from="0" to="15" dur="0.2s" begin="1.2s" fill="freeze" />
      </rect>
      <rect x="101" y="99" width="0" height="8" rx="3" fill="#F87171" opacity="0.7">
        <animate attributeName="width" from="0" to="200" dur="0.5s" begin="1.4s" fill="freeze" />
      </rect>

      <rect x="80" y="118" width="0" height="8" rx="3" fill="#8B5CF6" opacity="0.6">
        <animate attributeName="width" from="0" to="20" dur="0.2s" begin="0.8s" fill="freeze" />
      </rect>
      <rect x="106" y="118" width="0" height="8" rx="3" fill="#94A3B8" opacity="0.4">
        <animate attributeName="width" from="0" to="60" dur="0.3s" begin="1.0s" fill="freeze" />
      </rect>

      <rect x="80" y="136" width="0" height="8" rx="3" fill="#4ADE80" opacity="0.7">
        <animate attributeName="width" from="0" to="90" dur="0.4s" begin="1.8s" fill="freeze" />
      </rect>
      <rect x="176" y="136" width="0" height="8" rx="3" fill="#94A3B8" opacity="0.4">
        <animate attributeName="width" from="0" to="40" dur="0.2s" begin="2.2s" fill="freeze" />
      </rect>

      {/* Cursor */}
      <rect x="224" y="136" width="8" height="10" rx="1" fill="#3B82F6">
        <animate
          attributeName="opacity"
          values="1;0;1"
          dur="1.1s"
          begin="2.4s"
          repeatCount="indefinite"
        />
      </rect>

      {/* Monitor stand */}
      <rect
        x="215"
        y="175"
        width="50"
        height="10"
        rx="3"
        fill="#161f2e"
        stroke="rgba(59,130,246,0.15)"
        strokeWidth="1"
      />
      <rect
        x="190"
        y="183"
        width="100"
        height="6"
        rx="3"
        fill="#161f2e"
        stroke="rgba(59,130,246,0.15)"
        strokeWidth="1"
      />

      {/* Progress bar */}
      <rect x="80" y="152" width="320" height="4" rx="2" fill="rgba(59,130,246,0.1)" />
      <rect x="80" y="152" width="0" height="4" rx="2" fill="url(#barGrad)">
        <animate attributeName="width" from="0" to="120" dur="1.5s" begin="0.5s" fill="freeze" />
      </rect>
    </svg>
  )
}

// ─── Main 404 Page ────────────────────────────────────────────
export default function NotFound() {
  const pathname = usePathname()
  const badUrl = pathname && pathname.length > 28 ? pathname.slice(0, 28) + '…' : pathname

  return (
    <>
      {/* ── Animated background ── */}
      <div className="fixed inset-0 overflow-hidden" aria-hidden="true">
        {/* Orbs */}
        {[
          {
            w: 600,
            h: 600,
            color: 'var(--color-ds-accent)',
            top: '-200px',
            left: '-100px',
            dur: '18s',
            delay: '0s',
          },
          {
            w: 500,
            h: 500,
            color: 'var(--color-ds-purple)',
            bottom: '-150px',
            right: '-100px',
            dur: '22s',
            delay: '-7s',
          },
          {
            w: 400,
            h: 400,
            color: 'var(--color-ds-accent)',
            top: '50%',
            left: '50%',
            dur: '15s',
            delay: '-3s',
          },
        ].map((orb, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: orb.w,
              height: orb.h,
              background: orb.color,
              top: orb.top,
              left: orb.left,
              bottom: (orb as { bottom?: string }).bottom,
              right: (orb as { right?: string }).right,
              filter: 'blur(80px)',
              opacity: 0.12,
              transform: i === 2 ? 'translate(-50%, -50%)' : undefined,
              animation: `drift${i + 1} ${orb.dur} linear ${orb.delay} infinite`,
            }}
          />
        ))}
        {/* Grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(color-mix(in srgb, var(--color-ds-accent) 5%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--color-ds-accent) 5%, transparent) 1px, transparent 1px)',
            backgroundSize: '52px 52px',
          }}
        />
      </div>

      {/* ── Page content ── */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-10 text-center">
        {/* Logo */}
        <Link
          href="/"
          className="mb-10 flex items-center gap-3 no-underline"
          style={{ animation: 'fadeDown 0.6s ease both' }}
          aria-label="DevStash home"
        >
          <LogoMark size={36} />
          <span
            className="text-lg font-medium"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ds-text)' }}
          >
            <span style={{ color: 'var(--color-ds-accent)' }}>&lt;</span>
            <span>devstash</span>
            <span style={{ color: 'var(--color-ds-accent)' }}>/&gt;</span>
          </span>
        </Link>

        {/* Monitor illustration */}
        <div
          className="mb-10 w-full max-w-[480px]"
          style={{ animation: 'fadeUp 0.7s ease both' }}
          aria-hidden="true"
        >
          <MonitorIllustration />
        </div>

        {/* Glitch 404 */}
        <div className="relative mb-6" style={{ animation: 'fadeUp 0.7s 0.1s ease both' }}>
          <span
            className="glitch relative inline-block leading-none font-bold tracking-tighter"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(5rem, 18vw, 9rem)',
              color: 'var(--color-ds-text)',
              letterSpacing: '-0.05em',
            }}
            aria-label="404"
            data-text="404"
          >
            404
          </span>
        </div>

        {/* Terminal card */}
        <div
          className="w-full max-w-[480px] overflow-hidden rounded-2xl p-3"
          style={{
            background: '#111827',
            border: '1px solid rgba(59,130,246,0.2)',
            boxShadow: '0 30px 70px rgba(0,0,0,0.5)',
            animation: 'fadeUp 0.7s 0.2s ease both',
            padding: '1rem',
          }}
          role="main"
        >
          {/* Title bar */}
          <div
            className="flex items-center gap-2 border-b px-4 py-[10px]"
            style={{ background: '#161f2e', borderColor: 'rgba(59,130,246,0.12)' }}
          >
            <div className="flex gap-[6px]" aria-hidden="true">
              <div className="h-[11px] w-[11px] rounded-full" style={{ background: '#FF5F57' }} />
              <div className="h-[11px] w-[11px] rounded-full" style={{ background: '#FEBC2E' }} />
              <div className="h-[11px] w-[11px] rounded-full" style={{ background: '#28C840' }} />
            </div>
            <span
              className="mx-auto pr-11 text-[11px]"
              style={{ fontFamily: 'var(--font-mono)', color: '#9CA3AF' }}
            >
              adesh@devstash: ~ error
            </span>
          </div>

          {/* Card body */}
          <div className="px-8 pt-7 pb-8">
            {/* Terminal lines */}
            <div
              className="mb-6 text-left text-[13px]"
              style={{ fontFamily: 'var(--font-mono)' }}
              aria-hidden="true"
            >
              {[
                {
                  prompt: '$',
                  promptColor: '#60A5FA',
                  content: (
                    <span style={{ color: '#D1D5DB' }}>
                      GET <span style={{ color: '#F87171' }}>{badUrl || '/this-page'}</span>
                    </span>
                  ),
                  delay: '0.4s',
                },
                {
                  prompt: '→',
                  promptColor: '#F87171',
                  content: <span style={{ color: '#F87171' }}>404: Page not found</span>,
                  delay: '0.8s',
                },
                {
                  prompt: '!',
                  promptColor: '#F59E0B',
                  content: (
                    <span style={{ color: '#9CA3AF' }}>
                      This route doesn&apos;t exist in the stash.
                    </span>
                  ),
                  delay: '1.2s',
                },
                {
                  prompt: '$',
                  promptColor: '#60A5FA',
                  content: <span style={{ color: '#4ADE80' }}>cd ~ # go home?</span>,
                  delay: '1.6s',
                },
              ].map((line, i) => (
                <div
                  key={i}
                  className="mb-[6px] flex items-start gap-2"
                  style={{ opacity: 0, animation: `fadeIn 0.3s ease ${line.delay} forwards` }}
                >
                  <span style={{ color: line.promptColor, flexShrink: 0 }}>{line.prompt}</span>
                  <span>{line.content}</span>
                </div>
              ))}
            </div>

            {/* Subtitle */}
            <p className="mb-6 text-sm leading-[1.7]" style={{ color: '#9CA3AF' }}>
              Seems you pick the wrong path —
              <br />
              This page isn&apos;t in the stash yet. But don&apos;t worry, you can always head back
              to the homepage and explore the latest drops.
            </p>

            {/* Buttons */}
            <div className="flex flex-wrap gap-3 sm:flex-nowrap">
              <Button
                href="/"
                className="flex-1"
                iconLeft={
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M2 6.5L8 2l6 4.5V14a1 1 0 01-1 1H3a1 1 0 01-1-1V6.5z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M6 15v-5h4v5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
              >
                Go home
              </Button>

              <Button
                type="button"
                onClick={() => window.history.back()}
                variant="outline"
                className="flex-1 font-mono"
              >
                ← go back
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── All keyframe animations ── */}
      <style>{`
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes scan {
          0%   { transform: translateY(-120px); opacity: 0; }
          10%  { opacity: 0.15; }
          90%  { opacity: 0.15; }
          100% { transform: translateY(260px); opacity: 0; }
        }
        @keyframes drift1 {
          0%, 100% { transform: translate(0, 0); }
          33%      { transform: translate(60px, 40px); }
          66%      { transform: translate(-40px, 70px); }
        }
        @keyframes drift2 {
          0%, 100% { transform: translate(0, 0); }
          33%      { transform: translate(-70px, -50px); }
          66%      { transform: translate(30px, -30px); }
        }
        @keyframes drift3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50%      { transform: translate(-50%, -50%) scale(1.3); }
        }

        /* Glitch effect */
        .glitch::before,
        .glitch::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        .glitch::before {
          color: #3B82F6;
          animation: glitch1 3.5s infinite;
          clip-path: polygon(0 0, 100% 0, 100% 40%, 0 40%);
        }
        .glitch::after {
          color: #22D3EE;
          animation: glitch2 3.5s infinite;
          clip-path: polygon(0 60%, 100% 60%, 100% 100%, 0 100%);
        }
        @keyframes glitch1 {
          0%, 90%, 100% { transform: translate(0); opacity: 0; }
          92%           { transform: translate(-4px, 2px); opacity: 0.7; }
          94%           { transform: translate(4px, -2px); opacity: 0.7; }
          96%           { transform: translate(-2px, 0); opacity: 0.7; }
          98%           { transform: translate(0); opacity: 0; }
        }
        @keyframes glitch2 {
          0%, 88%, 100% { transform: translate(0); opacity: 0; }
          90%           { transform: translate(4px, -3px); opacity: 0.6; }
          93%           { transform: translate(-3px, 2px); opacity: 0.6; }
          96%           { transform: translate(2px, 0); opacity: 0; }
        }
      `}</style>
    </>
  )
}
