import { describe, expect, it } from 'vitest'
import { checkLine } from '@/calc'
import { checkRecipe } from '../harness'
import { answerOf, expectRecipeMistakesNamed, line } from '../kitTesting'
import { buildLightingSlice, dwellingLightingDemand } from './lighting'

describe('dwelling-lighting-demand', () => {
  it('passes the recipe self-consistency checks', () => {
    checkRecipe(dwellingLightingDemand, 80)
  })

  it('names every line-specific mistake', () => {
    expectRecipeMistakesNamed(dwellingLightingDemand, 80)
  })

  it('reproduces the Annex D Example D1(a) lighting bucket: 9,000 VA becomes 5,100 VA', () => {
    // By hand: 1,500 × 3 = 4,500; + 3,000 + 1,500 = 9,000; − 3,000 = 6,000; × 0.35 = 2,100; + 3,000 = 5,100.
    const p = buildLightingSlice({ lighting: { area: 1500, excluded: [], saCircuits: 2, saStated: true, laundry: true }, others: [] }, 1)
    expect(line(p, 'lTotal').value).toBe(9000)
    expect(answerOf(p)).toBe('5,100 VA')
  })

  it('reproduces the Annex D Example D4(a) unit: 840 ft², two circuits, no laundry: 3,882 VA', () => {
    // By hand: 840 × 3 = 2,520; + 2 × 1,500 = 5,520; − 3,000 = 2,520; × 0.35 = 882; + 3,000 = 3,882.
    const p = buildLightingSlice({ lighting: { area: 840, excluded: [], saCircuits: 2, saStated: true, laundry: false }, others: [] }, 2)
    expect(p.lines.some((l) => l.id === 'laundryVA')).toBe(false)
    expect(line(p, 'lTotal').value).toBe(5520)
    expect(line(p, 'lDemand').value).toBeCloseTo(3882, 6)
  })

  it('2,000 ft², three small-appliance circuits, a garage left out: 6,150 VA; the slips are named', () => {
    // By hand: 2,000 × 3 = 6,000; + 3 × 1,500 = 4,500; + 1,500 = 12,000; − 3,000 = 9,000;
    // × 0.35 = 3,150; + 3,000 = 6,150 VA.
    const p = buildLightingSlice({ lighting: { area: 2000, excluded: [{ name: 'attached garage', ft2: 480 }], saCircuits: 3, saStated: true, laundry: true }, others: ['a 12-kW range'] }, 3)
    expect(answerOf(p)).toBe('6,150 VA')
    const slip = (id: string, typed: string, mistake: string) => {
      const v = checkLine(line(p, id), typed)
      expect(!v.ok && v.mistake, `${id} ${typed}`).toBe(mistake)
    }
    slip('area', '2480', 'floor_area_extra')
    slip('lTotal', '7500', 'missed_small_appliance') // 6,000 + 1,500: the small-appliance circuits left out
    slip('l35', '4200', 'demand_on_whole_load') // 12,000 × 0.35
    slip('lDemand', '3150', 'forgot_first_step')
    slip('lDemand', '12000', 'demand_factor_missed')
    const c = p.choices.find((x) => x.mistake === 'demand_on_whole_load')
    expect(c, 'a 35%-of-the-whole option is offered').toBeTruthy()
  })

  it('keeps the half VA: 1,850 ft² gives 5,467.5 VA', () => {
    // By hand: 1,850 × 3 = 5,550; + 3,000 + 1,500 = 10,050; − 3,000 = 7,050; × 0.35 = 2,467.5; + 3,000 = 5,467.5.
    const p = buildLightingSlice({ lighting: { area: 1850, excluded: [], saCircuits: 2, saStated: false, laundry: true }, others: [] }, 4)
    expect(line(p, 'saCount').kind).toBe('lookup')
    expect(answerOf(p)).toBe('5,467.5 VA')
  })
})
