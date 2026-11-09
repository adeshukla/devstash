import { H1_HEADLINE } from '@/lib/utils/typography'
import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { LabToolSchema } from '@/components/lab/LabToolSchema'
import { MetaTagGenerator } from '@/components/lab/MetaTagGenerator'
import { MetaAudit } from '@/components/lab/MetaAudit'
import { SeoKit } from '@/components/lab/SeoKit'
import { AiCrawlerCheck } from '@/components/lab/AiCrawlerCheck'
import { FaqSection } from '@/components/sections/FaqSection'

const FAQ = [
  {
    question: 'What does the kit generate?',
    answer:
      'Google, X and Facebook previews with a pixel-width cut-off, and code for HTML meta tags, Next.js metadata, JSON-LD, FAQ schema, robots.ts, sitemap.ts and an opengraph-image.tsx for the App Router.',
  },
  {
    question: 'Will FAQ schema give me expandable results in Google?',
    answer:
      'Probably not. Google now shows FAQ rich results only for a small set of well-known government and health sites. The markup is still valid and other search and AI tools can read it. The questions and answers must also be visible on the page.',
  },
  {
    question: 'Why does robots.ts leave out /_next/?',
    answer:
      'Google needs the scripts and styles under /_next/ to render your page. Blocking them can stop it seeing your content, so the generator never writes that rule.',
  },
  {
    question: 'Does it check my live page?',
    answer:
      'No. The head check reads tags you paste in. It does not fetch your site, and nothing you type is sent anywhere.',
  },
  {
    question: 'Will opting out of AI training hurt my Google ranking?',
    answer:
      'No. Google says its Google-Extended control does not affect inclusion in Google Search and is not a ranking signal. The opt-out also leaves the search crawlers of OpenAI, Anthropic and Perplexity allowed, so those products can still find and link to you.',
  },
  {
    question: 'Does the AI crawler check read my live robots.txt?',
    answer:
      'No. It reads the text you paste. Open yoursite.com/robots.txt, copy it in, and it shows which of 13 known crawlers are blocked. The list comes from each vendor’s own documentation and can go out of date.',
  },
  {
    question: 'Can robots.txt stop an assistant from reading my page?',
    answer:
      'Not always. Crawlers that collect content on their own are meant to follow it. A fetch that a person triggers by asking an assistant to open a page may ignore it: OpenAI, Perplexity and Meta say so for their user-triggered fetchers, while Anthropic says its bots honor robots.txt.',
  },
  {
    question: 'Is the title and description draft written by AI?',
    answer:
      'No. It scores sentences in the text you paste and picks and trims real ones. There is no model call, so it cannot invent facts.',
  },
]

export const metadata: Metadata = buildMetadata({
  title: 'Next.js SEO Kit: Meta Tags, Schema, Sitemap',
  description:
    'Next.js SEO kit: metadata, FAQ schema, robots.ts, sitemap.ts and OG image code, plus Google, X and Facebook previews. Runs in your browser.',
  canonical: '/lab/meta-tag-generator',
})

export default function MetaTagGeneratorPage() {
  return (
    <>
      <LabToolSchema slug="meta-tag-generator" path="/lab/meta-tag-generator" />

      <main className="bg-ds-bg min-h-screen">
        <section className="border-ds-border border-b px-6 py-8 text-center sm:py-12">
          <div className="mx-auto max-w-2xl">
            <p className="text-ds-accent mb-4 font-mono text-sm">NEXT.JS SEO KIT</p>
            <h1 className={`${H1_HEADLINE}`}>See your link before you ship it.</h1>
            <p className="text-ds-muted mt-6 text-lg leading-relaxed">
              Paste real content and it drafts a starting title and description locally — no AI
              call, just sentence scoring and cleanup. Then see a live Google search preview, an
              X/Twitter card, and a Facebook/OG card, with character counts against the ranges
              search engines actually truncate at. Copy the finished &lt;meta&gt; block when it
              looks right. Further down: the other SEO files a Next.js site needs, as code.
            </p>
          </div>
        </section>

        <section className="px-6 py-8 sm:py-12">
          <div className="border-ds-border bg-ds-surface mx-auto max-w-4xl rounded-2xl border p-5 sm:p-8">
            <MetaTagGenerator />
          </div>
        </section>

        <section className="border-ds-border border-t px-6 py-12 sm:py-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-ds-text mb-2 text-xl font-bold">Check tags you already have</h2>
            <p className="text-ds-muted mb-6 max-w-2xl leading-relaxed">
              Paste the head of a live page and see what is missing, too long or repeated: the
              title, description, canonical link, viewport, robots and the social tags. It reads
              what you paste; it does not fetch your site.
            </p>
            <div className="border-ds-border bg-ds-surface rounded-2xl border p-5 sm:p-8">
              <MetaAudit />
            </div>
          </div>
        </section>

        <section className="border-ds-border border-t px-6 py-12 sm:py-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-ds-text mb-2 text-xl font-bold">
              Which AI crawlers can read your site?
            </h2>
            <p className="text-ds-muted mb-6 max-w-2xl leading-relaxed">
              Paste your <code className="text-ds-accent">robots.txt</code> and see which of 13
              known AI crawlers it blocks: OpenAI, Anthropic, Google, Perplexity, Apple, Meta and
              Common Crawl. It follows the same rules crawlers use: a crawler&apos;s own group wins
              over <code className="text-ds-accent">*</code>, and the longest matching rule wins.
              The robots.ts tab above can write the opt-out for you.
            </p>
            <div className="border-ds-border bg-ds-surface rounded-2xl border p-5 sm:p-8">
              <AiCrawlerCheck />
            </div>
          </div>
        </section>

        <section className="border-ds-border border-t px-6 py-12 sm:py-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-ds-text mb-2 text-xl font-bold">
              The other SEO files for a Next.js site
            </h2>
            <p className="text-ds-muted mb-6 max-w-2xl leading-relaxed">
              FAQ schema, <code className="text-ds-accent">robots.ts</code>,{' '}
              <code className="text-ds-accent">sitemap.ts</code> and an{' '}
              <code className="text-ds-accent">opengraph-image.tsx</code> for the App Router. Fill
              in a few fields and copy the file.
            </p>
            <div className="border-ds-border bg-ds-surface rounded-2xl border p-5 sm:p-8">
              <SeoKit />
            </div>
          </div>
        </section>

        <section className="border-ds-border border-t px-6 py-16">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-ds-text mb-4 text-xl font-bold">Why the character counts matter</h2>
            <p className="text-ds-muted leading-relaxed">
              Google truncates title tags around 50–60 characters and meta descriptions around
              130–160 — go past that and search engines cut your copy off mid-sentence or rewrite it
              entirely. These are the same ranges this site&apos;s own pages are built against, so
              the counters here aren&apos;t arbitrary — they&apos;re the actual thresholds this
              tool&apos;s own <code className="text-ds-accent">buildMetadata()</code> helper is
              written to respect.
            </p>
          </div>
        </section>

        <section className="border-ds-border border-t px-6 py-16">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-ds-text mb-4 text-xl font-bold">
              What &quot;draft from your content&quot; actually does
            </h2>
            <p className="text-ds-muted leading-relaxed">
              It&apos;s real, but it&apos;s not AI. Pasted text is split into sentences, each
              sentence is scored by how much its words overlap with the rest of the text (extractive
              summarization — the same family of technique search engines have used for snippet
              generation for years), and the highest-scoring sentence becomes the description. A
              short list of common filler phrases (&quot;in today&apos;s fast-paced world&quot;,
              &quot;leverage&quot;, &quot;utilize&quot;) gets cleaned up along the way. There&apos;s
              no model call, nothing leaves your browser, and it won&apos;t invent facts that
              aren&apos;t in what you pasted — because it isn&apos;t writing anything, just picking
              and trimming what&apos;s already there.
            </p>
          </div>
        </section>

        <FaqSection
          items={FAQ}
          title="Next.js SEO kit questions"
          intro="What it generates, what it does not check, and the one Google change worth knowing."
          ask={false}
        />

        <p className="text-ds-muted border-ds-border border-t px-6 py-8 text-center font-mono text-xs">
          Free tool by Adesh Shukla — everything runs client-side, nothing is sent anywhere.
        </p>
      </main>
    </>
  )
}
