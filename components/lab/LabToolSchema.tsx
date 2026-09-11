import { JsonLd } from '@/components/seo/JsonLd'
import { buildProjectSchema } from '@/lib/schema/builders'
import { getProjectBySlug } from '@/lib/markdown/projects'

interface LabToolSchemaProps {
  /** Project record slug. When a record exists, its title/description win, so
   * the tool's structured data never drifts from its case study. */
  slug: string
  /** The lab path this tool actually lives at, e.g. `/lab/utm-builder`. */
  path: string
  /** Only for tools with no project record — must match the page metadata. */
  title?: string
  description?: string
}

/**
 * SoftwareApplication JSON-LD for a /lab tool page.
 *
 * The /lab page hosts the running tool; /projects/<slug> hosts its case study.
 * Both describe the same thing, so this points `url` at the lab path rather
 * than letting the entity claim it lives on the case-study page.
 *
 * Deliberately NOT used on the landing-page samples (saas-trial-signup,
 * real-estate-listing, marketing-lead-gen): those are fictional brands, and
 * emitting schema for them would assert that Pulse and Maple Court Residences
 * are real organizations.
 */
export function LabToolSchema({ slug, path, title, description }: LabToolSchemaProps) {
  const project = getProjectBySlug(slug)
  const source =
    project ??
    (title && description ? { slug, title, description, category: 'tool' as const } : null)

  if (!source) return null
  return <JsonLd data={buildProjectSchema(source, path)} />
}
