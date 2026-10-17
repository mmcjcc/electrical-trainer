/**
 * Small helpers shared by the wiring, ampacity, motor, transformer and basics recipes (owned by the
 * wiring/motor recipes builder). They complete the line builders in '@/calc' for three shapes those
 * builders do not cover:
 *
 *   ruleLine   a numeric line that applies a RULE rather than one key press (round to the next
 *              standard size, keep the smaller of two numbers, read the row that is big enough)
 *   product    "multiply all the top numbers, press =" (the top of the voltage-drop formula)
 *   cleanMistakes  drops known-mistake values that would collide with the right value or with each other
 *
 * Keystrokes are basic-calculator keys only (digits, ., ×, ÷, +, −, =): the PSI exam gives an
 * on-screen basic calculator. Pure.
 */
import { fmt, fmtUnit, keyNum } from '@/calc'
import type { CodeRef, LineOption, MistakeValue, Unit, WorkLine } from '@/shared/types'

type Tol = { abs?: number; rel?: number }

interface RuleCommon {
  id: string
  label: string
  say: string
  why?: string
  ref?: CodeRef
  unit: Unit
  value: number
  /** The rule with the numbers filled in, printed instead of keystrokes: "46.25 A → next standard size 50 A". */
  expr: string
  mistakes?: MistakeValue[]
  tol?: Tol
  sanity?: string
  decimals?: number
  section?: string
  checkpoint?: boolean
  /** 'lookup' when the rule is read from the book (needs `ref`); 'calc' otherwise. Default 'calc'. */
  kind?: 'calc' | 'lookup'
}

/** Copies the optional fields the way the '@/calc' builders do. */
function extras(p: { section?: string; checkpoint?: boolean }): Pick<WorkLine, 'section' | 'checkpoint'> {
  return {
    ...(p.section !== undefined ? { section: p.section } : {}),
    ...(p.checkpoint ? { checkpoint: true } : {}),
  }
}

/**
 * A numeric line whose value comes from a rule, not from one calculator operation. It carries no
 * operands (so the generic detectors do not read it as an arithmetic step) and no keystrokes.
 */
export function ruleLine(p: RuleCommon): WorkLine {
  const kind = p.kind ?? 'calc'
  if (kind === 'lookup' && !p.ref) throw new Error(`rule line ${p.id} is a lookup and needs a ref`)
  return {
    id: p.id, kind, label: p.label, say: p.say, why: p.why, ref: p.ref, unit: p.unit,
    value: p.value, display: fmtUnit(p.value, p.unit, p.decimals), expr: p.expr,
    mistakes: p.mistakes, tol: p.tol ?? (kind === 'lookup' ? { rel: 0.001 } : { abs: 0 }),
    sanity: p.sanity, ...extras(p),
  }
}

/**
 * Multiplies several numbers in one run on the calculator: 2 × 12.9 × 24 × 150 =. Basic calculators
 * chain this left to right, so it is still one line of work ("the top of the formula").
 */
export function product(p: {
  id: string; label: string; say: string; why?: string; ref?: CodeRef; unit: Unit; parts: number[]
  mistakes?: MistakeValue[]; tol?: Tol; sanity?: string; decimals?: number; section?: string; checkpoint?: boolean
}): WorkLine {
  if (p.parts.length < 2) throw new Error(`product line ${p.id} needs two or more parts`)
  const value = p.parts.reduce((s, v) => s * v, 1)
  const keys: string[] = []
  p.parts.forEach((v, i) => {
    if (i > 0) keys.push('×')
    keys.push(keyNum(v))
  })
  keys.push('=')
  const [a = 0, b = 0] = p.parts
  return {
    id: p.id, kind: 'calc', label: p.label, say: p.say, why: p.why, ref: p.ref, unit: p.unit,
    value, display: fmtUnit(value, p.unit, p.decimals),
    expr: p.parts.map((v) => fmt(v)).join(' × '),
    keys,
    operands: p.parts.length === 2 ? { a, b, op: '×' } : undefined,
    mistakes: p.mistakes, tol: p.tol, sanity: p.sanity, ...extras(p),
  }
}

/** The same "close enough to be that mistake" window that calc/check.ts uses. */
function nearFor(got: number, want: number, tol: Tol | undefined): boolean {
  if (tol?.abs !== undefined) return Math.abs(got - want) <= Math.max(tol.abs, 0.01) + 1e-9
  return Math.abs(got - want) <= Math.abs(want) * Math.max(tol?.rel ?? 0.005, 0.01) + 1e-9
}

/**
 * Keeps the known-mistake values that can be told apart: finite, above zero, clear of the right value
 * (twice the matching window, so a right answer rounded a little is never called a mistake) and clear
 * of every mistake kept before it (the first one wins, so list the most specific first).
 */
export function cleanMistakes(value: number, tol: Tol | undefined, list: (MistakeValue | false | undefined | null)[]): MistakeValue[] {
  const kept: MistakeValue[] = []
  for (const m of list) {
    if (!m || !Number.isFinite(m.value) || m.value <= 0) continue
    const clearOfRight = tol?.abs !== undefined
      ? Math.abs(m.value - value) > 2 * Math.max(tol.abs, 0.01) + 1e-9
      : Math.abs(m.value - value) > Math.abs(value) * 2 * Math.max(tol?.rel ?? 0.005, 0.01) + 1e-9
    if (!clearOfRight) continue
    if (kept.some((k) => nearFor(m.value, k.value, tol) || nearFor(k.value, m.value, tol))) continue
    kept.push(m)
  }
  return kept
}

/** Replaces a line's printed value (inches, trade sizes) without touching its numeric value. */
export function withDisplay(line: WorkLine, display: string): WorkLine {
  return { ...line, display }
}

/** A choose-line option. */
export function opt(id: string, label: string, feedback?: string, mistake?: string): LineOption {
  return { id, label, ...(feedback ? { feedback } : {}), ...(mistake ? { mistake } : {}) }
}

/** Inches as printed in stories and answers: "24 in.", "22.5 in.". */
export function inches(v: number): string {
  return `${fmt(v, 2)} in.`
}
