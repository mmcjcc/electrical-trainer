import { describe, expect, it } from 'vitest'
import { checkChoice, checkLine } from '@/calc'
import { checkRecipe } from '../harness'
import { answerOf, expectRecipeMistakesNamed, line } from '../kitTesting'
import { buildNeutral, dwellingNeutral, neutralNums, type NeutralIn } from './neutral'

/** Annex D Example D1(a): 1,500 ft², 12-kW range, 5.5-kW dryer. */
const D1A: NeutralIn = {
  lighting: { area: 1500, excluded: [], saCircuits: 2, saStated: true, laundry: true },
  rangeKW: 12,
  dryer: { kind: 'kW', kw: 5.5 },
}

/** Annex D Example D2(a) neutral (by the standard method): adds a 5-kW dryer, a 1.2-kW dishwasher and 240-V loads. */
const D2A: NeutralIn = {
  lighting: { area: 1500, excluded: [], saCircuits: 2, saStated: true, laundry: true },
  rangeKW: 12,
  dryer: { kind: 'kW', kw: 5 },
  dishwasher: { kind: 'W', w: 1200 },
  waterHeater: { kind: 'kW', kw: 2.5 },
  heatKW: 9,
  acAmps: 6,
}

describe('dwelling-neutral', () => {
  it('passes the recipe self-consistency checks', () => {
    checkRecipe(dwellingNeutral, 80)
  })

  it('names every line-specific mistake', () => {
    expectRecipeMistakesNamed(dwellingNeutral, 80)
  })

  it('reproduces Annex D Example D1(a) neutral: 14,550 VA, 61 A', () => {
    // By hand: lighting 5,100 at 100%; range 8,000 × 0.7 = 5,600; dryer 5,500 × 0.7 = 3,850.
    // 5,100 + 5,600 + 3,850 = 14,550 VA; ÷ 240 = 60.6 A, rounded 61 A.
    const p = buildNeutral(D1A, 1)
    expect(line(p, 'rangeN').value).toBeCloseTo(5600, 6)
    expect(line(p, 'dryerN').value).toBeCloseTo(3850, 6)
    expect(line(p, 'nTotal').value).toBeCloseTo(14550, 6)
    expect(answerOf(p)).toBe('61 A')
    expect(checkLine(line(p, 'nAmps'), '60.625').ok).toBe(true)
  })

  it('reproduces Annex D Example D2(a) neutral: 15,400 VA, 64 A; 240-V loads add nothing', () => {
    // By hand: 5,100 + 8,000 × 0.7 (5,600) + 5,000 × 0.7 (3,500) + dishwasher 1,200 = 15,400 VA;
    // ÷ 240 = 64.2 A, rounded 64 A. The water heater, heat and A/C are 240-V loads: 0 on the neutral.
    const p = buildNeutral(D2A, 2)
    expect(line(p, 'nTotal').value).toBeCloseTo(15400, 6)
    expect(answerOf(p)).toBe('64 A')
    expect(line(p, 'n240').answerId).toBe('zero')
  })

  it('names each classic neutral slip', () => {
    const p = buildNeutral(D2A, 2)
    const slip = (id: string, typed: string, mistake: string) => {
      const v = checkLine(line(p, id), typed)
      expect(!v.ok && v.mistake, `${id} ${typed}`).toBe(mistake)
    }
    slip('rangeN', '8000', 'neutral_no_70')
    slip('dryerN', '5000', 'neutral_no_70')
    slip('dw', '840', 'neutral_70_on_all')
    // With the 240-V loads: + 2,500 + the larger of 9,000 heat and 1,440 A/C = 15,400 + 11,500 = 26,900.
    expect(neutralNums(D2A, { with240: true }).total).toBeCloseTo(26900, 6)
    slip('nTotal', '26900', 'neutral_240_loads')
    slip('nAmps', String(15400 / 120), 'wrong_voltage')
    const full = checkChoice(line(p, 'n240'), 'full')
    expect(!full.ok && full.mistake).toBe('neutral_240_loads')
  })

  it('a one-family neutral never reaches the over-200 A step', () => {
    for (let s = 1; s <= 300; s++) {
      const p = dwellingNeutral.generate(s)
      expect(line(p, 'over200').answerId).toBe('no')
      expect(line(p, 'nAmps').value as number).toBeLessThan(200)
    }
  })
})
