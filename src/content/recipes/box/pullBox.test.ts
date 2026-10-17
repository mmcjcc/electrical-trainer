import { describe, expect, it } from 'vitest'
import { checkChoice, checkLine } from '@/calc'
import { checkRecipe } from '../harness'
import { answerOf, expectRecipeMistakesNamed, line } from '../kitTesting'
import { buildPull, pullBox } from './pullBox'

// Trade-size indexes: 0 = 1-1/4, 1 = 1-1/2, 2 = 2, 3 = 2-1/2, 4 = 3, 5 = 3-1/2, 6 = 4.
describe('box-pull', () => {
  it('passes the recipe self-consistency checks', () => {
    checkRecipe(pullBox, 120)
  })

  it('names every line-specific mistake', () => {
    expectRecipeMistakesNamed(pullBox, 120, { checkpoints: true })
  })

  it('straight pull, two 3 in. and one 2 in.: 24 in.', () => {
    // By hand: 8 × the largest (3) = 24 in. The others are not added.
    const p = buildPull({ pull: 'straight', row: [4, 4, 2], conductors: '4/0 AWG' }, 1)
    expect(answerOf(p)).toBe('24 in.')
    const v = checkLine(line(p, 'base'), '18')
    expect(!v.ok && v.mistake).toBe('pull_wrong_multiplier')
    expect(p.lines.some((l) => l.id === 'others')).toBe(false)
  })

  it('angle pull, 3 in., 2-1/2 in. and 2 in. in one row: 22.5 in.', () => {
    // By hand: 6 × 3 = 18; + 2.5 + 2 = 4.5; 18 + 4.5 = 22.5 in.
    const p = buildPull({ pull: 'angle', row: [3, 4, 2], conductors: '250 kcmil' }, 2)
    expect(line(p, 'base').value).toBe(18)
    expect(line(p, 'others').value).toBeCloseTo(4.5, 6)
    expect(answerOf(p)).toBe('22.5 in.')
    const forgot = checkLine(line(p, 'distance'), '18')
    expect(!forgot.ok && forgot.mistake).toBe('pull_forgot_others')
    const eight = checkLine(line(p, 'distance'), '28.5')
    expect(!eight.ok && eight.mistake).toBe('pull_wrong_multiplier')
    const t = checkChoice(line(p, 'type'), 'straight')
    expect(!t.ok && t.mistake).toBe('pull_wrong_multiplier')
  })

  it('U pull, 3-1/2 in. and 2 in.: 23 in.', () => {
    // By hand: 6 × 3.5 = 21; + 2 = 23 in.
    const p = buildPull({ pull: 'u', row: [5, 2], conductors: '500 kcmil' }, 3)
    expect(answerOf(p)).toBe('23 in.')
    expect(line(p, 'largest').display).toBe('3.5 in.')
  })
})
