'use client'

import { useMemo, useState } from 'react'
import {
  buildFaqJsonLd,
  buildOgImageTsx,
  buildRobotsTs,
  buildSitemapTs,
  origin,
  parseFaqs,
} from '@/lib/lab/seoKit'
import { CssCodeBlock } from './CssCodeBlock'
import { trackLab } from './track'

type Tab = 'faq' | 'robots' | 'sitemap' | 'og'

const TABS: { id: Tab; label: string; file: string }[] = [
  { id: 'faq', label: 'FAQ schema', file: 'JSON-LD' },
  { id: 'robots', label: 'robots.ts', file: 'app/robots.ts' },
  { id: 'sitemap', label: 'sitemap.ts', file: 'app/sitemap.ts' },
  { id: 'og', label: 'OG image', file: 'app/opengraph-image.tsx' },
]

const FAQ_EXAMPLE = `Q: Do you ship to India?
A: Yes. Orders ship within two working days.

Q: Can I return a pair?
A: Within 30 days, unworn, with the box.`

const inputCls =
  'border-ds-border bg-ds-surface2 text-ds-text placeholder:text-ds-muted focus:border-ds-accent w-full rounded-lg border px-3 py-2 text-sm outline-none'

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="text-ds-text mb-1.5 block text-[13px] font-medium">
        {label}
      </label>
      {children}
    </div>
  )
}

/**
 * The Next.js SEO files a new site needs besides metadata: FAQ schema, robots.ts,
 * sitemap.ts and an opengraph-image.tsx. Everything is generated in the browser.
 */
export function SeoKit() {
  const [tab, setTab] = useState<Tab>('faq')
  const [site, setSite] = useState('')
  const [faqText, setFaqText] = useState('')
  const [disallow, setDisallow] = useState('')
  const [paths, setPaths] = useState('')
  const [ogTitle, setOgTitle] = useState('')
  const [siteName, setSiteName] = useState('')
  const [bg, setBg] = useState('#0b0f19')
  const [accent, setAccent] = useState('#3b82f6')

  const faqs = useMemo(() => parseFaqs(faqText), [faqText])

  const code = {
    faq: faqs.length ? buildFaqJsonLd(faqs) : '',
    robots: buildRobotsTs(site, disallow),
    sitemap: buildSitemapTs(site, paths),
    og: buildOgImageTsx({ title: ogTitle, siteName, background: bg, accent }),
  }[tab]

  const current = TABS.find((t) => t.id === tab)!

  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" aria-label="SEO file" className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => {
              setTab(t.id)
              trackLab('seo-kit', 'tab', t.id)
            }}
            className={
              tab === t.id
                ? 'border-ds-accent text-ds-text rounded-full border px-3.5 py-1.5 text-sm font-medium'
                : 'border-ds-border text-ds-muted hover:text-ds-text rounded-full border px-3.5 py-1.5 text-sm'
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab !== 'faq' && tab !== 'og' && (
        <Field id="kit-site" label="Your site address">
          <input
            id="kit-site"
            value={site}
            onChange={(e) => setSite(e.target.value)}
            placeholder="https://example.com"
            className={inputCls}
          />
          {!origin(site) && (tab === 'sitemap' || site.trim()) && (
            <p className="text-ds-warning-strong mt-2 text-sm">
              {site.trim()
                ? 'That does not look like a web address. Use something like https://example.com.'
                : 'Add your site address first: a sitemap needs full URLs, not just paths.'}
            </p>
          )}
        </Field>
      )}

      {tab === 'faq' && (
        <>
          <Field id="kit-faq" label="Questions and answers">
            <textarea
              id="kit-faq"
              rows={7}
              value={faqText}
              onChange={(e) => setFaqText(e.target.value)}
              placeholder={'Q: Your question\nA: Your answer\n\nQ: Next question\nA: Next answer'}
              className={`${inputCls} resize-y font-mono text-xs leading-relaxed`}
            />
            {!faqText && (
              <button
                type="button"
                onClick={() => setFaqText(FAQ_EXAMPLE)}
                className="text-ds-accent-strong mt-2 text-sm hover:underline"
              >
                Try an example
              </button>
            )}
          </Field>
          <p className="text-ds-muted text-sm leading-relaxed">
            The same questions and answers must be visible on the page. Google now shows FAQ rich
            results only for a small set of well-known government and health sites, so this will not
            give you the expandable result in search. It is still valid markup that other search and
            AI tools can read.
          </p>
          {faqText.trim() && (
            <p className="text-ds-muted text-sm" aria-live="polite">
              {faqs.length} question{faqs.length === 1 ? '' : 's'} read. Each block needs a line
              starting <code className="text-ds-accent">Q:</code> then a line starting{' '}
              <code className="text-ds-accent">A:</code>, with a blank line between blocks.
            </p>
          )}
        </>
      )}

      {tab === 'robots' && (
        <>
          <Field id="kit-disallow" label="Paths to keep out of search (one per line, optional)">
            <textarea
              id="kit-disallow"
              rows={3}
              value={disallow}
              onChange={(e) => setDisallow(e.target.value)}
              placeholder={'/admin/\n/api/'}
              className={`${inputCls} resize-y font-mono text-xs`}
            />
          </Field>
          <p className="text-ds-muted text-sm leading-relaxed">
            Do not block <code className="text-ds-accent">/_next/</code>. Google needs those script
            and style files to render your page, so any line starting with it is left out. A lone{' '}
            <code className="text-ds-accent">/</code> or <code className="text-ds-accent">*</code>{' '}
            would hide your whole site, so those are left out too.
          </p>
        </>
      )}

      {tab === 'sitemap' && (
        <Field id="kit-paths" label="Your page paths (one per line)">
          <textarea
            id="kit-paths"
            rows={5}
            value={paths}
            onChange={(e) => setPaths(e.target.value)}
            placeholder={'/\n/about\n/blog'}
            className={`${inputCls} resize-y font-mono text-xs`}
          />
          <p className="text-ds-muted mt-2 text-sm leading-relaxed">
            This lists fixed pages. For a blog or shop, loop over your posts or products inside the
            same function.
          </p>
        </Field>
      )}

      {tab === 'og' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="kit-og-title" label="Headline on the image">
            <input
              id="kit-og-title"
              value={ogTitle}
              onChange={(e) => setOgTitle(e.target.value)}
              placeholder="Your page title"
              className={inputCls}
            />
          </Field>
          <Field id="kit-og-site" label="Site name">
            <input
              id="kit-og-site"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="Your site"
              className={inputCls}
            />
          </Field>
          <Field id="kit-og-bg" label="Background (hex)">
            <input
              id="kit-og-bg"
              value={bg}
              onChange={(e) => setBg(e.target.value)}
              className={`${inputCls} font-mono`}
            />
          </Field>
          <Field id="kit-og-accent" label="Site name color (hex)">
            <input
              id="kit-og-accent"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className={`${inputCls} font-mono`}
            />
          </Field>
          <p className="text-ds-muted text-sm leading-relaxed sm:col-span-2">
            Next.js builds a 1200×630 image from this file at build time. It is a plain starting
            point with text only. Edit the JSX to add a logo or font.
          </p>
          {ogTitle.trim().length > 110 && (
            <p className="text-ds-warning-strong text-sm sm:col-span-2">
              This headline is long ({ogTitle.trim().length} characters). Past about 130 it will run
              off the image. Shorten it or lower the font size in the file.
            </p>
          )}
        </div>
      )}

      {code ? (
        <div>
          <p className="text-ds-muted mb-2 text-sm">
            {tab === 'faq' ? (
              'Paste inside the page, in the body or head.'
            ) : (
              <>
                Save as <code className="text-ds-accent">{current.file}</code>.
              </>
            )}
          </p>
          <CssCodeBlock code={code} label={current.file} />
        </div>
      ) : (
        <p className="border-ds-border text-ds-muted rounded-lg border border-dashed p-4 text-sm">
          Add your questions, or press Try an example, to see the code.
        </p>
      )}
    </div>
  )
}
