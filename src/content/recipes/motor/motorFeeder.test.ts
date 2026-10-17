import { describe, expect, it } from 'vitest'
import { checkChoice, checkLine } from '@/calc'
import { checkRecipe } from '../harness'
import { answerOf, expectRecipeMistakesNamed, line } from '../kitTesting'
import { buildFeeder, motorFeeder } from './motorFeeder'

describe('motor-feeder', () => {
  it('passes the recipe self-consistency checks', () => {
    checkRecipe(motorFeeder, 120)
  })

  it('names every line-specific mistake', () => {
    expectRecipeMistakesNamed(motorFeeder, 120, { checkpoints: true })
  })

  it('460 V: 25, 10 and 5 hp on inverse-time breakers: 64.1 A and 110 A', () => {
    // By hand: Table 430.250 at 460 V: 25 hp 34 A, 10 hp 14 A, 5 hp 7.6 A.
    // Conductor: 34 × 1.25 = 42.5; + 14 + 7.6 = 64.1 A.
    // Largest branch breaker: 34 × 250% = 85 A -> next size up 90 A. 90 + 14 + 7.6 = 111.6 A ->
    // standard size at or below: 110 A (never up to 125 A).
    const c = buildFeeder({ volts: 460, hps: ['25', '10', '5'], device: 'inverse-time-cb', ask: 'conductor' }, 1)
    expect(line(c, 'largest').answerId).toBe('m25')
    expect(answerOf(c)).toBe('64.1 A')
    const all = checkLine(line(c, 'feederAmps'), String((34 + 14 + 7.6) * 1.25))
    expect(!all.ok && all.mistake).toBe('motor_feeder_125_all')
    const o = buildFeeder({ volts: 460, hps: ['25', '10', '5'], device: 'inverse-time-cb', ask: 'ocpd' }, 1)
    expect(line(o, 'branch').value).toBe(90)
    expect(line(o, 'ocpdSum').value).toBeCloseTo(111.6, 6)
    expect(answerOf(o)).toBe('110 A')
    const up = checkLine(line(o, 'feeder'), '125')
    expect(!up.ok && up.mistake).toBe('ocpd_next_size_not_allowed')
    const flc = checkLine(line(o, 'ocpdSum'), '55.6')
    expect(!flc.ok && flc.mistake).toBe('motor_feeder_used_flc')
    const r = checkChoice(line(o, 'round'), 'up')
    expect(!r.ok && r.mistake).toBe('ocpd_next_size_not_allowed')
  })

  it('208 V: 30, 15 and 7-1/2 hp on dual-element fuses: 180.4 A and 225 A', () => {
    // By hand: 208 V: 30 hp 88 A, 15 hp 46.2 A, 7-1/2 hp 24.2 A.
    // Conductor: 88 × 1.25 = 110; + 46.2 + 24.2 = 180.4 A.
    // Fuse: 88 × 175% = 154 -> 175 A; 175 + 46.2 + 24.2 = 245.4 A -> at or below: 225 A.
    const base = { volts: 208 as const, hps: ['7-1/2', '30', '15'] as ('7-1/2' | '30' | '15')[], device: 'dual-element-fuse' as const }
    expect(answerOf(buildFeeder({ ...base, ask: 'conductor' }, 2))).toBe('180.4 A')
    const o = buildFeeder({ ...base, ask: 'ocpd' }, 2)
    expect(line(o, 'largest').answerId).toBe('m30')
    expect(answerOf(o)).toBe('225 A')
  })

  it('230 V: 20 and 10 hp on nontime fuses: 95.5 A and 200 A', () => {
    // By hand: 230 V: 20 hp 54 A, 10 hp 28 A. Conductor 54 × 1.25 = 67.5 + 28 = 95.5 A.
    // Fuse: 54 × 300% = 162 -> 175 A; 175 + 28 = 203 A -> 200 A.
    // Using the raw 162 A: 162 + 28 = 190 -> 175 A (named motor_feeder_raw_device).
    const o = buildFeeder({ volts: 230, hps: ['20', '10'], device: 'nontime-fuse', ask: 'ocpd' }, 3)
    expect(answerOf(o)).toBe('200 A')
    const raw = checkLine(line(o, 'ocpdSum'), '190')
    expect(!raw.ok && raw.mistake).toBe('motor_feeder_raw_device')
    expect(answerOf(buildFeeder({ volts: 230, hps: ['20', '10'], device: 'nontime-fuse', ask: 'conductor' }, 3))).toBe('95.5 A')
  })
})
