import { describe, expect, it } from 'vitest'
import { checkLine } from '@/calc'
import { checkRecipe } from '../harness'
import { answerOf, expectRecipeMistakesNamed, line } from '../kitTesting'
import { buildKitchen, commercialKitchen } from './kitchen'

describe('commercial-kitchen', () => {
  it('passes the recipe self-consistency checks', () => {
    checkRecipe(commercialKitchen, 80)
  })

  it('names every line-specific mistake', () => {
    expectRecipeMistakesNamed(commercialKitchen, 80)
  })

  it('five units: 36.5 kW × 70% = 25.55 kW, more than the two largest (22 kW)', () => {
    // By hand: 12 + 10 + 2 + 4.5 + 8 = 36.5 kW. Table 220.56, 5 units: 70%. 36.5 × 0.7 = 25.55 kW.
    // Two largest: 12 + 10 = 22 kW, smaller. Answer 25.55 kW.
    const p = buildKitchen({ items: [{ name: 'fryer', kw: 12 }, { name: 'steam kettle', kw: 10 }, { name: 'food warmer', kw: 2 }, { name: 'coffee urn', kw: 4.5 }, { name: 'convection oven', kw: 8 }] }, 1)
    expect(line(p, 'kPct').value).toBe(70)
    expect(line(p, 'kTwo').value).toBe(22)
    expect(answerOf(p)).toBe('25.55 kW')
  })

  it('three units, two big ones: 39 × 90% = 35.1 kW, but the two largest are 36 kW', () => {
    // By hand: 18 + 18 + 3 = 39 kW; 3 units: 90%; 39 × 0.9 = 35.1 kW. Two largest: 18 + 18 = 36 kW.
    // The demand is never less than the two largest: 36 kW.
    const p = buildKitchen({ items: [{ name: 'range', kw: 18 }, { name: 'dishwasher booster heater', kw: 18 }, { name: 'coffee urn', kw: 3 }] }, 2)
    expect(line(p, 'kDemand').value).toBeCloseTo(35.1, 9)
    expect(answerOf(p)).toBe('36 kW')
    const v = checkLine(line(p, 'kResult'), '35.1')
    expect(!v.ok && v.mistake).toBe('kitchen_two_largest')
  })

  it('an exhaust fan is not kitchen equipment; six or more units are 65%', () => {
    // By hand: 10 + 9 + 7.5 + 6 + 12 + 5 = 49.5 kW; 6 units: 65%; 49.5 × 0.65 = 32.175 kW.
    // Two largest 12 + 10 = 22 kW. Answer 32.175 kW. The 2-kW exhaust fan is left out.
    const p = buildKitchen({
      items: [{ name: 'range', kw: 10 }, { name: 'fryer', kw: 9 }, { name: 'griddle', kw: 7.5 }, { name: 'convection oven', kw: 6 }, { name: 'water heater', kw: 12 }, { name: 'dishwasher', kw: 5 }],
      vent: { name: 'kitchen exhaust fan', kw: 2 },
    }, 3)
    expect(line(p, 'kPct').value).toBe(65)
    expect(answerOf(p)).toBe('32.175 kW')
    const slip = (id: string, typed: string, mistake: string) => {
      const v = checkLine(line(p, id), typed)
      expect(!v.ok && v.mistake, `${id} ${typed}`).toBe(mistake)
    }
    slip('kSum', '51.5', 'kitchen_counted_hvac')
    slip('kCount', '7', 'kitchen_counted_hvac')
    slip('kPct', '100', 'demand_factor_missed')
    slip('kResult', '49.5', 'demand_factor_missed')
  })
})
