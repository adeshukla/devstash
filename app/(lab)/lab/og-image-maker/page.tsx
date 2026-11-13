import { H1_HEADLINE } from '@/lib/utils/typography'
import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { LabToolSchema } from '@/components/lab/LabToolSchema'
import { OgImageMaker } from '@/components/lab/OgImageMaker'
import { FaqSection } from '@/components/sections/FaqSection'

export const metadata: Metadata = buildMetadata({
  title: 'OG Image Maker: Share Image and Blog Cover',
  description:
    'Make a share image or blog cover in a simple view or with full control, take the colours from your site or a picture, and preview it on desktop and phone.',
  canonical: '/lab/og-image-maker',
})

const FAQ = [
  {
    question: 'Is it simple, or can I control everything?',
    answer:
      'Both. The simple view has only what most people need: what the image is for, your words, a look, the colours, and the download. Choose Everything to set each text on its own, the layout, backgrounds, patterns, shapes, a frame and a logo. The 1-minute tour walks you through the page.',
  },
  {
    question: 'What can I change?',
    answer:
      'Every piece of text on its own: the title, subtitle, tag line, badge and footer each have their own wording, font, weight, size, colour, opacity, letter spacing and capitals or italics. You can also change the layout and alignment, the margin, the background (solid, gradient, radial, glow or a picture), patterns, a mark by the title, a corner shape, a frame, a panel behind the text and a logo.',
  },
  {
    question: 'Can it copy the style of my website?',
    answer:
      'Type the address of your site or a page. It fetches the image the page sets for sharing (its og:image) and reads the main colours from it. You can also choose any picture from your device. It reads the main colours and builds a matching theme: the biggest colour becomes the background, a vivid one becomes the accent, and the text is white or near-black, whichever is easier to read. If neither reaches a comfortable contrast, the background is darkened or lightened until it does. It copies colours, not the design, so fonts and layout stay yours to set. You can also give any single colour a role by hand.',
  },
  {
    question: 'How do I use a picture?',
    answer:
      'As the full background, with a darkening layer that is set for you so the text stays readable, or beside the text in a split layout with the picture on the left or right. You can zoom it, move it, blur it or make it black and white.',
  },
  {
    question: 'Is my picture or address uploaded?',
    answer:
      'A picture you choose from your device is read and shrunk in your browser and never sent anywhere. If you type a web address, that one address is sent to our server so it can fetch the picture, because browsers cannot read other sites directly. Only public web addresses work, and nothing is stored. Pictures over 15 MB are refused, and large ones are reduced to 2000 pixels on the longest side.',
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
              Pick what it is for, type your words, and take the colours from your site&apos;s
              address or a picture. See how it looks on a computer and a phone, then download it.
              Simple by default, with every control one click away. Free, no signup.
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
          intro="How simple and full control differ, how the style is copied, and what stays on your device."
          ask={false}
        />

        <p className="text-ds-muted border-ds-border border-t px-6 py-8 text-center font-mono text-xs">
          Free tool by Adesh Shukla — your pictures and text stay in your browser; only a web
          address you type is sent to fetch its picture.
        </p>
      </main>
    </>
  )
}
