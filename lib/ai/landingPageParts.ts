import 'server-only'

/**
 * Deterministic pieces of the generated landing page.
 *
 * Two things are built here rather than asked of the model:
 *
 * 1. The article body. The model was only ever summarising the post into a few
 *    cards, so the ~600-900 words the pipeline actually generated never reached
 *    the page. Asking it to re-emit the whole article would cost well over a
 *    thousand output tokens inside an 8k-per-minute ceiling, and would risk it
 *    paraphrasing or trimming. We already hold the exact text server-side, so
 *    we render it ourselves: full fidelity, zero extra tokens.
 *
 * 2. The contact form. Generated validation is inconsistent between runs;
 *    hand-written validation is correct every time. Injecting it also
 *    guarantees the form exists no matter what the model returned.
 */

// ─── HTML escaping ───────────────────────────────────────────────────────────

/**
 * The article text is LLM output being interpolated into an HTML document that
 * a visitor can download and open locally, so it is untrusted input to an HTML
 * context and must be escaped before any markup is added back.
 */
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Inline markdown, applied only AFTER the text has been escaped. */
function inlineMarkdown(escaped: string): string {
  return escaped
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>')
}

// ─── Article body ────────────────────────────────────────────────────────────

const TODO_MARKER = /\[TODO:[^\]]*\]/gi

/**
 * Minimal, deliberately boring Markdown -> HTML for the pipeline's own output:
 * headings, paragraphs, unordered/ordered lists and fenced code. Anything it
 * doesn't recognise stays a paragraph, which is the safe failure mode.
 *
 * [TODO: ...] markers are dropped: they flag where the author still owes real
 * substance, and a public landing page is the last place they should surface.
 */
export function renderArticleHtml(markdown: string): string {
  const source = markdown.replace(TODO_MARKER, '').trim()
  if (!source) return ''

  const blocks: string[] = []
  const lines = source.split('\n')
  let paragraph: string[] = []
  let list: { ordered: boolean; items: string[] } | null = null
  let code: string[] | null = null

  const flushParagraph = () => {
    if (!paragraph.length) return
    const text = inlineMarkdown(escapeHtml(paragraph.join(' ').trim()))
    if (text) blocks.push(`<p>${text}</p>`)
    paragraph = []
  }
  const flushList = () => {
    if (!list) return
    const tag = list.ordered ? 'ol' : 'ul'
    const items = list.items.map((i) => `<li>${inlineMarkdown(escapeHtml(i))}</li>`).join('')
    blocks.push(`<${tag}>${items}</${tag}>`)
    list = null
  }
  const flushAll = () => {
    flushParagraph()
    flushList()
  }

  const splitRow = (r: string) =>
    r
      .trim()
      .replace(/^\||\|$/g, '')
      .split('|')
      .map((c) => c.trim())

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const line = rawLine.replace(/\s+$/, '')

    if (/^\s*```/.test(line)) {
      if (code) {
        blocks.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`)
        code = null
      } else {
        flushAll()
        code = []
      }
      continue
    }
    if (code) {
      code.push(rawLine)
      continue
    }

    if (!line.trim()) {
      flushAll()
      continue
    }

    // GFM table: header row, a |---|---| separator, then body rows. The model
    // emits these fairly often and, unhandled, they render as a wall of raw
    // pipe characters mid-article.
    if (/^\s*\|.*\|\s*$/.test(line) && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1] ?? '')) {
      flushAll()
      const header = splitRow(line)
      const bodyRows: string[][] = []
      let j = i + 2
      for (; j < lines.length && /^\s*\|.*\|\s*$/.test(lines[j]); j++) {
        bodyRows.push(splitRow(lines[j]))
      }
      const th = header.map((c) => `<th>${inlineMarkdown(escapeHtml(c))}</th>`).join('')
      const body = bodyRows
        .map(
          (r) => `<tr>${r.map((c) => `<td>${inlineMarkdown(escapeHtml(c))}</td>`).join('')}</tr>`
        )
        .join('')
      blocks.push(
        `<div class="table-wrap"><table><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table></div>`
      )
      i = j - 1
      continue
    }

    // Setext-style "===" / "---" underline promotes the previous line.
    if (/^\s*(={3,}|-{3,})\s*$/.test(line) && paragraph.length) {
      const heading = paragraph.pop() as string
      flushAll()
      blocks.push(`<h2>${inlineMarkdown(escapeHtml(heading.trim()))}</h2>`)
      continue
    }

    const atx = line.match(/^\s*(#{1,6})\s+(.*)$/)
    if (atx) {
      flushAll()
      // Never emit another h1 — the hero already owns the page's single h1.
      const level = Math.min(Math.max(atx[1].length, 2), 4)
      blocks.push(`<h${level}>${inlineMarkdown(escapeHtml(atx[2].trim()))}</h${level}>`)
      continue
    }

    const bullet = line.match(/^\s*[-*+]\s+(.*)$/)
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/)
    if (bullet || numbered) {
      flushParagraph()
      const ordered = Boolean(numbered)
      const item = (bullet ? bullet[1] : (numbered as RegExpMatchArray)[1]).trim()
      if (!list || list.ordered !== ordered) {
        flushList()
        list = { ordered, items: [] }
      }
      list.items.push(item)
      continue
    }

    flushList()
    paragraph.push(line.trim())
  }

  if (code) blocks.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`)
  flushAll()

  return blocks.join('\n')
}

// ─── Contact form ────────────────────────────────────────────────────────────

/**
 * The form posts to whatever endpoint the author configures. It ships unset on
 * purpose — inventing a live endpoint would silently drop real leads — so the
 * default path is a mailto: fallback that still lets a visitor reach someone.
 * Swap FORM_ENDPOINT for a Formspree/Netlify/webhook URL to capture directly.
 */
export const CONTACT_FORM_HTML = `
<section id="contact" class="contact-section reveal" aria-labelledby="contact-heading">
  <div class="contact-inner">
    <h2 id="contact-heading">Get in touch</h2>
    <p class="contact-lead">Have a question about this, or want to work together? Send a message.</p>
    <form id="lead-form" class="lead-form" novalidate>
      <div class="field">
        <label for="lead-name">Name</label>
        <input id="lead-name" name="name" type="text" autocomplete="name" required
               aria-describedby="lead-name-error" />
        <p class="field-error" id="lead-name-error" role="alert"></p>
      </div>
      <div class="field">
        <label for="lead-email">Email</label>
        <input id="lead-email" name="email" type="email" autocomplete="email" required
               aria-describedby="lead-email-error" />
        <p class="field-error" id="lead-email-error" role="alert"></p>
      </div>
      <div class="field">
        <label for="lead-message">Message</label>
        <textarea id="lead-message" name="message" rows="4" required
                  aria-describedby="lead-message-error"></textarea>
        <p class="field-error" id="lead-message-error" role="alert"></p>
      </div>
      <button type="submit" class="btn btn-primary lead-submit">Send message</button>
      <p class="form-status" id="lead-status" role="status" aria-live="polite"></p>
    </form>
  </div>
</section>`

export const CONTACT_FORM_CSS = `
  .contact-section { padding: clamp(4rem,10vw,7rem) 1.5rem; }
  .contact-inner { max-width: 640px; margin: 0 auto; }
  .contact-lead { color: var(--muted); margin-bottom: 2rem; }
  .lead-form { display: flex; flex-direction: column; gap: 1.25rem; }
  .lead-form .field { display: flex; flex-direction: column; gap: .4rem; min-width: 0; }
  .lead-form label { font-size: .875rem; font-weight: 600; }
  .lead-form input, .lead-form textarea {
    width: 100%; box-sizing: border-box; padding: .75rem .9rem;
    background: var(--surface-2); color: var(--text);
    border: 1px solid var(--border); border-radius: 10px;
    font: inherit; transition: border-color .2s ease;
  }
  .lead-form input:focus-visible, .lead-form textarea:focus-visible {
    outline: 2px solid var(--accent); outline-offset: 2px; border-color: var(--accent);
  }
  .lead-form [aria-invalid="true"] { border-color: #ef4444; }
  .field-error { min-height: 1.1em; margin: 0; font-size: .8125rem; color: #ef4444; }
  .form-status { margin: .25rem 0 0; font-size: .875rem; color: var(--muted); }
  .form-status[data-state="ok"] { color: #10b981; }
  .form-status[data-state="err"] { color: #ef4444; }
  .lead-submit { align-self: flex-start; }`

export const CONTACT_FORM_JS = `
<script>
  (function () {
    var form = document.getElementById('lead-form')
    if (!form) return

    // Set this to a Formspree / Netlify / webhook URL to capture leads directly.
    var FORM_ENDPOINT = ''
    var FALLBACK_EMAIL = 'hello@devstash.me'

    var status = document.getElementById('lead-status')
    var fields = [
      { el: form.elements.name, err: 'lead-name-error', label: 'Name' },
      { el: form.elements.email, err: 'lead-email-error', label: 'Email' },
      { el: form.elements.message, err: 'lead-message-error', label: 'Message' }
    ]

    function setError(f, msg) {
      var box = document.getElementById(f.err)
      if (box) box.textContent = msg || ''
      if (msg) f.el.setAttribute('aria-invalid', 'true')
      else f.el.removeAttribute('aria-invalid')
      return !msg
    }

    function validate(f) {
      var v = (f.el.value || '').trim()
      if (!v) return setError(f, f.label + ' is required.')
      if (f.el.type === 'email' && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(v)) {
        return setError(f, 'Enter a valid email address.')
      }
      if (f.el.tagName === 'TEXTAREA' && v.length < 10) {
        return setError(f, 'Please write at least 10 characters.')
      }
      return setError(f, '')
    }

    fields.forEach(function (f) {
      f.el.addEventListener('blur', function () { validate(f) })
      f.el.addEventListener('input', function () {
        if (f.el.getAttribute('aria-invalid') === 'true') validate(f)
      })
    })

    form.addEventListener('submit', function (e) {
      e.preventDefault()
      var firstBad = null
      fields.forEach(function (f) { if (!validate(f) && !firstBad) firstBad = f })
      if (firstBad) {
        status.textContent = 'Please fix the highlighted fields.'
        status.setAttribute('data-state', 'err')
        firstBad.el.focus()
        return
      }

      var data = {
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        message: form.elements.message.value.trim()
      }

      if (!FORM_ENDPOINT) {
        // No endpoint configured — hand off to the visitor's mail client rather
        // than pretending the message was captured.
        var subject = encodeURIComponent('Enquiry from ' + data.name)
        var body = encodeURIComponent(data.message + '\\n\\n— ' + data.name + ' (' + data.email + ')')
        window.location.href = 'mailto:' + FALLBACK_EMAIL + '?subject=' + subject + '&body=' + body
        status.textContent = 'Opening your email client…'
        status.setAttribute('data-state', 'ok')
        return
      }

      var btn = form.querySelector('.lead-submit')
      btn.disabled = true
      status.textContent = 'Sending…'
      status.removeAttribute('data-state')

      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (r) {
          if (!r.ok) throw new Error(String(r.status))
          form.reset()
          status.textContent = 'Thanks — your message is on its way.'
          status.setAttribute('data-state', 'ok')
        })
        .catch(function () {
          status.textContent = 'Could not send right now. Please email ' + FALLBACK_EMAIL + '.'
          status.setAttribute('data-state', 'err')
        })
        .finally(function () { btn.disabled = false })
    })
  })()
</script>`
