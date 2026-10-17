import { describe, expect, it } from 'vitest'
import { checkChoice, checkLine } from '@/calc'
import { checkRecipe } from '../harness'
import { answerOf, expectRecipeMistakesNamed, line } from '../kitTesting'
import { buildContinuous, continuousLoad, CONTINUOUS_LOADS, SHORT_LOADS } from './continuous'

const sign = CONTINUOUS_LOADS[1]! // 8 hours
const kiln = SHORT_LOADS[0]! // 2 hours

describe('ampacity-continuous', () => {
  it('passes the recipe self-consistency checks', () => {
    checkRecipe(continuousLoad, 120)
  })

  it('names every line-specific mistake', () => {
    expectRecipeMistakesNamed(continuousLoad, 120, { checkpoints: true })
  })

  it('37 A continuous at 75 °C: 50 A breaker, 8 AWG', () => {
    // By hand: 37 × 1.25 = 46.25 A. Next standard size up: 50 A.
    // 75 °C copper: 10 AWG = 35 A (too small), 8 AWG = 50 A. Not a small wire, so 8 AWG.
    const o = buildContinuous({ amps: 37, scenario: sign, volts: 240, terminal: 75, ask: 'ocpd' }, 1)
    expect(line(o, 'load125').value).toBeCloseTo(46.25, 6)
    expect(answerOf(o)).toBe('50 A')
    const w = buildContinuous({ amps: 37, scenario: sign, volts: 240, terminal: 75, ask: 'wire' }, 1)
    expect(answerOf(w)).toBe('8 AWG')
    expect(line(w, 'smallRule').answerId).toBe('none')
  })

  it('16 A continuous: 20 A breaker, and 240.4(D) pushes 14 AWG to 12 AWG', () => {
    // By hand: 16 × 1.25 = 20 A, already a standard size: 20 A. 75 °C: 14 AWG carries 20 A, but
    // 240.4(D) allows 14 AWG on 15 A at most, so 12 AWG (allowed on 20 A).
    const p = buildContinuous({ amps: 16, scenario: sign, volts: 120, terminal: 75, ask: 'wire' }, 2)
    expect(line(p, 'roundWay').answerId).toBe('exact')
    expect(line(p, 'ocpd').value).toBe(20)
    expect(line(p, 'wireAmp').answerId).toBe('14')
    expect(line(p, 'smallRule').answerId).toBe('over')
    expect(answerOf(p)).toBe('12 AWG')
    const v = checkChoice(line(p, 'wire'), '14')
    expect(!v.ok && v.mistake).toBe('small_conductor_limit')
  })

  it('25 A continuous: 35 A breaker, so 10 AWG is not enough (30 A limit): 8 AWG', () => {
    // By hand: 25 × 1.25 = 31.25 A -> 35 A. 10 AWG at 75 °C = 35 A carries it, but 240.4(D) caps
    // 10 AWG at 30 A and the device is 35 A, so 8 AWG.
    const p = buildContinuous({ amps: 25, scenario: sign, volts: 208, terminal: 75, ask: 'wire' }, 3)
    expect(line(p, 'ocpd').value).toBe(35)
    expect(answerOf(p)).toBe('8 AWG')
    const small = p.choices.find((c) => c.label === '10 AWG')
    expect(small?.mistake).toBe('small_conductor_limit')
  })

  it('30 A continuous + 10 A noncontinuous: 47.5 A, 50 A breaker; 125% of all is named', () => {
    // By hand: 30 × 1.25 = 37.5; + 10 = 47.5 A -> 50 A. Wrong: (30 + 10) × 1.25 = 50.
    const p = buildContinuous({ amps: 30, scenario: sign, noncont: 10, volts: 240, terminal: 75, ask: 'ocpd' }, 4)
    const d = line(p, 'design')
    expect(d.value).toBeCloseTo(47.5, 6)
    const v = checkLine(d, '50')
    expect(!v.ok && v.mistake).toBe('continuous_125_whole')
    expect(answerOf(p)).toBe('50 A')
  })

  it('a 2-hour kiln at 40 A, 60 °C terminals: 100%, 40 A breaker, 8 AWG', () => {
    // By hand: 2 hours is under 3 hours, not continuous: 40 A, a standard size. 60 °C column:
    // 8 AWG = 40 A, enough. No 125% line at all.
    const p = buildContinuous({ amps: 40, scenario: kiln, volts: 240, terminal: 60, ask: 'wire' }, 5)
    expect(p.lines.some((l) => l.id === 'load125')).toBe(false)
    expect(line(p, 'continuous').answerId).toBe('no')
    expect(line(p, 'ocpd').value).toBe(40)
    expect(answerOf(p)).toBe('8 AWG')
    const v = checkChoice(line(p, 'continuous'), 'yes')
    expect(!v.ok && v.mistake).toBe('noncontinuous_125')
  })

  it('45 A continuous at 60 °C: 56.25 A, 60 A breaker, 4 AWG (6 AWG is only 55 A at 60 °C)', () => {
    const p = buildContinuous({ amps: 45, scenario: sign, volts: 480, terminal: 60, ask: 'wire' }, 6)
    expect(line(p, 'ocpd').value).toBe(60)
    expect(answerOf(p)).toBe('4 AWG')
    const v = checkChoice(line(p, 'column'), '90')
    expect(!v.ok && v.mistake).toBe('wrong_temp_column')
  })

  it('names the forgotten 125%', () => {
    const p = buildContinuous({ amps: 37, scenario: sign, volts: 240, terminal: 75, ask: 'ocpd' }, 7)
    const v = checkLine(line(p, 'load125'), '37')
    expect(!v.ok && v.mistake).toBe('forgot_125_continuous')
    const o = checkLine(line(p, 'ocpd'), '45')
    expect(!o.ok && o.mistake).toBe('ocpd_rounded_down')
  })
})
