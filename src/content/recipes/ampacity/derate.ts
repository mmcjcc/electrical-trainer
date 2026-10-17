/**
 * Ampacity with correction and adjustment: "A raceway in a 104 °F boiler room holds two 3-phase
 * circuits ... all 8 AWG THHN ... allowable ampacity?" Method (2020 NEC):
 *   1. count the current-carrying conductors: neutrals that carry only the unbalanced current do not
 *      count (310.15(E)); equipment grounding conductors never count;
 *   2. start from the wire's own 90 °C column (Table 310.16), × the ambient correction factor
 *      (Table 310.15(B)(1), 90 °C column), × the adjustment factor for more than three
 *      current-carrying conductors (Table 310.15(C)(1));
 *   3. the terminals (110.14(C), 75 °C) cap it: the answer is the SMALLER of the derated value and the
 *      wire's 75 °C ampacity.
 */
import { calc, choose, fmt, given, lookup, makeRng, numericChoices, sum, type WrongValue } from '@/calc'
import {
  adjustmentPct, ampacity, sizeLabel, TEMP_CORRECTION, tempCorrection, type ConductorSize,
} from '@/data/tables'
import { REF } from '@/data/refs'
import type { MistakeValue, ProblemInstance, Recipe, Section, WorkLine } from '@/shared/types'
import { cleanMistakes, opt, ruleLine, word } from '../kit'

const ID = 'ampacity-derate'

export type CircuitKind = 'mwbc1' | '3phLinear' | '3phNonlinear' | '2phWye' | '2wire'

interface Kind {
  /** Ungrounded conductors and neutrals per circuit. */
  hots: number
  neutrals: number
  neutralCounts: boolean
  describe: (n: number) => string
  /** Why the neutral does or does not count, for the choose line. */
  rule: string
}

const KINDS: Record<CircuitKind, Kind> = {
  mwbc1: {
    hots: 2, neutrals: 1, neutralCounts: false,
    describe: (n) => `${word(n)} 120/240 V single-phase multiwire branch circuit${n === 1 ? '' : 's'}, each with two ungrounded conductors and a shared neutral`,
    rule: 'On a 120/240 V multiwire circuit the neutral carries only the difference between the two hots, so it does not count.',
  },
  '3phLinear': {
    hots: 3, neutrals: 1, neutralCounts: false,
    describe: (n) => `${word(n)} 208Y/120 V, 3-phase, 4-wire circuit${n === 1 ? '' : 's'} feeding resistance heaters, a linear load`,
    rule: 'A balanced 3-phase, 4-wire circuit with ordinary (linear) loads: the neutral carries only the unbalanced current, so it does not count.',
  },
  '3phNonlinear': {
    hots: 3, neutrals: 1, neutralCounts: true,
    describe: (n) => `${word(n)} 480Y/277 V, 3-phase, 4-wire circuit${n === 1 ? '' : 's'} whose load is mostly LED drivers, a nonlinear load`,
    rule: 'When most of the load is nonlinear (electronic), harmonic currents add up in the neutral of a 4-wire wye circuit, so it counts.',
  },
  '2phWye': {
    hots: 2, neutrals: 1, neutralCounts: true,
    describe: (n) => `${word(n)} circuit${n === 1 ? '' : 's'} made of two phase conductors and a neutral from a 208Y/120 V system`,
    rule: 'Two phases and the neutral of a wye system: the neutral carries about as much current as the phases, so it counts.',
  },
  '2wire': {
    hots: 1, neutrals: 1, neutralCounts: true,
    describe: (n) => `${word(n)} 120 V, 2-wire branch circuits, each with its own neutral`,
    rule: 'On a 2-wire circuit the neutral carries the full load current, the same as the hot, so it counts.',
  },
}

const PLACES = ['a boiler room', 'a furnace room', 'an attic', 'a mechanical room', 'a process area of a plant']
const SIZES: ConductorSize[] = ['12', '10', '10', '8', '8', '6', '6', '4', '3', '2', '1', '1/0', '2/0', '3/0', '4/0', '250']

export interface DerateParams {
  kind: CircuitKind
  circuits: number
  size: ConductorSize
  ambient: number
  scale: 'C' | 'F'
  place: string
}

/** Current-carrying conductors (and the counts a mistake would give). */
export function countCcc(kind: CircuitKind, circuits: number): { hots: number; neutrals: number; ccc: number } {
  const k = KINDS[kind]
  const hots = k.hots * circuits
  const neutrals = k.neutrals * circuits
  return { hots, neutrals, ccc: hots + (k.neutralCounts ? neutrals : 0) }
}

/** The allowable ampacity for given inputs (no story), shared with the mistake values. */
export function allowable(size: ConductorSize, ambient: number, scale: 'C' | 'F', ccc: number, derateCol: 75 | 90 = 90): number {
  const derated = ampacity('cu', size, derateCol) * tempCorrection(ambient, scale, derateCol) * (adjustmentPct(ccc) / 100)
  return Math.min(derated, ampacity('cu', size, 75))
}

function pick(seed: number): DerateParams {
  const rng = makeRng(seed)
  const hotRows = TEMP_CORRECTION.filter((r) => r.c[0] >= 31 && r.c[1] <= 60)
  for (let tries = 0; tries < 300; tries++) {
    const kind = rng.pick(Object.keys(KINDS) as CircuitKind[])
    const circuits = kind === '2wire' ? rng.int(2, 6) : rng.int(1, 3)
    const { ccc } = countCcc(kind, circuits)
    if (ccc > 20) continue
    const size = rng.pick(SIZES)
    const scale: 'C' | 'F' = rng.chance(0.5) ? 'C' : 'F'
    const row = rng.pick(hotRows)
    const [lo, hi] = scale === 'C' ? row.c : row.f
    const ambient = rng.int(lo, hi)
    // The two numbers compared at the end must not tie (the choose line needs one clear winner).
    const derated = ampacity('cu', size, 90) * tempCorrection(ambient, scale, 90) * (adjustmentPct(ccc) / 100)
    if (Math.abs(derated - ampacity('cu', size, 75)) < 0.5) continue
    return { kind, circuits, size, ambient, scale, place: rng.pick(PLACES) }
  }
  return { kind: '3phLinear', circuits: 2, size: '8', ambient: 104, scale: 'F', place: PLACES[0]! }
}

function rowOf(ambient: number, scale: 'C' | 'F'): number {
  return TEMP_CORRECTION.findIndex((r) => {
    const [lo, hi] = scale === 'C' ? r.c : r.f
    return ambient >= lo && ambient <= hi
  })
}

export function buildDerate(p: DerateParams, seed: number): ProblemInstance {
  const rng = makeRng(seed ^ 0xde)
  const { kind, circuits, size, ambient, scale, place } = p
  const k = KINDS[kind]
  const { hots, neutrals, ccc } = countCcc(kind, circuits)
  const unit = scale === 'C' ? '°C' : '°F'
  const amp90 = ampacity('cu', size, 90)
  const amp75 = ampacity('cu', size, 75)
  const corr = tempCorrection(ambient, scale, 90)
  const corr75 = tempCorrection(ambient, scale, 75)
  const adjNeeded = ccc > 3
  const pct = adjustmentPct(ccc)
  const corrected = amp90 * corr
  const derated = corrected * (pct / 100)
  const limitByTerminal = amp75 < derated
  const answer = Math.min(derated, amp75)
  const wireText = `${sizeLabel(size)} THHN copper`

  const story =
    `A raceway in ${place}, where the air reaches ${ambient} ${unit}, holds ${k.describe(circuits)} ` +
    `(${hots} ungrounded conductors and ${neutrals} neutral${neutrals === 1 ? '' : 's'}), plus one equipment grounding conductor. ` +
    `Every conductor is ${wireText}, and all terminals are rated 75 °C. ` +
    'What is the allowable ampacity of each current-carrying conductor?'

  const S_COUNT = 'count'
  const S_DERATE = 'derate'
  const S_LIMIT = 'limit'
  const lines: WorkLine[] = []

  // ---- C: count the current-carrying conductors --------------------------------------------------------
  lines.push(given({
    id: 'hots', label: 'Ungrounded (hot) conductors',
    say: 'Write down how many ungrounded conductors are in the raceway. They always count.',
    value: hots, unit: 'count', section: S_COUNT,
  }))
  lines.push(choose({
    id: 'neutral', label: 'Do the neutrals count?',
    say: `Look at what kind of circuit the neutrals belong to: ${k.describe(circuits).replace(/^\w+ /, '')}.`,
    why: k.rule,
    ref: REF.neutralCounting,
    options: [
      opt('no', 'No: they carry only the unbalanced current',
        k.neutralCounts ? k.rule : undefined, k.neutralCounts ? 'neutral_count' : undefined),
      opt('yes', 'Yes: they carry current like the hots',
        k.neutralCounts ? undefined : k.rule, k.neutralCounts ? undefined : 'neutral_count'),
    ],
    answerId: k.neutralCounts ? 'yes' : 'no',
    section: S_COUNT, checkpoint: true,
  }))
  if (k.neutralCounts) {
    lines.push(sum({
      id: 'ccc', label: 'Current-carrying conductors',
      say: 'Add the neutrals to the hots.',
      parts: [hots, neutrals], unit: 'count', tol: { abs: 0 },
      mistakes: cleanMistakes(ccc, { abs: 0 }, [
        { value: ccc + 1, mistake: 'egc_counted', message: 'The equipment grounding conductor never counts. Hots plus neutrals only.' },
      ]),
      section: S_COUNT,
    }))
  }
  lines.push(choose({
    id: 'egc', label: 'Does the ground count?',
    say: 'There is one equipment grounding conductor in the raceway. Does it count as current-carrying?',
    why: 'A grounding conductor carries current only during a fault, so it never counts toward the adjustment factor.',
    ref: REF.adjustment,
    options: [
      opt('no', 'No: grounding conductors never count'),
      opt('yes', 'Yes: count it with the others', 'The equipment grounding conductor carries no current in normal use; it never counts.', 'egc_counted'),
    ],
    answerId: 'no',
    section: S_COUNT, checkpoint: true,
  }))
  const countLine = k.neutralCounts ? 'ccc' : 'hots'

  // ---- D: derate from the 90 °C column ---------------------------------------------------------------------
  lines.push(choose({
    id: 'column', label: 'Which column to start from?',
    say: 'THHN is rated 90 °C. Which column of Table 310.16 do you derate from?',
    why: 'Correction and adjustment start from the wire’s own temperature rating. The 75 °C terminals are checked at the end.',
    ref: REF.ampacityTable,
    options: [
      opt('60', '60 °C column', 'Start from the wire’s own rating: THHN is 90 °C.', 'wrong_temp_column'),
      opt('75', '75 °C column', 'The 75 °C terminals are checked at the end. Derate from the wire’s own 90 °C column.', 'wrong_temp_column'),
      opt('90', '90 °C column'),
    ],
    answerId: '90',
    section: S_DERATE, checkpoint: true,
  }))
  lines.push(lookup({
    id: 'amp90', label: `Ampacity of ${sizeLabel(size)} at 90 °C`,
    say: `Table 310.16, copper, 90 °C column, the ${sizeLabel(size)} row.`,
    ref: REF.ampacityTable,
    value: amp90, unit: 'A',
    mistakes: cleanMistakes(amp90, { rel: 0.001 }, [
      { value: amp75, mistake: 'wrong_temp_column', message: 'That is the 75 °C column. Start from 90 °C for THHN.' },
      { value: ampacity('cu', size, 60), mistake: 'wrong_temp_column', message: 'That is the 60 °C column. Start from 90 °C for THHN.' },
    ]),
    section: S_DERATE,
  }))
  const r = rowOf(ambient, scale)
  const rowText = (i: number) => {
    const row = TEMP_CORRECTION[i]!
    const [lo, hi] = scale === 'C' ? row.c : row.f
    return `${lo}-${hi} ${unit}`
  }
  const neighbourFactors: MistakeValue[] = [r - 1, r + 1]
    .filter((i) => i >= 0 && i < TEMP_CORRECTION.length)
    .map((i) => ({ value: TEMP_CORRECTION[i]!.factor[2], mistake: 'unknown', message: `That is the ${rowText(i)} row. ${ambient} ${unit} is in the ${rowText(r)} row.` }))
  lines.push(lookup({
    id: 'corr', label: 'Ambient correction factor',
    say: `Table 310.15(B)(1): find the row for ${ambient} ${unit} and read the 90 °C column.`,
    why: 'Hot air around the wire means it can carry less current. The table is based on 30 °C (86 °F).',
    ref: REF.tempCorrection,
    value: corr, unit: 'factor',
    mistakes: cleanMistakes(corr, { rel: 0.001 }, [
      { value: corr75, mistake: 'wrong_temp_column', message: 'That is the 75 °C column of the correction table. THHN uses the 90 °C column.' },
      ...neighbourFactors,
    ]),
    section: S_DERATE, checkpoint: true,
  }))
  lines.push(calc({
    id: 'corrected', label: 'Corrected for the hot room',
    say: 'Multiply the 90 °C ampacity by the correction factor.',
    a: amp90, op: '×', b: corr, unit: 'A',
    section: S_DERATE,
  }))
  lines.push(choose({
    id: 'adjust', label: 'More than three current-carrying?',
    say: `You counted ${ccc} current-carrying conductors. Is that more than three?`,
    why: 'Wires bundled together heat each other. Over three in one raceway, the adjustment table cuts the ampacity.',
    ref: REF.adjustment,
    options: [
      opt('yes', 'Yes: use the adjustment table', adjNeeded ? undefined : `${ccc} is not more than three: no adjustment.`, adjNeeded ? undefined : 'correction_vs_adjustment'),
      opt('no', 'No: no adjustment', adjNeeded ? `${ccc} is more than three: Table 310.15(C)(1) applies.` : undefined, adjNeeded ? 'correction_vs_adjustment' : undefined),
    ],
    answerId: adjNeeded ? 'yes' : 'no',
    section: S_DERATE, checkpoint: true,
  }))
  if (adjNeeded) {
    const wrongNeutral = countCcc(kind, circuits).hots + (k.neutralCounts ? 0 : neutrals)
    lines.push(lookup({
      id: 'adjPct', label: 'Adjustment percent',
      say: `Table 310.15(C)(1): find the row for ${ccc} current-carrying conductors.`,
      ref: REF.adjustment,
      value: pct, unit: 'pct',
      mistakes: cleanMistakes(pct, { rel: 0.001 }, [
        { value: adjustmentPct(wrongNeutral), mistake: 'neutral_count', message: `That row is for ${wrongNeutral} conductors. ${k.rule}` },
        { value: adjustmentPct(ccc + 1), mistake: 'egc_counted', message: `That row is for ${ccc + 1}: the ground does not count. Use the row for ${ccc}.` },
        { value: corr * 100, mistake: 'correction_vs_adjustment', message: 'That is the temperature correction. The adjustment percent comes from the number of conductors.' },
      ]),
      section: S_DERATE, checkpoint: true,
    }))
    lines.push(calc({
      id: 'derated', label: 'Corrected and adjusted',
      say: `Multiply by the adjustment: ${pct}% is × ${fmt(pct / 100)}.`,
      a: corrected, op: '×', b: pct / 100, unit: 'A',
      section: S_DERATE,
    }))
  }
  const derateLine = adjNeeded ? 'derated' : 'corrected'

  // ---- L: the terminal limit -----------------------------------------------------------------------------------
  lines.push(lookup({
    id: 'amp75', label: `Ampacity of ${sizeLabel(size)} at 75 °C`,
    say: `The terminals are rated 75 °C. Table 310.16, copper, 75 °C column, the ${sizeLabel(size)} row.`,
    why: 'Whatever the wire can do, the terminals at its ends limit it to the 75 °C value (110.14(C)).',
    ref: REF.terminalTemp,
    value: amp75, unit: 'A',
    mistakes: cleanMistakes(amp75, { rel: 0.001 }, [
      { value: amp90, mistake: 'wrong_temp_column', message: 'That is the 90 °C column. The terminals are rated 75 °C.' },
      { value: ampacity('cu', size, 60), mistake: 'wrong_temp_column', message: 'That is the 60 °C column. The terminals are rated 75 °C.' },
    ]),
    section: S_LIMIT,
  }))
  lines.push(choose({
    id: 'limit', label: 'Which number wins?',
    say: `Compare the derated ${fmt(derated, 2)} A with the 75 °C value of ${amp75} A.`,
    why: 'The wire must be safe in the hot, crowded raceway AND at its terminals: the smaller number wins.',
    ref: REF.terminalTemp,
    options: [
      opt('derated', `The derated value, ${fmt(derated, 2)} A`,
        limitByTerminal ? `The terminals limit it to ${amp75} A, which is smaller. Keep the smaller number.` : undefined,
        limitByTerminal ? 'terminal_limit_missed' : undefined),
      opt('terminal', `The 75 °C terminal value, ${amp75} A`,
        limitByTerminal ? undefined : `The derated ${fmt(derated, 2)} A is smaller, so it limits the wire. Keep the smaller number.`,
        limitByTerminal ? undefined : 'terminal_limit_missed'),
    ],
    answerId: limitByTerminal ? 'terminal' : 'derated',
    section: S_LIMIT, checkpoint: true,
  }))
  lines.push(ruleLine({
    id: 'ampacity', label: 'Allowable ampacity',
    say: 'Write down the smaller of the two.',
    value: answer, unit: 'A', decimals: 1, tol: { rel: 0.005 },
    expr: `smaller of ${fmt(derated, 2)} A and ${amp75} A`,
    mistakes: cleanMistakes(answer, { rel: 0.005 }, [
      { value: Math.max(derated, amp75), mistake: 'terminal_limit_missed', message: 'That is the bigger of the two. The smaller one limits the wire.' },
    ]),
    section: S_LIMIT,
  }))

  const sections: Section[] = [
    { id: S_COUNT, label: 'Current-carrying conductors', totalLine: countLine, letter: 'C' },
    { id: S_DERATE, label: 'Derated ampacity', totalLine: derateLine, letter: 'D' },
    { id: S_LIMIT, label: 'Terminal limit', totalLine: 'ampacity', letter: 'T' },
  ]

  // ---- exam options -------------------------------------------------------------------------------------
  const wrongNeutralCcc = hots + (k.neutralCounts ? 0 : neutrals)
  const wrongs: WrongValue[] = [
    { value: Math.max(derated, amp75), mistake: 'terminal_limit_missed', why: 'Kept the bigger number; the derated value and the 75 °C terminal value are compared and the smaller wins.' },
    { value: allowable(size, ambient, scale, ccc, 75), mistake: 'wrong_temp_column', why: 'Derated from the 75 °C column; THHN derates from its own 90 °C column.' },
    { value: allowable(size, ambient, scale, wrongNeutralCcc), mistake: 'neutral_count', why: k.rule },
    { value: allowable(size, ambient, scale, ccc + 1), mistake: 'egc_counted', why: 'Counted the equipment grounding conductor; it never counts.' },
    { value: Math.min(amp90 * (pct / 100), amp75), mistake: 'correction_vs_adjustment', why: 'Left out the ambient temperature correction.' },
    { value: Math.min(corrected, amp75), mistake: 'correction_vs_adjustment', why: 'Left out the adjustment for more than three current-carrying conductors.' },
    { value: derated, mistake: 'terminal_limit_missed', why: 'Kept the derated number without checking the 75 °C terminal limit.' },
  ]

  return {
    recipeId: ID,
    seed,
    story,
    givens: [
      { id: 'ambient', label: 'Ambient temperature', value: ambient, unit: scale === 'C' ? 'degC' : 'degF', phrase: `${ambient} ${unit}` },
      { id: 'hots', label: 'Ungrounded conductors', value: hots, unit: 'count', phrase: `${hots} ungrounded conductors` },
      { id: 'neutrals', label: 'Neutrals', value: neutrals, unit: 'count', phrase: `${neutrals} neutral` },
      { id: 'size', label: 'Wire', value: 0, unit: 'none', phrase: wireText },
    ],
    ask: 'the allowable ampacity of each current-carrying conductor',
    lines,
    sections,
    answerLine: 'ampacity',
    choices: numericChoices(answer, wrongs, rng, { unit: 'A', decimals: 1 }),
    visual: {
      kind: 'derate', size, ambient, scale, ccc, amp90, correction: corr, adjustmentPct: pct, derated, terminal75: amp75, answer,
      conductors: { hots, neutrals, neutralCounts: k.neutralCounts, egc: 1 },
    },
  }
}

function generate(seed: number): ProblemInstance {
  return buildDerate(pick(seed), seed)
}

export const derateAmpacity: Recipe = {
  id: ID,
  family: 'ampacity',
  title: 'Ampacity: hot room, crowded raceway',
  blurb: 'Count the wires that carry current, derate from 90 °C for heat and crowding, then let the 75 °C terminals cap it.',
  topic: 'calculations',
  editions: ['2020'],
  generate,
  card: {
    whenToUse: 'The question gives a wire, an ambient temperature and several conductors in one raceway, and asks for the ampacity.',
    steps: [
      { label: 'Count', how: 'Hots always count. Neutrals: only when they carry real current. Grounds: never.', ref: REF.neutralCounting },
      { label: 'Start at 90 °C', how: 'THHN: Table 310.16, 90 °C column.', ref: REF.ampacityTable },
      { label: 'Correct for heat', how: 'Table 310.15(B)(1), the ambient row, the 90 °C column. Multiply.', ref: REF.tempCorrection },
      { label: 'Adjust for crowding', how: 'More than three current-carrying: Table 310.15(C)(1) percent. Multiply.', ref: REF.adjustment },
      { label: 'Terminal check', how: 'Read the 75 °C value of the same wire. Keep the smaller number.', ref: REF.terminalTemp },
    ],
    traps: [
      'A neutral that carries only the unbalanced current does not count; on a 2-wire circuit, two phases of a wye, or mostly nonlinear loads it does.',
      'The equipment grounding conductor never counts.',
      'Correction (heat) and adjustment (crowding) are two different tables. Apply both.',
      'Derate from 90 °C, then compare with 75 °C: the smaller wins.',
    ],
    formulas: ['Ampacity = 90 °C value × correction × adjustment, but not more than the 75 °C value'],
  },
}
