import { describe, expect, it } from 'vitest'
import { checkChoice, checkLine } from '@/calc'
import { checkRecipe } from '../harness'
import { answerOf, expectRecipeMistakesNamed, line } from '../kitTesting'
import { buildThreePhase, threePhaseCurrent } from './threePhase'

const base = { kva: 45, kw: 50, pf: 0.85, amps: 60 }

describe('basics-three-phase', () => {
  it('passes the recipe self-consistency checks', () => {
    checkRecipe(threePhaseCurrent, 120)
  })

  it('names every line-specific mistake', () => {
    expectRecipeMistakesNamed(threePhaseCurrent, 120, { checkpoints: true })
  })

  it('45 kVA at 480 V 3-phase: 54.13 A (480 × 1.732 first, then divide)', () => {
    // By hand: 45 × 1,000 = 45,000 VA; 480 × 1.732 = 831.36; 45,000 ÷ 831.36 = 54.13 A.
    // Without 1.732: 45,000 ÷ 480 = 93.75 A.
    const p = buildThreePhase({ ...base, form: 'kva-amps', phase: 3, volts: 480 }, 1)
    expect(line(p, 'v3').value).toBeCloseTo(831.36, 6)
    expect(answerOf(p)).toBe('54.13 A')
    const v = checkLine(line(p, 'answer'), '93.75')
    expect(!v.ok && v.mistake).toBe('sqrt3_missing')
    const k = checkLine(line(p, 'va'), '45')
    expect(!k.ok && k.mistake).toBe('kilo_conversion')
  })

  it('50 kW at 480 V 3-phase, PF 0.85: 70.76 A', () => {
    // By hand: 50,000 W ÷ 0.85 = 58,823.53 VA; ÷ 831.36 = 70.76 A. Ignoring PF: 50,000 ÷ 831.36 = 60.14 A.
    const p = buildThreePhase({ ...base, form: 'kw-amps', phase: 3, volts: 480 }, 2)
    expect(line(p, 'va').value).toBeCloseTo(58823.53, 1)
    expect(answerOf(p)).toBe('70.76 A')
    const v = checkLine(line(p, 'answer'), '60.14')
    expect(!v.ok && v.mistake).toBe('pf_ignored')
    const c = checkChoice(line(p, 'kwOrKva'), 'asis')
    expect(!c.ok && c.mistake).toBe('pf_ignored')
  })

  it('60 A at 208 V 3-phase is 21.62 kVA; 25 kVA at 240 V single-phase is 104.17 A', () => {
    // By hand: 208 × 1.732 = 360.256; × 60 = 21,615.36 VA; ÷ 1,000 = 21.62 kVA.
    // Single-phase: 25,000 ÷ 240 = 104.17 A (no 1.732).
    expect(answerOf(buildThreePhase({ ...base, form: 'amps-kva', phase: 3, volts: 208 }, 3))).toBe('21.62 kVA')
    const s = buildThreePhase({ ...base, kva: 25, form: 'kva-amps', phase: 1, volts: 240 }, 4)
    expect(answerOf(s)).toBe('104.17 A')
    const v = checkChoice(line(s, 'phase'), '3')
    expect(!v.ok && v.mistake).toBe('sqrt3_extra')
  })
})
