import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { MetaTagGenerator } from '@/components/lab/MetaTagGenerator'

export const metadata: Metadata = buildMetadata({
  title: 'Meta Tags & Social Preview Generator — Free SEO Tool',
  description:
    'A free tool that drafts a title/description from your content and previews it as a Google result, an X/Twitter card, and a Facebook/OG card — with live character counts and copyable meta tags.',
  canonical: '/lab/meta-tag-generator',
  noIndex: true,
})

export default function MetaTagGeneratorPage() {
  return (
    <main className="bg-ds-bg min-h-screen">
      <section className="border-ds-border border-b px-6 py-20 text-center sm:py-24">
        <div className="mx-auto max-w-2xl">
          <p className="text-ds-accent mb-4 font-mono text-sm">META TAGS &amp; SOCIAL PREVIEW</p>
          <h1 className="text-ds-text text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
            See your link before you ship it.
          </h1>
          <p className="text-ds-muted mt-6 text-lg leading-relaxed">
            Paste real content and it drafts a starting title and description locally — no AI call,
            just sentence scoring and cleanup. Then see a live Google search preview, an X/Twitter
            card, and a Facebook/OG card, with character counts against the ranges search engines
            actually truncate at. Copy the finished &lt;meta&gt; block when it looks right.
          </p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="border-ds-border bg-ds-surface mx-auto max-w-4xl rounded-2xl border p-8">
          <MetaTagGenerator />
        </div>
      </section>

      <section className="border-ds-border border-t px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-ds-text mb-4 text-xl font-bold">Why the character counts matter</h2>
          <p className="text-ds-muted leading-relaxed">
            Google truncates title tags around 50–60 characters and meta descriptions around 130–160
            — go past that and search engines cut your copy off mid-sentence or rewrite it entirely.
            These are the same ranges this site's own pages are built against, so the counters here
            aren't arbitrary — they're the actual thresholds this tool's own{' '}
            <code className="text-ds-accent">buildMetadata()</code> helper is written to respect.
          </p>
        </div>
      </section>

      <section className="border-ds-border border-t px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-ds-text mb-4 text-xl font-bold">
            What &quot;draft from your content&quot; actually does
          </h2>
          <p className="text-ds-muted leading-relaxed">
            It's real, but it's not AI. Pasted text is split into sentences, each sentence is scored
            by how much its words overlap with the rest of the text (extractive summarization — the
            same family of technique search engines have used for snippet generation for years), and
            the highest-scoring sentence becomes the description. A short list of common filler
            phrases (&quot;in today's fast-paced world&quot;, &quot;leverage&quot;,
            &quot;utilize&quot;) gets cleaned up along the way. There's no model call, nothing
            leaves your browser, and it won't invent facts that aren't in what you pasted — because
            it isn't writing anything, just picking and trimming what's already there.
          </p>
        </div>
      </section>

      <p className="text-ds-muted border-ds-border border-t px-6 py-8 text-center font-mono text-xs">
        Free tool by Adesh Shukla — everything runs client-side, nothing is sent anywhere.
      </p>
    </main>
  )
}
