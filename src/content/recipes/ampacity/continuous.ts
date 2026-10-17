/**
 * Continuous load: "A sign circuit runs 8 hours at a time and draws 37 A ... minimum breaker? minimum
 * wire?" Method: a load on for 3 hours or more counts at 125% (210.19(A)(1)(a), 210.20(A)); any
 * noncontinuous part is added at 100%. The breaker is the next standard size at or above that
 * (240.6(A)). The wire is the smallest size whose ampacity in the TERMINAL column (110.14(C), usually
 * 75 °C) is at least that load, then 240.4(D) caps 14/12/10 AWG copper at 15/20/30 A.
 */
import {
  calc, choose, fmt, given, labelChoices, lookup, makeRng, nextStandardUp, numericChoices, standardAbove,
  standardBelow, STANDARD_OCPD, sum, type WrongLabel, type WrongValue,
} from '@/calc'
import { ampacity, AWG_SIZES, sizeLabel, type ConductorSize, type TempColumn } from '@/data/tables'
import { CONTINUOUS, SMALL_CONDUCTOR_MAX_OCPD_CU } from '@/data/tablesExtra'
import { REF } from '@/data/refs'
import type { ProblemInstance, Recipe, Section, WorkLine } from '@/shared/types'
import { cleanMistakes, opt, standardNeighbours } from '../kit'

const ID = 'ampacity-continuous'

export interface Scenario {
  text: (amps: number) => string
  hours: number
  hoursPhrase: string
  continuous: boolean
}

export const CONTINUOUS_LOADS: Scenario[] = [
  { text: (a) => `office lighting that is on 10 hours a day, drawing ${a} A`, hours: 10, hoursPhrase: '10 hours', continuous: true },
  { text: (a) => `a sign that is lit 8 hours every night, drawing ${a} A`, hours: 8, hoursPhrase: '8 hours', continuous: true },
  { text: (a) => `an industrial oven that runs 6 hours at a stretch, drawing ${a} A`, hours: 6, hoursPhrase: '6 hours', continuous: true },
  { text: (a) => `parking-lot lighting that burns 11 hours a night, drawing ${a} A`, hours: 11, hoursPhrase: '11 hours', continuous: true },
  { text: (a) => `a battery charger that runs 5 hours at a time, drawing ${a} A`, hours: 5, hoursPhrase: '5 hours', continuous: true },
  { text: (a) => `store lighting that stays on 12 hours a day, drawing ${a} A`, hours: 12, hoursPhrase: '12 hours', continuous: true },
]
export const SHORT_LOADS: Scenario[] = [
  { text: (a) => `a pottery kiln that runs 2 hours at a time, drawing ${a} A`, hours: 2, hoursPhrase: '2 hours', continuous: false },
  { text: (a) => `a test bench that is used about 1 hour at a time, drawing ${a} A`, hours: 1, hoursPhrase: '1 hour', continuous: false },
]

/** The 240.4(D) limit of a copper size, if it has one. */
function smallLimit(size: ConductorSize): number | undefined {
  return SMALL_CONDUCTOR_MAX_OCPD_CU[size]
}

/** Smallest copper size whose ampacity in `col` is at least `amps` (before 240.4(D)). */
function sizeByAmpacity(amps: number, col: TempColumn): ConductorSize {
  const s = AWG_SIZES.find((x) => ampacity('cu', x, col) >= amps - 1e-9)
  if (!s) throw new Error(`no copper size for ${amps} A`)
  return s
}

/** The whole sizing chain for a load: breaker, wire by ampacity, and the wire after 240.4(D). */
export function sizeFor(load: number, col: TempColumn): { ocpd: number; byAmp: ConductorSize; final: ConductorSize } {
  const ocpd = nextStandardUp(load)
  const byAmp = sizeByAmpacity(load, col)
  const start = AWG_SIZES.indexOf(byAmp)
  const final = AWG_SIZES.slice(start).find((s) => {
    const lim = smallLimit(s)
    return lim === undefined || lim >= ocpd
  }) as ConductorSize
  return { ocpd, byAmp, final }
}

export interface ContinuousParams {
  amps: number
  scenario: Scenario
  /** Noncontinuous amps on the same circuit (only with a continuous main load). */
  noncont?: number
  volts: number
  terminal: 60 | 75
  ask: 'ocpd' | 'wire'
}

function pick(seed: number): ContinuousParams {
  const rng = makeRng(seed)
  for (let tries = 0; tries < 200; tries++) {
    const short = rng.chance(0.15)
    const scenario = rng.pick(short ? SHORT_LOADS : CONTINUOUS_LOADS)
    const amps = rng.pick([12, 15, 16, 18, 20, 22, 23, 24, 25, 28, 30, 32, 36, 37, 40, 42, 44, 45, 48, 52, 56, 60, 64, 68, 72, 76, 80, 88, 96, 104, 112, 120, 128, 136, 144, 160])
    const noncont = !short && rng.chance(0.3) ? rng.pick([4, 5, 6, 8, 10, 12, 15]) : undefined
    const load = (scenario.continuous ? amps * 1.25 : amps) + (noncont ?? 0)
    if (load > 300) continue
    const terminal: 60 | 75 = load <= 100 && rng.chance(0.25) ? 60 : 75
    const volts = load <= 20 ? rng.pick([120, 277]) : rng.pick([208, 240, 480])
    const ask = rng.chance(0.5) ? 'ocpd' : 'wire'
    return { amps, scenario, noncont, volts, terminal, ask }
  }
  return { amps: 37, scenario: CONTINUOUS_LOADS[1]!, volts: 240, terminal: 75, ask: 'wire' }
}

/** Builds the problem for given inputs (exported for the hand-worked spot tests). */
export function buildContinuous(p: ContinuousParams, seed: number): ProblemInstance {
  const rng = makeRng(seed ^ 0xc0)
  const { amps, scenario, noncont, volts, terminal, ask } = p
  const cont = scenario.continuous
  const at125 = amps * 1.25
  const load = (cont ? at125 : amps) + (noncont ?? 0)
  const col: TempColumn = terminal
  const { ocpd, byAmp, final } = sizeFor(load, col)
  const limit = smallLimit(byAmp)
  const smallState: 'none' | 'ok' | 'over' = limit === undefined ? 'none' : limit >= ocpd ? 'ok' : 'over'
  const isStandard = (STANDARD_OCPD as readonly number[]).includes(load)
  const by90amp = sizeByAmpacity(load, 90)
  const by90 = sizeFor(load, 90).final

  const story =
    `A ${volts} V branch circuit supplies ${scenario.text(amps)}.` +
    (noncont ? ` The same circuit also supplies ${noncont} A of noncontinuous load.` : '') +
    ` The conductors are copper THHN, and the overcurrent device and the equipment terminals are rated ${terminal} °C. ` +
    (ask === 'ocpd'
      ? 'What is the minimum standard rating of the overcurrent device?'
      : 'What is the minimum size of the branch-circuit conductors?')

  const S_LOAD = 'load'
  const S_OCPD = 'ocpd'
  const S_WIRE = 'wire'
  const lines: WorkLine[] = []

  // ---- L: the load the circuit is sized for ---------------------------------------------------------
  lines.push(given({
    id: 'load', label: cont ? 'The long-running load' : 'The load',
    say: 'Write down the current of the main load from the question.',
    value: amps, unit: 'A', section: S_LOAD,
  }))
  lines.push(choose({
    id: 'continuous', label: 'Is it continuous?',
    say: `It runs ${scenario.hoursPhrase} at a time. Is that 3 hours or more?`,
    why: 'A load that runs 3 hours or more heats the wire and the breaker steadily, so the code makes you size them at 125% of it.',
    ref: REF.continuousBranch,
    options: [
      opt('yes', 'Yes: 3 hours or more, size it at 125%',
        cont ? undefined : `${scenario.hoursPhrase} is less than 3 hours, so it is not continuous: size it at 100%.`, cont ? undefined : 'noncontinuous_125'),
      opt('no', 'No: under 3 hours, size it at 100%',
        cont ? `${scenario.hoursPhrase} is 3 hours or more, so it is continuous: × 1.25.` : undefined, cont ? 'forgot_125_continuous' : undefined),
    ],
    answerId: cont ? 'yes' : 'no',
    section: S_LOAD, checkpoint: true,
  }))
  if (cont) {
    lines.push(calc({
      id: 'load125', label: 'Continuous load at 125%',
      say: 'Multiply the continuous load by 1.25.',
      why: '125% is × 1.25. The wire and the breaker must be sized for this, not for the load itself.',
      ref: REF.continuousBranch,
      a: amps, op: '×', b: CONTINUOUS.pct / 100, unit: 'A',
      mistakes: cleanMistakes(at125, undefined, [
        { value: amps, mistake: 'forgot_125_continuous', message: 'That is the load itself. A continuous load counts at 125%: multiply by 1.25.' },
        { value: amps * 0.8, mistake: 'inverse_op', message: 'You took 80%. The rule goes the other way: the wire must be BIGGER than the load, × 1.25.' },
      ]),
      section: S_LOAD, checkpoint: true,
    }))
  }
  if (noncont) {
    lines.push(given({
      id: 'noncont', label: 'Noncontinuous load',
      say: 'Write down the noncontinuous part. It counts at 100%.',
      value: noncont, unit: 'A', section: S_LOAD,
    }))
    lines.push(sum({
      id: 'design', label: 'Load to size for',
      say: 'Add the noncontinuous load to the continuous load at 125%.',
      why: 'Only the continuous part gets the extra 25%; the rest counts as it is.',
      ref: REF.continuousBranch,
      parts: [at125, noncont], unit: 'A',
      mistakes: cleanMistakes(load, undefined, [
        { value: (amps + noncont) * 1.25, mistake: 'continuous_125_whole', message: `You took 125% of everything. Only the continuous ${amps} A gets × 1.25; add the ${noncont} A as it is.` },
        { value: amps + noncont, mistake: 'forgot_125_continuous', message: `Use the continuous load at 125% (${fmt(at125)} A), not ${amps} A, before adding.` },
      ]),
      section: S_LOAD,
    }))
  }
  const loadLine = noncont ? 'design' : cont ? 'load125' : 'load'

  // ---- P: the overcurrent device ---------------------------------------------------------------------
  lines.push(choose({
    id: 'roundWay', label: 'Standard size: which way?',
    say: `Is ${fmt(load)} A a standard breaker size? If not, which way do you go?`,
    why: 'The device must be rated at least the load you just worked out. When that is not a standard size, you go UP to the next one in 240.6(A).',
    ref: REF.standardOcpd,
    options: [
      opt('up', 'Not standard: go up to the next standard size',
        isStandard ? `${fmt(load)} A is already in the 240.6(A) list; use it as it is.` : undefined, isStandard ? 'rounded_wrong_way' : undefined),
      opt('down', 'Not standard: go down to the size below',
        `Going down leaves the device smaller than the ${fmt(load)} A it must carry. Go up.`, 'ocpd_rounded_down'),
      opt('exact', 'It is already a standard size',
        isStandard ? undefined : `${fmt(load)} A is not in the 240.6(A) list.`, isStandard ? undefined : 'unknown'),
    ],
    answerId: isStandard ? 'exact' : 'up',
    section: S_OCPD, checkpoint: true,
  }))
  lines.push(lookup({
    id: 'ocpd', label: 'Minimum standard overcurrent device',
    say: `In the 240.6(A) list, find the smallest standard size that is ${fmt(load)} A or more.`,
    why: 'Standard breaker and fuse sizes: 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200 ...',
    ref: REF.standardOcpd,
    value: ocpd, unit: 'A',
    mistakes: cleanMistakes(ocpd, { rel: 0.001 }, [
      { value: standardBelow(ocpd) ?? 0, mistake: 'ocpd_rounded_down', message: `${standardBelow(ocpd)} A is less than the ${fmt(load)} A it must carry. Go up to ${ocpd} A.` },
      cont && { value: nextStandardUp(amps + (noncont ?? 0)), mistake: 'forgot_125_continuous', message: `That size fits the load without the 125%. Size it for ${fmt(load)} A.` },
      { value: standardAbove(ocpd) ?? 0, mistake: 'unknown', message: `Bigger than needed: ${ocpd} A is the smallest standard size at or above ${fmt(load)} A.` },
    ]),
    section: S_OCPD, checkpoint: true,
  }))

  // ---- W: the wire -------------------------------------------------------------------------------------
  const colLabel = (c: TempColumn) => `${c} °C column`
  lines.push(choose({
    id: 'column', label: 'Which ampacity column?',
    say: `THHN is a 90 °C wire, but the terminals are rated ${terminal} °C. Which column of Table 310.16 do you size it from?`,
    why: 'The wire is only as good as its weakest end. 110.14(C): the terminal rating decides the column.',
    ref: REF.terminalTemp,
    options: ([60, 75, 90] as TempColumn[]).map((c) => opt(
      String(c), colLabel(c),
      c === terminal ? undefined
        : c === 90 ? `THHN is rated 90 °C, but the terminals are only ${terminal} °C. Use the ${terminal} °C column.`
        : c === 60 ? 'The terminals are marked 75 °C, so the 75 °C column may be used.'
        : 'The terminals are rated only 60 °C, so the 75 °C column is too hot for them.',
      c === terminal ? undefined : 'wrong_temp_column',
    )),
    answerId: String(terminal),
    section: S_WIRE, checkpoint: true,
  }))

  const idx = AWG_SIZES.indexOf(byAmp)
  const window = AWG_SIZES.slice(Math.max(0, idx - 2), idx + 2)
  lines.push(choose({
    id: 'wireAmp', label: 'Smallest wire for the load',
    say: `Table 310.16, copper, ${terminal} °C column: go down until the ampacity is at least ${fmt(load)} A.`,
    why: 'Big enough means round UP to the next wire that carries the load.',
    ref: REF.ampacityTable,
    options: window.map((s) => {
      const amp = ampacity('cu', s, col)
      if (s === byAmp) return opt(s, sizeLabel(s))
      if (amp < load) {
        return s === by90amp
          ? opt(s, sizeLabel(s), `That is what the 90 °C column gives. At ${terminal} °C, ${sizeLabel(s)} carries only ${amp} A.`, 'wrong_temp_column')
          : opt(s, sizeLabel(s), `${sizeLabel(s)} carries only ${amp} A in the ${terminal} °C column; you need at least ${fmt(load)} A.`, 'rounded_wrong_way')
      }
      return opt(s, sizeLabel(s), `${sizeLabel(s)} would work, but ${sizeLabel(byAmp)} is smaller and still carries ${ampacity('cu', byAmp, col)} A.`)
    }),
    answerId: byAmp,
    sanity: ampacity('cu', byAmp, col) < ocpd && smallLimit(byAmp) === undefined
      ? `${sizeLabel(byAmp)} (${ampacity('cu', byAmp, col)} A) on a ${ocpd} A device is fine: 240.4(B) allows the next standard size up when the ampacity is not a standard size (800 A or less).`
      : undefined,
    section: S_WIRE, checkpoint: true,
  }))
  lines.push(choose({
    id: 'smallRule', label: 'Small-wire limit',
    say: `14, 12 and 10 AWG copper may be protected at no more than 15, 20 and 30 A. Your device is ${ocpd} A. Does that limit apply?`,
    why: 'Small wires get a fixed top breaker size no matter what the ampacity table says (240.4(D)).',
    ref: REF.smallConductor,
    options: [
      opt('none', 'Not 14, 12 or 10 AWG: no small-wire limit',
        smallState === 'none' ? undefined : `${sizeLabel(byAmp)} is one of the small wires with a ${limit} A limit.`, smallState === 'none' ? undefined : 'small_conductor_limit'),
      opt('ok', 'Small wire, and the device is within its limit',
        smallState === 'ok' ? undefined
          : smallState === 'over' ? `${sizeLabel(byAmp)} may be protected at no more than ${limit} A, and the device is ${ocpd} A.`
          : `${sizeLabel(byAmp)} is not one of the small wires (14, 12, 10 AWG).`,
        smallState === 'ok' ? undefined : 'small_conductor_limit'),
      opt('over', 'Small wire, and the device is over its limit: go bigger',
        smallState === 'over' ? undefined
          : smallState === 'ok' ? `The ${ocpd} A device is within the ${limit} A limit for ${sizeLabel(byAmp)}.`
          : `${sizeLabel(byAmp)} is not one of the small wires (14, 12, 10 AWG).`,
        smallState === 'over' ? undefined : 'small_conductor_limit'),
    ],
    answerId: smallState,
    section: S_WIRE, checkpoint: true,
  }))
  if (smallState === 'over') {
    const fi = AWG_SIZES.indexOf(final)
    const sizes = AWG_SIZES.slice(idx, Math.max(fi + 2, idx + 3))
    lines.push(choose({
      id: 'wire', label: 'Wire size after the small-wire limit',
      say: `Go up until the wire may be protected by the ${ocpd} A device.`,
      why: `${sizeLabel(byAmp)} carries the load, but 240.4(D) does not let it sit on a ${ocpd} A device.`,
      ref: REF.smallConductor,
      options: sizes.map((s) => {
        if (s === final) return opt(s, sizeLabel(s))
        const lim = smallLimit(s)
        if (AWG_SIZES.indexOf(s) < fi) return opt(s, sizeLabel(s), `${sizeLabel(s)} may be protected at no more than ${lim} A; the device is ${ocpd} A.`, 'small_conductor_limit')
        return opt(s, sizeLabel(s), `${sizeLabel(s)} works, but ${sizeLabel(final)} is smaller and allowed on ${ocpd} A.`)
      }),
      answerId: final,
      section: S_WIRE, checkpoint: true,
    }))
  }
  const wireLine = smallState === 'over' ? 'wire' : 'wireAmp'

  const sections: Section[] = [
    { id: S_LOAD, label: 'Load to size for', totalLine: loadLine, letter: 'L' },
    { id: S_OCPD, label: 'Overcurrent device', totalLine: 'ocpd', letter: 'P' },
    { id: S_WIRE, label: 'Wire size', totalLine: wireLine, letter: 'W' },
  ]

  // ---- exam options, each wrong one from a real mistake -----------------------------------------------
  let choices
  if (ask === 'ocpd') {
    const below = standardBelow(ocpd)
    const wrongs: WrongValue[] = [
      ...(below !== undefined ? [{ value: below, mistake: 'ocpd_rounded_down', why: `Rounded ${fmt(load)} A down; the device must be at least ${fmt(load)} A.` }] : []),
      ...(cont ? [{ value: nextStandardUp(amps + (noncont ?? 0)), mistake: 'forgot_125_continuous', why: 'Sized for the load itself; a continuous load counts at 125%.' }] : []),
      ...(noncont ? [{ value: nextStandardUp((amps + noncont) * 1.25), mistake: 'continuous_125_whole', why: 'Took 125% of the noncontinuous part too.' }] : []),
      ...(!cont ? [{ value: nextStandardUp(amps * 1.25), mistake: 'noncontinuous_125', why: `Used 125%, but ${scenario.hoursPhrase} is under 3 hours: not a continuous load.` }] : []),
      ...standardNeighbours(ocpd, { below: `Too small: the device must be at least ${fmt(load)} A.`, above: `Bigger than needed: ${ocpd} A is the smallest standard size at or above ${fmt(load)} A.` }),
    ]
    choices = numericChoices(ocpd, wrongs, rng, { unit: 'A', decimals: 0 })
  } else {
    const fi = AWG_SIZES.indexOf(final)
    const wrongs: WrongLabel[] = [
      ...(smallState === 'over' ? [{ label: sizeLabel(byAmp), mistake: 'small_conductor_limit', why: `${sizeLabel(byAmp)} carries the load, but 240.4(D) limits it to ${limit} A and the device is ${ocpd} A.` }] : []),
      ...(by90 !== final ? [{ label: sizeLabel(by90), mistake: 'wrong_temp_column', why: `Read the 90 °C column; the ${terminal} °C terminals limit the wire.` }] : []),
      ...(cont ? [{ label: sizeLabel(sizeFor(amps + (noncont ?? 0), col).final), mistake: 'forgot_125_continuous', why: 'Sized for the load without the 125%.' }] : []),
      ...(fi > 0 ? [{ label: sizeLabel(AWG_SIZES[fi - 1]!), mistake: 'rounded_wrong_way', why: 'One size too small: its ampacity is under the load.' }] : []),
    ]
    choices = labelChoices(sizeLabel(final), wrongs, AWG_SIZES.map(sizeLabel))
  }

  return {
    recipeId: ID,
    seed,
    story,
    givens: [
      { id: 'load', label: 'Load', value: amps, unit: 'A', phrase: `${amps} A` },
      { id: 'hours', label: 'Hours at a time', value: scenario.hours, unit: 'none', phrase: scenario.hoursPhrase },
      ...(noncont ? [{ id: 'noncont', label: 'Noncontinuous load', value: noncont, unit: 'A' as const, phrase: `${noncont} A of noncontinuous` }] : []),
      { id: 'terminal', label: 'Terminal rating', value: terminal, unit: 'degC', phrase: `${terminal} °C` },
    ],
    ask: ask === 'ocpd' ? 'the minimum standard rating of the overcurrent device' : 'the minimum size of the copper conductors',
    lines,
    sections,
    answerLine: ask === 'ocpd' ? 'ocpd' : wireLine,
    choices,
    visual: { kind: 'continuous', load: amps, noncont: noncont ?? 0, continuous: cont, sizedFor: load, ocpd, column: terminal, wire: final, wireAmpacity: ampacity('cu', final, col) },
  }
}

function generate(seed: number): ProblemInstance {
  return buildContinuous(pick(seed), seed)
}

export const continuousLoad: Recipe = {
  id: ID,
  family: 'ampacity',
  title: 'Continuous load: breaker and wire',
  blurb: 'A load on for 3 hours or more counts at 125%; then the next standard breaker and the wire that carries it.',
  topic: 'calculations',
  editions: ['2020'],
  generate,
  card: {
    whenToUse: 'A load runs for 3 hours or more, and the question asks for the minimum breaker or the minimum wire size.',
    steps: [
      { label: 'Continuous?', how: '3 hours or more: yes. Multiply it by 1.25.', ref: REF.continuousBranch },
      { label: 'Add the rest', how: 'Add any noncontinuous load at 100%.', ref: REF.continuousBranch },
      { label: 'Breaker', how: 'The smallest standard size at or above that load.', ref: REF.standardOcpd },
      { label: 'Column', how: 'The terminal rating: usually 75 °C, sometimes 60 °C. Not 90 °C.', ref: REF.terminalTemp },
      { label: 'Wire', how: 'Smallest copper wire in that column with at least that many amps.', ref: REF.ampacityTable },
      { label: 'Small wires', how: '14, 12, 10 AWG: no more than 15, 20, 30 A. Go bigger if the breaker is over.', ref: REF.smallConductor },
    ],
    traps: [
      'Only the continuous part gets × 1.25; the noncontinuous part is added as it is.',
      'THHN is a 90 °C wire, but the terminals decide the column (110.14(C)).',
      'The breaker goes UP to the next standard size, never down.',
      '14, 12 and 10 AWG copper have fixed top breaker sizes, whatever the table says (240.4(D)).',
    ],
    formulas: ['Load to size for = noncontinuous + continuous × 1.25'],
  },
}
