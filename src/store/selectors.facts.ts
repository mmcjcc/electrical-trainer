/**
 * Pure selectors for the fact side (Part 1) and the Home screen: what to practise next, the
 * "Today" plan, readiness by blueprint topic. Inputs are plain data (questions, topics, recipes are
 * passed in), so the tests need no content mocks. SHELL UI builder.
 */
import { makeRng } from '@/calc'
import type { Question, Recipe, TopicId } from '@/shared/types'
import { dueQuestionIds, recipeStage, type RecipeStage } from './selectors'
import type { DrillEv, Ev, LeitnerCard, QuestionEv } from './types'

/** The parts of a blueprint topic these selectors read (content/blueprint.ts `Topic`). */
export interface TopicLike {
  id: TopicId
  title: string
  questions: number
  points: number
  offExam?: boolean
}

// ---------------------------------------------------------------------------------------------
// Per-question record
// ---------------------------------------------------------------------------------------------

export interface QuestionRecord {
  asked: number
  right: number
  lastCorrect: boolean
  lastAt: number
}

/** Every fact question he has answered, by id (practice, review and exam answers alike). */
export function questionRecords(events: readonly Ev[]): Map<string, QuestionRecord> {
  const out = new Map<string, QuestionRecord>()
  for (const e of events) {
    if (e.t !== 'q' || e.mode === 'find') continue
    const r = out.get(e.qid) ?? { asked: 0, right: 0, lastCorrect: false, lastAt: 0 }
    r.asked++
    if (e.correct) r.right++
    if (e.at >= r.lastAt) {
      r.lastAt = e.at
      r.lastCorrect = e.correct
    }
    out.set(e.qid, r)
  }
  return out
}

/** Lower is weaker: missed last time first, then lower accuracy, then the longest since seen. */
function weakness(r: QuestionRecord): [number, number, number] {
  return [r.lastCorrect ? 1 : 0, r.right / r.asked, r.lastAt]
}

function compareWeakness(a: QuestionRecord, b: QuestionRecord): number {
  const wa = weakness(a)
  const wb = weakness(b)
  return wa[0] - wb[0] || wa[1] - wb[1] || wa[2] - wb[2]
}

/**
 * A practice session: up to `n` distinct question ids from `pool`. Questions he has never answered
 * come first (in a seeded random order), then the ones he is weakest on. Never repeats an id.
 */
export function pickPractice(pool: readonly Question[], events: readonly Ev[], opts: { n?: number; seed: number }): string[] {
  const n = opts.n ?? 10
  const rng = makeRng(opts.seed)
  const records = questionRecords(events)
  const ids = [...new Set(pool.map((q) => q.id))]
  const unseen = rng.shuffle(ids.filter((id) => !records.has(id)))
  const seen = rng
    .shuffle(ids.filter((id) => records.has(id)))
    .sort((a, b) => compareWeakness(records.get(a) as QuestionRecord, records.get(b) as QuestionRecord))
  return [...unseen, ...seen].slice(0, n)
}

/** Due review ids that still exist in `pool` (a retired question, or another edition's, is skipped). */
export function dueInPool(leitner: Record<string, LeitnerCard>, pool: readonly Question[], now: number): string[] {
  const have = new Set(pool.map((q) => q.id))
  return dueQuestionIds(leitner, now).filter((id) => have.has(id))
}

// ---------------------------------------------------------------------------------------------
// Readiness by blueprint topic
// ---------------------------------------------------------------------------------------------

export interface TopicReadiness {
  topic: TopicId
  title: string
  /** Points this area carries on the full exam (questions × points each). */
  points: number
  /** Percent right over his last 30 answers in this area (null before any). */
  pct: number | null
  /** How many answers the percent is based on (up to 30). */
  basedOn: number
}

export interface Readiness {
  rows: TopicReadiness[]
  /** Points he would earn at his recent rates, over the areas he has tried (null before any). */
  estimate: number | null
  /** Exam points covered by the areas he has tried. */
  coveredPoints: number
  totalPoints: number
}

const RECENT = 30

/**
 * Recent accuracy per exam area. Fact questions count for their topic; Test-me runs (and exam
 * answers recorded as Test-me) count for the recipe's topic, so Calculations has a number too.
 */
export function readiness(
  events: readonly Ev[],
  topics: readonly TopicLike[],
  recipes: readonly Pick<Recipe, 'id' | 'topic'>[],
): Readiness {
  const recipeTopic = new Map(recipes.map((r) => [r.id, r.topic]))
  const results = new Map<TopicId, boolean[]>()
  for (const e of events) {
    let topic: TopicId | undefined
    let ok: boolean | undefined
    if (e.t === 'q' && e.mode !== 'find') {
      topic = e.topic
      ok = e.correct
    } else if (e.t === 'recipe' && e.mode === 'test') {
      topic = recipeTopic.get(e.rid)
      ok = e.pickedCorrect === true
    }
    if (topic === undefined || ok === undefined) continue
    const list = results.get(topic) ?? []
    list.push(ok)
    results.set(topic, list)
  }
  const rows = topics
    .filter((t) => !t.offExam)
    .map((t): TopicReadiness => {
      const recent = (results.get(t.id) ?? []).slice(-RECENT)
      return {
        topic: t.id,
        title: t.title,
        points: t.questions * t.points,
        pct: recent.length ? Math.round((recent.filter(Boolean).length / recent.length) * 100) : null,
        basedOn: recent.length,
      }
    })
  const tried = rows.filter((r) => r.pct !== null)
  const coveredPoints = tried.reduce((a, r) => a + r.points, 0)
  const estimate = tried.length ? Math.round(tried.reduce((a, r) => a + (r.points * (r.pct as number)) / 100, 0)) : null
  return { rows, estimate, coveredPoints, totalPoints: rows.reduce((a, r) => a + r.points, 0) }
}

// ---------------------------------------------------------------------------------------------
// The "Today" plan on Home
// ---------------------------------------------------------------------------------------------

export type TodayStep =
  | { kind: 'review'; due: number }
  | { kind: 'topic'; topic: TopicId; title: string; pct: number | null; points: number; available: number }
  | { kind: 'recipe'; recipeId: string; title: string; stage: RecipeStage; started: boolean }

export interface TodayInput {
  events: readonly Ev[]
  leitner: Record<string, LeitnerCard>
  now: number
  /** The bank for his edition. */
  questions: readonly Question[]
  topics: readonly TopicLike[]
  /** Recipes in the order the Math home lists them (load calcs first). */
  recipes: readonly Pick<Recipe, 'id' | 'title' | 'topic'>[]
}

/**
 * A short mixed session: due reviews first, then the area where he stands to gain the most points
 * (exam points × the share he is missing; an untried area counts as 50%), then the recipe he is
 * part-way through (or the next one to start). Steps with nothing to offer are left out.
 */
export function todayPlan(input: TodayInput): TodayStep[] {
  const { events, leitner, now, questions, topics, recipes } = input
  const steps: TodayStep[] = []

  const due = dueInPool(leitner, questions, now).length
  if (due > 0) steps.push({ kind: 'review', due })

  const ready = readiness(events, topics, recipes)
  const available = new Map<TopicId, number>()
  for (const q of questions) available.set(q.topic, (available.get(q.topic) ?? 0) + 1)
  const candidates = ready.rows
    .filter((r) => r.topic !== 'calculations' && (available.get(r.topic) ?? 0) > 0)
    .map((r) => ({ r, loss: r.points * (1 - (r.pct ?? 50) / 100) }))
    .sort((a, b) => b.loss - a.loss || b.r.points - a.r.points)
  const weakest = candidates[0]
  if (weakest) {
    steps.push({
      kind: 'topic',
      topic: weakest.r.topic,
      title: weakest.r.title,
      pct: weakest.r.pct,
      points: weakest.r.points,
      available: available.get(weakest.r.topic) ?? 0,
    })
  }

  const step = nextRecipe(events, recipes)
  if (step) steps.push(step)
  return steps
}

/** The recipe he worked most recently and has not mastered; else the first one not started; else the stalest. */
export function nextRecipe(events: readonly Ev[], recipes: readonly Pick<Recipe, 'id' | 'title'>[]): Extract<TodayStep, { kind: 'recipe' }> | null {
  const staged = recipes.map((r) => ({ r, stage: recipeStage(events, r.id) }))
  const midway = staged
    .filter((x) => x.stage.runs > 0 && !x.stage.mastered)
    .sort((a, b) => (b.stage.lastAt ?? 0) - (a.stage.lastAt ?? 0))[0]
  if (midway) return { kind: 'recipe', recipeId: midway.r.id, title: midway.r.title, stage: midway.stage, started: true }
  const fresh = staged.find((x) => x.stage.runs === 0)
  if (fresh) return { kind: 'recipe', recipeId: fresh.r.id, title: fresh.r.title, stage: fresh.stage, started: false }
  const stale = [...staged].sort((a, b) => (a.stage.lastAt ?? 0) - (b.stage.lastAt ?? 0))[0]
  return stale ? { kind: 'recipe', recipeId: stale.r.id, title: stale.r.title, stage: stale.stage, started: true } : null
}

// ---------------------------------------------------------------------------------------------
// Small helpers for the fact screens
// ---------------------------------------------------------------------------------------------

/** Questions available per topic. */
export function countByTopic(questions: readonly Question[]): Map<TopicId, number> {
  const m = new Map<TopicId, number>()
  for (const q of questions) m.set(q.topic, (m.get(q.topic) ?? 0) + 1)
  return m
}

/** Rounds of one drill, oldest first. */
export function drillRounds(events: readonly Ev[], drill: string): DrillEv[] {
  return events.filter((e): e is DrillEv => e.t === 'drill' && e.drill === drill)
}

/** One session's tally, from the answers it logged. */
export function sessionTally(answers: readonly Pick<QuestionEv, 'correct' | 'hint'>[]): { right: number; total: number; hinted: number } {
  return {
    right: answers.filter((a) => a.correct).length,
    total: answers.length,
    hinted: answers.filter((a) => a.hint > 0).length,
  }
}
