// lib/email/renderNotificationEmail.ts
//
// One shared, branded template for every owner-facing notification email
// (contact form, résumé downloads, CTA clicks) so they all look like the same
// system instead of ad-hoc HTML per route. Light background on purpose, not
// DevStash's dark site theme — email client dark-mode support is
// inconsistent enough (Gmail/Outlook/Apple Mail all differ) that a dark card
// risks unreadable text in some clients; a light card with the brand's blue
// accent reads correctly everywhere and still looks unmistakably DevStash.

export interface NotificationField {
  label: string
  value: string
  /** Renders the value as a link (e.g. mailto:, an external URL). */
  href?: string
  /** Renders the value in a monospace font — good for paths, UAs, referrers. */
  mono?: boolean
}

export interface NotificationEmailInput {
  icon: string
  heading: string
  /** Optional longer-form content above the field table (e.g. a message body). */
  bodyHtml?: string
  bodyText?: string
  fields: NotificationField[]
  footerNote: string
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function renderNotificationEmail({
  icon,
  heading,
  bodyHtml,
  bodyText,
  fields,
  footerNote,
}: NotificationEmailInput): { html: string; text: string } {
  const rows = fields
    .map(({ label, value, href, mono }) => {
      const safeValue = escapeHtml(value)
      const valueHtml = href
        ? `<a href="${escapeHtml(href)}" style="color:#2563eb;text-decoration:none">${safeValue}</a>`
        : safeValue
      const valueStyle = mono
        ? "font-family:'SF Mono',Consolas,monospace;font-size:12.5px;word-break:break-all;"
        : 'font-size:14px;'
      return `
        <tr>
          <td style="padding:10px 0;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;width:120px;vertical-align:top;border-top:1px solid #f1f5f9">${escapeHtml(label)}</td>
          <td style="padding:10px 0;color:#0f172a;${valueStyle};vertical-align:top;border-top:1px solid #f1f5f9">${valueHtml}</td>
        </tr>`
    })
    .join('')

  const html = `
<div style="background:#f1f5f9;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
    <div style="background:linear-gradient(100deg,#3b82f6,#8b5cf6);padding:20px 28px">
      <span style="color:#ffffff;font-weight:700;font-size:15px;letter-spacing:-0.02em">
        <span style="opacity:0.85">&gt;_</span>&nbsp; DevStash
      </span>
    </div>
    <div style="padding:28px">
      <h1 style="margin:0 0 4px;font-size:19px;color:#0f172a;font-weight:700">
        ${icon}&nbsp; ${escapeHtml(heading)}
      </h1>
      ${
        bodyHtml
          ? `<div style="margin:16px 0 4px;padding:14px 16px;background:#f8fafc;border-radius:10px;color:#334155;font-size:14px;line-height:1.6;white-space:pre-wrap">${bodyHtml}</div>`
          : ''
      }
      <table style="width:100%;border-collapse:collapse;margin-top:${bodyHtml ? '4' : '16'}px">
        ${rows}
      </table>
      <p style="margin:20px 0 0;color:#94a3b8;font-size:12px">${escapeHtml(footerNote)}</p>
    </div>
  </div>
</div>`.trim()

  const text = [
    `${icon} ${heading}`,
    '',
    ...(bodyText ? [bodyText, ''] : []),
    ...fields.map((f) => `${f.label}: ${f.value}`),
    '',
    footerNote,
  ].join('\n')

  return { html, text }
}
