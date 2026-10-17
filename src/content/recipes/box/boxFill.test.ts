import { describe, expect, it } from 'vitest'
import { checkChoice, checkLine } from '@/calc'
import { checkRecipe } from '../harness'
import { answerOf, expectRecipeMistakesNamed, findSeed, line } from '../kitTesting'
import { boxCounts, boxFill, buildBoxFill, type BoxParams } from './boxFill'

const none = { spliced: 0, through: 0, loops: 0, egcs: 0, studTypes: [] as ('stud' | 'hickey')[] }

describe('box-fill', () => {
  it('passes the recipe self-consistency checks', () => {
    checkRecipe(boxFill, 150)
  })

  it('names every line-specific mistake', () => {
    expectRecipeMistakesNamed(boxFill, 150, { checkpoints: true })
  })

  it('two 12/2 + one 12/3 NM, receptacle, switch, clamps, 3 pigtails: 29.25 in³ -> 4-11/16 × 1-1/2', () => {
    // By hand: insulated conductors 2 + 2 + 3 = 7; clamps 1; two yokes × 2 = 4; three grounds = 1;
    // pigtails 0. Total 13 × 2.25 in³ = 29.25 in³. Square boxes: 18, 21, 25.5, 29.5, 30.3, 42:
    // the first that is enough is 29.5 in³, the 4-11/16 in. square × 1-1/2 in.
    const p: BoxParams = { ...none, size: '12', method: 'nm', cables: [2, 2, 3], devices: ['receptacle', 'switch'], clampsPresent: 2, pigtails: 3, ask: 'pick' }
    expect(boxCounts(p).total).toBe(13)
    const q = buildBoxFill(p, 1)
    expect(line(q, 'need').value).toBeCloseTo(29.25, 6)
    expect(answerOf(q)).toBe('4-11/16 in. square × 1-1/2 in.')
    const pig = checkChoice(line(q, 'pigtails'), 'yes')
    expect(!pig.ok && pig.mistake).toBe('box_pigtail_counted')
    const dev = checkLine(line(q, 'devices'), '2')
    expect(!dev.ok && dev.mistake).toBe('box_device_one')
    const cl = checkLine(line(q, 'clamps'), '2')
    expect(!cl.ok && cl.mistake).toBe('box_clamps_each')
    const tot = checkLine(line(q, 'total'), '16')
    expect(!tot.ok && tot.mistake).toBe('box_pigtail_counted')
  })

  it('six 14 AWG NM cables (2020 quarter rule): grounds 1.5, 31 in³', () => {
    // By hand: five 14/2 + one 14/3: 10 + 3 = 13 insulated; clamps 1; six grounds: 1 + (6 - 4) × 1/4
    // = 1.5. Total 15.5 × 2.00 = 31 in³. Without the 2020 rule: 15 × 2 = 30 in³.
    const p: BoxParams = { ...none, size: '14', method: 'nm', cables: [2, 2, 2, 2, 2, 3], devices: [], clampsPresent: 2, pigtails: 0, ask: 'volume', namedBox: 'sq-411x2.125' }
    const q = buildBoxFill(p, 2)
    expect(line(q, 'egcExtra').value).toBeCloseTo(0.5, 6)
    expect(line(q, 'egc').value).toBeCloseTo(1.5, 6)
    expect(answerOf(q)).toBe('31 in³')
    const one = checkLine(line(q, 'egc'), '1')
    expect(!one.ok && one.mistake).toBe('box_egc_quarter')
    expect(q.choices.find((c) => c.label === '30 in³')?.mistake).toBe('box_egc_quarter')
    expect(line(q, 'check').answerId).toBe('yes') // 42 in³ ≥ 31 in³
  })

  it('conduit box, 10 AWG: 6 spliced, 1 through, 1 long loop, 2 grounds: 25 in³', () => {
    // By hand: 6 + 1 = 7 from outside; the loop counts 2; two grounds = 1. Total 10 × 2.50 = 25 in³.
    // Smallest square box: 25.5 in³ (4-11/16 × 1-1/4).
    const p: BoxParams = { ...none, size: '10', method: 'conduit', cables: [], spliced: 6, through: 1, loops: 1, egcs: 2, devices: [], clampsPresent: 0, pigtails: 0, ask: 'pick' }
    const q = buildBoxFill(p, 3)
    expect(line(q, 'total').value).toBe(10)
    expect(answerOf(q)).toBe('4-11/16 in. square × 1-1/4 in.')
    const loop = checkLine(line(q, 'loops'), '1')
    expect(!loop.ok && loop.mistake).toBe('box_loop_once')
  })

  it('ceiling box with a stud and a hickey, 14 AWG: 18 in³', () => {
    // By hand: one 14/2 + one 14/3 = 5; clamps 1; stud + hickey = 2 types = 2; two grounds = 1.
    // Total 9 × 2.00 = 18 in³ (a 4 in. round × 2-1/8 in., 21.5 in³, would hold it).
    const p: BoxParams = { ...none, size: '14', method: 'nm', cables: [2, 3], devices: [], clampsPresent: 2, studTypes: ['stud', 'hickey'], pigtails: 0, ask: 'volume' }
    const q = buildBoxFill(p, 4)
    expect(line(q, 'support').value).toBe(2)
    expect(answerOf(q)).toBe('18 in³')
    const s = checkLine(line(q, 'support'), '1')
    expect(!s.ok && s.mistake).toBe('box_support_fitting_missed')
  })

  it('generates the quarter rule, loops and combination devices', () => {
    expect(findSeed(boxFill, (q) => q.lines.some((l) => l.id === 'egcExtra'))).toBeTruthy()
    expect(findSeed(boxFill, (q) => q.lines.some((l) => l.id === 'loops'))).toBeTruthy()
    expect(findSeed(boxFill, (q) => q.story.includes('combination'))).toBeTruthy()
  })
})
