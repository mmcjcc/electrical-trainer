import { describe, expect, it } from 'vitest'
import {
  NUMBER_DRILLS, PCT_FACTS, ROUND_SIZE, SPLITS, SYSTEMS, amps220Item, boxItem, checkDrillAnswer, continuousItem,
  divisorItem, getNumberDrill, kwItem, motorFeederItem, note7Item, percentItem, rangeBoostItem, thresholdItem,
  type DrillItem,
} from './numberDrills'

const split = (id: string) => SPLITS.find((s) => s.id === id)!
const system = (id: string) => SYSTEMS.find((s) => s.id === id)!

describe('every drill round', () => {
  for (const drill of NUMBER_DRILLS) {
    it(`${drill.id}: ten distinct, self-consistent items for 60 seeds`, () => {
      for (let seed = 1; seed <= 60; seed++) {
        const items = drill.generate(seed)
        expect(items).toHaveLength(ROUND_SIZE)
        expect(new Set(items.map((i) => i.key)).size).toBe(ROUND_SIZE)
        expect(drill.generate(seed)).toEqual(items)
        for (const item of items) checkItem(item)
      }
    })
  }
  it('finds drills by id', () => {
    expect(getNumberDrill('divisor')?.title).toBe('Pick the divisor')
    expect(getNumberDrill('nope')).toBeUndefined()
  })
})

function checkItem(item: DrillItem) {
  expect(item.prompt.length).toBeGreaterThan(3)
  expect(item.explain.length).toBeGreaterThan(5)
  if (item.kind === 'choice') {
    expect(item.options && item.options.length >= 2).toBe(true)
    expect(new Set(item.options).size).toBe(item.options!.length)
    expect(item.options).toContain(item.answer)
    expect(checkDrillAnswer(item, item.answer).ok).toBe(true)
    for (const o of item.options!) if (o !== item.answer) expect(checkDrillAnswer(item, o).ok).toBe(false)
  } else {
    expect(Number.isFinite(item.value)).toBe(true)
    expect(checkDrillAnswer(item, String(item.value)).ok, `${item.key} accepts ${item.value}`).toBe(true)
    for (const w of item.wrongs ?? []) {
      expect(Math.abs(w.value - item.value!) > 1e-9, `${item.key}: wrong value equals the answer`).toBe(true)
      expect(checkDrillAnswer(item, String(w.value)).ok).toBe(false)
    }
  }
}

describe('percent → multiplier (hand-worked)', () => {
  it('125% is × 1.25; 125 and 0.25 are named', () => {
    const item = percentItem({ pct: 125, context: 'continuous' })
    expect(checkDrillAnswer(item, '1.25').ok).toBe(true)
    expect(checkDrillAnswer(item, '125').message).toMatch(/out of 100/)
    expect(checkDrillAnswer(item, '0.25').message).toMatch(/only the extra 25%/)
  })
  it('35% is × 0.35, typed with or without the leading zero', () => {
    const item = percentItem({ pct: 35, context: 'lighting' })
    expect(checkDrillAnswer(item, '.35').ok).toBe(true)
    expect(checkDrillAnswer(item, '0.35').ok).toBe(true)
    expect(checkDrillAnswer(item, '1.35').message).toMatch(/adds 35% on top/)
  })
  it('a 14 kW range: 2 kW over × 5% = 10% more, × 1.1', () => {
    const item = rangeBoostItem(14)
    expect(item.value).toBeCloseTo(1.1, 9)
    expect(checkDrillAnswer(item, '1.1').ok).toBe(true)
    expect(checkDrillAnswer(item, '.1').ok).toBe(false)
  })
  it('the code percents come from the tables', () => {
    const pcts = PCT_FACTS.map((f) => f.pct)
    for (const p of [35, 40, 50, 75, 80, 70, 125, 115, 250, 175, 300, 167, 85]) expect(pcts).toContain(p)
  })
  it('unreadable input is flagged, not judged', () => {
    const v = checkDrillAnswer(percentItem({ pct: 80, context: 'x' }), '')
    expect(v).toMatchObject({ ok: false, unreadable: true })
  })
})

describe('pick the divisor (hand-worked)', () => {
  it('45,000 VA at 208Y/120 V three-phase: ÷ 360 = 125 A', () => {
    const item = divisorItem(system('208-3'), 45000)
    expect(item.answer).toBe('÷ 360')
    expect(item.explain).toContain('45,000 ÷ 360 = 125 A')
    expect(checkDrillAnswer(item, '÷ 208').message).toMatch(/single-phase number/)
  })
  it('a house at 120/240 V: ÷ 240; picking a three-phase divisor is named', () => {
    const item = divisorItem(system('240-1'), 24000)
    expect(item.answer).toBe('÷ 240')
    expect(checkDrillAnswer(item, '÷ 416').message).toMatch(/1\.732 built in/)
  })
  it('480Y/277 V three-phase: ÷ 831', () => {
    expect(divisorItem(system('480-3'), 83100).answer).toBe('÷ 831')
  })
})

describe('threshold split (hand-worked)', () => {
  it('dwelling lighting 12,300 VA: 12,300 − 3,000 = 9,300; × 0.35 = 3,255; + 3,000 = 6,255 VA', () => {
    const item = thresholdItem(split('lighting'), 12300)
    expect(item.value).toBe(6255)
    expect(item.explain).toContain('9,300')
    expect(checkDrillAnswer(item, '6255').ok).toBe(true)
    expect(checkDrillAnswer(item, '4305').message).toMatch(/whole load/)
    expect(checkDrillAnswer(item, '3255').message).toMatch(/add the first 3,000 VA back/)
  })
  it('non-dwelling receptacles 24,000 VA: 10,000 + 14,000 × 0.5 = 17,000 VA', () => {
    expect(thresholdItem(split('receptacles'), 24000).value).toBe(17000)
  })
  it('optional method 30,000 VA: 10,000 + 20,000 × 0.4 = 18,000 VA', () => {
    expect(thresholdItem(split('optional'), 30000).value).toBe(18000)
  })
})

describe('kW → VA (hand-worked)', () => {
  it('4.5 kW = 4,500 W; the slips are named', () => {
    const item = kwItem('water heater', 4.5, 'kW')
    expect(item.value).toBe(4500)
    expect(checkDrillAnswer(item, '4,500').ok).toBe(true)
    expect(checkDrillAnswer(item, '450').message).toMatch(/One zero short/)
    expect(checkDrillAnswer(item, '4.5').message).toMatch(/kilo/i)
  })
  it('112.5 kVA = 112,500 VA', () => {
    expect(kwItem('transformer', 112.5, 'kVA').value).toBe(112500)
  })
})

describe('keep or bump (hand-worked)', () => {
  it('220.5(B): 134.4 A drops to 134; 134.5 A goes up to 135', () => {
    expect(amps220Item(134.4).answer).toBe('Drop to 134 A')
    expect(amps220Item(134.5).answer).toBe('Round up to 135 A')
  })
  it('Note 7: 5.75 wires is 5; 5.8 is 6', () => {
    expect(note7Item(5.75).answer).toBe('Down to 5 wires')
    expect(note7Item(5.8).answer).toBe('Up to 6 wires')
  })
  it('a box that must hold 20.25 in³: the 21 in³ box, never the 18', () => {
    const item = boxItem(20.25, 18, 21)
    expect(item.answer).toBe('The 21 in³ box')
    expect(checkDrillAnswer(item, 'The 18 in³ box').ok).toBe(false)
  })
  it('a 42 A continuous load: 42 × 1.25 = 52.5 A, so a 60 A breaker', () => {
    const item = continuousItem(42)
    expect(item.options).toEqual(['50 A', '60 A'])
    expect(item.answer).toBe('60 A')
  })
  it('a motor feeder at 172 A: 150 A, never 175 A', () => {
    const item = motorFeederItem(172)
    expect(item.answer).toBe('150 A')
    expect(checkDrillAnswer(item, '175 A').message).toMatch(/does not get the next size up/)
  })
})
