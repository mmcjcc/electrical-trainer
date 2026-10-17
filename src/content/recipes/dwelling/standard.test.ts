import { describe, expect, it } from 'vitest'
import { checkChoice, checkLine } from '@/calc'
import { checkRecipe } from '../harness'
import { answerOf, expectRecipeMistakesNamed, line } from '../kitTesting'
import type { Appliance } from './common'
import {
  buildStandard, dwellingStandard, FALLBACK, pickStandard, standardIsRobust, standardNums, type StandardIn,
} from './standard'

const wh45: Appliance = { key: 'wh', name: 'water heater', motor: false, rating: { kind: 'kW', kw: 4.5 } }
const dw1200: Appliance = { key: 'dw', name: 'dishwasher', motor: false, rating: { kind: 'W', w: 1200 } }
const disp8: Appliance = { key: 'disp', name: 'food waste disposer', motor: true, hp: '1/2', rating: { kind: 'A', amps: 8, volts: 120 } }
const comp6: Appliance = { key: 'comp', name: 'trash compactor', motor: true, hp: '1/3', rating: { kind: 'A', amps: 6, volts: 120 } }

/** Annex D, Example D1(a): 1,500 ft², 12-kW range, 5.5-kW dryer, no other loads. */
const D1A: StandardIn = {
  lighting: { area: 1500, excluded: [], saCircuits: 2, saStated: true, laundry: true },
  appliances: [],
  dryer: { kind: 'kW', kw: 5.5 },
  rangeKW: 12,
}

/** Heat kept, four appliances, a 13.6-kW range, a 4-kW dryer. */
const HEAT_HOUSE: StandardIn = {
  lighting: { area: 2000, excluded: [{ name: 'attached garage', ft2: 480 }], saCircuits: 2, saStated: false, laundry: true },
  appliances: [wh45, dw1200, disp8, comp6],
  dryer: { kind: 'kW', kw: 4 },
  rangeKW: 13.6,
  heatKW: 15,
  acAmps: 24,
}

/** A/C kept, two appliances. */
const AC_HOUSE: StandardIn = {
  lighting: { area: 1600, excluded: [{ name: 'open porch', ft2: 120 }], saCircuits: 3, saStated: true, laundry: true },
  appliances: [
    { key: 'wh', name: 'water heater', motor: false, rating: { kind: 'kW', kw: 5 } },
    { key: 'dw', name: 'dishwasher', motor: false, rating: { kind: 'W', w: 1500 } },
  ],
  dryer: { kind: 'kW', kw: 5 },
  rangeKW: 11,
  heatKW: 5,
  acAmps: 32,
}

describe('dwelling-standard', () => {
  it('passes the recipe self-consistency checks', () => {
    checkRecipe(dwellingStandard, 80)
  })

  it('names every line-specific mistake', () => {
    expectRecipeMistakesNamed(dwellingStandard, 80)
  })

  it('reproduces Annex D Example D1(a): 18,600 VA, 77.5 A, 100 A service', () => {
    // By hand: 1,500 × 3 = 4,500; + 2 × 1,500 + 1,500 = 9,000 VA.
    // 9,000 − 3,000 = 6,000; × 0.35 = 2,100; + 3,000 = 5,100 VA.
    // Dryer 5.5 kW = 5,500 VA (more than 5,000). Range 12 kW: Column C, 1 range = 8 kW = 8,000 VA.
    // 5,100 + 5,500 + 8,000 = 18,600 VA; ÷ 240 = 77.5 A, rounded 78 A (220.5(B)); minimum 100 A.
    const p = buildStandard(D1A, 1)
    expect(line(p, 'lTotal').value).toBe(9000)
    expect(line(p, 'lDemand').value).toBeCloseTo(5100, 6)
    expect(line(p, 'dryer').value).toBe(5500)
    expect(line(p, 'rangeVA').value).toBe(8000)
    expect(line(p, 'total').value).toBeCloseTo(18600, 6)
    expect(line(p, 'amps').value).toBe(78)
    expect(checkLine(line(p, 'amps'), '77.5').ok).toBe(true)
    expect(checkLine(line(p, 'amps'), '78').ok).toBe(true)
    expect(answerOf(p)).toBe('100 A')
    // No motors, no heat or A/C, no fastened-in-place appliances: those lines are left out.
    expect(p.lines.some((l) => l.id === 'motor25' || l.id === 'fSum' || l.id === 'hKeep')).toBe(false)
    // 80 A would carry 77.5 A, but a one-family house is never under 100 A.
    const v = checkLine(line(p, 'service'), '80')
    expect(!v.ok && v.mistake).toBe('service_min_100')
  })

  it('heat kept, four appliances at 75%, Note 1 range, 25% of the disposer: 175 A', () => {
    // L: 2,000 × 3 = 6,000 (the 480 ft² garage is not counted); + 3,000 + 1,500 = 10,500;
    //    10,500 − 3,000 = 7,500; × 0.35 = 2,625; + 3,000 = 5,625 VA.
    // F: 4,500 + 1,200 + 8 × 120 (960) + 6 × 120 (720) = 7,380; four appliances: × 0.75 = 5,535 VA.
    // D: 4 kW = 4,000, under the floor: 5,000 VA.
    // R: 13.6 − 12 = 1.6 kW, a major fraction: 2 kW counted, 10%; 8 × 1.10 = 8.8 kW = 8,800 VA.
    // H: heat 15,000 against A/C 24 × 240 = 5,760: keep the heat, 15,000 VA.
    // Largest motor still in: the disposer, 960 × 0.25 = 240 VA.
    // Total 5,625 + 5,535 + 5,000 + 8,800 + 15,000 + 240 = 40,200 VA; ÷ 240 = 167.5 → 168 A → 175 A.
    const p = buildStandard(HEAT_HOUSE, 2)
    expect(line(p, 'lDemand').value).toBeCloseTo(5625, 6)
    expect(line(p, 'fSum').value).toBe(7380)
    expect(line(p, 'fFour').answerId).toBe('yes')
    expect(line(p, 'fDemand').value).toBeCloseTo(5535, 6)
    expect(line(p, 'dryer').value).toBe(5000)
    expect(line(p, 'rangeSteps').value).toBe(2)
    expect(line(p, 'rangeDemandKW').value).toBeCloseTo(8.8, 6)
    expect(line(p, 'hKeep').answerId).toBe('heat')
    expect(line(p, 'hLoad').value).toBe(15000)
    expect(line(p, 'motor25').value).toBeCloseTo(240, 6)
    expect(line(p, 'total').value).toBeCloseTo(40200, 6)
    expect(line(p, 'amps').value).toBe(168)
    expect(answerOf(p)).toBe('175 A')
  })

  it('A/C kept, two appliances at 100%, 25% of the A/C: 150 A', () => {
    // L: 1,600 × 3 = 4,800; three small-appliance circuits 4,500; laundry 1,500: 10,800;
    //    10,800 − 3,000 = 7,800; × 0.35 = 2,730; + 3,000 = 5,730 VA.
    // F: 5,000 + 1,500 = 6,500 VA, fewer than four: 100%.
    // D: 5 kW = 5,000 VA. R: 11 kW, not over 12: 8,000 VA.
    // H: heat 5,000 against A/C 32 × 240 = 7,680: keep the A/C. 25% of the A/C: 1,920 VA.
    // Total 5,730 + 6,500 + 5,000 + 8,000 + 7,680 + 1,920 = 34,830 VA; ÷ 240 = 145.1 → 145 A → 150 A.
    const p = buildStandard(AC_HOUSE, 3)
    expect(line(p, 'lDemand').value).toBeCloseTo(5730, 6)
    expect(line(p, 'fFour').answerId).toBe('no')
    expect(p.lines.some((l) => l.id === 'fDemand')).toBe(false)
    expect(line(p, 'hKeep').answerId).toBe('ac')
    expect(line(p, 'motor25').value).toBeCloseTo(1920, 6)
    expect(line(p, 'total').value).toBeCloseTo(34830, 6)
    expect(answerOf(p)).toBe('150 A')
  })

  it('names each classic slip by its own id', () => {
    const p = buildStandard(HEAT_HOUSE, 2)
    const expectSlip = (id: string, typed: string, mistake: string) => {
      const v = checkLine(line(p, id), typed)
      expect(v.ok, `${id} ${typed}`).toBe(false)
      if (!v.ok) expect(v.mistake, `${id} ${typed}`).toBe(mistake)
    }
    expectSlip('area', '2480', 'floor_area_extra')
    expectSlip('lTotal', '6000', 'missed_small_appliance')
    expectSlip('l35', '3675', 'demand_on_whole_load') // 10,500 × 0.35
    expectSlip('lDemand', '2625', 'forgot_first_step')
    expectSlip('fDemand', '7380', 'appliance_75_misused')
    expectSlip('dryer', '4000', 'dryer_minimum')
    expectSlip('rangeColC', '13.6', 'range_nameplate')
    expectSlip('rangeDemandKW', '8', 'range_note1')
    expectSlip('rangeSteps', '1', 'range_major_fraction')
    expectSlip('hLoad', '20760', 'added_both_heat_and_ac')
    expectSlip('hLoad', '5760', 'used_smaller_noncoincident')
    expectSlip('motor25', '1440', 'motor25_wrong_motor') // 25% of the dropped A/C
    expectSlip('amps', '335', 'wrong_voltage') // 40,200 ÷ 120
    expectSlip('service', '150', 'ocpd_rounded_down')
    const both = checkChoice(line(p, 'hKeep'), 'both')
    expect(!both.ok && both.mistake).toBe('added_both_heat_and_ac')
    const ac = checkChoice(line(p, 'hKeep'), 'ac')
    expect(!ac.ok && ac.mistake).toBe('used_smaller_noncoincident')
    const few = buildStandard(AC_HOUSE, 3)
    const yes = checkChoice(line(few, 'fFour'), 'yes')
    // Two appliances plus the range, dryer, heat and A/C make six "things": counting those is the slip.
    expect(!yes.ok && yes.mistake).toBe('appliance_excluded_counted')
    const dry = checkLine(line(buildStandard({ ...AC_HOUSE, dryer: { kind: 'W', w: 5600 } }, 4), 'dryer'), '5000')
    expect(!dry.ok && dry.mistake).toBe('dryer_nameplate_larger')
  })

  it('wrong exam options come from the slips (heat house)', () => {
    // Adding both: 40,200 + 5,760 = 45,960 VA ÷ 240 = 191.5 A → 200 A. Dividing by 120: 335 A → 350 A.
    const S = (f: Parameters<typeof standardNums>[1]) => standardNums(HEAT_HOUSE, f).service
    expect(S({ bothHvac: true })).toBe(200)
    expect(S({ by120: true })).toBe(350)
    const p = buildStandard(HEAT_HOUSE, 2)
    for (const c of p.choices) if (!c.correct) expect(c.mistake).toBeTruthy()
  })

  it('the 25% motor line never changes the service size, nor does the 220.5(B) rounding', () => {
    for (let s = 1; s <= 400; s++) {
      const inp = pickStandard(s)
      expect(standardIsRobust(inp), `seed ${s}`).toBe(true)
      const a = standardNums(inp)
      const b = standardNums(inp, { noMotor25: true })
      expect(a.service, `seed ${s}`).toBe(b.service)
      if (a.heatVA > 0 && a.acVA > 0) expect(Math.max(a.heatVA, a.acVA) / Math.min(a.heatVA, a.acVA)).toBeGreaterThanOrEqual(1.3)
    }
    expect(standardIsRobust(FALLBACK)).toBe(true)
  })

  it('the generator covers the main cases', () => {
    const seen = new Set<string>()
    for (let s = 1; s <= 300; s++) {
      const p = dwellingStandard.generate(s)
      const keep = p.lines.find((l) => l.id === 'hKeep')?.answerId
      if (keep) seen.add(`keep-${keep}`)
      if (p.lines.some((l) => l.id === 'fDemand')) seen.add('75%')
      if (p.lines.some((l) => l.id === 'rangePct')) seen.add('note1')
      if (p.lines.some((l) => l.id === 'motor25')) seen.add('motor25')
      seen.add(answerOf(p))
    }
    for (const k of ['keep-heat', 'keep-ac', '75%', 'note1', 'motor25', '100 A', '150 A', '200 A']) expect(seen.has(k), k).toBe(true)
  })
})
