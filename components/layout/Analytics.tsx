// components/layout/Analytics.tsx
//
// Loads analytics via next/script, all env-gated (nothing renders when the
// corresponding env var is unset):
//   - Google Tag Manager  (NEXT_PUBLIC_GTM_ID)  — afterInteractive
//   - Google Analytics 4  (NEXT_PUBLIC_GA_ID)   — lazyOnload (direct gtag)
//   - Microsoft Clarity   (NEXT_PUBLIC_CLARITY_ID) — lazyOnload
//
// NOTE: GA4 is loaded directly via gtag.js so events fire immediately. GTM is
// also loaded for tag management + dataLayer events. To avoid double-counting,
// do NOT also add a GA4 Configuration tag for the same Measurement ID inside
// GTM — let the direct loader own GA4, and use GTM for other tags/triggers.
import Script from 'next/script'

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID
const GA_ID = process.env.NEXT_PUBLIC_GA_ID
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID

export function Analytics() {
  return (
    <>
      {GTM_ID ? (
        <Script id="gtm-init" strategy="afterInteractive">{`
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
