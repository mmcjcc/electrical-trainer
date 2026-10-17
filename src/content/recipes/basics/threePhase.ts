/**
 * Current from kVA or kW, and power from current (mostly three-phase, some single-phase so the 1.732
 * decision is real):
 *   I = VA ÷ (E × 1.732)          two lines: E × 1.732, then VA ÷ that   (single-phase: VA ÷ E)
 *   VA = W ÷ PF                   when the load is given in kW with a power factor
 *   VA = E × 1.732 × I, W = VA × PF, kVA = VA ÷ 1,000
 */
import { calc, choose, fmt, given, makeRng, numericChoices, valueOf, type WrongValue } from '@/calc'
import { SQRT3 } from '@/data/tables'
import { REF_EXTRA } from '@/data/refsExtra'
import type { MistakeValue, ProblemInstance, Recipe, Unit, WorkLine } from '@/shared/types'
import { cleanMistakes, opt, twoSections } from '../kit'

const ID = 'basics-three-phase'

export type TpForm = 'kva-amps' | 'kw-amps' | 'amps-kva' | 'amps-kw'

export interface TpParams {
  form: TpForm
  phase: 1 | 3
  volts: number
  kva: number
  kw: number
  pf: number
  amps: number
}

function pick(seed: number): TpParams {
  const rng = makeRng(seed)
  const form = rng.pick(['kva-amps', 'kva-amps', 'kw-amps', 'amps-kva', 'amps-kw'] as const)
  const phase: 1 | 3 = rng.chance(0.25) ? 1 : 3
  const volts = phase === 3 ? rng.pick([208, 240, 480, 480]) : rng.pick([120, 208, 240, 240])
  const pf = rng.pick([0.8, 0.85, 0.9, 0.95])
  const kva = rng.pick(phase === 3 ? [9, 15, 30, 45, 75, 112.5, 150] : [3, 5, 10, 15, 25])
  const kw = rng.pick(phase === 3 ? [10, 20, 25, 40, 50, 75, 100] : [2, 4, 5, 8, 10])
  const amps = rng.pick(phase === 3 ? [20, 25, 40, 50, 60, 80, 100, 150, 200] : [15, 20, 30, 40, 50])
  return { form, phase, volts, kva, kw, pf, amps }
}

const sysText = (phase: 1 | 3, volts: number) => (phase === 3 ? `${volts} V, 3-phase` : `${volts} V, single-phase`)

export function buildThreePhase(p: TpParams, seed: number): ProblemInstance {
  const rng = makeRng(seed ^ 0x3f)
  const { form, phase, volts, kva, kw, pf, amps } = p
  const three = phase === 3
  const ref = REF_EXTRA.threePhase
  const sys = sysText(phase, volts)
  const lines: WorkLine[] = []
  const givens: { id: string; label: string; value: number; unit: Unit; phrase: string }[] = []
  const g = (id: string, label: string, value: number, unit: Unit, phrase: string, say: string, mistakes?: MistakeValue[]) => {
    givens.push({ id, label, value, unit, phrase })
    lines.push(given({ id, label, say, value, unit, ...(mistakes ? { mistakes } : {}) }))
  }
  givens.push({ id: 'system', label: 'System', value: volts, unit: 'V', phrase: sys })

  lines.push(choose({
    id: 'phase', label: 'Single- or three-phase?',
    say: `The load is ${sys}. Does 1.732 go in?`,
    why: 'Three-phase power is carried on three wires at once: the volts get multiplied by 1.732 (the square root of 3). Single-phase: no 1.732.',
    ref,
    options: [
      opt('3', 'Three-phase: use volts × 1.732', three ? undefined : 'This is single-phase: no 1.732.', three ? undefined : 'sqrt3_extra'),
      opt('1', 'Single-phase: volts alone', three ? 'This is three-phase: multiply the volts by 1.732.' : undefined, three ? 'sqrt3_missing' : undefined),
    ],
    answerId: String(phase),
    checkpoint: true,
  }))

  let story = ''
  let ask = ''
  let unit: Unit = 'A'
  const wrongs: WrongValue[] = []
  const factor = three ? volts * SQRT3 : volts
  const pushV3 = () => {
    if (three) {
      lines.push(calc({ id: 'v3', label: 'Volts × 1.732', say: `Multiply ${volts} by 1.732. Do this first and write it down.`, ref, a: volts, op: '×', b: SQRT3, unit: 'V' }))
    }
  }

  if (form === 'kva-amps' || form === 'kw-amps') {
    let va: number
    if (form === 'kva-amps') {
      story = `A ${fmt(kva)} kVA, ${sys} load is supplied by a feeder. What is the full-load current?`
      ask = 'the full-load current'
      g('kva', 'Load in kVA', kva, 'kVA', `${fmt(kva)} kVA`, 'Write down the kVA.')
      lines.push(calc({
        id: 'va', label: 'Load in VA', say: 'Change kVA to VA: × 1,000.', a: kva, op: '×', b: 1000, unit: 'VA',
        mistakes: [{ value: kva, mistake: 'kilo_conversion', message: 'Change kVA to VA first: × 1,000.' }],
      }))
      va = kva * 1000
    } else {
      story = `A ${fmt(kw)} kW, ${sys} load has a power factor of ${fmt(pf)}. What current does it draw?`
      ask = 'the current'
      lines.push(choose({
        id: 'kwOrKva', label: 'kW or kVA?',
        say: 'The load is given in kW with a power factor. What do you need for the current?',
        why: 'Current depends on the volt-amperes (apparent power). kW is only the true power: VA = W ÷ PF.',
        ref: REF_EXTRA.powerFactor,
        options: [
          opt('divide', 'Change kW to VA: × 1,000, then ÷ the power factor'),
          opt('asis', 'Use the kW as if it were kVA', 'With a power factor below 1, kW and kVA are different: VA = W ÷ PF.', 'pf_ignored'),
          opt('multiply', 'Multiply by the power factor', 'Multiplying by PF goes the wrong way: VA is BIGGER than watts. Divide.', 'inverse_op'),
        ],
        answerId: 'divide',
        checkpoint: true,
      }))
      g('kw', 'Load in kW', kw, 'kW', `${fmt(kw)} kW`, 'Write down the kW.')
      lines.push(calc({
        id: 'w', label: 'Load in watts', say: 'Change kW to W: × 1,000.', a: kw, op: '×', b: 1000, unit: 'W',
        mistakes: [{ value: kw, mistake: 'kilo_conversion', message: 'Change kW to watts first: × 1,000.' }],
      }))
      g('pf', 'Power factor', pf, 'factor', `power factor of ${fmt(pf)}`, 'Write down the power factor (a decimal).')
      lines.push(calc({
        id: 'va', label: 'Load in VA', say: 'Divide the watts by the power factor.', ref: REF_EXTRA.powerFactor, a: kw * 1000, op: '÷', b: pf, unit: 'VA', decimals: 2,
        mistakes: cleanMistakes(kw * 1000 / pf, undefined, [{ value: kw * 1000, mistake: 'pf_ignored', message: 'Watts are not VA here: divide by the power factor.' }]),
        checkpoint: true,
      }))
      va = kw * 1000 / pf
    }
    givens.push({ id: 'volts', label: 'Voltage', value: volts, unit: 'V', phrase: `${volts} V` })
    pushV3()
    const amps2 = va / factor
    lines.push(calc({
      id: 'answer', label: 'Current', say: three ? 'Divide the VA by the (volts × 1.732) you wrote down.' : 'Divide the VA by the volts.', ref,
      a: va, op: '÷', b: factor, unit: 'A', decimals: 2,
      mistakes: cleanMistakes(amps2, undefined, [
        three && { value: va / volts, mistake: 'sqrt3_missing', message: 'Three-phase: divide by (volts × 1.732), not by volts alone.' },
        !three && { value: va / (volts * SQRT3), mistake: 'sqrt3_extra', message: 'Single-phase: no 1.732. Divide by the volts.' },
        { value: (va / 1000) / factor, mistake: 'kilo_conversion', message: 'Use VA (× 1,000), not kVA.' },
        form === 'kw-amps' && { value: kw * 1000 / factor, mistake: 'pf_ignored', message: 'Use the VA (watts ÷ power factor), not the watts.' },
        form === 'kw-amps' && { value: kw * 1000 * pf / factor, mistake: 'pf_ignored', message: 'You multiplied by the power factor. VA = W ÷ PF.' },
      ]),
      sanity: three && volts === 480 ? 'About 1.2 A for every kVA at 480 V three-phase.' : three && volts === 208 ? 'About 2.8 A for every kVA at 208 V three-phase.' : undefined,
      checkpoint: true,
    }))
    wrongs.push(
      three ? { value: va / volts, mistake: 'sqrt3_missing', why: 'Left out 1.732.' } : { value: va / (volts * SQRT3), mistake: 'sqrt3_extra', why: 'Used 1.732 on single-phase.' },
      ...(form === 'kw-amps'
        ? [{ value: kw * 1000 / factor, mistake: 'pf_ignored', why: 'Treated kW as kVA.' }, { value: kw * 1000 * pf / factor, mistake: 'pf_ignored', why: 'Multiplied by the power factor instead of dividing.' }]
        : [{ value: va / (volts * 3), mistake: 'unknown', why: 'Divided by 3 instead of 1.732.' }]),
      ...(three ? [] : [{ value: va / factor * SQRT3, mistake: 'sqrt3_extra', why: 'Multiplied by 1.732; single-phase has no 1.732.' }]),
    )
    unit = 'A'
  } else {
    // amps -> kVA or kW
    const wantKw = form === 'amps-kw'
    story = wantKw
      ? `A ${sys} load draws ${amps} A at a power factor of ${fmt(pf)}. What is the true power in kW?`
      : `A ${sys} load draws ${amps} A. What is the load in kVA?`
    ask = wantKw ? 'the true power in kW' : 'the load in kVA'
    givens.push({ id: 'amps', label: 'Current', value: amps, unit: 'A', phrase: `${amps} A` })
    pushV3()
    lines.push(calc({
      id: 'va', label: 'Volt-amperes', say: three ? 'Multiply (volts × 1.732) by the amps.' : 'Multiply the volts by the amps.', ref,
      a: factor, op: '×', b: amps, unit: 'VA', decimals: 2,
      mistakes: cleanMistakes(factor * amps, undefined, [
        three && { value: volts * amps, mistake: 'sqrt3_missing', message: 'Three-phase: volts × 1.732 × amps.' },
        !three && { value: volts * SQRT3 * amps, mistake: 'sqrt3_extra', message: 'Single-phase: no 1.732.' },
      ]),
    }))
    let total = factor * amps
    if (wantKw) {
      givens.push({ id: 'pf', label: 'Power factor', value: pf, unit: 'factor', phrase: `power factor of ${fmt(pf)}` })
      lines.push(calc({
        id: 'w', label: 'True power (W)', say: 'Multiply the VA by the power factor.', ref: REF_EXTRA.powerFactor, a: total, op: '×', b: pf, unit: 'W', decimals: 2,
        mistakes: cleanMistakes(total * pf, undefined, [{ value: total, mistake: 'pf_ignored', message: 'True power is VA × the power factor.' }]),
        checkpoint: true,
      }))
      total = total * pf
    }
    lines.push(calc({
      id: 'answer', label: wantKw ? 'True power (kW)' : 'Load (kVA)', say: 'Divide by 1,000.', a: total, op: '÷', b: 1000, unit: wantKw ? 'kW' : 'kVA', decimals: 2,
    }))
    const k = total / 1000
    wrongs.push(
      three ? { value: k / SQRT3, mistake: 'sqrt3_missing', why: 'Left out 1.732.' } : { value: k * SQRT3, mistake: 'sqrt3_extra', why: 'Used 1.732 on single-phase.' },
      ...(wantKw ? [{ value: k / pf, mistake: 'pf_ignored', why: 'That is the kVA; true power is kVA × power factor.' }, { value: k / pf / pf, mistake: 'pf_ignored', why: 'Divided by the power factor instead of multiplying.' }] : []),
      { value: k * 3 / SQRT3, mistake: 'unknown', why: 'Multiplied by 3 instead of 1.732.' },
    )
    unit = wantKw ? 'kW' : 'kVA'
  }

  const toAmps = form === 'kva-amps' || form === 'kw-amps'
  const sections = twoSections(lines, 'va',
    { id: 'va', label: 'Volt-amperes', letter: 'V' },
    { id: 'result', label: toAmps ? 'Current' : form === 'amps-kw' ? 'True power' : 'Load in kVA', letter: toAmps ? 'I' : 'P', totalLine: 'answer' })

  return {
    recipeId: ID,
    seed,
    story,
    givens,
    ask,
    lines,
    sections,
    answerLine: 'answer',
    choices: numericChoices(valueOf(lines, 'answer'), wrongs, rng, { unit, decimals: 2 }),
    visual: { kind: 'three-phase', form, phase, volts, kva, kw, pf, amps },
  }
}

function generate(seed: number): ProblemInstance {
  return buildThreePhase(pick(seed), seed)
}

export const threePhaseCurrent: Recipe = {
  id: ID,
  family: 'basics',
  title: 'Current from kVA or kW',
  blurb: 'Amps = VA ÷ (volts × 1.732) on three-phase: multiply the volts by 1.732 first, then divide.',
  topic: 'theory',
  editions: ['2020'],
  generate,
  card: {
    whenToUse: 'The question gives a load in kVA or kW (or the amps) on a single- or three-phase system and asks for the other.',
    steps: [
      { label: 'Phase', how: 'Three-phase: volts × 1.732. Single-phase: volts alone.', ref: REF_EXTRA.threePhase },
      { label: 'Kilo', how: 'kVA × 1,000 = VA; kW × 1,000 = W.' },
      { label: 'Power factor', how: 'Given kW and a PF: VA = W ÷ PF.', ref: REF_EXTRA.powerFactor },
      { label: 'Divide', how: 'Amps = VA ÷ (volts × 1.732). Write the bottom first, then divide.' },
    ],
    traps: [
      '1.732 only on three-phase.',
      'kVA to VA: × 1,000 before dividing.',
      'kW is not kVA unless the power factor is 1.',
      'Brain dump: 208 × 1.732 = 360; 240 × 1.732 = 416; 480 × 1.732 = 831.',
    ],
    formulas: ['I = VA ÷ (E × 1.732)', 'VA = W ÷ PF', 'kVA = E × 1.732 × I ÷ 1,000'],
  },
}
