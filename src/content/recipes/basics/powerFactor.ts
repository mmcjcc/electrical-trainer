/**
 * Power factor: true power (W) over apparent power (VA).
 *   pf     PF = W ÷ VA, with VA = E × I (three-phase: E × 1.732 × I), shown as a percent
 *   kva    kVA = kW ÷ PF
 *   kw     kW = kVA × PF
 *   amps   single-phase I = W ÷ (E × PF): two lines, E × PF, then W ÷ that
 * Clean numbers by construction: the power factor and the VA are picked first.
 */
import { calc, choose, fmt, given, makeRng, numericChoices, valueOf, type WrongValue } from '@/calc'
import { SQRT3 } from '@/data/tables'
import { REF_EXTRA } from '@/data/refsExtra'
import type { MistakeValue, ProblemInstance, Recipe, Unit, WorkLine } from '@/shared/types'
import { cleanMistakes, opt, twoSections } from '../kit'

const ID = 'basics-power-factor'

export type PfForm = 'pf' | 'kva' | 'kw' | 'amps'

export interface PfParams {
  form: PfForm
  phase: 1 | 3
  volts: number
  amps: number
  pf: number
  kva: number
}

function pick(seed: number): PfParams {
  const rng = makeRng(seed)
  for (let tries = 0; tries < 200; tries++) {
    const form = rng.pick(['pf', 'pf', 'kva', 'kw', 'amps'] as const)
    const phase: 1 | 3 = form === 'pf' && rng.chance(0.4) ? 3 : 1
    const volts = phase === 3 ? rng.pick([208, 480]) : rng.pick([120, 240])
    const amps = rng.pick([10, 12, 15, 20, 25, 30, 40, 50])
    const pf = rng.pick([0.7, 0.75, 0.8, 0.85, 0.9, 0.95])
    const kva = rng.pick([10, 20, 25, 40, 50, 60, 75, 100, 150])
    const va = phase === 3 ? volts * SQRT3 * amps : volts * amps
    // Whole watts in the story.
    if (form === 'pf' && Math.abs(va * pf - Math.round(va * pf)) > 1e-6 && phase === 1) continue
    return { form, phase, volts, amps, pf, kva }
  }
  return { form: 'pf', phase: 1, volts: 240, amps: 20, pf: 0.85, kva: 50 }
}

export function buildPowerFactor(p: PfParams, seed: number): ProblemInstance {
  const rng = makeRng(seed ^ 0x9f)
  const { form, phase, volts, amps, pf, kva } = p
  const three = phase === 3
  const ref = REF_EXTRA.powerFactor
  const lines: WorkLine[] = []
  const givens: { id: string; label: string; value: number; unit: Unit; phrase: string }[] = []
  const g = (id: string, label: string, value: number, unit: Unit, phrase: string, say: string, mistakes?: MistakeValue[]) => {
    givens.push({ id, label, value, unit, phrase })
    lines.push(given({ id, label, say, value, unit, ...(mistakes ? { mistakes } : {}) }))
  }
  const formula = (right: string, wrong: { id: string; label: string; why: string; mistake: string }[]) => choose({
    id: 'formula', label: 'Which way round?',
    say: 'Power factor is true power over apparent power. Which formula fits what the question asks?',
    why: 'Watts (true power) are never more than volt-amperes (apparent power), so the power factor is never more than 1.',
    ref,
    options: rng.shuffle([opt('right', right), ...wrong.map((w) => opt(w.id, w.label, w.why, w.mistake))]),
    answerId: 'right',
    checkpoint: true,
  })

  let story = ''
  let ask = ''
  let unit: Unit = 'pct'
  const wrongs: WrongValue[] = []

  if (form === 'pf') {
    const va = three ? volts * SQRT3 * amps : volts * amps
    const watts = Math.round(va * pf)
    const sys = three ? `${volts} V, 3-phase` : `${volts} V, single-phase`
    story = `A ${sys} load draws ${amps} A and a wattmeter reads ${fmt(watts)} W. What is the power factor?`
    ask = 'the power factor, as a percent'
    lines.push(formula('PF = W ÷ VA', [
      { id: 'inv', label: 'PF = VA ÷ W', why: 'That puts the bigger number on top and gives more than 1. Watts go on top.', mistake: 'flipped_division' },
      { id: 'mul', label: 'PF = W × VA', why: 'Power factor is a ratio: divide, do not multiply.', mistake: 'inverse_op' },
    ]))
    givens.push({ id: 'sys', label: 'System', value: volts, unit: 'V', phrase: sys })
    g('amps', 'Current', amps, 'A', `${amps} A`, 'Write down the amps.')
    g('watts', 'True power', watts, 'W', `${fmt(watts)} W`, 'Write down the wattmeter reading.')
    if (three) {
      lines.push(calc({ id: 'v3', label: 'Volts × 1.732', say: `Multiply ${volts} by 1.732.`, ref: REF_EXTRA.threePhase, a: volts, op: '×', b: SQRT3, unit: 'V' }))
    }
    const vFactor = three ? volts * SQRT3 : volts
    lines.push(calc({
      id: 'va', label: 'Apparent power (VA)', say: three ? 'Multiply (volts × 1.732) by the amps.' : 'Multiply the volts by the amps.', ref: REF_EXTRA.threePhase,
      a: vFactor, op: '×', b: amps, unit: 'VA', decimals: 2,
      mistakes: cleanMistakes(vFactor * amps, undefined, [three && { value: volts * amps, mistake: 'sqrt3_missing', message: 'Three-phase VA = volts × 1.732 × amps.' }]),
    }))
    const ratio = watts / (vFactor * amps)
    lines.push(calc({
      id: 'ratio', label: 'Power factor (decimal)', say: 'Divide the watts by the VA.', ref,
      a: watts, op: '÷', b: vFactor * amps, unit: 'factor', decimals: 4,
      mistakes: cleanMistakes(ratio, undefined, [
        { value: (vFactor * amps) / watts, mistake: 'flipped_division', message: 'A power factor is never more than 1: watts go on top, VA on the bottom.' },
        three && { value: watts / (volts * amps), mistake: 'sqrt3_missing', message: 'Use the three-phase VA (with 1.732).' },
      ]),
      checkpoint: true,
    }))
    lines.push(calc({ id: 'answer', label: 'Power factor (percent)', say: 'Multiply by 100.', a: ratio, op: '×', b: 100, unit: 'pct', decimals: 1, tol: { abs: 0.06 } }))
    wrongs.push(
      { value: 100 / ratio, mistake: 'flipped_division', why: 'Divided VA by watts (a power factor can never be over 100%).' },
      ...(three ? [{ value: (watts / (volts * amps)) * 100, mistake: 'sqrt3_missing', why: 'Left out 1.732 in the three-phase VA.' }, { value: ratio * 100 / SQRT3, mistake: 'sqrt3_extra', why: 'Used 1.732 twice.' }] : [{ value: ratio * 100 / SQRT3, mistake: 'sqrt3_extra', why: 'Used 1.732 on single-phase.' }]),
    )
    unit = 'pct'
  } else if (form === 'kva' || form === 'kw') {
    const kw = kva * pf
    if (form === 'kva') {
      story = `A load uses ${fmt(kw)} kW at a power factor of ${fmt(pf)}. What is the apparent power in kVA?`
      ask = 'the apparent power in kVA'
      lines.push(formula('kVA = kW ÷ PF', [
        { id: 'mul', label: 'kVA = kW × PF', why: 'kVA is the BIGGER number: divide by the power factor.', mistake: 'pf_ignored' },
        { id: 'inv', label: 'kVA = PF ÷ kW', why: 'Divided the wrong way round: kW goes first.', mistake: 'flipped_division' },
      ]))
      g('kw', 'True power', kw, 'kW', `${fmt(kw)} kW`, 'Write down the kW.')
      g('pf', 'Power factor', pf, 'factor', `power factor of ${fmt(pf)}`, 'Write down the power factor.')
      lines.push(calc({
        id: 'answer', label: 'Apparent power (kVA)', say: 'Divide the kW by the power factor.', ref, a: kw, op: '÷', b: pf, unit: 'kVA', decimals: 2,
        mistakes: cleanMistakes(kva, undefined, [{ value: kw * pf, mistake: 'pf_ignored', message: 'kVA is bigger than kW: divide by the power factor.' }]),
      }))
      wrongs.push({ value: kw * pf, mistake: 'pf_ignored', why: 'Multiplied by the power factor; kVA = kW ÷ PF.' }, { value: kw, mistake: 'pf_ignored', why: 'Treated kW as kVA.' }, { value: kw / pf / pf, mistake: 'unknown', why: 'Divided by the power factor twice.' })
      unit = 'kVA'
    } else {
      story = `A ${fmt(kva)} kVA load operates at a power factor of ${fmt(pf)}. What is the true power in kW?`
      ask = 'the true power in kW'
      lines.push(formula('kW = kVA × PF', [
        { id: 'div', label: 'kW = kVA ÷ PF', why: 'kW is the SMALLER number: multiply by the power factor.', mistake: 'pf_ignored' },
        { id: 'inv', label: 'kW = PF ÷ kVA', why: 'That gives a tiny number: kW = kVA × PF.', mistake: 'flipped_division' },
      ]))
      g('kva', 'Apparent power', kva, 'kVA', `${fmt(kva)} kVA`, 'Write down the kVA.')
      g('pf', 'Power factor', pf, 'factor', `power factor of ${fmt(pf)}`, 'Write down the power factor.')
      lines.push(calc({
        id: 'answer', label: 'True power (kW)', say: 'Multiply the kVA by the power factor.', ref, a: kva, op: '×', b: pf, unit: 'kW', decimals: 2,
        mistakes: cleanMistakes(kw, undefined, [{ value: kva / pf, mistake: 'pf_ignored', message: 'kW is smaller than kVA: multiply by the power factor.' }]),
      }))
      wrongs.push({ value: kva / pf, mistake: 'pf_ignored', why: 'Divided by the power factor; kW = kVA × PF.' }, { value: kva, mistake: 'pf_ignored', why: 'Treated kVA as kW.' }, { value: kva * pf * pf, mistake: 'unknown', why: 'Multiplied by the power factor twice.' })
      unit = 'kW'
    }
  } else {
    const watts = Math.round(volts * amps * pf)
    const i = watts / (volts * pf)
    story = `A ${volts} V single-phase load uses ${fmt(watts)} W at a power factor of ${fmt(pf)}. What current does it draw?`
    ask = 'the current'
    lines.push(formula('I = W ÷ (E × PF)', [
      { id: 'nopf', label: 'I = W ÷ E', why: 'With a power factor below 1, the current is MORE than watts ÷ volts: divide by (E × PF).', mistake: 'pf_ignored' },
      { id: 'mul', label: 'I = W × PF ÷ E', why: 'Multiplying by PF makes the current smaller; it is bigger. Divide by PF.', mistake: 'pf_ignored' },
    ]))
    g('watts', 'True power', watts, 'W', `${fmt(watts)} W`, 'Write down the watts.')
    g('volts', 'Voltage', volts, 'V', `${volts} V`, 'Write down the volts.')
    g('pf', 'Power factor', pf, 'factor', `power factor of ${fmt(pf)}`, 'Write down the power factor.')
    lines.push(calc({ id: 'epf', label: 'Volts × power factor', say: 'Multiply the volts by the power factor. Do the bottom first.', ref, a: volts, op: '×', b: pf, unit: 'none' }))
    lines.push(calc({
      id: 'answer', label: 'Current', say: 'Divide the watts by that.', ref, a: watts, op: '÷', b: volts * pf, unit: 'A', decimals: 2,
      mistakes: cleanMistakes(i, undefined, [
        { value: watts / volts, mistake: 'pf_ignored', message: 'Divide by (volts × PF), not by the volts alone.' },
        { value: watts * pf / volts, mistake: 'pf_ignored', message: 'The power factor goes on the bottom with the volts.' },
      ]),
      checkpoint: true,
    }))
    wrongs.push({ value: watts / volts, mistake: 'pf_ignored', why: 'Left out the power factor.' }, { value: watts * pf / volts, mistake: 'pf_ignored', why: 'Multiplied by the power factor instead of dividing.' }, { value: watts / (volts * SQRT3 * pf), mistake: 'sqrt3_extra', why: 'Used 1.732 on single-phase.' })
    unit = 'A'
  }

  const sections = form === 'pf'
    ? twoSections(lines, 'va', { id: 'va', label: 'Apparent power', letter: 'V' }, { id: 'pf', label: 'Power factor', letter: 'F', totalLine: 'answer' })
    : undefined

  return {
    recipeId: ID,
    seed,
    story,
    givens,
    ask,
    lines,
    ...(sections ? { sections } : {}),
    answerLine: 'answer',
    choices: numericChoices(valueOf(lines, 'answer'), wrongs, rng, { unit, decimals: unit === 'pct' ? 1 : 2 }),
    visual: { kind: 'power-triangle', form, phase, volts, amps, pf, kva },
  }
}

function generate(seed: number): ProblemInstance {
  return buildPowerFactor(pick(seed), seed)
}

export const powerFactor: Recipe = {
  id: ID,
  family: 'basics',
  title: 'Power factor',
  blurb: 'Watts over volt-amperes: kW = kVA × PF, kVA = kW ÷ PF, and the current goes up when PF goes down.',
  topic: 'theory',
  editions: ['2020'],
  generate,
  card: {
    whenToUse: 'The question gives watts or kW, volt-amperes or kVA, or amps and volts with a power factor, and asks for one of the others.',
    steps: [
      { label: 'Which is bigger?', how: 'VA (apparent) is always at least W (true). PF is never more than 1.', ref: REF_EXTRA.powerFactor },
      { label: 'Formula', how: 'PF = W ÷ VA; kW = kVA × PF; kVA = kW ÷ PF; I = W ÷ (E × PF).' },
      { label: 'Calculate', how: 'Bottom first when there are two numbers on the bottom.' },
    ],
    traps: [
      'A power factor over 1 (or over 100%) means you divided the wrong way.',
      'kW × PF goes DOWN; kW ÷ PF goes UP. VA is the bigger one.',
      'Three-phase VA = volts × 1.732 × amps.',
    ],
    formulas: ['PF = W ÷ VA', 'kW = kVA × PF', 'kVA = kW ÷ PF', 'I = W ÷ (E × PF)'],
  },
}
