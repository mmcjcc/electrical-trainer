import { describe, expect, it } from 'vitest'
import { calc, choose, given, lookup, sum } from '@/calc'
import { getRecipe } from '@/content'
import type { ProblemInstance } from '@/shared/types'
import { hintRungs, isMode, paperSteps, predictOptions, sectionLines, visualAfter } from './ladder'

const REF = { book: 'NEC' as const, loc: 'Chapter 9, Table 4' }
const g = given({ id: 'g', label: 'Given', say: 'Read it.', value: 5, unit: 'A' })
const lk = lookup({ id: 'lk', label: 'Look it up', say: 'Table.', value: 2, unit: 'in2', ref: REF })
const c = calc({ id: 'c', label: 'Multiply', say: 'Times.', a: 2, op: '×', b: 3, unit: 'VA' })
const ch = choose({ id: 'ch', label: 'Pick', say: 'Pick one.', options: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], answerId: 'a', ref: REF })

describe('hint ladder', () => {
  it('fade 1 skips the instruction rung (it is already showing)', () => {
    expect(hintRungs(c, 1, 'hint')).toEqual(['numbers', 'keys', 'reveal'])
    expect(hintRungs(lk, 1, 'hint')).toEqual(['book', 'reveal'])
  })
  it('fade 2: instruction, book, numbers, keys, reveal, as the line has them', () => {
    expect(hintRungs(c, 2, 'hint')).toEqual(['say', 'numbers', 'keys', 'reveal'])
    expect(hintRungs(lk, 2, 'hint')).toEqual(['say', 'book', 'reveal'])
    expect(hintRungs(ch, 2, 'hint')).toEqual(['say', 'book', 'reveal'])
    expect(hintRungs(g, 2, 'hint')).toEqual(['say', 'reveal'])
  })
  it('keys shown always are not a rung', () => {
    expect(hintRungs(c, 2, 'always')).toEqual(['say', 'numbers', 'reveal'])
  })
  it('a rounding step (no keystrokes) has no numbers rung, so it cannot leak the answer', () => {
    const p = getRecipe('raceway-same-size')!.generate(3)
    const count = p.lines.find((l) => l.id === 'count')!
    expect(hintRungs(count, 2, 'hint')).toEqual(['say', 'book', 'reveal'])
  })
})

const bucketed: ProblemInstance = {
  recipeId: 'x', seed: 1, story: 's', givens: [], ask: 'a',
  lines: [
    { ...g, section: 'A' },
    { ...sum({ id: 'at', label: 'A total', say: 'Add.', parts: [5, 1], unit: 'A' }), section: 'A' },
    { ...lk, section: 'B' },
    sum({ id: 'ans', label: 'Answer', say: 'Add.', parts: [6, 2], unit: 'A' }),
  ],
  sections: [
    { id: 'A', label: 'Bucket A', totalLine: 'at', letter: 'A' },
    { id: 'B', label: 'Bucket B', totalLine: 'lk', letter: 'B' },
  ],
  answerLine: 'ans',
  choices: [],
  visual: { kind: 'raceway', after: 'at' },
}

describe('paper steps and pictures', () => {
  it('bucket totals in order, then the answer when no bucket ends on it', () => {
    expect(paperSteps(bucketed).map((s) => [s.line.id, s.section?.id])).toEqual([['at', 'A'], ['lk', 'B'], ['ans', undefined]])
    expect(sectionLines(bucketed, 'A').map((l) => l.id)).toEqual(['g', 'at'])
  })
  it('no buckets, no paper steps', () => {
    expect(paperSteps({ ...bucketed, sections: undefined })).toEqual([])
  })
  it('the picture waits for visual.after, else the answer line', () => {
    expect(visualAfter(bucketed)).toBe('at')
    expect(visualAfter({ ...bucketed, visual: { kind: 'raceway', after: 'nope' } })).toBe('ans')
    expect(visualAfter({ ...bucketed, visual: undefined })).toBe('ans')
  })
})

describe('show-me predictions', () => {
  it('a number checkpoint: the right value against its first known mistake, order set by the seed', () => {
    const line = { ...calc({ id: 'm', label: 'Amps', say: 'Divide.', a: 2400, op: '÷', b: 240, unit: 'A' }), checkpoint: true, mistakes: [{ value: 20, mistake: 'wrong_voltage', message: 'Use 240 V.' }] }
    const a = predictOptions(line, 0, 0)!
    const b = predictOptions(line, 1, 0)!
    expect(a.map((o) => o.label)).toEqual(['10 A', '20 A'])
    expect(b.map((o) => o.label)).toEqual(['20 A', '10 A'])
    expect(a.find((o) => !o.correct)).toMatchObject({ mistake: 'wrong_voltage', message: 'Use 240 V.' })
  })
  it('a choose checkpoint offers its options; plain lines predict nothing', () => {
    expect(predictOptions({ ...ch, checkpoint: true }, 0, 0)!.map((o) => o.correct)).toEqual([true, false])
    expect(predictOptions(ch, 0, 0)).toBeNull()
    expect(predictOptions({ ...c, checkpoint: true }, 0, 0)).toBeNull()
  })
  it('modes', () => {
    expect(isMode('paper')).toBe(true)
    expect(isMode('exam')).toBe(false)
  })
})
