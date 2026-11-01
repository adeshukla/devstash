// Pure helpers behind the Lab's shareable links. Kept free of React and of the
// "@/" alias so node:test can import them directly.

/** Query string for the non-empty values only, so default state leaves the URL clean. */
export function buildSearch(values: Record<string, string>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) {
    if (value !== '') params.set(key, value)
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

/** Use a URL value only if it is one of the allowed options, else the fallback. */
export function pick<T extends string>(
  value: string | null,
  allowed: readonly T[],
  fallback: T
): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}
