'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { INTRO_VIDEO } from '@/content/metadata/introVideo'
import { LogoMark } from './LogoMark'
import { projectBrand } from '@/components/icons/ProjectMark'
import { ANALYTICS_EVENTS, trackAndLog } from '@/lib/analytics/events'

/**
 * Click-to-load player: only a markup poster ships with the page. The <video> element — and with
 * it the 4 MB file — is created when the visitor presses play, so the video never costs a page
 * load anything.
 *
 * One `video_watched` report per play: real seconds watched (seeking ahead does not count), sent
 * when the video ends, the tab is hidden or closed, or the visitor navigates away — whichever
 * happens first. /api/track logs it and emails the owner.
 */
export function IntroVideo() {
  const [playing, setPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const watched = useRef(0)
  const lastTime = useRef<number | null>(null)
  const sent = useRef(false)

  // Reads only refs, so one stable function serves every listener.
  const report = useCallback(() => {
    if (sent.current || watched.current < 1) return
    sent.current = true
    const duration = videoRef.current?.duration || INTRO_VIDEO.durationSeconds
    trackAndLog(ANALYTICS_EVENTS.videoWatched, {
      watched: Math.round(watched.current),
      duration: Math.round(duration),
      percent: Math.min(100, Math.round((watched.current / duration) * 100)),
    })
  }, [])

  useEffect(() => {
    if (!playing) return
    const onHide = () => {
      if (document.visibilityState === 'hidden') report()
    }
    const onPageHide = () => report()
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', onPageHide)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', onPageHide)
      report() // client-side navigation away from the page
    }
  }, [playing, report])

  const onTimeUpdate = () => {
    const v = videoRef.current
    if (!v) return
    const t = v.currentTime
    // Count only small forward steps of normal playback, so a seek doesn't count as watching.
    if (lastTime.current !== null && !v.seeking) {
      const step = t - lastTime.current
      if (step > 0 && step < 1.5) watched.current += step
    }
    lastTime.current = t
  }

  return (
    <div className="border-ds-border bg-ds-surface relative aspect-video w-full overflow-hidden rounded-2xl border shadow-2xl shadow-black/30">
      {playing ? (
        <video
          ref={videoRef}
          src={INTRO_VIDEO.src}
          poster={INTRO_VIDEO.poster}
          width={INTRO_VIDEO.width}
          height={INTRO_VIDEO.height}
          className="h-full w-full"
          controls
          autoPlay
          playsInline
          onTimeUpdate={onTimeUpdate}
          onSeeked={() => (lastTime.current = videoRef.current?.currentTime ?? null)}
          onEnded={report}
        >
          {/* Captions are burned into the video. */}
        </video>
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group focus-visible:ring-ds-accent absolute inset-0 cursor-pointer focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
          aria-label={`Play video: ${INTRO_VIDEO.title} (1 minute 21 seconds, with sound and captions)`}
        >
          {/* The poster is markup on the theme tokens, so it follows light/dark
              (the JPG is dark-only and still serves as <video poster> and the
              schema thumbnail). It says what's in the video: the five builds in
              the video's own order. Sizes are cqw (container width) so it
              scales like an image; the chapter list only shows once the poster
              is wide enough to read it. */}
          <span
            aria-hidden="true"
            className="intro-poster @container absolute inset-0 text-left transition-transform duration-500 group-hover:scale-[1.01]"
          >
            <span className="absolute inset-0 grid gap-[4cqw] p-[5cqw] @2xl:grid-cols-[1fr_1fr]">
              <span className="flex flex-col justify-between">
                <span className="flex items-center gap-[1.5cqw]">
                  <span className="block aspect-square w-[clamp(22px,4.6cqw,40px)] [&>svg]:h-full [&>svg]:w-full">
                    <LogoMark />
                  </span>
                  <span className="text-ds-text text-[clamp(14px,2.4cqw,21px)] font-bold tracking-[-0.04em]">
                    <span className="text-ds-accent">Dev</span>Stash
                  </span>
                </span>
                <span>
                  <span className="text-ds-accent block font-mono text-[clamp(10px,1.5cqw,13px)]">
                    {'// narrated tour · captions on'}
                  </span>
                  <span className="text-ds-text mt-[1.2cqw] block text-[clamp(22px,5.4cqw,48px)] leading-[1.04] font-bold tracking-[-0.035em]">
                    Five builds,
                    <br />
                    in 80 seconds.
                  </span>
                  <span className="text-ds-muted mt-[1.4cqw] hidden text-[clamp(12px,1.75cqw,15px)] @md:block">
                    Adesh Shukla · UI developer · India
                  </span>
                </span>
                <PlayPill />
              </span>
              <span className="hidden flex-col justify-center gap-[1cqw] @2xl:flex">
                <span className="text-ds-muted mb-[0.4cqw] font-mono text-[clamp(10px,1.25cqw,12px)] tracking-widest uppercase">
                  In this video
                </span>
                {INTRO_VIDEO.chapters.map((c, i) => {
                  const { Mark } = projectBrand(c.slug)
                  return (
                    <span
                      key={c.slug}
                      className="border-ds-border bg-ds-surface/80 flex items-center gap-[1.4cqw] rounded-[1.3cqw] border p-[0.9cqw] pr-[1.4cqw]"
                    >
                      <span className="block aspect-square w-[3.8cqw] shrink-0 overflow-hidden rounded-[0.9cqw] [&>svg]:h-full [&>svg]:w-full">
                        <Mark />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="text-ds-text block text-[clamp(11px,1.6cqw,14px)] leading-tight font-semibold">
                          {c.name}
                        </span>
                        <span className="text-ds-muted block truncate text-[clamp(10px,1.3cqw,12px)]">
                          {c.line}
                        </span>
                      </span>
                      <span className="text-ds-muted font-mono text-[clamp(10px,1.2cqw,12px)]">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </span>
                  )
                })}
              </span>
            </span>
          </span>
        </button>
      )}
    </div>
  )
}

function PlayPill() {
  return (
    <span className="flex">
      {/* Solid surface pill, blue only on the play disc: text on the old
          all-blue pill measured ~3.4:1 in both themes (WCAG AA needs 4.5). */}
      <span className="bg-ds-bg text-ds-text border-ds-border2 flex items-center gap-2 rounded-full border py-1 pr-4 pl-1 font-semibold shadow-lg transition-transform duration-200 group-hover:scale-105 sm:gap-3 sm:py-2 sm:pr-6 sm:pl-2">
        <span className="bg-ds-accent flex h-6 w-6 items-center justify-center rounded-full sm:h-10 sm:w-10">
          <svg
            viewBox="0 0 24 24"
            className="ml-0.5 h-3 w-3 fill-white sm:h-5 sm:w-5"
            aria-hidden="true"
          >
            <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.6-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
          </svg>
        </span>
        <span className="text-xs sm:text-base">
          Watch <span className="text-ds-muted font-mono font-normal">· 1:21</span>
        </span>
      </span>
    </span>
  )
}
