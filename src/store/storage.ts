/**
 * localStorage adapter (from the Math app): one `et.*` key per persisted slice, every read and write
 * in try/catch. The in-memory store keeps working when storage is unavailable (private mode, quota).
 */
import type { PersistStorage, StorageValue } from 'zustand/middleware'
import { SCHEMA_VERSION, type PersistedSlice, type PersistedState } from './types'

export const STORAGE_KEYS: Record<PersistedSlice, string> = {
  meta: 'et.meta',
  settings: 'et.settings',
  events: 'et.events',
  leitner: 'et.leitner',
  exam: 'et.exam',
  lastExam: 'et.lastExam',
}

export const SLICES = Object.keys(STORAGE_KEYS) as PersistedSlice[]
export const PERSIST_NAME = 'et'

function getStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null
    const s = window.localStorage
    void s.length
    return s
  } catch {
    return null
  }
}

export function safeRead<T>(key: string): T | undefined {
  try {
    const raw = getStorage()?.getItem(key)
    if (raw == null) return undefined
    return JSON.parse(raw) as T
  } catch {
    return undefined
  }
}

export function safeWrite(key: string, value: unknown): boolean {
  try {
    const s = getStorage()
    if (!s) return false
    s.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function safeRemove(key: string): boolean {
  try {
    const s = getStorage()
    if (!s) return false
    s.removeItem(key)
    return true
  } catch {
    return false
  }
}

/** Writes only the slices whose reference changed, so typing never re-serializes the event log. */
export function createFanOutStorage(onError?: (failedKeys: string[]) => void): PersistStorage<PersistedState> & { reset: () => void } {
  let lastWritten: Partial<Record<PersistedSlice, unknown>> = {}
  return {
    getItem: (): StorageValue<PersistedState> | null => {
      const partial: Partial<PersistedState> = {}
      let any = false
      for (const slice of SLICES) {
        const key = STORAGE_KEYS[slice]
        const v = safeRead<unknown>(key)
        if (v !== undefined) {
          any = true
          ;(partial as Record<string, unknown>)[slice] = v
        } else {
          // A key that exists but does not parse is kept aside before the slice is written again, so
          // a damaged log is never silently replaced by an empty one (review 2026-10-16).
          try {
            const raw = window.localStorage.getItem(key)
            if (raw != null && window.localStorage.getItem(`${key}.corrupt`) == null) {
              window.localStorage.setItem(`${key}.corrupt`, raw)
              onError?.([key])
            }
          } catch {
            /* storage unavailable: nothing to keep */
          }
        }
      }
      if (!any) return null
      const version = (partial.meta as { schemaVersion?: number } | undefined)?.schemaVersion ?? SCHEMA_VERSION
      lastWritten = { ...partial }
      return { state: partial as PersistedState, version }
    },
    setItem: (_name, value): void => {
      const failed: string[] = []
      for (const slice of SLICES) {
        const v = value.state[slice]
        if (v === lastWritten[slice]) continue
        const ok = v === undefined || v === null ? safeRemove(STORAGE_KEYS[slice]) : safeWrite(STORAGE_KEYS[slice], v)
        if (ok) lastWritten[slice] = v
        else failed.push(STORAGE_KEYS[slice])
      }
      if (failed.length && onError) onError(failed)
    },
    removeItem: (): void => {
      for (const slice of SLICES) safeRemove(STORAGE_KEYS[slice])
      lastWritten = {}
    },
    reset: () => {
      lastWritten = {}
    },
  }
}
