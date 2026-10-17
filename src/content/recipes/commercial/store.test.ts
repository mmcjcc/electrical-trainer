import { describe, expect, it } from 'vitest'
import { checkChoice, checkLine } from '@/calc'
import { checkRecipe } from '../harness'
import { answerOf, expectRecipeMistakesNamed, line } from '../kitTesting'
import { buildStore, commercialStore, D3_STORE, pickStore, storeIsRobust, storeNums, type StoreIn } from './store'

/** Three-phase office, no actual lighting given, no show window. */
const OFFICE: StoreIn = {
  occupancy: 'office', length: 100, width: 120, dims: true, receptacles: 150, sign: true, phase: 3, volts: 208,
}

/** Retail where the actual lighting × 1.25 beats the table, receptacles under 10 kVA. */
const SMALL_SHOP: StoreIn = {
  occupancy: 'retail', length: 80, width: 50, dims: false, actualVA: 7000, receptacles: 40, showWindowFt: 20, sign: true, phase: 1, volts: 240,
}

describe('commercial-store', () => {
  it('passes the recipe self-consistency checks', () => {
    checkRecipe(commercialStore, 80)
  })

  it('names every line-specific mistake', () => {
    expectRecipeMistakesNamed(commercialStore, 80)
  })

  it('reproduces Annex D Example D3 (2020): 30,320 VA, 126 A, 150 A overcurrent device', () => {
    // By hand: 80 × 60 = 4,800 ft² × 1.9 = 9,120 VA (the 125% is in the unit load). Actual 7,000 × 1.25 =
    // 8,750 VA, smaller: keep 9,120. Receptacles 80 × 180 = 14,400; − 10,000 = 4,400; × 0.5 = 2,200;
    // + 10,000 = 12,200 VA. Show window 30 × 200 = 6,000 × 1.25 = 7,500. Sign 1,200 × 1.25 = 1,500.
    // 9,120 + 12,200 + 7,500 + 1,500 = 30,320 VA; ÷ 240 = 126.3 A → 126 A; next standard size 150 A.
    const p = buildStore(D3_STORE, 1)
    expect(line(p, 'area').value).toBe(4800)
    expect(line(p, 'tableVA').value).toBeCloseTo(9120, 6)
    expect(line(p, 'actual125').value).toBe(8750)
    expect(line(p, 'lighting').value).toBeCloseTo(9120, 6)
    expect(line(p, 'recDemand').value).toBe(12200)
    expect(line(p, 'sw125').value).toBe(7500)
    expect(line(p, 'sign125').value).toBe(1500)
    expect(line(p, 'total').value).toBeCloseTo(30320, 6)
    expect(line(p, 'amps').value).toBe(126)
    expect(answerOf(p)).toBe('150 A')
  })

  it('names each classic store slip (D3 numbers)', () => {
    const p = buildStore(D3_STORE, 1)
    const slip = (id: string, typed: string, mistake: string) => {
      const v = checkLine(line(p, id), typed)
      expect(!v.ok && v.mistake, `${id} ${typed}`).toBe(mistake)
    }
    slip('unitLoad', '3', 'wrong_table_row')
    slip('tableVA', '11400', 'table_lighting_125_twice') // 9,120 × 1.25
    slip('lighting', '8750', 'lighting_kept_smaller')
    slip('rec50', '7200', 'demand_on_whole_load') // 14,400 × 0.5
    slip('recDemand', '14400', 'demand_factor_missed')
    slip('recDemand', '15250', 'noncontinuous_125') // 12,200 × 1.25
    slip('sw125', '6000', 'forgot_125_continuous')
    slip('sign125', '1200', 'forgot_125_continuous')
    slip('amps', String(30320 / 120), 'wrong_voltage')
    slip('ocpd', '125', 'ocpd_rounded_down')
    const no = checkChoice(line(p, 'recOver'), 'no')
    expect(!no.ok && no.mistake).toBe('demand_factor_missed')
    // Applying 125% to the table lighting moves the answer: 30,320 + 2,280 = 32,600 VA → 136 A → 150 A
    // (the same device here), so that slip is caught on the lines, not by the final options alone.
    expect(storeNums(D3_STORE, { table125: true }).total).toBeCloseTo(32600, 6)
  })

  it('three-phase office: 35,600 VA ÷ (208 × 1.732) = 98.8 A → 100 A', () => {
    // By hand: 100 × 120 = 12,000 ft² × 1.3 = 15,600 VA. Receptacles 150 × 180 = 27,000; − 10,000 = 17,000;
    // × 0.5 = 8,500; + 10,000 = 18,500 VA. Sign 1,500. Total 35,600 VA. 208 × 1.732 = 360.256;
    // 35,600 ÷ 360.256 = 98.8 A → 99 A; next standard size 100 A.
    const p = buildStore(OFFICE, 2)
    expect(line(p, 'total').value).toBeCloseTo(35600, 6)
    expect(line(p, 'v3').value).toBeCloseTo(360.256, 6)
    expect(line(p, 'amps').value).toBe(99)
    expect(answerOf(p)).toBe('100 A')
    const v = checkLine(line(p, 'amps'), String(35600 / 208))
    expect(!v.ok && v.mistake).toBe('sqrt3_missing')
  })

  it('actual lighting governs, receptacles under 10 kVA: 22,450 VA, 94 A, 100 A', () => {
    // By hand: 4,000 ft² × 1.9 = 7,600 VA; actual 7,000 × 1.25 = 8,750 VA, larger: keep 8,750.
    // Receptacles 40 × 180 = 7,200 VA, not over 10,000: 100%. Show window 20 × 200 = 4,000 × 1.25 = 5,000.
    // Sign 1,500. Total 8,750 + 7,200 + 5,000 + 1,500 = 22,450 VA; ÷ 240 = 93.5 A → 94 A; 100 A.
    const p = buildStore(SMALL_SHOP, 3)
    expect(line(p, 'lighting').value).toBe(8750)
    expect(line(p, 'recOver').answerId).toBe('no')
    expect(p.lines.some((l) => l.id === 'recDemand')).toBe(false)
    expect(line(p, 'total').value).toBeCloseTo(22450, 6)
    expect(answerOf(p)).toBe('100 A')
    const v = checkLine(line(p, 'lighting'), '7600')
    expect(!v.ok && v.mistake).toBe('lighting_kept_smaller')
  })

  it('every generated store is robust (rounding, 1.73 for 1.732, a close lighting call)', () => {
    for (let s = 1; s <= 300; s++) expect(storeIsRobust(pickStore(s)), `seed ${s}`).toBe(true)
  })
})

