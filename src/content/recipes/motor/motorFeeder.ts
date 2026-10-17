/**
 * Several motors on one feeder (Article 430): "A 460 V, 3-phase feeder supplies a 25 hp, a 10 hp and a
 * 5 hp motor ... feeder conductor ampacity? feeder breaker?" Method:
 *   conductor   125% of the LARGEST motor's FLC + 100% of the other FLCs (430.24);
 *   feeder OCPD the largest branch-circuit short-circuit device (Table 430.52 %, next size up per
 *               430.52(C)(1) Exception No. 1) + the other motors' FLCs, then the standard size AT OR
 *               BELOW that (430.62(A)): never round up. (As in the NEC's own Annex D Example D8.)
 * All motors use the same type of branch device and distinct FLCs, so "the largest" is one motor.
 */
import {
  calc, choose, fmt, lookup, makeRng, nextStandardUp, numericChoices, standardAtOrBelow, standardBelow,
  STANDARD_OCPD, sum, valueOf, type WrongValue,
} from '@/calc'
import { FLC_3PH, MOTOR_OCPD_PCT, OCPD_NAME, type Hp3, type OcpdType, type Volts3 } from '@/data/tables'
import { REF } from '@/data/refs'
import type { ProblemInstance, Recipe, Section, WorkLine } from '@/shared/types'
import { cleanMistakes, opt, standardNeighbours, word } from '../kit'

const ID = 'motor-feeder'

type Device = Exclude<OcpdType, 'instantaneous-cb'>
const DEVICES: Device[] = ['inverse-time-cb', 'inverse-time-cb', 'dual-element-fuse', 'nontime-fuse']
const HPS: Hp3[] = ['3', '5', '7-1/2', '10', '15', '20', '25', '30', '40', '50', '60', '75']

export interface FeederParams {
  volts: Volts3
  hps: Hp3[]
  device: Device
  ask: 'conductor' | 'ocpd'
}

/** A line or option id from a horsepower ('7-1/2' -> '7_1_2'). */
const slug = (hp: string) => hp.replace(/[^0-9a-z]/gi, '_')

const article = (s: string) => (/^[aeiou]/i.test(s) ? 'an' : 'a')

function pick(seed: number): FeederParams {
  const rng = makeRng(seed)
  for (let tries = 0; tries < 300; tries++) {
    const volts = rng.pick([208, 230, 460, 460, 575] as Volts3[])
    const n = rng.chance(0.6) ? 3 : 2
    const hps = rng.shuffle(HPS).slice(0, n)
    const flcs = hps.map((h) => FLC_3PH[h][volts])
    if (new Set(flcs).size !== flcs.length) continue
    const device = rng.pick(DEVICES)
    const largest = Math.max(...flcs)
    const raw = largest * MOTOR_OCPD_PCT[device] / 100
    if (raw < 15) continue
    const total = nextStandardUp(raw) + flcs.reduce((s, v) => s + v, 0) - largest
    if (total > 1200) continue
    return { volts, hps, device, ask: rng.chance(0.5) ? 'conductor' : 'ocpd' }
  }
  return { volts: 460, hps: ['25', '10', '5'], device: 'inverse-time-cb', ask: 'ocpd' }
}

export function buildFeeder(p: FeederParams, seed: number): ProblemInstance {
  const rng = makeRng(seed ^ 0xfeed)
  const { volts, device, ask } = p
  // List the motors largest first in the worksheet, in the story's order in the story.
  const motors = p.hps.map((hp) => ({ hp, flc: FLC_3PH[hp][volts] }))
  const big = motors.reduce((a, b) => (b.flc > a.flc ? b : a))
  const others = motors.filter((m) => m !== big)
  const otherSum = others.reduce((s, m) => s + m.flc, 0)
  const pct = MOTOR_OCPD_PCT[device]
  const dev = OCPD_NAME[device]
  const hpList = motors.map((m) => `${m.hp} hp`)
  const hpText = hpList.length === 2 ? `${hpList[0]} and ${hpList[1]}` : `${hpList.slice(0, -1).join(', ')} and ${hpList[hpList.length - 1]}`

  const story =
    `A ${volts} V, 3-phase feeder supplies ${word(motors.length)} squirrel-cage induction motors (not Design B energy-efficient): ${hpText}. ` +
    `Each motor branch circuit is protected by ${article(dev)} ${dev} at the largest rating Table 430.52 permits, using the next standard size up where needed. ` +
    (ask === 'conductor'
      ? 'What is the minimum ampacity of the feeder conductors?'
      : `What is the largest standard ${dev} permitted for the feeder?`)

  const S_FLC = 'flc'
  const S_COND = 'cond'
  const S_OCPD = 'ocpd'
  const lines: WorkLine[] = []

  for (const m of motors) {
    lines.push(lookup({
      id: `flc${slug(m.hp)}`, label: `FLC of the ${m.hp} hp motor`,
      say: `Table 430.250: the ${m.hp} hp row, the ${volts} V column.`,
      ref: REF.motorFlc3ph,
      value: m.flc, unit: 'A',
      section: S_FLC,
    }))
  }
  lines.push(choose({
    id: 'largest', label: 'Which motor is the largest?',
    say: 'Pick the motor with the biggest FLC (not the most horsepower on paper: compare the amps).',
    why: 'The extra 25% on a feeder, and the feeder breaker, both start from the largest motor.',
    ref: REF.motorFeeder,
    options: motors.map((m) => opt(`m${slug(m.hp)}`, `The ${m.hp} hp motor (${fmt(m.flc)} A)`,
      m === big ? undefined : `The ${big.hp} hp motor has the bigger FLC, ${fmt(big.flc)} A.`, m === big ? undefined : 'largest_motor_25')),
    answerId: `m${slug(big.hp)}`,
    section: S_FLC, checkpoint: true,
  }))

  // ---- C: feeder conductor -------------------------------------------------------------------------------
  const big125 = big.flc * 1.25
  lines.push(calc({
    id: 'big125', label: 'Largest motor at 125%',
    say: `Multiply the ${big.hp} hp FLC by 1.25.`,
    ref: REF.motorFeeder,
    a: big.flc, op: '×', b: 1.25, unit: 'A',
    mistakes: cleanMistakes(big125, undefined, [
      { value: big.flc, mistake: 'largest_motor_25', message: 'The largest motor gets 125%: × 1.25.' },
    ]),
    section: S_COND, checkpoint: true,
  }))
  const condTotal = big125 + otherSum
  lines.push(sum({
    id: 'feederAmps', label: 'Feeder conductor ampacity',
    say: 'Add the other motors’ FLCs, at 100%, to the largest at 125%.',
    why: 'Motors rarely all start or peak together; one extra 25% (on the biggest) covers the feeder.',
    ref: REF.motorFeeder,
    parts: [big125, ...others.map((m) => m.flc)], unit: 'A', decimals: 2,
    mistakes: cleanMistakes(condTotal, undefined, [
      { value: (big.flc + otherSum) * 1.25, mistake: 'motor_feeder_125_all', message: 'Only the largest motor gets 125%. Add the others at 100%.' },
      { value: big.flc + otherSum, mistake: 'largest_motor_25', message: `Use the largest motor at 125% (${fmt(big125)} A), not ${fmt(big.flc)} A.` },
    ]),
    section: S_COND, checkpoint: ask === 'conductor',
  }))

  // ---- P: feeder protection -----------------------------------------------------------------------------------
  lines.push(lookup({
    id: 'pct', label: `Table 430.52 percent for ${article(dev)} ${dev}`,
    say: `Table 430.52: squirrel-cage motors other than Design B energy-efficient, the ${dev} column.`,
    ref: REF.motorOcpdTable,
    value: pct, unit: 'pct',
    mistakes: cleanMistakes(pct, { rel: 0.001 }, [
      { value: 125, mistake: 'motor_wrong_percent', message: '125% is for the conductors. The breaker or fuse comes from Table 430.52.' },
    ]),
    section: S_OCPD,
  }))
  const raw = big.flc * pct / 100
  lines.push(calc({
    id: 'raw', label: `Branch device for the ${big.hp} hp motor, before rounding`,
    say: `Multiply its FLC by ${pct}% (× ${fmt(pct / 100)}).`,
    a: big.flc, op: '×', b: pct / 100, unit: 'A',
    section: S_OCPD,
  }))
  const branch = nextStandardUp(raw)
  lines.push(lookup({
    id: 'branch', label: `Branch device for the ${big.hp} hp motor`,
    say: `The standard size at or above ${fmt(raw)} A (the next size up is allowed for a motor branch circuit).`,
    ref: REF.motorOcpdNextSize,
    value: branch, unit: 'A',
    mistakes: cleanMistakes(branch, { rel: 0.001 }, [
      { value: standardBelow(branch) ?? 0, mistake: 'ocpd_rounded_down', message: `For the BRANCH device the next size up is allowed: ${branch} A.` },
    ]),
    section: S_OCPD,
  }))
  const ocpdSum = branch + otherSum
  lines.push(sum({
    id: 'ocpdSum', label: 'Largest branch device + the other FLCs',
    say: `Add the other motors’ FLCs to the ${branch} A branch device.`,
    why: 'The feeder device must let the biggest motor start on its own device while the others run.',
    ref: REF.motorFeederOcpd,
    parts: [branch, ...others.map((m) => m.flc)], unit: 'A', decimals: 2,
    mistakes: cleanMistakes(ocpdSum, undefined, [
      { value: big.flc + otherSum, mistake: 'motor_feeder_used_flc', message: `Start from the largest motor's branch DEVICE (${branch} A), not its FLC.` },
      { value: raw + otherSum, mistake: 'motor_feeder_raw_device', message: `Use the device's standard rating, ${branch} A, not the ${fmt(raw)} A you calculated.` },
      { value: condTotal, mistake: 'motor_feeder_used_flc', message: 'That is the conductor ampacity. The feeder device starts from the largest branch device.' },
    ]),
    section: S_OCPD, checkpoint: true,
  }))
  const isStd = (STANDARD_OCPD as readonly number[]).some((s) => Math.abs(s - ocpdSum) < 1e-9)
  const feeder = standardAtOrBelow(ocpdSum)
  lines.push(choose({
    id: 'round', label: 'Not a standard size: which way?',
    say: `Is ${fmt(ocpdSum)} A a standard size? If not, up or down?`,
    why: 'This is a ceiling: the feeder device may not be MORE than this. So you go DOWN to the standard size at or below (430.62(A)).',
    ref: REF.motorFeederOcpd,
    options: [
      opt('down', 'Not standard: down to the standard size at or below', isStd ? `${fmt(ocpdSum)} A is already standard; use it.` : undefined, isStd ? 'rounded_wrong_way' : undefined),
      opt('up', 'Not standard: up to the next standard size', 'A motor feeder device does NOT go up: 430.62(A) sets a maximum.', 'ocpd_next_size_not_allowed'),
      opt('exact', 'It is already a standard size', isStd ? undefined : `${fmt(ocpdSum)} A is not in the 240.6(A) list.`, isStd ? undefined : 'unknown'),
    ],
    answerId: isStd ? 'exact' : 'down',
    section: S_OCPD, checkpoint: true,
  }))
  lines.push(lookup({
    id: 'feeder', label: `Largest feeder ${dev}`,
    say: `In the 240.6(A) list, the largest standard size that is not more than ${fmt(ocpdSum)} A.`,
    ref: REF.standardOcpd,
    value: feeder, unit: 'A',
    mistakes: cleanMistakes(feeder, { rel: 0.001 }, [
      { value: nextStandardUp(ocpdSum), mistake: 'ocpd_next_size_not_allowed', message: `${nextStandardUp(ocpdSum)} A is more than the ${fmt(ocpdSum)} A ceiling. A motor feeder goes DOWN.` },
    ]),
    section: S_OCPD,
  }))

  const sections: Section[] = [
    { id: S_FLC, label: 'Motor FLCs', totalLine: 'largest', letter: 'F' },
    { id: S_COND, label: 'Feeder conductor', totalLine: 'feederAmps', letter: 'C' },
    { id: S_OCPD, label: 'Feeder protection', totalLine: 'feeder', letter: 'P' },
  ]

  let choices
  if (ask === 'conductor') {
    const small = motors.reduce((a, b) => (b.flc < a.flc ? b : a))
    const wrongs: WrongValue[] = [
      { value: (big.flc + otherSum) * 1.25, mistake: 'motor_feeder_125_all', why: 'Took 125% of every motor; only the largest gets 125%.' },
      { value: big.flc + otherSum, mistake: 'largest_motor_25', why: 'Added the FLCs without the extra 25% on the largest motor.' },
      { value: big.flc + otherSum + small.flc * 0.25, mistake: 'largest_motor_25', why: 'Put the extra 25% on the smallest motor instead of the largest.' },
      { value: big125, mistake: 'unknown', why: 'Only the largest motor; the others must be added at 100%.' },
    ]
    choices = numericChoices(valueOf(lines, 'feederAmps'), wrongs, rng, { unit: 'A', decimals: 2 })
  } else {
    const wrongs: WrongValue[] = [
      { value: nextStandardUp(ocpdSum), mistake: 'ocpd_next_size_not_allowed', why: 'Rounded UP; a motor feeder device goes to the standard size at or below.' },
      { value: big.flc + otherSum >= 15 ? standardAtOrBelow(big.flc + otherSum) : 0, mistake: 'motor_feeder_used_flc', why: 'Started from the largest FLC instead of its branch-circuit device.' },
      { value: standardAtOrBelow(raw + otherSum), mistake: 'motor_feeder_raw_device', why: `Used ${fmt(raw)} A instead of the ${branch} A branch device.` },
      ...standardNeighbours(feeder, { below: 'Smaller than allowed: the largest standard size at or below the total is permitted.', above: 'Bigger than the 430.62(A) ceiling.' }),
    ]
    choices = numericChoices(feeder, wrongs, rng, { unit: 'A', decimals: 0 })
  }

  return {
    recipeId: ID,
    seed,
    story,
    givens: [
      { id: 'volts', label: 'Feeder voltage', value: volts, unit: 'V', phrase: `${volts} V, 3-phase` },
      ...motors.map((m) => ({ id: `hp${slug(m.hp)}`, label: 'Motor', value: 0, unit: 'hp' as const, phrase: `${m.hp} hp` })),
      { id: 'device', label: 'Branch devices', value: 0, unit: 'none', phrase: dev },
    ],
    ask: ask === 'conductor' ? 'the minimum ampacity of the feeder conductors' : `the largest standard feeder ${dev}`,
    lines,
    sections,
    answerLine: ask === 'conductor' ? 'feederAmps' : 'feeder',
    choices,
    visual: {
      kind: 'motor-feeder', volts, device, devicePct: pct,
      motors: motors.map((m) => ({ hp: m.hp, flc: m.flc, largest: m === big })),
      conductorAmps: condTotal, branchDevice: branch, ocpdTotal: ocpdSum, feederOcpd: feeder,
    },
  }
}

function generate(seed: number): ProblemInstance {
  return buildFeeder(pick(seed), seed)
}

export const motorFeeder: Recipe = {
  id: ID,
  family: 'motor',
  title: 'Motor feeder: conductor and breaker',
  blurb: 'Largest motor at 125% plus the rest for the wire; the largest branch device plus the other FLCs, rounded DOWN, for the breaker.',
  topic: 'calculations',
  editions: ['2020'],
  generate,
  card: {
    whenToUse: 'The question lists two or more motors on one feeder and asks for the feeder ampacity or the feeder breaker or fuse.',
    steps: [
      { label: 'FLCs', how: 'Table 430.250 for each motor (not the nameplates).', ref: REF.motorFlc3ph },
      { label: 'Largest', how: 'The motor with the biggest FLC.' },
      { label: 'Conductor', how: 'Largest FLC × 1.25 + all the other FLCs.', ref: REF.motorFeeder },
      { label: 'Largest branch device', how: 'Largest FLC × Table 430.52 %, next standard size up.', ref: REF.motorOcpdTable },
      { label: 'Feeder device', how: 'That device + the other FLCs, then the standard size AT OR BELOW.', ref: REF.motorFeederOcpd },
    ],
    traps: [
      'Only the LARGEST motor gets 125%.',
      'The feeder breaker starts from the largest BRANCH DEVICE, not from its FLC.',
      'Branch devices may go up a size; the feeder device may NOT. Round the feeder down.',
    ],
    formulas: ['Feeder ampacity = 1.25 × largest FLC + other FLCs', 'Feeder device ≤ largest branch device + other FLCs'],
  },
}
