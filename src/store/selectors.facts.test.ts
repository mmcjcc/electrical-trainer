import { describe, expect, it } from 'vitest'
import type { Question } from '@/shared/types'
import { countByTopic, dueInPool, nextRecipe, pickPractice, questionRecords, readiness, sessionTally, todayPlan, type TopicLike } from './selectors.facts'
import type { Ev, QuestionEv, RecipeEv } from './types'

const DAY = 86_400_000
const T0 = new Date(2026, 9, 14, 12).getTime()

function q(id: string, topic = 'wiring-protection'): Question {
  return {
    id, topic, stem: `Stem ${id}`, choices: ['a', 'b', 'c', 'd'], answer: 0, explain: 'x',
    ref: { book: 'NEC', loc: '250.66' }, difficulty: 1, editions: ['2020'], kind: 'rule',
  }
}

function ans(qid: string, correct: boolean, at = T0, topic = 'wiring-protection', extra: Partial<QuestionEv> = {}): QuestionEv {
  return { t: 'q', at, qid, topic, pick: correct ? 0 : 1, correct, hint: 0, ms: 1000, mode: 'practice', ...extra }
}

function test(rid: string, ok: boolean, at = T0): RecipeEv {
  return { t: 'recipe', at, rid, seed: 1, mode: 'test', lines: 1, firstTry: ok ? 1 : 0, revealed: 0, hints: 0, pickedCorrect: ok, ms: 1 }
}

const TOPICS: TopicLike[] = [
  { id: 'theory', title: 'Electrical Theory', questions: 10, points: 2 },
  { id: 'wiring-protection', title: 'Wiring and Protection', questions: 14, points: 1 },
  { id: 'special-equipment', title: 'Special Equipment', questions: 4, points: 1 },
  { id: 'calculations', title: 'Calculations', questions: 30, points: 1 },
  { id: 'md-law', title: 'Maryland licensing law', questions: 0, points: 1, offExam: true },
]

describe('questionRecords', () => {
  it('tallies per question and ignores find-it answers', () => {
    const evs: Ev[] = [ans('a', false, T0), ans('a', true, T0 + 1), ans('b', true), ans('c', true, T0, 'x', { mode: 'find' })]
    const r = questionRecords(evs)
    expect(r.get('a')).toEqual({ asked: 2, right: 1, lastCorrect: true, lastAt: T0 + 1 })
    expect(r.has('c')).toBe(false)
  })
})

describe('pickPractice', () => {
  const pool = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => q(id))
  it('puts unseen first, then the weakest, and never repeats', () => {
    const evs: Ev[] = [
      ans('a', true, T0 - 3 * DAY), // right, old
      ans('b', false, T0 - DAY), // missed last time: weakest
      ans('c', true, T0 - 2 * DAY), ans('c', false, T0 - 2 * DAY + 1), ans('c', true, T0 - DAY), // 2/3, right last
    ]
    const ids = pickPractice(pool, evs, { seed: 3, n: 10 })
    expect(ids).toHaveLength(6)
    expect(new Set(ids).size).toBe(6)
    expect(new Set(ids.slice(0, 3))).toEqual(new Set(['d', 'e', 'f']))
    expect(ids.slice(3)).toEqual(['b', 'c', 'a'])
  })
  it('caps at n and is seeded', () => {
    expect(pickPractice(pool, [], { seed: 1, n: 4 })).toHaveLength(4)
    expect(pickPractice(pool, [], { seed: 9 })).toEqual(pickPractice(pool, [], { seed: 9 }))
  })
})

describe('dueInPool', () => {
  it('skips due ids that are not in the bank for this edition', () => {
    const leitner = { a: { box: 1 as const, due: T0 - 1 }, gone: { box: 1 as const, due: T0 - 1 }, b: { box: 2 as const, due: T0 + DAY } }
    expect(dueInPool(leitner, [q('a'), q('b')], T0)).toEqual(['a'])
  })
})

describe('readiness', () => {
  it('uses fact answers and Test-me runs, and estimates points over tried areas', () => {
    const evs: Ev[] = [ans('a', true), ans('b', false), test('r1', true), test('r1', true), test('r1', false), test('r1', true)]
    const r = readiness(evs, TOPICS, [{ id: 'r1', topic: 'calculations' }])
    expect(r.rows.map((x) => x.topic)).toEqual(['theory', 'wiring-protection', 'special-equipment', 'calculations'])
    expect(r.rows.find((x) => x.topic === 'wiring-protection')).toMatchObject({ pct: 50, basedOn: 2, points: 14 })
    expect(r.rows.find((x) => x.topic === 'calculations')).toMatchObject({ pct: 75, points: 30 })
    expect(r.rows.find((x) => x.topic === 'theory')).toMatchObject({ pct: null, points: 20 })
    // 14 × 0.5 + 30 × 0.75 = 7 + 22.5 = 29.5 → 30
    expect(r.estimate).toBe(30)
    expect(r.coveredPoints).toBe(44)
    expect(r.totalPoints).toBe(68)
  })
})

describe('todayPlan', () => {
  const recipes = [
    { id: 'r1', title: 'Dwelling service', topic: 'calculations' },
    { id: 'r2', title: 'Conduit fill', topic: 'calculations' },
  ]
  it('due reviews first, then the area with the most points to gain, then the recipe in progress', () => {
    const coach: RecipeEv = { t: 'recipe', at: T0, rid: 'r2', seed: 1, mode: 'show', lines: 4, firstTry: 4, revealed: 0, hints: 0, ms: 1 }
    const evs: Ev[] = [ans('w1', true), ans('w2', true), ans('w3', true), ans('w4', false), coach]
    const plan = todayPlan({
      events: evs,
      leitner: { w4: { box: 1, due: T0 } },
      now: T0,
      questions: [q('w1'), q('w2'), q('w3'), q('w4'), q('t1', 'theory'), q('s1', 'special-equipment')],
      topics: TOPICS,
      recipes,
    })
    expect(plan[0]).toEqual({ kind: 'review', due: 1 })
    // Theory untried: 20 × 50% = 10 to gain; wiring: 14 × 25% = 3.5; special equipment: 4 × 50% = 2.
    expect(plan[1]).toMatchObject({ kind: 'topic', topic: 'theory', pct: null, available: 1 })
    expect(plan[2]).toMatchObject({ kind: 'recipe', recipeId: 'r2', started: true })
  })
  it('leaves out steps with nothing to offer', () => {
    const plan = todayPlan({ events: [], leitner: {}, now: T0, questions: [], topics: TOPICS, recipes })
    expect(plan).toEqual([expect.objectContaining({ kind: 'recipe', recipeId: 'r1', started: false })])
  })
  it('suggests the stalest recipe once all are mastered', () => {
    const evs: Ev[] = [
      { ...test('r1', true, T0 - 5 * DAY), mode: 'test' }, test('r1', true, T0 - 5 * DAY),
      test('r2', true, T0 - DAY), test('r2', true, T0 - DAY),
    ]
    expect(nextRecipe(evs, recipes)).toMatchObject({ recipeId: 'r1', started: true })
  })
})

describe('small helpers', () => {
  it('counts and tallies', () => {
    expect(countByTopic([q('a'), q('b'), q('c', 'theory')]).get('wiring-protection')).toBe(2)
    expect(sessionTally([{ correct: true, hint: 0 }, { correct: false, hint: 2 }])).toEqual({ right: 1, total: 2, hinted: 1 })
  })
})
