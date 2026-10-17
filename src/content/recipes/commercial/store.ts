/**
 * Store or office building, service or feeder (Annex D Example D3 method, 2020 NEC as revised by TIA 20-6).
 *
 *   L  general lighting: Table 220.12 unit load × area. In 2020 the table's unit loads ALREADY include
 *      the 125% for continuous lighting. When the story gives the actual connected lighting, compare
 *      it × 1.25 with the table value and keep the larger.
 *   R  receptacles: 180 VA per yoke (220.14(I)), Table 220.44: first 10 kVA at 100%, the rest at 50%.
 *      Noncontinuous: no 125%. Office buildings (220.14(K)): the larger of that and 1 VA per ft².
 *   S  show window 200 VA per linear foot (220.14(G)) and the sign outlet 1,200 VA (220.14(F)), both
 *      continuous: × 1.25.
 *   A  the load for SIZING the service (230.42(A)(1)) or feeder (215.2(A)(1), 215.3): continuous loads at
 *      125%, which is not the Article 220 "calculated load" (review 2026-10-17); ÷ 240 (120/240 V) or
 *      ÷ (V × 1.732) (three-phase, two lines); the next standard overcurrent device at or above (240.6(A)).
 * Unit loads: only retail (1.9 VA/ft²) and office (1.3 VA/ft²), the two the research confirmed.
 */
import { calc, choose, fmt, given, lookup, makeRng, nextStandardUp, sum, type WrongValue } from '@/calc'
import { COMMERCIAL, SQRT3 } from '@/data/tables'
import { REF } from '@/data/refs'
import { REF_EXTRA } from '@/data/refsExtra'
import { LOAD, NONDWELLING_UNIT_LOAD, REF_LOAD, type NonDwellingOccupancy } from '@/data/loadExtra'
import type { CodeRef, Given, ProblemInstance, Recipe, Section, WorkLine } from '@/shared/types'
import { cleanMistakes, opt, ruleLine } from '../kit'
import { ampsLine, clean, listJoin, loc, sizeChoices, sizeFor, sizeLine, sizeStable, wrongsFrom } from '../dwelling/common'

const ID = 'commercial-store'

export interface StoreIn {
  occupancy: NonDwellingOccupancy
  length: number
  width: number
  /** True: the story gives length × width; false: the floor area. */
  dims: boolean
  /** Actual connected general lighting (continuous), VA. */
  actualVA?: number
  receptacles: number
  showWindowFt?: number
  sign: boolean
  phase: 1 | 3
  /** Line-to-line volts: 240 (120/240 V single-phase), 208 (208Y/120 V) or 480 (480Y/277 V). */
  volts: 240 | 208 | 480
  /** What the question sizes: the service (default) or the feeder to the building. */
  supply?: 'service' | 'feeder'
}

export interface StoreFlags {
  table125?: boolean
  actualNo125?: boolean
  keptSmaller?: boolean
  noRecDemand?: boolean
  rec50All?: boolean
  rec125?: boolean
  noOfficeMin?: boolean
  contNo125?: boolean
  noSign?: boolean
  noShowWindow?: boolean
  divisor?: number
}

export interface StoreNums {
  area: number
  unitLoad: number
  tableVA: number
  actual125: number
  lighting: number
  recVA: number
  recDemand: number
  /** 220.14(K): 1 VA per ft² for an office building (0 for a store). */
  recOffice: number
  /** The receptacle load that goes into the total (for an office, the larger of the two). */
  recLoad: number
  swVA: number
  sw125: number
  sign125: number
  total: number
  divisor: number
  amps: number
  ocpd: number
}

const C = COMMERCIAL
const K125 = C.continuousPct / 100

export function storeNums(inp: StoreIn, f: StoreFlags = {}): StoreNums {
  const area = inp.length * inp.width
  const unitLoad = NONDWELLING_UNIT_LOAD[inp.occupancy]
  const tableVA = clean(area * unitLoad)
  const actual = inp.actualVA ?? 0
  const actual125 = clean(actual * (f.actualNo125 ? 1 : K125))
  const table = f.table125 ? clean(tableVA * K125) : tableVA
  const lighting = f.keptSmaller && actual > 0 ? Math.min(table, actual125) : Math.max(table, actual125)
  const recVA = inp.receptacles * C.receptacleVA
  let recDemand = recVA <= C.receptacleFirstVA ? recVA : clean(C.receptacleFirstVA + (recVA - C.receptacleFirstVA) * (C.receptacleRemainderPct / 100))
  if (f.noRecDemand) recDemand = recVA
  if (f.rec50All) recDemand = clean(recVA * (C.receptacleRemainderPct / 100))
  const recOffice = inp.occupancy === 'office' ? area * LOAD.officeReceptacleVAperFt2 : 0
  let recLoad = f.noOfficeMin ? recDemand : Math.max(recDemand, recOffice)
  if (f.rec125) recLoad = clean(recLoad * K125)
  const contK = f.contNo125 ? 1 : K125
  const swVA = f.noShowWindow ? 0 : (inp.showWindowFt ?? 0) * C.showWindowVAperFt
  const sw125 = clean(swVA * contK)
  const sign125 = inp.sign && !f.noSign ? clean(C.signOutletVA * contK) : 0
  const total = clean(lighting + recLoad + sw125 + sign125)
  const divisor = f.divisor ?? (inp.phase === 1 ? 240 : clean(inp.volts * SQRT3))
  const amps = total / divisor
  return { area, unitLoad, tableVA, actual125, lighting, recVA, recDemand, recOffice, recLoad, swVA, sw125, sign125, total, divisor, amps, ocpd: sizeFor(amps) }
}

export function storeIsRobust(inp: StoreIn): boolean {
  const n = storeNums(inp)
  if (!sizeStable(n.amps)) return false
  // A 1.73 for 1.732 slip must not change the size either.
  if (inp.phase === 3 && nextStandardUp(n.total / (inp.volts * 1.73)) !== n.ocpd) return false
  if (inp.actualVA && Math.max(n.tableVA, n.actual125) < 1.03 * Math.min(n.tableVA, n.actual125)) return false
  // The office comparison (220.14(K)) must be a clear call.
  if (inp.occupancy === 'office' && Math.max(n.recDemand, n.recOffice) < 1.03 * Math.min(n.recDemand, n.recOffice)) return false
  return n.amps >= 15
}

export function pickStore(seed: number): StoreIn {
  const rng = makeRng(seed)
  for (let tries = 0; tries < 400; tries++) {
    const retail = rng.chance(0.6)
    const length = retail ? rng.step(50, 160, 5) : rng.step(80, 250, 10)
    const width = retail ? rng.step(40, 100, 5) : rng.step(60, 150, 10)
    const area = length * width
    const unit = NONDWELLING_UNIT_LOAD[retail ? 'retail' : 'office']
    const actualVA = rng.chance(0.5) ? Math.round((area * unit * rng.pick([0.6, 0.7, 0.75, 0.85, 0.95, 1.0])) / 100) * 100 : undefined
    const phase: 1 | 3 = rng.chance(0.5) ? 1 : 3
    const inp: StoreIn = {
      occupancy: retail ? 'retail' : 'office',
      length, width, dims: rng.chance(0.6),
      actualVA,
      // Offices range from few receptacles (1 VA/ft² wins) to many (the 220.14(I) load wins).
      receptacles: retail ? rng.int(30, 160) : rng.int(30, 300),
      showWindowFt: retail && rng.chance(0.75) ? rng.step(10, 60, 5) : undefined,
      sign: retail ? rng.chance(0.85) : rng.chance(0.4),
      phase,
      volts: phase === 1 ? 240 : retail || rng.chance(0.6) ? 208 : 480,
      supply: rng.chance(0.3) ? 'feeder' : 'service',
    }
    if (storeIsRobust(inp)) return inp
  }
  return D3_STORE
}

/** Annex D Example D3 (2020, TIA 20-6): 80 ft × 60 ft store, 30 ft of show window, 80 receptacles, 7,000 VA actual lighting. */
export const D3_STORE: StoreIn = {
  occupancy: 'retail', length: 80, width: 60, dims: true, actualVA: 7000, receptacles: 80, showWindowFt: 30, sign: true, phase: 1, volts: 240,
  supply: 'service',
}

const OCC_NAME: Record<NonDwellingOccupancy, string> = { retail: 'retail store', office: 'office building' }
const OCC_A: Record<NonDwellingOccupancy, string> = { retail: 'A retail store', office: 'An office building' }

export function buildStore(inp: StoreIn, seed: number): ProblemInstance {
  const rng = makeRng(seed ^ 0x5707e)
  const N = storeNums(inp)
  const F = (f: StoreFlags) => storeNums(inp, f)
  const lines: WorkLine[] = []
  const sections: Section[] = []
  const otherOcc: NonDwellingOccupancy = inp.occupancy === 'retail' ? 'office' : 'retail'
  const actualWins = (inp.actualVA ?? 0) > 0 && N.actual125 > N.tableVA
  const office = inp.occupancy === 'office'
  const feeder = inp.supply === 'feeder'
  const what = feeder ? 'feeder' : 'service'
  // The 125% for continuous loads: 230.42(A)(1) for a service, 215.2(A)(1) / 215.3 for a feeder.
  const contRef: CodeRef = feeder ? REF.continuousFeederOcpd : REF_LOAD.serviceConductors
  const contWhere = feeder ? `${loc(REF.continuousFeeder)} and ${loc(REF.continuousFeederOcpd)}` : loc(REF_LOAD.serviceConductors)
  const contNames = [inp.showWindowFt && 'the show window', inp.sign && 'the sign'].filter((x): x is string => !!x)
  const contText = listJoin(contNames)

  // ---- L: general lighting --------------------------------------------------------------------------------
  if (inp.dims) {
    lines.push(calc({
      id: 'area', label: 'Floor area',
      say: `Length × width: ${inp.length} × ${inp.width}.`,
      a: inp.length, op: '×', b: inp.width, unit: 'ft2', section: 'L',
      mistakes: [{ value: 2 * (inp.length + inp.width), mistake: 'unknown', message: 'That is the distance around the building. Area is length × width.' }],
    }))
  } else {
    lines.push(given({ id: 'area', label: 'Floor area', say: 'Write down the floor area.', value: N.area, unit: 'ft2', section: 'L' }))
  }
  lines.push(lookup({
    id: 'unitLoad', label: 'Unit load, VA per square foot',
    say: `${loc(REF.nonDwellingLighting)}: the row for ${office ? 'office' : 'retail'}.`,
    why: '2020 NEC: these unit loads already include the 125% for lighting that is on for hours at a time.',
    ref: REF.nonDwellingLighting,
    value: N.unitLoad, unit: 'none', section: 'L',
    mistakes: [
      { value: 3, mistake: 'wrong_table_row', message: `3 VA per square foot is the dwelling value. A ${OCC_NAME[inp.occupancy]} uses the ${inp.occupancy} row.` },
      { value: NONDWELLING_UNIT_LOAD[otherOcc], mistake: 'wrong_table_row', message: `That is the ${otherOcc} row. This is ${office ? 'an office' : 'a retail'} occupancy.` },
    ],
  }))
  lines.push(calc({
    id: 'tableVA', label: 'General lighting by the table',
    say: `Multiply the area by the unit load: ${fmt(N.area)} × ${fmt(N.unitLoad)}.`,
    ref: REF.nonDwellingLighting,
    a: N.area, op: '×', b: N.unitLoad, unit: 'VA', section: 'L',
    mistakes: cleanMistakes(N.tableVA, undefined, [
      { value: clean(N.tableVA * K125), mistake: 'table_lighting_125_twice', message: 'Do not add 125% to the table value: in 2020 the unit loads already include it.' },
      { value: N.area * 3, mistake: 'wrong_table_row', message: `3 VA per square foot is for dwellings. Use ${fmt(N.unitLoad)} for ${inp.occupancy}.` },
    ]),
  }))
  let lTotal = 'tableVA'
  if (inp.actualVA) {
    lines.push(given({ id: 'actual', label: 'Actual connected lighting', say: 'Write down the actual lighting load from the question.', value: inp.actualVA, unit: 'VA', section: 'L' }))
    lines.push(calc({
      id: 'actual125', label: 'Actual lighting at 125%',
      say: `The actual lighting is continuous: ${fmt(inp.actualVA)} × 1.25.`,
      why: `The table value has the 125% built in, so the actual lighting is compared at 125% too (${contWhere}: continuous loads at 125%).`,
      ref: contRef,
      a: inp.actualVA, op: '×', b: K125, unit: 'VA', section: 'L',
      mistakes: [{ value: inp.actualVA, mistake: 'forgot_125_continuous', message: 'Continuous lighting counts at 125% here: × 1.25.' }],
    }))
    lines.push(ruleLine({
      id: 'lighting', label: 'General lighting, the larger',
      say: 'Keep the larger of the table value and the actual lighting × 1.25.',
      why: 'The table is the minimum; if the real lighting is bigger, the real lighting wins.',
      ref: REF.nonDwellingLighting,
      value: N.lighting, unit: 'VA',
      expr: `larger of ${fmt(N.tableVA)} and ${fmt(N.actual125)} → ${fmt(N.lighting)}`,
      mistakes: cleanMistakes(N.lighting, undefined, [
        { value: Math.min(N.tableVA, N.actual125), mistake: 'lighting_kept_smaller', message: 'That is the smaller one. Keep the LARGER of the table value and the actual × 1.25.' },
        !actualWins && { value: clean(N.tableVA * K125), mistake: 'table_lighting_125_twice', message: 'The table value already includes the 125%. Do not multiply it again.' },
        actualWins && { value: Math.max(N.tableVA, inp.actualVA), mistake: 'forgot_125_continuous', message: 'Compare with the actual lighting at 125%.' },
      ]),
      section: 'L', checkpoint: true,
    }))
    lTotal = 'lighting'
  }
  sections.push({ id: 'L', label: 'General lighting', totalLine: lTotal, letter: 'L' })

  // ---- R: receptacles -----------------------------------------------------------------------------------
  const over = N.recVA > C.receptacleFirstVA
  lines.push(given({ id: 'recCount', label: 'Receptacles', say: 'Write down the number of receptacle outlets (yokes).', value: inp.receptacles, unit: 'count', section: 'R' }))
  lines.push(calc({
    id: 'recVA', label: 'Receptacle load',
    say: `180 VA each: ${inp.receptacles} × 180.`,
    ref: REF.receptacleOutlets,
    a: inp.receptacles, op: '×', b: C.receptacleVA, unit: 'VA', section: 'R',
    mistakes: [{ value: inp.receptacles * 360, mistake: 'unknown', message: 'A duplex receptacle is one yoke: 180 VA, not 180 per outlet face.' }],
  }))
  lines.push(choose({
    id: 'recOver', label: 'Over 10,000 VA?',
    say: `Is ${fmt(N.recVA)} VA more than 10,000 VA?`,
    why: 'Receptacles get a demand factor only on the part over the first 10 kVA.',
    ref: REF.nonDwellingReceptacles,
    options: [
      opt('yes', 'Over 10,000 VA: the part above 10,000 at 50%', over ? undefined : `${fmt(N.recVA)} VA is not over 10,000 VA, so it stays at 100%.`),
      opt('no', '10,000 VA or less: all at 100%', over ? `${fmt(N.recVA)} VA is over 10,000 VA: the part above 10,000 VA counts at 50%.` : undefined, over ? 'demand_factor_missed' : undefined),
    ],
    answerId: over ? 'yes' : 'no',
    section: 'R', checkpoint: true,
  }))
  if (over) {
    const rem = N.recVA - C.receptacleFirstVA
    lines.push(calc({
      id: 'recRem', label: 'The part over 10,000 VA',
      say: `${fmt(N.recVA)} − 10,000.`,
      ref: REF.nonDwellingReceptacles,
      a: N.recVA, op: '−', b: C.receptacleFirstVA, unit: 'VA', section: 'R',
    }))
    lines.push(calc({
      id: 'rec50', label: 'That part at 50%',
      say: `${fmt(rem)} × 0.5.`,
      ref: REF.nonDwellingReceptacles,
      a: rem, op: '×', b: C.receptacleRemainderPct / 100, unit: 'VA', section: 'R',
      mistakes: cleanMistakes(rem * 0.5, undefined, [
        { value: clean(N.recVA * 0.5), mistake: 'demand_on_whole_load', message: 'Take 50% of the part OVER 10,000 VA, not of the whole receptacle load.' },
      ]),
      checkpoint: true,
    }))
    lines.push(calc({
      id: 'recDemand', label: 'Receptacles after demand',
      say: 'Add back the first 10,000 VA at 100%.',
      ref: REF.nonDwellingReceptacles,
      a: clean(rem * 0.5), op: '+', b: C.receptacleFirstVA, unit: 'VA', section: 'R',
      mistakes: cleanMistakes(N.recDemand, undefined, [
        { value: clean(rem * 0.5), mistake: 'forgot_first_step', message: 'Add back the first 10,000 VA.' },
        { value: N.recVA, mistake: 'demand_factor_missed', message: 'Apply the demand: first 10,000 VA at 100%, the rest at 50%.' },
        { value: clean(N.recDemand * K125), mistake: 'noncontinuous_125', message: 'Receptacles are not a continuous load here: no 125%.' },
      ]),
    }))
  }
  let rTotal = over ? 'recDemand' : 'recVA'
  if (office) {
    // 220.14(K) (2020): banks and office buildings, the larger of 220.14(I) after demand or 1 VA/ft².
    lines.push(calc({
      id: 'recOffice', label: 'Office minimum: 1 VA per square foot',
      say: `An office building's receptacle load is at least 1 VA per square foot: ${fmt(N.area)} × 1.`,
      why: `${loc(REF_LOAD.officeReceptacles)}: in banks and office buildings the receptacle load is the larger of the 180 VA count after demand, or 1 VA per square foot.`,
      ref: REF_LOAD.officeReceptacles,
      a: N.area, op: '×', b: LOAD.officeReceptacleVAperFt2, unit: 'VA', section: 'R',
    }))
    lines.push(ruleLine({
      id: 'recLoad', label: 'Receptacle load, the larger',
      say: 'Keep the larger: the receptacles after demand, or 1 VA per square foot.',
      ref: REF_LOAD.officeReceptacles,
      value: N.recLoad, unit: 'VA',
      expr: `larger of ${fmt(N.recDemand)} and ${fmt(N.recOffice)} → ${fmt(N.recLoad)}`,
      mistakes: cleanMistakes(N.recLoad, undefined, [
        { value: Math.min(N.recDemand, N.recOffice), mistake: 'office_receptacle_minimum', message: 'That is the smaller one. An office keeps the LARGER of the receptacles after demand and 1 VA per square foot.' },
        { value: N.recDemand + N.recOffice, mistake: 'office_receptacle_minimum', message: 'Do not add them: keep the larger of the two.' },
      ]),
      section: 'R', checkpoint: true,
    }))
    rTotal = 'recLoad'
  }
  sections.push({ id: 'R', label: office ? 'Receptacles (after demand, at least 1 VA per ft²)' : 'Receptacles after demand', totalLine: rTotal, letter: 'R' })

  // ---- S: show window and sign, continuous ----------------------------------------------------------------
  const sParts: number[] = []
  if (inp.showWindowFt) {
    lines.push(given({ id: 'swFt', label: 'Show window length', say: 'Write down the length of the show window, in feet.', value: inp.showWindowFt, unit: 'ft', section: 'S' }))
    lines.push(calc({
      id: 'swVA', label: 'Show window lighting',
      say: `200 VA per linear foot: ${inp.showWindowFt} × 200.`,
      ref: REF.showWindow,
      a: inp.showWindowFt, op: '×', b: C.showWindowVAperFt, unit: 'VA', section: 'S',
    }))
    lines.push(calc({
      id: 'sw125', label: 'Show window at 125%',
      say: `Show window lighting is continuous: ${fmt(N.swVA)} × 1.25.`,
      why: `${contWhere}: the ${what} is sized for the continuous loads at 125%.`,
      ref: contRef,
      a: N.swVA, op: '×', b: K125, unit: 'VA', section: 'S',
      mistakes: [{ value: N.swVA, mistake: 'forgot_125_continuous', message: 'Show window lighting is continuous: × 1.25.' }],
      checkpoint: true,
    }))
    sParts.push(N.sw125)
  }
  if (inp.sign) {
    lines.push(lookup({
      id: 'sign', label: 'Sign outlet',
      say: 'A sign outlet counts as 1,200 VA.',
      ref: REF.signOutlet,
      value: C.signOutletVA, unit: 'VA', section: 'S',
    }))
    lines.push(calc({
      id: 'sign125', label: 'Sign at 125%',
      say: 'A sign is continuous: 1,200 × 1.25.',
      why: `${contWhere}: the ${what} is sized for the continuous loads at 125%.`,
      ref: contRef,
      a: C.signOutletVA, op: '×', b: K125, unit: 'VA', section: 'S',
      mistakes: [{ value: C.signOutletVA, mistake: 'forgot_125_continuous', message: 'A sign is a continuous load: × 1.25.' }],
    }))
    sParts.push(N.sign125)
  }
  if (sParts.length === 2) {
    lines.push(sum({ id: 'sTotal', label: 'Show window and sign', say: 'Add the show window and the sign.', parts: sParts, unit: 'VA', section: 'S' }))
  }
  if (sParts.length) sections.push({ id: 'S', label: 'Show window and sign (125%)', totalLine: sParts.length === 2 ? 'sTotal' : inp.showWindowFt ? 'sw125' : 'sign125', letter: 'S' })

  // ---- A: sizing load, amperes, overcurrent device -----------------------------------------------------------
  lines.push(sum({
    id: 'total', label: `Load for sizing the ${what} (continuous loads at 125%)`,
    say: 'Add the bucket totals.',
    why: `This is the load the ${what} is sized for, not the Article 220 calculated load: the continuous loads are in it at 125% (${contWhere}). ` +
      `${loc(REF.nonDwellingLighting)}'s unit load already includes the 125%` +
      (inp.actualVA ? ', and the actual connected lighting was compared at 125%.' : ', so the lighting is not multiplied again.'),
    ref: contRef,
    parts: [N.lighting, N.recLoad, ...sParts], unit: 'VA', section: 'A',
    mistakes: cleanMistakes(N.total, undefined, [
      !actualWins && { value: F({ table125: true }).total, mistake: 'table_lighting_125_twice', message: 'Bucket L: the table lighting already includes the 125%.' },
      over && { value: F({ noRecDemand: true }).total, mistake: 'demand_factor_missed', message: 'Bucket R: apply the receptacle demand (first 10 kVA at 100%, the rest at 50%).' },
      over && { value: F({ rec50All: true }).total, mistake: 'demand_on_whole_load', message: 'Bucket R: the 50% goes only on the part over 10,000 VA.' },
      office && { value: F({ noOfficeMin: true }).total, mistake: 'office_receptacle_minimum', message: 'Bucket R: an office keeps at least 1 VA per square foot for receptacles.' },
      { value: F({ rec125: true }).total, mistake: 'noncontinuous_125', message: 'Bucket R: receptacles here are noncontinuous: no 125%.' },
      sParts.length > 0 && { value: F({ contNo125: true }).total, mistake: 'forgot_125_continuous', message: `Bucket S: ${contText} ${contNames.length === 1 ? 'is' : 'are'} continuous: × 1.25.` },
      !!inp.actualVA && { value: F({ keptSmaller: true }).total, mistake: 'lighting_kept_smaller', message: 'Bucket L: keep the larger lighting value.' },
      inp.sign && { value: F({ noSign: true }).total, mistake: 'left_out_load', message: 'The sign is missing from the total.' },
    ]),
  }))
  if (inp.phase === 3) {
    lines.push(calc({
      id: 'v3', label: 'Volts × 1.732',
      say: `Three-phase: multiply ${inp.volts} by 1.732 first.`,
      why: 'Three-phase amps = VA ÷ (volts × 1.732). Work out the bottom, then divide once.',
      ref: REF_EXTRA.threePhase,
      a: inp.volts, op: '×', b: SQRT3, unit: 'none', section: 'A',
    }))
  }
  lines.push(ampsLine({
    id: 'amps', label: 'Sizing load in amperes',
    va: N.total, divisor: N.divisor,
    say: inp.phase === 1 ? `120/240 V single-phase: ${fmt(N.total)} ÷ 240.` : `${fmt(N.total)} ÷ ${fmt(N.divisor)}.`,
    section: 'A', checkpoint: true,
    mistakes: inp.phase === 1
      ? [{ value: N.total / 120, mistake: 'wrong_voltage', message: `A 120/240-V ${what}: divide by 240, not 120.` }]
      : [
          { value: N.total / inp.volts, mistake: 'sqrt3_missing', message: `Three-phase: divide by ${inp.volts} × 1.732, not by ${inp.volts} alone.` },
          inp.volts === 480 && { value: N.total / 277, mistake: 'wrong_voltage', message: 'Use the line-to-line voltage, 480 V, times 1.732.' },
        ],
  }))
  lines.push(sizeLine({ id: 'ocpd', label: `Minimum ${what} overcurrent device`, amps: N.amps, section: 'A', ref: REF.standardOcpd }))
  sections.push({ id: 'A', label: 'Sizing load, amperes and overcurrent device', totalLine: 'ocpd', letter: 'A' })

  // ---- story ------------------------------------------------------------------------------------------------
  const sys = inp.phase === 1 ? '120/240 V, single-phase' : inp.volts === 208 ? '208Y/120 V, three-phase' : '480Y/277 V, three-phase'
  const size = inp.dims ? `${inp.length} ft by ${inp.width} ft` : `${fmt(N.area)} square feet`
  const has: string[] = [`${inp.receptacles} duplex receptacles (noncontinuous)`]
  if (inp.showWindowFt) has.push(`${inp.showWindowFt} ft of show window`)
  if (inp.sign) has.push('one outside sign outlet')
  const story =
    `${OCC_A[inp.occupancy]} is ${size}. It has ${listJoin(has)}. ` +
    (inp.actualVA ? `The actual general lighting load is ${fmt(inp.actualVA)} VA, all of it continuous. ` : 'The general lighting is continuous. ') +
    (feeder
      ? `The building is supplied by one ${sys} feeder. Using the standard method, what is the minimum standard rating of the feeder overcurrent device?`
      : `The service is ${sys}. Using the standard method, what is the minimum standard rating of the service overcurrent device?`)
  const givens: Given[] = [
    inp.dims
      ? { id: 'size', label: 'Building size', value: N.area, unit: 'ft2', phrase: size }
      : { id: 'area', label: 'Floor area', value: N.area, unit: 'ft2', phrase: size },
    { id: 'rec', label: 'Receptacles', value: inp.receptacles, unit: 'count', phrase: `${inp.receptacles} duplex receptacles` },
  ]
  if (inp.showWindowFt) givens.push({ id: 'sw', label: 'Show window', value: inp.showWindowFt, unit: 'ft', phrase: `${inp.showWindowFt} ft of show window` })
  if (inp.actualVA) givens.push({ id: 'actual', label: 'Actual lighting', value: inp.actualVA, unit: 'VA', phrase: `${fmt(inp.actualVA)} VA` })

  const O = (f: StoreFlags) => storeNums(inp, f).ocpd
  const wrongs: WrongValue[] = wrongsFrom(N.ocpd, [
    !actualWins && { value: O({ table125: true }), mistake: 'table_lighting_125_twice', why: 'Multiplied the table lighting by 1.25; in 2020 the unit load already includes it.' },
    over && { value: O({ noRecDemand: true }), mistake: 'demand_factor_missed', why: 'Left out the receptacle demand factor.' },
    office && { value: O({ noOfficeMin: true }), mistake: 'office_receptacle_minimum', why: 'Left out the office minimum of 1 VA per square foot for receptacles.' },
    { value: O({ rec125: true }), mistake: 'noncontinuous_125', why: 'Took 125% of the receptacles; they are noncontinuous.' },
    sParts.length > 0 && { value: O({ contNo125: true }), mistake: 'forgot_125_continuous', why: `Left ${contText} at 100%; ${contNames.length === 1 ? 'it is' : 'they are'} continuous.` },
    !!inp.actualVA && { value: O({ keptSmaller: true }), mistake: 'lighting_kept_smaller', why: 'Kept the smaller of the table lighting and the actual × 1.25.' },
    inp.phase === 1
      ? { value: O({ divisor: 120 }), mistake: 'wrong_voltage', why: 'Divided by 120 V instead of 240 V.' }
      : { value: O({ divisor: inp.volts }), mistake: 'sqrt3_missing', why: `Divided by ${inp.volts} alone; three-phase needs × 1.732.` },
    inp.phase === 3 && { value: O({ divisor: 240 }), mistake: 'wrong_voltage', why: `Treated it as a 240-V single-phase ${what}.` },
  ])

  return {
    recipeId: ID,
    seed,
    story,
    givens,
    ask: `the minimum standard rating of the ${what} overcurrent device`,
    lines,
    sections,
    answerLine: 'ocpd',
    choices: sizeChoices(N.ocpd, wrongs, rng),
    visual: {
      kind: 'load',
      buckets: [
        { label: 'General lighting', before: inp.actualVA ?? N.tableVA, after: N.lighting },
        { label: 'Receptacles', before: N.recVA, after: N.recLoad },
        ...(inp.showWindowFt ? [{ label: 'Show window (125%)', before: N.swVA, after: N.sw125 }] : []),
        ...(inp.sign ? [{ label: 'Sign (125%)', before: C.signOutletVA, after: N.sign125 }] : []),
      ],
    },
  }
}

function generate(seed: number): ProblemInstance {
  return buildStore(pickStore(seed), seed)
}

export const commercialStore: Recipe = {
  id: ID,
  family: 'commercial',
  title: 'Store or office service',
  blurb: 'Lighting by the table (125% built in), receptacles with their demand, show window and sign at 125%.',
  topic: 'calculations',
  editions: ['2020'],
  generate,
  card: {
    whenToUse: 'The question describes a store or an office building (area, receptacles, show window, sign) and asks for the service or feeder size.',
    steps: [
      { label: 'L: lighting', how: 'Area × the table unit load (retail 1.9, office 1.3 VA per ft²). Actual lighting given? Compare it × 1.25 and keep the larger.', ref: REF.nonDwellingLighting },
      { label: 'R: receptacles', how: '180 VA each. First 10,000 VA at 100%, the rest at 50%. No 125%.', ref: REF.nonDwellingReceptacles },
      { label: 'Office?', how: 'Banks and offices: receptacles are at least 1 VA per ft². Keep the larger.', ref: REF_LOAD.officeReceptacles },
      { label: 'S: show window and sign', how: '200 VA per foot of show window, 1,200 VA for the sign, both × 1.25.', ref: REF.showWindow },
      { label: 'Sizing load', how: 'Add the buckets: continuous loads at 125% (service or feeder sizing).', ref: REF_LOAD.serviceConductors },
      { label: 'A: amps', how: 'Single-phase ÷ 240; three-phase ÷ (volts × 1.732).', ref: REF_EXTRA.threePhase },
      { label: 'Overcurrent device', how: 'The next standard size at or above the amps.', ref: REF.standardOcpd },
    ],
    traps: [
      '2020 NEC: the table lighting already includes the 125%. Do not multiply it again.',
      'Receptacles are noncontinuous: demand factor yes, 125% no.',
      'An office building: the receptacle load is never less than 1 VA per square foot.',
      'The show window and the sign are continuous: × 1.25 when sizing the service or feeder.',
      'Three-phase: ÷ (volts × 1.732); 208 V gives ÷ 360, 480 V gives ÷ 831.',
    ],
    formulas: ['Receptacle demand = (VA − 10,000) × 0.5 + 10,000', 'Three-phase amps = VA ÷ (volts × 1.732)'],
  },
}

