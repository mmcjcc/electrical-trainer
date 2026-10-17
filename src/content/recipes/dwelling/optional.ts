/**
 * One-family dwelling, optional method (220.82; Annex D Examples D2(a), D2(b), D2(c) method, 2020 NEC).
 *
 *   G  general loads at NAMEPLATE (220.82(B)): 3 VA/ft², 1,500 VA per small-appliance and laundry
 *      circuit, ranges / wall ovens / cooktops, the dryer, the water heater and every fastened-in-place,
 *      permanently connected or dedicated-circuit appliance. No Table 220.55, no 5,000 VA dryer floor,
 *      no 75%. First 10 kVA at 100%, the remainder at 40%.
 *   H  heat or A/C (220.82(C)), the LARGEST of: A/C at 100%; a heat pump's compressor at 100% plus
 *      65% of its supplementary heat; electric space heat at 65% with fewer than four separately
 *      controlled units, 40% with four or more. (Cited by content, not by item number: the printed
 *      numbering in Annex D is off by one.)
 *   A  total ÷ 240 V; the next standard size, never under 100 A.
 * The largest selection always leads the next by 5% or more, and the service size does not depend on
 * the 220.5(B) rounding.
 */
import { calc, choose, fmt, makeRng, sum, type WrongValue } from '@/calc'
import { DWELLING } from '@/data/tables'
import { REF } from '@/data/refs'
import { LOAD, REF_LOAD } from '@/data/loadExtra'
import type { Given, ProblemInstance, Recipe, Section, WorkLine } from '@/shared/types'
import { cleanMistakes, opt, product, ruleLine, word } from '../kit'
import { DRYER_RATINGS, pickAppliances, RANGE_KW_SINGLE } from './catalog'
import {
  ampsLine, appliancePhrase, capFirst, circuitsText, clean, lightingLines, lightingNums, listJoin, loc, ratingVA, singleRangeNums,
  sizeChoices, sizeFor, sizeLine, sizeStable, vaLine, withArticle, wrongsFrom, type Appliance, type LightingIn, type Rating,
} from './common'
import { GARAGES, PORCH_FT2, standardNums, type StandardIn } from './standard'

const ID = 'dwelling-optional'

export interface CookingUnit {
  key: string
  name: string
  count: number
  kw: number
}

export interface OptionalIn {
  lighting: LightingIn
  cooking: CookingUnit[]
  dryer?: Rating
  appliances: Appliance[]
  ac?: { units: number; amps: number; volts: 230 | 240 }
  /** Electric space heat (not a heat pump); `units` = separately controlled units. */
  heat?: { kw: number; units: number; kind: 'baseboard' | 'furnace' | 'heater' }
  heatPump?: { amps: number; suppKW: number }
}

export interface OptionalFlags {
  standardRules?: boolean
  hvacInPile?: boolean
  whole40?: boolean
  noFirst?: boolean
  heat100?: boolean
  heatPctSwap?: boolean
  suppAt100?: boolean
  bothHvac?: boolean
  smallerHvac?: boolean
  by120?: boolean
  noMin100?: boolean
}

export interface OptionalNums {
  pile: number
  remainder: number
  at40: number
  general: number
  acSel: number
  heatVA: number
  heatSel: number
  hpVA: number
  suppVA: number
  hpSel: number
  /** The selections that compete, by name. */
  selections: { key: 'ac' | 'heat' | 'hp' | 'hpCool'; va: number }[]
  hvac: number
  keep?: 'ac' | 'heat' | 'hp' | 'hpCool'
  total: number
  amps: number
  service: number
}

const FIRST = DWELLING.optionalFirstVA
const REST = DWELLING.optionalRemainderPct / 100

function isSingleRange(c: CookingUnit[]): c is [CookingUnit] {
  return c.length === 1 && c[0]?.key === 'range' && c[0].count === 1
}

export function optionalNums(inp: OptionalIn, f: OptionalFlags = {}): OptionalNums {
  const ln = lightingNums(inp.lighting)
  const range = isSingleRange(inp.cooking) ? inp.cooking[0] : undefined
  const cookingVA = inp.cooking.reduce((s, c) => s + c.count * c.kw * 1000, 0)
  const cooking = f.standardRules && range ? singleRangeNums(range.kw).demandVA : cookingVA
  const np = inp.dryer ? ratingVA(inp.dryer) : 0
  const dryer = f.standardRules ? Math.max(np > 0 ? DWELLING.dryerMinVA : 0, np) : np
  const apps = inp.appliances.reduce((s, a) => s + ratingVA(a.rating), 0)

  const acVA = inp.ac ? inp.ac.units * inp.ac.amps * inp.ac.volts : 0
  const heatVA = inp.heat ? clean(inp.heat.kw * 1000) : 0
  const many = (inp.heat?.units ?? 0) >= LOAD.optHeatManyUnits
  const heatPct = f.heat100 ? 100 : (many !== !!f.heatPctSwap) ? LOAD.optHeatManyUnitsPct : LOAD.optHeatFewUnitsPct
  const heatSel = clean((heatVA * heatPct) / 100)
  const hpVA = inp.heatPump ? inp.heatPump.amps * 240 : 0
  const suppVA = inp.heatPump ? clean(inp.heatPump.suppKW * 1000) : 0
  const hpSel = clean(hpVA + (suppVA * (f.suppAt100 ? 100 : LOAD.optSupplementalPct)) / 100)

  const hvacInPile = f.hvacInPile ? acVA + heatVA + hpVA + suppVA : 0
  const pile = clean(ln.total + cooking + dryer + apps + hvacInPile)
  const remainder = clean(pile - FIRST)
  const at40 = clean(remainder * REST)
  let general = clean(at40 + FIRST)
  if (f.whole40) general = clean(pile * REST)
  if (f.noFirst) general = at40

  const selections: OptionalNums['selections'] = []
  if (acVA > 0) selections.push({ key: 'ac', va: acVA })
  if (heatVA > 0) selections.push({ key: 'heat', va: heatSel })
  if (hpVA > 0) selections.push({ key: 'hpCool', va: hpVA }, { key: 'hp', va: hpSel })
  const sorted = [...selections].sort((a, b) => b.va - a.va)
  const keep = sorted[0]?.key
  let hvac = sorted[0]?.va ?? 0
  // "Added both" exists only for a separate A/C and heat. A heat pump's cooling and heating choices share
  // one compressor, so adding them would count it twice: not a slip a student makes (review 2026-10-17).
  if (f.bothHvac && inp.heat && inp.ac) hvac = acVA + heatSel
  if (f.smallerHvac && sorted.length > 1) hvac = sorted[sorted.length - 1]?.va ?? hvac
  if (f.hvacInPile) hvac = 0

  const total = clean(general + hvac)
  const amps = total / (f.by120 ? 120 : 240)
  return {
    pile, remainder, at40, general, acSel: acVA, heatVA, heatSel, hpVA, suppVA, hpSel, selections, hvac, keep, total, amps,
    service: sizeFor(amps, f.noMin100 ? undefined : LOAD.minServiceOneFamilyA),
  }
}

/** The same house by the standard method (a wrong option: "ran the standard method"), when it maps. */
export function asStandard(inp: OptionalIn): StandardIn | undefined {
  const range = isSingleRange(inp.cooking) ? inp.cooking[0] : undefined
  if (!range || inp.heatPump || (inp.ac && (inp.ac.volts !== 240 || inp.ac.units !== 1))) return undefined
  if (range.kw <= LOAD.rangeColBMaxKW || range.kw > LOAD.rangeNote1MaxKW) return undefined
  return {
    lighting: inp.lighting, appliances: inp.appliances, dryer: inp.dryer, rangeKW: range.kw,
    heatKW: inp.heat?.kw, acAmps: inp.ac?.amps,
  }
}

export function optionalIsRobust(inp: OptionalIn): boolean {
  const n = optionalNums(inp)
  if (!sizeStable(n.amps, LOAD.minServiceOneFamilyA)) return false
  const sorted = [...n.selections].sort((a, b) => b.va - a.va)
  const [first, second] = sorted
  if (first && second && !inp.heatPump && first.va < 1.05 * second.va) return false
  return n.pile > FIRST
}

const BASEBOARD_PER_ROOM = [1, 1.5, 2, 2.5]

export function pickOptional(seed: number): OptionalIn {
  const rng = makeRng(seed)
  for (let tries = 0; tries < 400; tries++) {
    const area = rng.step(1200, 3600, 50)
    const excluded: LightingIn['excluded'] = []
    if (rng.chance(0.5)) {
      const g = rng.pick(GARAGES)
      excluded.push({ name: g.name, ft2: rng.pick(g.sizes) })
    }
    if (rng.chance(0.3)) excluded.push({ name: 'open porch', ft2: rng.pick(PORCH_FT2) })
    const saCircuits = rng.chance(0.2) ? 3 : 2
    const cooking: CookingUnit[] = rng.chance(0.75)
      ? [{ key: 'range', name: 'range', count: 1, kw: rng.pick(RANGE_KW_SINGLE) }]
      : [
          { key: 'oven', name: 'wall oven', count: rng.pick([1, 2]), kw: rng.pick([3, 4, 4.5]) },
          { key: 'cooktop', name: 'cooktop', count: 1, kw: rng.pick([5.1, 6, 7.2]) },
        ]
    const v = rng.next()
    const inp: OptionalIn = {
      lighting: { area, excluded, saCircuits, saStated: saCircuits > 2 || rng.chance(0.5), laundry: true },
      cooking,
      dryer: rng.pick(DRYER_RATINGS),
      appliances: pickAppliances(rng, rng.int(2, 5)),
    }
    const ac = { units: 1, amps: rng.pick([16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40]), volts: 240 as const }
    if (v < 0.35) {
      const rooms = rng.int(2, 8)
      inp.heat = { kw: clean(rooms * rng.pick(BASEBOARD_PER_ROOM)), units: rooms, kind: 'baseboard' }
      inp.ac = ac
    } else if (v < 0.55) {
      inp.heat = { kw: rng.pick([10, 12, 15, 18, 20]), units: 1, kind: 'furnace' }
      inp.ac = ac
    } else if (v < 0.8) {
      inp.heatPump = { amps: rng.pick([16, 20, 24, 28, 32]), suppKW: rng.pick([5, 7.5, 10, 15]) }
    } else if (v < 0.9) {
      inp.ac = ac
    } else {
      const rooms = rng.int(2, 8)
      inp.heat = { kw: clean(rooms * rng.pick(BASEBOARD_PER_ROOM)), units: rooms, kind: 'baseboard' }
    }
    if (optionalIsRobust(inp)) return inp
  }
  return OPTIONAL_FALLBACK
}

/** Annex D Example D2(c) inputs: known to pass the robustness filter. */
export const OPTIONAL_FALLBACK: OptionalIn = {
  lighting: { area: 2000, excluded: [], saCircuits: 2, saStated: true, laundry: true },
  cooking: [{ key: 'range', name: 'range', count: 1, kw: 12 }],
  dryer: { kind: 'kW', kw: 5 },
  appliances: [
    { key: 'wh', name: 'water heater', motor: false, rating: { kind: 'kW', kw: 4.5 } },
    { key: 'dw', name: 'dishwasher', motor: false, rating: { kind: 'kW', kw: 1.2 } },
  ],
  heatPump: { amps: 24, suppKW: 15 },
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function cookingPhrase(c: CookingUnit): string {
  return c.count === 1 ? `${fmt(c.kw)}-kW ${c.name}` : `${word(c.count)} ${fmt(c.kw)}-kW ${c.name}s`
}

function storyOf(inp: OptionalIn): { story: string; givens: Given[] } {
  const li = inp.lighting
  const givens: Given[] = [{ id: 'area', label: 'Living area', value: li.area, unit: 'ft2', phrase: `${fmt(li.area)} square feet` }]
  const loads: string[] = []
  for (const c of inp.cooking) {
    const ph = cookingPhrase(c)
    loads.push(c.count === 1 ? withArticle(ph) : ph)
    givens.push({ id: c.key, label: cap(c.name), value: c.kw, unit: 'kW', phrase: ph })
  }
  if (inp.dryer) {
    const ph = appliancePhrase({ key: 'dryer', name: 'clothes dryer', motor: false, rating: inp.dryer })
    loads.push(withArticle(ph))
    givens.push({ id: 'dryer', label: 'Dryer', value: ratingVA(inp.dryer), unit: 'VA', phrase: ph })
  }
  for (const a of inp.appliances) {
    const ph = appliancePhrase(a)
    loads.push(withArticle(ph))
    givens.push({ id: a.key, label: cap(a.name), value: ratingVA(a.rating), unit: 'VA', phrase: ph })
  }
  if (inp.heat) {
    const h = inp.heat
    const ph = h.kind === 'baseboard'
      ? `${fmt(h.kw)} kW of electric baseboard heat in ${word(h.units)} rooms`
      : h.kind === 'furnace' ? `${fmt(h.kw)}-kW electric furnace` : `${fmt(h.kw)}-kW electric heater`
    loads.push(h.kind === 'baseboard' ? `${ph}, each room with its own thermostat` : withArticle(`${ph} with one thermostat`))
    givens.push({ id: 'heat', label: 'Electric heat', value: h.kw, unit: 'kW', phrase: ph })
  }
  if (inp.heatPump) {
    const ph = `240-V heat pump rated ${inp.heatPump.amps} A`
    loads.push(`a ${ph} with ${fmt(inp.heatPump.suppKW)} kW of supplementary electric heat`)
    givens.push({ id: 'hp', label: 'Heat pump', value: inp.heatPump.amps, unit: 'A', phrase: ph })
    givens.push({ id: 'supp', label: 'Supplementary heat', value: inp.heatPump.suppKW, unit: 'kW', phrase: `${fmt(inp.heatPump.suppKW)} kW of supplementary` })
  }
  if (inp.ac) {
    const a = inp.ac
    const ph = a.units === 1 ? `${a.volts}-V air conditioner rated ${a.amps} A` : `${word(a.units)} ${a.volts}-V room air conditioners rated ${a.amps} A each`
    loads.push(a.units === 1 ? `a ${ph}` : ph)
    givens.push({ id: 'ac', label: 'Air conditioning', value: a.amps, unit: 'A', phrase: ph })
  }
  if (li.saStated) givens.push({ id: 'sa', label: 'Small-appliance circuits', value: li.saCircuits, unit: 'count', phrase: `${word(li.saCircuits)} 20-A small-appliance circuits` })
  const extra = li.excluded.length ? `, plus ${listJoin(li.excluded.map((e) => withArticle(`${fmt(e.ft2)}-square-foot ${e.name}`)))}` : ''
  const story =
    `A one-family dwelling has ${fmt(li.area)} square feet of living space${extra}, served by a 120/240-V, single-phase service. ` +
    (li.saStated ? `It has ${circuitsText(li.saCircuits, li.laundry)}. ` : 'Include the required small-appliance and laundry circuits. ') +
    `The other loads are ${listJoin(loads)}. ` +
    'Using the optional method for one dwelling, what is the minimum rating of the service, in amperes?'
  return { story, givens }
}

export function buildOptional(inp: OptionalIn, seed: number): ProblemInstance {
  const rng = makeRng(seed ^ 0x0b7)
  const N = optionalNums(inp)
  const T = (f: OptionalFlags) => optionalNums(inp, f)
  const li = inp.lighting
  const lines: WorkLine[] = []
  const sections: Section[] = []
  const ln = lightingNums(li)
  const range = isSingleRange(inp.cooking) ? inp.cooking[0] : undefined
  const np = inp.dryer ? ratingVA(inp.dryer) : 0
  // The standard-method rules that would change THIS house (the texts name only these; review 2026-10-17).
  const stdRules = [range && `the ${loc(REF.rangeTable)} range demand`, np > 0 && np < DWELLING.dryerMinVA && 'the 5,000 VA dryer floor']
    .filter((x): x is string => !!x)
  const stdText = listJoin(stdRules)
  const hvacNames = [inp.heat && 'the electric heat', inp.heatPump && 'the heat pump and its backup heat', inp.ac && 'the A/C']
    .filter((x): x is string => !!x)
  const hvacText = listJoin(hvacNames)

  // ---- G: general loads at nameplate --------------------------------------------------------------------
  // The first five lines (area to laundry) are the same as the standard method's, but in the optional
  // method they are 220.82(B)(1) and (B)(2) (review 2026-10-17); the demand differs.
  const L = lightingLines(li, 'G')
  const lPart = L.lines.filter((l) => ['area', 'glVA', 'saCount', 'saVA', 'laundryVA'].includes(l.id))
  for (const l of lPart) {
    if (l.id === 'area') {
      l.ref = REF_LOAD.optionalFloorArea
      l.why = `${loc(REF_LOAD.optionalFloorArea)}: 3 VA per square foot of floor area, measured as in ${loc(REF.floorArea)} (no open porches, garages or unfinished spaces).`
    }
    if (l.id === 'glVA') l.ref = REF_LOAD.optionalFloorArea
    if (l.id === 'saVA' || l.id === 'laundryVA') l.ref = REF_LOAD.optionalCircuits
  }
  lines.push(...lPart)
  const parts: number[] = [ln.glVA, ln.saVA, ...(li.laundry ? [ln.laundryVA] : [])]
  for (const c of inp.cooking) {
    const va = clean(c.count * c.kw * 1000)
    const std = range && c === range ? singleRangeNums(c.kw).demandVA : undefined
    const mistakes = cleanMistakes(va, undefined, [
      std !== undefined && { value: std, mistake: 'optional_used_standard_rules', message: `The optional method takes the range at its nameplate, not the ${loc(REF.rangeTable)} demand.` },
      { value: c.count * c.kw, mistake: 'kilo_conversion', message: 'That is still in kW. Multiply by 1,000.' },
    ])
    if (c.count === 1) {
      lines.push(calc({
        id: `c_${c.key}`, label: `${cap(c.name)} at nameplate`,
        say: `Nameplate, no table: ${fmt(c.kw)} × 1,000.`,
        why: 'The optional method has its own big demand step (40% after the first 10 kVA), so the range goes in at its full nameplate.',
        ref: REF.optionalDwellingGeneral,
        a: c.kw, op: '×', b: 1000, unit: 'VA', section: 'G', mistakes, checkpoint: std !== undefined,
      }))
    } else {
      lines.push(product({
        id: `c_${c.key}`, label: `${cap(c.name)}s at nameplate`,
        say: `${word(c.count)} at ${fmt(c.kw)} kW: ${c.count} × ${fmt(c.kw)} × 1,000.`,
        ref: REF.optionalDwellingGeneral,
        parts: [c.count, c.kw, 1000], unit: 'VA', section: 'G', mistakes,
      }))
    }
    parts.push(va)
  }
  if (inp.dryer) {
    lines.push(vaLine('dryerName', 'Dryer at nameplate', inp.dryer, 'G', [
      np < DWELLING.dryerMinVA && { value: DWELLING.dryerMinVA, mistake: 'optional_used_standard_rules', message: 'The 5,000 VA dryer floor is a standard-method rule. The optional method uses the nameplate.' },
    ], 'The optional method uses nameplates. The 5,000 VA dryer floor belongs to the standard method.'))
    parts.push(np)
  }
  for (const a of inp.appliances) {
    lines.push(vaLine(`f_${a.key}`, cap(a.name), a.rating, 'G'))
    parts.push(ratingVA(a.rating))
  }
  lines.push(sum({
    id: 'gTotal', label: 'General loads, total',
    say: `Add every general load at its nameplate.${hvacNames.length ? ` Leave ${hvacText} out of this pile.` : ''}`,
    why: 'Heat and A/C are handled on their own, after the 40% step.',
    ref: REF.optionalDwellingGeneral,
    parts, unit: 'VA', section: 'G',
    mistakes: cleanMistakes(N.pile, undefined, [
      stdRules.length > 0 && { value: T({ standardRules: true }).pile, mistake: 'optional_used_standard_rules', message: `The optional method uses nameplates: not ${stdText}.` },
      hvacNames.length > 0 && { value: T({ hvacInPile: true }).pile, mistake: 'optional_hvac_in_pile', message: `Leave ${hvacText} out of this pile. They are added after the 40% step.` },
      { value: N.pile - ln.saVA - ln.laundryVA, mistake: 'missed_small_appliance', message: 'Add the small-appliance and laundry circuits at 1,500 VA each.' },
    ]),
  }))
  lines.push(calc({
    id: 'gRemainder', label: 'The part over 10 kVA',
    say: `The first 10,000 VA counts at 100%. Take it off: ${fmt(N.pile)} − 10,000.`,
    ref: REF.optionalDwellingGeneral,
    a: N.pile, op: '−', b: FIRST, unit: 'VA', section: 'G',
  }))
  lines.push(calc({
    id: 'g40', label: 'That part at 40%',
    say: `Multiply the part over 10,000 VA by 0.4: ${fmt(N.remainder)} × 0.4.`,
    ref: REF.optionalDwellingGeneral,
    a: N.remainder, op: '×', b: REST, unit: 'VA', section: 'G',
    mistakes: cleanMistakes(N.at40, undefined, [
      { value: clean(N.pile * REST), mistake: 'demand_on_whole_load', message: `Take 40% of the part OVER 10,000 VA (${fmt(N.remainder)}), not of the whole pile.` },
      { value: clean(N.remainder * 0.35), mistake: 'optional_used_standard_rules', message: 'The optional method uses 40% (after the first 10 kVA), not the standard 35%.' },
    ]),
    checkpoint: true,
  }))
  lines.push(calc({
    id: 'gDemand', label: 'General loads after demand',
    say: 'Add back the first 10,000 VA at 100%.',
    ref: REF.optionalDwellingGeneral,
    a: N.at40, op: '+', b: FIRST, unit: 'VA', section: 'G',
    mistakes: cleanMistakes(N.general, undefined, [
      { value: N.at40, mistake: 'forgot_first_step', message: 'Add back the first 10,000 VA, which counts at 100%.' },
      { value: clean(N.pile * REST + FIRST), mistake: 'demand_on_whole_load', message: 'The 40% goes only on the part over 10,000 VA.' },
      { value: N.pile, mistake: 'demand_factor_missed', message: 'Apply the demand: the first 10,000 VA at 100%, the rest at 40%.' },
    ]),
    checkpoint: true,
  }))
  sections.push({ id: 'G', label: 'General loads after demand', totalLine: 'gDemand', letter: 'G' })

  // ---- H: heat or A/C, the largest selection ---------------------------------------------------------------
  let hTotal = ''
  const selText: string[] = []
  if (inp.ac) {
    const a = inp.ac
    // Only 120 V is a slip: a 230-V nameplate taken at the nominal 240 V is what Example D2(b) does.
    const acMistakes = cleanMistakes(N.acSel, undefined, [
      { value: a.units * a.amps * 120, mistake: 'wrong_voltage', message: `The A/C runs on ${a.volts} V, not 120 V. Multiply by ${a.volts}.` },
    ])
    if (a.units === 1) {
      lines.push(calc({
        id: 'acVA', label: 'A/C at 100%',
        say: `A/C counts at 100%: ${a.amps} × ${a.volts}.`,
        ref: REF.optionalDwellingHvac,
        a: a.amps, op: '×', b: a.volts, unit: 'VA', section: 'H', mistakes: acMistakes,
      }))
    } else {
      lines.push(product({
        id: 'acVA', label: 'A/C at 100%',
        say: `A/C counts at 100%: ${a.units} units × ${a.amps} A × ${a.volts} V.`,
        ref: REF.optionalDwellingHvac,
        parts: [a.units, a.amps, a.volts], unit: 'VA', section: 'H', mistakes: acMistakes,
      }))
    }
    hTotal = 'acVA'
    selText.push(`A/C ${fmt(N.acSel)}`)
  }
  if (inp.heat) {
    const h = inp.heat
    const many = h.units >= LOAD.optHeatManyUnits
    lines.push(calc({
      id: 'heatVA', label: 'Electric heat, nameplate',
      say: `Change kW to VA: ${fmt(h.kw)} × 1,000.`,
      ref: REF.optionalDwellingHvac,
      a: h.kw, op: '×', b: 1000, unit: 'VA', section: 'H',
      mistakes: [{ value: h.kw, mistake: 'kilo_conversion', message: 'That is still in kW. Multiply by 1,000.' }],
    }))
    lines.push(choose({
      id: 'heatUnits', label: 'Four or more heating units?',
      say: 'How many separately controlled heating units (each with its own thermostat)? Four or more?',
      why: 'Many separately controlled heaters rarely all run at once, so they get a lower percent.',
      ref: REF.optionalDwellingHvac,
      options: [
        opt('few', 'Fewer than four: 65%', many ? `There are ${word(h.units)} separately controlled units: four or more get 40%.` : undefined, many ? 'optional_heat_pct' : undefined),
        opt('many', 'Four or more: 40%', many ? undefined : `${h.units === 1 ? 'One thermostat is one unit' : `${cap(word(h.units))} units is fewer than four`}: 65%.`, many ? undefined : 'optional_heat_pct'),
      ],
      answerId: many ? 'many' : 'few',
      section: 'H', checkpoint: true,
    }))
    const pct = many ? LOAD.optHeatManyUnitsPct : LOAD.optHeatFewUnitsPct
    lines.push(calc({
      id: 'heatSel', label: `Heat at ${pct}%`,
      say: `Multiply the heat by ${fmt(pct / 100)}: ${fmt(N.heatVA)} × ${fmt(pct / 100)}.`,
      ref: REF.optionalDwellingHvac,
      a: N.heatVA, op: '×', b: pct / 100, unit: 'VA', section: 'H',
      mistakes: cleanMistakes(N.heatSel, undefined, [
        { value: N.heatVA, mistake: 'optional_heat_pct', message: `In the optional method the heat is not at 100%: ${pct}% here.` },
        { value: T({ heatPctSwap: true }).heatSel, mistake: 'optional_heat_pct', message: many ? 'Four or more units: 40%, not 65%.' : 'Fewer than four units: 65%, not 40%.' },
      ]),
      checkpoint: true,
    }))
    hTotal = 'heatSel'
    selText.push(`heat ${fmt(N.heatSel)}`)
  }
  if (inp.heatPump) {
    const hp = inp.heatPump
    lines.push(calc({
      id: 'hpVA', label: 'Heat pump compressor at 100%',
      say: `Amps × volts: ${hp.amps} × 240.`,
      ref: REF.optionalDwellingHvac,
      a: hp.amps, op: '×', b: 240, unit: 'VA', section: 'H',
      mistakes: [{ value: hp.amps * 120, mistake: 'wrong_voltage', message: 'The heat pump is a 240-V load: × 240.' }],
    }))
    lines.push(calc({
      id: 'suppVA', label: 'Supplementary heat, nameplate',
      say: `Change kW to VA: ${fmt(hp.suppKW)} × 1,000.`,
      ref: REF.optionalDwellingHvac,
      a: hp.suppKW, op: '×', b: 1000, unit: 'VA', section: 'H',
      mistakes: [{ value: hp.suppKW, mistake: 'kilo_conversion', message: 'That is still in kW. Multiply by 1,000.' }],
    }))
    lines.push(calc({
      id: 'supp65', label: 'Supplementary heat at 65%',
      say: `The backup heat counts at 65%: ${fmt(N.suppVA)} × 0.65.`,
      ref: REF.optionalDwellingHvac,
      a: N.suppVA, op: '×', b: LOAD.optSupplementalPct / 100, unit: 'VA', section: 'H',
      mistakes: cleanMistakes(clean(N.suppVA * 0.65), undefined, [
        { value: N.suppVA, mistake: 'optional_heat_pct', message: 'The supplementary heat counts at 65% with the heat pump.' },
        { value: clean(N.suppVA * 0.4), mistake: 'optional_heat_pct', message: 'With a heat pump the backup heat is 65%, not 40%.' },
      ]),
      checkpoint: true,
    }))
    lines.push(sum({
      id: 'hpSel', label: 'Heat pump heating: compressor + 65% of backup',
      say: 'Add the compressor at 100% and the backup heat at 65%.',
      ref: REF.optionalDwellingHvac,
      parts: [N.hpVA, clean(N.suppVA * 0.65)], unit: 'VA', section: 'H',
      mistakes: cleanMistakes(N.hpSel, undefined, [
        { value: T({ suppAt100: true }).hpSel, mistake: 'optional_heat_pct', message: 'The backup heat goes in at 65%, not 100%.' },
      ]),
    }))
    hTotal = 'hpSel'
    selText.push(`heat pump cooling ${fmt(N.hpVA)}`, `heat pump heating ${fmt(N.hpSel)}`)
  }
  if (N.selections.length > 1) {
    const sorted = [...N.selections].sort((a, b) => b.va - a.va)
    const smaller = sorted[sorted.length - 1]?.va ?? 0
    lines.push(ruleLine({
      id: 'hvac', label: 'Heat or A/C: the largest',
      say: 'Keep only the largest of the heat and A/C choices.',
      why: 'Heat and A/C do not run at the same time. The optional method takes the one choice that gives the biggest load.',
      ref: REF.optionalDwellingHvac,
      value: N.hvac, unit: 'VA',
      expr: `largest of ${selText.join(', ')} → ${fmt(N.hvac)}`,
      mistakes: cleanMistakes(N.hvac, undefined, [
        inp.heat && inp.ac && { value: N.acSel + N.heatSel, mistake: 'added_both_heat_and_ac', message: 'Do not add them. Keep only the largest choice.' },
        inp.heatPump && { value: T({ suppAt100: true }).hpSel, mistake: 'optional_heat_pct', message: 'With the heat pump, the backup heat counts at 65%, not 100%.' },
        { value: smaller, mistake: 'used_smaller_noncoincident', message: 'That is the smaller choice. Keep the LARGEST.' },
        inp.heat && { value: Math.max(N.acSel, N.heatVA), mistake: 'optional_heat_pct', message: 'Compare the heat at its percent (65% or 40%), not at 100%.' },
      ]),
      section: 'H', checkpoint: true,
    }))
    hTotal = 'hvac'
  }
  if (hTotal) sections.push({ id: 'H', label: 'Heat or A/C (the largest choice)', totalLine: hTotal, letter: 'H' })

  // ---- A -------------------------------------------------------------------------------------------------------
  lines.push(sum({
    id: 'total', label: 'Total calculated load',
    say: N.hvac > 0 ? 'Add the general loads after demand and the heat or A/C.' : 'The general loads after demand are the whole load.',
    parts: N.hvac > 0 ? [N.general, N.hvac] : [N.general], unit: 'VA', section: 'A',
    mistakes: cleanMistakes(N.total, undefined, [
      stdRules.length > 0 && { value: T({ standardRules: true }).total, mistake: 'optional_used_standard_rules', message: `Bucket G: the optional method uses nameplates, not ${stdText}.` },
      hvacNames.length > 0 && { value: T({ hvacInPile: true }).total, mistake: 'optional_hvac_in_pile', message: `${capFirst(hvacText)} go${hvacNames.length === 1 && !inp.heatPump ? 'es' : ''} in after the 40% step, not in the pile.` },
      { value: T({ whole40: true }).total, mistake: 'demand_on_whole_load', message: 'Bucket G: the 40% goes only on the part over 10,000 VA.' },
      inp.heat && { value: T({ heat100: true }).total, mistake: 'optional_heat_pct', message: 'Bucket H: the heat goes in at 65% or 40%, not 100%.' },
      inp.heatPump && { value: T({ suppAt100: true }).total, mistake: 'optional_heat_pct', message: 'Bucket H: the heat pump\'s backup heat goes in at 65%, not 100%.' },
      inp.heat && inp.ac && { value: T({ bothHvac: true }).total, mistake: 'added_both_heat_and_ac', message: 'Bucket H: keep only the largest heat or A/C choice.' },
      N.selections.length > 1 && { value: T({ smallerHvac: true }).total, mistake: 'used_smaller_noncoincident', message: 'Bucket H: you kept a smaller choice.' },
    ]),
  }))
  lines.push(ampsLine({
    id: 'amps', label: 'Calculated load in amperes',
    va: N.total, divisor: 240,
    say: `Divide by 240: ${fmt(N.total)} ÷ 240.`,
    section: 'A', checkpoint: true,
    mistakes: [{ value: N.total / 120, mistake: 'wrong_voltage', message: 'A 120/240-V service: divide by 240, not 120.' }],
  }))
  lines.push(sizeLine({ id: 'service', label: 'Minimum service rating', amps: N.amps, min: LOAD.minServiceOneFamilyA, section: 'A' }))
  sections.push({ id: 'A', label: 'Total, amperes and service size', totalLine: 'service', letter: 'A' })

  const std = asStandard(inp)
  const S = (f: OptionalFlags) => optionalNums(inp, f).service
  const wrongs: WrongValue[] = wrongsFrom(N.service, [
    std && { value: standardNums(std).service, mistake: 'optional_used_standard_rules', why: 'This is the standard-method answer. The question asks for the optional method.' },
    stdRules.length > 0 && { value: S({ standardRules: true }), mistake: 'optional_used_standard_rules', why: `Used ${stdText} inside the optional method; it takes nameplates.` },
    { value: S({ by120: true }), mistake: 'wrong_voltage', why: 'Divided by 120 V instead of 240 V.' },
    hvacNames.length > 0 && { value: S({ hvacInPile: true }), mistake: 'optional_hvac_in_pile', why: `Put ${hvacText} in the 10 kVA pile at 100%.` },
    { value: S({ whole40: true }), mistake: 'demand_on_whole_load', why: 'Took 40% of the whole pile instead of only the part over 10 kVA.' },
    inp.heat && { value: S({ heat100: true }), mistake: 'optional_heat_pct', why: 'Took the heat at 100%; the optional method uses 65% or 40%.' },
    inp.heatPump && { value: S({ suppAt100: true }), mistake: 'optional_heat_pct', why: 'Took the heat pump\'s backup heat at 100%; it counts at 65%.' },
    inp.heat && inp.ac && { value: S({ bothHvac: true }), mistake: 'added_both_heat_and_ac', why: 'Added the heat and the A/C; keep only the largest.' },
    { value: S({ noMin100: true }), mistake: 'service_min_100', why: 'Went below the 100 A minimum for a one-family house.' },
  ])

  const { story, givens } = storyOf(inp)
  return {
    recipeId: ID,
    seed,
    story,
    givens,
    ask: 'the minimum service rating by the optional method',
    lines,
    sections,
    answerLine: 'service',
    choices: sizeChoices(N.service, wrongs, rng, LOAD.minServiceOneFamilyA),
    visual: {
      kind: 'load',
      buckets: [
        { label: 'General loads (nameplate)', before: N.pile, after: N.general },
        ...(N.hvac > 0 ? [{ label: 'Heat or A/C (largest choice)', before: N.acSel + N.heatVA + N.hpVA + N.suppVA, after: N.hvac }] : []),
      ],
    },
  }
}

function generate(seed: number): ProblemInstance {
  return buildOptional(pickOptional(seed), seed)
}

export const dwellingOptional: Recipe = {
  id: ID,
  family: 'dwelling',
  title: 'House service: optional method',
  blurb: 'Everything at nameplate, 10 kVA at 100% and the rest at 40%, plus the largest heat or A/C choice.',
  topic: 'calculations',
  editions: ['2020'],
  generate,
  card: {
    whenToUse: `The question asks for a one-family service "using the optional method" (or ${loc(REF.optionalDwelling)}).`,
    steps: [
      { label: 'G: general loads', how: '3 VA × ft², 1,500 per small-appliance and laundry circuit, and EVERY appliance at its nameplate (range, ovens, dryer, water heater ...). No heat, no A/C.', ref: REF.optionalDwellingGeneral },
      { label: 'Demand', how: 'Total − 10,000; × 0.4; + 10,000.', ref: REF.optionalDwellingGeneral },
      { label: 'H: the largest choice', how: 'A/C 100%; heat pump 100% + 65% of the backup heat; heat 65% (fewer than four units) or 40% (four or more).', ref: REF.optionalDwellingHvac },
      { label: 'A: amps and service', how: 'Add G and H, ÷ 240, next standard size, never under 100 A.', ref: REF.minServiceDwelling },
    ],
    traps: [
      'Nameplates: no range table, no 5,000 VA dryer floor, no 75% for appliances.',
      'Heat and A/C stay out of the 10 kVA pile.',
      'The 40% goes only on the part over 10,000 VA.',
      'Heat is never at 100% here: 65% or 40% depending on the number of separately controlled units.',
    ],
    formulas: ['General demand = (total − 10,000) × 0.4 + 10,000', 'Amps = (general demand + largest heat or A/C) ÷ 240'],
  },
}
