/** Export and import of progress as one JSON file (phone and computer can be merged). Pure. */
import { DEFAULT_SETTINGS, MAX_EVENTS, SCHEMA_VERSION, type Ev, type LeitnerCard, type PersistedState, type Settings } from './types'

export const BACKUP_APP_ID = 'electrical-trainer'

export interface BackupFile {
  app: typeof BACKUP_APP_ID
  schemaVersion: number
  exportedAt: string
  settings: Settings
  events: Ev[]
  leitner: Record<string, LeitnerCard>
}

export function buildBackup(state: Pick<PersistedState, 'settings' | 'events' | 'leitner'>, now = Date.now()): BackupFile {
  return {
    app: BACKUP_APP_ID,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date(now).toISOString(),
    settings: state.settings,
    events: state.events,
    leitner: state.leitner,
  }
}

export type ImportMode = 'merge' | 'replace'
export type ImportResult =
  | { ok: true; settings: Settings; events: Ev[]; leitner: Record<string, LeitnerCard>; added: number }
  | { ok: false; error: string }

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

export function normalizeSettings(raw: unknown): Settings {
  const s = isRecord(raw) ? raw : {}
  const out: Settings = { ...DEFAULT_SETTINGS }
  if (s.edition === '2020' || s.edition === '2023' || s.edition === '2026') out.edition = s.edition
  if (s.bookHints === 'button' || s.bookHints === 'off') out.bookHints = s.bookHints
  if (s.keys === 'hint' || s.keys === 'always') out.keys = s.keys
  if (typeof s.examHints === 'boolean') out.examHints = s.examHints
  if (typeof s.testTimer === 'boolean') out.testTimer = s.testTimer
  if (typeof s.examDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.examDate)) out.examDate = s.examDate
  if (typeof s.seenA2HS === 'boolean') out.seenA2HS = s.seenA2HS
  return out
}

function isEvent(v: unknown): v is Ev {
  return isRecord(v) && typeof v.t === 'string' && ['q', 'line', 'recipe', 'exam', 'drill'].includes(v.t) && typeof v.at === 'number'
}

/** Identity of an event for de-duplication on merge. */
function evKey(e: Ev): string {
  switch (e.t) {
    case 'q': return `q|${e.at}|${e.qid}`
    case 'line': return `l|${e.at}|${e.rid}|${e.seed}|${e.line}`
    case 'recipe': return `r|${e.at}|${e.rid}|${e.seed}`
    case 'exam': return `e|${e.at}|${e.seed}`
    case 'drill': return `d|${e.at}|${e.drill}`
  }
}

export function importBackup(
  text: string,
  current: Pick<PersistedState, 'settings' | 'events' | 'leitner'>,
  mode: ImportMode,
): ImportResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'That file is not a progress backup (it is not JSON).' }
  }
  if (!isRecord(raw) || raw.app !== BACKUP_APP_ID) return { ok: false, error: 'That file is not a backup from this app.' }
  const incoming = Array.isArray(raw.events) ? raw.events.filter(isEvent) : []
  const leitnerIn: Record<string, LeitnerCard> = {}
  if (isRecord(raw.leitner)) {
    for (const [id, c] of Object.entries(raw.leitner)) {
      if (isRecord(c) && typeof c.box === 'number' && c.box >= 1 && c.box <= 5 && typeof c.due === 'number') {
        leitnerIn[id] = { box: c.box as LeitnerCard['box'], due: c.due, ...(typeof c.last === 'number' ? { last: c.last } : {}) }
      }
    }
  }
  if (mode === 'replace') {
    const events = [...incoming].sort((a, b) => a.at - b.at).slice(-MAX_EVENTS)
    return { ok: true, settings: normalizeSettings(raw.settings), events, leitner: leitnerIn, added: events.length }
  }
  const seen = new Set(current.events.map(evKey))
  const fresh: Ev[] = []
  for (const e of incoming) {
    const k = evKey(e)
    if (seen.has(k)) continue
    seen.add(k)
    fresh.push(e)
  }
  const events = [...current.events, ...fresh].sort((a, b) => a.at - b.at).slice(-MAX_EVENTS)
  const leitner = { ...current.leitner }
  for (const [id, c] of Object.entries(leitnerIn)) {
    const mine = leitner[id]
    // Keep the card from the more recent answer: a newer miss (box 1, due now) beats an older
    // box 4 even though its due date is earlier (review 2026-10-16). Older files have no `last`.
    const theirs = c.last ?? 0
    const ours = mine?.last ?? 0
    if (!mine || theirs > ours || (theirs === ours && c.due > mine.due)) leitner[id] = c
  }
  return { ok: true, settings: current.settings, events, leitner, added: fresh.length }
}
