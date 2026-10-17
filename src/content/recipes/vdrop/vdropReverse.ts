/**
 * Voltage drop backwards: "the smallest copper conductor that keeps the drop to 3%". Method:
 *   1. the drop allowed in volts = source × the percent (3% is × 0.03);
 *   2. CM needed = (2 or 1.732) × K × I × L ÷ VD allowed (the same formula with CM and VD swapped);
 *   3. Chapter 9, Table 8: the first size whose circular mils are AT LEAST that ("big enough" rounds up).
 * Voltage drop only; the question says so, and ampacity is a separate check.
 */
import { calc, choose, fmt, given, labelChoices, lookup, makeRng, type WrongLabel } from '@/calc'
import { AWG_SIZES, CIRCULAR_MILS, K_FACTOR, sizeLabel, SQRT3, type ConductorSize, type Metal } from '@/data/tables'
import { REF } from '@/data/refs'
import { REF_EXTRA } from '@/data/refsExtra'
import type { MistakeValue, ProblemInstance, Recipe, Section, WorkLine } from '@/shared/types'
import { cleanMistakes, opt, product, ruleLine } from '../kit'
import { METAL_NAME } from './vdrop'

const ID = 'vdrop-reverse'

export interface VdropReverseParams {
  phase: 1 | 3
  metal: Metal
  amps: number
  feet: number
  volts: number
  pct: number
}

/** The smallest size whose circular mils are at least `cm` (undefined when none is big enough). */
export function sizeForCm(cm: number, metal: Metal): ConductorSize | undefined {
  const start = metal === 'al' ? AWG_SIZES.indexOf('12') : 0
  return AWG_SIZES.slice(start).find((s) => CIRCULAR_MILS[s] >= cm - 1e-9)
}

function cmNeeded(phase: 1 | 3, metal: Metal, amps: number, feet: number, vdAllowed: number): number {
  return ((phase === 1 ? 2 : SQRT3) * K_FACTOR[metal] * amps * feet) / vdAllowed
}

function pick(seed: number): VdropReverseParams {
  const rng = makeRng(seed)
  for (let tries = 0; tries < 300; tries++) {
    const phase: 1 | 3 = rng.chance(0.5) ? 1 : 3
    const metal: Metal = rng.chance(0.75) ? 'cu' : 'al'
    const volts = phase === 1 ? rng.pick([120, 208, 240, 240]) : rng.pick([208, 480, 480])
    const amps = rng.step(10, phase === 1 && volts === 120 ? 20 : 200, 5)
    const feet = rng.step(75, 500, 25)
    const pct = rng.chance(0.85) ? 3 : 5
    const need = cmNeeded(phase, metal, amps, feet, volts * pct / 100)
    const size = sizeForCm(need, metal)
    // At least 10 AWG, so there is a smaller size to warn about.
    if (!size || AWG_SIZES.indexOf(size) < AWG_SIZES.indexOf('10')) continue
    // Keep clear of a table value (a student who rounds the needed CM must not land on the wrong size).
    const cm = CIRCULAR_MILS[size]
    const below = AWG_SIZES[AWG_SIZES.indexOf(size) - 1]
    if (cm / need < 1.01) continue
    if (below && need / CIRCULAR_MILS[below] < 1.01) continue
    return { phase, metal, amps, feet, volts, pct }
  }
  return { phase: 1, metal: 'cu', amps: 50, feet: 200, volts: 240, pct: 3 }
}

export function buildVdropReverse(p: VdropReverseParams, seed: number): ProblemInstance {
  const { phase, metal, amps, feet, volts, pct } = p
  const k = K_FACTOR[metal]
  const otherMetal: Metal = metal === 'cu' ? 'al' : 'cu'
  const mult = phase === 1 ? 2 : SQRT3
  const vdAllowed = volts * (pct / 100)
  const top = mult * k * amps * feet
  const need = top / vdAllowed
  const size = sizeForCm(need, metal) as ConductorSize
  const cm = CIRCULAR_MILS[size]
  const i = AWG_SIZES.indexOf(size)
  const below = AWG_SIZES[i - 1]
  const sys = phase === 1 ? `${volts} V single-phase` : `${volts} V three-phase`

  const story =
    `A ${sys} load of ${amps} A is ${feet} ft from the panel. Considering voltage drop only, what is the smallest ` +
    `${METAL_NAME[metal]} conductor that keeps the drop to ${pct}% of the source voltage?`

  const S_VD = 'allowed'
  const S_CM = 'cm'
  const S_SIZE = 'size'
  const lines: WorkLine[] = []

  lines.push(given({ id: 'volts', label: 'Source voltage', say: 'Write down the source voltage.', value: volts, unit: 'V', section: S_VD }))
  lines.push(calc({
    id: 'vdAllowed', label: 'Drop allowed, in volts',
    say: `Multiply the source voltage by ${pct}% (× ${fmt(pct / 100)}).`,
    why: `The question allows ${pct}% of the source. The NEC recommends 3% for a branch circuit and 5% for feeder plus branch together (an informational note, not a rule).`,
    ref: REF.vdBranchNote,
    a: volts, op: '×', b: pct / 100, unit: 'V',
    mistakes: cleanMistakes(vdAllowed, undefined, [
      { value: volts * (pct === 3 ? 0.05 : 0.03), mistake: 'vd_wrong_percent', message: `The question says ${pct}%: × ${fmt(pct / 100)}.` },
    ]),
    section: S_VD, checkpoint: true,
  }))

  lines.push(choose({
    id: 'phase', label: 'Single- or three-phase?',
    say: 'Which number starts the top of the formula: 2 or 1.732?',
    ref: REF_EXTRA.vdropFormula,
    options: [
      opt('2', 'Single-phase: start with 2', phase === 3 ? 'This is three-phase: use 1.732, not 2.' : undefined, phase === 3 ? 'sqrt3_missing' : undefined),
      opt('1.732', 'Three-phase: start with 1.732', phase === 1 ? 'This is single-phase: use 2.' : undefined, phase === 1 ? 'sqrt3_extra' : undefined),
    ],
    answerId: phase === 1 ? '2' : '1.732',
    section: S_CM, checkpoint: true,
  }))
  lines.push(lookup({
    id: 'k', label: `K for ${METAL_NAME[metal]}`,
    say: 'Copper 12.9, aluminum 21.2.',
    ref: REF_EXTRA.kFactor,
    value: k, unit: 'none',
    mistakes: [{ value: K_FACTOR[otherMetal], mistake: 'vd_wrong_k', message: `That is K for ${METAL_NAME[otherMetal]}. The wire is ${METAL_NAME[metal]}: K = ${k}.` }],
    section: S_CM,
  }))
  lines.push(given({ id: 'amps', label: 'Current (I)', say: 'Write down the load current.', value: amps, unit: 'A', section: S_CM }))
  lines.push(given({
    id: 'feet', label: 'One-way length (L)',
    say: 'The distance to the load, one way.',
    value: feet, unit: 'ft',
    mistakes: [{ value: feet * 2, mistake: 'vd_one_way_length', message: `Use the one-way length, ${feet} ft. The formula's 2 already counts the return.` }],
    section: S_CM, checkpoint: true,
  }))
  const topMistakes: (MistakeValue | false)[] = [
    { value: top * 2, mistake: 'vd_one_way_length', message: `Use ${feet} ft one way; the ${phase === 1 ? '2' : '1.732'} already counts the return.` },
    phase === 1 && { value: top / 2, mistake: 'vd_one_way_length', message: 'You left out the 2. Single-phase: 2 × K × I × L.' },
    phase === 1 && { value: top * SQRT3 / 2, mistake: 'sqrt3_extra', message: 'You used 1.732; single-phase starts with 2.' },
    phase === 3 && { value: top * 2 / SQRT3, mistake: 'sqrt3_missing', message: 'You used 2; three-phase starts with 1.732.' },
    { value: top * K_FACTOR[otherMetal] / k, mistake: 'vd_wrong_k', message: `Wrong K: ${METAL_NAME[metal]} is ${k}.` },
  ]
  lines.push(product({
    id: 'top', label: 'Top of the formula',
    say: `Multiply all the top numbers: ${fmt(mult)} × ${k} × ${amps} × ${feet}, then press =.`,
    ref: REF_EXTRA.vdropFormula,
    parts: [mult, k, amps, feet], unit: 'none',
    mistakes: cleanMistakes(top, undefined, topMistakes),
    section: S_CM,
  }))
  lines.push(calc({
    id: 'need', label: 'Circular mils needed',
    say: `Divide the top by the drop allowed: ${fmt(top)} ÷ ${fmt(vdAllowed)}.`,
    why: 'Same formula, turned around: instead of dividing by the circular mils, you divide by the volts you may lose.',
    a: top, op: '÷', b: vdAllowed, unit: 'cmil', decimals: 0,
    mistakes: cleanMistakes(need, undefined, [
      ...topMistakes.map((m) => m && { ...m, value: m.value / vdAllowed }),
      { value: top / (volts * (pct === 3 ? 0.05 : 0.03)), mistake: 'vd_wrong_percent', message: `Divide by ${pct}% of the source (${fmt(vdAllowed)} V).` },
    ]),
    section: S_CM, checkpoint: true,
  }))

  lines.push(ruleLine({
    id: 'cmPicked', kind: 'lookup', label: 'First Table 8 size that is big enough',
    say: `Chapter 9, Table 8: go down the circular-mil column to the first value that is ${fmt(need, 0)} or more.`,
    why: 'Big enough means round UP to the next size. A smaller wire would drop more than the limit.',
    ref: REF.ch9Table8,
    value: cm, unit: 'cmil',
    expr: `${fmt(need, 0)} → ${fmt(cm)} cmil`,
    mistakes: cleanMistakes(cm, { rel: 0.001 }, [
      below && { value: CIRCULAR_MILS[below], mistake: 'rounded_wrong_way', message: `${fmt(CIRCULAR_MILS[below])} is less than the ${fmt(need, 0)} you need. Go up one size.` },
    ]),
    section: S_SIZE, checkpoint: true,
  }))
  const window = AWG_SIZES.slice(Math.max(0, i - 2), i + 2)
  lines.push(choose({
    id: 'size', label: 'Smallest conductor',
    say: `Which wire size is the ${fmt(cm)} cmil row?`,
    ref: REF.ch9Table8,
    options: window.map((s) => s === size
      ? opt(s, sizeLabel(s))
      : AWG_SIZES.indexOf(s) < i
        ? opt(s, sizeLabel(s), `${sizeLabel(s)} has ${fmt(CIRCULAR_MILS[s])} cmil, less than the ${fmt(need, 0)} needed.`, 'rounded_wrong_way')
        : opt(s, sizeLabel(s), `${sizeLabel(s)} works, but ${sizeLabel(size)} is smaller and still big enough.`)),
    answerId: size,
    section: S_SIZE,
  }))

  const sections: Section[] = [
    { id: S_VD, label: 'Volts you may lose', totalLine: 'vdAllowed', letter: 'V' },
    { id: S_CM, label: 'Circular mils needed', totalLine: 'need', letter: 'C' },
    { id: S_SIZE, label: 'Wire size', totalLine: 'size', letter: 'S' },
  ]

  const sizeOr = (cmX: number) => sizeForCm(cmX, metal)
  const wrongs: WrongLabel[] = []
  const add = (s: ConductorSize | undefined, mistake: string, why: string) => {
    if (s && s !== size) wrongs.push({ label: sizeLabel(s), mistake, why })
  }
  add(below, 'rounded_wrong_way', 'Rounded the circular mils down; the wire must be at least as big as needed.')
  add(sizeOr(need * 2), 'vd_one_way_length', 'Doubled the length; the formula already counts the return.')
  add(phase === 1 ? sizeOr(need / 2) : sizeOr(need * 2 / SQRT3), phase === 1 ? 'vd_one_way_length' : 'sqrt3_missing',
    phase === 1 ? 'Left out the 2 of the single-phase formula.' : 'Used 2 instead of 1.732 on three-phase.')
  add(sizeOr(need * K_FACTOR[otherMetal] / k), 'vd_wrong_k', `Used K for ${METAL_NAME[otherMetal]}.`)
  add(sizeOr(top / (volts * (pct === 3 ? 0.05 : 0.03))), 'vd_wrong_percent', `Used ${pct === 3 ? 5 : 3}% instead of ${pct}%.`)

  return {
    recipeId: ID,
    seed,
    story,
    givens: [
      { id: 'volts', label: 'Source', value: volts, unit: 'V', phrase: sys },
      { id: 'amps', label: 'Current', value: amps, unit: 'A', phrase: `${amps} A` },
      { id: 'feet', label: 'One-way length', value: feet, unit: 'ft', phrase: `${feet} ft` },
      { id: 'pct', label: 'Drop allowed', value: pct, unit: 'pct', phrase: `${pct}%` },
    ],
    ask: `the smallest ${METAL_NAME[metal]} conductor for ${pct}% voltage drop`,
    lines,
    sections,
    answerLine: 'size',
    choices: labelChoices(sizeLabel(size), wrongs, AWG_SIZES.map(sizeLabel)),
    visual: { kind: 'vdrop-reverse', phase, k, amps, feet, volts, pct, vdAllowed, need, cm, size, metal },
  }
}

function generate(seed: number): ProblemInstance {
  return buildVdropReverse(pick(seed), seed)
}

export const vdropReverse: Recipe = {
  id: ID,
  family: 'vdrop',
  title: 'Voltage drop backwards: smallest wire',
  blurb: 'Turn the formula around: circular mils needed = 2 × K × I × L ÷ volts allowed, then round the size UP.',
  topic: 'calculations',
  editions: ['2020'],
  generate,
  card: {
    whenToUse: 'The question gives the load, the distance and a voltage-drop limit (3%), and asks for the smallest wire.',
    steps: [
      { label: 'Volts allowed', how: 'Source volts × 0.03 (for 3%).', ref: REF.vdBranchNote },
      { label: 'Phase and K', how: '2 or 1.732; copper 12.9, aluminum 21.2.', ref: REF_EXTRA.kFactor },
      { label: 'Top', how: '2 (or 1.732) × K × I × L, one-way length, press =.', ref: REF_EXTRA.vdropFormula },
      { label: 'CM needed', how: 'Top ÷ volts allowed.' },
      { label: 'Size', how: 'Chapter 9, Table 8: the first size with at least that many circular mils.', ref: REF.ch9Table8 },
    ],
    traps: [
      '3% is × 0.03, not × 3.',
      'Divide by the VOLTS allowed, not by the percent.',
      'Round the wire size UP: the next bigger circular-mil value.',
      'L is one way.',
    ],
    formulas: ['CM = 2 × K × I × L ÷ VD allowed (single-phase)', 'CM = 1.732 × K × I × L ÷ VD allowed (three-phase)'],
  },
}
