import { H1_HEADLINE } from '@/lib/utils/typography'
import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { LabToolSchema } from '@/components/lab/LabToolSchema'
import { OgImageMaker } from '@/components/lab/OgImageMaker'
import { FaqSection } from '@/components/sections/FaqSection'

export const metadata: Metadata = buildMetadata({
  title: 'OG Image Maker: Share Image and Blog Cover',
  description:
    'Make a share image or blog cover with control over every text, background and graphic, or take the colours from your own picture. PNG, JPG or SVG, in your browser.',
  canonical: '/lab/og-image-maker',
})

const FAQ = [
  {
    question: 'What can I change?',
    answer:
      'Every piece of text on its own: the title, subtitle, tag line, badge and footer each have their own wording, font, weight, size, colour, opacity, letter spacing and capitals or italics. You can also change the layout and alignment, the margin, the background (solid, gradient, radial, glow or a picture), patterns, a mark by the title, a corner shape, a frame, a panel behind the text and a logo.',
  },
  {
    question: 'Can it copy the style of my hero image?',
    answer:
      'It reads the main colours from any picture you choose and builds a matching theme: the biggest colour becomes the background, a vivid one becomes the accent, and the text is white or near-black, whichever is easier to read. If neither reaches a comfortable contrast, the background is darkened or lightened until it does. It copies colours, not the design, so fonts and layout stay yours to set. You can also give any single colour a role by hand.',
  },
  {
    question: 'How do I use a picture?',
    answer:
      'As the full background, with a darkening layer that is set for you so the text stays readable, or beside the text in a split layout with the picture on the left or right. You can zoom it, move it, blur it or make it black and white.',
  },
  {
    question: 'Is my picture uploaded?',
    answer:
      'No. It is read and shrunk in your browser and never sent anywhere. Pictures over 15 MB are refused, and large ones are reduced to 2000 pixels on the longest side.',
  },
  {
    question: 'What size should an Open Graph image be?',
    answer:
      '1200 × 630 pixels is the common size for a link preview, and it is where this tool starts. There are also blog cover, square and story sizes, and a custom size from 200 to 4000 pixels on each side.',
  },
  {
    question: 'PNG, JPG or SVG?',
    answer:
      'Use the PNG or JPG as your og:image: many social platforms do not accept an SVG there. JPG gives a smaller file. Double resolution saves a sharper copy. The SVG is for editing the design later, and it gets large when a picture is embedded in it.',
  },
  {
    question: 'Why are the fonts different from my website?',
    answer:
      'The image is drawn with your device’s own fonts, because a picture made in the browser cannot load a web font. That makes the preview match the file exactly, but another computer may choose a different font for the same setting. Hindi and other scripts work if your device has a font for them.',
  },
  {
    question: 'How do I use the image in Next.js?',
    answer:
      'Save it as opengraph-image.png in the folder of the route it belongs to, and Next.js uses it as that page’s share image. The Next.js SEO Kit in the Lab writes the metadata and the other SEO files.',
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
            <h1 className={`${H1_HEADLINE}`}>A share image that looks like your site.</h1>
            <p className="text-ds-muted mt-4 text-lg leading-relaxed">
              Set every text, background and graphic yourself, or hand it a picture and take its
              colours. Download a PNG, JPG or SVG for link previews, blog covers or a square post.
              Free, no signup, and nothing leaves your browser.
            </p>
          </div>
        </section>

        <section className="px-6 py-8 sm:py-12">
          <div className="border-ds-border bg-ds-surface mx-auto max-w-6xl rounded-2xl border p-5 sm:p-8">
            <OgImageMaker />
          </div>
        </section>

        <FaqSection
          items={FAQ}
          title="OG image questions"
          intro="What you can change, how a picture is used, and what stays on your device."
          ask={false}
        />

        <p className="text-ds-muted border-ds-border border-t px-6 py-8 text-center font-mono text-xs">
          Free tool by Adesh Shukla — fully client-side, nothing you enter here is sent anywhere.
        </p>
      </main>
    </>
  )
}
