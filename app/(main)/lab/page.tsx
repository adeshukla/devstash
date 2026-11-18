import { H1_DISPLAY } from '@/lib/utils/typography'
import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { buildOgImageUrl } from '@/lib/seo/ogImage'
import { Breadcrumb } from '@/components/layout'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildItemListSchema } from '@/lib/schema/builders'
import { Button } from '@/components/ui'
import { PageFacts } from '@/components/ui/PageFacts'
import { getAllProjects } from '@/lib/markdown/projects'
import { FaqSection } from '@/components/sections/FaqSection'
import { LabIndex, type IndexTool, type JobGroup, type ToolView } from '@/components/lab/LabIndex'
import { buildUtmUrl } from '@/lib/lab/utm'
import { analyzeLink } from '@/lib/lab/utmCheck'
import { cleanReport } from '@/lib/lab/reportClean'
import { whatsappPayload } from '@/lib/lab/qrPayload'
import { buildHtml } from '@/lib/lab/metaTags'
import { buildWhatsAppLink } from '@/lib/lab/whatsapp'
import { buildGtag } from '@/lib/lab/ga4Event'

const title = 'Free UTM, QR Code, OG Image and Meta Tag Tools'
const description =
  'Free browser tools: UTM link builder and checker, QR code and WhatsApp link generators, OG image and meta tag generators, GA4 events, CSS and SVG.'

export const metadata: Metadata = buildMetadata({
  title,
  description,
  canonical: '/lab',
  ogImage: buildOgImageUrl({ title, description, type: 'website' }),
})

interface Demo {
  slug: string
  name: string
  blurb: string
  tag: string
}

const FLAGSHIP = {
  slug: 'ai-content-pipeline',
  name: 'AI Blog Draft Generator',
  blurb:
    'A live 3-step LLM chain running server-side: it scaffolds an honest draft, copy-edits the AI tells out of it, then generates SEO frontmatter — showing real token usage and latency at every step.',
  steps: [
    { name: 'Scaffold', detail: 'Marks what it will not invent' },
    { name: 'Copy-edit', detail: 'Strips AI-tell phrases' },
    { name: 'Frontmatter', detail: 'Emits real SEO fields' },
  ],
}

const TOOLS: Demo[] = [
  {
    slug: 'css-shapes-playground',
    name: 'CSS Shape, Border & Shadow Generator',
    blurb:
      'Live shape, color, animated-border, and box-shadow customizers, with copyable CSS on every demo.',
    tag: 'CSS',
  },
  {
    slug: 'illustration-generator',
    name: 'SVG Illustration Generator',
    blurb:
      'Composes a unique, theme-aware animated SVG from a text description — procedural generation, not a fixed list of presets.',
    tag: 'Generative',
  },
  {
    slug: 'meta-tag-generator',
    name: 'Meta Tag Generator & SEO Preview',
    blurb:
      'Previews your title as Google, X and Facebook cards, then writes the Next.js files: metadata, FAQ schema, robots.ts, sitemap.ts and an OG image.',
    tag: 'SEO',
  },
  {
    slug: 'whatsapp-link-generator',
    name: 'WhatsApp Link Generator',
    blurb:
      'A click-to-chat link with a country picker, a message already typed and a campaign code, plus a QR code and an HTML snippet.',
    tag: 'Marketing',
  },
  {
    slug: 'ga4-event-builder',
    name: 'GA4 Event Generator',
    blurb:
      'Build a GA4 event, check its name and parameters against Google’s limits, and copy the dataLayer push or gtag.js call.',
    tag: 'GA4',
  },
  {
    slug: 'og-image-maker',
    name: 'OG Image Generator',
    blurb:
      'Pick a size, type your words, take the colours from your site address or a picture, and preview on desktop and phone. Full control one click away.',
    tag: 'OG',
  },
  {
    slug: 'utm-builder',
    name: 'UTM Link Builder',
    blurb:
      'Three steps to a clean tracking link or QR code, with a GA4 channel check, team naming rules, sheet import and a QR print kit. Client-side; saved data stays on your device.',
    tag: 'UTM',
  },
  {
    slug: 'utm-link-checker',
    name: 'UTM Link Checker',
    blurb:
      'Paste links you already use: see what each tag says, which GA4 channel it lands in, what is wrong, and a cleaned link to copy. Includes a plain table of how GA4 sorts traffic.',
    tag: 'UTM',
  },
  {
    slug: 'qr-code-generator',
    name: 'QR Code Generator',
    blurb:
      'Static codes for a website, WhatsApp chat, UPI payment, Wi-Fi, contact card, email, phone or text. They never expire, save as PNG or SVG, and print. Nothing is uploaded.',
    tag: 'QR',
  },
  {
    slug: 'changeable-qr',
    name: 'Dynamic QR Code Generator',
    blurb:
      'Print one QR code and change the page it opens later. Sign in with Google or email, claim a permanent name, and point it anywhere. Free. Your email and link are stored; scans are not tracked.',
    tag: 'QR',
  },
  {
    slug: 'utm-report-cleaner',
    name: 'UTM Data Cleaner for GA4',
    blurb:
      'Paste a GA4 or Looker Studio export: rows that are the same campaign written differently are merged, with totals, an original-to-clean list and a Looker Studio field.',
    tag: 'GA4',
  },
]

const PRINCIPLES = [
  {
    title: 'Runs where you are',
    body: 'The CSS, SVG, SEO, UTM and QR tools run entirely in your browser; none of their code makes a network request. Only the AI pipeline, the OG maker’s "style from a web address" and the Changeable QR Code call a server.',
  },
  {
    title: 'Real output, not mock-ups',
    body: 'Each tool shows a real result for a sample input, made by the tool’s own code. Open one and what you get is the actual result, ready to copy.',
  },
  {
    title: 'Honest by design',
    body: 'The AI pipeline leaves [TODO] markers where only your own experience belongs. It does not invent code, numbers or a human voice.',
  },
]

const FAQ = [
  {
    question: 'Do I need an account?',
    answer:
      'Not to start. Every tool opens straight away. Only the Changeable QR Code asks for a free account, because it has to remember which page your code opens.',
  },
  {
    question: 'Is what I type sent anywhere?',
    answer:
      'Not by the browser-side tools: the CSS playground, illustration generator, meta tag generator, UTM tools and QR generator make no network requests. The AI Content Pipeline sends your input to a server because that is where the model runs. The Changeable QR Code stores your email, name and link so the code keeps working, and the OG maker sends only a web address you type to fetch its picture.',
  },
  {
    question: 'What does the AI pipeline run on?',
    answer:
      'A three-step chain on Groq, with an automatic Cerebras fallback: scaffold, copy-edit, then frontmatter. It reports token usage and latency at each step.',
  },
  {
    question: 'How is the Lab different from Projects?',
    answer:
      'The Lab holds things you can use right now. Projects holds the case studies behind them: the problem, the decisions and what I would change.',
  },
]

/**
 * A real result for a sample input on each card, produced by the tool's own
 * code at build time, so the hub shows what the tool returns, not a mock-up.
 */
function examples(): Record<string, { input: string; output: string }> {
  const checked = analyzeLink(
    'https://example.com/?utm_source=Google&utm_medium=cpc&UTM_Campaign=Spring Sale'
  )
  const cleaned = cleanReport(
    'Session campaign,Sessions\nspring-sale,1200\nSpring_Sale,300\nspring sale,90',
    '-'
  ).groups[0]
  return {
    'utm-builder': {
      input: 'example.com/pricing + Google Ads + "Spring Sale"',
      output: buildUtmUrl({
        url: 'https://example.com/pricing',
        source: 'google',
        medium: 'cpc',
        campaign: 'Spring Sale',
        term: '',
        content: '',
      }).url,
    },
    'utm-link-checker': {
      input: 'A link with "Google" and "UTM_Campaign" in it',
      output: `${checked.issues.filter((i) => i.level === 'problem').length} problems found. Cleaned: ${checked.cleaned}`,
    },
    'utm-report-cleaner': {
      input: 'Spring_Sale, spring sale and spring-sale in one report',
      output: `${cleaned.variants.length} spellings merge into ${cleaned.canonical}`,
    },
    'qr-code-generator': {
      input: 'WhatsApp +91 98765 43210, message "Hello"',
      output: whatsappPayload('+91 98765 43210', 'Hello').payload,
    },
    'changeable-qr': {
      input: 'Name "spring-menu", pointing at the old menu page',
      output: 'Scanning devstash.me/q/spring-menu opens whichever page you saved last',
    },
    'meta-tag-generator': {
      input: 'A shop title with an "&" in it',
      output: buildHtml({
        title: 'Shoes & Socks | Spring Sale',
        description: 'Free shipping on running shoes.',
        url: '',
        siteName: '',
        image: '',
        twitter: '',
        type: 'website',
      })
        .split('\n')
        .filter(Boolean)
        .slice(0, 2)
        .join('  '),
    },
    'whatsapp-link-generator': {
      input: 'India, 98765 43210, "Hi, please share your price list.", code diwali-poster',
      output: buildWhatsAppLink({
        country: '91',
        number: '98765 43210',
        message: 'Hi, please share your price list.',
        ref: 'diwali-poster',
      }).link,
    },
    'ga4-event-builder': {
      input: 'generate_lead with currency INR and value 500',
      output: buildGtag(
        'generate_lead',
        [
          { name: 'currency', value: 'INR' },
          { name: 'value', value: '500' },
        ],
        false
      ).replace(/\s*\n\s*/g, ' '),
    },
    'css-shapes-playground': {
      input: 'A morphing blob',
      output: 'border-radius: 42% 58% 63% 37% / 47% 42% 58% 53%;',
    },
  }
}

/** What goes in, what comes out, and words people search for, per tool. Plain language. */
const COPY: Record<string, { gives: string; gets: string; keywords: string }> = {
  'meta-tag-generator': {
    gives: 'A page title and description.',
    gets: 'How the page looks on Google and in shared links, plus the tags to paste in.',
    keywords:
      'meta tag generator seo meta tags title description open graph twitter card preview serp snippet robots txt sitemap xml schema json-ld faq nextjs metadata ai crawler gptbot checker',
  },
  'og-image-maker': {
    gives: 'Your words and a size.',
    gets: 'The picture shown when your link is shared on WhatsApp, LinkedIn or X.',
    keywords:
      'og image generator open graph image social share image twitter card linkedin facebook whatsapp link preview thumbnail blog cover 1200x630',
  },
  'utm-builder': {
    gives: 'Your page, where you will share it, and a campaign name.',
    gets: 'A tracking link that shows which ad or post brought visitors.',
    keywords:
      'utm builder utm link generator utm generator campaign url builder utm parameters utm_source utm_medium utm_campaign google analytics ga4 tracking link bulk utm qr code',
  },
  'utm-link-checker': {
    gives: 'Campaign links you already use.',
    gets: 'What is wrong with each one, and a clean version to copy.',
    keywords:
      'utm link checker utm validator utm checker check utm parameters utm mistakes ga4 channel grouping direct unassigned fix tracking links audit',
  },
  'utm-report-cleaner': {
    gives: 'A GA4 or Looker Studio report as CSV.',
    gets: 'One total per campaign instead of several spellings.',
    keywords:
      'utm data cleaner ga4 duplicate campaign names merge campaigns clean utm report case sensitive utm looker studio export csv normalize utm',
  },
  'ga4-event-builder': {
    gives: 'An event name such as generate_lead, and its details.',
    gets: 'Checked code to paste into your site or Tag Manager.',
    keywords:
      'ga4 event generator ga4 event builder google analytics 4 custom event datalayer push gtag event gtm tag manager button click form submit signup purchase event name validator',
  },
  'qr-code-generator': {
    gives: 'A website, chat, UPI payment, Wi-Fi or contact.',
    gets: 'A QR code to download or print: fixed and free forever, or one you can repoint later.',
    keywords:
      'qr code generator free qr code static qr whatsapp qr wifi qr upi qr vcard contact qr url qr png svg print no expiry dynamic changeable editable qr code menu poster',
  },
  'whatsapp-link-generator': {
    gives: 'A number and a first message.',
    gets: 'A tap-to-chat link, with a code to tell campaigns apart.',
    keywords:
      'whatsapp link generator wa.me link click to chat link whatsapp qr code prefilled message whatsapp business link utm country code',
  },
  'css-shapes-playground': {
    gives: 'A shape, colour or shadow you adjust with sliders.',
    gets: 'The CSS to copy.',
    keywords:
      'css shape generator border radius generator box shadow generator animated border css blob glassmorphism gradient generator cubic bezier easing button animation',
  },
  'illustration-generator': {
    gives: 'A few words describing a scene.',
    gets: 'An animated illustration as SVG.',
    keywords:
      'svg illustration generator animated svg generator free svg art blog illustration hero illustration procedural svg png export',
  },
  'ai-content-pipeline': {
    gives: 'A topic for a blog post.',
    gets: 'A draft that marks what only you can write, then SEO fields.',
    keywords:
      'ai blog draft generator ai blog post generator llm content pipeline groq seo frontmatter blog outline todo markers',
  },
}

/** The reason a normal person would open each tool, in their words. */
const USE_WHEN: Record<string, string> = {
  'meta-tag-generator':
    'you want to see how your page looks on Google and in shared links, check the tags it already has, or see which AI crawlers your robots.txt blocks.',
  'og-image-maker':
    'you need the picture that shows when your link is shared on WhatsApp, LinkedIn or X.',
  'utm-builder':
    'you are about to run an ad, email or post and want to know afterwards which one brought visitors.',
  'utm-link-checker': 'you already have campaign links and something looks wrong in your reports.',
  'utm-report-cleaner':
    'your GA4 report lists the same campaign under several spellings and you want one total.',
  'ga4-event-builder':
    'you are adding tracking for a button, a signup or a purchase and want the code checked first.',
  'qr-code-generator':
    'you want a QR code for a website, a WhatsApp chat, a UPI payment, Wi-Fi or a contact card, and you never want it to expire.',
  'changeable-qr':
    'you will print a QR code and may need to change the page it opens later. Needs a free account.',
  'whatsapp-link-generator':
    'you want customers to tap a link and start a WhatsApp chat with a message already typed. The QR is an extra.',
  'css-shapes-playground':
    'you want a CSS shape, border or shadow and would rather see it than write it.',
  'illustration-generator': 'you want a quick animated illustration for a page from a few words.',
  'ai-content-pipeline':
    'you want a blog draft that marks the parts only you can write, instead of inventing them.',
}

/** The jobs, written as what the visitor wants. Tool ids are slugs; the QR tool has two views. */
const GROUPS: { id: string; question: string; name: string; sub: string; tools: string[][] }[] = [
  {
    id: 'found',
    question: 'I want people to find my page',
    name: 'Get found',
    sub: 'Make your page look right on Google and in shared links.',
    tools: [['meta-tag-generator'], ['og-image-maker']],
  },
  {
    id: 'measure',
    question: 'I run ads or campaigns and want to know what works',
    name: 'Measure',
    sub: 'Tag your links, check the ones you have, and clean up the reports. These three share one saved workspace.',
    tools: [['utm-builder'], ['utm-link-checker'], ['utm-report-cleaner'], ['ga4-event-builder']],
  },
  {
    id: 'share',
    question: 'I want to share a link, a number or a payment',
    name: 'Share',
    sub: 'QR codes and chat links that people scan or tap.',
    tools: [['qr-code-generator', 'changeable-qr'], ['whatsapp-link-generator']],
  },
  {
    id: 'build',
    question: 'I am just looking around',
    name: 'Build and experiment',
    sub: 'CSS, illustration and an AI writing experiment.',
    tools: [['css-shapes-playground'], ['illustration-generator'], ['ai-content-pipeline']],
  },
]

export default async function LabPage() {
  const samples = examples()
  const projects = await getAllProjects()
  const known = [...TOOLS, { ...FLAGSHIP, tag: 'AI' }]

  const view = (slug: string, label: string): ToolView => {
    const demo = known.find((d) => d.slug === slug)!
    const project = projects.find((p) => p.slug === slug)
    return {
      label,
      slug,
      blurb: demo.blurb,
      useWhen: USE_WHEN[slug],
      example: samples[slug],
      highlights: project?.highlights ?? [],
      stats: project?.coverStats ?? [],
      caseStudy: Boolean(project),
    }
  }

  const groups: JobGroup[] = GROUPS.map((g) => ({
    id: g.id,
    question: g.question,
    name: g.name,
    sub: g.sub,
    tools: g.tools.map((slugs): IndexTool => {
      const first = known.find((d) => d.slug === slugs[0])!
      // Two slugs in one row: the same job, a fixed or a changeable version.
      const labels = slugs.length > 1 ? ['Fixed', 'Changeable'] : ['']
      return {
        id: slugs[0],
        name: slugs.length > 1 ? 'QR Code Generator' : first.name,
        tag: first.tag,
        ...COPY[slugs[0]],
        views: slugs.map((s, i) => view(s, labels[i])),
      }
    }),
  }))

  return (
    <div>
      <JsonLd
        data={buildItemListSchema(known.map((d) => ({ name: d.name, url: `/lab/${d.slug}` })))}
      />
      {/* Breadcrumb emits its own BreadcrumbList JSON-LD */}
      <section className="border-ds-border border-b py-8 sm:py-16">
        <div className="max-w-site mx-auto px-6">
          <Breadcrumb
            items={[
              { name: 'Home', url: 'https://devstash.me' },
              { name: 'Lab', url: 'https://devstash.me/lab' },
            ]}
          />
          <h1 className={`${H1_DISPLAY} mt-6`}>Free tools that work in your browser.</h1>
          <p className="text-ds-muted mt-4 max-w-[68ch] text-lg leading-relaxed">
            Tools for search, campaigns and QR codes. No signup to start. Pick what you want to do
            below; each tool shows a real example before you open it.
          </p>
          <div className="hidden sm:block">
            <PageFacts
              items={[
                { value: groups.reduce((n, g) => n + g.tools.length, 0), label: 'live tools' },
                { value: 3, label: 'use a server' },
                { value: 0, label: 'signups to start' },
              ]}
            />
          </div>
        </div>
      </section>

      <section className="py-12 pb-16">
        <div className="max-w-site mx-auto px-6">
          <h2 className="text-ds-text text-2xl font-bold tracking-tight">
            What do you want to do?
          </h2>
          <p className="text-ds-muted mt-2 mb-8 max-w-[64ch]">
            Search for it, or pick a group. Every tool says what you give it and what you get back,
            and most have a box you can try right here.
          </p>
          <LabIndex groups={groups} />
        </div>
      </section>

      <section className="border-ds-border border-t py-16">
        <div className="max-w-site mx-auto px-6">
          <h2 className="text-ds-text text-2xl font-bold tracking-tight">How the Lab works</h2>
          <ol className="mt-10 grid gap-10 md:grid-cols-3">
            {PRINCIPLES.map((item, n) => (
              <li key={item.title} className="flex flex-col gap-3">
                <span className="text-ds-accent font-mono text-sm">
                  {String(n + 1).padStart(2, '0')}
                </span>
                <h3 className="text-ds-text text-lg font-semibold tracking-tight">{item.title}</h3>
                <p className="text-ds-muted text-sm leading-relaxed">{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <FaqSection
        items={FAQ}
        intro="The short answers on what the Lab is and what it does with what you type."
      />

      <section className="border-ds-border border-t py-16">
        <div className="max-w-site mx-auto flex flex-col gap-6 px-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-ds-text text-2xl font-bold tracking-tight">Want the reasoning?</h2>
            <p className="text-ds-muted mt-2">
              Each tool has a case study: the problem and the tradeoffs. The bigger builds are on
              the Projects page.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href="/projects">See the bigger builds &rarr;</Button>
            <Button href="/services" variant="ghost">
              Work with me
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
