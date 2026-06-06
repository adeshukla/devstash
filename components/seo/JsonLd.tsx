// components/seo/JsonLd.tsx
import type { Thing, WithContext } from 'schema-dts'

interface JsonLdProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: WithContext<Thing> | Record<string, any>
}

/**
 * Renders a <script type="application/ld+json"> tag in the <head>.
 * Use this with builders from lib/schema/builders.ts.
 *
 * @example
 * <JsonLd data={buildBlogPostingSchema(post)} />
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  )
}
