// reCAPTCHA v3 (invisible), browser side. The ~350 KB script loads on first use, not on page
// load, so it never costs LCP/TBT. Resolves to undefined when no site key is configured or the
// script fails to load; verifyRecaptcha() on the server no-ops without its secret too.
const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

export const recaptchaEnabled = Boolean(SITE_KEY)

let load: Promise<void> | undefined
export function loadRecaptcha(): Promise<void> {
  if (!SITE_KEY || typeof window === 'undefined') return Promise.resolve()
  load ??= new Promise((resolve) => {
    const el = document.createElement('script')
    el.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`
    el.async = true
    el.onload = () => resolve()
    el.onerror = () => resolve()
    document.head.appendChild(el)
  })
  return load
}

/** A token for `action`; the server must check it against the same action name. */
export async function getRecaptchaToken(action: string): Promise<string | undefined> {
  await loadRecaptcha()
  if (!SITE_KEY || !window.grecaptcha) return undefined
  return new Promise((resolve) => {
    window.grecaptcha!.ready(() => {
      window
        .grecaptcha!.execute(SITE_KEY, { action })
        .then(resolve)
        .catch(() => resolve(undefined))
    })
  })
}
