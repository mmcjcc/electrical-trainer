/**
 * Motor branch circuit (Article 430): "A 25 hp, 460 V, 3-phase squirrel-cage motor, nameplate 32 A,
 * service factor 1.15, inverse-time breaker, 75 °C terminals: the conductor? the breaker? the overload?"
 * Method:
 *   FLC        from Table 430.250 (three-phase) or 430.248 (single-phase), never the nameplate, for the
 *              conductors and the short-circuit device (430.6(A)(1));
 *   conductor  125% of the FLC (430.22), Table 310.16 at 75 °C; motor circuits are not held to the
 *              240.4(D) small-wire limits (240.4(G) sends them to Article 430);
 *   SC/GF      FLC × the Table 430.52 percent for the device type; when that is not a standard size the
 *              next size up is allowed (430.52(C)(1) Exception No. 1);
 *   overload   the NAMEPLATE current (430.6(A)(2)) × 125% (service factor 1.15 or more, or a marked
 *              temperature rise of 40 °C or less) or × 115% (all other motors) (430.32(A)(1)).
 * Instantaneous-trip breakers are left out (they are only used in listed combinations, 430.52(C)(3)).
 */
import {
  calc, choose, fmt, given, labelChoices, lookup, makeRng, nextStandardUp, numericChoices,
  standardBelow, STANDARD_OCPD, valueOf, type WrongLabel, type WrongValue,
} from '@/calc'
import {
  ampacity, AWG_SIZES, FLC_1PH, FLC_3PH, HP_SIZES_1PH, HP_SIZES_3PH, MOTOR_OCPD_PCT, OCPD_NAME, sizeLabel,
  type ConductorSize, type Hp1, type Hp3, type OcpdType, type Volts1, type Volts3,
} from '@/data/tables'
import { MOTOR_PCT, SMALL_CONDUCTOR_MAX_OCPD_CU } from '@/data/tablesExtra'
import { REF } from '@/data/refs'
import { REF_EXTRA } from '@/data/refsExtra'
import type { ProblemInstance, Recipe, Section, WorkLine } from '@/shared/types'
import { cleanMistakes, opt, standardNeighbours } from '../kit'

const ID = 'motor-branch'

export type Device = Exclude<OcpdType, 'instantaneous-cb'>
const DEVICES: Device[] = ['inverse-time-cb', 'inverse-time-cb', 'dual-element-fuse', 'dual-element-fuse', 'nontime-fuse']

/** How the nameplate earns its overload percent. */
export type Marking = { sf: number } | { rise: number } | { sf: number; rise: number }
const MARKINGS: Marking[] = [{ sf: 1.15 }, { sf: 1.15 }, { sf: 1.25 }, { sf: 1.0 }, { sf: 1.0 }, { rise: 40 }, { sf: 1.0, rise: 50 }]

export function overloadPct(m: Marking): number {
  const sf = 'sf' in m ? m.sf : undefined
  const rise = 'rise' in m ? m.rise : undefined
  if ((sf !== undefined && sf >= 1.15) || (rise !== undefined && rise <= 40)) return MOTOR_PCT.overloadSf
  return MOTOR_PCT.overloadOther
}

function markingText(m: Marking): string {
  const parts: string[] = []
  if ('sf' in m) parts.push(`a service factor of ${m.sf.toFixed(2)}`)
  if ('rise' in m) parts.push(`a marked temperature rise of ${m.rise} °C`)
  return parts.join(' and ')
}

export interface MotorParams {
  phase: 1 | 3
  hp: string
  volts: number
  fla: number
  device: Device
  marking: Marking
  ask: 'conductor' | 'ocpd' | 'overload'
}

export function flcOf(phase: 1 | 3, hp: string, volts: number): number {
  return phase === 3 ? FLC_3PH[hp as Hp3][volts as Volts3] : FLC_1PH[hp as Hp1][volts as Volts1]
}

/** Smallest copper wire at 75 °C carrying `amps`. */
export function wireFor(amps: number): ConductorSize {
  const s = AWG_SIZES.find((x) => ampacity('cu', x, 75) >= amps - 1e-9)
  if (!s) throw new Error(`no wire for ${amps} A`)
  return s
}

function pick(seed: number): MotorParams {
  const rng = makeRng(seed)
  for (let tries = 0; tries < 300; tries++) {
    const phase: 1 | 3 = rng.chance(0.25) ? 1 : 3
    const hp = phase === 3 ? rng.pick(HP_SIZES_3PH.slice(4, 18)) : rng.pick(HP_SIZES_1PH.slice(5))
    const volts = phase === 3 ? rng.pick([200, 208, 230, 460, 460, 575]) : rng.pick([115, 208, 230, 230])
    const flc = flcOf(phase, hp, volts)
    const device = rng.pick(DEVICES)
    const sc = flc * MOTOR_OCPD_PCT[device] / 100
    if (sc < 15 || sc > 600 || flc * 1.25 > 400) continue
    // Nameplate a little under the table value, as on real motors.
    const fla = Math.round(flc * (0.86 + rng.int(0, 10) / 100) * 10) / 10
    if (Math.abs(fla - flc) < 0.3) continue
    const ask = rng.pick(['conductor', 'ocpd', 'overload'] as const)
    return { phase, hp, volts, fla, device, marking: rng.pick(MARKINGS), ask }
  }
  return { phase: 3, hp: '25', volts: 460, fla: 32, device: 'inverse-time-cb', marking: { sf: 1.15 }, ask: 'ocpd' }
}

export function buildMotorBranch(p: MotorParams, seed: number): ProblemInstance {
  const rng = makeRng(seed ^ 0x430)
  const { phase, hp, volts, fla, device, marking, ask } = p
  const flc = flcOf(phase, hp, volts)
  const cond = flc * MOTOR_PCT.conductor / 100
  const wire = wireFor(cond)
  const pct = MOTOR_OCPD_PCT[device]
  const sc = flc * pct / 100
  const isStd = (STANDARD_OCPD as readonly number[]).some((s) => Math.abs(s - sc) < 1e-9)
  const ocpd = nextStandardUp(sc)
  const olPct = overloadPct(marking)
  const otherOlPct = olPct === 125 ? 115 : 125
  const ol = fla * olPct / 100
  const dev = OCPD_NAME[device]
  const table = phase === 3 ? 'Table 430.250' : 'Table 430.248'
  const motorText = phase === 3
    ? `${hp} hp, ${volts} V, 3-phase squirrel-cage induction motor (not Design B energy-efficient)`
    : `${hp} hp, ${volts} V single-phase motor`
  const smallLimit = SMALL_CONDUCTOR_MAX_OCPD_CU[wire]
  const smallCase = smallLimit !== undefined && ocpd > smallLimit

  const askText = {
    conductor: 'What is the minimum size of the branch-circuit conductors?',
    ocpd: `What is the largest standard ${dev} permitted for the branch-circuit short-circuit and ground-fault protection, assuming the motor starts normally?`,
    overload: 'What is the maximum rating of the separate overload protection?',
  }[ask]
  const story =
    `A ${motorText} has a nameplate full-load current of ${fmt(fla)} A${'rise' in marking && 'sf' in marking ? ',' : ' and'} ${markingText(marking)}. ` +
    `Its branch circuit is protected by ${/^[aeiou]/i.test(dev) ? 'an' : 'a'} ${dev}, and the conductors are copper THHN with 75 °C terminals. ${askText}`

  const S_FLC = 'flc'
  const S_COND = 'cond'
  const S_SC = 'sc'
  const S_OL = 'ol'
  const lines: WorkLine[] = []

  // ---- F: the table current -------------------------------------------------------------------------
  lines.push(choose({
    id: 'whichCurrent', label: 'Which current for the wire and the breaker?',
    say: 'The question gives a nameplate current. Do you use it for the conductors and the short-circuit device?',
    why: 'The code wants the wire and breaker sized the same way for every motor of that size, so it uses the table current. The nameplate is for the overload.',
    ref: REF.motorFlcUse,
    options: [
      opt('table', `The FLC table (${table})`),
      opt('nameplate', 'The nameplate current', 'Conductors and short-circuit protection use the FLC table, not the nameplate (430.6(A)(1)).', 'motor_nameplate_vs_table'),
    ],
    answerId: 'table',
    section: S_FLC, checkpoint: true,
  }))
  const flcMistakes = [
    { value: fla, mistake: 'motor_nameplate_vs_table', message: `That is the nameplate. For the wire and the breaker use ${table}.` },
    ...neighbourVolts(phase, hp, volts).map((v) => ({ value: flcOf(phase, hp, v), mistake: 'wrong_voltage', message: `That is the ${v} V column. The motor is ${volts} V.` })),
  ]
  lines.push(lookup({
    id: 'flc', label: 'Full-load current (FLC)',
    say: `${table}: the ${hp} hp row, the ${volts} V column.`,
    ref: phase === 3 ? REF.motorFlc3ph : REF.motorFlc1ph,
    value: flc, unit: 'A',
    mistakes: cleanMistakes(flc, { rel: 0.001 }, flcMistakes),
    section: S_FLC, checkpoint: true,
  }))

  // ---- C: the conductor -----------------------------------------------------------------------------
  lines.push(calc({
    id: 'cond125', label: 'Conductor ampacity needed',
    say: 'Multiply the FLC by 1.25.',
    why: 'A motor runs hot for long stretches and draws more when loaded hard, so its wire gets 125% (430.22).',
    ref: REF.motorConductor,
    a: flc, op: '×', b: MOTOR_PCT.conductor / 100, unit: 'A',
    mistakes: cleanMistakes(cond, undefined, [
      { value: fla * 1.25, mistake: 'motor_nameplate_vs_table', message: `Use the table FLC (${fmt(flc)} A), not the nameplate, for the wire.` },
      { value: flc, mistake: 'motor_wrong_percent', message: 'That is the FLC itself. The wire gets 125%: × 1.25.' },
    ]),
    section: S_COND, checkpoint: true,
  }))
  const wi = AWG_SIZES.indexOf(wire)
  const window = AWG_SIZES.slice(Math.max(0, wi - 2), wi + 2)
  lines.push(choose({
    id: 'wire', label: 'Smallest conductor',
    say: `Table 310.16, copper, 75 °C column: the first size with at least ${fmt(cond)} A.`,
    why: 'The terminals are rated 75 °C, so the 75 °C column. Big enough means round up.',
    ref: REF.ampacityTable,
    options: window.map((s) => {
      if (s === wire) return opt(s, sizeLabel(s))
      const amp = ampacity('cu', s, 75)
      return amp < cond
        ? opt(s, sizeLabel(s), `${sizeLabel(s)} carries only ${amp} A at 75 °C; you need ${fmt(cond)} A.`, ampacity('cu', s, 90) >= cond ? 'wrong_temp_column' : 'rounded_wrong_way')
        : opt(s, sizeLabel(s), `${sizeLabel(s)} works, but ${sizeLabel(wire)} is smaller and carries ${ampacity('cu', wire, 75)} A.`)
    }),
    answerId: wire,
    section: S_COND, checkpoint: true,
  }))

  // ---- S: short-circuit and ground-fault protection ------------------------------------------------------
  const otherPcts = (Object.keys(MOTOR_OCPD_PCT) as OcpdType[])
    .filter((d) => d !== device && d !== 'instantaneous-cb' && MOTOR_OCPD_PCT[d] !== pct)
    .map((d) => ({ value: MOTOR_OCPD_PCT[d], mistake: 'motor_wrong_percent', message: `That is the ${OCPD_NAME[d]} column. The question uses ${/^[aeiou]/i.test(dev) ? 'an' : 'a'} ${dev}.` }))
  lines.push(lookup({
    id: 'pct', label: `Table 430.52 percent for ${/^[aeiou]/i.test(dev) ? 'an' : 'a'} ${dev}`,
    say: `Table 430.52: the row for ${phase === 3 ? 'squirrel-cage motors other than Design B energy-efficient' : 'single-phase motors'}, the ${dev} column.`,
    ref: REF.motorOcpdTable,
    value: pct, unit: 'pct',
    mistakes: cleanMistakes(pct, { rel: 0.001 }, [
      ...otherPcts,
      { value: 125, mistake: 'motor_wrong_percent', message: '125% is for the conductors. The short-circuit device comes from Table 430.52.' },
    ]),
    section: S_SC, checkpoint: true,
  }))
  lines.push(calc({
    id: 'scCalc', label: 'Short-circuit device, before rounding',
    say: `Multiply the FLC by ${pct}% (× ${fmt(pct / 100)}).`,
    a: flc, op: '×', b: pct / 100, unit: 'A',
    mistakes: cleanMistakes(sc, undefined, [
      { value: fla * pct / 100, mistake: 'motor_nameplate_vs_table', message: `Use the table FLC (${fmt(flc)} A), not the nameplate.` },
    ]),
    section: S_SC,
  }))
  lines.push(choose({
    id: 'scRound', label: 'Not a standard size: which way?',
    say: `Is ${fmt(sc)} A a standard size? If not, may you go up?`,
    why: 'A motor draws a big inrush when it starts. When the table value is not a standard size, the next size up is allowed so the device does not trip on starting (430.52(C)(1) Exception No. 1).',
    ref: REF.motorOcpdNextSize,
    options: [
      opt('up', 'Not standard: the next standard size up is allowed',
        isStd ? `${fmt(sc)} A is already a standard size; use it.` : undefined, isStd ? 'rounded_wrong_way' : undefined),
      opt('down', 'Not standard: drop to the standard size below',
        'For a motor branch circuit the next size UP is allowed (430.52(C)(1) Exception No. 1).', 'ocpd_rounded_down'),
      opt('exact', 'It is already a standard size', isStd ? undefined : `${fmt(sc)} A is not in the 240.6(A) list.`, isStd ? undefined : 'unknown'),
    ],
    answerId: isStd ? 'exact' : 'up',
    section: S_SC, checkpoint: true,
  }))
  lines.push(lookup({
    id: 'ocpd', label: `Largest standard ${dev}`,
    say: `In the 240.6(A) list, the smallest standard size at or above ${fmt(sc)} A.`,
    ref: REF.standardOcpd,
    value: ocpd, unit: 'A',
    mistakes: cleanMistakes(ocpd, { rel: 0.001 }, [
      { value: standardBelow(ocpd) ?? 0, mistake: 'ocpd_rounded_down', message: `Rounded down. The next size up, ${ocpd} A, is allowed for a motor.` },
      { value: nextStandardUp(fla * pct / 100), mistake: 'motor_nameplate_vs_table', message: 'That comes from the nameplate. Use the table FLC.' },
    ]),
    section: S_SC,
  }))
  if (smallCase) {
    lines.push(choose({
      id: 'smallWire', label: `${sizeLabel(wire)} on a ${ocpd} A device?`,
      say: `${sizeLabel(wire)} normally tops out at ${smallLimit} A (240.4(D)). Is the ${ocpd} A ${dev} allowed on this motor circuit?`,
      why: 'The overload protects the wire from overheating; the short-circuit device only has to clear faults. That is why 240.4(G) sends motor circuits to Article 430 instead of the small-wire limits.',
      ref: REF_EXTRA.specificConductors,
      options: [
        opt('yes', 'Yes: motor circuits follow Article 430, not the 15/20/30 A limits'),
        opt('no', `No: ${sizeLabel(wire)} is limited to ${smallLimit} A`, 'Motor branch circuits are an exception: 240.4(G) points to Article 430, and 430.52 allows this device.', 'small_conductor_motor'),
      ],
      answerId: 'yes',
      section: S_SC, checkpoint: true,
    }))
  }

  // ---- O: overload ------------------------------------------------------------------------------------------------
  lines.push(given({
    id: 'fla', label: 'Nameplate current (FLA)',
    say: 'The overload is set from the NAMEPLATE current. Write it down.',
    why: 'The overload protects this particular motor, so it uses this motor’s own nameplate (430.6(A)(2)).',
    ref: REF.motorFla,
    value: fla, unit: 'A',
    mistakes: cleanMistakes(fla, { rel: 0 }, [
      { value: flc, mistake: 'motor_nameplate_vs_table', message: 'That is the table FLC. Overloads use the nameplate current.' },
    ]),
    section: S_OL, checkpoint: true,
  }))
  lines.push(choose({
    id: 'olPct', label: 'Overload percent',
    say: `The nameplate shows ${markingText(marking)}. 125% or 115%?`,
    why: '125% for a service factor of 1.15 or more, or a marked temperature rise of 40 °C or less. Every other motor: 115%.',
    ref: REF.motorOverload,
    options: [
      opt('125', '125%', olPct === 125 ? undefined : 'Neither a service factor of 1.15 or more nor a temperature rise of 40 °C or less: 115%.', olPct === 125 ? undefined : 'motor_wrong_percent'),
      opt('115', '115%', olPct === 115 ? undefined : `With ${markingText(marking)} the motor gets 125%.`, olPct === 115 ? undefined : 'motor_wrong_percent'),
    ],
    answerId: String(olPct),
    section: S_OL, checkpoint: true,
  }))
  lines.push(calc({
    id: 'ol', label: 'Maximum overload rating',
    say: `Multiply the nameplate current by ${olPct}% (× ${fmt(olPct / 100)}).`,
    ref: REF.motorOverload,
    a: fla, op: '×', b: olPct / 100, unit: 'A', decimals: 2,
    mistakes: cleanMistakes(ol, undefined, [
      { value: flc * olPct / 100, mistake: 'motor_nameplate_vs_table', message: 'Use the nameplate current for the overload, not the table FLC.' },
      { value: fla * otherOlPct / 100, mistake: 'motor_wrong_percent', message: `This motor gets ${olPct}%, not ${otherOlPct}%.` },
    ]),
    section: S_OL,
  }))

  const sections: Section[] = [
    { id: S_FLC, label: 'Table current', totalLine: 'flc', letter: 'F' },
    { id: S_COND, label: 'Conductor', totalLine: 'wire', letter: 'C' },
    { id: S_SC, label: 'Short-circuit device', totalLine: 'ocpd', letter: 'S' },
    { id: S_OL, label: 'Overload', totalLine: 'ol', letter: 'O' },
  ]

  let choices
  if (ask === 'conductor') {
    const wrongs: WrongLabel[] = []
    const add = (s: ConductorSize | undefined, mistake: string, why: string) => { if (s && s !== wire) wrongs.push({ label: sizeLabel(s), mistake, why }) }
    add(wireFor(flc), 'motor_wrong_percent', 'Sized for the FLC without the 125%.')
    add(wireFor(fla * 1.25), 'motor_nameplate_vs_table', 'Used the nameplate current instead of the table FLC.')
    add(AWG_SIZES.find((x) => ampacity('cu', x, 90) >= cond - 1e-9), 'wrong_temp_column', 'Read the 90 °C column; the terminals are 75 °C.')
    add(wi > 0 ? AWG_SIZES[wi - 1] : undefined, 'rounded_wrong_way', 'One size too small for the 125% current.')
    choices = labelChoices(sizeLabel(wire), wrongs, AWG_SIZES.map(sizeLabel))
  } else if (ask === 'ocpd') {
    const wrongs: WrongValue[] = [
      { value: standardBelow(ocpd) ?? 0, mistake: 'ocpd_rounded_down', why: 'Rounded down; the next size up is allowed for a motor (430.52(C)(1) Exception No. 1).' },
      { value: nextStandardUp(fla * pct / 100), mistake: 'motor_nameplate_vs_table', why: 'Used the nameplate current instead of the table FLC.' },
      ...otherPcts.map((o) => ({ value: nextStandardUp(flc * o.value / 100), mistake: 'motor_wrong_percent', why: `Used ${o.value}%, the wrong column of Table 430.52.` })),
      { value: nextStandardUp(cond), mistake: 'motor_wrong_percent', why: 'Used 125%; that is for the conductors.' },
      ...standardNeighbours(ocpd, { below: 'Too small: the next size up from the Table 430.52 value is allowed.', above: 'Bigger than allowed: only the next standard size above the Table 430.52 value.' }),
    ]
    choices = numericChoices(ocpd, wrongs, rng, { unit: 'A', decimals: 0 })
  } else {
    const wrongs: WrongValue[] = [
      { value: fla * otherOlPct / 100, mistake: 'motor_wrong_percent', why: `Used ${otherOlPct}%; this motor gets ${olPct}%.` },
      { value: flc * olPct / 100, mistake: 'motor_nameplate_vs_table', why: 'Used the table FLC; overloads use the nameplate current.' },
      { value: flc * otherOlPct / 100, mistake: 'motor_nameplate_vs_table', why: 'Used the table FLC and the wrong percent.' },
      { value: fla, mistake: 'skipped_operation', why: 'That is the nameplate current with no percent applied.' },
    ]
    choices = numericChoices(valueOf(lines, 'ol'), wrongs, rng, { unit: 'A', decimals: 2 })
  }

  return {
    recipeId: ID,
    seed,
    story,
    givens: [
      { id: 'motor', label: 'Motor', value: 0, unit: 'none', phrase: motorText },
      { id: 'fla', label: 'Nameplate current', value: fla, unit: 'A', phrase: `${fmt(fla)} A` },
      { id: 'marking', label: 'Service factor or temperature rise', value: 0, unit: 'none', phrase: markingText(marking) },
      { id: 'device', label: 'Protective device', value: 0, unit: 'none', phrase: dev },
    ],
    ask: { conductor: 'the minimum branch-circuit conductor size', ocpd: `the largest standard ${dev}`, overload: 'the maximum overload rating' }[ask],
    lines,
    sections,
    answerLine: { conductor: 'wire', ocpd: 'ocpd', overload: 'ol' }[ask],
    choices,
    visual: { kind: 'motor-branch', phase, hp, volts, flc, fla, conductorAmps: cond, wire, device, devicePct: pct, deviceCalc: sc, ocpd, overloadPct: olPct, overload: ol },
  }
}

/** The voltage columns next to this one (reading the wrong column). */
function neighbourVolts(phase: 1 | 3, hp: string, volts: number): number[] {
  const cols = phase === 3 ? [200, 208, 230, 460, 575] : [115, 200, 208, 230]
  const i = cols.indexOf(volts)
  return [cols[i - 1], cols[i + 1]].filter((v): v is number => v !== undefined && flcOf(phase, hp, v) !== flcOf(phase, hp, volts))
}

function generate(seed: number): ProblemInstance {
  return buildMotorBranch(pick(seed), seed)
}

export const motorBranch: Recipe = {
  id: ID,
  family: 'motor',
  title: 'Motor branch circuit',
  blurb: 'Table FLC for the wire (125%) and the breaker (Table 430.52, next size up); the nameplate for the overload (115% or 125%).',
  topic: 'calculations',
  editions: ['2020'],
  generate,
  card: {
    whenToUse: 'The question names one motor (hp, volts, phase, nameplate amps) and asks for its wire, its breaker or fuse, or its overload.',
    steps: [
      { label: 'FLC', how: 'Table 430.250 (3-phase) or 430.248 (single-phase). Not the nameplate.', ref: REF.motorFlcUse },
      { label: 'Conductor', how: 'FLC × 1.25, then Table 310.16 at 75 °C.', ref: REF.motorConductor },
      { label: 'Device percent', how: 'Table 430.52: inverse-time breaker 250%, dual-element fuse 175%, nontime fuse 300%.', ref: REF.motorOcpdTable },
      { label: 'Device size', how: 'FLC × percent; not standard? Go to the next size up.', ref: REF.motorOcpdNextSize },
      { label: 'Overload', how: 'NAMEPLATE amps × 1.25 (SF 1.15+ or rise 40 °C or less), else × 1.15.', ref: REF.motorOverload },
    ],
    traps: [
      'Table FLC for wire and breaker; nameplate only for the overload.',
      'The breaker may go UP to the next size for a motor branch circuit.',
      'A 14 AWG motor circuit may sit on a breaker bigger than 15 A: motor circuits follow Article 430 (240.4(G)).',
      'Service factor 1.15 or a 40 °C rise: 125%. Anything else: 115%.',
    ],
    formulas: ['Conductor = FLC × 1.25', 'Device = FLC × Table 430.52 %', 'Overload = nameplate × 1.25 (or 1.15)'],
  },
}
