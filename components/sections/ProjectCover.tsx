import { projectBrand } from '@/components/icons/ProjectMark'

/**
 * Brand-field cover for a project, in place of a stock illustration: the
 * project's own colour as the field and its mark large in the middle, like an
 * app icon on a shelf — the same marks and colours as the home deck. Fills its
 * parent, which sets the height. Decorative; the card says the rest.
 */
export function ProjectCover({ slug }: { slug: string }) {
  const { color, Mark } = projectBrand(slug)
  return (
    <div
      aria-hidden="true"
      className="relative grid h-full w-full place-items-center select-none"
      style={{ background: `color-mix(in srgb, ${color} 16%, var(--color-ds-surface2))` }}
    >
      <span
        className="block h-[92px] w-[92px] [&>svg]:h-full [&>svg]:w-full"
        style={{
          filter: `drop-shadow(0 18px 30px color-mix(in srgb, ${color} 45%, transparent))`,
        }}
      >
        <Mark />
      </span>
    </div>
  )
}
