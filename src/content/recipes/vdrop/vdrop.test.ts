import { describe, expect, it } from 'vitest'
import { checkChoice, checkLine } from '@/calc'
import { checkRecipe } from '../harness'
import { answerOf, expectRecipeMistakesNamed, line } from '../kitTesting'
import { buildVdrop, vdropForward } from './vdrop'

describe('vdrop-forward', () => {
  it('passes the recipe self-consistency checks', () => {
    checkRecipe(vdropForward, 120)
  })

  it('names every line-specific mistake', () => {
    expectRecipeMistakesNamed(vdropForward, 120, { checkpoints: true })
  })

  it('240 V single-phase, 42 A, 150 ft, 6 AWG copper: 6.19 V', () => {
    // By hand: 2 × 12.9 × 42 × 150 = 162,540; ÷ 26,240 cmil = 6.194 V.
    const p = buildVdrop({ phase: 1, metal: 'cu', size: '6', amps: 42, feet: 150, volts: 240, ask: 'volts' }, 1)
    expect(line(p, 'top').value).toBeCloseTo(162540, 6)
    expect(line(p, 'top').keys).toEqual(['2', '×', '12.9', '×', '42', '×', '150', '='])
    expect(answerOf(p)).toBe('6.19 V')
    // Round trip (300 ft) doubles it: 12.39 V.
    const v = checkLine(line(p, 'vd'), '12.39')
    expect(!v.ok && v.mistake).toBe('vd_one_way_length')
    const f = checkLine(line(p, 'feet'), '300')
    expect(!f.ok && f.mistake).toBe('vd_one_way_length')
  })

  it('480 V three-phase, 100 A, 300 ft, 1/0 aluminum: 2.17%', () => {
    // By hand: 1.732 × 21.2 × 100 × 300 = 1,101,552; ÷ 105,600 = 10.431 V; ÷ 480 = 0.02173; × 100 = 2.17%.
    const p = buildVdrop({ phase: 3, metal: 'al', size: '1/0', amps: 100, feet: 300, volts: 480, ask: 'percent' }, 2)
    expect(line(p, 'vd').value).toBeCloseTo(10.4314, 3)
    expect(answerOf(p)).toBe('2.17%')
    const k = checkLine(line(p, 'k'), '12.9')
    expect(!k.ok && k.mistake).toBe('vd_wrong_k')
    const ph = checkChoice(line(p, 'phase'), '2')
    expect(!ph.ok && ph.mistake).toBe('sqrt3_missing')
  })

  it('208 V three-phase, 60 A, 200 ft, 4 AWG copper: 6.42 V', () => {
    // By hand: 1.732 × 12.9 × 60 × 200 = 268,113.6; ÷ 41,740 = 6.423 V.
    const p = buildVdrop({ phase: 3, metal: 'cu', size: '4', amps: 60, feet: 200, volts: 208, ask: 'volts' }, 3)
    expect(answerOf(p)).toBe('6.42 V')
    // Using 2 instead of 1.732 gives 7.42 V.
    const v = checkLine(line(p, 'vd'), '7.42')
    expect(!v.ok && v.mistake).toBe('sqrt3_missing')
  })
})
