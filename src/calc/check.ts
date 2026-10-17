/**
 * Checks one worksheet line. Never just "wrong": a recognised slip gets its own sentence, and an
 * unrecognised one points him back at the numbers he used. Pure.
 *
 * Order: unreadable input -> right (within tolerance) -> the line's own known mistakes -> generic
 * detectors (decimal slip, inverted operation, percent typed whole, carried forward, √3) -> unknown.
 */
import type { LineVerdict, WorkLine } from '@/shared/types'
import { fmt, parseNumberInput, within } from './numbers'

const SQRT3 = 1.732

function near(got: number, want: number, line: WorkLine): boolean {
  // Mistake values are matched a little more loosely than the right answer: he may have rounded the
  // wrong value differently, and a near-miss of a known mistake is still that mistake.
  return within(got, want, line.tol?.abs !== undefined ? { abs: Math.max(line.tol.abs, 0.01) } : { rel: Math.max(line.tol?.rel ?? 0.005, 0.01) })
}

/** The generic detectors; `null` when none fits. Exported for tests. */
export function genericDiagnosis(got: number, line: WorkLine): { mistake: string; message: string } | null {
  const want = line.value
  if (want === undefined) return null
  const ops = line.operands

  if (ops) {
    const { a, b, op } = ops
    // Carried a number forward without doing the step.
    if ((near(got, a, line) || near(got, b, line)) && !near(a, want, line) && !near(b, want, line)) {
      const verb = op === '×' ? 'multiply' : op === '÷' ? 'divide' : op === '+' ? 'add' : 'subtract'
      return {
        mistake: 'skipped_operation',
        message: `That is one of the numbers you start with. This line asks you to ${verb}: ${fmt(a)} ${op} ${fmt(b)}.`,
      }
    }
    if (op === '×') {
      if (b !== 0 && (near(got, a / b, line) || near(got, b / a, line))) {
        return { mistake: 'inverse_op', message: 'It looks like you divided. This line multiplies: press × , not ÷.' }
      }
      // 125% typed as 125 (or 0.35 as 35): the result is 100 times too big.
      const pctLike = (x: number) => x > 0 && x < 10 && Math.abs(x * 100 - Math.round(x * 100)) < 1e-6
      if ((pctLike(b) && near(got, a * b * 100, line)) || (pctLike(a) && near(got, a * b * 100, line))) {
        const p = pctLike(b) ? b : a
        return {
          mistake: 'percent_as_whole',
          message: `Your answer is 100 times too big. ${fmt(p * 100)}% means × ${fmt(p)}, not × ${fmt(p * 100)}.`,
        }
      }
    }
    if (op === '÷' && b !== 0) {
      if (near(got, a * b, line)) {
        return { mistake: 'inverse_op', message: 'It looks like you multiplied. This line divides: press ÷ , not ×.' }
      }
      if (got !== 0 && near(got, b / a, line)) {
        return {
          mistake: 'flipped_division',
          message: `You divided the wrong way round. The first number goes in first: ${fmt(a)} ÷ ${fmt(b)}.`,
        }
      }
    }
    if (op === '−' && near(got, b - a, line) && a !== b) {
      return { mistake: 'subtract_backwards', message: `Subtract the other way round: ${fmt(a)} − ${fmt(b)}.` }
    }
    if (op === '−' && near(got, a + b, line)) {
      return { mistake: 'inverse_op', message: 'It looks like you added. This line subtracts: press − , not +.' }
    }
    if (op === '+' && near(got, Math.abs(a - b), line) && a !== b) {
      return { mistake: 'inverse_op', message: 'It looks like you subtracted. This line adds the two numbers.' }
    }
  }

  // √3 slipped in or left out (the line's own mistakes say which phase; this is the generic catch).
  if (want !== 0 && near(got, want * SQRT3, line)) {
    return {
      mistake: 'sqrt3_missing',
      message: 'Your answer is 1.732 times too big. On three-phase, divide by (volts × 1.732), not by volts alone.',
    }
  }
  if (want !== 0 && near(got, want / SQRT3, line)) {
    return {
      mistake: 'sqrt3_extra',
      message: 'Your answer is 1.732 times too small. Is 1.732 in there by mistake? It belongs only on three-phase.',
    }
  }

  // Decimal point slip: the right digits, wrong size.
  for (const k of [10, 100, 1000]) {
    if (want !== 0 && (near(got, want * k, line) || near(got, want / k, line))) {
      const big = Math.abs(got) > Math.abs(want)
      return {
        mistake: 'decimal_slip',
        message: `The digits look right, but your number is ${fmt(k)} times too ${big ? 'big' : 'small'}. Check the decimal point.`,
      }
    }
  }
  return null
}

/** Checks a typed value for a `given`, `lookup` or `calc` line. */
export function checkLine(line: WorkLine, raw: string): LineVerdict {
  const parsed = parseNumberInput(raw)
  if (!parsed.ok) return { ok: false, mistake: 'unknown', message: parsed.reason, unreadable: true }
  const got = parsed.value
  const want = line.value
  if (want === undefined) throw new Error(`line ${line.id} has no value to check against`)

  if (within(got, want, line.tol)) {
    // Right, but say so when he rounded more than we would have.
    const exact = Math.abs(got - want) < 1e-9
    return exact || line.unit === 'count' ? { ok: true } : { ok: true, note: `Close enough. Exactly, it is ${fmt(want)}.` }
  }
  for (const m of line.mistakes ?? []) {
    if (near(got, m.value, line)) return { ok: false, mistake: m.mistake, message: m.message }
  }
  const generic = genericDiagnosis(got, line)
  if (generic) return { ok: false, ...generic }

  if (line.kind === 'given') {
    return { ok: false, mistake: 'unknown', message: 'Not that one. Read the question again and find the number it gives for this.' }
  }
  if (line.kind === 'lookup') {
    return {
      ok: false,
      mistake: 'unknown',
      message: 'That is not the value in the book. Check that you are in the right table, row and column.',
    }
  }
  return {
    ok: false,
    mistake: 'unknown',
    message: line.expr
      ? `Not quite. Redo it on the calculator: ${line.expr}.`
      : 'Not quite. Check the numbers you used against the lines above.',
  }
}

/** Checks a `choose` line. */
export function checkChoice(line: WorkLine, optionId: string): LineVerdict {
  if (line.kind !== 'choose' || !line.options || !line.answerId) {
    throw new Error(`line ${line.id} is not a choose line`)
  }
  if (optionId === line.answerId) return { ok: true }
  const opt = line.options.find((o) => o.id === optionId)
  return {
    ok: false,
    mistake: opt?.mistake ?? 'unknown',
    message: opt?.feedback ?? 'Not that one. Read the line again and think about what the question tells you.',
  }
}
