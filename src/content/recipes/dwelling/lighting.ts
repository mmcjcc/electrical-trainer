/**
 * Slice: the L bucket alone. "A 1,850 square foot house ... What is the demand load for the general
 * lighting, small-appliance and laundry circuits?" Method: 3 VA/ft² (220.14(J), floor area per
 * 220.11) + 1,500 VA per small-appliance circuit (two at least) + 1,500 VA laundry, then Table 220.42:
 * the first 3,000 VA at 100%, the rest (up to 120,000 VA) at 35%. One operation per line.
 */
import { fmt, makeRng, numericChoices, type WrongValue } from '@/calc'
import { DWELLING } from '@/data/tables'
import { REF } from '@/data/refs'
import type { Given, ProblemInstance, Recipe } from '@/shared/types'
import { word } from '../kit'
import { circuitsText, clean, loc, excludedFt2, lightingDemandOf, lightingLines, lightingNums, listJoin, withArticle, wrongsFrom, type LightingIn } from './common'
import { GARAGES, PORCH_FT2 } from './standard'

const ID = 'dwelling-lighting-demand'

export interface LightingSliceIn {
  lighting: LightingIn
  /** Other loads the story mentions that are NOT part of this bucket. */
  others: string[]
}

const OTHER_LOADS = ['a 12-kW range', 'a 5-kW clothes dryer', 'a 4,500-W water heater', 'a 1,200-W dishwasher', '10 kW of electric heat']

function pick(seed: number): LightingSliceIn {
  const rng = makeRng(seed)
  const area = rng.step(900, 4200, 50)
  const excluded: LightingIn['excluded'] = []
  if (rng.chance(0.6)) {
    const g = rng.pick(GARAGES)
    excluded.push({ name: g.name, ft2: rng.pick(g.sizes) })
  }
  if (rng.chance(0.45)) excluded.push({ name: 'open porch', ft2: rng.pick(PORCH_FT2) })
  const saCircuits = rng.chance(0.25) ? 3 : 2
  const saStated = saCircuits > 2 || rng.chance(0.5)
  const others = rng.chance(0.6) ? rng.shuffle(OTHER_LOADS).slice(0, rng.int(2, 3)) : []
  return { lighting: { area, excluded, saCircuits, saStated, laundry: true }, others }
}

export function buildLightingSlice(inp: LightingSliceIn, seed: number): ProblemInstance {
  const rng = makeRng(seed ^ 0x11)
  const li = inp.lighting
  const L = lightingLines(li, 'L')
  const n = L.nums
  const ex = excludedFt2(li)

  const extra = li.excluded.length
    ? `, plus ${listJoin(li.excluded.map((e) => withArticle(`${fmt(e.ft2)}-square-foot ${e.name}`)))}`
    : ''
  const story =
    `A one-family dwelling has ${fmt(li.area)} square feet of living space${extra}. ` +
    (li.saStated ? `It has ${circuitsText(li.saCircuits, li.laundry)}. ` : 'Include the required small-appliance and laundry circuits. ') +
    (inp.others.length ? `The house also has ${listJoin(inp.others)}. ` : '') +
    'Using the standard method, what is the demand load for the general lighting, small-appliance and laundry circuits, in VA?'
  const givens: Given[] = [{ id: 'area', label: 'Living area', value: li.area, unit: 'ft2', phrase: `${fmt(li.area)} square feet` }]
  if (li.saStated) givens.push({ id: 'sa', label: 'Small-appliance circuits', value: li.saCircuits, unit: 'count', phrase: `${word(li.saCircuits)} 20-A small-appliance circuits` })

  const wrongs: WrongValue[] = wrongsFrom(n.demand, [
    { value: clean(n.total * 0.35), mistake: 'demand_on_whole_load', why: 'This is what you get if you take 35% of the whole load instead of only the part over 3,000 VA.' },
    { value: clean(n.total * 0.35 + 3000), mistake: 'demand_on_whole_load', why: 'Took 35% of the whole load, then added 3,000. Only the part over 3,000 VA gets 35%.' },
    { value: lightingDemandOf(n.glVA), mistake: 'missed_small_appliance', why: 'Left out the small-appliance and laundry circuits.' },
    { value: n.at35, mistake: 'forgot_first_step', why: 'Forgot to add back the first 3,000 VA at 100%.' },
    ex > 0 && { value: lightingNums({ ...li, area: li.area + ex }).demand, mistake: 'floor_area_extra', why: 'Counted the garage or porch as floor area.' },
    { value: n.total, mistake: 'demand_factor_missed', why: `Left out the demand factor: this is the load before ${loc(REF.lightingDemand)}.` },
  ])

  return {
    recipeId: ID,
    seed,
    story,
    givens,
    ask: 'the demand load for general lighting, small-appliance and laundry circuits',
    lines: L.lines,
    sections: [{ id: 'L', label: 'Lighting, small appliances and laundry, after demand', totalLine: L.totalId, letter: 'L' }],
    answerLine: L.totalId,
    choices: numericChoices(n.demand, rng.shuffle(wrongs), rng, { unit: 'VA', decimals: 1 }),
    visual: { kind: 'load', buckets: [{ label: 'Lighting, small appliances, laundry', before: n.total, after: n.demand }] },
  }
}

function generate(seed: number): ProblemInstance {
  return buildLightingSlice(pick(seed), seed)
}

export const dwellingLightingDemand: Recipe = {
  id: ID,
  family: 'dwelling',
  title: 'Lighting, small appliances and laundry',
  blurb: 'The L bucket alone: 3 VA per square foot plus the 1,500 VA circuits, then 3,000 at 100% and the rest at 35%.',
  topic: 'calculations',
  editions: ['2020'],
  generate,
  card: {
    whenToUse: 'The question asks only for the demand load of the general lighting (with or without the small-appliance and laundry circuits) of a dwelling.',
    steps: [
      { label: 'Floor area', how: 'Living space only: no garage, no open porch, no unfinished space.', ref: REF.floorArea },
      { label: 'General lighting', how: 'Square feet × 3 VA.', ref: REF.dwellingLighting },
      { label: 'Small-appliance circuits', how: '1,500 VA each, two at least.', ref: REF.smallAppliance },
      { label: 'Laundry', how: '1,500 VA.', ref: REF.laundry },
      { label: 'Demand', how: 'Total − 3,000; × 0.35; + 3,000.', ref: REF.lightingDemand },
    ],
    traps: [
      'The 35% goes only on the part over 3,000 VA.',
      'Add the 1,500 VA circuits BEFORE the demand factor, not after.',
      'Do not forget to add the first 3,000 VA back.',
      'Garages and open porches are not floor area.',
    ],
    formulas: [`Demand = (3 × ft² + ${fmt(DWELLING.smallApplianceVA)} × circuits + 1,500 − 3,000) × 0.35 + 3,000`],
  },
}
