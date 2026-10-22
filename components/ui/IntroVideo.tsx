'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { INTRO_VIDEO } from '@/content/metadata/introVideo'
import { LogoMark } from './LogoMark'
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
          {/* The video's opening frame, rebuilt as markup on the theme tokens
              so it follows light/dark — the JPG poster is dark-only. Sizes are
              in cqw (container width) so it scales like an image would. The
              JPG still serves as <video poster> and the schema thumbnail. */}
          <span
            aria-hidden="true"
            className="intro-poster [container-type:inline-size] absolute inset-0 grid place-items-center transition-transform duration-500 group-hover:scale-[1.02]"
          >
            <span className="flex -translate-y-[6%] flex-col items-center gap-[3.5cqw]">
              <span className="flex items-center gap-[3cqw]">
                <span className="shadow-ds-accent/40 block aspect-square w-[12cqw] rounded-[22%] shadow-[0_0_6cqw_-1cqw] [&>svg]:h-full [&>svg]:w-full">
                  <LogoMark />
                </span>
                <span className="text-ds-text text-[10cqw] leading-none font-bold tracking-[-0.04em]">
                  <span className="text-ds-accent">Dev</span>Stash
                </span>
              </span>
              <span className="text-ds-text flex items-center gap-[1cqw] text-[2.3cqw] font-medium">
                Adesh Shukla
                <span className="text-ds-accent">•</span>
                <span className="text-ds-muted font-mono font-normal">UI Developer · India</span>
              </span>
            </span>
          </span>
          {/* Sits in the poster's empty lower band, clear of the wordmark. */}
          <span className="absolute inset-x-0 bottom-[5%] flex justify-center sm:bottom-[9%]">
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
        </button>
      )}
    </div>
  )
}
