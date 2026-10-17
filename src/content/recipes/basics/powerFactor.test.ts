import { describe, expect, it } from 'vitest'
import { checkChoice, checkLine } from '@/calc'
import { checkRecipe } from '../harness'
import { answerOf, expectRecipeMistakesNamed, line } from '../kitTesting'
import { buildPowerFactor, powerFactor } from './powerFactor'

describe('basics-power-factor', () => {
  it('passes the recipe self-consistency checks', () => {
    checkRecipe(powerFactor, 120)
  })

  it('names every line-specific mistake', () => {
    expectRecipeMistakesNamed(powerFactor, 120, { checkpoints: true })
  })

  it('240 V, 20 A, 4,080 W: 85%', () => {
    // By hand: VA = 240 × 20 = 4,800; PF = 4,080 ÷ 4,800 = 0.85 -> 85%.
    const p = buildPowerFactor({ form: 'pf', phase: 1, volts: 240, amps: 20, pf: 0.85, kva: 50 }, 1)
    expect(line(p, 'va').value).toBe(4800)
    expect(answerOf(p)).toBe('85%')
    const f = checkChoice(line(p, 'formula'), 'inv')
    expect(!f.ok && f.mistake).toBe('flipped_division')
  })

  it('63.75 kW at PF 0.85 is 75 kVA; 100 kVA at PF 0.8 is 80 kW', () => {
    // By hand: kVA = 63.75 ÷ 0.85 = 75. kW = 100 × 0.8 = 80.
    const a = buildPowerFactor({ form: 'kva', phase: 1, volts: 240, amps: 20, pf: 0.85, kva: 75 }, 2)
    expect(answerOf(a)).toBe('75 kVA')
    const v = checkLine(line(a, 'answer'), String(63.75 * 0.85))
    expect(!v.ok && v.mistake).toBe('pf_ignored')
    expect(answerOf(buildPowerFactor({ form: 'kw', phase: 1, volts: 240, amps: 20, pf: 0.8, kva: 100 }, 3))).toBe('80 kW')
  })

  it('1,440 W at 120 V and PF 0.8 draws 15 A', () => {
    // By hand: 120 × 0.8 = 96; 1,440 ÷ 96 = 15 A. Without the PF: 1,440 ÷ 120 = 12 A.
    const p = buildPowerFactor({ form: 'amps', phase: 1, volts: 120, amps: 15, pf: 0.8, kva: 50 }, 4)
    expect(answerOf(p)).toBe('15 A')
    const v = checkLine(line(p, 'answer'), '12')
    expect(!v.ok && v.mistake).toBe('pf_ignored')
  })
})
