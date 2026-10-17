/**
 * Transformer current and primary-only protection (Article 450, 1000 V and less): "A 45 kVA, 480 V to
 * 208Y/120 V, 3-phase transformer: primary current? secondary current? maximum primary protection?"
 * Method:
 *   current     single-phase I = VA ÷ E; three-phase I = VA ÷ (E × 1.732), with kVA × 1,000 = VA;
 *   protection  primary-only, Table 450.3(B): primary 9 A or more, 125% and the next standard size up is
 *               allowed (Note 1); 2 A to under 9 A, 167% maximum; under 2 A, 300% maximum. Below 9 A the
 *               percent is a ceiling: no rounding up.
 */
import { calc, choose, fmt, given, lookup, makeRng, nextStandardUp, numericChoices, standardBelow, STANDARD_OCPD, valueOf, type WrongValue } from '@/calc'
import { SQRT3, transformerPrimaryOnlyPct } from '@/data/tables'
import { REF } from '@/data/refs'
import { REF_EXTRA } from '@/data/refsExtra'
import type { ProblemInstance, Recipe, Section, WorkLine } from '@/shared/types'
import { cleanMistakes, opt, standardNeighbours } from '../kit'

const ID = 'transformer'

const KVA_1PH = [0.5, 0.75, 1, 1.5, 2, 3, 5, 7.5, 10, 15, 25, 37.5, 50, 75, 100, 167]
const KVA_3PH = [3, 6, 9, 15, 30, 45, 75, 112.5, 150, 225, 300, 500]

export interface XfmrParams {
  phase: 1 | 3
  kva: number
  primary: number
  /** The secondary voltage used for current: 240 for 120/240 V, 208 for 208Y/120 V, 480 for 480Y/277 V. */
  secondary: number
  ask: 'primary' | 'secondary' | 'protection'
}

const SECONDARY_TEXT: Record<number, string> = { 240: '120/240 V', 208: '208Y/120 V', 480: '480Y/277 V', 120: '120 V' }

export function currentOf(phase: 1 | 3, va: number, volts: number): number {
  return phase === 1 ? va / volts : va / (volts * SQRT3)
}

function band(i: number): '9up' | '2to9' | 'under2' {
  return i >= 9 ? '9up' : i >= 2 ? '2to9' : 'under2'
}

function pick(seed: number): XfmrParams {
  const rng = makeRng(seed)
  for (let tries = 0; tries < 300; tries++) {
    const phase: 1 | 3 = rng.chance(0.5) ? 1 : 3
    const ask = rng.pick(['primary', 'secondary', 'protection', 'protection'] as const)
    const kva = rng.pick(phase === 1 ? KVA_1PH : KVA_3PH)
    const [primary, secondary] = phase === 1
      ? rng.pick([[480, 240], [480, 240], [240, 120], [208, 120]] as const)
      : rng.pick([[480, 208], [480, 208], [208, 480]] as const)
    const ip = currentOf(phase, kva * 1000, primary)
    const is = currentOf(phase, kva * 1000, secondary)
    // Keep away from the band edges (2 A and 9 A) and from currents nobody would put on an exam.
    if (Math.abs(ip - 9) < 0.3 || Math.abs(ip - 2) < 0.1 || ip < 0.8 || ip > 1000 || is > 1500) continue
    if (ask !== 'protection' && kva < 3) continue
    return { phase, kva, primary, secondary, ask }
  }
  return { phase: 3, kva: 45, primary: 480, secondary: 208, ask: 'protection' }
}

export function buildTransformer(p: XfmrParams, seed: number): ProblemInstance {
  const rng = makeRng(seed ^ 0x450)
  const { phase, kva, primary, secondary, ask } = p
  const va = kva * 1000
  const side = ask === 'secondary' ? secondary : primary
  const otherSide = ask === 'secondary' ? primary : secondary
  const divisor = phase === 1 ? side : side * SQRT3
  const current = va / divisor
  const ip = currentOf(phase, va, primary)
  const is = currentOf(phase, va, secondary)
  const sys = phase === 1 ? 'single-phase' : '3-phase'
  const secText = SECONDARY_TEXT[secondary] ?? `${secondary} V`
  const xfmr = `${fmt(kva)} kVA, ${primary} V to ${secText}, ${sys} transformer`

  const askText = {
    primary: 'What is the full-load current on the primary?',
    secondary: `What is the full-load current on the ${secText} secondary?`,
    protection: 'With protection on the primary only, what is the maximum rating of the primary overcurrent device?',
  }[ask]
  const story = `A ${xfmr} supplies a panelboard. ${askText}`

  const S_I = 'current'
  const S_P = 'protect'
  const lines: WorkLine[] = []

  lines.push(choose({
    id: 'phase', label: 'Single- or three-phase?',
    say: `It is a ${sys} transformer. Does 1.732 go in the formula?`,
    why: 'Three-phase power is spread over three wires: divide by (volts × 1.732). Single-phase: divide by volts alone.',
    ref: REF_EXTRA.threePhase,
    options: [
      opt('1', 'Single-phase: amps = VA ÷ volts', phase === 3 ? 'This is three-phase: divide by (volts × 1.732).' : undefined, phase === 3 ? 'sqrt3_missing' : undefined),
      opt('3', 'Three-phase: amps = VA ÷ (volts × 1.732)', phase === 1 ? 'This is single-phase: no 1.732.' : undefined, phase === 1 ? 'sqrt3_extra' : undefined),
    ],
    answerId: String(phase),
    section: S_I, checkpoint: true,
  }))
  lines.push(given({ id: 'kva', label: 'Transformer rating', say: 'Write down the kVA rating.', value: kva, unit: 'kVA', section: S_I }))
  lines.push(calc({
    id: 'va', label: 'Rating in VA',
    say: 'Change kVA to VA: × 1,000.',
    a: kva, op: '×', b: 1000, unit: 'VA',
    section: S_I,
  }))
  if (phase === 3) {
    lines.push(calc({
      id: 'v3', label: `${side} V × 1.732`,
      say: `Multiply the ${ask === 'secondary' ? 'secondary' : 'primary'} voltage by 1.732. Do it first, then divide.`,
      a: side, op: '×', b: SQRT3, unit: 'V',
      mistakes: cleanMistakes(side * SQRT3, undefined, [
        { value: otherSide * SQRT3, mistake: 'wrong_voltage', message: `Use the ${ask === 'secondary' ? 'secondary' : 'primary'} voltage, ${side} V.` },
      ]),
      section: S_I,
    }))
  }
  const currentLabel = ask === 'secondary' ? 'Secondary full-load current' : 'Primary full-load current'
  lines.push(calc({
    id: 'current', label: currentLabel,
    say: phase === 1 ? `Divide the VA by the ${ask === 'secondary' ? 'secondary' : 'primary'} voltage.` : `Divide the VA by ${fmt(divisor)}.`,
    ref: REF_EXTRA.threePhase,
    a: va, op: '÷', b: divisor, unit: 'A', decimals: 2,
    mistakes: cleanMistakes(current, undefined, [
      { value: va / (phase === 1 ? otherSide : otherSide * SQRT3), mistake: 'wrong_voltage', message: `That uses ${otherSide} V. This side is ${side} V.` },
      { value: kva / divisor, mistake: 'kilo_conversion', message: 'Change kVA to VA first (× 1,000), then divide.' },
      phase === 3 && { value: va / side, mistake: 'sqrt3_missing', message: 'Three-phase: divide by (volts × 1.732), not by volts alone.' },
      phase === 3 && secondary === 208 && ask === 'secondary' && { value: va / (120 * SQRT3), mistake: 'wrong_voltage', message: 'Use the line-to-line voltage, 208 V, for three-phase current.' },
      phase === 1 && secondary === 240 && ask === 'secondary' && { value: va / 120, mistake: 'wrong_voltage', message: 'A 120/240 V secondary: use 240 V for the full-load current.' },
    ]),
    sanity: phase === 3 && side === 480 ? 'Quick check: at 480 V three-phase, amps ≈ kVA × 1.2.' : phase === 3 && side === 208 ? 'Quick check: at 208 V three-phase, amps ≈ kVA × 2.8.' : undefined,
    section: S_I, checkpoint: ask !== 'protection',
  }))

  let answerLine = 'current'
  if (ask === 'protection') {
    const b = band(ip)
    const { pct, nextSizeUp } = transformerPrimaryOnlyPct(ip)
    const max = ip * pct / 100
    const bandLabel = { '9up': '9 A or more', '2to9': '2 A to under 9 A', under2: 'under 2 A' }
    lines.push(choose({
      id: 'band', label: 'Which current band?',
      say: `The primary current is ${fmt(ip, 2)} A. Which band of Table 450.3(B) is that?`,
      why: 'Small transformers draw a big inrush for their size, so the table allows a bigger percent the smaller the current.',
      ref: REF.transformerOcpd,
      options: (['9up', '2to9', 'under2'] as const).map((x) => opt(x, bandLabel[x], x === b ? undefined : `${fmt(ip, 2)} A is in the "${bandLabel[b]}" band.`, x === b ? undefined : 'xfmr_wrong_percent')),
      answerId: b,
      section: S_P, checkpoint: true,
    }))
    lines.push(lookup({
      id: 'pct', label: 'Maximum percent (primary only)',
      say: `Table 450.3(B), primary-only protection, the ${bandLabel[b]} row.`,
      ref: REF.transformerOcpd,
      value: pct, unit: 'pct',
      mistakes: cleanMistakes(pct, { rel: 0.001 }, [125, 167, 300].filter((x) => x !== pct).map((x) => ({
        value: x, mistake: 'xfmr_wrong_percent', message: `${x}% is for a primary current of ${x === 125 ? '9 A or more' : x === 167 ? '2 A to under 9 A' : 'under 2 A'}. This one is ${fmt(ip, 2)} A.`,
      }))),
      section: S_P, checkpoint: true,
    }))
    lines.push(calc({
      id: 'max', label: 'Maximum rating before rounding',
      say: `Multiply the primary current by ${pct}% (× ${fmt(pct / 100)}).`,
      a: ip, op: '×', b: pct / 100, unit: 'A', decimals: 2,
      mistakes: cleanMistakes(max, undefined, [
        { value: is * pct / 100, mistake: 'wrong_voltage', message: 'That is the secondary current. Primary protection uses the PRIMARY current.' },
      ]),
      section: S_P,
    }))
    const isStd = (STANDARD_OCPD as readonly number[]).some((s) => Math.abs(s - max) < 1e-9)
    lines.push(choose({
      id: 'round', label: 'May you go up to the next standard size?',
      say: nextSizeUp ? `${fmt(max, 2)} A: may you go up to the next standard size?` : `${fmt(max, 2)} A is the ceiling. May you go up?`,
      why: nextSizeUp
        ? 'At 9 A or more, Note 1 to Table 450.3(B) lets you go up to the next standard size when 125% is not one.'
        : 'Below 9 A the percent is already generous; it is a maximum. You may not go up.',
      ref: nextSizeUp ? REF_EXTRA.transformerNote1 : REF.transformerOcpd,
      options: [
        opt('up', 'Yes: the next standard size up (Note 1)', nextSizeUp ? (isStd ? `${fmt(max, 2)} A is already standard; use it.` : undefined) : 'Only a primary current of 9 A or more may go up. This is a maximum.', nextSizeUp ? (isStd ? 'rounded_wrong_way' : undefined) : 'xfmr_no_round_up'),
        opt('no', 'No: keep the value, no rounding up', nextSizeUp && !isStd ? 'At 9 A or more, Note 1 allows the next size up.' : undefined, nextSizeUp && !isStd ? 'ocpd_rounded_down' : undefined),
      ],
      answerId: nextSizeUp && !isStd ? 'up' : 'no',
      section: S_P, checkpoint: true,
    }))
    if (nextSizeUp) {
      const dev = nextStandardUp(max)
      lines.push(lookup({
        id: 'device', label: 'Maximum primary device',
        say: `In the 240.6(A) list, the smallest standard size at or above ${fmt(max, 2)} A.`,
        ref: REF.standardOcpd,
        value: dev, unit: 'A',
        mistakes: cleanMistakes(dev, { rel: 0.001 }, [
          { value: standardBelow(dev) ?? 0, mistake: 'ocpd_rounded_down', message: `Note 1 lets you go UP to ${dev} A.` },
        ]),
        section: S_P,
      }))
      answerLine = 'device'
    } else {
      answerLine = 'max'
    }
  }

  const sections: Section[] = [
    { id: S_I, label: currentLabel, totalLine: 'current', letter: 'I' },
    ...(ask === 'protection' ? [{ id: S_P, label: 'Primary protection', totalLine: answerLine, letter: 'P' }] : []),
  ]

  let choices
  if (ask !== 'protection') {
    const wrongs: WrongValue[] = [
      { value: va / (phase === 1 ? otherSide : otherSide * SQRT3), mistake: 'wrong_voltage', why: `Used the ${otherSide} V side.` },
      phase === 3
        ? { value: va / side, mistake: 'sqrt3_missing', why: 'Left out 1.732 on a three-phase transformer.' }
        : { value: va / (side * SQRT3), mistake: 'sqrt3_extra', why: 'Used 1.732 on a single-phase transformer.' },
      ...(phase === 1 && side === 240 ? [{ value: va / 120, mistake: 'wrong_voltage', why: 'Used 120 V; the full-load current of a 120/240 V winding is figured at 240 V.' }] : []),
      ...(phase === 3 && ask === 'secondary' && secondary === 208 ? [{ value: va / (120 * SQRT3), mistake: 'wrong_voltage', why: 'Used 120 V; three-phase current uses the 208 V line voltage.' }] : []),
      { value: (va / divisor) * 1.25, mistake: 'unknown', why: 'Took 125%; the question asks for the full-load current itself.' },
    ]
    choices = numericChoices(valueOf(lines, 'current'), wrongs, rng, { unit: 'A', decimals: 2 })
  } else {
    const { pct, nextSizeUp } = transformerPrimaryOnlyPct(ip)
    const max = valueOf(lines, 'max')
    if (nextSizeUp) {
      const dev = valueOf(lines, 'device')
      const wrongs: WrongValue[] = [
        { value: standardBelow(dev) ?? 0, mistake: 'ocpd_rounded_down', why: 'Rounded down; Note 1 allows the next size up at 9 A or more.' },
        { value: nextStandardUp(ip * 1.67), mistake: 'xfmr_wrong_percent', why: '167% is only for primary currents under 9 A.' },
        { value: nextStandardUp(Math.max(is * 1.25, 15)), mistake: 'wrong_voltage', why: 'Used the secondary current.' },
        { value: nextStandardUp(Math.max(ip, 15)), mistake: 'xfmr_wrong_percent', why: 'Left out the 125%.' },
        ...standardNeighbours(dev, { below: 'Too small: 125% and the next size up is allowed.', above: 'Bigger than the next size up from 125%.' }),
      ]
      choices = numericChoices(dev, wrongs, rng, { unit: 'A', decimals: 0 })
    } else {
      const other = pct === 167 ? 300 : 167
      const wrongs: WrongValue[] = [
        { value: ip * 1.25, mistake: 'xfmr_wrong_percent', why: '125% is for primary currents of 9 A or more.' },
        { value: ip * other / 100, mistake: 'xfmr_wrong_percent', why: `${other}% is for the other small-current band.` },
        { value: nextStandardUp(max), mistake: 'xfmr_no_round_up', why: 'Rounded up; below 9 A the percent is a maximum.' },
        { value: is * pct / 100, mistake: 'wrong_voltage', why: 'Used the secondary current.' },
      ]
      choices = numericChoices(max, wrongs, rng, { unit: 'A', decimals: 2 })
    }
  }

  return {
    recipeId: ID,
    seed,
    story,
    givens: [
      { id: 'kva', label: 'Rating', value: kva, unit: 'kVA', phrase: `${fmt(kva)} kVA` },
      { id: 'primary', label: 'Primary voltage', value: primary, unit: 'V', phrase: `${primary} V to` },
      { id: 'secondary', label: 'Secondary', value: secondary, unit: 'V', phrase: secText },
      { id: 'phase', label: 'Phase', value: phase, unit: 'none', phrase: sys },
    ],
    ask: { primary: 'the primary full-load current', secondary: 'the secondary full-load current', protection: 'the maximum primary overcurrent device (primary-only protection)' }[ask],
    lines,
    sections,
    answerLine,
    choices,
    visual: { kind: 'transformer', phase, kva, primary, secondary, primaryAmps: ip, secondaryAmps: is, ask },
  }
}

function generate(seed: number): ProblemInstance {
  return buildTransformer(pick(seed), seed)
}

export const transformerRecipe: Recipe = {
  id: ID,
  family: 'transformer',
  title: 'Transformer current and primary protection',
  blurb: 'Amps = VA ÷ volts (× 1.732 for three-phase); primary-only protection 125%, 167% or 300% by the current.',
  topic: 'calculations',
  editions: ['2020'],
  generate,
  card: {
    whenToUse: 'The question gives a transformer’s kVA and voltages and asks for a full-load current or the primary overcurrent protection.',
    steps: [
      { label: 'Phase', how: 'Three-phase: divide by (volts × 1.732). Single-phase: by volts.', ref: REF_EXTRA.threePhase },
      { label: 'VA', how: 'kVA × 1,000.' },
      { label: 'Current', how: 'VA ÷ (the side’s volts, × 1.732 on three-phase).' },
      { label: 'Band', how: 'Primary 9 A or more: 125%. 2 A to under 9 A: 167%. Under 2 A: 300%.', ref: REF.transformerOcpd },
      { label: 'Round', how: '9 A or more: next standard size up is allowed. Under 9 A: no rounding up.', ref: REF_EXTRA.transformerNote1 },
    ],
    traps: [
      'Use the voltage of the side you are asked about.',
      'A 120/240 V secondary: figure the current at 240 V.',
      'Only primary currents of 9 A or more may round up to the next standard size.',
      'Quick checks: 480 V three-phase, amps ≈ kVA × 1.2; 208 V three-phase, amps ≈ kVA × 2.8.',
    ],
    formulas: ['I = VA ÷ E (single-phase)', 'I = VA ÷ (E × 1.732) (three-phase)', 'Primary device = I × 125% / 167% / 300%'],
  },
}
