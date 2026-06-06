// app/api/og/route.tsx
import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const title = searchParams.get('title') ?? 'DevStash'
  const description = searchParams.get('description') ?? 'A modern developer ecosystem'
  const category = searchParams.get('category') ?? ''
  const date = searchParams.get('date') ?? ''

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#0B0F19',
        padding: '60px 64px',
        fontFamily: 'system-ui, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Grid background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Glow */}
      <div
        style={{
          position: 'absolute',
          top: '-200px',
          right: '-100px',
          width: 600,
          height: 600,
          background: 'radial-gradient(ellipse, rgba(59,130,246,0.12) 0%, transparent 70%)',
        }}
      />

      {/* Top — Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
        {/* Logo mark */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: '#0B0F19',
            border: '1.5px solid #1F2937',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <div style={{ color: '#3B82F6', fontSize: 14, fontWeight: 700 }}>{'>'}</div>
            <div
              style={{
                width: 7,
                height: 3,
                borderRadius: 2,
                background: '#8B5CF6',
                marginTop: 4,
              }}
            />
          </div>
        </div>
        <span
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#F3F4F6',
            letterSpacing: '-0.04em',
          }}
        >
          <span style={{ color: '#3B82F6' }}>Dev</span>Stash
        </span>

        {/* Category badge */}
        {category && (
          <div
            style={{
              marginLeft: 'auto',
              fontSize: 12,
              fontWeight: 600,
              color: '#60A5FA',
              background: 'rgba(59,130,246,0.12)',
              border: '1px solid rgba(59,130,246,0.25)',
              padding: '4px 12px',
              borderRadius: 100,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {category}
          </div>
        )}
      </div>

      {/* Middle — Title + Description */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
        <div
          style={{
            fontSize: title.length > 40 ? 44 : 52,
            fontWeight: 700,
            color: '#F3F4F6',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            maxWidth: 900,
          }}
        >
          {title}
        </div>
        {description && (
          <div
            style={{
              fontSize: 18,
              color: '#9CA3AF',
              lineHeight: 1.6,
              maxWidth: 720,
            }}
          >
            {description}
          </div>
        )}
      </div>

      {/* Bottom — URL + Date */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
        }}
      >
        {/* Accent line */}
        <div
          style={{
            position: 'absolute',
            top: -20,
            left: 0,
            right: 0,
            height: 1,
            background: 'rgba(59,130,246,0.15)',
          }}
        />
        <span
          style={{
            fontSize: 14,
            color: '#3B82F6',
            fontFamily: 'monospace',
            letterSpacing: '0.03em',
          }}
        >
          devstash.me
        </span>
        {date && (
          <span style={{ fontSize: 13, color: '#6B7280', fontFamily: 'monospace' }}>{date}</span>
        )}
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    }
  )
}
