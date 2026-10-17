import { describe, expect, it } from 'vitest'
import { drillStats, mistakeTrend, recentMistakes } from './selectors.math'
import type { Ev } from './types'

const T0 = new Date(2026, 9, 14, 12).getTime()

describe('drill stats', () => {
  it('counts rounds, keeps the best (then fastest) and the last', () => {
    const evs: Ev[] = [
      { t: 'drill', at: T0, drill: 'percent', right: 7, total: 10, ms: 50_000 },
      { t: 'drill', at: T0 + 1, drill: 'percent', right: 9, total: 10, ms: 60_000 },
      { t: 'drill', at: T0 + 2, drill: 'divisor', right: 10, total: 10, ms: 30_000 },
      { t: 'drill', at: T0 + 3, drill: 'percent', right: 9, total: 10, ms: 40_000 },
      { t: 'drill', at: T0 + 4, drill: 'percent', right: 6, total: 10, ms: 30_000 },
    ]
    expect(drillStats(evs, 'percent')).toEqual({
      drill: 'percent',
      rounds: 4,
      best: { right: 9, total: 10, ms: 40_000 },
      last: { right: 6, total: 10, ms: 30_000, at: T0 + 4 },
    })
    expect(drillStats(evs, 'kw')).toEqual({ drill: 'kw', rounds: 0, best: undefined, last: undefined })
  })
})

describe('mistake trend', () => {
  it('compares this week with last week', () => {
    expect(mistakeTrend({ thisWeek: 1, lastWeek: 4 })).toBe('better')
    expect(mistakeTrend({ thisWeek: 4, lastWeek: 1 })).toBe('worse')
    expect(mistakeTrend({ thisWeek: 2, lastWeek: 2 })).toBe('same')
    expect(mistakeTrend({ thisWeek: 2, lastWeek: 0 })).toBe('new')
    expect(mistakeTrend({ thisWeek: 0, lastWeek: 0 })).toBe('gone')
  })
  it('recent mistakes skip old ones and sort by the last two weeks', () => {
    const list = recentMistakes([
      { id: 'a', total: 20, thisWeek: 0, lastWeek: 0, lastAt: 1 },
      { id: 'b', total: 3, thisWeek: 1, lastWeek: 1, lastAt: 5 },
      { id: 'c', total: 4, thisWeek: 3, lastWeek: 1, lastAt: 2 },
    ])
    expect(list.map((m) => m.id)).toEqual(['c', 'b'])
  })
})
