import { describe, expect, it } from 'vitest'
import { checkChoice, checkLine } from '@/calc'
import { checkRecipe } from '../harness'
import { answerOf, expectRecipeMistakesNamed, line } from '../kitTesting'
import { buildReverse, derateReverse } from './derateReverse'

describe('ampacity-derate-reverse', () => {
  it('passes the recipe self-consistency checks', () => {
    checkRecipe(derateReverse, 120)
  })

  it('names every line-specific mistake', () => {
    expectRecipeMistakesNamed(derateReverse, 120, { checkpoints: true })
  })

  it('six 6 AWG at 52 A: 45 °C (113 °F)', () => {
    // By hand: 6 AWG THHN 90 °C = 75 A; six current-carrying: 80% -> 60 A. Need 52 ÷ 60 = 0.8667.
    // 90 °C correction column: 41-45 °C is 0.87 (enough), 46-50 °C is 0.82 (too small). Top: 45 °C.
    // The same row in °F is 105-113 °F. Terminal check: 52 A ≤ 65 A (75 °C). Fine.
    const c = buildReverse({ size: '6', ccc: 6, load: 52, scale: 'C' }, 1)
    expect(line(c, 'base').value).toBeCloseTo(60, 6)
    expect(line(c, 'need').value).toBeCloseTo(0.86667, 4)
    expect(line(c, 'factor').value).toBe(0.87)
    expect(answerOf(c)).toBe('45°C')
    const f = buildReverse({ size: '6', ccc: 6, load: 52, scale: 'F' }, 1)
    expect(answerOf(f)).toBe('113°F')
    const v = checkLine(line(c, 'ambient'), '50')
    expect(!v.ok && v.mistake).toBe('rounded_wrong_way')
  })

  it('three 10 AWG at 30 A: no adjustment, 131 °F', () => {
    // By hand: 10 AWG 90 °C = 40 A, three conductors: no adjustment. Need 30 ÷ 40 = 0.75.
    // 51-55 °C (123-131 °F) is 0.76: enough; 56-60 °C is 0.71: too small. Answer 131 °F.
    // Working from the 75 °C columns instead: 30 ÷ 35 = 0.857 -> 0.88 row (96-104 °F) -> 104 °F.
    const p = buildReverse({ size: '10', ccc: 3, load: 30, scale: 'F' }, 2)
    expect(p.lines.some((l) => l.id === 'adjPct')).toBe(false)
    expect(answerOf(p)).toBe('131°F')
    expect(p.choices.find((c) => c.label === '104°F')?.mistake).toBe('wrong_temp_column')
    const v = checkChoice(line(p, 'adjust'), 'yes')
    expect(!v.ok && v.mistake).toBe('correction_vs_adjustment')
  })

  it('nine 2/0 at 100 A: 70%, 55 °C', () => {
    // By hand: 2/0 90 °C = 195 A × 0.70 = 136.5 A. Need 100 ÷ 136.5 = 0.7326. 51-55 °C row 0.76 is
    // enough, 56-60 °C 0.71 is not: 55 °C. Forgetting the adjustment: 100 ÷ 195 = 0.513 -> 0.58 row
    // (66-70 °C) -> 70 °C.
    const p = buildReverse({ size: '2/0', ccc: 9, load: 100, scale: 'C' }, 3)
    expect(line(p, 'adjPct').value).toBe(70)
    expect(answerOf(p)).toBe('55°C')
    const v = checkLine(line(p, 'need'), String(100 / 195))
    expect(!v.ok && v.mistake).toBe('correction_vs_adjustment')
  })
})
