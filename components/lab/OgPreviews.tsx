interface Props {
  /** The image as a data: URL. */
  src: string
  title: string
  subtitle: string
}

/** Chat and social apps cut a share image to about this shape, whatever size it was made at. */
const CROP = 'aspect-[1.91/1]'

function Card({ src, title, subtitle, small }: Props & { small?: boolean }) {
  return (
    <div className="border-ds-border bg-ds-surface overflow-hidden rounded-lg border">
      <div className={`${CROP} bg-ds-surface2 w-full overflow-hidden`}>
        {src && (
          // eslint-disable-next-line @next/next/no-img-element -- a data: URL made here, not a file next/image can optimise
          <img src={src} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div className={small ? 'p-2' : 'p-3'}>
        <p className="text-ds-muted font-mono text-[10px] tracking-wide uppercase">yoursite.com</p>
        <p
          className={`text-ds-text mt-0.5 line-clamp-2 font-semibold ${small ? 'text-xs' : 'text-sm'}`}
        >
          {title || 'Your title goes here'}
        </p>
        {subtitle && (
          <p className={`text-ds-muted mt-0.5 line-clamp-2 ${small ? 'text-[10px]' : 'text-xs'}`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}

/** The image as it looks in a link card on a computer and in a chat on a phone. */
export function OgPreviews(props: Props) {
  return (
    <div data-tour="shared" className="mt-4 flex flex-col gap-4">
      <h3 className="text-ds-text text-sm font-semibold">
        How it looks when someone shares a link
      </h3>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <figure>
          <figcaption className="text-ds-muted mb-1.5 text-xs">On a computer</figcaption>
          <div className="border-ds-border bg-ds-bg rounded-xl border p-3">
            <div className="mx-auto max-w-[26rem]">
              <Card {...props} />
            </div>
          </div>
        </figure>
        <figure className="mx-auto w-full max-w-[13.5rem] shrink-0 sm:mx-0">
          <figcaption className="text-ds-muted mb-1.5 text-xs">On a phone</figcaption>
          <div className="border-ds-border bg-ds-bg rounded-[1.75rem] border-2 px-3 pt-3 pb-4">
            <div className="bg-ds-border mx-auto mb-3 h-1 w-10 rounded-full" aria-hidden="true" />
            <div className="ml-auto w-[88%]">
              <Card {...props} small />
            </div>
          </div>
        </figure>
      </div>
      <p className="text-ds-muted text-xs leading-relaxed">
        Apps cut the image to about 1.91 : 1 from the middle, so a square or tall image loses its
        top and bottom here. Each app crops a little differently, so keep important words away from
        the edges.
      </p>
    </div>
  )
}
