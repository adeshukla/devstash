// What the pipeline can write, shared by the form and the API. Prompts live in
// lib/ai/contentTypes.ts (server only); this file is safe for the browser.

import type { PipelineContentType, PipelineTone } from '@/types/aiPipeline'

export interface ContentTypeOption {
  value: PipelineContentType
  label: string
  /** One line shown under the dropdown. */
  hint: string
  topicPlaceholder: string
  keywordPlaceholder: string
  /** Tones that suit this type; the first is the default. */
  tones: PipelineTone[]
  /** Only the technical article reads as a dated blog post. */
  article: boolean
}

export const TONE_LABELS: Record<PipelineTone, string> = {
  technical: 'Technical',
  conversational: 'Conversational',
  tutorial: 'Tutorial',
  professional: 'Professional',
  friendly: 'Friendly',
  persuasive: 'Persuasive but honest',
}

export const CONTENT_TYPE_OPTIONS: ContentTypeOption[] = [
  {
    value: 'marketing',
    label: 'Marketing page',
    hint: 'A campaign or offer page: who it is for, the problem, the benefits and a clear next step.',
    topicPlaceholder: 'Autumn energy audit offer for small offices',
    keywordPlaceholder: 'energy audit, lower bills',
    tones: ['persuasive', 'professional', 'friendly', 'conversational'],
    article: false,
  },
  {
    value: 'service',
    label: 'Service offering',
    hint: 'What a company does for clients: the service, who it is for, how it works and what to expect.',
    topicPlaceholder: 'Bookkeeping for small online shops',
    keywordPlaceholder: 'bookkeeping, tax filing, monthly reports',
    tones: ['professional', 'friendly', 'persuasive', 'conversational'],
    article: false,
  },
  {
    value: 'sales',
    label: 'Sales page',
    hint: 'The problem, the solution, what is included, honest answers to doubts and what happens next.',
    topicPlaceholder: 'Done-for-you landing pages for ad campaigns',
    keywordPlaceholder: 'landing page, ad campaign, conversions',
    tones: ['persuasive', 'professional', 'friendly', 'conversational'],
    article: false,
  },
  {
    value: 'product',
    label: 'Product or feature launch',
    hint: 'Announce something new: what it is, who it helps, what changes and how to start.',
    topicPlaceholder: 'Scheduled reports in our analytics dashboard',
    keywordPlaceholder: 'reports, scheduling, dashboard',
    tones: ['professional', 'friendly', 'conversational', 'persuasive'],
    article: false,
  },
  {
    value: 'company',
    label: 'Company overview',
    hint: 'An About page: what the company does, how it works and what it cares about.',
    topicPlaceholder: 'A four-person design studio that builds websites for clinics',
    keywordPlaceholder: 'design studio, clinics, websites',
    tones: ['professional', 'friendly', 'conversational'],
    article: false,
  },
  {
    value: 'explainer',
    label: 'How it works',
    hint: 'Explain a process or idea step by step for someone who is not an expert.',
    topicPlaceholder: 'How a home loan application works',
    keywordPlaceholder: 'home loan, eligibility, documents',
    tones: ['friendly', 'professional', 'conversational', 'tutorial'],
    article: false,
  },
  {
    value: 'case-study',
    label: 'Case study',
    hint: 'Situation, problem, what was done and what was learned. Results stay as [TODO] for your real numbers.',
    topicPlaceholder: 'Redesigning a clinic booking flow',
    keywordPlaceholder: 'booking flow, ux, redesign',
    tones: ['professional', 'conversational', 'friendly'],
    article: false,
  },
  {
    value: 'event',
    label: 'Event or webinar',
    hint: 'Promote an event: who it is for, what people learn, the agenda and how to join. Dates stay as [TODO].',
    topicPlaceholder: 'A free workshop on GST filing for freelancers',
    keywordPlaceholder: 'gst, freelancers, workshop',
    tones: ['friendly', 'professional', 'persuasive', 'conversational'],
    article: false,
  },
  {
    value: 'technical',
    label: 'Technical article',
    hint: 'For developers. A short code example appears only when the topic needs one.',
    topicPlaceholder: 'Why your Next.js images are still slow',
    keywordPlaceholder: 'next/image, lcp, core web vitals',
    tones: ['technical', 'conversational', 'tutorial'],
    article: true,
  },
]

export const DEFAULT_CONTENT_TYPE: PipelineContentType = 'marketing'

export const contentTypeOption = (value: PipelineContentType) =>
  CONTENT_TYPE_OPTIONS.find((o) => o.value === value) ?? CONTENT_TYPE_OPTIONS[0]
