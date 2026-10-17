import { describe, expect, it } from 'vitest'
import {
  calc, checkChoice, checkLine, choose, conductorsThatFit, fmt, fmtUnit, given, lookup, makeRng, nextStandardUp,
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
  it('catches √3 slips', () => {
    const amps = calc({ id: 'a', label: 'Amps', say: 'VA ÷ volts', a: 18600, op: '÷', b: 240, unit: 'A' })
    const v = checkLine(amps, String(77.5 / 1.732))
    expect(!v.ok && v.mistake).toBe('sqrt3_extra')
  })
  it('prefers the line’s own mistakes', () => {
    const amps = calc({
      id: 'a', label: 'Amps', say: 'VA ÷ 240', a: 18600, op: '÷', b: 240, unit: 'A',
      mistakes: [{ value: 155, mistake: 'wrong_voltage', message: 'You used 120 V.' }],
    })
    const v = checkLine(amps, '155')
    expect(!v.ok && v.mistake).toBe('wrong_voltage')
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
  it('label options keep the canonical order', () => {
    const order = ['1/2', '3/4', '1', '1-1/4', '1-1/2', '2']
    const c = labelChoices('1', [{ label: '3/4', mistake: 'rounded_wrong_way', why: 'too small' }], order)
    // Fillers are the next neighbours (+1, -1, +2, ...), skipping ones already used.
    expect(c.map((x) => x.label)).toEqual(['3/4', '1', '1-1/4', '1-1/2'])
  })
})
