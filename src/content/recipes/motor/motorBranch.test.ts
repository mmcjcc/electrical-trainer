import { describe, expect, it } from 'vitest'
import { checkChoice, checkLine } from '@/calc'
import { checkRecipe } from '../harness'
import { answerOf, expectRecipeMistakesNamed, line } from '../kitTesting'
import { buildMotorBranch, motorBranch } from './motorBranch'

describe('motor-branch', () => {
  it('passes the recipe self-consistency checks', () => {
    checkRecipe(motorBranch, 120)
  })

  it('names every line-specific mistake', () => {
    expectRecipeMistakesNamed(motorBranch, 120, { checkpoints: true })
  })

  it('10 hp, 460 V, 3-phase, inverse-time breaker: 14 AWG, 35 A, overload 16.25 A', () => {
    // By hand: Table 430.250, 10 hp at 460 V = 14 A. Conductor 14 × 1.25 = 17.5 A -> 14 AWG (20 A at
    // 75 °C). 240.4(D) does not apply: 240.4(G) sends motor circuits to Article 430.
    // Breaker: 14 × 250% = 35 A, already standard: 35 A. Overload: nameplate 13 A × 1.25 (SF 1.15) = 16.25 A.
    const base = { phase: 3 as const, hp: '10', volts: 460, fla: 13, device: 'inverse-time-cb' as const, marking: { sf: 1.15 } }
    const c = buildMotorBranch({ ...base, ask: 'conductor' }, 1)
    expect(line(c, 'flc').value).toBe(14)
    expect(line(c, 'cond125').value).toBeCloseTo(17.5, 6)
    expect(answerOf(c)).toBe('14 AWG')
    const o = buildMotorBranch({ ...base, ask: 'ocpd' }, 1)
    expect(line(o, 'scRound').answerId).toBe('exact')
    expect(answerOf(o)).toBe('35 A')
    expect(line(o, 'smallWire').answerId).toBe('yes')
    const sw = checkChoice(line(o, 'smallWire'), 'no')
    expect(!sw.ok && sw.mistake).toBe('small_conductor_motor')
    const ol = buildMotorBranch({ ...base, ask: 'overload' }, 1)
    expect(answerOf(ol)).toBe('16.25 A')
    const v = checkLine(line(ol, 'flc'), '13')
    expect(!v.ok && v.mistake).toBe('motor_nameplate_vs_table')
  })

  it('25 hp, 460 V, dual-element fuse, SF 1.0: 8 AWG, 60 A, overload 36.8 A', () => {
    // By hand: FLC 34 A. 34 × 1.25 = 42.5 A -> 10 AWG is 35 A (too small), 8 AWG 50 A.
    // Fuse: 34 × 175% = 59.5 A, not standard: next size up 60 A. Overload: 32 × 1.15 = 36.8 A.
    const base = { phase: 3 as const, hp: '25', volts: 460, fla: 32, device: 'dual-element-fuse' as const, marking: { sf: 1.0 } }
    expect(answerOf(buildMotorBranch({ ...base, ask: 'conductor' }, 2))).toBe('8 AWG')
    const o = buildMotorBranch({ ...base, ask: 'ocpd' }, 2)
    expect(line(o, 'scCalc').value).toBeCloseTo(59.5, 6)
    expect(line(o, 'scRound').answerId).toBe('up')
    expect(answerOf(o)).toBe('60 A')
    const down = checkLine(line(o, 'ocpd'), '50')
    expect(!down.ok && down.mistake).toBe('ocpd_rounded_down')
    const ol = buildMotorBranch({ ...base, ask: 'overload' }, 2)
    expect(line(ol, 'olPct').answerId).toBe('115')
    expect(answerOf(ol)).toBe('36.8 A')
    const w = checkLine(line(ol, 'ol'), '40')
    expect(!w.ok && w.mistake).toBe('motor_wrong_percent')
  })

  it('5 hp, 230 V single-phase, nontime fuse, 40 °C rise: 10 AWG, 90 A, 32.5 A', () => {
    // By hand: Table 430.248, 5 hp at 230 V = 28 A. 28 × 1.25 = 35 A -> 10 AWG (35 A at 75 °C).
    // Fuse: 28 × 300% = 84 A -> 90 A. Overload: 40 °C rise -> 125%: 26 × 1.25 = 32.5 A.
    const base = { phase: 1 as const, hp: '5', volts: 230, fla: 26, device: 'nontime-fuse' as const, marking: { rise: 40 } }
    expect(answerOf(buildMotorBranch({ ...base, ask: 'conductor' }, 3))).toBe('10 AWG')
    expect(answerOf(buildMotorBranch({ ...base, ask: 'ocpd' }, 3))).toBe('90 A')
    expect(answerOf(buildMotorBranch({ ...base, ask: 'overload' }, 3))).toBe('32.5 A')
  })

  it('30 hp, 208 V, inverse-time breaker: 2 AWG, 225 A; SF 1.0 with a 50 °C rise gets 115%', () => {
    // By hand: FLC 88 A. 88 × 1.25 = 110 A -> 3 AWG 100 A (too small), 2 AWG 115 A.
    // Breaker 88 × 2.5 = 220 A -> 225 A. Overload 80 × 1.15 = 92 A.
    const base = { phase: 3 as const, hp: '30', volts: 208, fla: 80, device: 'inverse-time-cb' as const, marking: { sf: 1.0, rise: 50 } }
    expect(answerOf(buildMotorBranch({ ...base, ask: 'conductor' }, 4))).toBe('2 AWG')
    expect(answerOf(buildMotorBranch({ ...base, ask: 'ocpd' }, 4))).toBe('225 A')
    expect(answerOf(buildMotorBranch({ ...base, ask: 'overload' }, 4))).toBe('92 A')
  })
})
