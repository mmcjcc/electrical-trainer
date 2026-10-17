/**
 * Builders for worksheet lines, so a recipe states what a line means and the builder fills in the
 * printed arithmetic, the calculator keystrokes, the operands for the generic detectors and the
 * display. Pure.
 */
import type { CodeRef, LineOption, MistakeValue, Unit, WorkLine } from '@/shared/types'
import { fmt, fmtUnit } from './numbers'

interface Common {
  id: string
  label: string
  say: string
  why?: string
  ref?: CodeRef
  unit: Unit
  mistakes?: MistakeValue[]
  tol?: { abs?: number; rel?: number }
  sanity?: string
  /** Decimals kept in the display (default 4, trailing zeros dropped). */
  decimals?: number
  /** Bucket id (ProblemInstance.sections). */
  section?: string
  /** Show-me asks him to predict this line first. */
  checkpoint?: boolean
}

/** The optional fields every builder copies through unchanged. */
function extras(p: { section?: string; checkpoint?: boolean }): Pick<WorkLine, 'section' | 'checkpoint'> {
  return {
    ...(p.section !== undefined ? { section: p.section } : {}),
    ...(p.checkpoint ? { checkpoint: true } : {}),
  }
}

/** A number read out of the word problem. */
export function given(p: Common & { value: number }): WorkLine {
  return {
    id: p.id, kind: 'given', label: p.label, say: p.say, why: p.why, ref: p.ref, unit: p.unit,
    value: p.value, display: fmtUnit(p.value, p.unit, p.decimals), mistakes: p.mistakes, tol: p.tol ?? { rel: 0 },
    sanity: p.sanity, ...extras(p),
  }
}

/** A number found in the code book. `ref` is required. */
export function lookup(p: Common & { value: number; ref: CodeRef }): WorkLine {
  return {
    id: p.id, kind: 'lookup', label: p.label, say: p.say, why: p.why, ref: p.ref, unit: p.unit,
    value: p.value, display: fmtUnit(p.value, p.unit, p.decimals), mistakes: p.mistakes, tol: p.tol ?? { rel: 0.001 },
    sanity: p.sanity, ...extras(p),
  }
}

/** Calculator spelling of a number: no commas, no unicode minus. */
export function keyNum(v: number): string {
  return fmt(v, 6).replace(/,/g, '').replace('−', '-')
}

function apply(a: number, op: '×' | '÷' | '+' | '−', b: number): number {
  switch (op) {
    case '×': return a * b
    case '÷': return a / b
    case '+': return a + b
    case '−': return a - b
  }
}

/**
 * One operation on two numbers. `value` is computed (then passed through `round` when the line
 * itself is a rounding step, e.g. 220.5(B)). Mistakes are computed by the recipe, which knows the
 * story; the generic detectors use `operands`.
 */
export function calc(p: Common & { a: number; op: '×' | '÷' | '+' | '−'; b: number; round?: (v: number) => number }): WorkLine {
  const raw = apply(p.a, p.op, p.b)
  const value = p.round ? p.round(raw) : raw
  return {
    id: p.id, kind: 'calc', label: p.label, say: p.say, why: p.why, ref: p.ref, unit: p.unit,
    value, display: fmtUnit(value, p.unit, p.decimals),
    expr: `${fmt(p.a)} ${p.op} ${fmt(p.b)}`,
    keys: [keyNum(p.a), p.op, keyNum(p.b), '='],
    operands: { a: p.a, b: p.b, op: p.op },
    mistakes: p.mistakes, tol: p.tol, sanity: p.sanity, ...extras(p),
  }
}

/** Adds several numbers (a running total). Two parts behave like `calc` with '+'. */
export function sum(p: Common & { parts: number[] }): WorkLine {
  if (p.parts.length === 0) throw new Error(`sum line ${p.id} has no parts`)
  const value = p.parts.reduce((s, v) => s + v, 0)
  const keys: string[] = []
  p.parts.forEach((v, i) => {
    if (i > 0) keys.push('+')
    keys.push(keyNum(v))
  })
  keys.push('=')
  const [a = 0, b = 0] = p.parts
  return {
    id: p.id, kind: 'calc', label: p.label, say: p.say, why: p.why, ref: p.ref, unit: p.unit,
    value, display: fmtUnit(value, p.unit, p.decimals),
    expr: p.parts.map((v) => fmt(v)).join(' + '),
    keys,
    operands: p.parts.length === 2 ? { a, b, op: '+' } : undefined,
    mistakes: p.mistakes, tol: p.tol, sanity: p.sanity, ...extras(p),
  }
}

/** Pick one option. `display` is the right option's label. */
export function choose(p: Omit<Common, 'unit' | 'mistakes' | 'tol' | 'decimals'> & { options: LineOption[]; answerId: string }): WorkLine {
  const right = p.options.find((o) => o.id === p.answerId)
  if (!right) throw new Error(`choose line ${p.id}: answer ${p.answerId} is not an option`)
  return {
    id: p.id, kind: 'choose', label: p.label, say: p.say, why: p.why, ref: p.ref, unit: 'none',
    display: right.label, options: p.options, answerId: p.answerId, sanity: p.sanity, ...extras(p),
  }
}

/** The value of a line by id (recipes chain lines). Throws on a missing or non-numeric line. */
export function valueOf(lines: WorkLine[], id: string): number {
  const l = lines.find((x) => x.id === id)
  if (!l || l.value === undefined) throw new Error(`no numeric line ${id}`)
  return l.value
}
