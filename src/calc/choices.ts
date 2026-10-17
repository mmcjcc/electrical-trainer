/**
 * Builds the four exam-style options for a calculation. The wrong options are the classic mistakes,
 * so picking one tells him which mistake he made. Options are sorted small to large, as most exam
 * banks print numeric answers. Pure.
 */
import type { AnswerChoice, Unit } from '@/shared/types'
import type { Rng } from './rng'
import { fmtUnit } from './numbers'

export interface WrongValue {
  value: number
  mistake: string
  why: string
}

export interface ChoiceOptions {
  unit: Unit
  /** Decimals printed (default: 0 for VA/W/count, 1 for A, 4 for in²). */
  decimals?: number
  /** Custom label printer (trade sizes, AWG). */
  label?: (v: number) => string
}

function defaultDecimals(unit: Unit): number {
  switch (unit) {
    case 'A': return 1
    case 'in2': return 4
    case 'pct': case 'V': return 1
    case 'ft': case 'in3': return 2
    default: return 0
  }
}

/**
 * Exactly four options: the right one, up to three distinct mistake values, then filler values
 * near the answer when the mistakes run out (labelled as plain slips). Labels never repeat.
 */
export function numericChoices(correct: number, wrongs: WrongValue[], rng: Rng, opts: ChoiceOptions): AnswerChoice[] {
  const decimals = opts.decimals ?? defaultDecimals(opts.unit)
  const label = opts.label ?? ((v: number) => fmtUnit(v, opts.unit, decimals))
  const out: (AnswerChoice & { v: number })[] = [{ label: label(correct), correct: true, v: correct }]
  const seen = new Set([out[0]!.label])
  for (const w of wrongs) {
    if (out.length === 4) break
    if (!Number.isFinite(w.value) || w.value <= 0) continue
    const l = label(w.value)
    if (seen.has(l)) continue
    seen.add(l)
    out.push({ label: l, correct: false, mistake: w.mistake, why: w.why, v: w.value })
  }
  // Filler: spread around the answer so it is not always the middle value.
  const spreads = rng.shuffle([0.8, 0.9, 1.1, 1.2, 1.25, 0.75, 1.5, 0.67])
  for (const s of spreads) {
    if (out.length === 4) break
    const v = Number((correct * s).toFixed(decimals))
    const l = label(v)
    if (seen.has(l) || v <= 0) continue
    seen.add(l)
    out.push({ label: l, correct: false, mistake: 'unknown', why: 'This one does not come from a common mistake; recheck the worksheet.', v })
  }
  if (out.length < 4) throw new Error(`could not build four distinct options around ${correct}`)
  return out.sort((x, y) => x.v - y.v).map(({ v: _v, ...c }) => c)
}

export interface WrongLabel {
  label: string
  mistake: string
  why: string
}

/**
 * Options that are not plain numbers (trade sizes, wire sizes, box types, "Table 250.66"). `order`
 * is the canonical list the labels come from; options print in that order. Fillers come from
 * the neighbours of the right answer in `order`.
 */
export function labelChoices(correct: string, wrongs: WrongLabel[], order: readonly string[]): AnswerChoice[] {
  const picked: AnswerChoice[] = [{ label: correct, correct: true }]
  const seen = new Set([correct])
  for (const w of wrongs) {
    if (picked.length === 4) break
    if (seen.has(w.label)) continue
    seen.add(w.label)
    picked.push({ label: w.label, correct: false, mistake: w.mistake, why: w.why })
  }
  const idx = order.indexOf(correct)
  const neighbours = [idx + 1, idx - 1, idx + 2, idx - 2, idx + 3, idx - 3]
    .filter((i) => i >= 0 && i < order.length)
    .map((i) => order[i] as string)
  for (const n of neighbours) {
    if (picked.length === 4) break
    if (seen.has(n)) continue
    seen.add(n)
    picked.push({ label: n, correct: false, mistake: 'unknown', why: 'Not a common mistake; recheck the worksheet.' })
  }
  if (picked.length < 4) throw new Error(`could not build four options around ${correct}`)
  const pos = (l: string) => {
    const i = order.indexOf(l)
    return i === -1 ? Number.MAX_SAFE_INTEGER : i
  }
  return picked.sort((a, b) => pos(a.label) - pos(b.label))
}
