import { describe, expect, it } from 'vitest'
import { checkLine } from '@/calc'
import { checkRecipe } from '../harness'
import { answerOf, expectRecipeMistakesNamed, line } from '../kitTesting'
import { buildRangesMulti, dwellingRangesMulti, rangesNums } from './rangesMulti'

describe('dwelling-ranges-multi', () => {
  it('passes the recipe self-consistency checks', () => {
    checkRecipe(dwellingRangesMulti, 80)
  })

  it('names every line-specific mistake', () => {
    expectRecipeMistakesNamed(dwellingRangesMulti, 80)
  })

  it('reproduces Annex D Example D6, equal ranges: 24 ranges at 16 kW = 46.8 kW', () => {
    // By hand: Column C, 24 ranges = 39 kW. 16 − 12 = 4 kW over: 4 × 5% = 20%. 39 × 1.2 = 46.8 kW.
    const p = buildRangesMulti({ groups: [{ count: 24, kw: 16 }] }, 1)
    expect(line(p, 'colC').value).toBe(39)
    expect(line(p, 'pct').value).toBe(20)
    expect(answerOf(p)).toBe('46.8 kW')
  })

  it('reproduces Annex D Example D6, unequal ranges: 30 ranges totaling 408 kW = 49.5 kW', () => {
    // By hand: 18 ranges at 11 kW count as 12 kW: 18 × 12 = 216; 12 at 16 kW = 192; total 408 kW.
    // 408 ÷ 30 = 13.6 kW average; 1.6 over, a major fraction: 2 kW, 10%.
    // Column C, 30 ranges = 15 + 30 = 45 kW; 45 × 1.10 = 49.5 kW.
    const p = buildRangesMulti({ groups: [{ count: 18, kw: 11 }, { count: 12, kw: 16 }] }, 2)
    expect(line(p, 'sumKW').value).toBe(408)
    expect(line(p, 'avg').value).toBeCloseTo(13.6, 9)
    expect(line(p, 'colC').value).toBe(45)
    expect(answerOf(p)).toBe('49.5 kW')
    // Averaging the nameplates: (198 + 192) ÷ 30 = 13 kW is the Note 2 slip.
    const v = checkLine(line(p, 'avg'), '13')
    expect(!v.ok && v.mistake).toBe('range_note2_average')
    const g = checkLine(line(p, 'g0'), '198')
    expect(!g.ok && g.mistake).toBe('range_note2_average')
  })

  it('10 ranges at 11 kW: Column C for 10 ranges, 25 kW; the slips are named', () => {
    // By hand: each is 12 kW or less, so Column C as it is: 10 ranges = 25 kW.
    const p = buildRangesMulti({ groups: [{ count: 10, kw: 11 }] }, 3)
    expect(line(p, 'over12').answerId).toBe('no')
    expect(answerOf(p)).toBe('25 kW')
    const slip = (typed: string, mistake: string) => {
      const v = checkLine(line(p, 'colC'), typed)
      expect(!v.ok && v.mistake, typed).toBe(mistake)
    }
    slip('80', 'range_per_range') // 8 kW × 10
    slip('110', 'range_nameplate') // 10 × 11 kW
    slip('24', 'wrong_table_row') // the row for 9 ranges
  })

  it('12 at 10 kW and 8 at 14 kW: average 12.8 kW, 5% on Column C 35 kW = 36.75 kW', () => {
    // By hand: 12 × 12 (counted as 12 kW) = 144; 8 × 14 = 112; 256 ÷ 20 = 12.8 kW; 0.8 over: 1 kW, 5%.
    // Column C, 20 ranges = 35 kW; 35 × 1.05 = 36.75 kW.
    const p = buildRangesMulti({ groups: [{ count: 12, kw: 10 }, { count: 8, kw: 14 }] }, 4)
    expect(answerOf(p)).toBe('36.75 kW')
    // Without counting the 10-kW ranges as 12 kW the average is 11.6 kW and Note 1 is missed: 35 kW.
    expect(rangesNums({ groups: [{ count: 12, kw: 10 }, { count: 8, kw: 14 }] }, { no12: true }).demand).toBe(35)
    const v = checkLine(line(p, 'demand'), '35')
    expect(!v.ok && v.mistake).toBe('range_note1')
  })
})
