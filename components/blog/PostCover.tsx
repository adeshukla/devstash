import { BLOG_CATEGORIES, type BlogCategory, type BlogPost } from '@/types/blog'

// Category tones — the same pairing the category badges use (BlogCard's
// CATEGORY_COLORS): frontend blue, automation green, performance amber, AI
// purple, the rest neutral. Used for the bar and dot only, never for text.
const TONE: Record<BlogCategory, string> = {
  frontend: 'var(--color-ds-accent)',
  automation: 'var(--color-ds-success)',
  performance: 'var(--color-ds-warning)',
  'ai-workflows': 'var(--color-ds-purple)',
  devtools: 'var(--color-ds-muted)',
  tutorials: 'var(--color-ds-muted)',
  career: 'var(--color-ds-muted)',
}

/**
 * Typographic cover for a post, in place of a stock illustration: a bar in
 * the category's colour, the category and reading time, and the post's issue
 * number set large. Every cover is distinct (number + colour) and carries
 * information; the title stays in the card body where it is read. Fills its
 * parent, which sets the height. Decorative — the card repeats all of it.
 */
export function PostCover({
  post,
  size = 'card',
}: {
  post: Pick<BlogPost, 'category' | 'readingTime' | 'number'>
  size?: 'card' | 'hero'
}) {
  const tone = TONE[post.category] ?? TONE.devtools
  const label = BLOG_CATEGORIES.find((c) => c.value === post.category)?.label ?? post.category
  return (
    <div
      aria-hidden="true"
      className="relative h-full w-full select-none"
      style={{
        background: `linear-gradient(180deg, color-mix(in srgb, ${tone} 10%, var(--color-ds-surface2)), var(--color-ds-surface2))`,
      }}
    >
      <span className="absolute inset-x-0 top-0 h-1" style={{ background: tone }} />
      <span className="text-ds-muted absolute top-5 left-5 flex items-center gap-2 font-mono text-xs tracking-[0.12em] uppercase sm:left-6">
        <i className="h-1.5 w-1.5 rounded-full" style={{ background: tone }} />
        {label}
      </span>
      <span className="text-ds-muted absolute top-5 right-5 font-mono text-xs sm:right-6">
        {post.readingTime} min
      </span>
      {post.number !== undefined && (
        <span className="text-ds-text absolute bottom-3 left-5 font-bold sm:left-6">
          <span className="text-ds-muted mb-3 block font-mono text-xs font-medium tracking-[0.08em]">
            NO.
          </span>
          <span
            className={`block leading-[0.8] tracking-[-0.06em] ${size === 'hero' ? 'text-[clamp(96px,14vw,168px)]' : 'text-[112px]'}`}
          >
            {String(post.number).padStart(2, '0')}
          </span>
        </span>
      )}
    </div>
  )
}
