import { describe, expect, it } from 'vitest'
import { checkChoice, checkLine } from '@/calc'
import { checkRecipe } from '../harness'
import { answerOf, expectRecipeMistakesNamed, line } from '../kitTesting'
import type { Appliance } from './common'
import { buildOptional, dwellingOptional, OPTIONAL_FALLBACK, optionalIsRobust, optionalNums, pickOptional, type OptionalIn } from './optional'

const kwApp = (key: string, name: string, kw: number): Appliance => ({ key, name, motor: false, rating: { kind: 'kW', kw } })
const lighting1500 = { area: 1500, excluded: [], saCircuits: 2, saStated: true, laundry: true }

/** Annex D Example D2(a): heat (9 kW, five rooms) larger than the 6-A, 230-V A/C. */
const D2A: OptionalIn = {
  lighting: lighting1500,
  cooking: [{ key: 'range', name: 'range', count: 1, kw: 12 }],
  dryer: { kind: 'kW', kw: 5 },
  appliances: [kwApp('wh', 'water heater', 2.5), kwApp('dw', 'dishwasher', 1.2)],
  heat: { kw: 9, units: 5, kind: 'baseboard' },
  ac: { units: 1, amps: 6, volts: 230 },
}

/** Annex D Example D2(b): six 7-A room A/C units (taken at 240 V, as the example does), one 1.5-kW heater. */
const D2B: OptionalIn = {
  lighting: lighting1500,
  cooking: [
    { key: 'oven', name: 'wall oven', count: 2, kw: 4 },
    { key: 'cooktop', name: 'cooktop', count: 1, kw: 5.1 },
  ],
  dryer: { kind: 'kW', kw: 5 },
  appliances: [kwApp('wh', 'water heater', 4.5), kwApp('dw', 'dishwasher', 1.2)],
  heat: { kw: 1.5, units: 1, kind: 'heater' },
  ac: { units: 6, amps: 7, volts: 240 },
}

describe('dwelling-optional', () => {
  it('passes the recipe self-consistency checks', () => {
    checkRecipe(dwellingOptional, 80)
  })

  it('names every line-specific mistake', () => {
    expectRecipeMistakesNamed(dwellingOptional, 80)
  })

  it('reproduces Annex D Example D2(a): 29,700 VA pile, 17,880 + 3,600 = 21,480 VA, 89.5 A, 100 A', () => {
    // By hand: 4,500 + 3,000 + 1,500 + range 12,000 + water heater 2,500 + dishwasher 1,200 + dryer 5,000
    // = 29,700 VA. 29,700 − 10,000 = 19,700; × 0.4 = 7,880; + 10,000 = 17,880 VA.
    // A/C 6 × 230 = 1,380 VA; heat 9,000 × 0.4 (five units, four or more) = 3,600 VA: keep the heat.
    // 17,880 + 3,600 = 21,480 VA; ÷ 240 = 89.5 A → 90 A; minimum 100 A.
    const p = buildOptional(D2A, 1)
    expect(line(p, 'gTotal').value).toBeCloseTo(29700, 6)
    expect(line(p, 'gDemand').value).toBeCloseTo(17880, 6)
    expect(line(p, 'acVA').value).toBe(1380)
    expect(line(p, 'heatUnits').answerId).toBe('many')
    expect(line(p, 'heatSel').value).toBeCloseTo(3600, 6)
    expect(line(p, 'hvac').value).toBeCloseTo(3600, 6)
    expect(line(p, 'total').value).toBeCloseTo(21480, 6)
    expect(line(p, 'amps').value).toBe(90)
    expect(checkLine(line(p, 'amps'), '89.5').ok).toBe(true)
    expect(answerOf(p)).toBe('100 A')
  })

  it('reproduces Annex D Example D2(b): 32,800 VA pile, 19,120 + 10,080 = 29,200 VA, 122 A', () => {
    // By hand: 4,500 + 3,000 + 1,500 + ovens 2 × 4,000 + cooktop 5,100 + 4,500 + 1,200 + 5,000 = 32,800 VA.
    // 22,800 × 0.4 = 9,120; + 10,000 = 19,120 VA. A/C 6 × 7 × 240 = 10,080 VA; the one 1.5-kW heater at 65%
    // is 975 VA: keep the A/C. 19,120 + 10,080 = 29,200 VA; ÷ 240 = 121.7 A → 122 A; next size 125 A.
    const p = buildOptional(D2B, 2)
    expect(line(p, 'c_oven').value).toBe(8000)
    expect(line(p, 'gTotal').value).toBeCloseTo(32800, 6)
    expect(line(p, 'gDemand').value).toBeCloseTo(19120, 6)
    expect(line(p, 'acVA').value).toBe(10080)
    expect(line(p, 'heatUnits').answerId).toBe('few')
    expect(line(p, 'heatSel').value).toBeCloseTo(975, 6)
    expect(line(p, 'total').value).toBeCloseTo(29200, 6)
    expect(line(p, 'amps').value).toBe(122)
    expect(answerOf(p)).toBe('125 A')
  })

  it('reproduces Annex D Example D2(c): heat pump, 19,280 + 15,510 = 34,790 VA, 145 A, 150 A', () => {
    // By hand: 6,000 + 3,000 + 1,500 + 12,000 + 4,500 + 1,200 + 5,000 = 33,200 VA; 23,200 × 0.4 = 9,280;
    // + 10,000 = 19,280 VA. Heat pump 24 × 240 = 5,760 VA plus 65% of 15,000 = 9,750: 15,510 VA (larger than
    // the 5,760 VA cooling choice). 19,280 + 15,510 = 34,790 VA; ÷ 240 = 144.96 A → 145 A; next size 150 A.
    const p = buildOptional(OPTIONAL_FALLBACK, 3)
    expect(line(p, 'gTotal').value).toBeCloseTo(33200, 6)
    expect(line(p, 'gDemand').value).toBeCloseTo(19280, 6)
    expect(line(p, 'hpSel').value).toBeCloseTo(15510, 6)
    expect(line(p, 'hvac').value).toBeCloseTo(15510, 6)
    expect(line(p, 'total').value).toBeCloseTo(34790, 6)
    expect(line(p, 'amps').value).toBe(145)
    expect(answerOf(p)).toBe('150 A')
  })

  it('names each classic optional-method slip', () => {
    const p = buildOptional(D2A, 1)
    const slip = (id: string, typed: string, mistake: string) => {
      const v = checkLine(line(p, id), typed)
      expect(!v.ok && v.mistake, `${id} ${typed}`).toBe(mistake)
    }
    slip('c_range', '8000', 'optional_used_standard_rules') // Table 220.55 instead of the nameplate
    slip('gTotal', String(29700 + 9000 + 1380), 'optional_hvac_in_pile')
    slip('g40', '11880', 'demand_on_whole_load') // 29,700 × 0.4
    slip('gDemand', '7880', 'forgot_first_step')
    slip('heatSel', '9000', 'optional_heat_pct') // heat at 100%
    slip('heatSel', '5850', 'optional_heat_pct') // 65% with five units
    slip('hvac', '4980', 'added_both_heat_and_ac') // 3,600 + 1,380
    slip('hvac', '1380', 'used_smaller_noncoincident')
    slip('amps', String(21480 / 120), 'wrong_voltage')
    const few = checkChoice(line(p, 'heatUnits'), 'few')
    expect(!few.ok && few.mistake).toBe('optional_heat_pct')
    const hp = buildOptional(OPTIONAL_FALLBACK, 3)
    const s = checkLine(line(hp, 'supp65'), '15000')
    expect(!s.ok && s.mistake).toBe('optional_heat_pct')
    // The dryer floor is a standard-method rule: a 4.5-kW dryer stays 4,500 VA here.
    const d = buildOptional({ ...D2A, dryer: { kind: 'W', w: 4500 } }, 4)
    const dv = checkLine(line(d, 'dryerName'), '5000')
    expect(!dv.ok && dv.mistake).toBe('optional_used_standard_rules')
  })

  it('every generated problem is robust: the answer does not depend on rounding or a close call', () => {
    for (let s = 1; s <= 300; s++) {
      const inp = pickOptional(s)
      expect(optionalIsRobust(inp), `seed ${s}`).toBe(true)
      expect(optionalNums(inp).service).toBeGreaterThanOrEqual(100)
    }
  })
})
