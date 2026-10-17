/**
 * Store shapes (localStorage keys `et.*`). Types and defaults only.
 * Progress is an append-only event log; everything on the Progress screen is derived from it.
 */
import type { CoachMode, NecEdition, TopicId } from '@/shared/types'
import type { ExamPaper } from '@/content'

export const SCHEMA_VERSION = 1

// ---------------------------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------------------------

export interface Settings {
  /** The NEC edition his exam uses (2020 today). */
  edition: NecEdition
  /** Codebook-location hints in practice: 'button' = one tap away, 'off' = hidden. */
  bookHints: 'button' | 'off'
  /** Calculator keystrokes on worksheet lines: 'hint' = a hint rung (default), 'always' = shown. */
  keys: 'hint' | 'always'
  /** Codebook hints in the exam simulator (off = real exam conditions). */
  examHints: boolean
  /** A per-question timer in Test-me mode (exam pace: about 2.7 minutes a question). */
  testTimer: boolean
  /** Optional exam date, 'YYYY-MM-DD', for the countdown on Home. */
  examDate?: string
  seenA2HS: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  edition: '2020',
  bookHints: 'button',
  keys: 'hint',
  examHints: false,
  testTimer: false,
  seenA2HS: false,
}

// ---------------------------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------------------------

/** Where a fact question was answered. */
export type QuestionMode = 'practice' | 'review' | 'exam' | 'find'

/** A fact question answered. `hint` is the highest book-hint rung he opened (0 = none). */
export interface QuestionEv {
  t: 'q'
  at: number
  qid: string
  topic: TopicId
  pick: number
  correct: boolean
  hint: 0 | 1 | 2 | 3
  ms: number
  mode: QuestionMode
}

/** One check of one worksheet line. Unreadable input is never logged. */
export interface LineEv {
  t: 'line'
  at: number
  rid: string
  seed: number
  line: string
  ok: boolean
  /** Mistake catalog id when wrong. */
  mistake?: string
  mode: CoachMode
  /** The line was shown by the last hint rung, not worked. */
  revealed?: boolean
}

/** A worksheet (or a Test-me question) finished. */
export interface RecipeEv {
  t: 'recipe'
  at: number
  rid: string
  seed: number
  mode: CoachMode
  /** Lines (or bucket totals in paper mode) he had to enter, right first time, and revealed. */
  lines: number
  firstTry: number
  revealed: number
  hints: number
  /** Show mode: checkpoints predicted right / asked. */
  checkpoints?: { right: number; asked: number }
  /** Test mode: whether the picked option was right, and the mistake behind a wrong pick. */
  pickedCorrect?: boolean
  mistake?: string
  ms: number
}

export interface ExamEv {
  t: 'exam'
  at: number
  seed: number
  size: 'full' | 'short'
  pct: number
  passed: boolean
  byTopic: { topic: TopicId; right: number; asked: number }[]
  ms: number
  hints: boolean
}

/** A number-drill or find-it round. */
export interface DrillEv {
  t: 'drill'
  at: number
  drill: string
  right: number
  total: number
  ms: number
}

export type Ev = QuestionEv | LineEv | RecipeEv | ExamEv | DrillEv

/** Oldest events are dropped beyond this (years of daily study fit well under it). */
export const MAX_EVENTS = 40_000

// ---------------------------------------------------------------------------------------------
// Spaced review (Leitner boxes) for fact questions
// ---------------------------------------------------------------------------------------------

export interface LeitnerCard {
  /** 1 (new or missed) .. 5 (solid). */
  box: 1 | 2 | 3 | 4 | 5
  /** Epoch ms when it is due again. */
  due: number
}

/** Days until a card in each box comes back. */
export const BOX_DAYS: Record<LeitnerCard['box'], number> = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 16 }

// ---------------------------------------------------------------------------------------------
// The exam in progress (kept so a reload or a phone call does not lose it)
// ---------------------------------------------------------------------------------------------

export interface ExamSession {
  paper: ExamPaper
  answers: (number | null)[]
  flags: boolean[]
  /** Highest book-hint rung opened per item (only when hints are on). */
  hints: (0 | 1 | 2 | 3)[]
  hintsOn: boolean
  startedAt: number
  /**
   * Milliseconds used so far. The clock runs only while the exam screen is open (he may pause for a
   * phone call; the results say how long it really took).
   */
  elapsedMs: number
  current: number
}

// ---------------------------------------------------------------------------------------------
// Persisted state
// ---------------------------------------------------------------------------------------------

export interface Meta {
  schemaVersion: number
  createdAt: string
  lastBackupAt?: string
}

/** The last finished exam, kept for the results and review screens. */
export interface FinishedExam {
  paper: ExamPaper
  answers: (number | null)[]
  flags: boolean[]
  finishedAt: number
  elapsedMs: number
  hintsOn: boolean
}

export interface PersistedState {
  meta: Meta
  settings: Settings
  events: Ev[]
  leitner: Record<string, LeitnerCard>
  exam: ExamSession | null
  lastExam: FinishedExam | null
}

export type PersistedSlice = keyof PersistedState

export function defaultPersisted(now = Date.now()): PersistedState {
  return {
    meta: { schemaVersion: SCHEMA_VERSION, createdAt: new Date(now).toISOString() },
    settings: { ...DEFAULT_SETTINGS },
    events: [],
    leitner: {},
    exam: null,
    lastExam: null,
  }
}
