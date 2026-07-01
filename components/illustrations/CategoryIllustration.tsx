import type { BlogCategory } from '@/types/blog'
import type { ProjectCategory } from '@/types/project'

// One hand-built SVG "scene" per content category, filling the blank
// featured-image slot on blog/project cards with something that actually
// has personality instead of a plain gradient + glyph. All shapes use
// fill-ds-*/stroke-ds-* token utilities (theme-aware, no raw hex) and only
// the existing CSS keyframes from globals.css (animate-float, animate-blink,
// animate-pulse2) — no new animation infra, no client JS, no network cost.

export type Scene =
  | 'frontend'
  | 'automation'
  | 'performance'
  | 'ai-workflows'
  | 'devtools'
  | 'tutorials'
  | 'career'
  | 'clone'
  | 'open-source'
  | 'accessibility'
  | 'architecture'
  | 'shapes'
  | 'link'
  | 'house'
  | 'megaphone'

const BLOG_SCENE: Record<BlogCategory, Scene> = {
  frontend: 'frontend',
  automation: 'automation',
  performance: 'performance',
  'ai-workflows': 'ai-workflows',
  devtools: 'devtools',
  tutorials: 'tutorials',
  career: 'career',
}

const PROJECT_SCENE: Record<ProjectCategory, Scene> = {
  'web-app': 'frontend',
  automation: 'automation',
  tool: 'devtools',
  clone: 'clone',
  'open-source': 'open-source',
}

// Category buckets are broad (7 blog categories, 5 project categories) but
// individual posts/projects are specific — "screen reader accessibility"
// and "n8n workflow patterns" are both technically "frontend"/"automation"
// but shouldn't render the same generic browser-window/gears scene as
// everything else in that bucket. Slug overrides win over category mapping
// for the cases where that mismatch was actually visible and wrong.
const SLUG_SCENE_OVERRIDES: Record<string, Scene> = {
  'screen-reader-accessibility-checklist': 'accessibility',
  'choosing-scalable-architecture-early': 'architecture',
  'css-shapes-playground': 'shapes',
  'utm-builder': 'link',
  'real-estate-listing': 'house',
  'marketing-lead-gen': 'megaphone',
}

interface CategoryIllustrationProps {
  category: BlogCategory | ProjectCategory
  kind: 'blog' | 'project'
  /** Post/project slug — seeds deterministic per-item variation so same-
   * category cards don't render pixel-identical scenes (mirror, background
   * tint, slight rotation), and looked up against SLUG_SCENE_OVERRIDES for
   * a topic-specific scene instead of the generic category one. */
  seed?: string
  /** Force a specific scene regardless of category/slug — used by the
   * illustration generator tool for live preview. */
  sceneOverride?: Scene
  className?: string
}

// Tiny deterministic string hash (FNV-1a) — good enough for picking a
// variant, not for anything security-sensitive.
function hashSeed(seed: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return Math.abs(hash)
}

const BG_TINTS = ['fill-ds-surface2', 'fill-ds-accent/5', 'fill-ds-purple/5'] as const

export function CategoryIllustration({
  category,
  kind,
  seed,
  sceneOverride,
  className,
}: CategoryIllustrationProps) {
  const categoryScene =
    kind === 'blog'
      ? BLOG_SCENE[category as BlogCategory]
      : PROJECT_SCENE[category as ProjectCategory]
  const scene = sceneOverride ?? (seed ? SLUG_SCENE_OVERRIDES[seed] : undefined) ?? categoryScene

  const hash = hashSeed(seed ?? category)
  const bgTint = BG_TINTS[hash % BG_TINTS.length]
  // Small rotation/scale so repeated scenes don't look perfectly stamped —
  // kept subtle (±2.5deg, 0.97-1.03x) so it reads as variation, not a bug.
  // (No horizontal mirror: a few scenes embed text — "$ pnpm dev", "+12" —
  // which would render backwards and unreadable if flipped.)
  const rotate = ((hash % 11) - 5) * 0.5
  const scale = 0.97 + ((hash % 7) / 6) * 0.06

  return (
    <svg
      viewBox="40 15 320 195"
      className={className ?? 'h-full w-full'}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="400" height="225" className={bgTint} />
      <g
        transform={`translate(200 112.5) scale(${scale}) rotate(${rotate}) translate(-200 -112.5)`}
      >
        <SceneContent scene={scene} />
      </g>
    </svg>
  )
}

// Exported so the illustration-generator tool can render any scene directly
// by key, without needing a fake category/kind pairing to route through.
export function SceneContent({ scene }: { scene: Scene }) {
  switch (scene) {
    case 'frontend':
      return <FrontendScene />
    case 'automation':
      return <AutomationScene />
    case 'performance':
      return <PerformanceScene />
    case 'ai-workflows':
      return <AiWorkflowsScene />
    case 'devtools':
      return <DevtoolsScene />
    case 'tutorials':
      return <TutorialsScene />
    case 'career':
      return <CareerScene />
    case 'clone':
      return <CloneScene />
    case 'open-source':
      return <OpenSourceScene />
    case 'accessibility':
      return <AccessibilityScene />
    case 'architecture':
      return <ArchitectureScene />
    case 'shapes':
      return <ShapesScene />
    case 'link':
      return <LinkScene />
    case 'house':
      return <HouseScene />
    case 'megaphone':
      return <MegaphoneScene />
  }
}

// Every scene key, in display order — used by the illustration generator's
// keyword index and its "browse all" fallback.
export const ALL_SCENES: Scene[] = [
  'frontend',
  'automation',
  'performance',
  'ai-workflows',
  'devtools',
  'tutorials',
  'career',
  'clone',
  'open-source',
  'accessibility',
  'architecture',
  'shapes',
  'link',
  'house',
  'megaphone',
]

// Keyword index — maps a scene to the words a topic string is checked
// against. Used by the illustration generator to pick a scene from free
// text. Kept here (not in the generator) so new scenes and their keywords
// stay defined in one place.
export const SCENE_KEYWORDS: Record<Scene, string[]> = {
  frontend: ['frontend', 'react', 'ui', 'component', 'browser', 'web app', 'interface'],
  automation: ['automation', 'workflow', 'n8n', 'pipeline', 'gear', 'script', 'cron'],
  performance: ['performance', 'speed', 'vitals', 'lcp', 'optimization', 'benchmark', 'fast'],
  'ai-workflows': ['ai', 'llm', 'groq', 'model', 'agent', 'prompt', 'neural', 'machine learning'],
  devtools: ['devtools', 'terminal', 'cli', 'tool', 'utility', 'developer tool', 'command'],
  tutorials: ['tutorial', 'guide', 'learn', 'how to', 'course', 'lesson', 'book'],
  career: ['career', 'job', 'launch', 'growth', 'promotion', 'rocket', 'hiring'],
  clone: ['clone', 'duplicate', 'copy', 'fork project', 'mirror'],
  'open-source': ['open source', 'github', 'repository', 'contribution', 'branch', 'pull request'],
  accessibility: ['accessibility', 'a11y', 'screen reader', 'aria', 'wcag', 'inclusive'],
  architecture: ['architecture', 'scalability', 'system design', 'structure', 'foundation'],
  shapes: ['css', 'shapes', 'animation', 'design', 'color', 'gradient', 'style'],
  link: ['link', 'url', 'utm', 'tracking', 'redirect', 'chain'],
  house: ['real estate', 'property', 'listing', 'house', 'home', 'rental'],
  megaphone: ['marketing', 'audit', 'campaign', 'ads', 'lead gen', 'announcement'],
}

// ── Frontend — browser window + a cursor click ripple ──────────────────────
function FrontendScene() {
  return (
    <g>
      <rect
        x="90"
        y="42"
        width="220"
        height="140"
        rx="10"
        className="fill-ds-surface stroke-ds-border"
      />
      <line x1="90" y1="66" x2="310" y2="66" className="stroke-ds-border" strokeWidth="1" />
      <circle cx="104" cy="54" r="4" className="fill-ds-error/70" />
      <circle cx="118" cy="54" r="4" className="fill-ds-warning/70" />
      <circle cx="132" cy="54" r="4" className="fill-ds-success/70" />
      <rect x="108" y="84" width="70" height="10" rx="5" className="fill-ds-accent/60" />
      <rect x="108" y="102" width="140" height="8" rx="4" className="fill-ds-muted/40" />
      <rect x="108" y="118" width="110" height="8" rx="4" className="fill-ds-muted/40" />
      <rect x="108" y="140" width="56" height="24" rx="6" className="fill-ds-accent" />
      <g className="animate-float">
        <circle cx="255" cy="150" r="18" className="fill-ds-purple/15" />
        <path
          d="M248 143l14 7-6 3-2 6-6-16z"
          className="fill-ds-text stroke-ds-text"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </g>
    </g>
  )
}

// ── Automation — two meshing gears ──────────────────────────────────────────
function Gear({ cx, cy, r, className }: { cx: number; cy: number; r: number; className: string }) {
  const teeth = 8
  const spokes = Array.from({ length: teeth }, (_, i) => (360 / teeth) * i)
  return (
    <g className={className}>
      {spokes.map((deg) => (
        <rect
          key={deg}
          x={cx - r * 0.14}
          y={cy - r * 1.22}
          width={r * 0.28}
          height={r * 0.32}
          rx="2"
          className="fill-ds-muted/50"
          transform={`rotate(${deg} ${cx} ${cy})`}
        />
      ))}
      <circle cx={cx} cy={cy} r={r * 0.75} className="fill-ds-surface stroke-ds-border" />
      <circle cx={cx} cy={cy} r={r * 0.28} className="fill-ds-muted/40" />
    </g>
  )
}
function AutomationScene() {
  return (
    <g>
      <Gear
        cx={155}
        cy={112}
        r={46}
        className="[transform-origin:155px_112px] animate-spin [animation-duration:14s]"
      />
      <Gear
        cx={238}
        cy={95}
        r={30}
        className="[transform-origin:238px_95px] animate-spin [animation-direction:reverse] [animation-duration:10s]"
      />
      <circle cx="238" cy="95" r="8" className="fill-ds-accent animate-pulse2" />
    </g>
  )
}

// ── Performance — ascending bars + rocket ───────────────────────────────────
function PerformanceScene() {
  const bars = [
    { x: 110, h: 30 },
    { x: 140, h: 50 },
    { x: 170, h: 40 },
    { x: 200, h: 70 },
    { x: 230, h: 60 },
    { x: 260, h: 90 },
  ]
  return (
    <g>
      <line x1="90" y1="185" x2="310" y2="185" className="stroke-ds-border" strokeWidth="1" />
      {bars.map((b, i) => (
        <rect
          key={b.x}
          x={b.x}
          y={185 - b.h}
          width="20"
          height={b.h}
          rx="4"
          className="fill-ds-accent/70 animate-fade-up origin-bottom"
          style={{ animationDelay: `${i * 90}ms` }}
        />
      ))}
      <g className="animate-float">
        <path d="M270 90l14-14 4 18-18-4z" className="fill-ds-purple" />
        <circle cx="288" cy="76" r="5" className="fill-ds-warning" />
      </g>
    </g>
  )
}

// ── AI workflows — node graph with pulsing connections ──────────────────────
function AiWorkflowsScene() {
  const nodes = [
    { x: 130, y: 70 },
    { x: 110, y: 130 },
    { x: 200, y: 112 },
    { x: 270, y: 70 },
    { x: 270, y: 150 },
  ]
  const edges: [number, number][] = [
    [0, 2],
    [1, 2],
    [2, 3],
    [2, 4],
  ]
  return (
    <g>
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].x}
          y1={nodes[a].y}
          x2={nodes[b].x}
          y2={nodes[b].y}
          className="stroke-ds-border"
          strokeWidth="1.5"
        />
      ))}
      {nodes.map((n, i) => (
        <circle
          key={i}
          cx={n.x}
          cy={n.y}
          r={i === 2 ? 12 : 8}
          className={i === 2 ? 'fill-ds-purple animate-pulse2' : 'fill-ds-accent/80'}
          style={{ animationDelay: `${i * 200}ms` }}
        />
      ))}
    </g>
  )
}

// ── Devtools — terminal window + blinking cursor ────────────────────────────
function DevtoolsScene() {
  return (
    <g>
      <rect
        x="90"
        y="52"
        width="220"
        height="120"
        rx="10"
        className="fill-ds-surface stroke-ds-border"
      />
      <line x1="90" y1="76" x2="310" y2="76" className="stroke-ds-border" strokeWidth="1" />
      <circle cx="104" cy="64" r="4" className="fill-ds-error/70" />
      <circle cx="118" cy="64" r="4" className="fill-ds-warning/70" />
      <circle cx="132" cy="64" r="4" className="fill-ds-success/70" />
      <text x="108" y="100" className="fill-ds-accent" fontFamily="var(--font-mono)" fontSize="12">
        $ pnpm dev
      </text>
      <text x="108" y="120" className="fill-ds-muted" fontFamily="var(--font-mono)" fontSize="11">
        ready in 380ms
      </text>
      <rect x="108" y="132" width="8" height="12" className="fill-ds-accent animate-blink" />
    </g>
  )
}

// ── Tutorials — open book + floating checkmark ──────────────────────────────
function TutorialsScene() {
  return (
    <g>
      <path
        d="M120 70h70a10 10 0 0110 10v80a8 8 0 00-8-6h-72V70z"
        className="fill-ds-surface stroke-ds-border"
      />
      <path
        d="M280 70h-70a10 10 0 00-10 10v80a8 8 0 018-6h72V70z"
        className="fill-ds-surface stroke-ds-border"
      />
      <line x1="130" y1="90" x2="182" y2="90" className="stroke-ds-muted/40" />
      <line x1="130" y1="104" x2="182" y2="104" className="stroke-ds-muted/40" />
      <line x1="218" y1="90" x2="270" y2="90" className="stroke-ds-muted/40" />
      <line x1="218" y1="104" x2="270" y2="104" className="stroke-ds-muted/40" />
      <g className="animate-float">
        <circle cx="285" cy="60" r="16" className="fill-ds-success/20" />
        <path
          d="M277 60l6 6 11-13"
          className="stroke-ds-success"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
    </g>
  )
}

// ── Career — ascending rocket ────────────────────────────────────────────────
function CareerScene() {
  return (
    <g>
      <circle cx="200" cy="112" r="70" className="fill-ds-accent/5" />
      <g className="animate-float">
        <path
          d="M200 60c18 14 22 40 14 62l-28 0c-8-22-4-48 14-62z"
          className="fill-ds-surface stroke-ds-border"
        />
        <circle cx="200" cy="90" r="8" className="fill-ds-accent" />
        <path d="M172 122l-14 24 24-10z" className="fill-ds-purple" />
        <path d="M228 122l14 24-24-10z" className="fill-ds-purple" />
        <path d="M192 122h16l-8 26z" className="fill-ds-warning" />
      </g>
      <circle cx="140" cy="70" r="3" className="fill-ds-muted/50 animate-pulse2" />
      <circle
        cx="270"
        cy="150"
        r="2.5"
        className="fill-ds-muted/50 animate-pulse2"
        style={{ animationDelay: '400ms' }}
      />
      <circle
        cx="255"
        cy="60"
        r="2"
        className="fill-ds-muted/50 animate-pulse2"
        style={{ animationDelay: '800ms' }}
      />
    </g>
  )
}

// ── Clone — two overlapping browser windows ──────────────────────────────────
function CloneScene() {
  return (
    <g>
      <rect
        x="110"
        y="60"
        width="180"
        height="118"
        rx="10"
        className="fill-ds-surface2 stroke-ds-border"
      />
      <rect
        x="90"
        y="46"
        width="180"
        height="118"
        rx="10"
        className="fill-ds-surface stroke-ds-border"
      />
      <line x1="90" y1="68" x2="270" y2="68" className="stroke-ds-border" strokeWidth="1" />
      <circle cx="104" cy="57" r="4" className="fill-ds-error/70" />
      <circle cx="118" cy="57" r="4" className="fill-ds-warning/70" />
      <circle cx="132" cy="57" r="4" className="fill-ds-success/70" />
      <rect x="106" y="86" width="60" height="10" rx="5" className="fill-ds-purple/60" />
      <rect x="106" y="104" width="120" height="8" rx="4" className="fill-ds-muted/40" />
      <rect x="106" y="120" width="90" height="8" rx="4" className="fill-ds-muted/40" />
    </g>
  )
}

// ── Open source — git branch / fork ──────────────────────────────────────────
function OpenSourceScene() {
  return (
    <g>
      <line x1="150" y1="60" x2="150" y2="165" className="stroke-ds-border" strokeWidth="2" />
      <path
        d="M150 105 C150 130, 230 120, 230 150"
        className="stroke-ds-border"
        strokeWidth="2"
        fill="none"
      />
      <circle cx="150" cy="60" r="9" className="fill-ds-accent" />
      <circle cx="150" cy="105" r="9" className="fill-ds-purple animate-pulse2" />
      <circle cx="150" cy="165" r="9" className="fill-ds-accent/70" />
      <circle cx="230" cy="150" r="9" className="fill-ds-success" />
      <rect
        x="256"
        y="140"
        width="34"
        height="20"
        rx="5"
        className="fill-ds-surface stroke-ds-border"
      />
      <text x="262" y="154" className="fill-ds-muted" fontFamily="var(--font-mono)" fontSize="10">
        +12
      </text>
    </g>
  )
}

// ── Accessibility — eye + sound waves + a focus ring ─────────────────────────
function AccessibilityScene() {
  return (
    <g>
      <circle cx="160" cy="112" r="46" className="fill-ds-surface stroke-ds-border" />
      <path
        d="M136 112c6-14 18-22 24-22s18 8 24 22c-6 14-18 22-24 22s-18-8-24-22z"
        className="stroke-ds-accent fill-none"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <circle cx="160" cy="112" r="9" className="fill-ds-accent animate-pulse2" />
      {/* Sound waves — the "hearing" half of the pairing */}
      <path
        d="M228 96a26 26 0 010 32"
        className="stroke-ds-purple/70"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M242 84a44 44 0 010 56"
        className="stroke-ds-purple/40"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Focus ring — keyboard-navigation motif */}
      <g className="animate-float">
        <rect
          x="98"
          y="150"
          width="52"
          height="20"
          rx="6"
          className="stroke-ds-success fill-none"
          strokeWidth="2"
          strokeDasharray="3 3"
        />
      </g>
    </g>
  )
}

// ── Architecture — layered building blocks over a blueprint grid ────────────
function ArchitectureScene() {
  return (
    <g>
      {/* Blueprint grid backdrop */}
      <g className="stroke-ds-border" strokeWidth="0.5" opacity="0.5">
        {[60, 90, 120, 150, 180].map((y) => (
          <line key={y} x1="80" y1={y} x2="320" y2={y} />
        ))}
      </g>
      {/* Stacked layers, largest at the base — a system diagram */}
      <rect x="120" y="150" width="160" height="22" rx="4" className="fill-ds-accent/70" />
      <rect x="140" y="122" width="120" height="22" rx="4" className="fill-ds-purple/60" />
      <rect x="160" y="94" width="80" height="22" rx="4" className="fill-ds-accent" />
      <g className="animate-float">
        <circle cx="200" cy="68" r="10" className="fill-ds-warning" />
      </g>
    </g>
  )
}

// ── Shapes — a small live composition of blob + hexagon + circle ────────────
function ShapesScene() {
  return (
    <g>
      <circle cx="140" cy="150" r="26" className="fill-ds-purple/70 animate-pulse2" />
      <path
        d="M235 78 L265 95 L265 128 L235 145 L205 128 L205 95 Z"
        className="fill-ds-accent animate-float"
      />
      <path
        d="M170 70c14 4 20 18 16 30s-18 16-30 12-16-18-12-30 12-16 26-12z"
        className="fill-ds-warning/80"
      />
      <circle
        cx="255"
        cy="160"
        r="10"
        className="fill-ds-success animate-pulse2"
        style={{ animationDelay: '400ms' }}
      />
    </g>
  )
}

// ── Link — a chain link plus a tagged URL pill ───────────────────────────────
function LinkScene() {
  return (
    <g>
      <g strokeLinecap="round">
        <rect
          x="120"
          y="95"
          width="48"
          height="26"
          rx="13"
          className="stroke-ds-accent fill-none"
          strokeWidth="6"
          transform="rotate(-25 144 108)"
        />
        <rect
          x="152"
          y="105"
          width="48"
          height="26"
          rx="13"
          className="stroke-ds-purple fill-none"
          strokeWidth="6"
          transform="rotate(-25 176 118)"
        />
      </g>
      <g className="animate-float">
        <rect
          x="215"
          y="140"
          width="80"
          height="26"
          rx="13"
          className="fill-ds-surface stroke-ds-border"
        />
        <circle cx="230" cy="153" r="4" className="fill-ds-success" />
        <text x="242" y="157" className="fill-ds-muted" fontFamily="var(--font-mono)" fontSize="10">
          ?utm_source
        </text>
      </g>
    </g>
  )
}

// ── House — a simple property silhouette ─────────────────────────────────────
function HouseScene() {
  return (
    <g>
      <path
        d="M130 128 L200 78 L270 128 V172 H130 Z"
        className="fill-ds-surface stroke-ds-border"
      />
      <path
        d="M118 132 L200 72 L282 132"
        className="stroke-ds-accent fill-none"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="186" y="140" width="28" height="32" className="fill-ds-accent" />
      <rect x="146" y="140" width="22" height="20" className="fill-ds-purple/60" />
      <rect x="232" y="140" width="22" height="20" className="fill-ds-purple/60" />
      <g className="animate-float">
        <circle cx="255" cy="95" r="10" className="fill-ds-warning" />
      </g>
    </g>
  )
}

// ── Megaphone — marketing / lead-gen motif with sound lines ──────────────────
function MegaphoneScene() {
  return (
    <g>
      <path d="M130 110 L180 92 V132 L130 114 Z" className="fill-ds-accent" />
      <path d="M130 100 h-16 a10 10 0 000 20 h16 z" className="fill-ds-accent" />
      <path d="M180 92 L215 78 V146 L180 132 Z" className="fill-ds-purple" />
      <rect
        x="150"
        y="118"
        width="10"
        height="26"
        rx="4"
        className="fill-ds-warning"
        transform="rotate(15 155 131)"
      />
      <g className="animate-pulse2">
        <path
          d="M225 95a30 30 0 010 40"
          className="stroke-ds-muted/60"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M238 82a52 52 0 010 66"
          className="stroke-ds-muted/30"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </g>
  )
}
