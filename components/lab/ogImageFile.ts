// Reads a picture the visitor chose, entirely in the browser: shrinks it, turns it into a data URL
// the SVG can carry, and takes a small thumbnail for the colour extractor. Nothing is uploaded.

export interface LoadedImage {
  dataUrl: string
  width: number
  height: number
  /** RGBA pixels of a small copy, for the palette. */
  thumb: Uint8ClampedArray
}

const MAX_BYTES = 15 * 1024 * 1024

function read(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(new Error('That file could not be read.'))
    r.readAsDataURL(file)
  })
}

function decode(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () =>
      reject(
        new Error('That does not look like a picture the browser can open. Try a PNG, JPG or WebP.')
      )
    img.src = src
  })
}

/**
 * `maxDim` caps the longest side. A photo becomes a JPEG (smaller, and it has no see-through parts);
 * a logo stays a PNG so its transparent background survives.
 */
export async function loadImage(
  file: File,
  opts: { maxDim: number; as: 'jpeg' | 'png'; quality?: number }
): Promise<LoadedImage> {
  if (!file.type.startsWith('image/'))
    throw new Error('Choose an image file: PNG, JPG, WebP or SVG.')
  if (file.size > MAX_BYTES) throw new Error('That file is over 15 MB. Choose a smaller one.')
  const img = await decode(await read(file))
  const nw = img.naturalWidth || img.width
  const nh = img.naturalHeight || img.height
  if (!nw || !nh) throw new Error('That picture has no size the browser can read.')
  const scale = Math.min(1, opts.maxDim / Math.max(nw, nh))
  const w = Math.max(1, Math.round(nw * scale))
  const h = Math.max(1, Math.round(nh * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('This browser cannot draw pictures.')
  if (opts.as === 'jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
  }
  ctx.drawImage(img, 0, 0, w, h)
  const dataUrl = canvas.toDataURL(
    opts.as === 'jpeg' ? 'image/jpeg' : 'image/png',
    opts.quality ?? 0.88
  )

  const t = Math.min(1, 72 / Math.max(w, h))
  const tw = Math.max(1, Math.round(w * t))
  const th = Math.max(1, Math.round(h * t))
  const small = document.createElement('canvas')
  small.width = tw
  small.height = th
  const sctx = small.getContext('2d')
  sctx?.drawImage(canvas, 0, 0, tw, th)
  return {
    dataUrl,
    width: w,
    height: h,
    thumb: sctx ? sctx.getImageData(0, 0, tw, th).data : new Uint8ClampedArray(0),
  }
}
