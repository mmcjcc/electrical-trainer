import { describe, expect, it } from 'vitest'
import {
  calc, checkChoice, checkLine, choose, conductorsThatFit, fmt, fmtUnit, fuseAtOrBelow, given, lookup, makeRng, nextStandardUp, STANDARD_FUSES,
  numericChoices, labelChoices, parseNumberInput, roundAmps220, standardAtOrBelow, sum,
} from '.'

describe('numbers', () => {
  it('prints like an electrician writes', () => {
    expect(fmt(7200)).toBe('7,200')
    expect(fmt(77.5)).toBe('77.5')
    expect(fmt(0.0133)).toBe('0.0133')
    expect(fmt(1.25)).toBe('1.25')
    expect(fmt(18600.0000001)).toBe('18,600')
    expect(fmtUnit(7200, 'VA')).toBe('7,200 VA')
    expect(fmtUnit(125, 'pct')).toBe('125%')
    expect(fmtUnit(0.213, 'in2')).toBe('0.213 in²')
    expect(fmtUnit(16, 'count')).toBe('16')
  })
  it('reads what he types', () => {
    expect(parseNumberInput('7,200')).toEqual({ ok: true, value: 7200 })
    expect(parseNumberInput('7200 VA')).toEqual({ ok: true, value: 7200 })
    expect(parseNumberInput(' 77.5A ')).toEqual({ ok: true, value: 77.5 })
    expect(parseNumberInput('.0133')).toEqual({ ok: true, value: 0.0133 })
    expect(parseNumberInput('3/4')).toEqual({ ok: true, value: 0.75 })
    expect(parseNumberInput('1-1/4')).toEqual({ ok: true, value: 1.25 })
    expect(parseNumberInput('35%')).toEqual({ ok: true, value: 35 })
    expect(parseNumberInput('−5')).toEqual({ ok: true, value: -5 })
    expect(parseNumberInput('').ok).toBe(false)
    expect(parseNumberInput('72,00').ok).toBe(false)
    expect(parseNumberInput('abc').ok).toBe(false)
    expect(parseNumberInput('2400 3').ok).toBe(false)
    // Review 2026-10-16: phone input
    expect(parseNumberInput('½')).toEqual({ ok: true, value: 0.5 })
    expect(parseNumberInput('1½')).toEqual({ ok: true, value: 1.5 })
    expect(parseNumberInput('+5')).toEqual({ ok: true, value: 5 })
    expect(parseNumberInput('5.')).toEqual({ ok: true, value: 5 })
    expect(parseNumberInput('2400 ft2')).toEqual({ ok: true, value: 2400 })
    expect(parseNumberInput('1-1/4 in.')).toEqual({ ok: true, value: 1.25 })
    expect(parseNumberInput('21 in³')).toEqual({ ok: true, value: 21 })
    expect(parseNumberInput('5...').ok).toBe(false)
    const sum = parseNumberInput('7200/240')
    expect(sum.ok).toBe(false)
    if (!sum.ok) expect(sum.reason).toContain('calculator')
    const comma = parseNumberInput('1,5')
    expect(!comma.ok && comma.reason).toContain('period')
  })
})

describe('checkLine', () => {
  const gl = calc({ id: 'gl', label: 'General lighting', say: 'Multiply the area by 3 VA', a: 2400, op: '×', b: 3, unit: 'VA' })
  it('builds the printed arithmetic and keys', () => {
    expect(gl.value).toBe(7200)
    expect(gl.expr).toBe('2,400 × 3')
    expect(gl.keys).toEqual(['2400', '×', '3', '='])
    expect(gl.display).toBe('7,200 VA')
  })
  it('accepts the right value, with commas and units', () => {
    expect(checkLine(gl, '7,200').ok).toBe(true)
    expect(checkLine(gl, '7200 VA').ok).toBe(true)
  })
  it('names an inverted operation', () => {
    const v = checkLine(gl, '800')
    expect(v.ok).toBe(false)
    if (!v.ok) expect(v.mistake).toBe('inverse_op')
  })
  it('names a skipped step', () => {
    const v = checkLine(gl, '2400')
    expect(!v.ok && v.mistake).toBe('skipped_operation')
  })
  it('names a decimal slip', () => {
    const v = checkLine(gl, '720')
    expect(!v.ok && v.mistake).toBe('decimal_slip')
  })
  it('names a percent typed as a whole number', () => {
    const cont = calc({ id: 'c', label: '125%', say: 'Multiply by 1.25', a: 40, op: '×', b: 1.25, unit: 'A' })
    const v = checkLine(cont, '5000')
    expect(!v.ok && v.mistake).toBe('percent_as_whole')
  })
  it('names a flipped division and a multiplied division', () => {
    const amps = calc({ id: 'a', label: 'Amps', say: 'VA ÷ volts', a: 18600, op: '÷', b: 240, unit: 'A' })
    expect(amps.value).toBeCloseTo(77.5)
    const flipped = checkLine(amps, '0.0129')
    expect(!flipped.ok && flipped.mistake).toBe('flipped_division')
    const mult = checkLine(amps, '4464000')
    expect(!mult.ok && mult.mistake).toBe('inverse_op')
  })
  it('catches √3 slips without guessing the direction, only on electrical calc lines', () => {
    const amps = calc({ id: 'a', label: 'Amps', say: 'VA ÷ volts', a: 18600, op: '÷', b: 240, unit: 'A' })
    const v = checkLine(amps, String(77.5 / 1.732))
    expect(!v.ok && v.mistake).toBe('sqrt3_slip')
    expect(!v.ok && v.message).toContain('too small')
    const area = lookup({ id: 'x', label: 'Area', say: 'Find it', value: 20, unit: 'in2', ref: { book: 'NEC', loc: 'Table 4' } })
    const w = checkLine(area, String(20 * 1.732))
    expect(!w.ok && w.mistake).not.toBe('sqrt3_slip')
  })
  it('percent typed whole: only on percent lines, never for a whole-number multiplier', () => {
    const gl = calc({ id: 'gl', label: 'General lighting', say: 'Multiply the area by 3 VA', a: 2400, op: '×', b: 3, unit: 'VA' })
    const v = checkLine(gl, '720000')
    expect(!v.ok && v.mistake).toBe('decimal_slip')
  })
  it('zero operands never match everything', () => {
    const z = calc({ id: 'z', label: 'Nothing', say: 'Multiply', a: 0, op: '×', b: 1500, unit: 'VA' })
    const v = checkLine(z, '500')
    expect(!v.ok && v.mistake).toBe('unknown')
  })
  it('counts are exact by default', () => {
    const c = sum({ id: 'c', label: 'Conductors', say: 'Add', parts: [150, 50], unit: 'count' })
    expect(checkLine(c, '200').ok).toBe(true)
    expect(checkLine(c, '201').ok).toBe(false)
    expect(checkLine(c, '200.4').ok).toBe(false)
  })
  it('a rounded amperes line also accepts the exact result', () => {
    const amps = calc({ id: 'a', label: 'Amps', say: 'VA ÷ 240, rounded', a: 10000, op: '÷', b: 240, unit: 'A', round: Math.round })
    expect(amps.value).toBe(42)
    expect(checkLine(amps, '42').ok).toBe(true)
    expect(checkLine(amps, '41.67').ok).toBe(true)
    expect(checkLine(amps, '45').ok).toBe(false)
  })
  it('prefers the line’s own mistakes', () => {
    const amps = calc({
      id: 'a', label: 'Amps', say: 'VA ÷ 240', a: 18600, op: '÷', b: 240, unit: 'A',
      mistakes: [{ value: 155, mistake: 'wrong_voltage', message: 'You used 120 V.' }],
    })
    const v = checkLine(amps, '155')
    expect(!v.ok && v.mistake).toBe('wrong_voltage')
  })
  it('names every known slip that lands on the same number', () => {
    const count = calc({
      id: 'n', label: 'Conductors', say: 'Count them', a: 2, op: '+', b: 1, unit: 'count', tol: { abs: 0 },
      mistakes: [
        { value: 4, mistake: 'box_loop_once', message: 'A wire passing straight through counts once.' },
        { value: 4, mistake: 'box_pigtail_counted', message: 'A pigtail does not count.' },
      ],
    })
    const v = checkLine(count, '4')
    expect(!v.ok && v.mistake).toBe('box_loop_once')
    expect(!v.ok && v.message).toContain('passing straight through')
    expect(!v.ok && v.message).toContain('pigtail')
  })
  it('says close enough for a rounded intermediate', () => {
    const v = calc({ id: 'x', label: 'x', say: 'x', a: 208, op: '×', b: 1.732, unit: 'V' })
    const r = checkLine(v, '360.3')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.note).toContain('360.256')
  })
  it('does not count unreadable input', () => {
    const r = checkLine(gl, 'seven thousand')
    expect(!r.ok && r.unreadable).toBe(true)
  })
  it('given and lookup lines are exact by default', () => {
    const g = given({ id: 'area', label: 'Area', say: 'Find the area', value: 2400, unit: 'ft2' })
    expect(checkLine(g, '2400').ok).toBe(true)
    expect(checkLine(g, '2401').ok).toBe(false)
    const l = lookup({ id: 'u', label: 'Unit load', say: 'Find it', value: 3, unit: 'VA', ref: { book: 'NEC', loc: '220.14(J)' } })
    expect(checkLine(l, '3').ok).toBe(true)
    const wrong = checkLine(l, '2')
    expect(!wrong.ok && wrong.message).toContain('table')
  })
  it('sums with keys', () => {
    const s = sum({ id: 's', label: 'Total', say: 'Add', parts: [7200, 3000, 1500], unit: 'VA' })
    expect(s.value).toBe(11700)
    expect(s.keys).toEqual(['7200', '+', '3000', '+', '1500', '='])
  })
  it('checks choose lines', () => {
    const c = choose({
      id: 'ph', label: 'Phase', say: 'Single or three?', answerId: '3',
      options: [{ id: '1', label: 'Single-phase', feedback: '208Y/120 is three-phase.', mistake: 'sqrt3_missing' }, { id: '3', label: 'Three-phase' }],
    })
    expect(checkChoice(c, '3').ok).toBe(true)
    const w = checkChoice(c, '1')
    expect(!w.ok && w.mistake).toBe('sqrt3_missing')
  })
})

describe('rounding rules', () => {
  it('standard OCPD sizes', () => {
    expect(nextStandardUp(77.5)).toBe(80)
    expect(nextStandardUp(100)).toBe(100)
    expect(nextStandardUp(101)).toBe(110)
    expect(standardAtOrBelow(117)).toBe(110)
  })
  it('standard fuse ratings include 1, 3, 6, 10 and 601 A', () => {
    expect(fuseAtOrBelow(8.35)).toBe(6)
    expect(fuseAtOrBelow(10.04)).toBe(10)
    expect(STANDARD_FUSES).toContain(601)
  })
  it('220.5(B)', () => {
    expect(roundAmps220(77.4)).toBe(77)
    expect(roundAmps220(77.5)).toBe(78)
  })
  it('Chapter 9 Note 7 matches Annex C for THHN in EMT', () => {
    expect(conductorsThatFit(0.213, 0.0133)).toBe(16) // 3/4 EMT, 12 THHN
    expect(conductorsThatFit(0.122, 0.0133)).toBe(9) // 1/2 EMT, 12 THHN
    expect(conductorsThatFit(0.122, 0.0097)).toBe(12) // 1/2 EMT, 14 THHN
    expect(conductorsThatFit(0.346, 0.0211)).toBe(16) // 1 EMT, 10 THHN (16.4)
    expect(conductorsThatFit(1.0, 0.105)).toBe(9) // 9.52: .52 is under .8, so down
    expect(conductorsThatFit(1.0, 0.102)).toBe(10) // 9.80: .8 or more, so up
  })
})

describe('choices', () => {
  it('four distinct options, sorted, one correct', () => {
    const c = numericChoices(77.5, [
      { value: 155, mistake: 'wrong_voltage', why: '120 V' },
      { value: 44.7, mistake: 'sqrt3_extra', why: '√3' },
      { value: 155, mistake: 'dup', why: 'dup' },
    ], makeRng(1), { unit: 'A' })
    expect(c).toHaveLength(4)
    expect(c.filter((x) => x.correct)).toHaveLength(1)
    expect(new Set(c.map((x) => x.label)).size).toBe(4)
    const nums = c.map((x) => Number(x.label.replace(/[^\d.]/g, '')))
    expect([...nums].sort((a, b) => a - b)).toEqual(nums)
  })
  it('small answers still get four options, and the right one prints like the worksheet', () => {
    for (const n of [1, 2, 3]) {
      const c = numericChoices(n, [], makeRng(n), { unit: 'count' })
      expect(c).toHaveLength(4)
      expect(new Set(c.map((x) => x.label)).size).toBe(4)
    }
    const amps = numericChoices(77.25, [{ value: 154.5, mistake: 'wrong_voltage', why: '120 V' }], makeRng(2), { unit: 'A' })
    expect(amps.find((x) => x.correct)?.label).toBe('77.25 A')
    expect(numericChoices(0.5, [], makeRng(3), { unit: 'ohm' })).toHaveLength(4)
  })
  it('label options refuse a right answer that is not in the order', () => {
    expect(() => labelChoices('1/2"', [], ['1/2', '3/4', '1', '1-1/4'])).toThrow()
  })
  it('label options keep the canonical order', () => {
    const order = ['1/2', '3/4', '1', '1-1/4', '1-1/2', '2']
    const c = labelChoices('1', [{ label: '3/4', mistake: 'rounded_wrong_way', why: 'too small' }], order)
    // Fillers are the next neighbours (+1, -1, +2, ...), skipping ones already used.
    expect(c.map((x) => x.label)).toEqual(['3/4', '1', '1-1/4', '1-1/2'])
  })
})
