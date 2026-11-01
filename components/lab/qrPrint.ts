import { qrSvg, type QrCode, type QrStyle } from '@/lib/lab/qr'

export interface PrintItem {
  qr: QrCode
  style: QrStyle
  /** Caption printed under the code, e.g. "google / cpc · spring-sale". */
  caption: string
  url: string
}

/**
 * Prints codes on a clean sheet. A temporary block is added to the page, a
 * print-only rule hides everything else, and the block is removed afterwards.
 * Text goes in with textContent, so links and names cannot inject markup.
 */
export function printQrSheet(items: PrintItem[]) {
  if (!items.length) return
  const root = document.createElement('div')
  root.className = 'qr-print-root'
  const style = document.createElement('style')
  style.textContent = `
    .qr-print-root { display: none; }
    @media print {
      body > *:not(.qr-print-root) { display: none !important; }
      .qr-print-root { display: grid !important; grid-template-columns: repeat(2, 1fr); gap: 12mm; padding: 10mm; color: #000; background: #fff; font-family: Arial, Helvetica, sans-serif; }
      .qr-print-cell { break-inside: avoid; }
      .qr-print-cell svg { width: 60mm; height: auto; display: block; }
      .qr-print-cell p { margin: 2mm 0 0; font-size: 9pt; word-break: break-all; }
      .qr-print-cell p.qr-url { font-size: 7pt; color: #444; }
    }`
  root.appendChild(style)
  for (const item of items) {
    const cell = document.createElement('div')
    cell.className = 'qr-print-cell'
    const holder = document.createElement('div')
    holder.innerHTML = qrSvg(item.qr, item.style) // our own markup; label is XML-escaped there
    cell.appendChild(holder)
    const caption = document.createElement('p')
    caption.textContent = item.caption
    const link = document.createElement('p')
    link.className = 'qr-url'
    link.textContent = item.url
    cell.append(caption, link)
    root.appendChild(cell)
  }
  document.body.appendChild(root)
  window.addEventListener('afterprint', () => root.remove(), { once: true })
  window.print()
}
