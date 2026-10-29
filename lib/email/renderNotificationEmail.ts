// lib/email/renderNotificationEmail.ts
//
// One shared, branded template for every owner-facing notification email
// (contact form, résumé downloads, CTA clicks) so they all look like the same
// system instead of ad-hoc HTML per route. Light background on purpose, not
// DevStash's dark site theme — email client dark-mode support is
// inconsistent enough (Gmail/Outlook/Apple Mail all differ) that a dark card
// risks unreadable text in some clients; a light card with the brand's blue
// accent reads correctly everywhere and still looks unmistakably DevStash.
//
// "Interaction" in email means links: mailto:/tel:/https buttons are the only
// thing every client renders, so actions are plain anchors styled as buttons.

export interface NotificationField {
  label: string
  value: string
  /** Renders the value as a link (e.g. mailto:, an external URL). */
  href?: string
  /** Renders the value in a monospace font — good for paths, UAs, referrers. */
  mono?: boolean
  /** Starts a new titled group of rows in the details table. */
  section?: string
}

export interface NotificationAction {
  label: string
  href: string
  /** Filled blue button; the rest are outlined. */
  primary?: boolean
}

export interface NotificationBadge {
  text: string
  /** Text colour and pill background, any CSS colour. */
  color: string
  background: string
}

export interface NotificationEmailInput {
  icon: string
  heading: string
  /** Small coloured pill next to the heading (e.g. the message topic). */
  badge?: NotificationBadge
  /** Hidden inbox-preview text shown after the subject in the message list. */
  preheader?: string
  /** One line above the body, e.g. who it is from. Plain text. */
  lead?: string
  /** Optional longer-form content above the field table (e.g. a message body). */
  bodyHtml?: string
  bodyText?: string
  /** Buttons rendered between the body and the details table. */
  actions?: NotificationAction[]
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

function renderButton({ label, href, primary }: NotificationAction): string {
  const style = primary
    ? 'background:#2563eb;color:#ffffff;border:1px solid #2563eb'
    : 'background:#ffffff;color:#2563eb;border:1px solid #cbd5e1'
  return `<a href="${escapeHtml(href)}" style="display:inline-block;margin:0 8px 8px 0;padding:10px 18px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;${style}">${escapeHtml(label)}</a>`
}

export function renderNotificationEmail({
  icon,
  heading,
  badge,
  preheader,
  lead,
  bodyHtml,
  bodyText,
  actions,
  fields,
  footerNote,
}: NotificationEmailInput): { html: string; text: string } {
  const rows = fields
    .map(({ label, value, href, mono, section }) => {
      const safeValue = escapeHtml(value)
      const valueHtml = href
        ? `<a href="${escapeHtml(href)}" style="color:#2563eb;text-decoration:none">${safeValue}</a>`
        : safeValue
      const valueStyle = mono
        ? "font-family:'SF Mono',Consolas,monospace;font-size:12.5px;word-break:break-all;"
        : 'font-size:14px;'
      const sectionRow = section
        ? `
        <tr>
          <td colspan="2" style="padding:18px 0 6px;color:#0f172a;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase">${escapeHtml(section)}</td>
        </tr>`
        : ''
      return `${sectionRow}
        <tr>
          <td style="padding:9px 12px 9px 0;color:#64748b;font-size:13px;width:110px;vertical-align:top;border-top:1px solid #f1f5f9">${escapeHtml(label)}</td>
          <td style="padding:9px 0;color:#0f172a;${valueStyle};vertical-align:top;border-top:1px solid #f1f5f9">${valueHtml}</td>
        </tr>`
    })
    .join('')

  const badgeHtml = badge
    ? `<span style="display:inline-block;margin-left:8px;padding:3px 10px;border-radius:999px;background:${badge.background};color:${badge.color};font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;vertical-align:middle">${escapeHtml(badge.text)}</span>`
    : ''

  const html = `
<div style="background:#f1f5f9;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(preheader)}</div>` : ''}
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
    <div style="background:linear-gradient(100deg,#3b82f6,#8b5cf6);padding:20px 28px">
      <span style="color:#ffffff;font-weight:700;font-size:15px;letter-spacing:-0.02em">
        <span style="opacity:0.85">&gt;_</span>&nbsp; DevStash
      </span>
    </div>
    <div style="padding:28px">
      <h1 style="margin:0 0 4px;font-size:19px;color:#0f172a;font-weight:700">
        ${icon}&nbsp; ${escapeHtml(heading)}${badgeHtml}
      </h1>
      ${lead ? `<p style="margin:6px 0 0;color:#475569;font-size:14px">${escapeHtml(lead)}</p>` : ''}
      ${
        bodyHtml
          ? `<div style="margin:16px 0 4px;padding:14px 16px;background:#f8fafc;border-left:3px solid #3b82f6;border-radius:6px;color:#334155;font-size:14px;line-height:1.6;white-space:pre-wrap">${bodyHtml}</div>`
          : ''
      }
      ${actions?.length ? `<div style="margin-top:16px">${actions.map(renderButton).join('')}</div>` : ''}
      <table style="width:100%;border-collapse:collapse;margin-top:${bodyHtml || actions?.length ? '8' : '16'}px">
        ${rows}
      </table>
      <p style="margin:20px 0 0;color:#94a3b8;font-size:12px">${escapeHtml(footerNote)}</p>
    </div>
  </div>
</div>`.trim()

  const text = [
    `${icon} ${heading}${badge ? ` [${badge.text}]` : ''}`,
    ...(lead ? [lead] : []),
    '',
    ...(bodyText ? [bodyText, ''] : []),
    ...(actions?.length ? [...actions.map((a) => `${a.label}: ${a.href}`), ''] : []),
    ...fields.flatMap((f) => [
      ...(f.section ? ['', `— ${f.section} —`] : []),
      `${f.label}: ${f.value}`,
    ]),
    '',
    footerNote,
  ].join('\n')

  return { html, text }
}
