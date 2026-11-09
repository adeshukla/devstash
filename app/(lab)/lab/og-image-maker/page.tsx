import { H1_HEADLINE } from '@/lib/utils/typography'
import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { LabToolSchema } from '@/components/lab/LabToolSchema'
import { OgImageMaker } from '@/components/lab/OgImageMaker'
import { FaqSection } from '@/components/sections/FaqSection'

export const metadata: Metadata = buildMetadata({
  title: 'OG Image Maker: Share Image and Blog Cover',
  description:
    'Make an Open Graph share image or blog cover from a title: pick a theme, download a 1200×630 PNG or an SVG. Works with Hindi and runs in your browser.',
  canonical: '/lab/og-image-maker',
})

const FAQ = [
  {
    question: 'What size should an Open Graph image be?',
    answer:
      '1200 × 630 pixels is the common size for a link preview, and it is where this tool starts. Blog cover and square sizes are there for pages and posts that need them.',
  },
  {
    question: 'PNG or SVG?',
    answer:
      'Use the PNG as your og:image. Many social platforms do not accept an SVG there. The SVG is for editing the design later or using it on your own pages.',
  },
  {
    question: 'Why are the fonts different from my website?',
    answer:
      'The image is drawn with your device’s own fonts, because a picture made in the browser cannot load a web font. That also means the preview and the downloaded file match exactly.',
  },
  {
    question: 'Does it work with Hindi?',
    answer:
      'Yes, if your device has a font for the script. A Hindi title came out correctly in Chrome on Windows. Long words are only ever split between whole characters, so letters and their marks stay together.',
  },
  {
    question: 'How do I use the image in Next.js?',
    answer:
      'Save the PNG as opengraph-image.png in the folder of the route it belongs to, and Next.js uses it as that page’s share image. The Next.js SEO Kit in the Lab writes the metadata and the other SEO files.',
  },
  {
    question: 'Is my text uploaded?',
    answer: 'No. The image is made in your browser and nothing is sent or stored.',
  },
]

export default function OgImageMakerPage() {
  return (
    <>
      <LabToolSchema slug="og-image-maker" path="/lab/og-image-maker" />

      <main className="bg-ds-bg min-h-screen">
        <section className="border-ds-border border-b px-6 py-8 sm:py-12">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-ds-accent mb-4 font-mono text-sm">OG IMAGE MAKER</p>
            <h1 className={`${H1_HEADLINE}`}>A share image made from just a title.</h1>
            <p className="text-ds-muted mt-4 text-lg leading-relaxed">
              Type a title, pick a look, and download a PNG or SVG for link previews, blog covers or
              a square post. The title is fitted to the image for you. Free, no signup, and nothing
              leaves your browser.
            </p>
          </div>
        </section>

        <section className="px-6 py-8 sm:py-12">
          <div className="border-ds-border bg-ds-surface mx-auto max-w-5xl rounded-2xl border p-5 sm:p-8">
            <OgImageMaker />
          </div>
        </section>

        <FaqSection
          items={FAQ}
          title="OG image questions"
          intro="Sizes, formats, fonts and how to use the file."
          ask={false}
        />

        <p className="text-ds-muted border-ds-border border-t px-6 py-8 text-center font-mono text-xs">
          Free tool by Adesh Shukla — fully client-side, nothing you enter here is sent anywhere.
        </p>
      </main>
    </>
  )
}
