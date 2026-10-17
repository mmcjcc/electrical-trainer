/**
 * What an exam item shows (a bank question, or a generated calculation in Test-me form) and a scorer
 * that survives a question retired after the paper was built. Shared by the run and results screens.
 */
import { correctIndex, getQuestion, getRecipe, scoreExam, type ExamItem, type ExamPaper, type ExamScore } from '@/content'
import type { ProblemInstance, Question } from '@/shared/types'

export type ItemView =
  | { kind: 'question'; q: Question; stem: string; choices: readonly string[]; answer: number }
  | { kind: 'calc'; problem: ProblemInstance; recipeId: string; recipeTitle: string; stem: string; choices: readonly string[]; answer: number }
  | { kind: 'missing'; stem: string; choices: readonly string[]; answer: -1 }

const MISSING: ItemView = {
  kind: 'missing',
  stem: 'This item was retired from the question bank after the exam was built. It is not scored.',
  choices: [],
  answer: -1,
}

export function itemView(item: ExamItem): ItemView {
  if (item.kind === 'question') {
    const q = getQuestion(item.questionId)
    if (!q) return MISSING
    return { kind: 'question', q, stem: q.stem, choices: q.choices, answer: q.answer }
  }
  const r = getRecipe(item.recipeId)
  if (!r) return MISSING
  const problem = r.generate(item.seed)
  return {
    kind: 'calc',
    problem,
    recipeId: r.id,
    recipeTitle: r.title,
    stem: problem.story,
    choices: problem.choices.map((c) => c.label),
    answer: problem.choices.findIndex((c) => c.correct),
  }
}

function scorable(item: ExamItem): boolean {
  try {
    correctIndex(item)
    return true
  } catch {
    return false
  }
}

/** scoreExam, leaving out any item whose question or recipe no longer exists. */
export function safeScore(paper: ExamPaper, answers: readonly (number | null)[]): ExamScore {
  const picks = answers.map((a) => (a === null ? undefined : a))
  try {
    return scoreExam(paper, picks)
  } catch {
    const keep = paper.items.map(scorable)
    return scoreExam({ ...paper, items: paper.items.filter((_, i) => keep[i]) }, picks.filter((_, i) => keep[i]))
  }
}
