import { describe, expect, it } from 'vitest'
import { checkChoice, checkLine } from '@/calc'
import { checkRecipe } from '../harness'
import { answerOf, expectRecipeMistakesNamed, findSeed, line } from '../kitTesting'
import { buildOhms, ohmsLaw } from './ohmsLaw'

describe('basics-ohms-law', () => {
  it('passes the recipe self-consistency checks', () => {
    checkRecipe(ohmsLaw, 120)
  })

  it('names every line-specific mistake', () => {
    expectRecipeMistakesNamed(ohmsLaw, 120, { checkpoints: true })
  })

  it('1,500 W at 120 V draws 12.5 A', () => {
    // By hand: I = P ÷ E = 1,500 ÷ 120 = 12.5 A.
    const p = buildOhms({ form: 'I=P/E', e: 120, i: 12.5, r: 9.6, p: 1500 }, 1)
    expect(answerOf(p)).toBe('12.5 A')
    const v = checkChoice(line(p, 'formula'), 'P=EI')
    expect(!v.ok && v.mistake).toBe('ohms_wrong_formula')
  })

  it('40 A through 0.2 Ω loses 320 W (I × I, then × R)', () => {
    // By hand: 40 × 40 = 1,600; × 0.2 = 320 W. Doubling instead of squaring: 40 × 2 = 80.
    const p = buildOhms({ form: 'P=I2R', e: 8, i: 40, r: 0.2, p: 320 }, 2)
    expect(line(p, 'i2').value).toBe(1600)
    expect(line(p, 'i2').keys).toEqual(['40', '×', '40', '='])
    expect(answerOf(p)).toBe('320 W')
    const v = checkLine(line(p, 'i2'), '80')
    expect(!v.ok && v.mistake).toBe('square_as_double')
    const w = checkLine(line(p, 'answer'), '8')
    expect(!w.ok && w.mistake).toBe('ohms_wrong_formula')
  })

  it('a 4,800 W, 240 V element is 12 Ω', () => {
    // By hand: R = E × E ÷ P = 240 × 240 = 57,600; ÷ 4,800 = 12 Ω.
    const p = buildOhms({ form: 'R=E2/P', e: 240, i: 20, r: 12, p: 4800 }, 3)
    expect(line(p, 'e2').value).toBe(57600)
    expect(answerOf(p)).toBe('12 Ω')
  })

  it('240 V across 16 Ω is 15 A; every form is generated', () => {
    // By hand: I = E ÷ R = 240 ÷ 16 = 15 A.
    expect(answerOf(buildOhms({ form: 'I=E/R', e: 240, i: 15, r: 16, p: 3600 }, 4))).toBe('15 A')
    for (const form of ['I=E/R', 'R=E/I', 'E=IR', 'P=EI', 'I=P/E', 'P=I2R', 'P=E2/R', 'R=E2/P']) {
      expect(findSeed(ohmsLaw, (q) => (q.visual as { form: string }).form === form, 500), form).toBeTruthy()
    }
  })
})
