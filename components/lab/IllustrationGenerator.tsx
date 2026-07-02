'use client'

import { useMemo, useState } from 'react'
import {
  CategoryIllustration,
  ALL_SCENES,
  SCENE_KEYWORDS,
  type Scene,
} from '@/components/illustrations/CategoryIllustration'
import {
  generateComposition,
  renderComposition,
  serializeComposition,
  illustrationKeyframes,
  ALL_MOTIFS,
  MOTIF_LABELS,
  PALETTE_LABELS,
  type MotifKey,
  type PaletteKey,
  type AnimationKey,
  type Density,
} from './illustrationEngine'
import {
  generateCharacterComposition,
  renderCharacterComposition,
  serializeCharacterComposition,
  CHARACTER_KEYFRAMES,
  CHARACTER_SCENES,
  CHARACTER_SCENE_LABELS,
  PERSON_STYLE_LABELS,
  SKIN_TONES,
  type CharacterScene,
  type PersonStyle,
} from './characterEngine'
import type { Theme } from './designTokens'
import { CssCodeBlock } from './CssCodeBlock'

const CHARACTER_SCENE_KEYWORDS: Record<CharacterScene, string[]> = {
  wave: ['hello', 'welcome', 'contact', 'greet', 'intro', 'about us', 'meet'],
  present: [
    'growth',
    'results',
    'presenting',
    'analytics',
    'report',
    'roi',
    'success story',
    'pitch',
  ],
  boardroom: [
    'boardroom',
    'conference',
    'meeting room',
    'quarterly',
    'stakeholder',
    'business review',
  ],
  team: ['team', 'people', 'staff', 'company', 'we are', 'our team', 'careers', 'hiring'],
  handshake: ['deal', 'partnership', 'agreement', 'client', 'onboarding', 'contract', 'handshake'],
  celebrate: ['celebrate', 'success', 'launch', 'win', 'achievement', 'milestone', 'anniversary'],
  idea: ['idea', 'innovation', 'strategy', 'brainstorm', 'concept', 'vision', 'insight'],
}

function autoCharacterScene(topic: string): CharacterScene {
  const lower = topic.toLowerCase()
  let best: CharacterScene = 'wave'
  let bestScore = 0
  for (const scene of CHARACTER_SCENES) {
    const score = CHARACTER_SCENE_KEYWORDS[scene].filter((kw) => lower.includes(kw)).length
    if (score > bestScore) {
      bestScore = score
      best = scene
    }
  }
  return best
}

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
  design: 'Design',
}

const DENSITY_LABELS: Record<Density, string> = { 1: 'Minimal', 2: 'Balanced', 3: 'Rich' }

function rankScenes(topic: string): { scene: Scene; score: number }[] {
  const lower = topic.toLowerCase()
  return ALL_SCENES.map((scene) => {
    const score = SCENE_KEYWORDS[scene].filter((kw) => lower.includes(kw)).length
    return { scene, score }
  }).sort((a, b) => b.score - a.score)
}

/**
 * Two tools in one: a real generator that composes a unique SVG from
 * motif primitives (the default — no fixed list to pick from), and a
 * scene matcher (the old behavior) for the actual site workflow of
 * assigning one of the 16 hand-built CategoryIllustration scenes to a
 * real post/project slug.
 */
export function IllustrationGenerator() {
  const [tab, setTab] = useState<'generate' | 'match'>('generate')

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab('generate')}
          aria-pressed={tab === 'generate'}
          className={
            tab === 'generate'
              ? 'bg-ds-accent rounded-lg px-4 py-2 text-sm font-medium text-white'
              : 'border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent rounded-lg border px-4 py-2 text-sm transition-colors'
          }
        >
          Generate a custom illustration
        </button>
        <button
          type="button"
          onClick={() => setTab('match')}
          aria-pressed={tab === 'match'}
          className={
            tab === 'match'
              ? 'bg-ds-accent rounded-lg px-4 py-2 text-sm font-medium text-white'
              : 'border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent rounded-lg border px-4 py-2 text-sm transition-colors'
          }
        >
          Match a site scene
        </button>
      </div>

      {tab === 'generate' ? <GenerateTab /> : <MatchTab />}
    </div>
  )
}

type Style = 'abstract' | 'character'

function GenerateTab() {
  const [style, setStyle] = useState<Style>('abstract')
  const [topic, setTopic] = useState('')
  const [nonce, setNonce] = useState(0)
  const [density, setDensity] = useState<Density>(2)
  const [palette, setPalette] = useState<PaletteKey>('auto')

  // abstract-only
  const [motifOverride, setMotifOverride] = useState<MotifKey[]>([])
  const [animation, setAnimation] = useState<AnimationKey>('float')

  // shared: which theme's code is copied — set by clicking a preview panel
  const [codeTheme, setCodeTheme] = useState<Theme>('dark')

  // character-only
  const [selectedCharScene, setSelectedCharScene] = useState<CharacterScene | null>(null)
  const [skinTone, setSkinTone] = useState(SKIN_TONES[2].value)
  const [personStyle, setPersonStyle] = useState<PersonStyle>('masculine')
  const [motionOn, setMotionOn] = useState(true)

  const composition = useMemo(
    () => generateComposition({ topic, nonce, density, motifs: motifOverride, palette, animation }),
    [topic, nonce, density, motifOverride, palette, animation]
  )
  const svgCode = useMemo(
    () => serializeComposition(composition, animation, codeTheme),
    [composition, animation, codeTheme]
  )

  const activeCharScene = selectedCharScene ?? autoCharacterScene(topic)
  const charComposition = useMemo(
    () =>
      generateCharacterComposition({
        scene: activeCharScene,
        nonce,
        density,
        palette,
        skinTone,
        style: personStyle,
      }),
    [activeCharScene, nonce, density, palette, skinTone, personStyle]
  )
  const charSvgCode = useMemo(
    () => serializeCharacterComposition(charComposition, motionOn, codeTheme),
    [charComposition, motionOn, codeTheme]
  )

  function toggleMotif(m: MotifKey) {
    setMotifOverride((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]))
  }

  const usingAuto = motifOverride.length === 0
  const isCharacter = style === 'character'

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-ds-muted mb-3 font-mono text-xs tracking-wide uppercase">Style</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStyle('abstract')}
            aria-pressed={style === 'abstract'}
            className={
              style === 'abstract'
                ? 'bg-ds-accent rounded-lg px-3 py-1.5 text-sm font-medium text-white'
                : 'border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent rounded-lg border px-3 py-1.5 text-sm transition-colors'
            }
          >
            Abstract (shapes, charts, network)
          </button>
          {/* "Character" style toggle intentionally hidden for now — the
              character scenes need another quality pass. All the underlying
              logic below (isCharacter branches, characterEngine imports)
              is untouched; re-add this button to bring it back. */}
        </div>
      </div>

      <div>
        <label htmlFor="topic" className="text-ds-text mb-1.5 block text-sm font-medium">
          Describe what this illustration is for
        </label>
        <textarea
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={
            isCharacter
              ? 'e.g. A friendly hello for a contact page hero'
              : 'e.g. A guide to debugging a Next.js hydration mismatch with real DevTools screenshots'
          }
          rows={3}
          className="border-ds-border bg-ds-surface2 text-ds-text placeholder:text-ds-muted focus:border-ds-accent w-full resize-none rounded-lg border px-4 py-3 text-sm transition-colors outline-none"
        />
        {isCharacter ? (
          <p className="text-ds-muted mt-2 text-xs">
            {selectedCharScene ? (
              <>Manual scene selected — clear it below to go back to auto.</>
            ) : (
              <>
                Auto-picked scene:{' '}
                <span className="text-ds-accent font-medium">
                  {CHARACTER_SCENE_LABELS[activeCharScene]}
                </span>
                . Pick one manually below to take over.
              </>
            )}
          </p>
        ) : (
          <p className="text-ds-muted mt-2 text-xs">
            {usingAuto ? (
              <>
                Auto-picked from your description:{' '}
                <span className="text-ds-accent font-medium">
                  {composition.matchedMotifs.map((m) => MOTIF_LABELS[m]).join(', ')}
                </span>
                . Toggle motifs below to take over manually.
              </>
            ) : (
              <>Manual motif selection active — clear a motif below to go back to auto.</>
            )}
          </p>
        )}
      </div>

      {/* Light / dark side-by-side preview — click a panel to make its
          colors the ones shown in the copyable code below */}
      <div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setCodeTheme('dark')}
            aria-pressed={codeTheme === 'dark'}
            data-theme="dark"
            className={`bg-ds-bg overflow-hidden rounded-xl text-left transition-shadow ${codeTheme === 'dark' ? 'ring-ds-accent ring-2' : 'ring-1 ring-transparent'}`}
          >
            <p className="text-ds-muted flex items-center justify-between px-3 pt-3 font-mono text-[11px] tracking-wide uppercase">
              Dark {codeTheme === 'dark' && <span className="text-ds-accent">● code shown</span>}
            </p>
            <div className="aspect-video p-3">
              <svg viewBox="0 0 400 225" className="h-full w-full rounded-lg">
                {isCharacter
                  ? renderCharacterComposition(charComposition, motionOn)
                  : renderComposition(composition, animation)}
              </svg>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setCodeTheme('light')}
            aria-pressed={codeTheme === 'light'}
            data-theme="light"
            className={`bg-ds-bg overflow-hidden rounded-xl text-left transition-shadow ${codeTheme === 'light' ? 'ring-ds-accent ring-2' : 'ring-1 ring-transparent'}`}
          >
            <p className="text-ds-muted flex items-center justify-between px-3 pt-3 font-mono text-[11px] tracking-wide uppercase">
              Light {codeTheme === 'light' && <span className="text-ds-accent">● code shown</span>}
            </p>
            <div className="aspect-video p-3">
              <svg viewBox="0 0 400 225" className="h-full w-full rounded-lg">
                {isCharacter
                  ? renderCharacterComposition(charComposition, motionOn)
                  : renderComposition(composition, animation)}
              </svg>
            </div>
          </button>
        </div>
        <p className="text-ds-muted mt-2 text-xs">
          Click a preview to switch the copyable code below to that theme's actual colors.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setNonce((n) => n + 1)}
        className="border-ds-border text-ds-text hover:border-ds-accent hover:text-ds-accent w-fit rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
      >
        Shuffle layout
      </button>

      {isCharacter ? (
        <>
          <div>
            <p className="text-ds-muted mb-3 font-mono text-xs tracking-wide uppercase">
              Scene ({CHARACTER_SCENES.length} corporate scenes — click to override auto-selection)
            </p>
            <div className="flex flex-wrap gap-2">
              {CHARACTER_SCENES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedCharScene((prev) => (prev === s ? null : s))}
                  aria-pressed={activeCharScene === s}
                  className={
                    activeCharScene === s
                      ? 'bg-ds-accent rounded-lg px-3 py-1.5 text-sm font-medium text-white'
                      : 'border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent rounded-lg border px-3 py-1.5 text-sm transition-colors'
                  }
                >
                  {CHARACTER_SCENE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-8">
            <div>
              <p className="text-ds-muted mb-3 font-mono text-xs tracking-wide uppercase">
                Figure style
              </p>
              <div className="flex gap-2">
                {(Object.keys(PERSON_STYLE_LABELS) as PersonStyle[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setPersonStyle(s)}
                    aria-pressed={personStyle === s}
                    className={
                      personStyle === s
                        ? 'bg-ds-accent rounded-lg px-3 py-1.5 text-sm font-medium text-white'
                        : 'border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent rounded-lg border px-3 py-1.5 text-sm transition-colors'
                    }
                  >
                    {PERSON_STYLE_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-ds-muted mb-3 font-mono text-xs tracking-wide uppercase">
                Skin tone
              </p>
              <div className="flex flex-wrap gap-3">
                {SKIN_TONES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setSkinTone(t.value)}
                    aria-label={`Set skin tone to ${t.name}`}
                    aria-pressed={skinTone === t.value}
                    className="h-9 w-9 shrink-0 rounded-full transition-transform hover:scale-110"
                    style={{
                      background: t.value,
                      boxShadow:
                        skinTone === t.value
                          ? `0 0 0 2px var(--color-ds-bg), 0 0 0 4px ${t.value}`
                          : undefined,
                    }}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="text-ds-muted mb-3 font-mono text-xs tracking-wide uppercase">
                Outfit palette
              </p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(PALETTE_LABELS) as PaletteKey[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPalette(p)}
                    aria-pressed={palette === p}
                    className={
                      palette === p
                        ? 'bg-ds-accent rounded-lg px-3 py-1.5 text-sm font-medium text-white'
                        : 'border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent rounded-lg border px-3 py-1.5 text-sm transition-colors'
                    }
                  >
                    {PALETTE_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-ds-muted mb-3 font-mono text-xs tracking-wide uppercase">
                {activeCharScene === 'team' ? 'Team size' : 'Density'}
              </p>
              <div className="flex gap-2">
                {([1, 2, 3] as Density[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDensity(d)}
                    aria-pressed={density === d}
                    className={
                      density === d
                        ? 'bg-ds-accent rounded-lg px-3 py-1.5 text-sm font-medium text-white'
                        : 'border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent rounded-lg border px-3 py-1.5 text-sm transition-colors'
                    }
                  >
                    {DENSITY_LABELS[d]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-ds-muted mb-3 font-mono text-xs tracking-wide uppercase">Motion</p>
              <div className="flex gap-2">
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => setMotionOn(v)}
                    aria-pressed={motionOn === v}
                    className={
                      motionOn === v
                        ? 'bg-ds-accent rounded-lg px-3 py-1.5 text-sm font-medium text-white'
                        : 'border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent rounded-lg border px-3 py-1.5 text-sm transition-colors'
                    }
                  >
                    {v ? 'On' : 'Off'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <p className="text-ds-muted mb-2 text-sm">
              Standalone SVG — self-contained (embedded keyframes, fallback colors), paste it
              anywhere:
            </p>
            <CssCodeBlock code={charSvgCode} />
          </div>
        </>
      ) : (
        <>
          <div>
            <p className="text-ds-muted mb-3 font-mono text-xs tracking-wide uppercase">
              Motifs ({ALL_MOTIFS.length} primitives — click to override auto-selection)
            </p>
            <div className="flex flex-wrap gap-2">
              {ALL_MOTIFS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleMotif(m)}
                  aria-pressed={motifOverride.includes(m)}
                  className={
                    motifOverride.includes(m)
                      ? 'bg-ds-accent rounded-lg px-3 py-1.5 text-sm font-medium text-white'
                      : composition.matchedMotifs.includes(m) && usingAuto
                        ? 'border-ds-accent text-ds-accent rounded-lg border px-3 py-1.5 text-sm transition-colors'
                        : 'border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent rounded-lg border px-3 py-1.5 text-sm transition-colors'
                  }
                >
                  {MOTIF_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-8">
            <div>
              <p className="text-ds-muted mb-3 font-mono text-xs tracking-wide uppercase">
                Density
              </p>
              <div className="flex gap-2">
                {([1, 2, 3] as Density[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDensity(d)}
                    aria-pressed={density === d}
                    className={
                      density === d
                        ? 'bg-ds-accent rounded-lg px-3 py-1.5 text-sm font-medium text-white'
                        : 'border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent rounded-lg border px-3 py-1.5 text-sm transition-colors'
                    }
                  >
                    {DENSITY_LABELS[d]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-ds-muted mb-3 font-mono text-xs tracking-wide uppercase">
                Palette
              </p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(PALETTE_LABELS) as PaletteKey[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPalette(p)}
                    aria-pressed={palette === p}
                    className={
                      palette === p
                        ? 'bg-ds-accent rounded-lg px-3 py-1.5 text-sm font-medium text-white'
                        : 'border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent rounded-lg border px-3 py-1.5 text-sm transition-colors'
                    }
                  >
                    {PALETTE_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-ds-muted mb-3 font-mono text-xs tracking-wide uppercase">
                Animation
              </p>
              <div className="flex flex-wrap gap-2">
                {(['none', 'float', 'pulse', 'drift'] as AnimationKey[]).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAnimation(a)}
                    aria-pressed={animation === a}
                    className={
                      animation === a
                        ? 'bg-ds-accent rounded-lg px-3 py-1.5 text-sm font-medium text-white capitalize'
                        : 'border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent rounded-lg border px-3 py-1.5 text-sm capitalize transition-colors'
                    }
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <p className="text-ds-muted mb-2 text-sm">
              Standalone SVG — self-contained (embedded keyframes, fallback colors), paste it
              anywhere:
            </p>
            <CssCodeBlock code={svgCode} />
          </div>
        </>
      )}

      <style>{illustrationKeyframes()}</style>
      <style>{CHARACTER_KEYFRAMES}</style>
    </div>
  )
}

function MatchTab() {
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
      <p className="text-ds-muted text-sm">
        This is the real site workflow: match a topic to one of the 16 hand-built
        CategoryIllustration scenes and get the exact override line for a real blog post or project.
      </p>

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
              setSelectedScene(null)
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
