/**
 * Pure selectors over the event log. Everything the Progress screen and the "what next?" hints show is
 * derived here, so it can be tested without React.
 */
import type { CoachMode, FadeLevel, TopicId } from '@/shared/types'
import { BOX_DAYS, type Ev, type ExamEv, type LeitnerCard, type QuestionEv, type RecipeEv } from './types'
import { dayKey, daysBetweenKeys, startOfIsoWeek } from './time'


// ---------------------------------------------------------------------------------------------
// Leitner boxes
// ---------------------------------------------------------------------------------------------

/**
 * Right moves a card up one box (a first right answer starts in box 2, back tomorrow, so Review does
 * not re-ask what he just practised); wrong, or a hinted right in review, sends it back to box 1.
 */
export function leitnerAfter(card: LeitnerCard | undefined, correct: boolean, now: number, hinted = false): LeitnerCard {
  const box = (correct && !hinted ? Math.min(5, (card?.box ?? 1) + 1) : 1) as LeitnerCard['box']
  // Due at the start of the target calendar day, so "back tomorrow" is due all of tomorrow, not from
  // the same clock time (review 2026-10-16). Box 1 is due right away.
  const days = BOX_DAYS[box]
  const d = new Date(now)
  const due = days === 0 ? now : new Date(d.getFullYear(), d.getMonth(), d.getDate() + days).getTime()
  return { box, due, last: now }
}

export function dueQuestionIds(leitner: Record<string, LeitnerCard>, now: number): string[] {
  return Object.entries(leitner)
    .filter(([, c]) => c.due <= now)
    .sort((a, b) => a[1].box - b[1].box || a[1].due - b[1].due)
    .map(([id]) => id)
}

// ---------------------------------------------------------------------------------------------
// Fact topics
// ---------------------------------------------------------------------------------------------

export interface TopicStat {
  topic: TopicId
  asked: number
  right: number
  /** Percent right over the last 30 answers (null before any). */
  recentPct: number | null
  hinted: number
  lastAt?: number
}

export function topicStats(events: readonly Ev[], topics: readonly TopicId[]): TopicStat[] {
  const by = new Map<TopicId, QuestionEv[]>()
  for (const e of events) {
    // Find-it rounds train navigation; they are not the topic's questions.
    if (e.t !== 'q' || e.mode === 'find') continue
    const list = by.get(e.topic) ?? []
    list.push(e)
    by.set(e.topic, list)
  }
  return topics.map((topic) => {
    const list = by.get(topic) ?? []
    const recent = list.slice(-30)
    return {
      topic,
      asked: list.length,
      right: list.filter((e) => e.correct).length,
      recentPct: recent.length ? Math.round((recent.filter((e) => e.correct).length / recent.length) * 100) : null,
      hinted: list.filter((e) => e.hint > 0).length,
      lastAt: list[list.length - 1]?.at,
    }
  })
}

/** Question ids he has answered (for "avoid recently seen" in the exam builder). */
export function seenQuestionIds(events: readonly Ev[], sinceMs: number): Set<string> {
  const s = new Set<string>()
  for (const e of events) if (e.t === 'q' && e.mode !== 'find' && e.at >= sinceMs) s.add(e.qid)
  return s
}

// ---------------------------------------------------------------------------------------------
// Recipes: the stage he is at, and the fading
// ---------------------------------------------------------------------------------------------

const MODE_ORDER: CoachMode[] = ['show', 'coach', 'paper', 'test']
const CLEAN_NEEDED: Record<CoachMode, number> = { show: 1, coach: 2, paper: 2, test: 2 }

/** Was this run good enough to count toward moving on? */
export function isClean(e: RecipeEv): boolean {
  switch (e.mode) {
    case 'show':
      return !e.checkpoints || e.checkpoints.asked === 0 || e.checkpoints.right * 2 >= e.checkpoints.asked
    case 'coach':
    case 'paper':
      return e.revealed === 0 && e.lines > 0 && e.firstTry / e.lines >= 0.8
    case 'test':
      return e.pickedCorrect === true
  }
}

export interface RecipeStage {
  /** The mode the app suggests next. */
  suggested: CoachMode
  /** Clean runs in that mode so far, and how many move him on. */
  clean: number
  needed: number
  /** Test-mode record. */
  testRight: number
  testAsked: number
  runs: number
  lastAt?: number
  /** True once he has two clean Test-me runs in a row: "exam ready" for this recipe. */
  mastered: boolean
}

export function recipeStage(events: readonly Ev[], rid: string): RecipeStage {
  let stage: CoachMode = 'show'
  let clean = 0
  let testRight = 0
  let testAsked = 0
  let runs = 0
  let lastAt: number | undefined
  let mastered = false
  for (const e of events) {
    if (e.t !== 'recipe' || e.rid !== rid) continue
    runs++
    lastAt = e.at
    if (e.mode === 'test') {
      testAsked++
      if (e.pickedCorrect) testRight++
    }
    const at = MODE_ORDER.indexOf(e.mode)
    const cur = MODE_ORDER.indexOf(stage)
    if (e.mode === 'test' && !e.pickedCorrect) {
      // A missed exam-style question sends him back to the paper stage, if he was past it; it never
      // moves him forward (review 2026-10-16).
      if (cur >= MODE_ORDER.indexOf('paper')) stage = 'paper'
      if (at === cur || cur >= MODE_ORDER.indexOf('paper')) clean = 0
      mastered = false
      continue
    }
    if (at < cur) continue
    if (!isClean(e)) {
      // The clean runs that move him on must come in a row.
      if (at === cur) {
        clean = 0
        if (stage === 'test') mastered = false
      }
      continue
    }
    if (at > cur) {
      stage = e.mode
      clean = 1
    } else {
      clean = Math.min(clean + 1, CLEAN_NEEDED[stage])
    }
    if (clean >= CLEAN_NEEDED[stage]) {
      if (stage === 'test') mastered = true
      else {
        stage = MODE_ORDER[MODE_ORDER.indexOf(stage) + 1] ?? 'test'
        clean = 0
      }
    }
  }
  return { suggested: stage, clean, needed: CLEAN_NEEDED[stage], testRight, testAsked, runs, lastAt, mastered }
}

/** Coach fading: instructions shown until one clean coach run, then label only. */
export function fadeFor(events: readonly Ev[], rid: string): FadeLevel {
  for (const e of events) if (e.t === 'recipe' && e.rid === rid && e.mode === 'coach' && isClean(e)) return 2
  return 1
}

// ---------------------------------------------------------------------------------------------
// Mistakes: what he gets wrong most, and whether it is getting better
// ---------------------------------------------------------------------------------------------

export interface MistakeCount {
  id: string
  total: number
  thisWeek: number
  lastWeek: number
  lastAt: number
}

export function mistakeCounts(events: readonly Ev[], now: number): MistakeCount[] {
  const weekStart = startOfIsoWeek(now)
  // A calendar week back, not 7 × 24 h: a week with a daylight-saving change is 167 or 169 hours.
  const ws = new Date(weekStart)
  const lastWeekStart = new Date(ws.getFullYear(), ws.getMonth(), ws.getDate() - 7).getTime()
  const by = new Map<string, MistakeCount>()
  for (const e of events) {
    const id = e.t === 'line' && !e.ok ? e.mistake : e.t === 'recipe' && e.mode === 'test' && !e.pickedCorrect ? e.mistake : undefined
    if (!id || id === 'unknown') continue
    const m = by.get(id) ?? { id, total: 0, thisWeek: 0, lastWeek: 0, lastAt: 0 }
    m.total++
    if (e.at >= weekStart) m.thisWeek++
    else if (e.at >= lastWeekStart) m.lastWeek++
    m.lastAt = Math.max(m.lastAt, e.at)
    by.set(id, m)
  }
  return [...by.values()].sort((a, b) => b.total - a.total || b.lastAt - a.lastAt)
}

// ---------------------------------------------------------------------------------------------
// Exams, streak, readiness
// ---------------------------------------------------------------------------------------------

export function examHistory(events: readonly Ev[]): ExamEv[] {
  return events.filter((e): e is ExamEv => e.t === 'exam')
}

/** Consecutive days, ending today or yesterday, with any study. */
export function streakDays(events: readonly Ev[], now: number): number {
  const days = new Set(events.map((e) => dayKey(e.at)))
  const today = new Date(now)
  let key = dayKey(now)
  // Yesterday by the calendar, not now − 24 h (wrong on the two daylight-saving days).
  if (!days.has(key)) key = dayKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1).getTime())
  let n = 0
  while (days.has(key)) {
    n++
    const [y, m, d] = key.split('-').map(Number)
    key = dayKey(new Date(y ?? 0, (m ?? 1) - 1, (d ?? 1) - 1).getTime())
  }
  return n
}

/** Days from today to the exam date (negative when past); null without a date. */
export function daysToExam(examDate: string | undefined, now: number): number | null {
  if (!examDate || !/^\d{4}-\d{2}-\d{2}$/.test(examDate)) return null
  return daysBetweenKeys(dayKey(now), examDate)
}
