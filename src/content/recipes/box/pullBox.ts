/**
 * Pull and junction boxes (314.28), raceways with conductors 4 AWG and larger:
 *   straight pull       length at least 8 × the largest raceway trade size (314.28(A)(1));
 *   angle or U pull     distance to the opposite wall at least 6 × the largest raceway in the row
 *                       plus the sum of the other raceways in that row on the same wall (314.28(A)(2)).
 * One row of raceways per problem, so there is one sum to add.
 */
import { calc, choose, fmt, given, lookup, makeRng, numericChoices, sum, valueOf, type WrongValue } from '@/calc'
import { PULL_BOX } from '@/data/tablesExtra'
import { REF } from '@/data/refs'
import { REF_EXTRA } from '@/data/refsExtra'
import type { ProblemInstance, Recipe, Section, WorkLine } from '@/shared/types'
import { cleanMistakes, inches, opt, withDisplay, word } from '../kit'

const ID = 'box-pull'

/** Trade sizes as printed and as a number for the calculator. */
const TRADE: { label: string; v: number }[] = [
  { label: '1-1/4', v: 1.25 }, { label: '1-1/2', v: 1.5 }, { label: '2', v: 2 }, { label: '2-1/2', v: 2.5 },
  { label: '3', v: 3 }, { label: '3-1/2', v: 3.5 }, { label: '4', v: 4 },
]
const CONDUCTORS = ['4 AWG', '2 AWG', '1/0 AWG', '3/0 AWG', '4/0 AWG', '250 kcmil', '350 kcmil', '500 kcmil']

export interface PullParams {
  pull: 'straight' | 'angle' | 'u'
  /** Trade-size indexes into TRADE, the row on the wall in question (largest anywhere). */
  row: number[]
  conductors: string
}

function pick(seed: number): PullParams {
  const rng = makeRng(seed)
  const pull = rng.pick(['straight', 'angle', 'angle', 'u'] as const)
  const n = pull === 'straight' ? rng.int(1, 3) : rng.int(2, 4)
  const row = Array.from({ length: n }, () => rng.int(1, TRADE.length - 1))
  return { pull, row: rng.shuffle(row), conductors: rng.pick(CONDUCTORS) }
}

function sizesText(row: number[]): string {
  const counts = new Map<number, number>()
  for (const i of row) counts.set(i, (counts.get(i) ?? 0) + 1)
  const parts = [...counts.entries()].sort((a, b) => b[0] - a[0]).map(([i, k]) => `${word(k)} ${TRADE[i]!.label} in. conduit${k > 1 ? 's' : ''}`)
  return parts.length === 1 ? parts[0]! : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
}

export function buildPull(p: PullParams, seed: number): ProblemInstance {
  const rng = makeRng(seed ^ 0x314)
  const { pull, row, conductors } = p
  const sizes = row.map((i) => TRADE[i]!.v)
  const largestIdx = row.reduce((a, b) => (b > a ? b : a))
  const largest = TRADE[largestIdx]!.v
  const others = [...sizes]
  others.splice(sizes.indexOf(largest), 1)
  const othersSum = others.reduce((s, v) => s + v, 0)
  const straight = pull === 'straight'
  const mult = straight ? PULL_BOX.straight : PULL_BOX.angle
  const base = mult * largest
  const answer = straight ? base : base + othersSum
  const condText = `${conductors} conductors`
  const rowText = sizesText(row)
  const conduits = row.length === 1 ? 'conduit' : 'conduits'

  const story = straight
    ? `A pull box has a straight pull of ${condText}. Entering one end: ${rowText}; the same ${conduits} leave the opposite end. What is the minimum length of the box?`
    : pull === 'angle'
      ? `A junction box has an angle pull of ${condText}. In one row on the left wall: ${rowText}. The conductors turn 90° and leave through the top wall. What is the minimum distance from the left wall to the opposite wall?`
      : `A pull box has a U pull of ${condText}. In one row on the left wall: ${rowText}, with the conductors entering and leaving through that same wall. What is the minimum distance from the left wall to the opposite wall?`

  const S_PULL = 'pull'
  const lines: WorkLine[] = []

  lines.push(choose({
    id: 'applies', label: 'Does 314.28 sizing apply?',
    say: `The conductors are ${conductors}. Is that 4 AWG or larger?`,
    why: 'The 8× and 6× rules are for big conductors (4 AWG and larger) that need room to bend.',
    ref: REF.pullBox,
    options: [
      opt('yes', 'Yes: 4 AWG or larger, the 8× / 6× rules apply'),
      opt('no', 'No: smaller than 4 AWG', `${conductors} is 4 AWG or larger.`, 'unknown'),
    ],
    answerId: 'yes',
    section: S_PULL,
  }))
  lines.push(choose({
    id: 'type', label: 'Straight, or angle/U?',
    say: straight ? 'The conductors go in one end and straight out the other.' : pull === 'angle' ? 'The conductors turn a corner.' : 'The conductors come in and go back out the same wall.',
    why: 'A straight pull needs length to pull through; a turn needs room to bend the conductor.',
    ref: REF.pullBox,
    options: [
      opt('straight', 'Straight pull: 8 × the largest raceway', straight ? undefined : 'The conductors change direction: that is an angle or U pull, 6 ×.', straight ? undefined : 'pull_wrong_multiplier'),
      opt('angle', 'Angle or U pull: 6 × the largest + the others in the row', straight ? 'In one end and out the other is a straight pull: 8 ×.' : undefined, straight ? 'pull_wrong_multiplier' : undefined),
    ],
    answerId: straight ? 'straight' : 'angle',
    section: S_PULL, checkpoint: true,
  }))
  lines.push(withDisplay(given({
    id: 'largest', label: 'Largest raceway (trade size)',
    say: `Write down the largest trade size${largest % 1 ? ` as a decimal: ${TRADE[largestIdx]!.label} is ${fmt(largest)}` : ''}.`,
    value: largest, unit: 'none',
    section: S_PULL,
  }), inches(largest)))
  lines.push(lookup({
    id: 'mult', label: 'Multiplier',
    say: straight ? 'Straight pull: 8.' : 'Angle or U pull: 6.',
    ref: straight ? REF_EXTRA.pullStraight : REF_EXTRA.pullAngle,
    value: mult, unit: 'none',
    mistakes: [{ value: straight ? PULL_BOX.angle : PULL_BOX.straight, mistake: 'pull_wrong_multiplier', message: straight ? 'A straight pull uses 8.' : 'An angle or U pull uses 6.' }],
    section: S_PULL, checkpoint: true,
  }))
  lines.push(withDisplay(calc({
    id: 'base', label: straight ? 'Minimum length' : `${mult} × the largest`,
    say: `Multiply ${mult} by ${fmt(largest)}.`,
    ref: straight ? REF_EXTRA.pullStraight : REF_EXTRA.pullAngle,
    a: mult, op: '×', b: largest, unit: 'none',
    mistakes: cleanMistakes(base, undefined, [
      { value: (straight ? PULL_BOX.angle : PULL_BOX.straight) * largest, mistake: 'pull_wrong_multiplier', message: straight ? 'A straight pull is 8 × the largest.' : 'An angle or U pull is 6 × the largest.' },
    ]),
    section: S_PULL, checkpoint: straight,
  }), inches(base)))

  if (!straight) {
    if (others.length === 1) {
      lines.push(withDisplay(given({
        id: 'others', label: 'The other raceway in the row',
        say: 'Write down the trade size of the other raceway on that wall.',
        ref: REF_EXTRA.pullAngle,
        value: othersSum, unit: 'none',
        section: S_PULL,
      }), inches(othersSum)))
    } else {
      lines.push(withDisplay(sum({
        id: 'others', label: 'The other raceways in the row',
        say: 'Add the trade sizes of the other raceways on that wall (not the largest one again).',
        ref: REF_EXTRA.pullAngle,
        parts: others, unit: 'none',
        mistakes: cleanMistakes(othersSum, undefined, [
          { value: othersSum + largest, mistake: 'unknown', message: 'Leave the largest out of this sum: it is already in the 6 ×.' },
        ]),
        section: S_PULL,
      }), inches(othersSum)))
    }
    lines.push(withDisplay(sum({
      id: 'distance', label: 'Minimum distance to the opposite wall',
      say: `Add the others to ${fmt(base)}.`,
      ref: REF_EXTRA.pullAngle,
      parts: [base, othersSum], unit: 'none',
      mistakes: cleanMistakes(answer, undefined, [
        { value: base, mistake: 'pull_forgot_others', message: 'Add the other raceways in the row to the 6 × the largest.' },
        { value: PULL_BOX.straight * largest + othersSum, mistake: 'pull_wrong_multiplier', message: 'An angle or U pull starts with 6 ×, not 8 ×.' },
        { value: base + othersSum + largest, mistake: 'unknown', message: 'The largest raceway is counted once, in the 6 ×. Do not add it again.' },
      ]),
      section: S_PULL, checkpoint: true,
    }), inches(answer)))
  }
  const answerLine = straight ? 'base' : 'distance'

  const sections: Section[] = [{ id: S_PULL, label: straight ? 'Minimum length' : 'Minimum distance', totalLine: answerLine, letter: 'P' }]

  const wrongs: WrongValue[] = straight
    ? [
        { value: PULL_BOX.angle * largest, mistake: 'pull_wrong_multiplier', why: 'Used 6 ×; a straight pull is 8 × the largest.' },
        ...(others.length ? [{ value: base + othersSum, mistake: 'unknown', why: 'Added the other raceways; a straight pull uses only the largest.' }] : []),
        { value: PULL_BOX.straight * sizes.reduce((s, v) => s + v, 0), mistake: 'unknown', why: '8 × every raceway; only the largest one counts.' },
      ]
    : [
        { value: base, mistake: 'pull_forgot_others', why: 'Forgot to add the other raceways in the row.' },
        { value: PULL_BOX.straight * largest + othersSum, mistake: 'pull_wrong_multiplier', why: 'Used 8 ×; an angle or U pull is 6 ×.' },
        { value: PULL_BOX.straight * largest, mistake: 'pull_wrong_multiplier', why: 'Used the straight-pull rule.' },
        { value: base + othersSum + largest, mistake: 'unknown', why: 'Added the largest raceway twice.' },
      ]

  return {
    recipeId: ID,
    seed,
    story,
    givens: [
      { id: 'conductors', label: 'Conductors', value: 0, unit: 'none', phrase: condText },
      { id: 'row', label: 'Raceways', value: largest, unit: 'none', phrase: rowText },
    ],
    ask: straight ? 'the minimum length of the box' : 'the minimum distance to the opposite wall',
    lines,
    sections,
    answerLine,
    choices: numericChoices(valueOf(lines, answerLine), wrongs, rng, { unit: 'none', label: inches }),
    visual: { kind: 'pull-box', pull, raceways: row.map((i) => TRADE[i]!.label), largest, multiplier: mult, others: othersSum, answer },
  }
}

function generate(seed: number): ProblemInstance {
  return buildPull(pick(seed), seed)
}

export const pullBox: Recipe = {
  id: ID,
  family: 'box',
  title: 'Pull box size',
  blurb: 'Straight pull: 8 × the largest raceway. Angle or U pull: 6 × the largest plus the others in the row.',
  topic: 'calculations',
  editions: ['2020'],
  generate,
  card: {
    whenToUse: 'The question shows raceways with 4 AWG or larger conductors entering a pull or junction box and asks for a length or a distance.',
    steps: [
      { label: 'Applies?', how: 'Conductors 4 AWG and larger.', ref: REF.pullBox },
      { label: 'Kind of pull', how: 'Straight: 8 ×. Angle or U: 6 ×.', ref: REF.pullBox },
      { label: 'Largest', how: 'The largest trade size (2-1/2 is 2.5).' },
      { label: 'Multiply', how: 'Multiplier × largest.', ref: REF_EXTRA.pullStraight },
      { label: 'Add the others', how: 'Angle or U only: add the other raceways in the same row.', ref: REF_EXTRA.pullAngle },
    ],
    traps: [
      'Straight pull: only the largest raceway counts, × 8.',
      'Angle pull: 6 × the largest, PLUS the others in the same row on that wall.',
      'Do not add the largest twice.',
    ],
    formulas: ['Straight: L = 8 × largest', 'Angle or U: D = 6 × largest + sum of the others in the row'],
  },
}
