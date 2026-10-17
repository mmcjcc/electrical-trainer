import { beforeEach, describe, expect, it } from 'vitest'
import { importBackup, buildBackup } from './backup'
import { leitnerAfter, mistakeCounts, recipeStage, fadeFor, streakDays, topicStats } from './selectors'
import { useStore } from '.'
import type { Ev, RecipeEv } from './types'

const DAY = 86_400_000
const T0 = new Date(2026, 9, 14, 12).getTime() // a Wednesday

function rec(mode: RecipeEv['mode'], extra: Partial<RecipeEv> = {}, at = T0): RecipeEv {
  return { t: 'recipe', at, rid: 'r1', seed: 1, mode, lines: 10, firstTry: 10, revealed: 0, hints: 0, ms: 1000, ...extra }
}

describe('leitner', () => {
  it('moves up on right, back to 1 on wrong', () => {
    // Due at the start of the target calendar day (T0 is noon on a Wednesday).
    const midnight = (days: number) => new Date(2026, 9, 14 + days).getTime()
    const a = leitnerAfter(undefined, true, T0)
    expect(a).toEqual({ box: 2, due: midnight(1), last: T0 })
    const b = leitnerAfter(a, true, T0)
    expect(b).toEqual({ box: 3, due: midnight(3), last: T0 })
    expect(leitnerAfter(undefined, false, T0)).toEqual({ box: 1, due: T0, last: T0 })
    expect(leitnerAfter(b, false, T0).box).toBe(1)
    expect(leitnerAfter({ box: 5, due: 0 }, true, T0).box).toBe(5)
  })
})

describe('recipe stage', () => {
  it('starts at show and walks up with clean runs', () => {
    expect(recipeStage([], 'r1').suggested).toBe('show')
    const evs: Ev[] = [rec('show')]
    expect(recipeStage(evs, 'r1').suggested).toBe('coach')
    evs.push(rec('coach'), rec('coach'))
    expect(recipeStage(evs, 'r1').suggested).toBe('paper')
    evs.push(rec('paper'), rec('paper'))
    expect(recipeStage(evs, 'r1').suggested).toBe('test')
    evs.push(rec('test', { pickedCorrect: true }), rec('test', { pickedCorrect: true }))
    expect(recipeStage(evs, 'r1').mastered).toBe(true)
  })
  it('a missed test before the paper stage never moves him forward; clean runs must be in a row', () => {
    expect(recipeStage([rec('test', { pickedCorrect: false })], 'r1').suggested).toBe('show')
    const evs: Ev[] = [rec('show'), rec('coach'), rec('coach', { revealed: 2 }), rec('coach')]
    expect(recipeStage(evs, 'r1')).toMatchObject({ suggested: 'coach', clean: 1 })
  })
  it('merge keeps the more recent review, even when it is a miss', () => {
    const settings = useStore.getState().settings
    const file = JSON.stringify(buildBackup({ settings, events: [], leitner: { q1: { box: 1, due: T0 + DAY, last: T0 + DAY } } }))
    const r = importBackup(file, { settings, events: [], leitner: { q1: { box: 4, due: T0 + 7 * DAY, last: T0 } } }, 'merge')
    expect(r.ok && r.leitner.q1?.box).toBe(1)
  })
  it('a sloppy run does not count; a missed test drops to paper', () => {
    const evs: Ev[] = [rec('show'), rec('coach', { firstTry: 5 }), rec('coach')]
    expect(recipeStage(evs, 'r1')).toMatchObject({ suggested: 'coach', clean: 1 })
    // A miss in Test me before he reached Paper leaves him where he was.
    evs.push(rec('test', { pickedCorrect: false, mistake: 'forgot_125_continuous' }))
    expect(recipeStage(evs, 'r1').suggested).toBe('coach')
    // From the test stage, a miss drops him back to Paper.
    const at: Ev[] = [rec('show'), rec('coach'), rec('coach'), rec('paper'), rec('paper'), rec('test', { pickedCorrect: true })]
    expect(recipeStage(at, 'r1').suggested).toBe('test')
    at.push(rec('test', { pickedCorrect: false }))
    expect(recipeStage(at, 'r1')).toMatchObject({ suggested: 'paper', clean: 0, mastered: false })
  })
  it('jumping ahead with a clean higher-mode run gets credit', () => {
    expect(recipeStage([rec('test', { pickedCorrect: true })], 'r1')).toMatchObject({ suggested: 'test', clean: 1 })
  })
  it('fades after one clean coach run', () => {
    expect(fadeFor([rec('coach', { revealed: 1 })], 'r1')).toBe(1)
    expect(fadeFor([rec('coach')], 'r1')).toBe(2)
  })
})

describe('mistakes and topics', () => {
  it('counts this week and last week', () => {
    const evs: Ev[] = [
      { t: 'line', at: T0, rid: 'r', seed: 1, line: 'x', ok: false, mistake: 'forgot_125_continuous', mode: 'coach' },
      { t: 'line', at: T0 - 7 * DAY, rid: 'r', seed: 1, line: 'x', ok: false, mistake: 'forgot_125_continuous', mode: 'coach' },
      { t: 'line', at: T0, rid: 'r', seed: 1, line: 'x', ok: false, mistake: 'unknown', mode: 'coach' },
    ]
    expect(mistakeCounts(evs, T0)).toEqual([{ id: 'forgot_125_continuous', total: 2, thisWeek: 1, lastWeek: 1, lastAt: T0 }])
  })
  it('topic stats', () => {
    const evs: Ev[] = [
      { t: 'q', at: T0, qid: 'a', topic: 'theory', pick: 0, correct: true, hint: 0, ms: 1, mode: 'practice' },
      { t: 'q', at: T0, qid: 'b', topic: 'theory', pick: 1, correct: false, hint: 2, ms: 1, mode: 'practice' },
    ]
    expect(topicStats(evs, ['theory', 'calculations'])).toEqual([
      { topic: 'theory', asked: 2, right: 1, recentPct: 50, hinted: 1, lastAt: T0 },
      { topic: 'calculations', asked: 0, right: 0, recentPct: null, hinted: 0, lastAt: undefined },
    ])
  })
  it('streak counts back from today or yesterday', () => {
    const evs: Ev[] = [0, 1, 2, 4].map((d) => ({ t: 'drill', at: T0 - d * DAY, drill: 'x', right: 1, total: 1, ms: 1 }))
    expect(streakDays(evs, T0)).toBe(3)
    expect(streakDays(evs, T0 + DAY)).toBe(3)
    expect(streakDays(evs, T0 + 2 * DAY)).toBe(0)
  })
})

describe('backup', () => {
  it('merges without duplicates and replaces on request', () => {
    const a: Ev = { t: 'drill', at: 1, drill: 'pct', right: 1, total: 1, ms: 1 }
    const b: Ev = { t: 'drill', at: 2, drill: 'pct', right: 1, total: 1, ms: 1 }
    const file = JSON.stringify(buildBackup({ settings: useStore.getState().settings, events: [a, b], leitner: { q1: { box: 3, due: 9 } } }))
    const merged = importBackup(file, { settings: useStore.getState().settings, events: [a], leitner: {} }, 'merge')
    expect(merged.ok && merged.events.length).toBe(2)
    expect(merged.ok && merged.added).toBe(1)
    expect(importBackup('nope', { settings: useStore.getState().settings, events: [], leitner: {} }, 'merge').ok).toBe(false)
  })
})

describe('store actions', () => {
  beforeEach(() => useStore.getState().resetProgress())
  it('answering a question logs it and schedules review', () => {
    useStore.getState().answerQuestion({ qid: 'gnd-001', topic: 'wiring-protection', pick: 2, correct: false, hint: 1, ms: 9000, mode: 'practice', at: T0 })
    const s = useStore.getState()
    expect(s.events).toHaveLength(1)
    expect(s.leitner['gnd-001']).toEqual({ box: 1, due: T0, last: T0 })
  })
})
