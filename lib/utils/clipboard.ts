// lib/utils/clipboard.ts
//
// One clipboard write used by every copy button on the site (blog code
// blocks, lab code blocks, pipeline output, UTM builder). The async
// Clipboard API rejects in real situations — permission denied, unfocused
// document, older browsers — and every caller used to just await it, so a
// rejection meant the button silently did nothing. This falls back to the
// legacy execCommand path and reports success/failure so the button can
// show honest feedback.

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }
}
