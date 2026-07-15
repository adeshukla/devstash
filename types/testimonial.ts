// types/testimonial.ts

export interface Testimonial {
  quote: string
  name: string
  role: string
  company: string
  /** Full LinkedIn profile or recommendation URL — required so every quote is verifiable. */
  linkedinUrl: string
  avatar?: string
}
