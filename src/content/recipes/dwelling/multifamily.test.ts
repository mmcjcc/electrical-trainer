import { describe, expect, it } from 'vitest'
import { checkLine } from '@/calc'
import { checkRecipe } from '../harness'
import { answerOf, expectRecipeMistakesNamed, line } from '../kitTesting'
import { buildMulti, D4B_20, multifamilyOptional, multiNums, type MultiIn } from './multifamily'

const D4B_40: MultiIn = { ...D4B_20, units: 40 }

/** Hand-worked: ten units with both heat and A/C (A/C larger), single-phase. */
const TEN: MultiIn = {
  units: 10, area: 1000, saCircuits: 2, laundry: true, rangeKW: 12, dryer: { kind: 'kW', kw: 5 },
  waterHeater: { kind: 'kW', kw: 4.5 }, dishwasher: { kind: 'W', w: 1200 }, heatKW: 5, acAmps: 24, phase: 1,
}

describe('multifamily-optional', () => {
  it('passes the recipe self-consistency checks', () => {
    checkRecipe(multifamilyOptional, 80)
  })

  it('names every line-specific mistake', () => {
    expectRecipeMistakesNamed(multifamilyOptional, 80)
  })

  it('reproduces Annex D Example D4(b), 20 units: 440,400 VA × 38% = 167,352 VA, 697 A', () => {
    // By hand, one unit: 840 × 3 = 2,520; 2 × 1,500 = 3,000 (common laundry: no laundry circuit);
    // range 8,000 at nameplate; water heater 2,500; heat 6,000 at 100%. 22,020 VA.
    // × 20 = 440,400 VA; Table 220.84, 20 units: 38%. 167,352 VA ÷ 240 = 697.3 A → 697 A.
    const p = buildMulti(D4B_20, 1)
    expect(line(p, 'unit').value).toBe(22020)
    expect(line(p, 'connected').value).toBe(440400)
    expect(line(p, 'pct').value).toBe(38)
    expect(line(p, 'demand').value).toBeCloseTo(167352, 6)
    expect(answerOf(p)).toBe('697 A')
  })

  it('reproduces Annex D Example D4(b), 40 units: 880,800 VA × 28% = 246,624 VA, 1,028 A', () => {
    // By hand: 22,020 × 40 = 880,800 VA; 40 units: 28%. 246,624 VA ÷ 240 = 1,027.6 A → 1,028 A.
    const p = buildMulti(D4B_40, 2)
    expect(line(p, 'pct').value).toBe(28)
    expect(line(p, 'demand').value).toBeCloseTo(246624, 6)
    expect(answerOf(p)).toBe('1,028 A')
  })

  it('reproduces Annex D Example D5(b) at 208Y/120 V: 465 A and 685 A', () => {
    // By hand: 208 × 1.732 = 360.256. 167,352 ÷ 360.256 = 464.5 A → 465 A; 246,624 ÷ 360.256 = 684.6 A → 685 A.
    const p20 = buildMulti({ ...D4B_20, phase: 3 }, 3)
    expect(line(p20, 'v3').value).toBeCloseTo(360.256, 6)
    expect(answerOf(p20)).toBe('465 A')
    expect(answerOf(buildMulti({ ...D4B_40, phase: 3 }, 4))).toBe('685 A')
    // 208 alone (no 1.732) is the classic three-phase slip.
    const v = checkLine(line(p20, 'amps'), String(167352 / 208))
    expect(!v.ok && v.mistake).toBe('sqrt3_missing')
  })

  it('ten units, A/C larger than heat: 359,600 VA × 43% = 154,628 VA, 644 A; slips named', () => {
    // By hand, one unit: 3,000 + 3,000 + 1,500 + 12,000 + 5,000 + 4,500 + 1,200 + the larger of heat 5,000
    // and A/C 24 × 240 = 5,760 (A/C) = 35,960 VA. × 10 = 359,600 VA; 10 units: 43%. 154,628 VA ÷ 240 =
    // 644.3 A → 644 A.
    const p = buildMulti(TEN, 5)
    expect(line(p, 'hvac').value).toBe(5760)
    expect(line(p, 'unit').value).toBe(35960)
    expect(line(p, 'pct').value).toBe(43)
    expect(answerOf(p)).toBe('644 A')
    const slip = (id: string, typed: string, mistake: string) => {
      const v = checkLine(line(p, id), typed)
      expect(!v.ok && v.mistake, `${id} ${typed}`).toBe(mistake)
    }
    slip('rangeVA', '8000', 'optional_used_standard_rules') // Column C instead of the nameplate
    slip('heatVA', '3250', 'multifamily_hvac_pct') // 65% of 5,000
    slip('hvac', '10760', 'added_both_heat_and_ac')
    slip('hvac', '5000', 'used_smaller_noncoincident')
    slip('pct', '44', 'wrong_table_row') // the 6-7 unit row
    slip('pct', '42', 'wrong_table_row') // the 11 unit row
    slip('demand', '359600', 'demand_factor_missed')
    slip('amps', String(154628 / 120), 'wrong_voltage')
    expect(multiNums(TEN, { bothHvac: true }).unit).toBe(35960 + 5000)
  })
})
