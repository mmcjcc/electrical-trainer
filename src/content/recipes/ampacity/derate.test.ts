import { describe, expect, it } from 'vitest'
import { checkChoice, checkLine } from '@/calc'
import { checkRecipe } from '../harness'
import { answerOf, expectRecipeMistakesNamed, line } from '../kitTesting'
import { buildDerate, derateAmpacity } from './derate'

describe('ampacity-derate', () => {
  it('passes the recipe self-consistency checks', () => {
    checkRecipe(derateAmpacity, 120)
  })

  it('names every line-specific mistake', () => {
    expectRecipeMistakesNamed(derateAmpacity, 120, { checkpoints: true })
  })

  it('8 AWG, two 3-phase linear circuits, 104 °F: 6 conductors, 38.22 A', () => {
    // By hand: 6 hots + 2 neutrals (balanced, linear: neutrals do not count) + 1 EGC (never) = 6.
    // 8 AWG THHN at 90 °C = 55 A. 104 °F is in the 96-104 °F row: 0.91 (90 °C column).
    // 55 × 0.91 = 50.05. 4-6 conductors: 80%: 50.05 × 0.8 = 40.04 A. 75 °C value = 50 A.
    // Smaller: 40.04 A -> printed 40 A.
    const p = buildDerate({ kind: '3phLinear', circuits: 2, size: '8', ambient: 104, scale: 'F', place: 'a boiler room' }, 1)
    expect(line(p, 'neutral').answerId).toBe('no')
    expect(line(p, 'adjPct').value).toBe(80)
    expect(line(p, 'derated').value).toBeCloseTo(40.04, 6)
    expect(line(p, 'limit').answerId).toBe('derated')
    expect(answerOf(p)).toBe('40 A')
  })

  it('mostly nonlinear loads: the neutrals count', () => {
    // By hand: two 480Y/277 V 4-wire circuits, LED drivers: 6 hots + 2 neutrals = 8 -> 70%.
    // 10 AWG at 90 °C = 40 A; 40 °C is in the 36-40 °C row: 0.91. 40 × 0.91 = 36.4; × 0.7 = 25.48 A.
    // 75 °C value 35 A. Smaller: 25.48 A -> 25.5 A.
    const p = buildDerate({ kind: '3phNonlinear', circuits: 2, size: '10', ambient: 40, scale: 'C', place: 'an attic' }, 2)
    expect(line(p, 'ccc').value).toBe(8)
    expect(line(p, 'adjPct').value).toBe(70)
    expect(line(p, 'ampacity').value).toBeCloseTo(25.48, 6)
    expect(answerOf(p)).toBe('25.5 A')
    const v = checkChoice(line(p, 'neutral'), 'no')
    expect(!v.ok && v.mistake).toBe('neutral_count')
  })

  it('the 75 °C terminal value wins when derating is light', () => {
    // By hand: one 3-phase linear circuit: 3 current-carrying, no adjustment. 2/0 at 90 °C = 195 A,
    // 33 °C row (31-35 °C): 0.96 -> 187.2 A. 75 °C value 175 A is smaller: 175 A.
    const p = buildDerate({ kind: '3phLinear', circuits: 1, size: '2/0', ambient: 33, scale: 'C', place: 'an attic' }, 3)
    expect(line(p, 'adjust').answerId).toBe('no')
    expect(p.lines.some((l) => l.id === 'adjPct')).toBe(false)
    expect(line(p, 'corrected').value).toBeCloseTo(187.2, 6)
    expect(line(p, 'limit').answerId).toBe('terminal')
    expect(answerOf(p)).toBe('175 A')
    const v = checkLine(line(p, 'ampacity'), '187.2')
    expect(!v.ok && v.mistake).toBe('terminal_limit_missed')
  })

  it('names the 75 °C column and the counted ground', () => {
    const p = buildDerate({ kind: '2wire', circuits: 4, size: '12', ambient: 113, scale: 'F', place: 'an attic' }, 4)
    // By hand: 4 hots + 4 neutrals (2-wire: they count) = 8 -> 70%; with the ground, 9 is still 70%,
    // so the EGC mistake does not show on the percent line here. 12 AWG 90 °C = 30 A.
    expect(line(p, 'ccc').value).toBe(8)
    const amp = checkLine(line(p, 'amp90'), '25')
    expect(!amp.ok && amp.mistake).toBe('wrong_temp_column')
    const egc = checkChoice(line(p, 'egc'), 'yes')
    expect(!egc.ok && egc.mistake).toBe('egc_counted')
    const ccc = checkLine(line(p, 'ccc'), '9')
    expect(!ccc.ok && ccc.mistake).toBe('egc_counted')
  })
})
