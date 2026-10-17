/**
 * Slice: the service neutral of a one-family dwelling (220.61, Annex D Example D1(a) method). "What is
 * the neutral load in amperes?" Method: the lighting, small-appliance and laundry demand at 100%;
 * the range demand (Table 220.55) and the dryer demand (220.54) at 70% (220.61(B)(1)); 120-V
 * appliances at 100%; 240-V-only loads (water heater, A/C, 240-V heat) add nothing; ÷ 240 V; the
 * over-200 A step (70% of the part above 200 A) only when reached, which a one-family neutral is not.
 * No 120-V motors are generated, so the D1(b) "25% of the largest motor on the neutral" never arises,
 * and fewer than four fastened-in-place appliances, so no 75% question arises on the neutral.
 */
import { calc, choose, fmt, makeRng, numericChoices, roundAmps220, sum, type WrongValue } from '@/calc'
import { DWELLING } from '@/data/tables'
import { REF } from '@/data/refs'
import { LOAD, REF_LOAD } from '@/data/loadExtra'
import type { Given, ProblemInstance, Recipe, Section, WorkLine } from '@/shared/types'
import { cleanMistakes, opt, word } from '../kit'
import { DRYER_RATINGS, HEAT_KW, AC_AMPS, RANGE_KW_SINGLE } from './catalog'
import {
  ampsLine, appliancePhrase, circuitsText, clean, clearFraction, dryerLines, dryerVA, lightingLines, lightingNums, listJoin, loc, rangeLines, ratingVA, singleRangeNums, vaLine, withArticle, wrongsFrom,
  type LightingIn, type Rating,
} from './common'
import { GARAGES, PORCH_FT2 } from './standard'

const ID = 'dwelling-neutral'

export interface NeutralIn {
  lighting: LightingIn
  rangeKW: number
  dryer: Rating
  /** 120-V dishwasher (counts at 100% on the neutral). */
  dishwasher?: Rating
  /** 240-V-only loads: distractors that add nothing to the neutral. */
  waterHeater?: Rating
  heatKW?: number
  acAmps?: number
}

export interface NeutralFlags {
  no70?: boolean
  with240?: boolean
  all70?: boolean
  by120?: boolean
  noLightingDemand?: boolean
}

export function neutralNums(inp: NeutralIn, f: NeutralFlags = {}): { L: number; R: number; rN: number; D: number; dN: number; dw: number; va240: number; total: number; amps: number } {
  const ln = lightingNums(inp.lighting)
  const L = f.noLightingDemand ? ln.total : ln.demand
  const R = singleRangeNums(inp.rangeKW).demandVA
  const D = dryerVA(ratingVA(inp.dryer))
  const k = LOAD.neutralCookingDryerPct / 100
  const rN = f.no70 ? R : clean(R * k)
  const dN = f.no70 ? D : clean(D * k)
  const dw = inp.dishwasher ? ratingVA(inp.dishwasher) : 0
  const heat = inp.heatKW ? inp.heatKW * 1000 : 0
  const ac = inp.acAmps ? inp.acAmps * 240 : 0
  const va240 = (inp.waterHeater ? ratingVA(inp.waterHeater) : 0) + Math.max(heat, ac)
  let total = clean(L + rN + dN + dw + (f.with240 ? va240 : 0))
  if (f.all70) total = clean((L + dw) * k + rN + dN)
  const amps = total / (f.by120 ? 120 : 240)
  return { L, R, rN, D, dN, dw, va240, total, amps }
}

function pick(seed: number): NeutralIn {
  const rng = makeRng(seed)
  for (let tries = 0; tries < 200; tries++) {
    const area = rng.step(1000, 3400, 50)
    const excluded: LightingIn['excluded'] = []
    if (rng.chance(0.4)) {
      const g = rng.pick(GARAGES)
      excluded.push({ name: g.name, ft2: rng.pick(g.sizes) })
    }
    if (rng.chance(0.3)) excluded.push({ name: 'open porch', ft2: rng.pick(PORCH_FT2) })
    const saCircuits = rng.chance(0.2) ? 3 : 2
    const rangeKW = rng.pick(RANGE_KW_SINGLE)
    if (rangeKW > LOAD.rangeColCMaxKW && !clearFraction(rangeKW - LOAD.rangeColCMaxKW)) continue
    const inp: NeutralIn = {
      lighting: { area, excluded, saCircuits, saStated: saCircuits > 2 || rng.chance(0.5), laundry: true },
      rangeKW,
      dryer: rng.pick(DRYER_RATINGS),
      dishwasher: rng.chance(0.6) ? rng.pick<Rating>([{ kind: 'W', w: 1200 }, { kind: 'W', w: 1500 }]) : undefined,
      waterHeater: rng.chance(0.7) ? rng.pick<Rating>([{ kind: 'kW', kw: 4.5 }, { kind: 'W', w: 5000 }]) : undefined,
      heatKW: rng.chance(0.5) ? rng.pick(HEAT_KW) : undefined,
      acAmps: rng.chance(0.6) ? rng.pick(AC_AMPS) : undefined,
    }
    // Keep the neutral clearly below the 200 A step (a one-family neutral never reaches it here).
    if (neutralNums(inp).amps >= LOAD.neutralStepAmps) continue
    return inp
  }
  return { lighting: { area: 1500, excluded: [], saCircuits: 2, saStated: true, laundry: true }, rangeKW: 12, dryer: { kind: 'kW', kw: 5.5 } }
}

export function buildNeutral(inp: NeutralIn, seed: number): ProblemInstance {
  const rng = makeRng(seed ^ 0x66)
  const N = neutralNums(inp)
  const li = inp.lighting
  const lines: WorkLine[] = []
  const sections: Section[] = []
  const k = LOAD.neutralCookingDryerPct / 100
  const loads240: string[] = []
  if (inp.waterHeater) loads240.push('water heater')
  if (inp.heatKW) loads240.push('electric heat')
  if (inp.acAmps) loads240.push('air conditioner')

  // ---- L at 100% ---------------------------------------------------------------------------------
  const L = lightingLines(li, 'L')
  lines.push(...L.lines)
  sections.push({ id: 'L', label: 'Lighting, small appliances and laundry (100% on the neutral)', totalLine: L.totalId, letter: 'L' })

  // ---- R at 70% ------------------------------------------------------------------------------------
  const R = rangeLines(inp.rangeKW, 'R', true)
  lines.push(...R.lines)
  lines.push(calc({
    id: 'rangeN', label: 'Range on the neutral (70%)',
    say: `The range demand may count at 70% on the neutral: ${fmt(N.R)} × 0.7.`,
    why: 'Much of a range load is 240-V heating elements that put no current on the neutral.',
    ref: REF_LOAD.neutralReduction,
    a: N.R, op: '×', b: k, unit: 'VA', section: 'R',
    mistakes: cleanMistakes(N.rN, undefined, [
      { value: N.R, mistake: 'neutral_no_70', message: 'On the neutral, the range demand may be taken at 70%: × 0.7.' },
      { value: clean(inp.rangeKW * 1000 * k), mistake: 'range_nameplate', message: `Take 70% of the range DEMAND (${fmt(N.R)} VA), not of the nameplate.` },
    ]),
    checkpoint: true,
  }))
  sections.push({ id: 'R', label: 'Range on the neutral', totalLine: 'rangeN', letter: 'R' })

  // ---- D at 70% ------------------------------------------------------------------------------------
  lines.push(...dryerLines(inp.dryer, 'D').lines)
  lines.push(calc({
    id: 'dryerN', label: 'Dryer on the neutral (70%)',
    say: `The dryer may count at 70% on the neutral: ${fmt(N.D)} × 0.7.`,
    ref: REF_LOAD.neutralReduction,
    a: N.D, op: '×', b: k, unit: 'VA', section: 'D',
    mistakes: cleanMistakes(N.dN, undefined, [
      { value: N.D, mistake: 'neutral_no_70', message: 'On the neutral, the dryer may be taken at 70%: × 0.7.' },
      ratingVA(inp.dryer) < DWELLING.dryerMinVA && { value: clean(ratingVA(inp.dryer) * k), mistake: 'dryer_minimum', message: 'Start from the dryer load of 5,000 VA, not the smaller nameplate.' },
    ]),
    checkpoint: true,
  }))
  sections.push({ id: 'D', label: 'Dryer on the neutral', totalLine: 'dryerN', letter: 'D' })

  // ---- 120-V appliance at 100% -------------------------------------------------------------------------
  if (inp.dishwasher) {
    lines.push(vaLine('dw', 'Dishwasher (120 V, 100% on the neutral)', inp.dishwasher, 'F', [
      { value: clean(ratingVA(inp.dishwasher) * k), mistake: 'neutral_70_on_all', message: 'Only the range and dryer get 70%. A 120-V appliance counts in full on the neutral.' },
    ], 'A 120-V appliance runs from one hot to the neutral, so all of its current is on the neutral.'))
    sections.push({ id: 'F', label: '120-V appliances', totalLine: 'dw', letter: 'F' })
  }

  // ---- N: total and amperes ----------------------------------------------------------------------------
  if (loads240.length) {
    lines.push(choose({
      id: 'n240', label: '240-V loads on the neutral?',
      say: `The ${listJoin(loads240)} run${loads240.length === 1 ? 's' : ''} on 240 V only. What do they add to the neutral?`,
      why: 'A 240-V load is connected hot to hot. Its current never goes through the neutral.',
      ref: REF.neutralLoad,
      options: [
        opt('zero', 'Nothing: a 240-V load puts no current on the neutral'),
        opt('full', 'Their full VA', 'A 240-V load runs between the two hots: it adds nothing to the neutral.', 'neutral_240_loads'),
        opt('seventy', '70% of their VA', 'The 70% is for the range and dryer. A 240-V-only load adds nothing at all to the neutral.', 'neutral_240_loads'),
      ],
      answerId: 'zero',
      section: 'N', checkpoint: true,
    }))
  }
  const parts = [N.L, N.rN, N.dN, ...(inp.dishwasher ? [N.dw] : [])]
  const T = (f: NeutralFlags) => neutralNums(inp, f).total
  lines.push(sum({
    id: 'nTotal', label: 'Neutral load',
    say: 'Add the neutral loads.',
    ref: REF.neutralLoad,
    parts, unit: 'VA', section: 'N',
    mistakes: cleanMistakes(N.total, undefined, [
      N.va240 > 0 && { value: T({ with240: true }), mistake: 'neutral_240_loads', message: `Leave out the ${listJoin(loads240)}: 240-V loads put nothing on the neutral.` },
      { value: T({ no70: true }), mistake: 'neutral_no_70', message: 'The range and dryer may be counted at 70% on the neutral.' },
      { value: T({ all70: true }), mistake: 'neutral_70_on_all', message: 'Only the range and dryer get 70%. The lighting and 120-V loads stay at 100%.' },
      { value: T({ noLightingDemand: true }), mistake: 'demand_factor_missed', message: 'Use the lighting load after the demand factor (3,000 at 100%, the rest at 35%).' },
    ]),
  }))
  lines.push(ampsLine({
    id: 'nAmps', label: 'Neutral load in amperes',
    va: N.total, divisor: 240,
    say: `Divide by 240, as for the service: ${fmt(N.total)} ÷ 240.`,
    why: `The neutral VA is divided by the same 240 V as the service load. ${fmt(N.total)} ÷ 240 = ${fmt(N.amps, 2)} A, and ${loc(REF.fractionsOfAmpere)} lets you round to ${roundAmps220(N.amps)} A. Either is right.`,
    section: 'N', checkpoint: true,
    mistakes: [{ value: N.total / 120, mistake: 'wrong_voltage', message: 'Divide by 240, the same as the service load, not by 120.' }],
  }))
  lines.push(choose({
    id: 'over200', label: 'Over 200 A?',
    say: 'Is the neutral load over 200 A? Only the part above 200 A could be taken at 70%.',
    ref: REF_LOAD.neutralOver200,
    options: [
      opt('no', 'Not over 200 A: no further cut'),
      opt('yes', 'Over 200 A: take 70% of the part above 200 A', `${roundAmps220(N.amps)} A is not over 200 A, so there is nothing to cut.`, 'neutral_70_on_all'),
    ],
    answerId: 'no',
    section: 'N',
  }))
  sections.push({ id: 'N', label: 'Neutral total and amperes', totalLine: 'nAmps', letter: 'N' })

  // ---- story -------------------------------------------------------------------------------------------
  const loads: string[] = [withArticle(`${fmt(inp.rangeKW)}-kW range`), withArticle(appliancePhrase({ key: 'd', name: 'clothes dryer', motor: false, rating: inp.dryer }))]
  const givens: Given[] = [
    { id: 'area', label: 'Living area', value: li.area, unit: 'ft2', phrase: `${fmt(li.area)} square feet` },
    { id: 'range', label: 'Range', value: inp.rangeKW, unit: 'kW', phrase: `${fmt(inp.rangeKW)}-kW range` },
    { id: 'dryer', label: 'Dryer', value: ratingVA(inp.dryer), unit: 'VA', phrase: appliancePhrase({ key: 'd', name: 'clothes dryer', motor: false, rating: inp.dryer }) },
  ]
  if (inp.dishwasher) {
    const ph = `${appliancePhrase({ key: 'dw', name: 'dishwasher', motor: false, rating: inp.dishwasher })} (120 V)`
    loads.push(`a ${ph}`)
    givens.push({ id: 'dw', label: 'Dishwasher', value: ratingVA(inp.dishwasher), unit: 'VA', phrase: ph })
  }
  if (inp.waterHeater) loads.push(`${withArticle(appliancePhrase({ key: 'wh', name: 'water heater', motor: false, rating: inp.waterHeater }))} (240 V)`)
  if (inp.heatKW) loads.push(`${fmt(inp.heatKW)} kW of 240-V electric heat`)
  if (inp.acAmps) loads.push(`a 240-V air conditioner rated ${inp.acAmps} A`)
  if (li.saStated) givens.push({ id: 'sa', label: 'Small-appliance circuits', value: li.saCircuits, unit: 'count', phrase: `${word(li.saCircuits)} 20-A small-appliance circuits` })
  const extra = li.excluded.length ? `, plus ${listJoin(li.excluded.map((e) => withArticle(`${fmt(e.ft2)}-square-foot ${e.name}`)))}` : ''
  const story =
    `A one-family dwelling has ${fmt(li.area)} square feet of living space${extra}, served at 120/240 V. ` +
    (li.saStated ? `It has ${circuitsText(li.saCircuits, li.laundry)}. ` : 'Include the required small-appliance and laundry circuits. ') +
    `The other loads are ${listJoin(loads)}. ` +
    'What is the calculated load on the service neutral, in amperes?'

  const A = (f: NeutralFlags) => roundAmps220(neutralNums(inp, f).amps)
  const right = roundAmps220(N.amps)
  const wrongs: WrongValue[] = wrongsFrom(right, [
    { value: A({ no70: true }), mistake: 'neutral_no_70', why: 'Left the range and dryer at 100%; on the neutral they may be taken at 70%.' },
    N.va240 > 0 && { value: A({ with240: true }), mistake: 'neutral_240_loads', why: 'Put the 240-V loads on the neutral; they add nothing there.' },
    { value: A({ all70: true }), mistake: 'neutral_70_on_all', why: 'Took 70% of everything; only the range and dryer get 70%.' },
    { value: A({ by120: true }), mistake: 'wrong_voltage', why: 'Divided by 120 V instead of 240 V.' },
    { value: A({ noLightingDemand: true }), mistake: 'demand_factor_missed', why: 'Used the lighting load before the demand factor.' },
  ])

  return {
    recipeId: ID,
    seed,
    story,
    givens,
    ask: 'the service neutral load in amperes',
    lines,
    sections,
    answerLine: 'nAmps',
    choices: numericChoices(right, rng.shuffle(wrongs), rng, { unit: 'A', decimals: 0 }),
    visual: {
      kind: 'load',
      buckets: [
        { label: 'Lighting, small appliances, laundry', before: N.L, after: N.L },
        { label: 'Range (70%)', before: N.R, after: N.rN },
        { label: 'Dryer (70%)', before: N.D, after: N.dN },
        ...(inp.dishwasher ? [{ label: 'Dishwasher (120 V)', before: N.dw, after: N.dw }] : []),
        ...(N.va240 > 0 ? [{ label: '240-V loads', before: N.va240, after: 0 }] : []),
      ],
    },
  }
}

function generate(seed: number): ProblemInstance {
  return buildNeutral(pick(seed), seed)
}

export const dwellingNeutral: Recipe = {
  id: ID,
  family: 'dwelling',
  title: 'House service neutral',
  blurb: 'The neutral: lighting at 100%, range and dryer at 70%, and 240-V loads add nothing.',
  topic: 'calculations',
  editions: ['2020'],
  generate,
  card: {
    whenToUse: 'The question asks for the neutral load (or neutral size) of a house service.',
    steps: [
      { label: 'Lighting', how: 'The L bucket after demand, at 100%.', ref: REF.lightingDemand },
      { label: 'Range', how: 'Its demand (Column C, Note 1) × 0.7.', ref: REF_LOAD.neutralReduction },
      { label: 'Dryer', how: '5,000 VA or nameplate, × 0.7.', ref: REF_LOAD.neutralReduction },
      { label: '120-V appliances', how: 'At 100%.', ref: REF.neutralLoad },
      { label: '240-V loads', how: 'Water heater, A/C, 240-V heat: nothing on the neutral.', ref: REF.neutralLoad },
      { label: 'Amperes', how: '÷ 240. Over 200 A only: the part above 200 A at 70%.', ref: REF_LOAD.neutralOver200 },
    ],
    traps: [
      'A 240-V load has no neutral current: leave it out completely.',
      'The 70% is only for the range (or oven and cooktop) and the dryer.',
      'Divide by 240, the same as the service.',
    ],
    formulas: ['Neutral VA = lighting demand + 0.7 × (range + dryer) + 120-V loads'],
  },
}
