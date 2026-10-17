/**
 * One test per item of the architect's review of 2026-10-17 (Antigravity's sample review, each claim
 * checked by the architect). Item numbers follow the architect's message.
 */
import { describe, expect, it } from 'vitest'
import { REF } from '@/data/refs'
import { REF_LOAD } from '@/data/loadExtra'
import type { ProblemInstance, Recipe } from '@/shared/types'
import { line } from '../kitTesting'
import { buildAppliances, dwellingAppliances } from './appliances'
import { MAJOR_FRACTION_RULE, type Appliance } from './common'
import { dwellingDryers } from './dryers'
import { buildLightingSlice } from './lighting'
import { buildMulti, D4B_20 } from './multifamily'
import { buildOptional, dwellingOptional, OPTIONAL_FALLBACK, optionalNums } from './optional'
import { buildRangeSlice } from './range'
import { buildRangesMulti, dwellingRangesMulti } from './rangesMulti'
import { buildStandard, dwellingStandard, type StandardIn } from './standard'

const seeds = (r: Recipe, n: number): ProblemInstance[] => Array.from({ length: n }, (_, i) => r.generate(i + 1))
const has = (p: ProblemInstance, id: string) => p.lines.some((l) => l.id === id)

const disp: Appliance = { key: 'disp', name: 'food waste disposer', motor: true, hp: '1/2', rating: { kind: 'A', amps: 8, volts: 120 } }
const pool: Appliance = { key: 'pool', name: 'pool pump', motor: true, hp: '1-1/2', rating: { kind: 'A', amps: 10, volts: 240 } }
const wh: Appliance = { key: 'wh', name: 'water heater', motor: false, rating: { kind: 'kW', kw: 4.5 } }
const dw: Appliance = { key: 'dw', name: 'dishwasher', motor: false, rating: { kind: 'W', w: 1200 } }

/** Heat kept; four appliances (the pool pump in bucket F at 75%). */
const HEAT_POOL: StandardIn = {
  lighting: { area: 2000, excluded: [], saCircuits: 2, saStated: true, laundry: true },
  appliances: [wh, dw, disp, pool],
  dryer: { kind: 'kW', kw: 5 },
  rangeKW: 12,
  heatKW: 15,
  acAmps: 20,
}

describe('review 2026-10-17, dwelling recipes', () => {
  it('1. motor appliances are given in amps × volts only (no hp), and their lines say "nameplate"', () => {
    for (const r of [dwellingStandard, dwellingAppliances, dwellingOptional]) {
      for (const p of seeds(r, 150)) {
        expect(p.story, `${r.id} seed ${p.seed}`).not.toMatch(/\bhp\b|-hp/)
        for (const l of p.lines) {
          if (l.id.startsWith('f_') && l.expr && / × (120|240)$/.test(l.expr)) {
            expect(l.why, `${r.id} ${l.id}`).toContain('nameplate rating')
            expect(l.why).toContain(`${REF.motorFlcUse.loc}, Exception No. 3`)
          }
        }
      }
    }
  })

  it('2. 220.60: the A/C (largest motor) is compared at 125%; when it is kept, there is no separate 25% line', () => {
    let keptAc = 0
    let keptHeat = 0
    for (const p of seeds(dwellingStandard, 400)) {
      if (!has(p, 'acVA')) {
        expect(has(p, 'ac125')).toBe(false)
        continue
      }
      const ac = line(p, 'acVA').value as number
      expect(line(p, 'ac125').value).toBeCloseTo(ac * 1.25, 6)
      if (has(p, 'hKeep')) {
        const heat = line(p, 'heatVA').value as number
        // The 30% margin at 100% means comparing the A/C at 100% or at 125% keeps the same one.
        expect(Math.max(heat, ac) / Math.min(heat, ac), `seed ${p.seed}`).toBeGreaterThanOrEqual(1.3)
        expect(line(p, 'hLoad').value).toBeCloseTo(Math.max(heat, ac * 1.25), 6)
        if (line(p, 'hKeep').answerId === 'ac') keptAc++
        else keptHeat++
      }
      const acKept = !has(p, 'hKeep') || line(p, 'hKeep').answerId === 'ac'
      if (acKept) expect(has(p, 'motor25'), `seed ${p.seed}`).toBe(false)
      else if (has(p, 'motor25')) expect(line(p, 'motor25').say).not.toContain('compressor')
    }
    expect(keptAc).toBeGreaterThan(0)
    expect(keptHeat).toBeGreaterThan(0)
  })

  it('3. the 25% line says 430.24 wants 125% and adds 25% of the rating (no claim its 100% is "already above")', () => {
    // By hand: heat 15,000 against the A/C 20 × 240 × 1.25 = 6,000: keep the heat. The largest motor left is the
    // pool pump, 10 × 240 = 2,400 VA, which sits in bucket F at 75%. The 25% line adds 2,400 × 0.25 = 600 VA.
    const p = buildStandard(HEAT_POOL, 1)
    const m = line(p, 'motor25')
    expect(m.value).toBe(600)
    expect(m.why).toContain(`${REF.motorFeeder.loc} wants the largest motor at 125%`)
    expect(m.why).toContain(REF.annexD1b.loc)
    expect(m.why).not.toMatch(/already/)
  })

  it('5. the minimum service line cites the standard sizes (240.6(A)) and names 230.79(C) for the 100 A floor', () => {
    for (const p of [...seeds(dwellingStandard, 20), ...seeds(dwellingOptional, 20)]) {
      const s = line(p, 'service')
      expect(s.ref?.loc).toBe(REF.standardOcpd.loc)
      expect(s.say).toContain(REF.minServiceDwelling.loc)
      expect(s.say).toContain(REF.standardOcpd.loc)
    }
  })

  it('6. optional method: 220.82(B)(1)/(B)(2) on the area and circuit lines; no double-counted heat pump option', () => {
    for (const p of seeds(dwellingOptional, 40)) {
      expect(line(p, 'area').ref?.loc).toBe(REF_LOAD.optionalFloorArea.loc)
      expect(line(p, 'glVA').ref?.loc).toBe(REF_LOAD.optionalFloorArea.loc)
      expect(line(p, 'saVA').ref?.loc).toBe(REF_LOAD.optionalCircuits.loc)
      expect(line(p, 'laundryVA').ref?.loc).toBe(REF_LOAD.optionalCircuits.loc)
    }
    // Example D2(c): heat pump 5,760 VA + 65% of 15,000 = 15,510 VA. Adding the cooling choice (5,760) to
    // the heating choice (15,510) would count the compressor twice: 21,270 VA must not be offered.
    const p = buildOptional(OPTIONAL_FALLBACK, 3)
    expect(line(p, 'hvac').mistakes?.some((m) => Math.abs(m.value - 21270) < 1)).toBe(false)
    expect(p.choices.some((c) => c.mistake === 'added_both_heat_and_ac')).toBe(false)
    expect(optionalNums(OPTIONAL_FALLBACK, { bothHvac: true }).hvac).toBe(15510)
    // The realistic heat-pump slip is the backup heat at 100%: 5,760 + 15,000 = 20,760 VA.
    expect(line(p, 'hvac').mistakes?.find((m) => m.value === 20760)?.mistake).toBe('optional_heat_pct')
    for (const q of seeds(dwellingOptional, 200)) {
      if (has(q, 'hpSel')) expect(q.choices.some((c) => c.mistake === 'added_both_heat_and_ac'), `seed ${q.seed}`).toBe(false)
    }
  })

  it('7. unequal ranges cite Note 2, and the "kW over 12" line subtracts the average as its line shows it', () => {
    // By hand: 6 × 12 (9-kW ranges count as 12) = 72; 11 × 14 = 154; 226 ÷ 17 = 13.294 → 13.29 kW.
    // 13.29 − 12 = 1.29 kW: 1 kW counted, 5%. Column C, 17 ranges = 32 kW × 1.05 = 33.6 kW.
    const p = buildRangesMulti({ groups: [{ count: 6, kw: 9 }, { count: 11, kw: 14 }] }, 1)
    expect(line(p, 'avg').value).toBe(13.29)
    expect(line(p, 'avg').display).toBe('13.29 kW')
    expect(line(p, 'excess').operands?.a).toBe(13.29)
    expect(line(p, 'excess').expr).toBe('13.29 − 12')
    for (const id of ['over12', 'excess', 'steps', 'pct', 'demand']) expect(line(p, id).ref?.loc, id).toBe(REF_LOAD.rangeNote2.loc)
    expect(line(p, 'demand').label).toBe('Range demand with Note 2')
    expect(line(p, 'demand').value).toBeCloseTo(33.6, 9)
    // Equal ratings stay on Note 1.
    const e = buildRangesMulti({ groups: [{ count: 24, kw: 16 }] }, 2)
    expect(line(e, 'demand').ref?.loc).toBe(REF_LOAD.rangeNote1.loc)
    expect(line(e, 'demand').label).toBe('Range demand with Note 1')
  })

  it('8. "major fraction" is said one way: half a kW or more (0.5 and up) counts as one more kW', () => {
    expect(MAJOR_FRACTION_RULE).toContain('0.5 and up')
    expect(MAJOR_FRACTION_RULE).toContain('less than half is dropped')
    expect(line(buildRangeSlice({ kw: 13.6, setting: 0 }, 1), 'rangeSteps').say).toBe(MAJOR_FRACTION_RULE)
    for (const p of [...seeds(dwellingRangesMulti, 100), ...seeds(dwellingStandard, 100)]) {
      for (const l of p.lines) expect(`${l.say} ${l.why ?? ''}`).not.toMatch(/0\.6, 0\.7|0\.1 to 0\.4/)
    }
  })

  it('9. the fastened-in-place lines name what 2020 220.53 leaves out and the 1/4 hp or 500 W threshold', () => {
    const p = buildAppliances({ appliances: [wh, dw, disp], others: [4] }, 1)
    const four = line(p, 'fFour')
    for (const words of ['1/4 hp', '500 W', 'wall ovens', 'cooktops', 'clothes dryers', 'space heating', 'A/C']) expect(four.say).toContain(words)
    expect(line(p, 'fSum').why).toContain(REF.fixedAppliances.loc)
    const s = buildStandard(HEAT_POOL, 1)
    expect(line(s, 'fFour').say).toContain('wall ovens')
    expect(line(s, 'fSum').say).toContain('1/4 hp or 500 W')
  })

  it('10. the dryer and several-range stories say the building is served at 120/240 V, single-phase', () => {
    for (const p of [...seeds(dwellingDryers, 60), ...seeds(dwellingRangesMulti, 60)]) {
      expect(p.story, `${p.recipeId} seed ${p.seed}`).toContain('served at 120/240 V, single-phase')
    }
  })

  it('12. wrong-option texts match the story', () => {
    // A whole kW over 12 has nothing to round: no "major fraction" option or line slip for a 13-kW range.
    const r = buildRangeSlice({ kw: 13, setting: 0 }, 1)
    expect(r.choices.some((c) => c.mistake === 'range_major_fraction')).toBe(false)
    expect(r.lines.some((l) => l.mistakes?.some((m) => m.mistake === 'range_major_fraction'))).toBe(false)
    // The only excluded item is a wall oven: the texts name it, not a range, dryer or A/C.
    const a = buildAppliances({ appliances: [wh, dw, disp, pool], others: [4] }, 2)
    const texts = [
      ...a.choices.filter((c) => c.mistake === 'appliance_excluded_counted').map((c) => c.why ?? ''),
      ...a.lines.flatMap((l) => (l.mistakes ?? []).filter((m) => m.mistake === 'appliance_excluded_counted').map((m) => m.message)),
    ]
    expect(texts.length).toBeGreaterThan(0)
    for (const t of texts) {
      expect(t).toContain('wall-mounted oven')
      expect(t).not.toMatch(/range|dryer|A\/C|air conditioner/)
    }
    // No dryers in the building: the standard-rules texts do not mention a dryer.
    const m = buildMulti(D4B_20, 3)
    const std = [
      ...m.choices.filter((c) => c.mistake === 'optional_used_standard_rules').map((c) => c.why ?? ''),
      ...m.lines.flatMap((l) => (l.mistakes ?? []).filter((x) => x.mistake === 'optional_used_standard_rules').map((x) => x.message)),
    ]
    expect(std.length).toBeGreaterThan(0)
    for (const t of std) expect(t).not.toMatch(/dryer/)
    // Only an open porch is left out: the floor-area option names the porch, not a garage.
    const l = buildLightingSlice({ lighting: { area: 1500, excluded: [{ name: 'open porch', ft2: 200 }], saCircuits: 2, saStated: true, laundry: true }, others: [] }, 4)
    const fa = l.choices.find((c) => c.mistake === 'floor_area_extra')
    expect(fa?.why).toContain('open porch')
    expect(fa?.why).not.toContain('garage')
    // A heat pump house: the "in the pile" texts name the heat pump, not an A/C.
    const o = buildOptional(OPTIONAL_FALLBACK, 5)
    const pile = o.lines.flatMap((x) => (x.mistakes ?? []).filter((y) => y.mistake === 'optional_hvac_in_pile').map((y) => y.message))
    expect(pile.length).toBeGreaterThan(0)
    for (const t of pile) {
      expect(t).toContain('heat pump')
      expect(t).not.toContain('A/C')
    }
  })

  it('13. the lighting + small-appliance + laundry line cites 220.52 and names Table 220.42', () => {
    const p = buildStandard(HEAT_POOL, 1)
    expect(line(p, 'lTotal').ref?.loc).toBe('220.52')
    expect(line(p, 'lTotal').why).toContain(REF.lightingDemand.loc)
  })
})
