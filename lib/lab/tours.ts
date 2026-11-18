// What each tool's guided tour says. Plain data, no React and no "@/" imports, so node:test can
// check it. A target is a CSS selector, or `text:Some words` for the heading, label or button that
// starts with those words (see components/lab/tourTarget.ts). A step whose target is not on the
// page is skipped, so a tour never points at something that is not there.

export interface TourStepData {
  target: string
  title: string
  body: string
  /** The step may be missing (for example, a form that only shows when signed out). */
  optional?: boolean
  /** A "try it" button that clicks something on the page for the visitor. */
  click?: { label: string; target: string }
}

export const TOURS: Record<string, TourStepData[]> = {
  'utm-builder': [
    {
      target: 'text:Where does the link go?',
      title: 'Start with the page',
      body: 'Paste the address of the page you want people to land on. Not sure what to type? Use "Try an example" to see how it works.',
    },
    {
      target: 'text:Where will you share it?',
      title: 'Say where you will share it',
      body: 'Pick Google Ads, a newsletter, Instagram and so on. The tool fills in the source and medium so GA4 files the visit under the right channel.',
    },
    {
      target: 'text:Name the campaign',
      title: 'Name the campaign once',
      body: 'Use one short name, such as spring-sale. Capitals and spaces are cleaned up, so one campaign does not split into several rows in your reports.',
    },
    {
      target: 'text:Copy link',
      title: 'Copy your link',
      body: 'Your finished link appears here. Copy it into the ad or email. "Save to list" keeps it so you can export a whole sheet later.',
    },
    {
      target: 'text:More tools',
      title: 'More tools, when you need them',
      body: 'Team naming rules, importing a sheet of links, a QR code print kit and a backup file live in here. You can ignore them for a first link.',
    },
    {
      target: 'text:Back up or move your workspace',
      title: 'Keep your saved links',
      body: 'Your saved links stay in this browser. Download a backup file to keep them if you clear browser data or switch computers.',
    },
  ],
  'utm-link-checker': [
    {
      target: '#utm-check',
      title: 'Paste links you already use',
      body: 'One link per line, up to 50. They can be ads, emails or posts that are already live.',
      click: { label: 'Fill in an example', target: 'text:Not sure? Try an example' },
    },
    {
      target: 'text:How GA4 sorts traffic into channels',
      title: 'What the result means',
      body: 'For each link you get what its tags say, the GA4 channel it will land in, what is wrong, and a cleaned version to copy. This table shows how GA4 decides the channel.',
    },
  ],
  'utm-report-cleaner': [
    {
      target: '#rc-text',
      title: 'Paste your report',
      body: 'Export a GA4 or Looker Studio report as CSV and paste it here. Comment lines at the top and "Total" rows are skipped for you.',
      click: { label: 'Fill in an example', target: 'text:Not sure? Try an example' },
    },
    {
      target: 'text:Or choose a file',
      title: 'Or use the file',
      body: 'Choose the CSV you exported instead of pasting. It is read in your browser and not uploaded.',
    },
    {
      target: 'text:Hyphens (spring-sale)',
      title: 'Pick the clean spelling',
      body: 'Rows that are the same campaign written differently are merged under one name. Choose hyphens or underscores for that name.',
    },
    {
      target: 'text:Report cleaner questions',
      title: 'What you get back',
      body: 'One row per campaign with the numbers added up (rates like engagement are not added), a list of what was merged, and a field you can use in Looker Studio.',
    },
  ],
  'ga4-event-builder': [
    {
      target: 'text:Start from a recommended event',
      title: 'Start from Google’s list',
      body: 'Pick an event Google already defines, such as purchase or generate_lead, and its parameters are filled in for you.',
    },
    {
      target: 'text:Event name',
      title: 'Name the event',
      body: 'Names are checked against Google’s rules as you type: length, allowed characters and reserved names, so GA4 does not silently drop the event.',
    },
    {
      target: 'text:+ Add a parameter',
      title: 'Add details',
      body: 'Parameters carry the detail, such as value and currency. The tool warns when something personal, like an email address, is in one.',
    },
    {
      target: 'text:Tag Manager (dataLayer)',
      title: 'Choose your code',
      body: 'Use the Tag Manager version if you track through Google Tag Manager, or gtag.js if the Google tag is on the page directly. Copy it from the box above.',
    },
  ],
  'meta-tag-generator': [
    {
      target: '#mt-content',
      title: 'Start with what your page says',
      body: 'Paste your page text and the tool drafts a title and description in your browser, with no AI call. You can edit both.',
    },
    {
      target: '#mt-title',
      title: 'Watch the counters',
      body: 'Google cuts titles and descriptions at a certain length. The counters show how close you are, and the previews below update as you type.',
    },
    {
      target: 'text:Check tags you already have',
      title: 'Check an existing page',
      body: 'Paste the head of a page that is already live and see what is missing, too long or repeated.',
    },
    {
      target: 'text:Which AI crawlers can read your site?',
      title: 'See which AI crawlers are blocked',
      body: 'Paste your robots.txt to see which AI crawlers it blocks and which it allows, and which ones are for training and which are for search.',
    },
    {
      target: 'text:The other SEO files for a Next.js site',
      title: 'Files for a Next.js site',
      body: 'FAQ schema, robots.ts, sitemap.ts and an OG image, written as code you can paste in. These are for Next.js sites; the rest of the page works for any site.',
    },
  ],
  'qr-code-generator': [
    {
      target: 'text:Website',
      title: 'Choose what the code does',
      body: 'Pick website, WhatsApp, UPI payment, Wi-Fi, contact card, email, phone or text. Each one shows the form it needs.',
    },
    {
      target: 'text:Website link',
      title: 'Type what goes inside',
      body: 'The code is made in your browser as you type. Nothing is uploaded, including Wi-Fi passwords and contact details.',
    },
    {
      target: 'text:Your QR code',
      title: 'Download or print',
      body: 'Save it as PNG for documents or SVG for print shops, or print it. This code is fixed: if you need to change where it points after printing, use the Changeable QR Code instead.',
    },
  ],
  'whatsapp-link-generator': [
    {
      target: 'text:Country',
      title: 'Pick the country',
      body: 'The country code is added for you, so you only type the number the way you normally write it.',
    },
    {
      target: 'text:WhatsApp number',
      title: 'Type the number',
      body: 'With or without a leading 0 or the country code. The tool works out the right digits and says what it changed.',
    },
    {
      target: 'text:Message ready to send',
      title: 'Write the first message',
      body: 'This text is already typed when the customer opens the chat. Hindi and other languages work.',
    },
    {
      target: 'text:Campaign code',
      title: 'See where chats come from',
      body: 'A short code, such as diwali-poster, is added to the message so you can tell which poster or ad each chat came from.',
    },
    {
      target: 'text:Your link',
      title: 'Copy the link or print the QR',
      body: 'Copy the link, a snippet for your website, or the QR code to print.',
    },
  ],
  'css-shapes-playground': [
    {
      target: 'text:Customize it yourself',
      title: 'Build a shape',
      body: 'Pick a colour and a shape, and the preview changes as you go. Below the preview is the exact CSS for what you see.',
    },
    {
      target: 'text:Corner radius',
      title: 'Three ways to shape it',
      body: 'Presets are ready-made shapes. Corner radius gives you four sliders, one per corner. Draw your own lets you drag points to make a shape that exists nowhere else.',
    },
    {
      target: 'text:Copy',
      title: 'Copy the CSS',
      body: 'This is the real code for the shape on screen, with the animation if you chose one. Paste it into your stylesheet.',
    },
    {
      target: 'text:Surfaces',
      title: 'Glass, gradients and shadows',
      body: 'Frosted glass, a gradient with a middle stop, and a shadow built from layers. Each one copies out as CSS or as a Tailwind class.',
    },
    {
      target: 'text:Shape & motion gallery',
      title: 'Ready-made demos',
      body: 'Every demo below is running CSS, and each one has its own Copy button. Use them as a starting point.',
    },
  ],
  'illustration-generator': [
    {
      target: '#topic',
      title: 'Say what it is for',
      body: 'Type a few words, such as "analytics dashboard" or "team onboarding". The picture is built from your words, so the same text always gives the same picture.',
    },
    {
      target: 'text:Shuffle layout',
      title: 'Not quite right? Shuffle',
      body: 'Shuffle keeps your words and rearranges the shapes, charts and lines. Try it a few times until one fits.',
    },
    {
      target: 'text:Download SVG',
      title: 'Download or share it',
      body: 'Save the picture as an SVG or a PNG, or copy a link that reopens this exact illustration.',
    },
  ],
  'changeable-qr': [
    {
      target: 'text:Print once. Change the link later.',
      title: 'How it works',
      body: 'A normal QR code holds the page address inside it. This one holds a short address on this site, such as /q/yourname, which sends the visitor to whatever page you saved last. Change the page later and the printed code keeps working.',
    },
    {
      target: 'text:Sign in',
      title: 'Sign in',
      body: 'Use Google, or an email and password. Your account is what lets you change the link later. After signing in you choose a permanent name and the page it opens.',
      optional: true,
    },
    {
      target: 'text:Create an account',
      title: 'New here?',
      body: 'Create a free account. You confirm your email by a link before the account exists.',
      optional: true,
    },
    {
      target: 'text:Changeable QR questions',
      title: 'What is stored',
      body: 'The questions below explain what is kept (your email, your name and your link) and what is not (who scans your code).',
    },
  ],
}

// The sessions bar sits above these tools, so their tours end by pointing at it.
const SESSIONS_STEP: TourStepData = {
  target: '[data-tour=sessions]',
  title: 'Your work is kept',
  body: 'Close the tab and your work is still here when you come back. Open Sessions to save it under a name, start another one, copy, rename, export or delete.',
}
for (const slug of [
  'utm-builder',
  'utm-link-checker',
  'utm-report-cleaner',
  'ga4-event-builder',
  'meta-tag-generator',
  'qr-code-generator',
  'whatsapp-link-generator',
  'css-shapes-playground',
  'illustration-generator',
])
  TOURS[slug].push(SESSIONS_STEP)
