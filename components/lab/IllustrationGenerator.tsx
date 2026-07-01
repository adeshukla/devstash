'use client'

import { useMemo, useState } from 'react'
import {
  CategoryIllustration,
  ALL_SCENES,
  SCENE_KEYWORDS,
  type Scene,
} from '@/components/illustrations/CategoryIllustration'
import { CssCodeBlock } from './CssCodeBlock'

const SCENE_LABELS: Record<Scene, string> = {
  frontend: 'Frontend',
  automation: 'Automation',
  performance: 'Performance',
  'ai-workflows': 'AI Workflows',
  devtools: 'Devtools',
  tutorials: 'Tutorials',
  career: 'Career',
  clone: 'Clone',
  'open-source': 'Open Source',
  accessibility: 'Accessibility',
  architecture: 'Architecture',
  shapes: 'Shapes',
  link: 'Link',
  house: 'House',
  megaphone: 'Megaphone',
}

/** Ranks every scene by how many of its keywords appear in the topic text.
 * Not real language understanding — a transparent, inspectable keyword match
 * against the exact same SCENE_KEYWORDS index the site's own illustrations
 * use, so "does this actually make sense" is always answerable by reading
 * the keyword list rather than trusting a black box. */
function rankScenes(topic: string): { scene: Scene; score: number }[] {
  const lower = topic.toLowerCase()
  return ALL_SCENES.map((scene) => {
    const score = SCENE_KEYWORDS[scene].filter((kw) => lower.includes(kw)).length
    return { scene, score }
  }).sort((a, b) => b.score - a.score)
}

export function IllustrationGenerator() {
  const [topic, setTopic] = useState('')
  const [slug, setSlug] = useState('')
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null)

  const ranked = useMemo(() => rankScenes(topic), [topic])
  const topMatch = ranked[0]
  const activeScene = selectedScene ?? (topic.trim() ? topMatch.scene : 'frontend')
  const matchedKeywords = topic.trim()
    ? SCENE_KEYWORDS[activeScene].filter((kw) => topic.toLowerCase().includes(kw))
    : []

  const overrideSnippet = slug.trim()
    ? `'${slug.trim()}': '${activeScene}',`
    : `// add a slug above to generate the SLUG_SCENE_OVERRIDES line`

  const usageSnippet = `<CategoryIllustration category="frontend" kind="blog" seed="${
    slug.trim() || 'your-post-slug'
  }" />`

  return (
    <div className="flex flex-col gap-8">
      {/* Inputs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="topic" className="text-ds-text mb-1.5 block text-sm font-medium">
            Topic / title
          </label>
          <input
            id="topic"
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value)
              setSelectedScene(null) // typing a new topic re-enables auto-match
            }}
            placeholder="e.g. Debugging a Next.js hydration mismatch"
            className="border-ds-border bg-ds-surface2 text-ds-text placeholder:text-ds-muted focus:border-ds-accent h-11 w-full rounded-lg border px-4 text-sm transition-colors outline-none"
          />
        </div>
        <div>
          <label htmlFor="slug" className="text-ds-text mb-1.5 block text-sm font-medium">
            Slug (for the override snippet)
          </label>
          <input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g. debugging-hydration-mismatch"
            className="border-ds-border bg-ds-surface2 text-ds-text placeholder:text-ds-muted focus:border-ds-accent h-11 w-full rounded-lg border px-4 text-sm transition-colors outline-none"
          />
        </div>
      </div>

      {/* Match explanation */}
      {topic.trim() && (
        <p className="text-ds-muted text-sm">
          Best match:{' '}
          <span className="text-ds-accent font-medium">{SCENE_LABELS[topMatch.scene]}</span>
          {matchedKeywords.length > 0 ? (
            <>
              {' '}
              — matched <span className="text-ds-text font-mono">{matchedKeywords.join(', ')}</span>
            </>
          ) : (
            <> — no keyword hit, falling back to a default. Pick one manually below.</>
          )}
        </p>
      )}

      {/* Light / dark side-by-side preview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div data-theme="dark" className="bg-ds-bg overflow-hidden rounded-xl">
          <p className="text-ds-muted px-3 pt-3 font-mono text-[11px] tracking-wide uppercase">
            Dark
          </p>
          <div className="aspect-video p-3">
            <CategoryIllustration
              category="frontend"
              kind="blog"
              seed={slug || topic || 'preview'}
              sceneOverride={activeScene}
              className="h-full w-full rounded-lg"
            />
          </div>
        </div>
        <div
          data-theme="light"
          className="bg-ds-bg overflow-hidden rounded-xl border border-transparent"
        >
          <p className="text-ds-muted px-3 pt-3 font-mono text-[11px] tracking-wide uppercase">
            Light
          </p>
          <div className="aspect-video p-3">
            <CategoryIllustration
              category="frontend"
              kind="blog"
              seed={slug || topic || 'preview'}
              sceneOverride={activeScene}
              className="h-full w-full rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Manual scene picker */}
      <div>
        <p className="text-ds-muted mb-3 font-mono text-xs tracking-wide uppercase">
          Or pick a scene manually
        </p>
        <div className="flex flex-wrap gap-2">
          {ALL_SCENES.map((scene) => (
            <button
              key={scene}
              type="button"
              onClick={() => setSelectedScene(scene)}
              aria-pressed={activeScene === scene}
              className={
                activeScene === scene
                  ? 'bg-ds-accent rounded-lg px-3 py-1.5 text-sm font-medium text-white'
                  : 'border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent rounded-lg border px-3 py-1.5 text-sm transition-colors'
              }
            >
              {SCENE_LABELS[scene]}
            </button>
          ))}
        </div>
      </div>

      {/* Copy-ready output */}
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-ds-muted mb-2 text-sm">
            Add this to <code className="text-ds-accent">SLUG_SCENE_OVERRIDES</code> in{' '}
            <code className="text-ds-accent">CategoryIllustration.tsx</code>:
          </p>
          <CssCodeBlock code={overrideSnippet} />
        </div>
        <div>
          <p className="text-ds-muted mb-2 text-sm">
            Or use it directly wherever a card renders this post/project:
          </p>
          <CssCodeBlock code={usageSnippet} />
        </div>
      </div>
    </div>
  )
}
