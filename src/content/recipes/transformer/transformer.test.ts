import { describe, expect, it } from 'vitest'
import { checkChoice, checkLine } from '@/calc'
import { checkRecipe } from '../harness'
import { answerOf, expectRecipeMistakesNamed, line } from '../kitTesting'
import { buildTransformer, transformerRecipe } from './transformer'

describe('transformer', () => {
  it('passes the recipe self-consistency checks', () => {
    checkRecipe(transformerRecipe, 120)
  })

  it('names every line-specific mistake', () => {
    expectRecipeMistakesNamed(transformerRecipe, 120, { checkpoints: true })
  })

  it('45 kVA, 480 V 3-phase primary: 54.13 A, protection 70 A', () => {
    // By hand: 45 × 1,000 = 45,000 VA. 480 × 1.732 = 831.36. 45,000 ÷ 831.36 = 54.13 A (9 A or more).
    // 54.13 × 1.25 = 67.66 A, not standard: Note 1 allows the next size up: 70 A.
    const p = buildTransformer({ phase: 3, kva: 45, primary: 480, secondary: 208, ask: 'protection' }, 1)
    expect(line(p, 'v3').value).toBeCloseTo(831.36, 6)
    expect(line(p, 'current').value).toBeCloseTo(54.127, 2)
    expect(line(p, 'band').answerId).toBe('9up')
    expect(line(p, 'max').value).toBeCloseTo(67.66, 1)
    expect(answerOf(p)).toBe('70 A')
    const d = checkLine(line(p, 'device'), '60')
    expect(!d.ok && d.mistake).toBe('ocpd_rounded_down')
  })

  it('3 kVA single-phase at 480 V: 6.25 A, 167%, 10.44 A maximum (no rounding up)', () => {
    // By hand: 3,000 ÷ 480 = 6.25 A: the 2-9 A band, 167%. 6.25 × 1.67 = 10.4375 A, a maximum.
    const p = buildTransformer({ phase: 1, kva: 3, primary: 480, secondary: 240, ask: 'protection' }, 2)
    expect(line(p, 'band').answerId).toBe('2to9')
    expect(line(p, 'pct').value).toBe(167)
    expect(answerOf(p)).toBe('10.44 A')
    const up = checkChoice(line(p, 'round'), 'up')
    expect(!up.ok && up.mistake).toBe('xfmr_no_round_up')
    expect(p.choices.find((c) => c.label === '15 A')?.mistake).toBe('xfmr_no_round_up')
    const w = checkLine(line(p, 'pct'), '125')
    expect(!w.ok && w.mistake).toBe('xfmr_wrong_percent')
  })

  it('0.75 kVA single-phase at 480 V: 1.5625 A, 300%, 4.69 A', () => {
    // By hand: 750 ÷ 480 = 1.5625 A (under 2 A): 300%: 4.6875 A maximum.
    const p = buildTransformer({ phase: 1, kva: 0.75, primary: 480, secondary: 240, ask: 'protection' }, 3)
    expect(line(p, 'band').answerId).toBe('under2')
    expect(line(p, 'max').value).toBeCloseTo(4.6875, 6)
    expect(answerOf(p)).toBe('4.69 A')
  })

  it('secondary currents: 75 kVA at 208Y/120 V is 208.19 A; 25 kVA at 120/240 V is 104.17 A', () => {
    // By hand: 75,000 ÷ (208 × 1.732 = 360.256) = 208.185 -> 208.19 A. 25,000 ÷ 240 = 104.17 A (not ÷ 120).
    const a = buildTransformer({ phase: 3, kva: 75, primary: 480, secondary: 208, ask: 'secondary' }, 4)
    expect(answerOf(a)).toBe('208.19 A')
    const b = buildTransformer({ phase: 1, kva: 25, primary: 480, secondary: 240, ask: 'secondary' }, 5)
    expect(answerOf(b)).toBe('104.17 A')
    const v = checkLine(line(b, 'current'), '208.33')
    expect(!v.ok && v.mistake).toBe('wrong_voltage')
    const k = checkLine(line(b, 'current'), String(25 / 240))
    expect(!k.ok && k.mistake).toBe('kilo_conversion')
  })
})
