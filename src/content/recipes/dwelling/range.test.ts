import { describe, expect, it } from 'vitest'
import { checkChoice, checkLine } from '@/calc'
import { checkRecipe } from '../harness'
import { answerOf, expectRecipeMistakesNamed, line } from '../kitTesting'
import { clearFraction } from './common'
import { buildRangeSlice, dwellingRange } from './range'

const build = (kw: number) => buildRangeSlice({ kw, setting: 0 }, 1)

describe('dwelling-range', () => {
  it('passes the recipe self-consistency checks', () => {
    checkRecipe(dwellingRange, 80)
  })

  it('names every line-specific mistake', () => {
    expectRecipeMistakesNamed(dwellingRange, 80)
  })

  it('12 kW (the Annex D Example D1(a) range): Column C, 8 kW', () => {
    const p = build(12)
    expect(line(p, 'rangeOver12').answerId).toBe('no')
    expect(answerOf(p)).toBe('8 kW')
  })

  it('13.6 kW: 1.6 kW over, a major fraction, 2 kW counted, 10%: 8.8 kW', () => {
    // By hand: 13.6 − 12 = 1.6; 0.6 is a major fraction: 2 kW; 2 × 5% = 10%; 8 × 1.10 = 8.8 kW.
    const p = build(13.6)
    expect(line(p, 'rangeExcess').value).toBeCloseTo(1.6, 9)
    expect(line(p, 'rangeSteps').value).toBe(2)
    expect(line(p, 'rangePct').value).toBe(10)
    expect(answerOf(p)).toBe('8.8 kW')
  })

  it('14.2 kW: the 0.2 is dropped, 2 kW counted: 8.8 kW', () => {
    // By hand: 14.2 − 12 = 2.2; 0.2 is not a major fraction: 2 kW; 10%; 8 × 1.10 = 8.8 kW.
    const p = build(14.2)
    expect(line(p, 'rangeSteps').value).toBe(2)
    expect(answerOf(p)).toBe('8.8 kW')
    const v = checkLine(line(p, 'rangeSteps'), '3')
    expect(!v.ok && v.mistake).toBe('range_major_fraction')
  })

  it('12.4 kW: over 12, but by less than a major fraction: no increase, 8 kW', () => {
    // By hand: 12.4 − 12 = 0.4, dropped: 0 kW counted, no 5% step. 8 kW.
    const p = build(12.4)
    expect(line(p, 'rangeOver12').answerId).toBe('yes')
    expect(line(p, 'rangeSteps').value).toBe(0)
    expect(p.lines.some((l) => l.id === 'rangePct')).toBe(false)
    expect(answerOf(p)).toBe('8 kW')
    const v = checkLine(line(p, 'rangeDemandKW'), '8.4')
    expect(!v.ok && v.mistake).toBe('range_major_fraction')
  })

  it('16 kW: 4 kW over, 20%: 9.6 kW, and the classic slips are named', () => {
    // By hand: 16 − 12 = 4; 4 × 5% = 20%; 8 × 1.2 = 9.6 kW.
    const p = build(16)
    expect(answerOf(p)).toBe('9.6 kW')
    const slip = (id: string, typed: string, mistake: string) => {
      const v = checkLine(line(p, id), typed)
      expect(!v.ok && v.mistake, `${id} ${typed}`).toBe(mistake)
    }
    slip('rangeColC', '16', 'range_nameplate')
    slip('rangeColC', '12.8', 'range_wrong_column') // 80% of 16 (Column B)
    slip('rangeDemandKW', '8', 'range_note1')
    slip('rangeDemandKW', '1.6', 'range_note1') // only the increase
    slip('rangeDemandKW', '19.2', 'range_nameplate') // Note 1 applied to the nameplate
    const v = checkChoice(line(p, 'rangeOver12'), 'no')
    expect(!v.ok && v.mistake).toBe('range_note1')
  })

  it('never generates a kW excess near one half (the "major fraction" argument)', () => {
    for (let s = 1; s <= 400; s++) {
      const p = dwellingRange.generate(s)
      const kw = line(p, 'rangeKW').value as number
      if (kw > 12) expect(clearFraction(kw - 12), `seed ${s}: ${kw} kW`).toBe(true)
    }
  })
})
