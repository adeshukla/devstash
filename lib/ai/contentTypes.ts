import 'server-only'
import type { PipelineContentType, PipelineTone } from '@/types/aiPipeline'

/**
 * What each content type asks the model to write. The structure line matters
 * as much as the role: the page renderer builds cards from bullet lists, steps
 * from numbered lists and split panels from a paragraph plus bullets, so each
 * type is told to use those shapes where they fit.
 *
 * Honesty is part of every type. A company page invites made-up prices,
 * clients and results far more than a technical article does, so each type
 * says exactly what must stay a [TODO: ...] for the real company to fill in.
 */

export interface TypePrompt {
  /** "You are ..." for the system message. */
  role: string
  /** What is being written, for the user message. */
  brief: string
  /** The sections, in order, with the list shapes to use. */
  structure: string
  /** True only for the technical article. */
  allowCode: boolean
  /** The facts that must never be invented for this type. */
  honesty: string
  /** Example call-to-action labels for the landing page. */
  ctaHint: string
  /** Shown as the page's category and eyebrow. */
  label: string
  /** What the landing page is, for the copy prompt. */
  pageKind: string
}

const NO_INVENTED_FACTS =
  'NEVER invent prices, discounts, deadlines, guarantees, awards, customer or client names, testimonials, statistics, years in business, team sizes, certifications or results. Do not invent offer terms either: durations, visit or call counts, deliverable counts, free items, turnaround times, service areas, policies or phrases like "no hidden fees". Describe what such work typically involves in general terms, and where a specific term would normally appear, write a placeholder on its own: [TODO: the real price / number / name / date / term].'

export const TYPE_PROMPTS: Record<PipelineContentType, TypePrompt> = {
  marketing: {
    role: 'a marketing copywriter who writes honest, specific campaign pages for companies',
    brief: 'the content of a marketing page',
    structure: `Use these sections, each with a "## " heading:
1. Who this is for and the problem they have (a short paragraph).
2. What they get (a bulleted list of 4 to 6 concrete benefits, each starting with a bold label).
3. How it works (a numbered list of 3 to 5 steps).
4. What to know before starting (a short paragraph, then a bulleted list of 2 to 4 points).
5. The next step (one short paragraph).`,
    allowCode: false,
    honesty: NO_INVENTED_FACTS,
    ctaHint: '"Request a quote", "Book a call", "Ask a question"',
    label: 'Marketing',
    pageKind: 'a marketing campaign page',
  },
  service: {
    role: 'a service-page writer who explains what a company does for its clients in plain language',
    brief: 'the content of a service offering page',
    structure: `Use these sections, each with a "## " heading:
1. What we do and who it is for (a short paragraph).
2. What is included (a bulleted list of 4 to 6 items, each starting with a bold label).
3. How we work (a numbered list of 3 to 5 steps).
4. What we need from you (a bulleted list of 2 to 4 items).
5. Questions people ask (a bulleted list of 3 to 4 items, each a bold question followed by a one-sentence answer).`,
    allowCode: false,
    honesty: NO_INVENTED_FACTS,
    ctaHint: '"Talk to us", "Request a quote", "Book an intro call"',
    label: 'Service offering',
    pageKind: 'a service offering page',
  },
  sales: {
    role: 'a sales-page writer who is persuasive without pressure, hype or false urgency',
    brief: 'the content of a sales page',
    structure: `Use these sections, each with a "## " heading:
1. The problem (a short paragraph that names it plainly).
2. The solution (a short paragraph).
3. What is included (a bulleted list of 4 to 6 items, each starting with a bold label).
4. Doubts people have, answered honestly (a bulleted list of 3 to 4 items, each a bold doubt followed by a one-sentence honest answer).
5. What happens next (a numbered list of 3 steps).`,
    allowCode: false,
    honesty: `${NO_INVENTED_FACTS} No fake scarcity ("only 3 spots left") and no fake urgency. In the doubts list, never answer with a number of days, hours, revisions or any price: answer in general terms and add [TODO: the real term].`,
    ctaHint: '"Get started", "Book a call", "See how it works"',
    label: 'Sales page',
    pageKind: 'a sales page',
  },
  product: {
    role: 'a product writer who announces products and features clearly',
    brief: 'the content of a product or feature launch page',
    structure: `Use these sections, each with a "## " heading:
1. What it is and who it helps (a short paragraph).
2. What is new (a bulleted list of 3 to 5 items, each starting with a bold label).
3. How it works (a numbered list of 3 to 4 steps).
4. Who it is not for (a short, honest paragraph).
5. How to start (one short paragraph).`,
    allowCode: false,
    honesty: `${NO_INVENTED_FACTS} Do not claim capabilities the topic does not state.`,
    ctaHint: '"Try it", "Get early access", "Talk to the team"',
    label: 'Product',
    pageKind: 'a product or feature launch page',
  },
  company: {
    role: 'a writer who explains what a company does and how it works, without buzzwords',
    brief: 'the content of a company overview (About) page',
    structure: `Use these sections, each with a "## " heading:
1. What we do (a short paragraph).
2. How we work (a numbered list of 3 to 4 steps).
3. What we care about (a bulleted list of 3 to 5 values, each a bold label followed by one plain sentence on what it means in practice).
4. Who we work with (a short paragraph).
5. Get in touch (one short paragraph).`,
    allowCode: false,
    honesty: `${NO_INVENTED_FACTS} Do not state a founding year, location, team size or client list; use a placeholder.`,
    ctaHint: '"Get in touch", "Start a conversation", "Say hello"',
    label: 'Company',
    pageKind: 'a company overview page',
  },
  explainer: {
    role: 'a plain-language explainer writer who makes processes easy for people who are not experts',
    brief: 'a how-it-works explainer',
    structure: `Use these sections, each with a "## " heading:
1. The short answer (a short paragraph).
2. How it works, step by step (a numbered list of 4 to 6 steps, each a bold label followed by one sentence).
3. Common mistakes (a bulleted list of 3 to 5 items).
4. When to ask for help (a short paragraph).`,
    allowCode: false,
    honesty: `${NO_INVENTED_FACTS} Explain general, verifiable facts only; for rules that differ by country, company or date, add [TODO: check the current rule for your case].`,
    ctaHint: '"Ask a question", "Get help with this", "Talk it through"',
    label: 'Explainer',
    pageKind: 'a how-it-works explainer page',
  },
  'case-study': {
    role: 'a case-study writer who never makes up results',
    brief: 'the content of a case study',
    structure: `Use these sections, each with a "## " heading:
1. The situation (a short paragraph).
2. The problem (a short paragraph).
3. What was done (a numbered list of 3 to 5 steps, each a bold label followed by one sentence).
4. The result (only [TODO: ...] placeholders, one per line, for each real result the author must supply).
5. What was learned (a bulleted list of 2 to 4 points).`,
    allowCode: false,
    honesty: `${NO_INVENTED_FACTS} The result section must contain placeholders only: never a number, percentage, quote or outcome.`,
    ctaHint: '"Talk about your project", "Get in touch", "Ask how this was done"',
    label: 'Case study',
    pageKind: 'a case study page',
  },
  event: {
    role: 'an event-page writer who is clear about who an event is for and what happens at it',
    brief: 'the content of an event or webinar page',
    structure: `Use these sections, each with a "## " heading:
1. Who this is for (a short paragraph).
2. What you will learn (a bulleted list of 4 to 5 items, each starting with a bold label).
3. The agenda (a numbered list of 3 to 5 items).
4. The details (a short paragraph that contains only [TODO: date], [TODO: time and time zone] and [TODO: place or join link] placeholders).
5. How to join (one short paragraph).`,
    allowCode: false,
    honesty: `${NO_INVENTED_FACTS} Never invent a date, time, venue, speaker name or number of seats.`,
    ctaHint: '"Reserve a spot", "Register", "Save my seat"',
    label: 'Event',
    pageKind: 'an event or webinar page',
  },
  technical: {
    role: 'a technical writer producing an honest first draft of an article for developers',
    brief: 'a technical article for developers',
    structure: `Use "## " headings for sections. Use a bulleted list where three or more points are parallel (each starting with a bold label) and a numbered list for sequential steps. Start with a short paragraph that says what the reader will understand by the end.`,
    allowCode: true,
    honesty:
      "NEVER fabricate code that depends on the author's own project, private APIs, results or setup, and never write code you are not sure runs. NEVER fabricate performance numbers, benchmarks, metrics, personal anecdotes, opinions or results. Insert a placeholder on its own line instead: [TODO: your real, tested code / the real number / the experience needed].",
    ctaHint: '"Talk through your setup", "Ask about this", "Get in touch"',
    label: 'Technical article',
    pageKind: 'a page presenting a technical article',
  },
}

const TONE_NOTES: Record<PipelineTone, string> = {
  technical: 'Technical: precise, assumes a developer reader.',
  conversational: 'Conversational: plain and direct, like explaining it to a colleague.',
  tutorial: 'Tutorial: step by step, explaining why each step is there.',
  professional: 'Professional: clear and calm, no slang.',
  friendly: 'Friendly: warm, simple language, short sentences.',
  persuasive:
    'Persuasive but honest: lead with benefits, state costs and limits plainly, no hype and no pressure.',
}

export const toneNote = (tone: PipelineTone) => TONE_NOTES[tone]

/** The rule about code, which is what made every page carry a snippet. */
export function codeRule(allowCode: boolean): string {
  return allowCode
    ? '- Most articles need no code. Include a code example only when the topic cannot be understood without one, never more than one, and only when it is short, standard and you are certain it runs exactly as written. Otherwise write no code at all.'
    : '- Do not include any code, code blocks or technical syntax. Write for a general reader.'
}
