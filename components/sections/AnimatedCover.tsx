import type { CSSProperties, ReactNode } from 'react'
import { projectBrand } from '@/components/icons/ProjectMark'
import './AnimatedCover.css'

// The shipped brand cover (project colour tinted into the card surface, with
// its real mark) plus one loop per product that shows what it does, and the
// project's own facts as chips. Fills its parent, which sets the height.
// Server Component: pure CSS, no client JS.

const SCENES: Record<string, ReactNode> = {
  praxis: (
    <>
      <span className="chip c1 p pop">why?</span>
      <span className="chip c2 p pop">and then?</span>
      <span className="chip c3 p pop">prove it</span>
      <span className="chip c4 p pop">what breaks?</span>
    </>
  ),
  pare: (
    <>
      <span className="lab o p fd">original</span>
      <span className="bar o p fd" />
      <span className="lab n p fd">optimised</span>
      <span className="bar n p sq" />
    </>
  ),
  'build-components': (
    <>
      <span className="ui t p tg">
        <i />
      </span>
      <span className="ui k p kk">
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 8.5l3.2 3L13 4.5" />
        </svg>
      </span>
      <span className="ui b p bb">Save</span>
    </>
  ),
  'motion-lab': (
    <span className="tl p tlp">
      <i />
    </span>
  ),
  'css-shapes-playground': (
    <>
      <span className="sh s1 p morph" />
      <span className="sh s2 p morph" />
      <span className="sh s3 p morph" />
    </>
  ),
  'illustration-generator': (
    <svg className="ill p draw" viewBox="0 0 200 34" aria-hidden="true">
      <path pathLength="100" d="M4 26 C30 2 50 2 70 20 S110 34 130 14 S170 2 196 24" />
    </svg>
  ),
  'meta-tag-generator': (
    <span className="serp p">
      <i className="t" />
      <i className="u" />
      <i className="d" />
      <i className="d s" />
    </span>
  ),
  'utm-builder': (
    <span className="utm p">
      <span>?utm_source</span>
      <span>&amp;utm_medium</span>
      <span>&amp;utm_campaign</span>
    </span>
  ),
}

export function AnimatedCover({ slug, stats = [] }: { slug: string; stats?: string[] }) {
  const { color, Mark } = projectBrand(slug)
  return (
    <div
      aria-hidden="true"
      className="ac select-none"
      style={{ '--brand': color } as CSSProperties}
    >
      {SCENES[slug]}
      <span className="ac-big p lift">
        <Mark />
      </span>
      {stats.length > 0 && (
        <div className="ac-stats">
          {stats.map((s) => (
            <span key={s} className="ac-stat">
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
