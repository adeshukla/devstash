// Everything the UTM tools remember lives in this browser. One place for the
// keys, so the builder, checker, cleaner and backup all read the same data.

export const KEYS = {
  sheet: 'devstash-utm-sheet',
  recent: 'devstash-utm-recent',
  presets: 'devstash-utm-presets',
  rules: 'devstash-utm-rules',
  owner: 'devstash-utm-owner',
  aliases: 'devstash-utm-aliases',
} as const

export function readStored<T>(key: string, fallback: T): T {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(key) ?? 'null')
    return (parsed as T) ?? fallback
  } catch {
    return fallback
  }
}

export function writeStored(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage blocked: everything still works for this visit
  }
}
