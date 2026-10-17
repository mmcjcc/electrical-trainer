import { describe, expect, it } from 'vitest'
import { checkChoice, checkLine } from '@/calc'
import { checkRecipe } from '../harness'
import { answerOf, expectRecipeMistakesNamed, line } from '../kitTesting'
import { buildAppliances, dwellingAppliances } from './appliances'
import type { Appliance } from './common'

const wh: Appliance = { key: 'wh', name: 'water heater', motor: false, rating: { kind: 'kW', kw: 4.5 } }
const dw: Appliance = { key: 'dw', name: 'dishwasher', motor: false, rating: { kind: 'W', w: 1200 } }
const disp: Appliance = { key: 'disp', name: 'food waste disposer', motor: true, hp: '1/2', rating: { kind: 'A', amps: 8, volts: 120 } }
const comp: Appliance = { key: 'comp', name: 'trash compactor', motor: true, hp: '1/3', rating: { kind: 'A', amps: 6, volts: 120 } }
const well: Appliance = { key: 'well', name: 'well pump', motor: true, hp: '1', rating: { kind: 'A', amps: 8, volts: 240 } }

describe('dwelling-appliances', () => {
  it('passes the recipe self-consistency checks', () => {
    checkRecipe(dwellingAppliances, 80)
  })

  it('names every line-specific mistake', () => {
    expectRecipeMistakesNamed(dwellingAppliances, 80)
  })

  it('four appliances: 7,380 VA × 0.75 = 5,535 VA', () => {
    // By hand: 4.5 kW = 4,500; 1,200 W = 1,200; 8 A × 120 = 960; 6 A × 120 = 720. Total 7,380 VA.
    // Four appliances: × 0.75 = 5,535 VA. (The range and dryer in the story are not counted.)
    const p = buildAppliances({ appliances: [wh, dw, disp, comp], others: [0, 1] }, 1)
    expect(line(p, 'fSum').value).toBe(7380)
    expect(line(p, 'fFour').answerId).toBe('yes')
    expect(answerOf(p)).toBe('5,535 VA')
    const v = checkLine(line(p, 'fDemand'), '7380')
    expect(!v.ok && v.mistake).toBe('appliance_75_misused')
    const x = checkLine(line(p, 'fSum'), String(7380 + 12000 + 5000))
    expect(!x.ok && x.mistake).toBe('appliance_excluded_counted')
  })

  it('three appliances: 100%, 7,620 VA; counting the range and dryer toward four is named', () => {
    // By hand: 4.5 kW = 4,500; 1,200 W = 1,200; 8 A × 240 = 1,920. Total 7,620 VA.
    // Three appliances: fewer than four, 100%: 7,620 VA.
    const p = buildAppliances({ appliances: [wh, dw, well], others: [0, 1] }, 2)
    expect(line(p, 'fFour').answerId).toBe('no')
    expect(answerOf(p)).toBe('7,620 VA')
    const yes = checkChoice(line(p, 'fFour'), 'yes')
    expect(!yes.ok && yes.mistake).toBe('appliance_excluded_counted') // 3 + range + dryer = 5 "things"
    const pct = checkLine(line(p, 'fSum'), String(7620 * 0.75))
    expect(!pct.ok && pct.mistake).toBe('appliance_75_misused')
    const volts = checkLine(line(p, 'f_well'), '960')
    expect(!volts.ok && volts.mistake).toBe('wrong_voltage') // 8 A × 120 instead of 240
    const kw = checkLine(line(p, 'f_wh'), '4.5')
    expect(!kw.ok && kw.mistake).toBe('kilo_conversion')
  })
})
