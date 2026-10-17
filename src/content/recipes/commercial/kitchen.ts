/**
 * Commercial kitchen equipment (Table 220.56, 2020 NEC). "A restaurant kitchen has a 14-kW range, a
 * 9-kW fryer ... What is the demand load for the kitchen equipment?" Method: add the nameplates of
 * the cooking, dishwashing and water-heating equipment, count the units, take the Table 220.56
 * percent for that count (3: 90%, 4: 80%, 5: 70%, 6 and over: 65%), and never go below the two
 * largest units added together. Ventilating, space-heating and A/C equipment are left out of the
 * table (the story may name an exhaust fan as a distractor).
 */
import { calc, fmt, given, lookup, makeRng, numericChoices, sum, type WrongValue } from '@/calc'
import { kitchenDemandPct } from '@/data/tables'
import { REF } from '@/data/refs'
import type { Given, ProblemInstance, Recipe, WorkLine } from '@/shared/types'
import { cleanMistakes, ruleLine, word } from '../kit'
import { clean, listJoin, loc, withArticle, wrongsFrom } from '../dwelling/common'

const ID = 'commercial-kitchen'

export interface KitchenItem {
  name: string
  kw: number
}

export interface KitchenIn {
  items: KitchenItem[]
  /** A ventilation fan the story names (not part of the table). */
  vent?: KitchenItem
}

const CATALOG: { name: string; kws: number[] }[] = [
  { name: 'range', kws: [10, 12, 15, 18] },
  { name: 'fryer', kws: [6, 9, 12] },
  { name: 'griddle', kws: [5, 7.5, 9] },
  { name: 'convection oven', kws: [6, 8, 11] },
  { name: 'dishwasher booster heater', kws: [9, 12, 18] },
  { name: 'dishwasher', kws: [5, 8] },
  { name: 'steam kettle', kws: [6, 10] },
  { name: 'food warmer', kws: [1.5, 2] },
  { name: 'coffee urn', kws: [3, 4.5] },
  { name: 'water heater', kws: [6, 9, 12] },
  { name: 'broiler', kws: [8, 12] },
]

export function kitchenNums(inp: KitchenIn, f: { withVent?: boolean; pctOf?: number; noFloor?: boolean } = {}): { n: number; total: number; pct: number; demand: number; two: number; result: number } {
  const items = f.withVent && inp.vent ? [...inp.items, inp.vent] : inp.items
  const n = items.length
  const total = clean(items.reduce((s, x) => s + x.kw, 0))
  const pct = kitchenDemandPct(f.pctOf ?? n)
  const demand = clean((total * pct) / 100)
  const sorted = [...inp.items].sort((a, b) => b.kw - a.kw)
  const two = clean((sorted[0]?.kw ?? 0) + (sorted[1]?.kw ?? 0))
  return { n, total, pct, demand, two, result: f.noFloor ? demand : Math.max(demand, two) }
}

function pick(seed: number): KitchenIn {
  const rng = makeRng(seed)
  for (let tries = 0; tries < 300; tries++) {
    const bigTwo = rng.chance(0.3)
    const n = bigTwo ? rng.int(3, 4) : rng.int(3, 10)
    const kinds = rng.shuffle(CATALOG).slice(0, n)
    const items = kinds.map((k, i) => ({
      name: k.name,
      kw: bigTwo && i < 2 ? Math.max(...k.kws) : bigTwo ? Math.min(...k.kws) : rng.pick(k.kws),
    }))
    const inp: KitchenIn = { items, vent: rng.chance(0.35) ? { name: 'kitchen exhaust fan', kw: rng.pick([1.5, 2, 3]) } : undefined }
    const k = kitchenNums(inp)
    // The demand and the two-largest floor must not be close (no rounding argument about which wins).
    if (Math.max(k.demand, k.two) < 1.03 * Math.min(k.demand, k.two)) continue
    return inp
  }
  return { items: [{ name: 'range', kw: 15 }, { name: 'fryer', kw: 12 }, { name: 'coffee urn', kw: 3 }] }
}

export function buildKitchen(inp: KitchenIn, seed: number): ProblemInstance {
  const rng = makeRng(seed ^ 0x56)
  const K = kitchenNums(inp)
  const lines: WorkLine[] = []
  const twoWins = K.two > K.demand
  const sorted = [...inp.items].sort((a, b) => b.kw - a.kw)

  inp.items.forEach((x, i) => {
    lines.push(given({ id: `k${i}`, label: `${x.name.charAt(0).toUpperCase()}${x.name.slice(1)}`, say: 'Write down its nameplate, in kW.', value: x.kw, unit: 'kW' }))
  })
  lines.push(sum({
    id: 'kSum', label: 'Kitchen equipment, total',
    say: inp.vent ? 'Add the kitchen equipment. Leave out the exhaust fan: ventilation is not in this table.' : 'Add the kitchen equipment.',
    ref: REF.kitchenEquipment,
    parts: inp.items.map((x) => x.kw), unit: 'kW',
    mistakes: cleanMistakes(K.total, undefined, [
      inp.vent && { value: clean(K.total + inp.vent.kw), mistake: 'kitchen_counted_hvac', message: 'Leave out the exhaust fan: the kitchen table does not cover ventilating equipment.' },
    ]),
  }))
  lines.push(ruleLine({
    id: 'kCount', label: 'Number of units',
    say: 'Count the pieces of kitchen equipment.',
    ref: REF.kitchenEquipment,
    value: K.n, unit: 'count',
    expr: `${K.n} units`,
    mistakes: inp.vent ? [{ value: K.n + 1, mistake: 'kitchen_counted_hvac', message: 'Do not count the exhaust fan: it is ventilation, not kitchen equipment.' }] : [],
  }))
  const neighbours = [K.n - 1, K.n + 1].filter((m) => m >= 1 && kitchenDemandPct(m) !== K.pct)
  lines.push(lookup({
    id: 'kPct', label: `Demand factor for ${K.n} units`,
    say: `${loc(REF.kitchenEquipment)}: the row for ${K.n} units.`,
    ref: REF.kitchenEquipment,
    value: K.pct, unit: 'pct',
    mistakes: cleanMistakes(K.pct, { rel: 0.001 }, [
      { value: 100, mistake: 'demand_factor_missed', message: `Three or more units get a demand factor. Read the row for ${K.n}.` },
      ...neighbours.map((m) => ({ value: kitchenDemandPct(m), mistake: 'wrong_table_row', message: `That is the row for ${m} units. Use the row for ${K.n}.` })),
    ]),
    checkpoint: true,
  }))
  lines.push(calc({
    id: 'kDemand', label: 'Total at the demand factor',
    say: `${fmt(K.total)} × ${fmt(K.pct / 100)}.`,
    ref: REF.kitchenEquipment,
    a: K.total, op: '×', b: K.pct / 100, unit: 'kW', decimals: 3,
    mistakes: cleanMistakes(K.demand, undefined, [
      { value: K.total, mistake: 'demand_factor_missed', message: `Apply the ${K.pct}% demand factor.` },
      inp.vent && { value: kitchenNums(inp, { withVent: true }).demand, mistake: 'kitchen_counted_hvac', message: 'The exhaust fan is not part of this table.' },
    ]),
  }))
  lines.push(sum({
    id: 'kTwo', label: 'The two largest together',
    say: `Add the two largest units: ${fmt(sorted[0]?.kw ?? 0)} + ${fmt(sorted[1]?.kw ?? 0)}.`,
    why: 'The table has a floor: the demand can never be less than the two biggest units running together.',
    ref: REF.kitchenEquipment,
    parts: [sorted[0]?.kw ?? 0, sorted[1]?.kw ?? 0], unit: 'kW',
  }))
  lines.push(ruleLine({
    id: 'kResult', label: 'Kitchen demand load',
    say: 'Keep the larger: the total at the demand factor, or the two largest together.',
    ref: REF.kitchenEquipment,
    value: K.result, unit: 'kW', decimals: 3, tol: { abs: 0.001 },
    expr: `larger of ${fmt(K.demand)} and ${fmt(K.two)} → ${fmt(K.result)}`,
    mistakes: cleanMistakes(K.result, undefined, [
      twoWins && { value: K.demand, mistake: 'kitchen_two_largest', message: `The two largest together (${fmt(K.two)} kW) are more than ${fmt(K.demand)} kW. The demand is never less than the two largest.` },
      !twoWins && { value: K.two, mistake: 'kitchen_two_largest', message: 'The two largest are only the floor. The total at the demand factor is larger here: keep it.' },
      { value: K.total, mistake: 'demand_factor_missed', message: `Apply the ${K.pct}% demand factor (but never below the two largest).` },
    ]),
    checkpoint: true,
  }))

  const phrases = inp.items.map((x) => `${fmt(x.kw)}-kW ${x.name}`)
  const story =
    `A restaurant kitchen has this electric equipment: ${listJoin(phrases.map((p) => withArticle(p)))}.` +
    (inp.vent ? ` A ${fmt(inp.vent.kw)}-kW ${inp.vent.name} serves the hood.` : '') +
    ' What is the demand load for the kitchen equipment on the feeder, in kW?'
  const givens: Given[] = inp.items.map((x, i) => ({ id: `k${i}`, label: x.name, value: x.kw, unit: 'kW', phrase: phrases[i] ?? '' }))

  const wrongs: WrongValue[] = wrongsFrom(K.result, [
    { value: K.total, mistake: 'demand_factor_missed', why: `Added the nameplates without the ${loc(REF.kitchenEquipment)} demand factor.` },
    twoWins && { value: K.demand, mistake: 'kitchen_two_largest', why: 'Missed the floor: never less than the two largest units together.' },
    !twoWins && { value: K.two, mistake: 'kitchen_two_largest', why: 'Used the two largest; that is only the floor, and the demand is larger.' },
    inp.vent && { value: kitchenNums(inp, { withVent: true }).result, mistake: 'kitchen_counted_hvac', why: 'Counted the exhaust fan as kitchen equipment.' },
    ...neighbours.map((m) => ({ value: Math.max(clean((K.total * kitchenDemandPct(m)) / 100), K.two), mistake: 'wrong_table_row', why: `Used the percent for ${m} units.` })),
  ])

  return {
    recipeId: ID,
    seed,
    story,
    givens,
    ask: 'the demand load for commercial kitchen equipment, in kW',
    lines,
    answerLine: 'kResult',
    choices: numericChoices(K.result, rng.shuffle(wrongs), rng, { unit: 'kW', decimals: 3 }),
    visual: { kind: 'load', buckets: [{ label: `${word(K.n)} kitchen units`, before: clean(K.total * 1000), after: clean(K.result * 1000) }] },
  }
}

function generate(seed: number): ProblemInstance {
  return buildKitchen(pick(seed), seed)
}

export const commercialKitchen: Recipe = {
  id: ID,
  family: 'commercial',
  title: 'Commercial kitchen equipment',
  blurb: 'Add the kitchen equipment, take the percent for the number of units, never less than the two largest.',
  topic: 'calculations',
  editions: ['2020'],
  generate,
  card: {
    whenToUse: 'The question lists the electric equipment of a restaurant or commercial kitchen and asks for its demand load.',
    steps: [
      { label: 'Add', how: 'Add the kitchen equipment nameplates (not exhaust fans, heat or A/C).', ref: REF.kitchenEquipment },
      { label: 'Count', how: 'Count the units.', ref: REF.kitchenEquipment },
      { label: 'Percent', how: '3 units 90%, 4 units 80%, 5 units 70%, 6 or more 65%.', ref: REF.kitchenEquipment },
      { label: 'Floor', how: 'Never less than the two largest units together.', ref: REF.kitchenEquipment },
    ],
    traps: [
      'One or two units: no demand factor.',
      'Check the two largest: with a few big units, they can beat the percent.',
      'Ventilating, heating and A/C equipment are not part of this table.',
    ],
    formulas: ['Demand = larger of (total × percent) and (largest + second largest)'],
  },
}

