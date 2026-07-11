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
  // Escape "<" so a content string containing "</script>" can never break out
  // of this tag and inject markup. "<" is valid JSON and parses back to
  // "<", so search engines read identical structured data.
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
