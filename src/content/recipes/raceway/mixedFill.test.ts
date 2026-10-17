import { describe, expect, it } from 'vitest'
import { checkChoice, checkLine } from '@/calc'
import { checkRecipe } from '../harness'
import { answerOf, expectRecipeMistakesNamed, findSeed, line } from '../kitTesting'
import { buildMixed, mixedFill } from './mixedFill'

describe('raceway-mixed', () => {
  it('passes the recipe self-consistency checks', () => {
    checkRecipe(mixedFill, 150)
  })

  it('names every line-specific mistake', () => {
    expectRecipeMistakesNamed(mixedFill, 150, { checkpoints: true })
  })

  it('three 3/0 THHN + one 4 AWG THHN in EMT: 0.8861 in², 2 in.', () => {
    // By hand: 3 × 0.2679 = 0.8037; + 0.0824 = 0.8861 in². EMT 40% column: 1-1/2 in. = 0.814
    // (too small), 2 in. = 1.342: 2 in. EMT.
    const p = buildMixed({ raceway: 'EMT', groups: [{ count: 3, size: '3/0', ins: 'THHN' }, { count: 1, size: '4', ins: 'THHN' }], nipple: false }, 1)
    expect(line(p, 'total').value).toBeCloseTo(0.8861, 6)
    expect(line(p, 'allowed').value).toBeCloseTo(1.342, 3)
    expect(answerOf(p)).toBe('2 in.')
    const left = checkLine(line(p, 'total'), '0.8037')
    expect(!left.ok && left.mistake).toBe('fill_missed_wires')
    const small = checkChoice(line(p, 'trade'), '1-1/2')
    expect(!small.ok && small.mistake).toBe('rounded_wrong_way')
  })

  it('nine 12 THHN + four 10 THHN in EMT: 0.2041 in², 3/4 in.', () => {
    // By hand: 9 × 0.0133 = 0.1197; 4 × 0.0211 = 0.0844; total 0.2041 in². EMT 40%: 1/2 in. = 0.122,
    // 3/4 in. = 0.213: 3/4 in.
    const p = buildMixed({ raceway: 'EMT', groups: [{ count: 9, size: '12', ins: 'THHN' }, { count: 4, size: '10', ins: 'THHN' }], nipple: false }, 2)
    expect(line(p, 'total').value).toBeCloseTo(0.2041, 6)
    expect(answerOf(p)).toBe('3/4 in.')
    const ins = checkLine(line(p, 'area1'), '0.026')
    expect(!ins.ok && ins.mistake).toBe('wrong_insulation_column')
  })

  it('a Schedule 40 PVC nipple, four 1/0 THHN + one 6 THHN: 60%, 1-1/4 in.', () => {
    // By hand: 4 × 0.1855 = 0.742; + 0.0507 = 0.7927 in². PVC 40 60% column: 1 in. = 0.499,
    // 1-1/4 in. = 0.872: 1-1/4 in. (At 40% it would take 1-1/2 in., 0.794.)
    const p = buildMixed({ raceway: 'PVC40', groups: [{ count: 4, size: '1/0', ins: 'THHN' }, { count: 1, size: '6', ins: 'THHN', role: 'equipment grounding conductor' }], nipple: true }, 3)
    expect(line(p, 'fill').answerId).toBe('nipple')
    expect(answerOf(p)).toBe('1-1/4 in.')
    expect(p.choices.find((c) => c.label === '1-1/2 in.')?.mistake).toBe('wrong_fill_percent')
    const f = checkChoice(line(p, 'fill'), 'over2')
    expect(!f.ok && f.mistake).toBe('wrong_fill_percent')
  })

  it('generates nipples and mixed insulations', () => {
    expect(findSeed(mixedFill, (q) => q.story.includes('nipple'))).toBeTruthy()
    expect(findSeed(mixedFill, (q) => / THW/.test(q.story) && / THHN/.test(q.story))).toBeTruthy()
  })
})
