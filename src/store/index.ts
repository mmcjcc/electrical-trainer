/**
 * App store: Zustand + persist, fanned out into `et.*` localStorage keys (./storage.ts).
 * Persisted: meta, settings, events (append-only), leitner, exam (in progress).
 * Transient: toasts, storageOk.
 *
 * Pages call the actions below; they never write the event log directly. Derived numbers come from
 * the pure selectors in ./selectors.ts (UI builders may add selector files of their own next to it).
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ExamPaper } from '@/content'
import { buildBackup, importBackup, normalizeSettings, type ImportMode } from './backup'
import { leitnerAfter } from './selectors'
import { createFanOutStorage, PERSIST_NAME } from './storage'
import {
  MAX_EVENTS, SCHEMA_VERSION, defaultPersisted,
  type DrillEv, type Ev, type ExamEv, type ExamSession, type LineEv, type PersistedState, type QuestionEv,
  type RecipeEv, type Settings,
} from './types'

export * from './types'
export * from './selectors'
export * from './selectors.facts'
export * from './selectors.math'
export { dayKey, relativeDays, daysAgo } from './time'
export type { ImportMode } from './backup'

export type ToastTone = 'info' | 'ok' | 'bad'
export interface ToastItem {
  id: number
  message: string
  tone: ToastTone
}

/** An event as a page hands it in: the store stamps the time. */
type In<E extends Ev> = Omit<E, 't' | 'at'> & { at?: number }

interface Actions {
  setSettings: (patch: Partial<Settings>) => void
  /** A fact question answered (practice, review, find-it, or an exam item once the exam is scored). */
  answerQuestion: (e: In<QuestionEv>) => void
  /** One worksheet line checked (right or a diagnosed wrong; never unreadable input). */
  logLine: (e: In<LineEv>) => void
  /** A worksheet or Test-me question finished. */
  finishRecipe: (e: In<RecipeEv>) => void
  logDrill: (e: In<DrillEv>) => void
  // ---- the exam simulator ----
  startExam: (paper: ExamPaper, hintsOn: boolean, now?: number) => void
  answerExam: (index: number, pick: number | null) => void
  flagExam: (index: number, flagged: boolean) => void
  hintExam: (index: number, rung: 1 | 2 | 3) => void
  gotoExam: (index: number) => void
  /** Adds active time (the exam page ticks while open). */
  tickExam: (ms: number) => void
  /** Records the exam event (and one question event per bank item, for topic stats and review). */
  finishExam: (
    result: Omit<ExamEv, 't' | 'at' | 'seed' | 'size' | 'ms' | 'hints'>,
    perItem: In<QuestionEv>[],
    now?: number,
    /** The calculation items, recorded as Test-me runs so the recipe's stage and his calc record count them. */
    perCalc?: In<RecipeEv>[],
  ) => void
  abandonExam: () => void
  // ---- toasts and maintenance ----
  toast: (message: string, tone?: ToastTone) => void
  dismissToast: (id: number) => void
  exportJson: (now?: number) => string
  importJson: (text: string, mode: ImportMode) => { ok: true; added: number } | { ok: false; error: string }
  resetProgress: () => void
}

interface Transient {
  toasts: ToastItem[]
  storageOk: boolean
}

export type StoreState = PersistedState & Transient & Actions

let toastSeq = 0

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isEvent(v: unknown): v is Ev {
  return isRecord(v) && typeof v.at === 'number' && ['q', 'line', 'recipe', 'exam', 'drill'].includes(String(v.t))
}

/** An exam session whose arrays all match its paper (a damaged one is dropped, not half-used). */
function validExam(v: unknown): v is ExamSession {
  if (!isRecord(v) || !isRecord(v.paper) || !Array.isArray(v.paper.items)) return false
  const n = v.paper.items.length
  return (
    Array.isArray(v.answers) && v.answers.length === n && Array.isArray(v.flags) && v.flags.length === n &&
    Array.isArray(v.hints) && v.hints.length === n && typeof v.current === 'number' && v.current >= 0 &&
    (n === 0 || v.current < n) && typeof v.elapsedMs === 'number'
  )
}

function validFinished(v: unknown): v is NonNullable<PersistedState['lastExam']> {
  return isRecord(v) && isRecord(v.paper) && Array.isArray(v.paper.items) && Array.isArray(v.answers) &&
    v.answers.length === v.paper.items.length
}

function append(events: Ev[], more: Ev[]): Ev[] {
  const next = events.concat(more)
  return next.length > MAX_EVENTS ? next.slice(next.length - MAX_EVENTS) : next
}

// Flag a storage failure once: setting the flag is itself a state change the persist layer tries to
// write, so an unconditional set would loop forever where storage is unavailable.
const storage = createFanOutStorage(() => {
  if (useStore.getState().storageOk) useStore.setState({ storageOk: false })
})

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...defaultPersisted(),
      toasts: [],
      storageOk: true,

      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      answerQuestion: (e) => {
        const at = e.at ?? Date.now()
        const ev: QuestionEv = { ...e, t: 'q', at }
        set((s) => ({
          events: append(s.events, [ev]),
          // Find-it rounds train navigation; they do not move a question's review box.
          leitner: e.mode === 'find' ? s.leitner : { ...s.leitner, [e.qid]: leitnerAfter(s.leitner[e.qid], e.correct, at, e.hint > 0 && e.mode === 'review') },
        }))
      },

      logLine: (e) => set((s) => ({ events: append(s.events, [{ ...e, t: 'line', at: e.at ?? Date.now() }]) })),
      finishRecipe: (e) => set((s) => ({ events: append(s.events, [{ ...e, t: 'recipe', at: e.at ?? Date.now() }]) })),
      logDrill: (e) => set((s) => ({ events: append(s.events, [{ ...e, t: 'drill', at: e.at ?? Date.now() }]) })),

      startExam: (paper, hintsOn, now = Date.now()) => {
        const n = paper.items.length
        const exam: ExamSession = {
          paper, hintsOn, startedAt: now, elapsedMs: 0, current: 0,
          answers: Array.from({ length: n }, () => null),
          flags: Array.from({ length: n }, () => false),
          hints: Array.from({ length: n }, () => 0 as const),
        }
        set({ exam })
      },
      answerExam: (index, pick) => set((s) => (s.exam ? { exam: { ...s.exam, answers: s.exam.answers.map((a, i) => (i === index ? pick : a)) } } : {})),
      flagExam: (index, flagged) => set((s) => (s.exam ? { exam: { ...s.exam, flags: s.exam.flags.map((f, i) => (i === index ? flagged : f)) } } : {})),
      hintExam: (index, rung) =>
        set((s) => (s.exam ? { exam: { ...s.exam, hints: s.exam.hints.map((h, i) => (i === index ? (Math.max(h, rung) as 0 | 1 | 2 | 3) : h)) } } : {})),
      gotoExam: (index) => set((s) => (s.exam && s.exam.answers.length > 0 ? { exam: { ...s.exam, current: Math.max(0, Math.min(index, s.exam.answers.length - 1)) } } : {})),
      tickExam: (ms) => set((s) => (s.exam ? { exam: { ...s.exam, elapsedMs: s.exam.elapsedMs + ms } } : {})),
      finishExam: (result, perItem, now = Date.now(), perCalc = []) => {
        const exam = get().exam
        if (!exam) return
        const ev: ExamEv = {
          ...result, t: 'exam', at: now, seed: exam.paper.seed, size: exam.paper.size, ms: exam.elapsedMs, hints: exam.hintsOn,
        }
        const qs: QuestionEv[] = perItem.map((q) => ({ ...q, t: 'q', at: q.at ?? now, mode: 'exam' }))
        const calcs: RecipeEv[] = perCalc.map((r) => ({ ...r, t: 'recipe', at: r.at ?? now, mode: 'test' }))
        set((s) => {
          const leitner = { ...s.leitner }
          for (const q of qs) leitner[q.qid] = leitnerAfter(leitner[q.qid], q.correct, now, q.hint > 0)
          const lastExam = { paper: exam.paper, answers: exam.answers, flags: exam.flags, finishedAt: now, elapsedMs: exam.elapsedMs, hintsOn: exam.hintsOn }
          return { events: append(s.events, [...qs, ...calcs, ev]), leitner, exam: null, lastExam }
        })
      },
      abandonExam: () => set({ exam: null }),

      toast: (message, tone = 'info') => {
        const id = ++toastSeq
        set((s) => ({ toasts: [...s.toasts.slice(-2), { id, message, tone }] }))
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      exportJson: (now = Date.now()) => {
        const s = get()
        set({ meta: { ...s.meta, lastBackupAt: new Date(now).toISOString() } })
        return JSON.stringify(buildBackup(s, now), null, 1)
      },
      importJson: (text, mode) => {
        const r = importBackup(text, get(), mode)
        if (!r.ok) return r
        // Replacing progress also drops an exam in progress and the last results (they belong to the old data).
        set(mode === 'replace' ? { settings: r.settings, events: r.events, leitner: r.leitner, exam: null, lastExam: null } : { settings: r.settings, events: r.events, leitner: r.leitner })
        return { ok: true, added: r.added }
      },
      resetProgress: () => set((s) => ({ ...defaultPersisted(), settings: s.settings })),
    }),
    {
      name: PERSIST_NAME,
      version: SCHEMA_VERSION,
      storage,
      partialize: (s): PersistedState => ({ meta: s.meta, settings: s.settings, events: s.events, leitner: s.leitner, exam: s.exam, lastExam: s.lastExam }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<PersistedState>
        return {
          ...current,
          meta: p.meta && typeof p.meta === 'object' ? p.meta : current.meta,
          settings: normalizeSettings(p.settings),
          events: Array.isArray(p.events) ? p.events.filter(isEvent) : [],
          leitner: p.leitner && typeof p.leitner === 'object' && !Array.isArray(p.leitner) ? p.leitner : {},
          exam: validExam(p.exam) ? p.exam : null,
          lastExam: validFinished(p.lastExam) ? p.lastExam : null,
        }
      },
    },
  ),
)
