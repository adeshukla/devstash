// components/layout/Analytics.tsx
//
// Loads analytics via next/script, all env-gated (nothing renders when the
// corresponding env var is unset):
//   - Google Tag Manager  (NEXT_PUBLIC_GTM_ID)  — lazyOnload
//   - Google Analytics 4  (NEXT_PUBLIC_GA_ID)   — lazyOnload (direct gtag)
//   - Microsoft Clarity   (NEXT_PUBLIC_CLARITY_ID) — lazyOnload
//
// All three are lazyOnload per RULE 7 ("lazyOnload for all third-party
// scripts"). GTM was previously afterInteractive, which pulled ~285 KiB of
// tag-manager + gtag payload into the critical window and showed up in
// PageSpeed as the largest "reduce unused JavaScript" entry. Analytics has no
// reason to compete with LCP — nothing on this site renders based on it.
//
// IMPORTANT — pick ONE owner per tool, never both:
//   (a) GTM owns everything: set only NEXT_PUBLIC_GTM_ID and configure the GA4
//       + Clarity tags inside the container. This is what production does as of
//       2026-09 (verified: the live gtag URL carries `&gtm=...` and the Clarity
//       tag carries `?ref=gtm`, i.e. the container loaded both).
//   (b) Direct loaders own GA4/Clarity: set NEXT_PUBLIC_GA_ID /
//       NEXT_PUBLIC_CLARITY_ID and keep those tags OUT of the GTM container.
// Setting both for the same ID double-loads the script and double-counts hits.
// Under (a), window.gtag is not defined — trackEvent() still works because it
// also pushes to dataLayer, but forwarding those custom events to GA4 requires
// a matching trigger in the GTM container.
import Script from 'next/script'

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID
const GA_ID = process.env.NEXT_PUBLIC_GA_ID
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID

export function Analytics() {
  return (
    <>
      {GTM_ID ? (
        <Script id="gtm-init" strategy="lazyOnload">{`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
          var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;
          j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})
          (window,document,'script','dataLayer','${GTM_ID}');
        `}</Script>
      ) : null}

      {GA_ID ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="lazyOnload"
          />
          <Script id="ga4-init" strategy="lazyOnload">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', { page_path: window.location.pathname });
          `}</Script>
        </>
      ) : null}

      {CLARITY_ID ? (
        <Script id="clarity-init" strategy="lazyOnload">{`
          (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})
          (window,document,"clarity","script","${CLARITY_ID}");
        `}</Script>
      ) : null}
    </>
  )
}

/**
 * GTM <noscript> fallback iframe. Must be rendered at the very top of <body>.
 * Renders nothing when NEXT_PUBLIC_GTM_ID is unset.
 */
export function GtmNoScript() {
  if (!GTM_ID) return null
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
        title="Google Tag Manager"
      />
    </noscript>
  )
}
