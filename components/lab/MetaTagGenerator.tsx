'use client'

import { useMemo, useState } from 'react'
import { CssCodeBlock } from './CssCodeBlock'
import { draftFromContent } from './metaDraftEngine'

function countClass(len: number, min: number, max: number): string {
  if (len === 0) return 'text-ds-muted'
  if (len < min || len > max) return 'text-ds-error'
  if (len > max - 10 && len <= max) return 'text-ds-warning'
  return 'text-ds-success'
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
  const [title, setTitle] = useState('DevStash — Developer Portfolio & Automation Blog')
  const [description, setDescription] = useState(
    'A modern developer ecosystem showcasing engineering, automation, AI workflows, and frontend systems — projects, tools, and writing from Adesh Shukla.'
  )
  const [url, setUrl] = useState('https://example.com/page')
  const [siteName, setSiteName] = useState('Example Site')
  const [image, setImage] = useState('')
  const [imageError, setImageError] = useState(false)
  const [twitterHandle, setTwitterHandle] = useState('@example')

  const domain = useMemo(() => {
    try {
      return new URL(url).hostname
    } catch {
      return url.replace(/^https?:\/\//, '').split('/')[0] || 'example.com'
    }
  }, [url])

  function handleDraft() {
    const result = draftFromContent(content)
    if (result.title) setTitle(result.title)
    if (result.description) setDescription(result.description)
  }

  const showImage = image.trim() && !imageError

  const metaCode = useMemo(() => {
    const imageLines = image.trim() ? `<meta property="og:image" content="${image}" />\n\n` : ''
    return `<title>${title}</title>
<meta name="description" content="${description}" />
<link rel="canonical" href="${url}" />

<meta property="og:type" content="website" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:url" content="${url}" />
<meta property="og:site_name" content="${siteName}" />
${imageLines}<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />${
      image.trim() ? `\n<meta name="twitter:image" content="${image}" />` : ''
    }${twitterHandle ? `\n<meta name="twitter:site" content="${twitterHandle}" />` : ''}`
  }, [title, description, url, siteName, image, twitterHandle])

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
          rows={3}
          className="border-ds-border bg-ds-surface text-ds-text placeholder:text-ds-muted focus:border-ds-accent w-full resize-none rounded-lg border px-4 py-3 text-sm transition-colors outline-none"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-ds-muted text-xs">
            Local sentence extraction + filler cleanup — not an AI model call.
          </p>
          <button
            type="button"
            onClick={handleDraft}
            disabled={!content.trim()}
            className="bg-ds-accent shrink-0 rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-40"
          >
            Draft title &amp; description
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="mt-title"
            className="text-ds-text mb-1.5 flex items-center justify-between text-sm font-medium"
          >
            Title
            <span className={`font-mono text-xs ${countClass(title.length, 50, 60)}`}>
              {title.length}/60
            </span>
          </label>
          <input
            id="mt-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
          <span className={`font-mono text-xs ${countClass(description.length, 130, 160)}`}>
            {description.length}/160
          </span>
        </label>
        <textarea
          id="mt-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="border-ds-border bg-ds-surface2 text-ds-text focus:border-ds-accent w-full resize-none rounded-lg border px-4 py-3 text-sm transition-colors outline-none"
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
            className="border-ds-border bg-ds-surface2 text-ds-text focus:border-ds-accent h-11 w-full rounded-lg border px-4 text-sm transition-colors outline-none"
          />
        </div>
      </div>

      {/* Google SERP preview */}
      <div>
        <p className="text-ds-muted mb-3 font-mono text-xs tracking-wide uppercase">
          Google search preview
        </p>
        <div className="rounded-xl bg-white p-5">
          <p className="truncate text-sm text-[#4d5156]">
            {domain} <span className="text-[#4d5156]">›</span>{' '}
            {url
              .replace(/^https?:\/\//, '')
              .split('/')
              .slice(1)
              .join(' › ')}
          </p>
          <p className="mt-1 truncate text-xl text-[#1a0dab]">{title || 'Untitled page'}</p>
          <p className="mt-1 line-clamp-2 text-sm text-[#4d5156]">
            {description || 'No description provided.'}
          </p>
        </div>
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
        <p className="text-ds-muted mb-2 text-sm">Copy the finished &lt;meta&gt; block:</p>
        <CssCodeBlock code={metaCode} />
      </div>
    </div>
  )
}
