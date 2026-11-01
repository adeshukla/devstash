'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui'
import { CssCodeBlock } from './CssCodeBlock'
import { draftFromContent } from './metaDraftEngine'
import { useUrlSync } from './useUrlSync'
import { ShareLinkButton } from './ShareLinkButton'
import { PresetBar } from './PresetBar'
import { pick } from '@/lib/lab/urlState'
import {
  buildHtml,
  buildJsonLd,
  buildNextMetadata,
  fitToWidth,
  type JsonLdType,
  type MetaInput,
} from '@/lib/lab/metaTags'

type OutputTab = 'html' | 'next' | 'jsonld'

const EXAMPLE = {
  title: 'Free Invoice Generator for Freelancers',
  description:
    'Create a clean, professional invoice in under a minute. No sign-up, no watermark: add your details, download the PDF and get paid faster.',
  url: 'https://example.com/invoice-generator',
  siteName: 'Example',
}

// Pixel budgets search results are commonly cited as cutting at. Google changes
// these without notice, so the UI calls them approximate.
const TITLE_PX = 600
const DESC_PX = { desktop: 920, mobile: 680 }

/** Text width via canvas on the client; a rough per-character estimate on the server. */
function makeMeasure(font: string, size: number) {
  let ctx: CanvasRenderingContext2D | null | undefined
  return (s: string) => {
    if (typeof document === 'undefined') return s.length * size * 0.5
    if (ctx === undefined) {
      ctx = document.createElement('canvas').getContext('2d')
      if (ctx) ctx.font = font
    }
    return ctx ? ctx.measureText(s).width : s.length * size * 0.5
  }
}
const measureTitle = makeMeasure('20px Arial, sans-serif', 20)
const measureDesc = makeMeasure('14px Arial, sans-serif', 14)

function countClass(len: number, min: number, max: number): string {
  if (len === 0) return 'text-ds-muted'
  if (len > max) return 'text-ds-error'
  if (len < min) return 'text-ds-warning-strong'
  if (len > max - 10 && len <= max) return 'text-ds-warning'
  return 'text-ds-success'
}

function ShuffleControl({
  index,
  total,
  onShuffle,
}: {
  index: number
  total: number
  onShuffle: () => void
}) {
  if (total < 2) return null
  return (
    <button
      type="button"
      onClick={onShuffle}
      className="text-ds-muted hover:text-ds-accent flex shrink-0 items-center gap-1 font-mono text-xs transition-colors"
      title="Cycle to the next drafted option"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M17 3l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 21l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Shuffle · {index + 1}/{total}
    </button>
  )
}

function ImagePlaceholder({ label }: { label: string }) {
  return (
    <div className="bg-ds-surface2 text-ds-muted flex aspect-[1.91/1] w-full flex-col items-center justify-center gap-1 text-xs">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect
          x="3"
          y="4"
          width="18"
          height="16"
          rx="2"
          className="stroke-ds-muted"
          strokeWidth="1.5"
        />
        <circle cx="8.5" cy="9.5" r="1.5" className="fill-ds-muted" />
        <path d="M3 16l5-5 4 4 3-3 6 6" className="stroke-ds-muted" strokeWidth="1.5" fill="none" />
      </svg>
      {label}
    </div>
  )
}

/**
 * A real SEO utility — type your title/description/URL, see exactly how it
 * renders as a Google result, an X/Twitter card, and a Facebook/OG card,
 * with live character counts against the ranges search engines actually
 * truncate at, and copy the finished <meta> block. Also drafts a real
 * title/description locally from pasted content (extractive summarization,
 * not a model call).
 */
export function MetaTagGenerator() {
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [siteName, setSiteName] = useState('')
  const [image, setImage] = useState('')
  const [imageError, setImageError] = useState(false)
  const [twitterHandle, setTwitterHandle] = useState('')
  const [pageType, setPageType] = useState<MetaInput['type']>('website')
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [tab, setTab] = useState<OutputTab>('html')
  const [jsonLdType, setJsonLdType] = useState<JsonLdType>('WebPage')

  const getShareUrl = useUrlSync(
    {
      t: title,
      d: description,
      u: url,
      site: siteName,
      i: image,
      x: twitterHandle,
      y: pageType === 'website' ? '' : pageType,
    },
    (get) => {
      setTitle(get('t') ?? '')
      setDescription(get('d') ?? '')
      setUrl(get('u') ?? '')
      setSiteName(get('site') ?? '')
      setImage(get('i') ?? '')
      setTwitterHandle(get('x') ?? '')
      setPageType(pick(get('y'), ['website', 'article'] as const, 'website'))
    }
  )

  function loadExample() {
    setTitle(EXAMPLE.title)
    setDescription(EXAMPLE.description)
    setUrl(EXAMPLE.url)
    setSiteName(EXAMPLE.siteName)
  }

  // Candidates + cursor for the "Shuffle" controls — draftFromContent()
  // returns several ranked options per field, and shuffle just cycles the
  // index rather than re-running the analysis.
  const [titleCandidates, setTitleCandidates] = useState<string[]>([])
  const [titleCandidateIndex, setTitleCandidateIndex] = useState(0)
  const [descCandidates, setDescCandidates] = useState<string[]>([])
  const [descCandidateIndex, setDescCandidateIndex] = useState(0)

  const domain = useMemo(() => {
    try {
      return new URL(url).hostname
    } catch {
      return url.replace(/^https?:\/\//, '').split('/')[0] || 'yoursite.com'
    }
  }, [url])

  function handleDraft() {
    const result = draftFromContent(content)
    setTitleCandidates(result.titleCandidates)
    setTitleCandidateIndex(0)
    if (result.titleCandidates[0]) setTitle(result.titleCandidates[0])
    setDescCandidates(result.descriptionCandidates)
    setDescCandidateIndex(0)
    if (result.descriptionCandidates[0]) setDescription(result.descriptionCandidates[0])
  }

  function handleShuffleTitle() {
    if (titleCandidates.length < 2) return
    const next = (titleCandidateIndex + 1) % titleCandidates.length
    setTitleCandidateIndex(next)
    setTitle(titleCandidates[next])
  }

  function handleShuffleDescription() {
    if (descCandidates.length < 2) return
    const next = (descCandidateIndex + 1) % descCandidates.length
    setDescCandidateIndex(next)
    setDescription(descCandidates[next])
  }

  const showImage = image.trim() && !imageError

  const meta: MetaInput = useMemo(
    () => ({ title, description, url, siteName, image, twitter: twitterHandle, type: pageType }),
    [title, description, url, siteName, image, twitterHandle, pageType]
  )
  const output = useMemo(() => {
    if (tab === 'next') return buildNextMetadata(meta)
    if (tab === 'jsonld') return buildJsonLd(meta, jsonLdType)
    return buildHtml(meta)
  }, [tab, meta, jsonLdType])

  const titleFit = fitToWidth(title, TITLE_PX, measureTitle)
  const descFit = fitToWidth(description, DESC_PX[device], measureDesc)

  return (
    <div className="flex flex-col gap-8">
      {/* Draft from content */}
      <div className="border-ds-border bg-ds-surface2/50 rounded-xl border p-4">
        <label htmlFor="mt-content" className="text-ds-text mb-1.5 block text-sm font-medium">
          Draft from your content
        </label>
        <textarea
          id="mt-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste a topic sentence, an intro paragraph, or a full draft — the tool will pull a title and description out of it."
          rows={5}
          className="border-ds-border bg-ds-surface text-ds-text placeholder:text-ds-muted focus:border-ds-accent w-full resize-y rounded-lg border px-4 py-3 text-sm leading-relaxed transition-colors outline-none"
        />
        <div className="mt-2 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-ds-muted text-xs">
            Local analysis + phrase composition, not an AI model call — drafts several options,
            cycle them with Shuffle.
          </p>
          <Button
            type="button"
            onClick={handleDraft}
            disabled={!content.trim()}
            size="sm"
            className="w-full sm:w-auto"
          >
            Draft title &amp; description
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="mt-title"
            className="text-ds-text mb-1.5 flex items-center justify-between text-sm font-medium"
          >
            Title
            <span className="flex items-center gap-3">
              <ShuffleControl
                index={titleCandidateIndex}
                total={titleCandidates.length}
                onShuffle={handleShuffleTitle}
              />
              <span className={`font-mono text-xs ${countClass(title.length, 50, 60)}`}>
                {title.length}/60
              </span>
              <span className="text-ds-muted font-mono text-xs">
                ≈{Math.round(titleFit.width)}/{TITLE_PX}px
              </span>
            </span>
          </label>
          <input
            id="mt-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Your page title"
            className="border-ds-border bg-ds-surface2 text-ds-text focus:border-ds-accent h-11 w-full rounded-lg border px-4 text-sm transition-colors outline-none"
          />
        </div>
        <div>
          <label htmlFor="mt-url" className="text-ds-text mb-1.5 block text-sm font-medium">
            URL
          </label>
          <input
            id="mt-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://yoursite.com/page"
            className="border-ds-border bg-ds-surface2 text-ds-text focus:border-ds-accent h-11 w-full rounded-lg border px-4 text-sm transition-colors outline-none"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="mt-desc"
          className="text-ds-text mb-1.5 flex items-center justify-between text-sm font-medium"
        >
          Description
          <span className="flex items-center gap-3">
            <ShuffleControl
              index={descCandidateIndex}
              total={descCandidates.length}
              onShuffle={handleShuffleDescription}
            />
            <span className={`font-mono text-xs ${countClass(description.length, 130, 160)}`}>
              {description.length}/160
            </span>
          </span>
        </label>
        <textarea
          id="mt-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What the page offers, in one or two sentences"
          rows={5}
          className="border-ds-border bg-ds-surface2 text-ds-text focus:border-ds-accent w-full resize-y rounded-lg border px-4 py-3 text-sm leading-relaxed transition-colors outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="mt-site" className="text-ds-text mb-1.5 block text-sm font-medium">
            Site name
          </label>
          <input
            id="mt-site"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            placeholder="Your brand"
            className="border-ds-border bg-ds-surface2 text-ds-text focus:border-ds-accent h-11 w-full rounded-lg border px-4 text-sm transition-colors outline-none"
          />
        </div>
        <div>
          <label htmlFor="mt-image" className="text-ds-text mb-1.5 block text-sm font-medium">
            OG image URL <span className="text-ds-muted font-normal">(optional)</span>
          </label>
          <input
            id="mt-image"
            value={image}
            onChange={(e) => {
              setImage(e.target.value)
              setImageError(false)
            }}
            placeholder="https://yoursite.com/og-image.jpg"
            className="border-ds-border bg-ds-surface2 text-ds-text placeholder:text-ds-muted focus:border-ds-accent h-11 w-full rounded-lg border px-4 text-sm transition-colors outline-none"
          />
        </div>
        <div>
          <label htmlFor="mt-twitter" className="text-ds-text mb-1.5 block text-sm font-medium">
            Twitter/X handle
          </label>
          <input
            id="mt-twitter"
            value={twitterHandle}
            onChange={(e) => setTwitterHandle(e.target.value)}
            placeholder="@yourhandle"
            className="border-ds-border bg-ds-surface2 text-ds-text focus:border-ds-accent h-11 w-full rounded-lg border px-4 text-sm transition-colors outline-none"
          />
        </div>
      </div>

      {/* Google SERP preview */}
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-ds-muted font-mono text-xs tracking-wide uppercase">
            Google search preview (approximate)
          </p>
          <div className="flex gap-2">
            {(['desktop', 'mobile'] as const).map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={device === d}
                onClick={() => setDevice(d)}
                className={
                  device === d
                    ? 'bg-ds-cta rounded-lg px-3 py-1 text-xs font-medium text-white capitalize'
                    : 'border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent rounded-lg border px-3 py-1 text-xs capitalize transition-colors'
                }
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className={`rounded-xl bg-white p-5 ${device === 'mobile' ? 'max-w-[380px]' : ''}`}>
          <p className="truncate text-sm text-[#4d5156]">
            {domain} <span className="text-[#4d5156]">›</span>{' '}
            {url
              .replace(/^https?:\/\//, '')
              .split('/')
              .slice(1)
              .join(' › ')}
          </p>
          <p className="mt-1 text-xl leading-snug break-words text-[#1a0dab]">
            {title ? titleFit.text : 'Untitled page'}
          </p>
          <p className="mt-1 text-sm break-words text-[#4d5156]">
            {description ? descFit.text : 'No description provided.'}
          </p>
        </div>
        <p className="text-ds-muted mt-2 text-xs">
          Cut at about {TITLE_PX}px for the title and {DESC_PX[device]}px for the description
          (measured in Arial). Google changes these without notice, so treat the cut-off as a guide.
        </p>
      </div>

      {/* Social card previews */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="text-ds-muted mb-3 font-mono text-xs tracking-wide uppercase">
            X / Twitter card
          </p>
          <div className="border-ds-border overflow-hidden rounded-xl border">
            {showImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt=""
                className="aspect-[1.91/1] w-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <ImagePlaceholder label={imageError ? 'Image failed to load' : '1200×630 image'} />
            )}
            <div className="bg-ds-surface p-4">
              <p className="text-ds-muted truncate text-xs">{domain}</p>
              <p className="text-ds-text mt-1 truncate text-sm font-semibold">{title}</p>
              <p className="text-ds-muted mt-1 line-clamp-2 text-xs">{description}</p>
            </div>
          </div>
        </div>
        <div>
          <p className="text-ds-muted mb-3 font-mono text-xs tracking-wide uppercase">
            Facebook / OG card
          </p>
          <div className="border-ds-border overflow-hidden rounded-xl border">
            {showImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt=""
                className="aspect-[1.91/1] w-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <ImagePlaceholder label={imageError ? 'Image failed to load' : '1200×630 image'} />
            )}
            <div className="bg-ds-surface p-4">
              <p className="text-ds-muted truncate text-xs tracking-wide uppercase">{domain}</p>
              <p className="text-ds-text mt-1 truncate text-sm font-semibold">{title}</p>
              <p className="text-ds-muted mt-1 line-clamp-2 text-xs">{description}</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['html', 'HTML'],
                ['next', 'Next.js metadata'],
                ['jsonld', 'JSON-LD'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={tab === key}
                onClick={() => setTab(key)}
                className={
                  tab === key
                    ? 'bg-ds-cta rounded-lg px-3 py-1.5 text-sm font-medium text-white'
                    : 'border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent rounded-lg border px-3 py-1.5 text-sm transition-colors'
                }
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={loadExample}>
              Load example
            </Button>
            <ShareLinkButton getUrl={getShareUrl} tool="meta-tags" />
          </div>
          <PresetBar tool="meta-tags" getUrl={getShareUrl} />
        </div>

        {tab === 'next' && (
          <p className="text-ds-muted mb-2 text-sm">
            Paste into <code className="text-ds-accent">app/your-page/page.tsx</code> or a layout.
          </p>
        )}
        {tab === 'jsonld' && (
          <div className="mb-2 flex flex-wrap items-center gap-3 text-sm">
            <label htmlFor="mt-jsonld" className="text-ds-muted">
              Type
            </label>
            <select
              id="mt-jsonld"
              value={jsonLdType}
              onChange={(e) => setJsonLdType(e.target.value as JsonLdType)}
              className="border-ds-border bg-ds-surface2 text-ds-text rounded-lg border px-3 py-1.5 text-sm"
            >
              <option value="WebPage">WebPage</option>
              <option value="Article">Article</option>
            </select>
            {jsonLdType === 'Article' && (
              <span className="text-ds-muted text-xs">
                Add author and datePublished yourself: they are your real details.
              </span>
            )}
          </div>
        )}
        {tab === 'html' && (
          <div className="mb-2 flex flex-wrap items-center gap-3 text-sm">
            <label htmlFor="mt-type" className="text-ds-muted">
              og:type
            </label>
            <select
              id="mt-type"
              value={pageType}
              onChange={(e) => setPageType(e.target.value as MetaInput['type'])}
              className="border-ds-border bg-ds-surface2 text-ds-text rounded-lg border px-3 py-1.5 text-sm"
            >
              <option value="website">website</option>
              <option value="article">article</option>
            </select>
          </div>
        )}

        {title.trim() || description.trim() ? (
          <CssCodeBlock
            code={output}
            label={tab === 'html' ? 'HTML' : tab === 'next' ? 'TypeScript' : 'JSON-LD'}
          />
        ) : (
          <p className="border-ds-border text-ds-muted rounded-lg border border-dashed p-4 text-sm">
            Add a title or description, or press Load example, to see the code.
          </p>
        )}
      </div>
    </div>
  )
}
