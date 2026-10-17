/**
 * Assembling and scoring a simulated exam that follows the bulletin's blueprint (content/blueprint.ts).
 * Calculation items are generated problems in Test-me form, so no two exams are alike. Pure.
 */
import { makeRng } from '@/calc'
import type { NecEdition, TopicId } from '@/shared/types'
import { allQuestions, getQuestion } from './bank'
import { EXAM, EXAM_TOPICS, topic } from './blueprint'
import { getRecipe, listRecipes } from './recipes'

export type ExamItem =
  | { kind: 'question'; topic: TopicId; questionId: string }
  | { kind: 'calc'; topic: TopicId; recipeId: string; seed: number }

export interface ExamPaper {
  seed: number
  edition: NecEdition
  /** 'full' follows the bulletin; 'short' is a third of it (30 items, 80 minutes). */
  size: 'full' | 'short'
  minutes: number
  items: ExamItem[]
  /** Topics the bank could not fill completely (shown to him, so a thin bank is never hidden). */
  shortfall: { topic: TopicId; wanted: number; got: number }[]
}

export interface BuildOptions {
  size?: 'full' | 'short'
  /** Question ids to avoid when the bank has enough others (recently seen). */
  avoid?: ReadonlySet<string>
}

/** Weights for drawing calculation recipes: load calculations carry the most points on real exams. */
const FAMILY_WEIGHT: Record<string, number> = {
  dwelling: 4, commercial: 3, ampacity: 2, raceway: 2, box: 2, motor: 2, vdrop: 1, transformer: 1, basics: 1,
}

export function buildExam(seed: number, edition: NecEdition, opts: BuildOptions = {}): ExamPaper {
  const size = opts.size ?? 'full'
  const scale = size === 'full' ? 1 : 1 / 3
  const rng = makeRng(seed)
  const items: ExamItem[] = []
  const shortfall: ExamPaper['shortfall'] = []
  const bank = allQuestions(edition)
  const recipes = listRecipes().filter((r) => r.editions.includes(edition))

  for (const t of EXAM_TOPICS) {
    const wanted = Math.max(1, Math.round(t.questions * scale))
    if (t.id === 'calculations') {
      const pool = recipes.filter((r) => r.topic === 'calculations')
      if (pool.length === 0) {
        shortfall.push({ topic: t.id, wanted, got: 0 })
        continue
      }
      const weighted = pool.flatMap((r) => Array.from({ length: FAMILY_WEIGHT[r.family] ?? 1 }, () => r))
      for (let i = 0; i < wanted; i++) {
        const r = rng.pick(weighted)
        items.push({ kind: 'calc', topic: t.id, recipeId: r.id, seed: rng.int(1, 2 ** 30) })
      }
      continue
    }
    const fresh = rng.shuffle(bank.filter((q) => q.topic === t.id && !opts.avoid?.has(q.id)))
    const seen = rng.shuffle(bank.filter((q) => q.topic === t.id && opts.avoid?.has(q.id)))
    const chosen = [...fresh, ...seen].slice(0, wanted)
    // Theory may also draw a basics recipe (Ohm's law, power) when the bank is thin.
    const theoryCalcs = t.id === 'theory' ? recipes.filter((r) => r.topic === 'theory') : []
    for (const q of chosen) items.push({ kind: 'question', topic: t.id, questionId: q.id })
    let got = chosen.length
    while (got < wanted && theoryCalcs.length > 0) {
      const r = rng.pick(theoryCalcs)
      items.push({ kind: 'calc', topic: t.id, recipeId: r.id, seed: rng.int(1, 2 ** 30) })
      got++
    }
    if (got < wanted) shortfall.push({ topic: t.id, wanted, got })
  }
  return {
    seed,
    edition,
    size,
    minutes: Math.round(EXAM.minutes * scale),
    items: rng.shuffle(items),
    shortfall,
  }
}

/** The index of the right option for an item. */
export function correctIndex(item: ExamItem): number {
  if (item.kind === 'question') {
    const q = getQuestion(item.questionId)
    if (!q) throw new Error(`question ${item.questionId} is gone`)
    return q.answer
  }
  const r = getRecipe(item.recipeId)
  if (!r) throw new Error(`recipe ${item.recipeId} is gone`)
  return r.generate(item.seed).choices.findIndex((c) => c.correct)
}

export interface TopicScore {
  topic: TopicId
  title: string
  asked: number
  right: number
  /** Points earned and possible (theory items are worth 2). */
  points: number
  possible: number
}

export interface ExamScore {
  byTopic: TopicScore[]
  points: number
  possible: number
  /** Percent of possible points, the bulletin's measure. */
  pct: number
  passed: boolean
}

/** `answers[i]` is the option picked for item i (undefined = left blank, which scores 0). */
export function scoreExam(paper: ExamPaper, answers: (number | undefined)[]): ExamScore {
  const byTopic = new Map<TopicId, TopicScore>()
  paper.items.forEach((item, i) => {
    const t = topic(item.topic)
    const s = byTopic.get(t.id) ?? { topic: t.id, title: t.title, asked: 0, right: 0, points: 0, possible: 0 }
    s.asked++
    s.possible += t.points
    if (answers[i] !== undefined && answers[i] === correctIndex(item)) {
      s.right++
      s.points += t.points
    }
    byTopic.set(t.id, s)
  })
  const list = EXAM_TOPICS.map((t) => byTopic.get(t.id)).filter((x): x is TopicScore => !!x)
  const points = list.reduce((a, s) => a + s.points, 0)
  const possible = list.reduce((a, s) => a + s.possible, 0)
  const pct = possible ? Math.round((points / possible) * 1000) / 10 : 0
  return { byTopic: list, points, possible, pct, passed: pct >= EXAM.passPct }
}
