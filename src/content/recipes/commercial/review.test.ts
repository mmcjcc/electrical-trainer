/**
 * One test per item of the architect's review of 2026-10-17 that touches the commercial recipes
 * (items 4, 11 and 12). Item numbers follow the architect's message.
 */
import { describe, expect, it } from 'vitest'
import { checkLine } from '@/calc'
import { REF } from '@/data/refs'
import { REF_LOAD } from '@/data/loadExtra'
import { answerOf, line } from '../kitTesting'
import { buildKitchen } from './kitchen'
import { buildStore, commercialStore, D3_STORE, pickStore, storeNums, type StoreIn } from './store'

/** An office where 1 VA per ft² beats the receptacles after demand. */
const BIG_OFFICE: StoreIn = {
  occupancy: 'office', length: 200, width: 150, dims: true, receptacles: 80, sign: false, phase: 3, volts: 208, supply: 'service',
}

describe('review 2026-10-17, commercial recipes', () => {
  it('4a. office buildings: receptacles are the larger of 220.14(I) after demand and 1 VA/ft² (220.14(K))', () => {
    // By hand: 200 × 150 = 30,000 ft². Lighting 30,000 × 1.3 = 39,000 VA. Receptacles 80 × 180 = 14,400;
    // − 10,000 = 4,400 × 0.5 = 2,200 + 10,000 = 12,200 VA; the office minimum is 30,000 × 1 = 30,000 VA,
    // larger: 30,000 VA. Total 39,000 + 30,000 = 69,000 VA ÷ (208 × 1.732 = 360.256) = 191.5 A → 192 A → 200 A.
    const p = buildStore(BIG_OFFICE, 1)
    expect(line(p, 'recDemand').value).toBe(12200)
    expect(line(p, 'recOffice').value).toBe(30000)
    expect(line(p, 'recLoad').value).toBe(30000)
    expect(line(p, 'recLoad').ref?.loc).toBe('220.14(K)')
    expect(line(p, 'total').value).toBe(69000)
    expect(answerOf(p)).toBe('200 A')
    const v = checkLine(line(p, 'recLoad'), '12200')
    expect(!v.ok && v.mistake).toBe('office_receptacle_minimum')
    // Both sides of the comparison win in generated offices; stores never get the line.
    let officeMin = 0
    let countWins = 0
    for (let s = 1; s <= 400; s++) {
      const inp = pickStore(s)
      const n = storeNums(inp)
      if (inp.occupancy === 'office') {
        if (n.recOffice > n.recDemand) officeMin++
        else countWins++
      } else {
        expect(n.recOffice).toBe(0)
      }
    }
    expect(officeMin).toBeGreaterThan(0)
    expect(countWins).toBeGreaterThan(0)
    expect(buildStore(D3_STORE, 2).lines.some((l) => l.id === 'recLoad')).toBe(false)
  })

  it('4b. the sum with continuous loads at 125% is the sizing load, cited to 230.42(A)(1) or 215.2(A)(1)/215.3', () => {
    const svc = buildStore(D3_STORE, 1)
    expect(line(svc, 'total').label).toBe('Load for sizing the service (continuous loads at 125%)')
    expect(line(svc, 'total').why).toContain(REF.nonDwellingLighting.loc)
    expect(line(svc, 'total').why).toContain('already includes the 125%')
    expect(line(svc, 'total').why).toContain('compared at 125%')
    for (const id of ['actual125', 'sw125', 'sign125', 'total']) expect(line(svc, id).ref?.loc, id).toBe(REF_LOAD.serviceConductors.loc)
    expect(svc.story).toContain('service overcurrent device')
    const fdr = buildStore({ ...D3_STORE, supply: 'feeder' }, 1)
    expect(line(fdr, 'total').label).toBe('Load for sizing the feeder (continuous loads at 125%)')
    for (const id of ['actual125', 'sw125', 'sign125', 'total']) expect(line(fdr, id).ref?.loc, id).toBe(REF.continuousFeederOcpd.loc)
    expect(line(fdr, 'total').why).toContain(REF.continuousFeeder.loc)
    expect(fdr.story).toContain('feeder overcurrent device')
    // Same numbers either way: D3's 30,320 VA → 126 A → 150 A.
    expect(answerOf(fdr)).toBe('150 A')
    const kinds = new Set(Array.from({ length: 200 }, (_, i) => commercialStore.generate(i + 1).ask))
    expect(kinds.size).toBe(2)
  })

  it('11. the kitchen exclusions and the two-largest floor cite 220.56; the say names thermostatic or intermittent use', () => {
    const p = buildKitchen({
      items: [{ name: 'range', kw: 18 }, { name: 'dishwasher booster heater', kw: 18 }, { name: 'coffee urn', kw: 3 }],
      vent: { name: 'kitchen exhaust fan', kw: 2 },
    }, 1)
    expect(line(p, 'kSum').ref?.loc).toBe('220.56')
    expect(line(p, 'kSum').say).toContain('thermostatic control or intermittent use')
    expect(line(p, 'kSum').say).toContain('exhaust fan')
    expect(line(p, 'kTwo').ref?.loc).toBe('220.56')
    expect(line(p, 'kResult').ref?.loc).toBe('220.56')
    expect(line(p, 'kPct').ref?.loc).toBe(REF.kitchenEquipment.loc) // the percent is in the table
  })

  it('12. the store "left at 100%" option names only the continuous loads in the story', () => {
    // A show window but no sign: 30 × 200 = 6,000 × 1.25 = 7,500 VA; left at 100% the total is 1,500 VA low.
    const p = buildStore({ ...D3_STORE, sign: false }, 3)
    const texts = [
      ...p.choices.filter((c) => c.mistake === 'forgot_125_continuous').map((c) => c.why ?? ''),
      ...p.lines.flatMap((l) => (l.mistakes ?? []).filter((m) => m.mistake === 'forgot_125_continuous' && l.id === 'total').map((m) => m.message)),
    ]
    expect(texts.length).toBeGreaterThan(0)
    for (const t of texts) {
      expect(t).toContain('show window')
      expect(t).not.toContain('sign')
    }
  })
})
