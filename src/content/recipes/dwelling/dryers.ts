/**
 * Slice: household dryers on one feeder or service (220.54, Table 220.54). "A 16-unit building has a
 * 5.5-kW dryer in each unit. What is the dryer demand load?" Method: each dryer at 5,000 VA or its
 * nameplate, whichever is larger; times the number of dryers; times the Table 220.54 percent for that
 * number (1 to 4: 100%; 12 to 23: 47% less 1% per dryer over 11; 24 to 42: 35% less 0.5% per dryer
 * over 23; 43 and over: 25%).
 */
import { calc, fmt, given, lookup, makeRng, numericChoices, type WrongValue } from '@/calc'
import { dryerDemandPct, DWELLING } from '@/data/tables'
import { REF } from '@/data/refs'
import type { ProblemInstance, Recipe, WorkLine } from '@/shared/types'
import { cleanMistakes } from '../kit'
import { DRYER_RATINGS } from './catalog'
import { appliancePhrase, clean, dryerLines, loc, ratingVA, withArticle, wrongsFrom, type Rating } from './common'

const ID = 'dwelling-dryers'

export interface DryersIn {
  n: number
  rating: Rating
}

export function dryersNums(inp: DryersIn, f: { nameplate?: boolean; floorOnly?: boolean; pctOf?: number; noDemand?: boolean } = {}): { each: number; connected: number; pct: number; demand: number } {
  const np = ratingVA(inp.rating)
  const each = f.nameplate ? np : f.floorOnly ? DWELLING.dryerMinVA : Math.max(DWELLING.dryerMinVA, np)
  const connected = clean(inp.n * each)
  const pct = f.noDemand ? 100 : dryerDemandPct(f.pctOf ?? inp.n)
  return { each, connected, pct, demand: clean((connected * pct) / 100) }
}

function pick(seed: number): DryersIn {
  const rng = makeRng(seed)
  const r = rng.next()
  const n = r < 0.1 ? rng.int(2, 4) : r < 0.55 ? rng.int(5, 11) : r < 0.85 ? rng.int(12, 23) : rng.int(24, 42)
  return { n, rating: rng.pick(DRYER_RATINGS) }
}

/** The Table 220.54 rule for a count, in words (for the lookup line). */
function pctRule(n: number): string {
  if (n <= 4) return '1 to 4 dryers: 100%.'
  if (n <= 11) return `Read the row for ${n} dryers.`
  if (n <= 23) return `12 to 23 dryers: 47% less 1% for each dryer over 11. ${n} − 11 = ${n - 11}, so 47 − ${n - 11}.`
  if (n <= 42) return `24 to 42 dryers: 35% less 0.5% for each dryer over 23. ${n} − 23 = ${n - 23}; ${n - 23} × 0.5 = ${fmt((n - 23) * 0.5)}, so 35 − ${fmt((n - 23) * 0.5)}.`
  return '43 and over: 25%.'
}

export function buildDryers(inp: DryersIn, seed: number): ProblemInstance {
  const rng = makeRng(seed ^ 0x44)
  const N = dryersNums(inp)
  const np = ratingVA(inp.rating)
  const lines: WorkLine[] = []
  const phrase = appliancePhrase({ key: 'dryer', name: 'clothes dryer', motor: false, rating: inp.rating })
  const story =
    `A ${inp.n}-unit apartment building is served at 120/240 V, single-phase. It has ${withArticle(phrase)} in each unit. ` +
    'Using the standard method, what is the demand load for the dryers on the service, in VA?'

  lines.push(given({ id: 'n', label: 'Number of dryers', say: 'Write down how many dryers there are.', value: inp.n, unit: 'count' }))
  const D = dryerLines(inp.rating, undefined, { name: 'name', demand: 'each' })
  lines.push(...D.lines)
  lines.push(calc({
    id: 'connected', label: 'All the dryers',
    say: `Multiply one dryer by the number of dryers: ${fmt(N.each)} × ${inp.n}.`,
    a: N.each, op: '×', b: inp.n, unit: 'VA',
    mistakes: cleanMistakes(N.connected, undefined, [
      np < DWELLING.dryerMinVA && { value: clean(np * inp.n), mistake: 'dryer_minimum', message: 'Each dryer counts at least 5,000 VA. Use 5,000, not the smaller nameplate.' },
      np > DWELLING.dryerMinVA && { value: DWELLING.dryerMinVA * inp.n, mistake: 'dryer_nameplate_larger', message: `The nameplate (${fmt(np)} VA) is more than 5,000 VA, so use the nameplate.` },
    ]),
  }))
  lines.push(lookup({
    id: 'pct', label: `Demand factor for ${inp.n} dryers`,
    say: `${loc(REF.dryerTable)}: ${pctRule(inp.n)}`,
    why: 'Many dryers on one service will not all run at once, so the table lets you count a part of them.',
    ref: REF.dryerTable,
    value: N.pct, unit: 'pct',
    mistakes: cleanMistakes(N.pct, { rel: 0.001 }, [
      N.pct !== 100 && { value: 100, mistake: 'demand_factor_missed', message: `Five or more dryers get a demand factor. Read the row for ${inp.n} in ${loc(REF.dryerTable)}.` },
      inp.n > 1 && { value: dryerDemandPct(inp.n - 1), mistake: 'wrong_table_row', message: `That is the row for ${inp.n - 1} dryers. Use the row for ${inp.n}.` },
      { value: dryerDemandPct(inp.n + 1), mistake: 'wrong_table_row', message: `That is the row for ${inp.n + 1} dryers. Use the row for ${inp.n}.` },
    ]),
    checkpoint: true,
  }))
  let answerLine = 'connected'
  if (N.pct !== 100) {
    lines.push(calc({
      id: 'demand', label: 'Dryer demand load',
      say: `Multiply by the percent as a decimal: ${fmt(N.connected)} × ${fmt(N.pct / 100)}.`,
      ref: REF.dryerTable,
      a: N.connected, op: '×', b: N.pct / 100, unit: 'VA',
      mistakes: cleanMistakes(N.demand, undefined, [
        { value: N.connected, mistake: 'demand_factor_missed', message: `Apply the ${fmt(N.pct)}% from ${loc(REF.dryerTable)}.` },
        np < DWELLING.dryerMinVA && { value: dryersNums(inp, { nameplate: true }).demand, mistake: 'dryer_minimum', message: 'Each dryer counts at least 5,000 VA.' },
        np > DWELLING.dryerMinVA && { value: dryersNums(inp, { floorOnly: true }).demand, mistake: 'dryer_nameplate_larger', message: 'Use the nameplate when it is more than 5,000 VA.' },
      ]),
      checkpoint: true,
    }))
    answerLine = 'demand'
  }

  const wrongs: WrongValue[] = wrongsFrom(N.demand, [
    N.pct !== 100 && { value: N.connected, mistake: 'demand_factor_missed', why: `Left out the ${loc(REF.dryerTable)} percent.` },
    np < DWELLING.dryerMinVA && { value: dryersNums(inp, { nameplate: true }).demand, mistake: 'dryer_minimum', why: 'Used the nameplate under 5,000 VA.' },
    np > DWELLING.dryerMinVA && { value: dryersNums(inp, { floorOnly: true }).demand, mistake: 'dryer_nameplate_larger', why: 'Used 5,000 VA though the nameplate is bigger.' },
    inp.n > 1 && { value: dryersNums(inp, { pctOf: inp.n - 1 }).demand, mistake: 'wrong_table_row', why: `Read the row for ${inp.n - 1} dryers.` },
    { value: dryersNums(inp, { pctOf: inp.n + 1 }).demand, mistake: 'wrong_table_row', why: `Read the row for ${inp.n + 1} dryers.` },
  ])

  return {
    recipeId: ID,
    seed,
    story,
    givens: [
      { id: 'n', label: 'Number of dryers', value: inp.n, unit: 'count', phrase: `${inp.n}-unit` },
      { id: 'rating', label: 'Dryer nameplate', value: inp.rating.kind === 'kW' ? inp.rating.kw : np, unit: inp.rating.kind === 'kW' ? 'kW' : 'W', phrase },
    ],
    ask: 'the demand load for the dryers, in VA',
    lines,
    answerLine,
    choices: numericChoices(N.demand, rng.shuffle(wrongs), rng, { unit: 'VA', decimals: 1 }),
    visual: { kind: 'load', buckets: [{ label: `${inp.n} dryers`, before: clean(np * inp.n), after: N.demand }] },
  }
}

function generate(seed: number): ProblemInstance {
  return buildDryers(pick(seed), seed)
}

export const dwellingDryers: Recipe = {
  id: ID,
  family: 'dwelling',
  title: 'Dryers in a building',
  blurb: `Each dryer at 5,000 VA or its nameplate, then the ${loc(REF.dryerTable)} percent for the number of dryers.`,
  topic: 'calculations',
  editions: ['2020'],
  generate,
  card: {
    whenToUse: 'The question gives a number of household dryers (an apartment building) and asks for their demand load.',
    steps: [
      { label: 'One dryer', how: '5,000 VA or the nameplate, whichever is larger.', ref: REF.dryers },
      { label: 'All of them', how: 'Times the number of dryers.', ref: REF.dryers },
      { label: 'Percent', how: 'The table row for that number of dryers.', ref: REF.dryerTable },
      { label: 'Demand', how: 'Total × the percent as a decimal.', ref: REF.dryerTable },
    ],
    traps: [
      'A dryer under 5,000 VA still counts as 5,000 VA.',
      'One to four dryers: 100%. The table only cuts in at five.',
      'From 12 dryers up the table gives a rule, not a number: do the subtraction.',
    ],
    formulas: ['Demand = number × (5,000 or nameplate) × percent'],
  },
}
