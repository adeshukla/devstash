// Ambient type for Google's reCAPTCHA v3 client script (window.grecaptcha),
// loaded conditionally via next/script in ContactForm when
// NEXT_PUBLIC_RECAPTCHA_SITE_KEY is set.
interface Window {
  grecaptcha?: {
    ready: (callback: () => void) => void
    execute: (siteKey: string, options: { action: string }) => Promise<string>
  }
}
