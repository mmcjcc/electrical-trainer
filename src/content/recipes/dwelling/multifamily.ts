/**
 * Multifamily dwelling, optional method (220.84; Annex D Examples D4(b) and D5(b) method, 2020 NEC).
 * Three or more units, each with electric cooking and electric heat or A/C (220.84(A)).
 *
 *   U  one unit's connected load (220.84(C)): 3 VA/ft², 1,500 VA per small-appliance and laundry
 *      circuit, the range, dryer, water heater and fastened-in-place appliances at NAMEPLATE, and the
 *      LARGER of the A/C and the fixed electric heat, at 100%
 *   B  × the number of units, × the Table 220.84 percent for that number of units
 *   A  ÷ 240 V (120/240 V single-phase) or ÷ (208 × 1.732) (208Y/120 V three-phase), as two lines.
 * The answer is the calculated load in amperes (220.5(B) rounding accepted both ways).
 */
import { calc, fmt, given, lookup, makeRng, numericChoices, roundAmps220, sum, type WrongValue } from '@/calc'
import { DWELLING, multifamilyOptionalPct, SQRT3 } from '@/data/tables'
import { REF } from '@/data/refs'
import { REF_EXTRA } from '@/data/refsExtra'
import { LOAD, REF_LOAD } from '@/data/loadExtra'
import type { Given, ProblemInstance, Recipe, Section, WorkLine } from '@/shared/types'
import { cleanMistakes, ruleLine, word } from '../kit'
import { ampsLine, appliancePhrase, clean, listJoin, loc, ratingVA, standardRangeVA, vaLine, withArticle, wrongsFrom, type Rating } from './common'

const ID = 'multifamily-optional'

export interface MultiIn {
  units: number
  area: number
  saCircuits: number
  /** False: a common laundry room, so the units have no laundry circuit and no dryer. */
  laundry: boolean
  rangeKW: number
  dryer?: Rating
  waterHeater: Rating
  dishwasher?: Rating
  heatKW?: number
  /** 240-V A/C nameplate amperes. */
  acAmps?: number
  phase: 1 | 3
}

export interface MultiFlags {
  standardRules?: boolean
  bothHvac?: boolean
  smallerHvac?: boolean
  heatPct?: boolean
  pctOf?: number
  noPct?: boolean
  noUnits?: boolean
  divisor?: number
}

export interface MultiNums {
  glVA: number
  saVA: number
  laundryVA: number
  rangeVA: number
  dryerVA: number
  whVA: number
  dwVA: number
  heatVA: number
  acVA: number
  hvac: number
  unit: number
  connected: number
  pct: number
  demand: number
  divisor: number
  amps: number
}

export const V3 = clean(208 * SQRT3)

export function multiNums(inp: MultiIn, f: MultiFlags = {}): MultiNums {
  const glVA = inp.area * DWELLING.lightingVAperFt2
  const saVA = inp.saCircuits * DWELLING.smallApplianceVA
  const laundryVA = inp.laundry ? DWELLING.laundryVA : 0
  const rangeVA = f.standardRules ? standardRangeVA(inp.rangeKW) : clean(inp.rangeKW * 1000)
  const npDryer = inp.dryer ? ratingVA(inp.dryer) : 0
  const dryerVA = f.standardRules && inp.dryer ? Math.max(DWELLING.dryerMinVA, npDryer) : npDryer
  const whVA = ratingVA(inp.waterHeater)
  const dwVA = inp.dishwasher ? ratingVA(inp.dishwasher) : 0
  const heatVA = inp.heatKW ? clean(inp.heatKW * 1000) : 0
  const acVA = inp.acAmps ? inp.acAmps * 240 : 0
  const heatUsed = f.heatPct ? clean(heatVA * (LOAD.optHeatFewUnitsPct / 100)) : heatVA
  let hvac = Math.max(heatUsed, acVA)
  if (f.bothHvac) hvac = heatVA + acVA
  if (f.smallerHvac && heatVA > 0 && acVA > 0) hvac = Math.min(heatVA, acVA)
  const unit = clean(glVA + saVA + laundryVA + rangeVA + dryerVA + whVA + dwVA + hvac)
  const connected = f.noUnits ? unit : clean(unit * inp.units)
  const pct = f.noPct ? 100 : multifamilyOptionalPct(f.pctOf ?? inp.units)
  const demand = clean((connected * pct) / 100)
  const divisor = f.divisor ?? (inp.phase === 1 ? 240 : V3)
  return { glVA, saVA, laundryVA, rangeVA, dryerVA, whVA, dwVA, heatVA, acVA, hvac, unit, connected, pct, demand, divisor, amps: demand / divisor }
}

/** The unit counts just below and above whose Table 220.84 percent differs (the "wrong row" slips). */
export function neighbourRows(n: number): number[] {
  const pct = multifamilyOptionalPct(n)
  const out: number[] = []
  for (let m = n - 1; m >= LOAD.multifamilyMinUnits; m--) if (multifamilyOptionalPct(m) !== pct) { out.push(m); break }
  for (let m = n + 1; m <= n + 20; m++) if (multifamilyOptionalPct(m) !== pct) { out.push(m); break }
  return out
}

const WH: Rating[] = [{ kind: 'kW', kw: 2.5 }, { kind: 'kW', kw: 3.8 }, { kind: 'kW', kw: 4.5 }, { kind: 'W', w: 4500 }]
const DRYERS: Rating[] = [{ kind: 'kW', kw: 4.5 }, { kind: 'kW', kw: 5 }, { kind: 'kW', kw: 5.5 }]

function pick(seed: number): MultiIn {
  const rng = makeRng(seed)
  for (let tries = 0; tries < 300; tries++) {
    const r = rng.next()
    const units = r < 0.3 ? rng.int(3, 12) : r < 0.75 ? rng.int(13, 40) : rng.int(41, 80)
    const laundry = rng.chance(0.5)
    const hv = rng.next()
    const inp: MultiIn = {
      units,
      area: rng.step(600, 1500, 10),
      saCircuits: 2,
      laundry,
      rangeKW: rng.pick([8, 9, 10, 11, 12, 12.5, 14]),
      dryer: laundry ? rng.pick(DRYERS) : undefined,
      waterHeater: rng.pick(WH),
      dishwasher: rng.chance(0.5) ? { kind: 'W', w: 1200 } : undefined,
      heatKW: hv < 0.75 ? rng.pick([3, 4, 5, 6, 7.5, 8, 10]) : undefined,
      acAmps: hv > 0.4 ? rng.pick([10, 12, 14, 16, 18, 20, 24]) : undefined,
      phase: rng.chance(0.5) ? 1 : 3,
    }
    if (inp.heatKW && inp.acAmps) {
      const h = inp.heatKW * 1000
      const a = inp.acAmps * 240
      if (Math.max(h, a) < 1.05 * Math.min(h, a)) continue
    }
    return inp
  }
  return D4B_20
}

/** Annex D Example D4(b), 20 units (also the fallback). */
export const D4B_20: MultiIn = {
  units: 20, area: 840, saCircuits: 2, laundry: false, rangeKW: 8, waterHeater: { kind: 'kW', kw: 2.5 }, heatKW: 6, phase: 1,
}

export function buildMulti(inp: MultiIn, seed: number): ProblemInstance {
  const rng = makeRng(seed ^ 0x84)
  const N = multiNums(inp)
  const F = (f: MultiFlags) => multiNums(inp, f)
  const lines: WorkLine[] = []
  const sections: Section[] = []
  const both = N.heatVA > 0 && N.acVA > 0
  const rangeStd = standardRangeVA(inp.rangeKW)
  // The standard-method rules that would change THIS building (review 2026-10-17: no dryer text without dryers).
  const dryerFloor = !!inp.dryer && ratingVA(inp.dryer) < DWELLING.dryerMinVA
  const stdText = dryerFloor ? `the ${loc(REF.rangeTable)} range demand and the 5,000 VA dryer floor` : `the ${loc(REF.rangeTable)} range demand`

  // ---- U: one unit ---------------------------------------------------------------------------------------
  lines.push(given({ id: 'area', label: 'Floor area of one unit', say: 'Write down the floor area of one unit.', value: inp.area, unit: 'ft2', section: 'U' }))
  lines.push(calc({
    id: 'glVA', label: 'General lighting, one unit',
    say: 'Multiply the floor area by 3 VA per square foot.',
    ref: REF_LOAD.multifamilyLoads,
    a: inp.area, op: '×', b: DWELLING.lightingVAperFt2, unit: 'VA', section: 'U',
  }))
  lines.push(calc({
    id: 'saVA', label: 'Small-appliance circuits, one unit',
    say: `${inp.saCircuits} circuits at 1,500 VA: ${inp.saCircuits} × 1,500.`,
    ref: REF_LOAD.multifamilyLoads,
    a: inp.saCircuits, op: '×', b: DWELLING.smallApplianceVA, unit: 'VA', section: 'U',
  }))
  if (inp.laundry) {
    lines.push(lookup({ id: 'laundryVA', label: 'Laundry circuit', say: 'Each unit with its own laundry gets a 1,500 VA laundry circuit.', ref: REF_LOAD.multifamilyLoads, value: DWELLING.laundryVA, unit: 'VA', section: 'U' }))
  }
  lines.push(calc({
    id: 'rangeVA', label: 'Range at nameplate',
    say: `Nameplate, no table: ${fmt(inp.rangeKW)} × 1,000.`,
    why: `${loc(REF.optionalMultifamilyTable)} does all the demand at once, so each appliance goes in at its full nameplate.`,
    ref: REF_LOAD.multifamilyLoads,
    a: inp.rangeKW, op: '×', b: 1000, unit: 'VA', section: 'U',
    mistakes: cleanMistakes(N.rangeVA, undefined, [
      { value: rangeStd, mistake: 'optional_used_standard_rules', message: `In the optional method the range goes in at its nameplate, not the ${loc(REF.rangeTable)} demand.` },
      { value: inp.rangeKW, mistake: 'kilo_conversion', message: 'That is still in kW. Multiply by 1,000.' },
    ]),
    checkpoint: true,
  }))
  if (inp.dryer) lines.push(vaLine('dryerVA', 'Dryer at nameplate', inp.dryer, 'U', [
    ratingVA(inp.dryer) < DWELLING.dryerMinVA && { value: DWELLING.dryerMinVA, mistake: 'optional_used_standard_rules', message: 'The 5,000 VA dryer floor is a standard-method rule. Use the nameplate here.' },
  ]))
  lines.push(vaLine('whVA', 'Water heater', inp.waterHeater, 'U'))
  if (inp.dishwasher) lines.push(vaLine('dwVA', 'Dishwasher', inp.dishwasher, 'U'))
  if (N.heatVA > 0) {
    lines.push(calc({
      id: 'heatVA', label: 'Electric heat at 100%',
      say: `Change kW to VA: ${fmt(inp.heatKW ?? 0)} × 1,000. No percent: it goes in at full nameplate.`,
      ref: REF_LOAD.multifamilyLoads,
      a: inp.heatKW ?? 0, op: '×', b: 1000, unit: 'VA', section: 'U',
      mistakes: cleanMistakes(N.heatVA, undefined, [
        { value: clean(N.heatVA * 0.65), mistake: 'multifamily_hvac_pct', message: 'The 65% and 40% belong to the one-dwelling method. Here the heat goes in at 100%.' },
        { value: clean(N.heatVA * 0.4), mistake: 'multifamily_hvac_pct', message: 'The 65% and 40% belong to the one-dwelling method. Here the heat goes in at 100%.' },
      ]),
    }))
  }
  if (N.acVA > 0) {
    lines.push(calc({
      id: 'acVA', label: 'A/C at 100%',
      say: `Amps × volts: ${inp.acAmps} × 240.`,
      ref: REF_LOAD.multifamilyLoads,
      a: inp.acAmps ?? 0, op: '×', b: 240, unit: 'VA', section: 'U',
      mistakes: [{ value: (inp.acAmps ?? 0) * 120, mistake: 'wrong_voltage', message: 'The A/C is a 240-V load: × 240.' }],
    }))
  }
  if (both) {
    lines.push(ruleLine({
      id: 'hvac', label: 'Heat or A/C, the larger',
      say: 'Keep the larger of the heat and the A/C, at 100%.',
      ref: REF_LOAD.multifamilyLoads,
      value: N.hvac, unit: 'VA',
      expr: `larger of ${fmt(N.heatVA)} and ${fmt(N.acVA)} → ${fmt(N.hvac)}`,
      mistakes: cleanMistakes(N.hvac, undefined, [
        { value: N.heatVA + N.acVA, mistake: 'added_both_heat_and_ac', message: 'Do not add them: keep only the larger one.' },
        { value: Math.min(N.heatVA, N.acVA), mistake: 'used_smaller_noncoincident', message: 'That is the smaller one. Keep the LARGER.' },
        { value: F({ heatPct: true }).hvac, mistake: 'multifamily_hvac_pct', message: 'No 65% here: compare the heat at 100% with the A/C.' },
      ]),
      section: 'U', checkpoint: true,
    }))
  }
  const unitParts = [N.glVA, N.saVA, ...(inp.laundry ? [N.laundryVA] : []), N.rangeVA, ...(inp.dryer ? [N.dryerVA] : []), N.whVA, ...(inp.dishwasher ? [N.dwVA] : []), ...(N.hvac > 0 ? [N.hvac] : [])]
  lines.push(sum({
    id: 'unit', label: 'Connected load, one unit',
    say: both ? 'Add everything for one unit, with only the larger of heat and A/C.' : 'Add everything for one unit.',
    ref: REF_LOAD.multifamilyLoads,
    parts: unitParts, unit: 'VA', section: 'U',
    mistakes: cleanMistakes(N.unit, undefined, [
      { value: F({ standardRules: true }).unit, mistake: 'optional_used_standard_rules', message: `Use nameplates here, not ${stdText}.` },
      both && { value: F({ bothHvac: true }).unit, mistake: 'added_both_heat_and_ac', message: 'Only the larger of heat and A/C goes in.' },
      both && { value: F({ smallerHvac: true }).unit, mistake: 'used_smaller_noncoincident', message: 'You kept the smaller of heat and A/C.' },
    ]),
  }))
  sections.push({ id: 'U', label: 'Connected load of one unit', totalLine: 'unit', letter: 'U' })

  // ---- B: the building -----------------------------------------------------------------------------------
  const rows = neighbourRows(inp.units)
  lines.push(given({ id: 'units', label: 'Number of units', say: 'Write down how many dwelling units there are.', value: inp.units, unit: 'count', section: 'B' }))
  lines.push(calc({
    id: 'connected', label: 'Connected load, all units',
    say: `Multiply one unit by the number of units: ${fmt(N.unit)} × ${inp.units}.`,
    a: N.unit, op: '×', b: inp.units, unit: 'VA', section: 'B',
  }))
  lines.push(lookup({
    id: 'pct', label: `Demand factor for ${inp.units} units`,
    say: `${loc(REF.optionalMultifamilyTable)}: find the row for ${inp.units} units and read the percent.`,
    why: 'The more units, the less likely they all use their full load at once.',
    ref: REF.optionalMultifamilyTable,
    value: N.pct, unit: 'pct', section: 'B',
    mistakes: cleanMistakes(N.pct, { rel: 0.001 }, rows.map((m) => ({ value: multifamilyOptionalPct(m), mistake: 'wrong_table_row', message: `That percent is for ${m} units. Find the row that includes ${inp.units}.` }))),
    checkpoint: true,
  }))
  lines.push(calc({
    id: 'demand', label: 'Building demand load',
    say: `Multiply by the percent as a decimal: ${fmt(N.connected)} × ${fmt(N.pct / 100)}.`,
    ref: REF.optionalMultifamilyTable,
    a: N.connected, op: '×', b: N.pct / 100, unit: 'VA', section: 'B',
    mistakes: cleanMistakes(N.demand, undefined, [
      { value: N.connected, mistake: 'demand_factor_missed', message: `Apply the ${N.pct}% from ${loc(REF.optionalMultifamilyTable)}.` },
      { value: clean(N.unit * N.pct / 100), mistake: 'skipped_operation', message: `Multiply one unit by the ${inp.units} units first, then take ${N.pct}%.` },
      ...rows.map((m) => ({ value: F({ pctOf: m }).demand, mistake: 'wrong_table_row', message: `That uses the percent for ${m} units.` })),
    ]),
  }))
  sections.push({ id: 'B', label: 'Building demand load', totalLine: 'demand', letter: 'B' })

  // ---- A: amperes -------------------------------------------------------------------------------------------
  if (inp.phase === 3) {
    lines.push(calc({
      id: 'v3', label: 'Volts × 1.732',
      say: 'Three-phase: multiply 208 by 1.732 first.',
      why: 'Three-phase amps = VA ÷ (volts × 1.732). Work out the bottom first, then divide once.',
      ref: REF_EXTRA.threePhase,
      a: 208, op: '×', b: SQRT3, unit: 'none', section: 'A',
    }))
  }
  lines.push(ampsLine({
    id: 'amps', label: 'Calculated load in amperes',
    va: N.demand, divisor: N.divisor,
    say: inp.phase === 1 ? `120/240 V single-phase: ${fmt(N.demand)} ÷ 240.` : `${fmt(N.demand)} ÷ ${fmt(V3)}.`,
    section: 'A', checkpoint: true,
    mistakes: inp.phase === 1
      ? [{ value: N.demand / 120, mistake: 'wrong_voltage', message: 'A 120/240-V service: divide by 240, not 120.' }]
      : [
          { value: N.demand / 208, mistake: 'sqrt3_missing', message: 'Three-phase: divide by 208 × 1.732, not by 208 alone.' },
          { value: N.demand / 240, mistake: 'wrong_voltage', message: 'This is a 208Y/120-V three-phase service: divide by 208 × 1.732.' },
        ],
  }))
  sections.push({ id: 'A', label: 'Amperes', totalLine: 'amps', letter: 'A' })

  // ---- story ---------------------------------------------------------------------------------------------------
  const sys = inp.phase === 1 ? '120/240 V, single-phase' : '208Y/120 V, three-phase'
  const items: string[] = [`${fmt(inp.area)} square feet of living space`, `${word(inp.saCircuits)} 20-A small-appliance circuits${inp.laundry ? ' and one laundry circuit' : ''}`, withArticle(`${fmt(inp.rangeKW)}-kW range`)]
  const givens: Given[] = [
    { id: 'units', label: 'Units', value: inp.units, unit: 'count', phrase: `${inp.units}-unit` },
    { id: 'area', label: 'Area per unit', value: inp.area, unit: 'ft2', phrase: `${fmt(inp.area)} square feet` },
    { id: 'range', label: 'Range', value: inp.rangeKW, unit: 'kW', phrase: `${fmt(inp.rangeKW)}-kW range` },
  ]
  const add = (id: string, label: string, r: Rating, name: string) => {
    const ph = appliancePhrase({ key: id, name, motor: false, rating: r })
    items.push(withArticle(ph))
    givens.push({ id, label, value: ratingVA(r), unit: 'VA', phrase: ph })
  }
  if (inp.dryer) add('dryer', 'Dryer', inp.dryer, 'clothes dryer')
  add('wh', 'Water heater', inp.waterHeater, 'water heater')
  if (inp.dishwasher) add('dw', 'Dishwasher', inp.dishwasher, 'dishwasher')
  if (inp.heatKW) {
    const ph = `${fmt(inp.heatKW)} kW of electric heat`
    items.push(ph)
    givens.push({ id: 'heat', label: 'Electric heat', value: inp.heatKW, unit: 'kW', phrase: ph })
  }
  if (inp.acAmps) {
    const ph = `240-V air conditioner rated ${inp.acAmps} A`
    items.push(`a ${ph}`)
    givens.push({ id: 'ac', label: 'A/C', value: inp.acAmps, unit: 'A', phrase: ph })
  }
  const story =
    `A ${inp.units}-unit apartment building is served at ${sys}. Each unit has ${listJoin(items)}. ` +
    (inp.laundry ? '' : 'Laundry is in a common laundry room on a separate service, so the units have no laundry circuit. ') +
    'Using the optional method for multifamily dwellings, what is the calculated load on the service, in amperes?'

  const A = (f: MultiFlags) => roundAmps220(F(f).amps)
  const right = roundAmps220(N.amps)
  const wrongs: WrongValue[] = wrongsFrom(right, [
    { value: A({ standardRules: true }), mistake: 'optional_used_standard_rules', why: `Used ${stdText}; the optional method uses nameplates.` },
    both && { value: A({ bothHvac: true }), mistake: 'added_both_heat_and_ac', why: 'Added both the heat and the A/C; keep only the larger.' },
    both && { value: A({ smallerHvac: true }), mistake: 'used_smaller_noncoincident', why: 'Kept the smaller of heat and A/C.' },
    N.heatVA > 0 && { value: A({ heatPct: true }), mistake: 'multifamily_hvac_pct', why: 'Took 65% of the heat; in the multifamily method it goes in at 100%.' },
    ...rows.map((m) => ({ value: A({ pctOf: m }), mistake: 'wrong_table_row', why: `Used the percent for ${m} units.` })),
    { value: A({ noPct: true }), mistake: 'demand_factor_missed', why: `Left out the ${loc(REF.optionalMultifamilyTable)} percent.` },
    inp.phase === 3
      ? { value: A({ divisor: 208 }), mistake: 'sqrt3_missing', why: 'Divided by 208 alone; three-phase needs 208 × 1.732.' }
      : { value: A({ divisor: 120 }), mistake: 'wrong_voltage', why: 'Divided by 120 V instead of 240 V.' },
  ])

  return {
    recipeId: ID,
    seed,
    story,
    givens,
    ask: 'the calculated service load in amperes, multifamily optional method',
    lines,
    sections,
    answerLine: 'amps',
    choices: numericChoices(right, rng.shuffle(wrongs), rng, { unit: 'A', decimals: 0 }),
    visual: { kind: 'load', buckets: [{ label: `${inp.units} units`, before: N.connected, after: N.demand }] },
  }
}

function generate(seed: number): ProblemInstance {
  return buildMulti(pick(seed), seed)
}

export const multifamilyOptional: Recipe = {
  id: ID,
  family: 'dwelling',
  title: 'Apartment building: optional method',
  blurb: 'Each unit at nameplate (the larger of heat and A/C), times the units, times the table percent.',
  topic: 'calculations',
  editions: ['2020'],
  generate,
  card: {
    whenToUse: 'Three or more units, each with electric cooking and electric heat or A/C, and the question says "optional method".',
    steps: [
      { label: 'One unit', how: '3 VA × ft², 1,500 per small-appliance and laundry circuit, the range, dryer, water heater and appliances at nameplate, and the larger of heat and A/C at 100%.', ref: REF_LOAD.multifamilyLoads },
      { label: 'All units', how: 'One unit × the number of units.', ref: REF.optionalMultifamily },
      { label: 'Percent', how: 'The table row for the number of units.', ref: REF.optionalMultifamilyTable },
      { label: 'Amps', how: 'Single-phase ÷ 240. Three-phase 208Y/120: ÷ (208 × 1.732) = ÷ 360.', ref: REF_EXTRA.threePhase },
    ],
    traps: [
      'Nameplates only: no range table, no dryer floor, no lighting demand table.',
      'Heat or A/C at 100%, the larger one only. No 65% or 40% here.',
      'The percent is applied once, to the whole building.',
      'Three-phase: ÷ (208 × 1.732), not ÷ 208.',
    ],
    formulas: ['Demand = one unit × units × percent', 'Three-phase amps = VA ÷ (208 × 1.732)'],
  },
}
