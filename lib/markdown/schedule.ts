// Scheduled publishing: a post whose createdAt is in the future stays hidden
// (lists, sitemap, RSS, its own URL) until that day arrives in India. Pages
// that list posts revalidate hourly, so a scheduled post goes live on its date
// without a redeploy. Published posts keep their real dates; never move a
// post's createdAt earlier than the day it actually went live.

/** Today's date in India as YYYY-MM-DD. */
export function todayInIndia(now: Date = new Date()): string {
  return now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

/** True once the post's createdAt (YYYY-MM-DD) is today or earlier. */
export function isLiveOn(createdAt: string, today: string = todayInIndia()): boolean {
  return createdAt.slice(0, 10) <= today
}
