/**
 * Voltage drop by the K formula: "A 240 V single-phase load of 42 A is 150 ft from the panel on 6 AWG
 * copper. What is the voltage drop?" Method:
 *   single-phase  VD = 2 × K × I × L ÷ CM
 *   three-phase   VD = 1.732 × K × I × L ÷ CM
 * K = 12.9 copper, 21.2 aluminum; CM from Chapter 9, Table 8; L is the ONE-WAY length (the 2 already
 * counts the return). Percent = VD ÷ source volts × 100. Calculator habit: multiply all the top
 * numbers, press =, then divide by the bottom.
 */
import { calc, choose, fmt, given, lookup, makeRng, numericChoices, type WrongValue } from '@/calc'
import { ampacity, AWG_SIZES, CIRCULAR_MILS, K_FACTOR, sizeLabel, SQRT3, type ConductorSize, type Metal } from '@/data/tables'
import { REF } from '@/data/refs'
import { REF_EXTRA } from '@/data/refsExtra'
import type { MistakeValue, ProblemInstance, Recipe, Section, WorkLine } from '@/shared/types'
import { cleanMistakes, opt, product } from '../kit'

const ID = 'vdrop-forward'

const SIZES: ConductorSize[] = ['12', '10', '8', '6', '4', '3', '2', '1', '1/0', '2/0', '3/0', '4/0', '250', '350', '500']
export const METAL_NAME: Record<Metal, string> = { cu: 'copper', al: 'aluminum' }

export interface VdropParams {
  phase: 1 | 3
  metal: Metal
  size: ConductorSize
  amps: number
  feet: number
  volts: number
  ask: 'volts' | 'percent'
}

/** The voltage drop for given inputs (shared by the lines and the mistake values). */
export function vdrop(phase: 1 | 3, k: number, amps: number, feet: number, cm: number): number {
  return ((phase === 1 ? 2 : SQRT3) * k * amps * feet) / cm
}

function pick(seed: number): VdropParams {
  const rng = makeRng(seed)
  for (let tries = 0; tries < 300; tries++) {
    const phase: 1 | 3 = rng.chance(0.5) ? 1 : 3
    const metal: Metal = rng.chance(0.75) ? 'cu' : 'al'
    const size = rng.pick(SIZES)
    if (metal === 'al' && AWG_SIZES.indexOf(size) < AWG_SIZES.indexOf('8')) continue
    const amp75 = ampacity(metal, size, 75)
    const amps = rng.step(Math.max(10, Math.ceil(amp75 * 0.5 / 2) * 2), amp75, 2)
    const feet = rng.step(50, 400, 25)
    const volts = phase === 1 ? rng.pick([120, 208, 240, 240]) : rng.pick([208, 480, 480])
    if (phase === 1 && volts === 120 && amps > 30) continue
    const vd = vdrop(phase, K_FACTOR[metal], amps, feet, CIRCULAR_MILS[size])
    const pct = (vd / volts) * 100
    if (pct < 0.8 || pct > 7) continue
    return { phase, metal, size, amps, feet, volts, ask: rng.chance(0.5) ? 'volts' : 'percent' }
  }
  return { phase: 1, metal: 'cu', size: '6', amps: 42, feet: 150, volts: 240, ask: 'volts' }
}

export function buildVdrop(p: VdropParams, seed: number): ProblemInstance {
  const rng = makeRng(seed ^ 0x7d)
  const { phase, metal, size, amps, feet, volts, ask } = p
  const k = K_FACTOR[metal]
  const otherK = K_FACTOR[metal === 'cu' ? 'al' : 'cu']
  const cm = CIRCULAR_MILS[size]
  const mult = phase === 1 ? 2 : SQRT3
  const top = mult * k * amps * feet
  const vd = top / cm
  const frac = vd / volts
  const pct = frac * 100
  const sys = phase === 1 ? `${volts} V single-phase` : `${volts} V three-phase`
  const wire = `${sizeLabel(size)} ${METAL_NAME[metal]}`

  const story =
    `A ${sys} load draws ${amps} A and is ${feet} ft from the panel. The circuit conductors are ${wire}. ` +
    (ask === 'volts'
      ? 'What is the voltage drop on the circuit, in volts?'
      : `What is the voltage drop as a percent of the ${volts} V source?`)

  const S_SET = 'setup'
  const S_DROP = 'drop'
  const lines: WorkLine[] = []

  lines.push(choose({
    id: 'phase', label: 'Single- or three-phase?',
    say: 'Which number goes first in the formula: 2 or 1.732?',
    why: 'Single-phase current goes out and back on two wires: × 2. Three-phase currents share three wires: × 1.732.',
    ref: REF_EXTRA.vdropFormula,
    options: [
      opt('2', 'Single-phase: start with 2', phase === 3 ? 'This is three-phase: use 1.732, not 2.' : undefined, phase === 3 ? 'sqrt3_missing' : undefined),
      opt('1.732', 'Three-phase: start with 1.732', phase === 1 ? 'This is single-phase: use 2. 1.732 is only for three-phase.' : undefined, phase === 1 ? 'sqrt3_extra' : undefined),
    ],
    answerId: phase === 1 ? '2' : '1.732',
    section: S_SET, checkpoint: true,
  }))
  lines.push(lookup({
    id: 'k', label: `K for ${METAL_NAME[metal]}`,
    say: 'K is the resistance of one circular-mil foot: 12.9 for copper, 21.2 for aluminum.',
    ref: REF_EXTRA.kFactor,
    value: k, unit: 'none',
    mistakes: [{ value: otherK, mistake: 'vd_wrong_k', message: `That is K for ${METAL_NAME[metal === 'cu' ? 'al' : 'cu']}. The wire is ${METAL_NAME[metal]}: K = ${k}.` }],
    section: S_SET, checkpoint: true,
  }))
  lines.push(given({ id: 'amps', label: 'Current (I)', say: 'Write down the load current.', value: amps, unit: 'A', section: S_SET }))
  lines.push(given({
    id: 'feet', label: 'One-way length (L)',
    say: 'Write down the distance from the panel to the load, ONE way.',
    why: 'The 2 (or 1.732) in the formula already takes care of the trip back.',
    value: feet, unit: 'ft',
    mistakes: [{ value: feet * 2, mistake: 'vd_one_way_length', message: `Use the one-way length, ${feet} ft. The formula's 2 already counts the return trip.` }],
    section: S_SET, checkpoint: true,
  }))
  lines.push(lookup({
    id: 'cm', label: `Circular mils of ${sizeLabel(size)}`,
    say: `Chapter 9, Table 8: the ${sizeLabel(size)} row, the circular mils (area) column.`,
    ref: REF.ch9Table8,
    value: cm, unit: 'cmil',
    mistakes: cleanMistakes(cm, { rel: 0.001 }, neighbourCm(size)),
    section: S_SET,
  }))

  const topMistakes: (MistakeValue | false)[] = [
    { value: mult * k * amps * feet * 2, mistake: 'vd_one_way_length', message: `Use ${feet} ft, the one-way length. Doubling it AND using the ${phase === 1 ? '2' : '1.732'} counts the return twice.` },
    phase === 1 && { value: k * amps * feet, mistake: 'vd_one_way_length', message: 'You left out the 2 at the front. Single-phase: 2 × K × I × L.' },
    phase === 1 && { value: SQRT3 * k * amps * feet, mistake: 'sqrt3_extra', message: 'You used 1.732; that is for three-phase. Single-phase starts with 2.' },
    phase === 3 && { value: 2 * k * amps * feet, mistake: 'sqrt3_missing', message: 'You used 2; three-phase starts with 1.732.' },
    { value: mult * otherK * amps * feet, mistake: 'vd_wrong_k', message: `Wrong K: ${METAL_NAME[metal]} is ${k}.` },
  ]
  lines.push(product({
    id: 'top', label: 'Top of the formula',
    say: `Multiply all the top numbers in one run: ${fmt(mult)} × ${k} × ${amps} × ${feet}, then press =.`,
    why: 'Do the whole top first and press =. Then divide once by the bottom. That keeps the calculator in the right order.',
    ref: REF_EXTRA.vdropFormula,
    parts: [mult, k, amps, feet], unit: 'none',
    mistakes: cleanMistakes(top, undefined, topMistakes),
    section: S_DROP,
  }))
  lines.push(calc({
    id: 'vd', label: 'Voltage drop',
    say: `Divide the top by the circular mils: ${fmt(top)} ÷ ${fmt(cm)}.`,
    a: top, op: '÷', b: cm, unit: 'V', decimals: 2, tol: { abs: 0.01 },
    mistakes: cleanMistakes(vd, { abs: 0.01 }, topMistakes.map((m) => m && { ...m, value: m.value / cm })),
    sanity: `About ${fmt(pct, 1)}% of ${volts} V.`,
    section: S_DROP, checkpoint: ask === 'volts',
  }))
  if (ask === 'percent') {
    lines.push(calc({
      id: 'frac', label: 'Drop as a part of the source',
      say: `Divide the drop by the source voltage: ${fmt(vd, 2)} ÷ ${volts}.`,
      a: vd, op: '÷', b: volts, unit: 'none', decimals: 5,
      mistakes: cleanMistakes(frac, undefined, [
        volts !== 120 && phase === 1 && { value: vd / 120, mistake: 'wrong_voltage', message: `Divide by the ${volts} V source, not 120 V.` },
      ]),
      section: S_DROP,
    }))
    lines.push(calc({
      id: 'pct', label: 'Voltage drop percent',
      say: 'Multiply by 100 to make it a percent.',
      a: frac, op: '×', b: 100, unit: 'pct', decimals: 2, tol: { abs: 0.01 },
      mistakes: [{ value: Number(frac.toPrecision(10)), mistake: 'skipped_operation', message: 'That is the drop as a decimal. Multiply by 100 to make it a percent.' }],
      section: S_DROP, checkpoint: true,
    }))
  }

  const sections: Section[] = [
    { id: S_SET, label: 'The numbers for the formula', totalLine: 'cm', letter: 'N' },
    { id: S_DROP, label: 'Voltage drop', totalLine: ask === 'volts' ? 'vd' : 'pct', letter: 'V' },
  ]

  const scale = ask === 'volts' ? 1 : 100 / volts
  const wrongs: WrongValue[] = [
    { value: vd * 2 * scale, mistake: 'vd_one_way_length', why: 'Doubled the length; the formula’s 2 (or 1.732) already counts the return.' },
    ...(phase === 1
      ? [
          { value: (vd / 2) * scale, mistake: 'vd_one_way_length', why: 'Left out the 2 at the front of the single-phase formula.' },
          { value: vd * (SQRT3 / 2) * scale, mistake: 'sqrt3_extra', why: 'Used 1.732 on a single-phase circuit.' },
        ]
      : [{ value: vd * (2 / SQRT3) * scale, mistake: 'sqrt3_missing', why: 'Used 2 instead of 1.732 on a three-phase circuit.' }]),
    { value: vd * (otherK / k) * scale, mistake: 'vd_wrong_k', why: `Used K = ${otherK}; ${METAL_NAME[metal]} is ${k}.` },
    ...(ask === 'percent' ? [{ value: frac, mistake: 'decimal_slip', why: 'Forgot to multiply by 100 to make it a percent.' }] : []),
  ]
  const answer = ask === 'volts' ? vd : pct
  const unit = ask === 'volts' ? 'V' : 'pct'

  return {
    recipeId: ID,
    seed,
    story,
    givens: [
      { id: 'volts', label: 'Source', value: volts, unit: 'V', phrase: sys },
      { id: 'amps', label: 'Current', value: amps, unit: 'A', phrase: `${amps} A` },
      { id: 'feet', label: 'One-way length', value: feet, unit: 'ft', phrase: `${feet} ft` },
      { id: 'wire', label: 'Wire', value: 0, unit: 'none', phrase: wire },
    ],
    ask: ask === 'volts' ? 'the voltage drop in volts' : 'the voltage drop as a percent of the source',
    lines,
    sections,
    answerLine: ask === 'volts' ? 'vd' : 'pct',
    choices: numericChoices(answer, wrongs, rng, { unit, decimals: 2 }),
    visual: { kind: 'vdrop', phase, k, amps, feet, cm, vd, pct, volts, size, metal },
  }
}

/** Table 8 values of the sizes next to this one (reading the wrong row). */
function neighbourCm(size: ConductorSize): MistakeValue[] {
  const i = AWG_SIZES.indexOf(size)
  return [i - 1, i + 1]
    .filter((j) => j >= 0 && j < AWG_SIZES.length)
    .map((j) => ({ value: CIRCULAR_MILS[AWG_SIZES[j]!], mistake: 'unknown', message: `That is the ${sizeLabel(AWG_SIZES[j]!)} row. Slide to ${sizeLabel(size)}.` }))
}

function generate(seed: number): ProblemInstance {
  return buildVdrop(pick(seed), seed)
}

export const vdropForward: Recipe = {
  id: ID,
  family: 'vdrop',
  title: 'Voltage drop',
  blurb: 'The K formula: 2 (or 1.732) × K × I × L on top, circular mils on the bottom.',
  topic: 'calculations',
  editions: ['2020'],
  generate,
  card: {
    whenToUse: 'The question gives the load current, the distance and the wire, and asks for the voltage drop in volts or percent.',
    steps: [
      { label: 'Phase', how: 'Single-phase: 2. Three-phase: 1.732.', ref: REF_EXTRA.vdropFormula },
      { label: 'K', how: 'Copper 12.9, aluminum 21.2.', ref: REF_EXTRA.kFactor },
      { label: 'I and L', how: 'The load current and the ONE-WAY distance.' },
      { label: 'CM', how: 'Chapter 9, Table 8: the circular mils of the wire.', ref: REF.ch9Table8 },
      { label: 'Top', how: 'Multiply all the top numbers and press =.' },
      { label: 'Divide', how: 'Divide by the circular mils: that is the drop in volts.' },
      { label: 'Percent', how: 'Volts dropped ÷ source volts × 100.' },
    ],
    traps: [
      'L is one way. The 2 already covers the return trip.',
      '1.732 only on three-phase.',
      'Copper 12.9, aluminum 21.2: check the metal.',
      'Multiply the whole top first, press =, then divide once.',
    ],
    formulas: ['VD = 2 × K × I × L ÷ CM (single-phase)', 'VD = 1.732 × K × I × L ÷ CM (three-phase)', 'VD% = VD ÷ volts × 100'],
  },
}
