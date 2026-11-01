// A campaign pack: one self-contained HTML file with every link, its GA4
// channel, a QR code and the naming checks. It opens in any browser, prints to
// PDF, and can be sent to a client or a printer. Pure, no React and no "@/"
// imports so node:test can run it.

export interface PackItem {
  url: string
  source: string
  medium: string
  campaign: string
  channel: string
  /** Complete SVG markup from qrSvg, or empty when the link cannot have a code. */
  svg: string
}

export interface PackInput {
  title: string
  owner: string
  /** YYYY-MM-DD */
  date: string
  /** Version id of the team rules the links follow, or empty. */
  rules: string
  issues: string[]
  items: PackItem[]
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

/** What to check before a tagged campaign goes live. Shown in the pack and in the builder. */
export const LAUNCH_CHECKLIST: string[] = [
  'Open each link in a private window and confirm the right page loads.',
  'On that page, look at the address bar. The utm_ parameters should still be there; if they are gone, a redirect is dropping them.',
  'Click the link while GA4 is open at Reports, then Realtime, and check the source and medium appear.',
  'For paid ads, check the tracking part in the ad platform, then use its preview or a test click. Do not guess.',
  'Scan each QR code with a phone and confirm it opens the right page.',
  'A day or two after launch, open the traffic report and check each link landed in the channel shown in this pack.',
]

const STYLE = `
  body{font:15px/1.5 Arial,Helvetica,sans-serif;color:#111;margin:0;padding:32px;max-width:960px}
  h1{font-size:24px;margin:0 0 4px} h2{font-size:16px;margin:28px 0 8px}
  .meta{color:#555;font-size:13px;margin:0 0 16px}
  .issues{background:#fff7e6;border:1px solid #f0c36d;border-radius:8px;padding:10px 14px;font-size:13px}
  table{border-collapse:collapse;width:100%;font-size:13px}
  th,td{border-top:1px solid #ddd;padding:10px 8px;vertical-align:top;text-align:left}
  th{background:#f5f5f5;border-top:0}
  td.url{font-family:Consolas,Menlo,monospace;font-size:11px;word-break:break-all}
  td.qr svg{width:110px;height:auto;display:block}
  .note{color:#666;font-size:12px}
  tr{break-inside:avoid}
  .todo{list-style:none;padding:0}.todo li{padding:6px 0;font-size:14px}.todo input{margin-right:10px}
  @media print{body{padding:12px}}`

/** Builds the full HTML document. Every text value is escaped. */
export function buildPackHtml(input: PackInput): string {
  const { title, owner, date, rules, issues, items } = input
  const meta = [
    `${items.length} link${items.length === 1 ? '' : 's'}`,
    date,
    owner && `Owner: ${owner}`,
    rules && `Rules version ${rules}`,
  ]
    .filter(Boolean)
    .map((m) => esc(String(m)))
    .join(' · ')
  const rows = items
    .map(
      (it, i) => `<tr>
<td>${i + 1}</td>
<td>${esc(it.source)} / ${esc(it.medium)}<br><span class="note">${esc(it.campaign)}</span></td>
<td>${esc(it.channel || '')}</td>
<td class="url">${esc(it.url)}</td>
<td class="qr">${it.svg || '<span class="note">No QR: placeholders only work inside the ad platform</span>'}</td>
</tr>`
    )
    .join('\n')
  const problems = issues.length
    ? `<h2>Naming checks</h2><div class="issues"><ul>${issues.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>`
    : `<h2>Naming checks</h2><p class="note">No naming problems found.</p>`
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><style>${STYLE}</style></head>
<body>
<main>
<h1>${esc(title)}</h1>
<p class="meta">${meta}</p>
${problems}
<h2>Links</h2>
<table>
<thead><tr><th>#</th><th>Channel</th><th>GA4 channel</th><th>Link</th><th>QR code</th></tr></thead>
<tbody>
${rows}
</tbody>
</table>
<h2>Before you launch</h2>
<ul class="todo">
${LAUNCH_CHECKLIST.map((t) => `<li><label><input type="checkbox"> ${esc(t)}</label></li>`).join('\n')}
</ul>
<p class="note">QR codes are static: the link is stored in the pattern, so they never expire.</p>
</main>
</body></html>`
}
