import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { AiContentPipeline } from '@/components/lab/AiContentPipeline'

export const metadata: Metadata = buildMetadata({
  title: 'AI Content Pipeline Demo — Scaffold, Copy-edit, SEO Frontmatter',
  description:
    'A live 3-step LLM pipeline: scaffold an honest draft that marks where you add real code and numbers, run a copy-edit pass to strip AI-tell phrases, and produce SEO frontmatter — with real token usage and latency for every step.',
  canonical: '/lab/ai-content-pipeline',
  noIndex: true,
})

export default function AiContentPipelinePage() {
  return (
    <main className="bg-ds-bg min-h-screen">
      <section className="border-ds-border border-b px-6 py-20 text-center sm:py-24">
        <div className="mx-auto max-w-2xl">
          <p className="text-ds-accent mb-4 font-mono text-sm">AI CONTENT PIPELINE</p>
          <h1 className="text-ds-text text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
            Watch an agent write, rewrite, and ship its own frontmatter.
          </h1>
          <p className="text-ds-muted mt-6 text-lg leading-relaxed">
            A real 3-step Groq LLM chain, not a mockup: an honest scaffold that marks where you add
            real code and numbers instead of faking them, a copy-edit pass that strips AI-tell
            phrases, and SEO frontmatter generation — with token usage, latency, and a live eval
            shown for every step.
          </p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="border-ds-border bg-ds-surface mx-auto max-w-4xl rounded-2xl border p-8">
          <AiContentPipeline />
        </div>
      </section>

      <section className="border-ds-border border-t px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-ds-text mb-4 text-xl font-bold">
            Why a humanizing pass, and why measure it
          </h2>
          <p className="text-ds-muted leading-relaxed">
            First drafts from an LLM tend to lean on the same tells — “in conclusion”, “delve into”,
            “leverage”, “comprehensive”. The second call is a targeted rewrite instructed to avoid
            that exact list, and the metrics panel counts how many of those phrases show up before
            and after — a small, concrete eval instead of just trusting that it worked.
          </p>
        </div>
      </section>

      <section className="border-ds-border border-t px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-ds-text mb-4 text-xl font-bold">What actually happens on submit</h2>
          <p className="text-ds-muted leading-relaxed">
            Your topic, keywords, tone, and length go to a Next.js route handler, which makes three
            sequential calls to Groq’s <code className="text-ds-accent">llama-3.1-8b-instant</code>{' '}
            model — scaffold, copy-edit, then a JSON frontmatter call matching this blog’s real
            frontmatter shape. The scaffold step is told to leave{' '}
            <code className="text-ds-accent">[TODO: …]</code> placeholders wherever it would
            otherwise have to invent code, a benchmark, or personal experience — an honest draft you
            finish, not fake content you publish. Nothing is saved anywhere; the output only exists
            in your browser for this run.
          </p>
        </div>
      </section>

      <p className="text-ds-muted border-ds-border border-t px-6 py-8 text-center font-mono text-xs">
        Free tool by Adesh Shukla — runs a real 3-step Groq LLM pipeline server-side. A few free
        runs per day, no signup; after that, paste your own Groq API key (never logged or stored,
        used only for that request).
      </p>
    </main>
  )
}
