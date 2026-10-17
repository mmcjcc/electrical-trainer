/**
 * One-family dwelling, standard method, the whole calculation (Annex D Example D1(a)/(b) method, 2020
 * NEC): "A 2,400 square foot house has a 12.6-kW range, a 5.5-kW dryer ... What is the minimum service?"
 *
 * Buckets L-F-D-R-H-A:
 *   L  3 VA/ft² (220.14(J), floor area per 220.11) + small-appliance circuits (2 × 1,500 at least)
 *      + laundry 1,500 -> Table 220.42: first 3,000 at 100%, the rest at 35%
 *   F  fastened-in-place appliances (2020 220.53: 1/4 hp or 500 W and up; never cooking, dryers,
 *      space heating, A/C): their VA, × 0.75 when four or more
 *   D  dryer: 5,000 VA or the nameplate, whichever is larger (220.54)
 *   R  range: Column C (8 kW), Note 1 adds 5% per kW or major fraction over 12 kW (Table 220.55)
 *   H  heat at 100% (220.51) against the A/C (amps × 240 V): keep the larger (220.60)
 *   A  + 25% of the largest motor (220.50 -> 430.24, as D1(b) does): the A/C compressor when the A/C is
 *      kept, else the largest motor appliance; total ÷ 240 V; next standard size, never under 100 A
 *      (230.79(C)).
 *
 * The answer key is kept uncontestable by construction: heat and A/C differ by at least 30% (so the
 * 2020 220.60 "125% of the motor in the comparison" reading cannot change which is kept), the service
 * size is the same with and without the 25% motor line, and with or without the 220.5(B) rounding.
 */
import { calc, choose, fmt, makeRng, sum, type WrongValue } from '@/calc'
import { DWELLING } from '@/data/tables'
import { REF } from '@/data/refs'
import { LOAD, REF_LOAD } from '@/data/loadExtra'
import type { Given, ProblemInstance, Recipe, Section, WorkLine } from '@/shared/types'
import { cleanMistakes, opt, ruleLine, word } from '../kit'
import { AC_AMPS, DRYER_RATINGS, HEAT_KW, pickAppliances, RANGE_KW_SINGLE } from './catalog'
import {
  ampsLine, appliancePhrase, clean, clearFraction, circuitsText, dryerLines, dryerVA, excludedFt2, lightingDemandOf,
  lightingLines, lightingNums, listJoin, loc, rangeLines, ratingVA, singleRangeNums, sizeChoices, sizeFor, sizeLine,
  sizeStable, vaLine, withArticle, wrongsFrom, type Appliance, type LightingIn, type MaybeMistake, type Rating,
} from './common'

const ID = 'dwelling-standard'

export interface StandardIn {
  lighting: LightingIn
  appliances: Appliance[]
  dryer?: Rating
  rangeKW?: number
  heatKW?: number
  /** 240-V air conditioner nameplate amperes. */
  acAmps?: number
}

/** One slip at a time, for the mistake values and the wrong answer choices. */
export interface StandardFlags {
  countedExcluded?: boolean
  wholeLighting35?: boolean
  noSmallAppliance?: boolean
  wrong75?: boolean
  dryerNameplate?: boolean
  dryerFloorOnly?: boolean
  rangeNameplate?: boolean
  noNote1?: boolean
  bothHvac?: boolean
  smallerHvac?: boolean
  noMotor25?: boolean
  by120?: boolean
  noMin100?: boolean
}

export interface StandardNums {
  lBefore: number
  L: number
  fBefore: number
  F: number
  dBefore: number
  D: number
  rBefore: number
  R: number
  heatVA: number
  acVA: number
  keep?: 'heat' | 'ac'
  H: number
  motor?: { name: string; va: number }
  motor25: number
  total: number
  /** Exact amperes (before the 220.5(B) rounding). */
  amps: number
  service: number
}

/** The motor appliance with the largest VA (the catalog keeps hp order = VA order). */
export function largestMotor(apps: Appliance[]): Appliance | undefined {
  let best: Appliance | undefined
  for (const a of apps) if (a.motor && (!best || ratingVA(a.rating) > ratingVA(best.rating))) best = a
  return best
}

/** The whole standard-method arithmetic in one place; the lines below repeat it one step at a time. */
export function standardNums(inp: StandardIn, f: StandardFlags = {}): StandardNums {
  const li: LightingIn = f.countedExcluded
    ? { ...inp.lighting, area: inp.lighting.area + excludedFt2(inp.lighting), excluded: [] }
    : inp.lighting
  const ln = lightingNums(li)
  let L = ln.demand
  if (f.noSmallAppliance) L = lightingDemandOf(ln.glVA)
  if (f.wholeLighting35) L = clean(ln.total * 0.35)

  const n = inp.appliances.length
  const fBefore = clean(inp.appliances.reduce((s, a) => s + ratingVA(a.rating), 0))
  const four = n >= LOAD.appliance75MinCount
  const take75 = f.wrong75 ? !four : four
  const F = n === 0 ? 0 : take75 ? clean(fBefore * (DWELLING.appliancePct4OrMore / 100)) : fBefore

  const dBefore = inp.dryer ? ratingVA(inp.dryer) : 0
  const D = !inp.dryer ? 0 : f.dryerNameplate ? dBefore : f.dryerFloorOnly ? DWELLING.dryerMinVA : dryerVA(dBefore)

  const rn = inp.rangeKW !== undefined ? singleRangeNums(inp.rangeKW) : undefined
  const rBefore = rn ? clean(rn.kw * 1000) : 0
  const R = !rn ? 0 : f.rangeNameplate ? rBefore : f.noNote1 ? 8000 : rn.demandVA

  const heatVA = inp.heatKW ? clean(inp.heatKW * 1000) : 0
  const acVA = inp.acAmps ? inp.acAmps * 240 : 0
  const keep = heatVA === 0 && acVA === 0 ? undefined : acVA > heatVA ? 'ac' : 'heat'
  let H = Math.max(heatVA, acVA)
  if (f.bothHvac) H = heatVA + acVA
  if (f.smallerHvac && heatVA > 0 && acVA > 0) H = Math.min(heatVA, acVA)

  const big = largestMotor(inp.appliances)
  const motor = keep === 'ac' ? { name: 'air conditioner', va: acVA } : big ? { name: big.name, va: ratingVA(big.rating) } : undefined
  const motor25 = f.noMotor25 || !motor ? 0 : clean((motor.va * LOAD.largestMotorExtraPct) / 100)

  const total = clean(L + F + D + R + H + motor25)
  const amps = total / (f.by120 ? 120 : 240)
  const service = sizeFor(amps, f.noMin100 ? undefined : LOAD.minServiceOneFamilyA)
  return { lBefore: ln.total, L, fBefore, F, dBefore, D, rBefore, R, heatVA, acVA, keep, H, motor, motor25, total, amps, service }
}

/** True when nothing the experts argue about can change the answer (see the file comment). */
export function standardIsRobust(inp: StandardIn): boolean {
  const a = standardNums(inp)
  const b = standardNums(inp, { noMotor25: true })
  if (a.service !== b.service) return false
  if (!sizeStable(a.amps, LOAD.minServiceOneFamilyA) || !sizeStable(b.amps, LOAD.minServiceOneFamilyA)) return false
  if (a.heatVA > 0 && a.acVA > 0 && Math.max(a.heatVA, a.acVA) < 1.3 * Math.min(a.heatVA, a.acVA)) return false
  if (inp.rangeKW !== undefined && inp.rangeKW > LOAD.rangeColCMaxKW && !clearFraction(inp.rangeKW - LOAD.rangeColCMaxKW)) return false
  return true
}

/** Spaces 220.11 leaves out (2020), with sizes that fit the name. */
export const GARAGES: { name: string; sizes: number[] }[] = [
  { name: 'attached garage', sizes: [240, 288, 400, 480] },
  { name: 'attached two-car garage', sizes: [440, 484, 528, 576, 624] },
]
export const PORCH_FT2 = [80, 96, 120, 150, 200]

export function pickStandard(seed: number): StandardIn {
  const rng = makeRng(seed)
  for (let tries = 0; tries < 400; tries++) {
    const area = rng.step(1000, 3400, 50)
    const excluded: LightingIn['excluded'] = []
    if (rng.chance(0.55)) {
      const g = rng.pick(GARAGES)
      excluded.push({ name: g.name, ft2: rng.pick(g.sizes) })
    }
    if (rng.chance(0.4)) excluded.push({ name: 'open porch', ft2: rng.pick(PORCH_FT2) })
    const saCircuits = rng.chance(0.2) ? 3 : 2
    const saStated = saCircuits > 2 || rng.chance(0.5)
    const appliances = pickAppliances(rng, rng.pick([0, 0, 2, 2, 3, 3, 4, 4, 5, 6]))
    // Heat and A/C both (half the time), A/C only, heat only, or neither (gas heat, no A/C).
    const hv = rng.next()
    const heatKW = hv < 0.5 || (hv >= 0.7 && hv < 0.85) ? rng.pick(HEAT_KW) : undefined
    const acAmps = hv < 0.7 ? rng.pick(AC_AMPS) : undefined
    const inp: StandardIn = {
      lighting: { area, excluded, saCircuits, saStated, laundry: true },
      appliances,
      dryer: rng.pick(DRYER_RATINGS),
      rangeKW: rng.pick(RANGE_KW_SINGLE),
      heatKW,
      acAmps,
    }
    if (standardIsRobust(inp)) return inp
  }
  return FALLBACK
}

/** A known-good problem (checked by the tests) in case no seed passes the filters. */
export const FALLBACK: StandardIn = {
  lighting: { area: 2000, excluded: [{ name: 'attached garage', ft2: 480 }], saCircuits: 2, saStated: false, laundry: true },
  appliances: [
    { key: 'wh', name: 'water heater', motor: false, rating: { kind: 'kW', kw: 4.5 } },
    { key: 'dw', name: 'dishwasher', motor: false, rating: { kind: 'W', w: 1200 } },
  ],
  dryer: { kind: 'kW', kw: 5 },
  rangeKW: 12,
  heatKW: 10,
  acAmps: 20,
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** The story and its givens. */
function storyOf(inp: StandardIn): { story: string; givens: Given[] } {
  const li = inp.lighting
  const givens: Given[] = [{ id: 'area', label: 'Living area', value: li.area, unit: 'ft2', phrase: `${fmt(li.area)} square feet` }]
  const loads: string[] = []
  if (inp.rangeKW !== undefined) {
    const phrase = `${fmt(inp.rangeKW)}-kW range`
    loads.push(withArticle(phrase))
    givens.push({ id: 'range', label: 'Range', value: inp.rangeKW, unit: 'kW', phrase })
  }
  if (inp.dryer) {
    const phrase = appliancePhrase({ key: 'dryer', name: 'clothes dryer', motor: false, rating: inp.dryer })
    loads.push(withArticle(phrase))
    givens.push({ id: 'dryer', label: 'Dryer', value: inp.dryer.kind === 'kW' ? inp.dryer.kw : ratingVA(inp.dryer), unit: inp.dryer.kind === 'kW' ? 'kW' : 'W', phrase })
  }
  for (const a of inp.appliances) {
    const phrase = appliancePhrase(a)
    loads.push(withArticle(phrase))
    const r = a.rating
    givens.push({ id: a.key, label: cap(a.name), value: r.kind === 'kW' ? r.kw : r.kind === 'W' ? r.w : r.amps, unit: r.kind === 'kW' ? 'kW' : r.kind === 'W' ? 'W' : 'A', phrase })
  }
  if (inp.heatKW) {
    const phrase = `${fmt(inp.heatKW)} kW of electric baseboard heat`
    loads.push(phrase)
    givens.push({ id: 'heat', label: 'Electric heat', value: inp.heatKW, unit: 'kW', phrase })
  }
  if (inp.acAmps) {
    const phrase = `240-V air conditioner rated ${inp.acAmps} A`
    loads.push(`a ${phrase}`)
    givens.push({ id: 'ac', label: 'Air conditioner', value: inp.acAmps, unit: 'A', phrase })
  }
  if (li.saStated) {
    givens.push({ id: 'sa', label: 'Small-appliance circuits', value: li.saCircuits, unit: 'count', phrase: `${word(li.saCircuits)} 20-A small-appliance circuits` })
  }
  const extra = li.excluded.length
    ? `, plus ${listJoin(li.excluded.map((e) => withArticle(`${fmt(e.ft2)}-square-foot ${e.name}`)))}`
    : ''
  const story =
    `A one-family dwelling has ${fmt(li.area)} square feet of living space${extra}. The service is 120/240 V, single-phase. ` +
    (li.saStated
      ? `The house has ${circuitsText(li.saCircuits, li.laundry)}. `
      : 'Include the required small-appliance and laundry circuits. ') +
    `The other loads are ${listJoin(loads)}. ` +
    'Using the standard method, what is the minimum rating of the service, in amperes?'
  return { story, givens }
}

/** Builds the problem for given inputs (exported for the hand-worked and Annex D spot tests). */
export function buildStandard(inp: StandardIn, seed: number): ProblemInstance {
  const rng = makeRng(seed ^ 0x5a17)
  const N = standardNums(inp)
  const T = (f: StandardFlags) => standardNums(inp, f).total
  const S = (f: StandardFlags) => standardNums(inp, f).service
  const li = inp.lighting
  const ex = excludedFt2(li)
  const lines: WorkLine[] = []
  const sections: Section[] = []
  const n = inp.appliances.length
  const four = n >= LOAD.appliance75MinCount
  const rn = inp.rangeKW !== undefined ? singleRangeNums(inp.rangeKW) : undefined
  const both = N.heatVA > 0 && N.acVA > 0
  const otherLoads = (inp.dryer ? 1 : 0) + (rn ? 1 : 0) + (N.heatVA > 0 ? 1 : 0) + (N.acVA > 0 ? 1 : 0)

  // ---- L ---------------------------------------------------------------------------------------------
  const L = lightingLines(li, 'L')
  lines.push(...L.lines)
  sections.push({ id: 'L', label: 'Lighting, small appliances and laundry, after demand', totalLine: L.totalId, letter: 'L' })

  // ---- F ---------------------------------------------------------------------------------------------
  if (n > 0) {
    const excludedVA = (rn ? rn.kw * 1000 : 0) + (inp.dryer ? N.dBefore : 0)
    for (const a of inp.appliances) lines.push(vaLine(`f_${a.key}`, cap(a.name), a.rating, 'F'))
    const notFour: MaybeMistake = !four && {
      value: clean(N.fBefore * 0.75), mistake: 'appliance_75_misused',
      message: `There ${n === 1 ? 'is only one' : `are only ${word(n)}`} fastened-in-place appliance${n === 1 ? '' : 's'}. Fewer than four stay at 100%.`,
    }
    if (n >= 2) {
      lines.push(sum({
        id: 'fSum', label: 'Fastened-in-place appliances, total',
        say: 'Add the VA of the fastened-in-place appliances. Leave out the range, the dryer, the heat and the A/C.',
        why: 'The range, dryer, heat and A/C each have their own rule, so they are not part of this bucket.',
        ref: REF.fixedAppliances,
        parts: inp.appliances.map((a) => ratingVA(a.rating)), unit: 'VA', section: 'F',
        mistakes: cleanMistakes(N.fBefore, undefined, [
          notFour,
          excludedVA > 0 && { value: N.fBefore + excludedVA, mistake: 'appliance_excluded_counted', message: 'The range and the dryer do not belong here; they have their own buckets.' },
        ]),
      }))
    } else {
      const only = lines[lines.length - 1]
      if (only && notFour) only.mistakes = [...(only.mistakes ?? []), notFour]
    }
    const yesWrong = !four && n + otherLoads >= LOAD.appliance75MinCount ? 'appliance_excluded_counted' : 'appliance_75_misused'
    lines.push(choose({
      id: 'fFour', label: 'Four or more?',
      say: 'Count the fastened-in-place appliances (not the range, dryer, heat or A/C). Are there four or more?',
      why: 'With four or more, they will not all run at once, so the code lets you take 75% of their total.',
      ref: REF.fixedAppliances,
      options: [
        opt('yes', 'Four or more: multiply by 0.75',
          four ? undefined : `Only ${word(n)} count${n === 1 ? 's' : ''} here. The range, dryer, heat and A/C have their own rules and are not counted.`,
          four ? undefined : yesWrong),
        opt('no', 'Fewer than four: count them at 100%',
          four ? `There are ${word(n)} fastened-in-place appliances. Four or more get 75%.` : undefined,
          four ? 'appliance_75_misused' : undefined),
      ],
      answerId: four ? 'yes' : 'no',
      section: 'F', checkpoint: true,
    }))
    if (four) {
      lines.push(calc({
        id: 'fDemand', label: 'Fastened-in-place appliances at 75%',
        say: `Multiply the total by 0.75: ${fmt(N.fBefore)} × 0.75.`,
        ref: REF.fixedAppliances,
        a: N.fBefore, op: '×', b: DWELLING.appliancePct4OrMore / 100, unit: 'VA', section: 'F',
        mistakes: cleanMistakes(N.F, undefined, [
          { value: N.fBefore, mistake: 'appliance_75_misused', message: `There are ${word(n)} appliances: four or more are counted at 75%.` },
        ]),
        checkpoint: true,
      }))
    }
    const fTotal = four ? 'fDemand' : n >= 2 ? 'fSum' : `f_${inp.appliances[0]?.key}`
    sections.push({ id: 'F', label: 'Fastened-in-place appliances', totalLine: fTotal, letter: 'F' })
  }

  // ---- D ---------------------------------------------------------------------------------------------
  if (inp.dryer) {
    lines.push(...dryerLines(inp.dryer, 'D').lines)
    sections.push({ id: 'D', label: 'Dryer', totalLine: 'dryer', letter: 'D' })
  }

  // ---- R ---------------------------------------------------------------------------------------------
  if (inp.rangeKW !== undefined) {
    const R = rangeLines(inp.rangeKW, 'R', true)
    lines.push(...R.lines)
    sections.push({ id: 'R', label: 'Range', totalLine: R.totalId, letter: 'R' })
  }

  // ---- H ---------------------------------------------------------------------------------------------
  if (N.heatVA > 0 || N.acVA > 0) {
    if (N.heatVA > 0) {
      lines.push(calc({
        id: 'heatVA', label: 'Electric heat',
        say: `Fixed electric heat counts at 100%. Change kW to VA: ${fmt(inp.heatKW ?? 0)} × 1,000.`,
        ref: REF_LOAD.spaceHeating,
        a: inp.heatKW ?? 0, op: '×', b: 1000, unit: 'VA', section: 'H',
        mistakes: [{ value: inp.heatKW ?? 0, mistake: 'kilo_conversion', message: 'That is still in kW. Multiply by 1,000.' }],
      }))
    }
    if (N.acVA > 0) {
      lines.push(calc({
        id: 'acVA', label: 'Air conditioner',
        say: `Amps × volts: ${inp.acAmps} × 240.`,
        ref: REF.voltagesForCalcs,
        a: inp.acAmps ?? 0, op: '×', b: 240, unit: 'VA', section: 'H',
        mistakes: [{ value: (inp.acAmps ?? 0) * 120, mistake: 'wrong_voltage', message: 'The air conditioner is a 240-V load. Multiply by 240.' }],
      }))
    }
    if (both) {
      const heatBig = N.keep === 'heat'
      lines.push(choose({
        id: 'hKeep', label: 'Heat or A/C?',
        say: 'Heat and A/C never run at the same time. Which one stays in the calculation?',
        why: 'They are noncoincident loads: the code lets you count only the larger one.',
        ref: REF.noncoincident,
        options: [
          opt('heat', 'Keep the heat, drop the A/C',
            heatBig ? undefined : `The heat (${fmt(N.heatVA)} VA) is the smaller one. Keep the larger: the A/C, ${fmt(N.acVA)} VA.`,
            heatBig ? undefined : 'used_smaller_noncoincident'),
          opt('ac', 'Keep the A/C, drop the heat',
            heatBig ? `The A/C (${fmt(N.acVA)} VA) is the smaller one. Keep the larger: the heat, ${fmt(N.heatVA)} VA.` : undefined,
            heatBig ? 'used_smaller_noncoincident' : undefined),
          opt('both', 'Add both', 'They never run together (noncoincident loads): keep only the larger one.', 'added_both_heat_and_ac'),
        ],
        answerId: heatBig ? 'heat' : 'ac',
        section: 'H', checkpoint: true,
      }))
      lines.push(ruleLine({
        id: 'hLoad', label: 'Heat or A/C, the larger',
        say: 'Write down the larger of the two.',
        ref: REF.noncoincident,
        value: N.H, unit: 'VA',
        expr: `larger of ${fmt(N.heatVA)} and ${fmt(N.acVA)} → ${fmt(N.H)}`,
        mistakes: cleanMistakes(N.H, undefined, [
          { value: N.heatVA + N.acVA, mistake: 'added_both_heat_and_ac', message: 'Do not add them: heat and A/C never run together. Keep the larger one.' },
          { value: Math.min(N.heatVA, N.acVA), mistake: 'used_smaller_noncoincident', message: 'That is the smaller one. Keep the LARGER of heat and A/C.' },
        ]),
        section: 'H', checkpoint: true,
      }))
    }
    sections.push({ id: 'H', label: 'Heat or A/C (the larger)', totalLine: both ? 'hLoad' : N.heatVA > 0 ? 'heatVA' : 'acVA', letter: 'H' })
  }

  // ---- A ---------------------------------------------------------------------------------------------
  const parts: number[] = [N.L]
  if (n > 0) parts.push(N.F)
  if (inp.dryer) parts.push(N.D)
  if (rn) parts.push(N.R)
  if (N.heatVA > 0 || N.acVA > 0) parts.push(N.H)
  if (N.motor && N.motor25 > 0) {
    const m = N.motor
    const acDropped = both && N.keep === 'heat'
    const motors = inp.appliances.filter((a) => a.motor && a.name !== m.name)
    lines.push(calc({
      id: 'motor25', label: '25% of the largest motor',
      say: N.keep === 'ac'
        ? `The A/C compressor is the largest motor. Add 25% of it: ${fmt(m.va)} × 0.25.`
        : `The largest motor still in the calculation is the ${m.name}. Add 25% of it: ${fmt(m.va)} × 0.25.`,
      why: `The largest motor counts at 125% (${loc(REF.motorLoadCalc)} sends you to ${loc(REF.motorFeeder)}). Its 100% is already in a bucket above, so this line adds the other 25%, the way ${loc(REF.annexD1b)} does.`,
      ref: REF.motorLoadCalc,
      a: m.va, op: '×', b: LOAD.largestMotorExtraPct / 100, unit: 'VA', section: 'A',
      mistakes: cleanMistakes(N.motor25, undefined, [
        acDropped && { value: clean(N.acVA * 0.25), mistake: 'motor25_wrong_motor', message: `The A/C was dropped (the heat is larger), so it is not in the calculation. Take 25% of the ${m.name}.` },
        ...motors.map((x) => ({ value: clean(ratingVA(x.rating) * 0.25), mistake: 'motor25_wrong_motor', message: `The ${x.name} is not the largest motor. Take 25% of the ${m.name}.` })),
        { value: clean(m.va * 1.25), mistake: 'largest_motor_25', message: `This line is only the EXTRA 25%. The ${m.name}'s full load is already counted above.` },
      ]),
    }))
    parts.push(N.motor25)
  }
  const dropped = (k: StandardFlags) => T(k)
  lines.push(sum({
    id: 'total', label: 'Total calculated load',
    say: N.motor25 > 0 ? 'Add the bucket totals and the 25% motor line.' : 'Add the bucket totals.',
    why: 'Every bucket is now at its demand value, so the total is the load the service must carry.',
    parts, unit: 'VA', section: 'A',
    mistakes: cleanMistakes(N.total, undefined, [
      { value: dropped({ wholeLighting35: true }), mistake: 'demand_on_whole_load', message: 'Check bucket L: the 35% goes only on the part over 3,000 VA.' },
      { value: dropped({ noSmallAppliance: true }), mistake: 'missed_small_appliance', message: 'Bucket L is missing the small-appliance and laundry circuits.' },
      ex > 0 && { value: dropped({ countedExcluded: true }), mistake: 'floor_area_extra', message: 'Bucket L counts the garage or porch. Use the living area only.' },
      n > 0 && { value: dropped({ wrong75: true }), mistake: 'appliance_75_misused', message: four ? 'Bucket F: four or more appliances are counted at 75%.' : 'Bucket F: fewer than four appliances stay at 100%.' },
      inp.dryer && N.dBefore < DWELLING.dryerMinVA && { value: dropped({ dryerNameplate: true }), mistake: 'dryer_minimum', message: 'Bucket D: a dryer counts at least 5,000 VA.' },
      inp.dryer && N.dBefore > DWELLING.dryerMinVA && { value: dropped({ dryerFloorOnly: true }), mistake: 'dryer_nameplate_larger', message: 'Bucket D: the dryer nameplate is more than 5,000 VA, so use the nameplate.' },
      rn && { value: dropped({ rangeNameplate: true }), mistake: 'range_nameplate', message: 'Bucket R: use the range demand from the table, not the nameplate.' },
      rn?.over && rn.steps > 0 && { value: dropped({ noNote1: true }), mistake: 'range_note1', message: 'Bucket R: the range is over 12 kW, so Note 1 raises the 8 kW.' },
      both && { value: dropped({ bothHvac: true }), mistake: 'added_both_heat_and_ac', message: 'Bucket H: keep only the larger of heat and A/C.' },
      both && { value: dropped({ smallerHvac: true }), mistake: 'used_smaller_noncoincident', message: 'Bucket H: you kept the smaller of heat and A/C.' },
      N.motor25 > 0 && { value: dropped({ noMotor25: true }), mistake: 'largest_motor_25', message: 'Add the 25% of the largest motor too.' },
      inp.dryer && { value: clean(N.total - N.D), mistake: 'left_out_load', message: 'The dryer bucket is missing from the total.' },
    ]),
  }))
  lines.push(ampsLine({
    id: 'amps', label: 'Calculated load in amperes',
    va: N.total, divisor: 240,
    say: `The service is 120/240 V single-phase: divide the total by 240. ${fmt(N.total)} ÷ 240.`,
    section: 'A', checkpoint: true,
    mistakes: [
      { value: N.total / 120, mistake: 'wrong_voltage', message: 'A 120/240-V service carries the load on two 120-V legs: divide by 240, not 120.' },
    ],
  }))
  lines.push(sizeLine({ id: 'service', label: 'Minimum service rating', amps: N.amps, min: LOAD.minServiceOneFamilyA, section: 'A' }))
  sections.push({ id: 'A', label: 'Total, amperes and service size', totalLine: 'service', letter: 'A' })

  // ---- exam options, each wrong one from a real slip ----------------------------------------------------
  const wrongs: WrongValue[] = wrongsFrom(N.service, [
    { value: S({ by120: true }), mistake: 'wrong_voltage', why: 'Divided by 120 V. A 120/240-V service divides the total by 240.' },
    { value: S({ wholeLighting35: true }), mistake: 'demand_on_whole_load', why: 'This is what you get if you take 35% of the whole lighting load, not just the part over 3,000 VA.' },
    { value: S({ noSmallAppliance: true }), mistake: 'missed_small_appliance', why: 'Left out the small-appliance and laundry circuits.' },
    ex > 0 && { value: S({ countedExcluded: true }), mistake: 'floor_area_extra', why: 'Counted the garage or porch as floor area.' },
    n > 0 && { value: S({ wrong75: true }), mistake: 'appliance_75_misused', why: four ? 'Left the four or more appliances at 100%; they get 75%.' : 'Took 75% of fewer than four appliances.' },
    inp.dryer && N.dBefore < DWELLING.dryerMinVA && { value: S({ dryerNameplate: true }), mistake: 'dryer_minimum', why: 'Used the dryer nameplate under 5,000 VA.' },
    rn && { value: S({ rangeNameplate: true }), mistake: 'range_nameplate', why: `Used the range nameplate instead of ${loc(REF.rangeTable)}.` },
    rn?.over && rn.steps > 0 && { value: S({ noNote1: true }), mistake: 'range_note1', why: 'Missed Note 1: a range over 12 kW gets 5% more per kW.' },
    both && { value: S({ bothHvac: true }), mistake: 'added_both_heat_and_ac', why: 'Added both the heat and the A/C; keep only the larger.' },
    both && { value: S({ smallerHvac: true }), mistake: 'used_smaller_noncoincident', why: 'Kept the smaller of heat and A/C.' },
    { value: S({ noMin100: true }), mistake: 'service_min_100', why: 'Went below the 100 A minimum for a one-family house.' },
  ])

  const { story, givens } = storyOf(inp)
  return {
    recipeId: ID,
    seed,
    story,
    givens,
    ask: 'the minimum service rating by the standard method',
    lines,
    sections,
    answerLine: 'service',
    choices: sizeChoices(N.service, wrongs, rng, LOAD.minServiceOneFamilyA),
    visual: {
      kind: 'load',
      buckets: [
        { label: 'Lighting, small appliances, laundry', before: N.lBefore, after: N.L },
        ...(n > 0 ? [{ label: 'Fastened-in-place appliances', before: N.fBefore, after: N.F }] : []),
        ...(inp.dryer ? [{ label: 'Dryer', before: N.dBefore, after: N.D }] : []),
        ...(rn ? [{ label: 'Range', before: N.rBefore, after: N.R }] : []),
        ...(N.heatVA > 0 || N.acVA > 0 ? [{ label: 'Heat or A/C', before: N.heatVA + N.acVA, after: N.H }] : []),
        ...(N.motor25 > 0 ? [{ label: '25% of the largest motor', before: N.motor25, after: N.motor25 }] : []),
      ],
    },
  }
}

function generate(seed: number): ProblemInstance {
  return buildStandard(pickStandard(seed), seed)
}

export const dwellingStandard: Recipe = {
  id: ID,
  family: 'dwelling',
  title: 'House service: standard method',
  blurb: 'The whole one-family calculation, bucket by bucket: L, F, D, R, H, then amps and the service size.',
  topic: 'calculations',
  editions: ['2020'],
  generate,
  card: {
    whenToUse: 'The question describes one house (square feet and its appliances) and asks for the service size by the standard method.',
    steps: [
      { label: 'L: lighting, small appliances, laundry', how: 'Square feet × 3, plus 1,500 VA per small-appliance circuit (two at least) and 1,500 VA for laundry. First 3,000 VA at 100%, the rest at 35%.', ref: REF.lightingDemand },
      { label: 'F: fastened-in-place appliances', how: 'Water heater, dishwasher, disposer, pumps: add their VA. Four or more: × 0.75.', ref: REF.fixedAppliances },
      { label: 'D: dryer', how: '5,000 VA or the nameplate, whichever is larger.', ref: REF.dryers },
      { label: 'R: range', how: 'Column C: 8 kW for one range up to 12 kW. Over 12 kW: 5% more for each kW over 12.', ref: REF.rangeTable },
      { label: 'H: heat or A/C', how: 'Heat at 100%, A/C at amps × 240. Keep only the larger.', ref: REF.noncoincident },
      { label: 'Largest motor', how: 'Add 25% of the largest motor: the A/C when it is kept, else the biggest motor appliance.', ref: REF.motorLoadCalc },
      { label: 'A: amps and service', how: 'Add it all up, ÷ 240, then the next standard size. Never under 100 A.', ref: REF.minServiceDwelling },
    ],
    traps: [
      'The 35% goes only on the part over 3,000 VA, never on the whole lighting load.',
      'The small-appliance (2 × 1,500) and laundry (1,500) circuits go in BEFORE the demand factor.',
      'Garages and open porches are not floor area.',
      'The range, dryer, heat and A/C never count toward the four fastened-in-place appliances.',
      'A dryer is never less than 5,000 VA. A range is never its nameplate.',
      'Heat and A/C: keep the larger, drop the other. Never add both.',
      'A 120/240-V service: divide by 240, not 120.',
    ],
    formulas: [
      'Lighting demand = (total − 3,000) × 0.35 + 3,000',
      'Range over 12 kW = 8 kW × (1 + 0.05 × kW over 12)',
      'Amps = total VA ÷ 240',
    ],
  },
}
