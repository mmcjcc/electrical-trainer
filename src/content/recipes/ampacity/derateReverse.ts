/**
 * Ampacity run backwards: "Six current-carrying 6 AWG THHN share a raceway and carry 40 A each ...
 * the highest ambient temperature?" Method: the 90 °C ampacity × the adjustment factor (Table
 * 310.15(C)(1)) is what the wire carries at 30 °C. The correction factor needed is load ÷ that. In
 * Table 310.15(B)(1), 90 °C column, go down the rows (hotter) while the factor is still at least the
 * needed one; the top temperature of the last such row is the answer. The load must also be within
 * the 75 °C terminal ampacity (110.14(C)), which these problems are built to satisfy.
 */
import { calc, choose, fmt, lookup, makeRng, numericChoices, type WrongValue } from '@/calc'
import { adjustmentPct, ampacity, sizeLabel, TEMP_CORRECTION, type ConductorSize } from '@/data/tables'
import { REF } from '@/data/refs'
import type { ProblemInstance, Recipe, Section, WorkLine } from '@/shared/types'
import { cleanMistakes, opt, ruleLine, word } from '../kit'

const ID = 'ampacity-derate-reverse'

const SIZES: ConductorSize[] = ['12', '10', '8', '6', '4', '3', '2', '1', '1/0', '2/0', '3/0', '4/0']
const CCC_CHOICES = [3, 3, 4, 5, 6, 6, 7, 8, 9]

export interface ReverseParams {
  size: ConductorSize
  ccc: number
  load: number
  scale: 'C' | 'F'
}

/** Index of the hottest correction row whose factor in `col` is at least `need` (-1 if none). */
function hottestRow(need: number, col: 75 | 90): number {
  let best = -1
  TEMP_CORRECTION.forEach((r, i) => {
    const f = r.factor[col === 75 ? 1 : 2]
    if (f !== null && f >= need - 1e-9 && r.c[0] >= 26) best = i
  })
  return best
}

function top(i: number, scale: 'C' | 'F'): number {
  const r = TEMP_CORRECTION[i]!
  return scale === 'C' ? r.c[1] : r.f[1]
}

function bottom(i: number, scale: 'C' | 'F'): number {
  const r = TEMP_CORRECTION[i]!
  return scale === 'C' ? r.c[0] : r.f[0]
}

function pick(seed: number): ReverseParams {
  const rng = makeRng(seed)
  for (let tries = 0; tries < 300; tries++) {
    const size = rng.pick(SIZES)
    const ccc = rng.pick(CCC_CHOICES)
    const base = ampacity('cu', size, 90) * (adjustmentPct(ccc) / 100)
    // Target a hot row (31-35 °C to 56-60 °C) and put the needed factor inside it, clear of its edges.
    const rows = TEMP_CORRECTION.map((_, i) => i).filter((i) => TEMP_CORRECTION[i]!.c[0] >= 31 && TEMP_CORRECTION[i]!.c[1] <= 60)
    const r = rng.pick(rows)
    const fr = TEMP_CORRECTION[r]!.factor[2]
    const fNext = TEMP_CORRECTION[r + 1]!.factor[2]
    const lo = Math.floor(fNext * base + 0.02 * base) + 1
    const hi = Math.floor(fr * base)
    const hiAll = Math.min(hi, ampacity('cu', size, 75))
    if (hiAll < lo || hiAll < 10) continue
    const load = rng.int(lo, hiAll)
    if (hottestRow(load / base, 90) !== r) continue
    return { size, ccc, load, scale: rng.chance(0.5) ? 'C' : 'F' }
  }
  return { size: '6', ccc: 6, load: 52, scale: 'C' }
}

export function buildReverse(p: ReverseParams, seed: number): ProblemInstance {
  const rng = makeRng(seed ^ 0x4e)
  const { size, ccc, load, scale } = p
  const unit = scale === 'C' ? '°C' : '°F'
  const uUnit = scale === 'C' ? 'degC' : 'degF'
  const amp90 = ampacity('cu', size, 90)
  const amp75 = ampacity('cu', size, 75)
  const adjNeeded = ccc > 3
  const pct = adjustmentPct(ccc)
  const base = amp90 * (pct / 100)
  const need = load / base
  const r = hottestRow(need, 90)
  const factor = TEMP_CORRECTION[r]!.factor[2]
  const answer = top(r, scale)
  const wire = `${sizeLabel(size)} THHN copper`

  const story =
    `${word(ccc).replace(/^\w/, (c) => c.toUpperCase())} current-carrying ${wire} conductors share one raceway, and each carries ${load} A. ` +
    'The terminals are rated 75 °C. ' +
    `What is the highest ambient temperature, in ${unit}, at which the conductors may carry this load?`

  const S_AMP = 'amp'
  const S_FACTOR = 'factor'
  const lines: WorkLine[] = []

  lines.push(choose({
    id: 'terminal', label: 'Terminal check',
    say: `The terminals are rated 75 °C. Is ${load} A within the 75 °C ampacity of ${sizeLabel(size)} (${amp75} A)?`,
    why: 'However cool the room, the terminals cap the wire at its 75 °C value (110.14(C)). If the load is over that, no temperature works.',
    ref: REF.terminalTemp,
    options: [
      opt('yes', `Yes: ${load} A is not more than ${amp75} A`),
      opt('no', `No: ${load} A is more than ${amp75} A`, `${load} A is not more than ${amp75} A, so the terminals are fine. Go on.`),
    ],
    answerId: 'yes',
    section: S_AMP, checkpoint: true,
  }))
  lines.push(lookup({
    id: 'amp90', label: `Ampacity of ${sizeLabel(size)} at 90 °C`,
    say: `THHN derates from its 90 °C column. Table 310.16, copper, 90 °C, the ${sizeLabel(size)} row.`,
    ref: REF.ampacityTable,
    value: amp90, unit: 'A',
    mistakes: cleanMistakes(amp90, { rel: 0.001 }, [
      { value: amp75, mistake: 'wrong_temp_column', message: 'That is the 75 °C column. Derate from the wire’s own 90 °C column.' },
    ]),
    section: S_AMP,
  }))
  lines.push(choose({
    id: 'adjust', label: 'More than three current-carrying?',
    say: `There are ${ccc} current-carrying conductors. Is that more than three?`,
    ref: REF.adjustment,
    options: [
      opt('yes', 'Yes: use the adjustment table', adjNeeded ? undefined : `${ccc} is not more than three: no adjustment.`, adjNeeded ? undefined : 'correction_vs_adjustment'),
      opt('no', 'No: no adjustment', adjNeeded ? `${ccc} is more than three: Table 310.15(C)(1) applies.` : undefined, adjNeeded ? 'correction_vs_adjustment' : undefined),
    ],
    answerId: adjNeeded ? 'yes' : 'no',
    section: S_AMP, checkpoint: true,
  }))
  if (adjNeeded) {
    lines.push(lookup({
      id: 'adjPct', label: 'Adjustment percent',
      say: `Table 310.15(C)(1): the row for ${ccc} current-carrying conductors.`,
      ref: REF.adjustment,
      value: pct, unit: 'pct',
      mistakes: cleanMistakes(pct, { rel: 0.001 }, [
        { value: adjustmentPct(ccc + 3), mistake: 'unknown', message: `That is a row for more conductors. ${ccc} is in the ${pct}% row.` },
      ]),
      section: S_AMP,
    }))
    lines.push(calc({
      id: 'base', label: 'Ampacity after adjustment',
      say: `Multiply the 90 °C ampacity by ${pct}% (× ${fmt(pct / 100)}). This is what the wire carries in a 30 °C room.`,
      a: amp90, op: '×', b: pct / 100, unit: 'A',
      section: S_AMP,
    }))
  }
  const baseLine = adjNeeded ? 'base' : 'amp90'

  lines.push(calc({
    id: 'need', label: 'Correction factor you need',
    say: `Divide the load by the ampacity you have: ${load} ÷ ${fmt(base)}.`,
    why: 'Load ÷ ampacity tells you how much of its ampacity the wire may lose to heat and still carry the load.',
    a: load, op: '÷', b: base, unit: 'factor', decimals: 4, tol: { rel: 0.005 },
    mistakes: cleanMistakes(need, { rel: 0.005 }, [
      adjNeeded && { value: load / amp90, mistake: 'correction_vs_adjustment', message: `Divide by the ADJUSTED ampacity (${fmt(base)} A), not the table value.` },
      { value: load / amp75, mistake: 'wrong_temp_column', message: `Use the 90 °C ampacity${adjNeeded ? ' after adjustment' : ''} (${fmt(base)} A), not the 75 °C value.` },
    ]),
    section: S_FACTOR, checkpoint: true,
  }))
  const hotter = TEMP_CORRECTION[r + 1]!.factor[2]
  lines.push(ruleLine({
    id: 'factor', kind: 'lookup', label: 'Smallest factor you may use',
    say: `Table 310.15(B)(1), 90 °C column: go down the rows while the factor is still ${fmt(need, 3)} or more. Stop at the last one.`,
    why: 'Each row down is a hotter room and a smaller factor. Below this row the wire could no longer carry the load.',
    ref: REF.tempCorrection,
    value: factor, unit: 'factor',
    expr: `${fmt(factor)} ≥ ${fmt(need, 3)}, and the next row (${fmt(hotter)}) is too small`,
    mistakes: cleanMistakes(factor, { rel: 0.001 }, [
      { value: hotter, mistake: 'rounded_wrong_way', message: `${fmt(hotter)} is less than the ${fmt(need, 3)} you need: that room is too hot. Go back up one row.` },
      { value: TEMP_CORRECTION[r]!.factor[1] ?? 0, mistake: 'wrong_temp_column', message: 'That is the 75 °C column. THHN uses the 90 °C column of the correction table.' },
    ]),
    section: S_FACTOR, checkpoint: true,
  }))
  lines.push(lookup({
    id: 'ambient', label: 'Highest ambient temperature',
    say: `Read the temperature range of that row in ${unit}. The answer is the TOP of the range.`,
    why: 'The row covers every temperature up to its top number; one degree more and you are in the next row.',
    ref: REF.tempCorrection,
    value: answer, unit: uUnit,
    mistakes: cleanMistakes(answer, { rel: 0.001 }, [
      { value: bottom(r, scale), mistake: 'unknown', message: `That is the bottom of the row. The row runs up to ${answer} ${unit}: the highest temperature is the top.` },
      { value: top(r + 1, scale), mistake: 'rounded_wrong_way', message: `That row's factor (${fmt(hotter)}) is too small for the load. Use the row above it.` },
    ]),
    section: S_FACTOR,
  }))

  const sections: Section[] = [
    { id: S_AMP, label: 'What the wire carries at 30 °C', totalLine: baseLine, letter: 'A' },
    { id: S_FACTOR, label: 'Highest ambient', totalLine: 'ambient', letter: 'T' },
  ]

  const r75 = hottestRow(load / (amp75 * (pct / 100)), 75)
  const rNoAdj = hottestRow(load / amp90, 90)
  const wrongs: WrongValue[] = [
    { value: top(r + 1, scale), mistake: 'rounded_wrong_way', why: `Used the row whose factor (${fmt(hotter)}) is below the ${fmt(need, 3)} needed: too hot.` },
    ...(r75 >= 0 ? [{ value: top(r75, scale), mistake: 'wrong_temp_column', why: 'Worked from the 75 °C columns; THHN derates from 90 °C.' }] : []),
    ...(adjNeeded && rNoAdj >= 0 ? [{ value: top(rNoAdj, scale), mistake: 'correction_vs_adjustment', why: 'Left out the adjustment for more than three current-carrying conductors.' }] : []),
    { value: bottom(r, scale), mistake: 'unknown', why: 'The bottom of the right row; the highest temperature is the top of the row.' },
    { value: top(r - 1, scale), mistake: 'unknown', why: 'One row too cool: the next row down still has a big enough factor.' },
  ]

  return {
    recipeId: ID,
    seed,
    story,
    givens: [
      { id: 'ccc', label: 'Current-carrying conductors', value: ccc, unit: 'count', phrase: `${word(ccc).replace(/^\w/, (c) => c.toUpperCase())} current-carrying` },
      { id: 'size', label: 'Wire', value: 0, unit: 'none', phrase: wire },
      { id: 'load', label: 'Load on each', value: load, unit: 'A', phrase: `${load} A` },
    ],
    ask: `the highest ambient temperature in ${unit}`,
    lines,
    sections,
    answerLine: 'ambient',
    choices: numericChoices(answer, wrongs, rng, { unit: uUnit, decimals: 0 }),
    visual: { kind: 'derate-reverse', size, ccc, load, amp90, adjustmentPct: pct, need, factor, row: TEMP_CORRECTION[r], scale, answer },
  }
}

function generate(seed: number): ProblemInstance {
  return buildReverse(pick(seed), seed)
}

export const derateReverse: Recipe = {
  id: ID,
  family: 'ampacity',
  title: 'Ampacity backwards: highest ambient',
  blurb: 'Load ÷ the ampacity you have gives the factor you need; the hottest row that still gives it is the answer.',
  topic: 'calculations',
  editions: ['2020'],
  generate,
  card: {
    whenToUse: 'The question gives the wire, how many carry current and the load, and asks how hot the room may get.',
    steps: [
      { label: 'Terminal check', how: 'The load must be within the wire’s 75 °C ampacity.', ref: REF.terminalTemp },
      { label: '90 °C ampacity', how: 'Table 310.16, 90 °C column for THHN.', ref: REF.ampacityTable },
      { label: 'Adjust', how: 'More than three current-carrying: × the Table 310.15(C)(1) percent.', ref: REF.adjustment },
      { label: 'Factor needed', how: 'Load ÷ that ampacity.' },
      { label: 'Find the row', how: '90 °C column of the correction table: the last row whose factor is still at least that.', ref: REF.tempCorrection },
      { label: 'Answer', how: 'The TOP temperature of that row.', ref: REF.tempCorrection },
    ],
    traps: [
      'The factor in the table must be AT LEAST the one you need. A smaller factor is a room that is too hot.',
      'The answer is the top of the row, not the bottom.',
      'Adjust for crowding before you divide.',
      'Use the 90 °C column of BOTH tables for THHN.',
    ],
    formulas: ['Factor needed = load ÷ (90 °C ampacity × adjustment)'],
  },
}
