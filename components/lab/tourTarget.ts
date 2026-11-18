// Finds what a tour step points at. A target is a CSS selector, or `text:Some words` for the
// heading, label, summary, button or tab whose text is (or starts with) those words. Then the
// part of the page it belongs to is returned, so the outline covers a whole field or section
// and not just one line of text.

const TEXT_TAGS = 'h1,h2,h3,legend,summary,label,button,[role=tab],a'

const clean = (s: string | null) => (s ?? '').replace(/\s+/g, ' ').trim()

function byText(words: string): Element | null {
  const root = document.querySelector('main') ?? document.body
  const all = [...root.querySelectorAll(TEXT_TAGS)]
  const want = clean(words)
  return (
    all.find((e) => clean(e.textContent) === want) ??
    all.find((e) => clean(e.textContent).startsWith(want)) ??
    null
  )
}

/** The part of the page to outline for an element: its field, its section or itself. */
function container(el: Element): Element {
  const tag = el.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select' || tag === 'label')
    return el.parentElement ?? el
  if (tag === 'summary') return el.closest('details') ?? el
  if (/^h[1-3]$/.test(tag) || tag === 'legend')
    return el.closest('section,fieldset,details,form,[role=tabpanel],article') ?? el
  return el
}

export function resolveTarget(target: string): Element | null {
  const el = target.startsWith('text:') ? byText(target.slice(5)) : document.querySelector(target)
  return el ? container(el) : null
}

/** For the "try it" button of a step: the exact element to click, not its container. */
export function resolveClickable(target: string): HTMLElement | null {
  const el = target.startsWith('text:') ? byText(target.slice(5)) : document.querySelector(target)
  return el instanceof HTMLElement ? el : null
}
