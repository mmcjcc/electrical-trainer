import { describe, expect, it } from 'vitest'
import { checkChoice, checkLine } from '@/calc'
import { checkRecipe } from '../harness'
import { answerOf, expectRecipeMistakesNamed, line } from '../kitTesting'
import { buildVdropReverse, vdropReverse } from './vdropReverse'

describe('vdrop-reverse', () => {
  it('passes the recipe self-consistency checks', () => {
    checkRecipe(vdropReverse, 120)
  })

  it('names every line-specific mistake', () => {
    expectRecipeMistakesNamed(vdropReverse, 120, { checkpoints: true })
  })

  it('240 V single-phase, 50 A, 200 ft, copper, 3%: 4 AWG', () => {
    // By hand: 240 × 0.03 = 7.2 V. Top 2 × 12.9 × 50 × 200 = 258,000. CM = 258,000 ÷ 7.2 = 35,833.
    // Table 8: 6 AWG 26,240 (too small), 4 AWG 41,740: 4 AWG.
    const p = buildVdropReverse({ phase: 1, metal: 'cu', amps: 50, feet: 200, volts: 240, pct: 3 }, 1)
    expect(line(p, 'vdAllowed').value).toBeCloseTo(7.2, 6)
    expect(line(p, 'need').value).toBeCloseTo(35833.33, 1)
    expect(line(p, 'cmPicked').value).toBe(41740)
    expect(answerOf(p)).toBe('4 AWG')
    const v = checkChoice(line(p, 'size'), '6')
    expect(!v.ok && v.mistake).toBe('rounded_wrong_way')
    const pct = checkLine(line(p, 'vdAllowed'), '12')
    expect(!pct.ok && pct.mistake).toBe('vd_wrong_percent')
  })

  it('480 V three-phase, 150 A, 400 ft, copper, 3%: 1/0 AWG', () => {
    // By hand: 480 × 0.03 = 14.4 V. 1.732 × 12.9 × 150 × 400 = 1,340,568; ÷ 14.4 = 93,095 cmil.
    // 1 AWG 83,690 is too small; 1/0 105,600: 1/0 AWG.
    const p = buildVdropReverse({ phase: 3, metal: 'cu', amps: 150, feet: 400, volts: 480, pct: 3 }, 2)
    expect(line(p, 'need').value).toBeCloseTo(93095, 0)
    expect(answerOf(p)).toBe('1/0 AWG')
  })

  it('208 V three-phase, 80 A, 250 ft, aluminum, 3%: 2/0 AWG', () => {
    // By hand: 208 × 0.03 = 6.24 V. 1.732 × 21.2 × 80 × 250 = 734,368; ÷ 6.24 = 117,687 cmil.
    // 1/0 105,600 too small; 2/0 133,100: 2/0 AWG. Rounding down gives 1/0.
    const p = buildVdropReverse({ phase: 3, metal: 'al', amps: 80, feet: 250, volts: 208, pct: 3 }, 3)
    expect(answerOf(p)).toBe('2/0 AWG')
    expect(p.choices.find((c) => c.label === '1/0 AWG')?.mistake).toBe('rounded_wrong_way')
  })

  it('120 V, 20 A, 100 ft, copper, 3%: 8 AWG', () => {
    // By hand: 120 × 0.03 = 3.6 V. 2 × 12.9 × 20 × 100 = 51,600; ÷ 3.6 = 14,333 cmil.
    // 10 AWG 10,380 too small; 8 AWG 16,510: 8 AWG.
    const p = buildVdropReverse({ phase: 1, metal: 'cu', amps: 20, feet: 100, volts: 120, pct: 3 }, 4)
    expect(answerOf(p)).toBe('8 AWG')
  })
})
