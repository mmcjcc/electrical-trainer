/**
 * Checks one worksheet line. Never just "wrong": a recognised slip gets its own sentence, and an
 * unrecognised one points him back at the numbers he used. Pure.
 *
 * Order: unreadable input -> right (within tolerance, or one of the line's `accept` values) -> the
 * line's own known mistakes -> generic detectors (carried forward, inverted operation, percent typed
 * whole, √3, decimal point) -> unknown.
 *
 * Review 2026-10-16 (docs/reviews/calc-review.md): non-finite values never match; counts are exact;
 * the percent detector only runs on percent lines; the √3 message no longer guesses the direction.
 */
import type { LineVerdict, Unit, WorkLine } from '@/shared/types'
import { fmt, parseNumberInput, within } from './numbers'

const SQRT3 = 1.732
const ELECTRICAL: ReadonlySet<Unit> = new Set<Unit>(['A', 'V', 'VA', 'kVA', 'W', 'kW'])

/** The tolerance a line's right answer is checked with: counts are exact unless the line says otherwise. */
function lineTol(line: WorkLine): { abs?: number; rel?: number } | undefined {
  return line.tol ?? (line.unit === 'count' ? { abs: 0 } : undefined)
}

/**
 * Is `got` the same number as `target` (a known mistake value or a value a generic slip would give)?
 * Matched a little more loosely than the right answer (he may have rounded the wrong value differently),
 * relative to the target itself: an absolute tolerance is used only for exact-count lines.
 */
function near(got: number, target: number, line: WorkLine): boolean {
  if (!Number.isFinite(got) || !Number.isFinite(target)) return false
  const tol = lineTol(line)
  if (line.unit === 'count' && tol?.abs !== undefined) return Math.abs(got - target) <= Math.max(tol.abs, 0.01) + 1e-9
  return within(got, target, { rel: Math.max(tol?.rel ?? 0.005, 0.01) })
}

/** Does the line multiply by a percent (so "125% typed as 125" is a possible slip)? */
function isPercentLine(line: WorkLine): boolean {
  return /%/.test(`${line.label} ${line.say} ${line.why ?? ''}`)
}

/** The generic detectors; `null` when none fits. Exported for tests. */
export function genericDiagnosis(got: number, line: WorkLine): { mistake: string; message: string } | null {
  const want = line.value
  if (want === undefined || !Number.isFinite(got)) return null
  // A detector must never fire on the right answer (identity operands such as × 1 or + 0).
  if (near(got, want, line)) return null
  const ops = line.operands

  if (ops) {
    const { a, b, op } = ops
    // Carried a number forward without doing the step.
    if ((near(got, a, line) && !near(a, want, line)) || (near(got, b, line) && !near(b, want, line))) {
      const verb = op === '×' ? 'multiply' : op === '÷' ? 'divide' : op === '+' ? 'add' : 'subtract'
      return {
        mistake: 'skipped_operation',
        message: `That is one of the numbers you start with. This line asks you to ${verb}: ${fmt(a)} ${op} ${fmt(b)}.`,
      }
    }
    if (op === '×') {
      if ((b !== 0 && near(got, a / b, line)) || (a !== 0 && near(got, b / a, line))) {
        return { mistake: 'inverse_op', message: 'It looks like you divided. This line multiplies: press × , not ÷.' }
      }
      // 125% typed as 125 (or 35% as 35): the result is 100 times too big. Only on percent lines, and
      // only for a multiplier that is a fraction (1.25, 0.35), never a whole number like 3 VA/ft².
      const pctLike = (x: number) => x > 0 && x < 10 && !Number.isInteger(x) && Math.abs(x * 100 - Math.round(x * 100)) < 1e-6
      if (isPercentLine(line)) {
        const p = pctLike(b) ? b : pctLike(a) ? a : undefined
        if (p !== undefined && near(got, a * b * 100, line)) {
          return {
            mistake: 'percent_as_whole',
            message: `Your answer is 100 times too big. ${fmt(p * 100)}% means × ${fmt(p)}, not × ${fmt(p * 100)}.`,
          }
        }
      }
    }
    if (op === '÷' && b !== 0) {
      if (near(got, a * b, line)) {
        return { mistake: 'inverse_op', message: 'It looks like you multiplied. This line divides: press ÷ , not ×.' }
      }
      if (a !== 0 && got !== 0 && near(got, b / a, line)) {
        return {
          mistake: 'flipped_division',
          message: `You divided the wrong way round. The first number goes in first: ${fmt(a)} ÷ ${fmt(b)}.`,
        }
      }
    }
    if (op === '−' && a !== b && near(got, b - a, line)) {
      return { mistake: 'subtract_backwards', message: `Subtract the other way round: ${fmt(a)} − ${fmt(b)}.` }
    }
    if (op === '−' && b !== 0 && near(got, a + b, line)) {
      return { mistake: 'inverse_op', message: 'It looks like you added. This line subtracts: press − , not +.' }
    }
    if (op === '+' && a !== 0 && b !== 0 && (near(got, a - b, line) || near(got, b - a, line))) {
      return { mistake: 'inverse_op', message: 'It looks like you subtracted. This line adds the two numbers.' }
    }
  }

  // 1.732 in the wrong place. Only on calculation lines with electrical units; which way it went
  // (left out, or put in where it does not belong) depends on the step, so the message says both.
  if (line.kind === 'calc' && ELECTRICAL.has(line.unit) && want !== 0) {
    const big = near(got, want * SQRT3, line)
    const small = near(got, want / SQRT3, line)
    if (big || small) {
      return {
        mistake: 'sqrt3_slip',
        message: `Your answer is exactly 1.732 times too ${big ? 'big' : 'small'}: the square root of 3 is in the wrong place. Three-phase uses 1.732 (divide by volts × 1.732 for amps); single-phase never does.`,
      }
    }
  }

  // Decimal point slip: the right digits, wrong size.
  for (const k of [10, 100, 1000]) {
    if (want !== 0 && (near(got, want * k, line) || near(got, want / k, line))) {
      const bigger = Math.abs(got) > Math.abs(want)
      return {
        mistake: 'decimal_slip',
        message: `The digits look right, but your number is ${fmt(k)} times too ${bigger ? 'big' : 'small'}. Check the decimal point.`,
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

  if (within(got, want, lineTol(line))) {
    // Right, but say so when he rounded more than we would have.
    const exact = Math.abs(got - want) < 1e-9
    return exact || line.unit === 'count' ? { ok: true } : { ok: true, note: `Close enough. Exactly, it is ${fmt(want)}.` }
  }
  // Another right form of the answer (the exact value of a line that may be rounded, 220.5(B)).
  const alt = (line.accept ?? []).find((v) => within(got, v, { rel: 0.005 }))
  if (alt !== undefined) return { ok: true, note: `Right. Rounded, it is ${fmt(want)}.` }

  // Two different slips can land on the same number (counting the pigtail, or counting a pass-through
  // wire twice, both give 4): name every one that fits rather than guessing which he made.
  const hits = (line.mistakes ?? []).filter((m) => near(got, m.value, line))
  const distinct = hits.filter((m, i) => hits.findIndex((x) => x.message === m.message) === i)
  if (distinct.length === 1) return { ok: false, mistake: distinct[0]!.mistake, message: distinct[0]!.message }
  if (distinct.length > 1) {
    return {
      ok: false,
      mistake: distinct[0]!.mistake,
      message: `That number comes from one of these slips. ${distinct.map((m, i) => `(${i + 1}) ${m.message}`).join(' ')}`,
    }
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
