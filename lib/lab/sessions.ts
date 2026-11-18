// Named sessions for the Lab tools: save the work in a tool under a name, reopen it later, copy
// it, rename it, delete it, and move it between browsers as a file. Pure, no React and no "@/"
// imports so node:test can run it. Storage and the screen live in components/lab/.

export const SESSIONS_APP = 'devstash-sessions'
export const MAX_SESSIONS = 30
export const MAX_NAME = 60
/** One session's data, as JSON text. Keeps one tool from filling the browser's storage. */
export const MAX_DATA_CHARS = 300_000

export type SessionData = Record<string, unknown>

export interface Session {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  data: SessionData
}

export interface SessionFile {
  app: typeof SESSIONS_APP
  version: 1
  tool: string
  exportedAt: string
  sessions: Session[]
}

export const cleanName = (raw: string) => raw.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME)

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const isStr = (v: unknown): v is string => typeof v === 'string'

/** Whether the data is plain JSON that fits the per-session limit. */
export function dataFits(data: SessionData): boolean {
  try {
    return JSON.stringify(data).length <= MAX_DATA_CHARS
  } catch {
    return false
  }
}

/** "Spring sale", then "Spring sale 2", "Spring sale 3": a name no other session uses. */
export function uniqueName(name: string, taken: string[]): string {
  const base = cleanName(name) || 'Untitled'
  const used = new Set(taken.map((n) => n.toLowerCase()))
  if (!used.has(base.toLowerCase())) return base
  for (let n = 2; n < 1000; n++) {
    const tail = ` ${n}`
    const candidate = base.slice(0, MAX_NAME - tail.length) + tail
    if (!used.has(candidate.toLowerCase())) return candidate
  }
  return base
}

export interface Change {
  list: Session[]
  error: string
}

const fail = (list: Session[], error: string): Change => ({ list, error })

/** Adds a session at the top of the list. */
export function addSession(
  list: Session[],
  name: string,
  data: SessionData,
  now: Date,
  id: string
): Change & { id: string } {
  if (list.length >= MAX_SESSIONS)
    return { ...fail(list, `You can keep ${MAX_SESSIONS} sessions. Delete one first.`), id: '' }
  if (!dataFits(data)) return { ...fail(list, 'This is too big to save.'), id: '' }
  const stamp = now.toISOString()
  const session: Session = {
    id,
    name: uniqueName(
      name,
      list.map((s) => s.name)
    ),
    createdAt: stamp,
    updatedAt: stamp,
    data,
  }
  return { list: [session, ...list], error: '', id }
}

/** Replaces what a session holds, keeping its name. */
export function updateSession(list: Session[], id: string, data: SessionData, now: Date): Change {
  if (!list.some((s) => s.id === id)) return fail(list, 'That session no longer exists.')
  if (!dataFits(data)) return fail(list, 'This is too big to save.')
  return {
    list: list.map((s) => (s.id === id ? { ...s, data, updatedAt: now.toISOString() } : s)),
    error: '',
  }
}

export function renameSession(list: Session[], id: string, name: string, now: Date): Change {
  const target = list.find((s) => s.id === id)
  if (!target) return fail(list, 'That session no longer exists.')
  const others = list.filter((s) => s.id !== id).map((s) => s.name)
  const next = uniqueName(name, others)
  return {
    list: list.map((s) => (s.id === id ? { ...s, name: next, updatedAt: now.toISOString() } : s)),
    error: '',
  }
}

export function duplicateSession(
  list: Session[],
  id: string,
  now: Date,
  newId: string
): Change & { id: string } {
  const source = list.find((s) => s.id === id)
  if (!source) return { ...fail(list, 'That session no longer exists.'), id: '' }
  return addSession(list, `${source.name} copy`, structuredClone(source.data), now, newId)
}

export const removeSession = (list: Session[], id: string): Session[] =>
  list.filter((s) => s.id !== id)

export function toFile(tool: string, sessions: Session[], now: Date): SessionFile {
  return {
    app: SESSIONS_APP,
    version: 1,
    tool,
    exportedAt: now.toISOString(),
    sessions,
  }
}

function asSession(v: unknown): Session | null {
  if (!isObject(v)) return null
  if (!isStr(v.id) || !isStr(v.name) || !isObject(v.data)) return null
  const data = v.data as SessionData
  if (!dataFits(data)) return null
  const stamp = (x: unknown) =>
    isStr(x) && !Number.isNaN(Date.parse(x)) ? x : new Date(0).toISOString()
  return {
    id: v.id.slice(0, 80),
    name: cleanName(v.name) || 'Untitled',
    createdAt: stamp(v.createdAt),
    updatedAt: stamp(v.updatedAt),
    data,
  }
}

/** Reads a sessions file, refusing anything that is not one for this tool. */
export function parseSessionFile(
  text: string,
  tool: string
): { sessions: Session[]; error: string } {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { sessions: [], error: 'That file is not a sessions file.' }
  }
  if (!isObject(raw) || raw.app !== SESSIONS_APP || !Array.isArray(raw.sessions))
    return { sessions: [], error: 'That file is not a sessions file from this site.' }
  if (raw.tool !== tool) return { sessions: [], error: 'That file belongs to a different tool.' }
  const sessions = raw.sessions
    .slice(0, MAX_SESSIONS)
    .map(asSession)
    .filter((s): s is Session => s !== null)
  if (!sessions.length) return { sessions: [], error: 'That file has no sessions in it.' }
  return { sessions, error: '' }
}

/** Adds imported sessions to the list. Names stay unique and ids never collide. */
export function mergeImported(
  list: Session[],
  incoming: Session[],
  newId: () => string
): { list: Session[]; added: number; skipped: number } {
  let out = list
  let added = 0
  for (const s of incoming) {
    if (out.length >= MAX_SESSIONS) break
    const id = out.some((x) => x.id === s.id) ? newId() : s.id
    out = [
      {
        ...s,
        id,
        name: uniqueName(
          s.name,
          out.map((x) => x.name)
        ),
      },
      ...out,
    ]
    added++
  }
  return { list: out, added, skipped: incoming.length - added }
}

/** Reads a string from saved data: wrong type or too long means the fallback. */
export function str(v: unknown, fallback = '', max = 20_000): string {
  return typeof v === 'string' && v.length <= max ? v : fallback
}

/** Reads a number from saved data, kept inside a range; anything else means the fallback. */
export function numIn(v: unknown, min: number, max: number, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : fallback
}

/** Reads a #rrggbb colour from saved data; anything else means the fallback. */
export function hexOr(v: unknown, fallback: string): string {
  return typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v : fallback
}

/** Reads one of a fixed set of values from saved data. */
export function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(v as T) ? (v as T) : fallback
}
