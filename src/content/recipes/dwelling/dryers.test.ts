import { describe, expect, it } from 'vitest'
import { checkLine } from '@/calc'
import { checkRecipe } from '../harness'
import { answerOf, expectRecipeMistakesNamed, line } from '../kitTesting'
import { buildDryers, dwellingDryers } from './dryers'

describe('dwelling-dryers', () => {
  it('passes the recipe self-consistency checks', () => {
    checkRecipe(dwellingDryers, 80)
  })

  it('names every line-specific mistake', () => {
    expectRecipeMistakesNamed(dwellingDryers, 80)
  })

  it('10 dryers at 4.5 kW: 5,000 VA each, 50%: 25,000 VA; the slips are named', () => {
    // By hand: 4.5 kW = 4,500 VA, under the floor: 5,000 VA each. 10 × 5,000 = 50,000 VA.
    // Table 220.54, 10 dryers: 50%. 50,000 × 0.5 = 25,000 VA.
    const p = buildDryers({ n: 10, rating: { kind: 'kW', kw: 4.5 } }, 1)
    expect(line(p, 'each').value).toBe(5000)
    expect(line(p, 'pct').value).toBe(50)
    expect(answerOf(p)).toBe('25,000 VA')
    const slip = (id: string, typed: string, mistake: string) => {
      const v = checkLine(line(p, id), typed)
      expect(!v.ok && v.mistake, `${id} ${typed}`).toBe(mistake)
    }
    slip('each', '4500', 'dryer_minimum')
    slip('connected', '45000', 'dryer_minimum')
    slip('pct', '100', 'demand_factor_missed')
    slip('pct', '55', 'wrong_table_row') // the row for 9 dryers
    slip('demand', '50000', 'demand_factor_missed')
  })

  it('16 dryers at 5.5 kW: 47% − 5% = 42%: 36,960 VA', () => {
    // By hand: 5,500 VA each (over 5,000). 16 × 5,500 = 88,000 VA. 12 to 23 dryers: 47% less 1% per dryer
    // over 11: 16 − 11 = 5, so 42%. 88,000 × 0.42 = 36,960 VA.
    const p = buildDryers({ n: 16, rating: { kind: 'kW', kw: 5.5 } }, 2)
    expect(line(p, 'pct').value).toBe(42)
    expect(answerOf(p)).toBe('36,960 VA')
    const v = checkLine(line(p, 'each'), '5000')
    expect(!v.ok && v.mistake).toBe('dryer_nameplate_larger')
  })

  it('30 dryers at 5 kW: 35% − 3.5% = 31.5%: 47,250 VA', () => {
    // By hand: 30 × 5,000 = 150,000 VA. 24 to 42 dryers: 35% less 0.5% per dryer over 23: 30 − 23 = 7,
    // 7 × 0.5 = 3.5, so 31.5%. 150,000 × 0.315 = 47,250 VA.
    const p = buildDryers({ n: 30, rating: { kind: 'kW', kw: 5 } }, 3)
    expect(line(p, 'pct').value).toBe(31.5)
    expect(answerOf(p)).toBe('47,250 VA')
  })

  it('3 dryers: 100%, so there is no demand line', () => {
    // By hand: 3 × 6,000 = 18,000 VA; one to four dryers: 100%.
    const p = buildDryers({ n: 3, rating: { kind: 'kW', kw: 6 } }, 4)
    expect(p.lines.some((l) => l.id === 'demand')).toBe(false)
    expect(answerOf(p)).toBe('18,000 VA')
  })
})
