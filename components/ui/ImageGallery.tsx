// components/ui/ImageGallery.tsx
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils/cn'

export interface GalleryImage {
  src: string
  alt: string
  caption?: string
}

interface ImageGalleryProps {
  images: GalleryImage[]
  className?: string
}

export function ImageGallery({ images, className }: ImageGalleryProps) {
  const [current, setCurrent] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  // Distinguish swipe vs tap so accidental swipe doesn't open lightbox
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const didSwipe = useRef(false)

  if (!images || images.length === 0) return null

  function goPrev(e: React.MouseEvent) {
    e.stopPropagation()
    setCurrent((i) => (i - 1 + images.length) % images.length)
  }
  function goNext(e: React.MouseEvent) {
    e.stopPropagation()
    setCurrent((i) => (i + 1) % images.length)
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    didSwipe.current = false
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - (touchStartY.current ?? 0)
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      didSwipe.current = true
      if (dx > 0) setCurrent((i) => (i - 1 + images.length) % images.length)
      else setCurrent((i) => (i + 1) % images.length)
    }
    touchStartX.current = null
    touchStartY.current = null
  }

  function openLightbox() {
    if (!didSwipe.current) setLightboxOpen(true)
  }

  const img = images[current]

  return (
    <>
      {/* ── Slider ─────────────────────────────────────────────── */}
      <div className={cn('w-full select-none', className)}>
        <div
          className="border-ds-border bg-ds-surface group relative aspect-video w-full overflow-hidden rounded-2xl border"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <Image
            key={img.src}
            src={img.src}
            alt={img.alt}
            fill
            sizes="(min-width: 1024px) 896px, 100vw"
            className="object-contain"
            priority
          />

          {/*
            Z-index layout:
              z-0  → full-area invisible click target (opens lightbox on tap)
              z-10 → prev / next arrow strips (override the invisible target in their zones)
              z-20 → expand icon button (overrides arrow strip in the top-right corner)
          */}

          {/* z-0: full-area tap-to-expand */}
          <button
            type="button"
            onClick={openLightbox}
            aria-label={`Expand: ${img.alt}`}
            className="absolute inset-0 z-0 cursor-zoom-in focus:outline-none"
          />

          {/* z-10: prev / next — full-height side strips */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                aria-label="Previous image"
                className="absolute top-0 left-0 z-10 flex h-full w-16 cursor-pointer items-center justify-start pl-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus:outline-none"
              >
                <span className="bg-ds-bg/70 text-ds-text hover:bg-ds-bg/90 hover:text-ds-accent rounded-full p-2 backdrop-blur-sm transition-colors">
                  <ChevronIcon direction="left" />
                </span>
              </button>

              <button
                type="button"
                onClick={goNext}
                aria-label="Next image"
                className="absolute top-0 right-0 z-10 flex h-full w-16 cursor-pointer items-center justify-end pr-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus:outline-none"
              >
                <span className="bg-ds-bg/70 text-ds-text hover:bg-ds-bg/90 hover:text-ds-accent rounded-full p-2 backdrop-blur-sm transition-colors">
                  <ChevronIcon direction="right" />
                </span>
              </button>
            </>
          )}

          {/*
            z-20: expand icon — sits ABOVE the right arrow strip.
            Has its own onClick so it always opens the lightbox regardless
            of what's underneath. No pointer-events-none here.
          */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setLightboxOpen(true)
            }}
            aria-label="Open fullscreen"
            className="bg-ds-bg/70 text-ds-text hover:bg-ds-bg/90 hover:text-ds-accent absolute top-3 right-3 z-20 rounded-lg p-1.5 opacity-0 backdrop-blur-sm transition-all duration-200 group-hover:opacity-100 focus:outline-none"
          >
            <ExpandIcon />
          </button>
        </div>

        {/* Caption */}
        {img.caption && <p className="text-ds-muted mt-2 text-center text-sm">{img.caption}</p>}

        {/* Dot indicators */}
        {images.length > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrent(i)}
                aria-label={`Go to image ${i + 1}`}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300 focus:outline-none',
                  i === current ? 'bg-ds-accent w-6' : 'bg-ds-border hover:bg-ds-muted w-1.5'
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Lightbox ───────────────────────────────────────────── */}
      {lightboxOpen && (
        <Lightbox images={images} startIndex={current} onClose={() => setLightboxOpen(false)} />
      )}
    </>
  )
}

// ─── Lightbox ──────────────────────────────────────────────────────────────

interface LightboxProps {
  images: GalleryImage[]
  startIndex: number
  onClose: () => void
}

function Lightbox({ images, startIndex, onClose }: LightboxProps) {
  const [index, setIndex] = useState(startIndex)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  const next = useCallback(() => setIndex((i) => (i + 1) % images.length), [images.length])
  const prev = useCallback(
    () => setIndex((i) => (i - 1 + images.length) % images.length),
    [images.length]
  )

  // Lock body scroll, auto-focus close button
  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeBtnRef.current?.focus()
    return () => {
      document.body.style.overflow = original
    }
  }, [])

  // Keyboard: ESC closes, arrows navigate
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, next, prev])

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - (touchStartY.current ?? 0)
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) prev()
      else next()
    }
    touchStartX.current = null
    touchStartY.current = null
  }

  const current = images[index]

  /*
    Z-index layout inside the backdrop (z-50):
      z-10  → image stage (stopPropagation so backdrop click-to-close
               only fires when clicking the actual dark backdrop area)
      z-20  → prev / next arrow strips — start at top-16 so they
               never overlap the header area where ✕ and counter live
      z-30  → ✕ close button + counter — always on top, always clickable
  */

  return (
    // Backdrop — clicking the dark area closes the lightbox
    <div
      role="dialog"
      aria-modal="true"
      aria-label={current.alt}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md"
    >
      {/* z-30: ✕ close button — highest z, never covered by arrows */}
      <button
        ref={closeBtnRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        aria-label="Close gallery"
        className="text-ds-text focus-visible:ring-ds-accent absolute top-4 right-4 z-30 rounded-full p-2.5 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2"
      >
        <CloseIcon />
      </button>

      {/* z-30: image counter */}
      {images.length > 1 && (
        <span className="text-ds-muted absolute top-5 left-4 z-30 font-mono text-xs">
          {index + 1} / {images.length}
        </span>
      )}

      {/* z-20: prev arrow — starts at top-16 so it never covers the close button */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              prev()
            }}
            aria-label="Previous image"
            className="absolute top-16 bottom-0 left-0 z-20 flex w-20 cursor-pointer items-center justify-start pl-4 focus:outline-none"
          >
            <span className="rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition-colors hover:bg-white/25">
              <ChevronIcon direction="left" size={28} />
            </span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              next()
            }}
            aria-label="Next image"
            className="absolute top-16 right-0 bottom-0 z-20 flex w-20 cursor-pointer items-center justify-end pr-4 focus:outline-none"
          >
            <span className="rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition-colors hover:bg-white/25">
              <ChevronIcon direction="right" size={28} />
            </span>
          </button>
        </>
      )}

      {/* z-10: image stage — stopPropagation so clicking the image/caption
          doesn't trigger the backdrop's onClose */}
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative z-10 flex h-full w-full flex-col items-center justify-center px-24 py-16"
      >
        <div className="relative h-full w-full">
          <Image
            src={current.src}
            alt={current.alt}
            fill
            sizes="95vw"
            className="object-contain"
            priority
          />
        </div>
        {current.caption && (
          <p className="text-ds-muted mt-4 shrink-0 text-center text-sm">{current.caption}</p>
        )}
      </div>
    </div>
  )
}

// ─── Inline SVG icons (no new dependency) ──────────────────────────────────

function CloseIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  )
}

function ExpandIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path
        d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronIcon({ direction, size = 24 }: { direction: 'left' | 'right'; size?: number }) {
  const d = direction === 'left' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
