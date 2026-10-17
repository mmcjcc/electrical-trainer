/**
 * Pure selectors for the math screens (MATH UI builder): drill records and mistake trends. The
 * recipe stage, fading and mistake counts themselves live in ./selectors.ts.
 */
import type { Ev } from './types'
import type { MistakeCount } from './selectors'

export interface DrillStat {
  drill: string
  rounds: number
  /** Best round: most right, then fastest. */
  best?: { right: number; total: number; ms: number }
  last?: { right: number; total: number; ms: number; at: number }
}

export function drillStats(events: readonly Ev[], drill: string): DrillStat {
  let rounds = 0
  let best: DrillStat['best']
  let last: DrillStat['last']
  for (const e of events) {
    if (e.t !== 'drill' || e.drill !== drill) continue
    rounds++
    last = { right: e.right, total: e.total, ms: e.ms, at: e.at }
    const score = e.total > 0 ? e.right / e.total : 0
    const bestScore = best && best.total > 0 ? best.right / best.total : -1
    if (!best || score > bestScore || (score === bestScore && e.ms < best.ms)) best = { right: e.right, total: e.total, ms: e.ms }
  }
  return { drill, rounds, best, last }
}

/** Is a mistake getting better? Compares this week with last week. */
export type Trend = 'better' | 'worse' | 'same' | 'new' | 'gone'

export function mistakeTrend(m: Pick<MistakeCount, 'thisWeek' | 'lastWeek'>): Trend {
  if (m.thisWeek === 0 && m.lastWeek === 0) return 'gone'
  if (m.lastWeek === 0) return 'new'
  if (m.thisWeek < m.lastWeek) return 'better'
  if (m.thisWeek > m.lastWeek) return 'worse'
  return 'same'
}

/** The mistakes worth showing on the Math home strip: seen in the last two weeks, most first. */
export function recentMistakes(counts: readonly MistakeCount[], n = 3): MistakeCount[] {
  return counts
    .filter((m) => m.thisWeek + m.lastWeek > 0)
    .sort((a, b) => b.thisWeek + b.lastWeek - (a.thisWeek + a.lastWeek) || b.lastAt - a.lastAt)
    .slice(0, n)
}
