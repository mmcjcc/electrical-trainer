/**
 * Slice: several household ranges on one feeder or service (Table 220.55). "A 20-unit building has a
 * range in each unit: 12 rated 10 kW and 8 rated 14 kW. What is the demand load for the ranges?"
 *   Equal ratings up to 12 kW: Column C for the number of ranges.
 *   Equal ratings over 12 kW: Column C for the count, + 5% per kW (or major fraction) over 12 (Note 1).
 *   Unequal ratings (Note 2): count every range under 12 kW as 12 kW, add, divide by the number of
 *   ranges, then Note 1 on the average (Annex D Example D6 method).
 * Counts stay at 40 or fewer; every range is over 8¾ kW; the kW over 12 is kept clear of a half.
 */
import { fmt, given, lookup, makeRng, numericChoices, sum, calc, type WrongValue } from '@/calc'
import { rangeColumnC } from '@/data/tables'
import { REF } from '@/data/refs'
import { LOAD, REF_LOAD } from '@/data/loadExtra'
import type { Given, ProblemInstance, Recipe, WorkLine } from '@/shared/types'
import { cleanMistakes, product } from '../kit'
import { clean, clearFraction, listJoin, loc, note1Lines, note1Steps, note1StepsWrong, over12Line, withArticle, wrongsFrom } from './common'

const ID = 'dwelling-ranges-multi'

export interface RangeGroup {
  count: number
  kw: number
}

export interface RangesMultiIn {
  groups: RangeGroup[]
}

export interface RangesMultiNums {
  n: number
  equal: boolean
  /** kW each group counts for (Note 2: under 12 kW counts as 12). */
  counted: number[]
  sumKW: number
  /** The rating Note 1 is applied to: the equal rating, or the average. */
  rating: number
  over: boolean
  colC: number
  steps: number
  pct: number
  demand: number
}

export function rangesNums(inp: RangesMultiIn, f: { no12?: boolean; noNote1?: boolean; wrongSteps?: boolean } = {}): RangesMultiNums {
  const n = inp.groups.reduce((s, g) => s + g.count, 0)
  const equal = inp.groups.length === 1
  const counted = inp.groups.map((g) => g.count * (f.no12 ? g.kw : Math.max(LOAD.rangeColCMaxKW, g.kw)))
  const sumKW = clean(counted.reduce((s, v) => s + v, 0))
  const rating = equal ? (inp.groups[0]?.kw ?? 0) : clean(sumKW / n)
  const over = rating > LOAD.rangeColCMaxKW + 1e-9
  const colC = rangeColumnC(n)
  const excess = over ? clean(rating - LOAD.rangeColCMaxKW) : 0
  const steps = !over || f.noNote1 ? 0 : f.wrongSteps ? note1StepsWrong(excess) : note1Steps(excess)
  const pct = steps * LOAD.rangeNote1PctPerKW
  return { n, equal, counted, sumKW, rating, over, colC, steps, pct, demand: clean(colC * (1 + pct / 100)) }
}

const UNDER = [9, 10, 11]
const OVER = [13, 14, 15, 16, 17, 18]
const ANY_EQUAL = [9, 10, 11, 11.6, 12, 12.8, 13, 13.6, 14, 14.8, 15, 16, 16.4, 17, 18]

function pick(seed: number): RangesMultiIn {
  const rng = makeRng(seed)
  for (let tries = 0; tries < 300; tries++) {
    const kind = rng.next()
    let groups: RangeGroup[]
    if (kind < 0.55) {
      const n = rng.chance(0.75) ? rng.int(2, 25) : rng.int(26, 40)
      groups = [{ count: n, kw: rng.pick(ANY_EQUAL) }]
    } else {
      const a = rng.int(2, 20)
      const b = rng.int(2, 20)
      groups = [{ count: a, kw: rng.pick(UNDER) }, { count: b, kw: rng.pick(OVER) }]
      if (rng.chance(0.3)) groups.push({ count: rng.int(2, 8), kw: rng.pick([12, ...OVER]) })
      if (new Set(groups.map((g) => g.kw)).size !== groups.length) continue
    }
    const nums = rangesNums({ groups })
    if (nums.n > 40) continue
    if (nums.over && !clearFraction(nums.rating - LOAD.rangeColCMaxKW)) continue
    if (!nums.equal && !nums.over) continue
    return { groups }
  }
  return { groups: [{ count: 12, kw: 10 }, { count: 8, kw: 15 }] }
}

export function buildRangesMulti(inp: RangesMultiIn, seed: number): ProblemInstance {
  const rng = makeRng(seed ^ 0x33)
  const N = rangesNums(inp)
  const lines: WorkLine[] = []
  const nameplateTotal = clean(inp.groups.reduce((s, g) => s + g.count * g.kw, 0))

  const story = N.equal
    ? `A ${N.n}-unit apartment building has ${withArticle(`${fmt(inp.groups[0]?.kw ?? 0)}-kW`)} electric range in each unit. ` +
      'Using the standard method, what is the demand load for the ranges on the service, in kW?'
    : `A ${N.n}-unit apartment building has one electric range in each unit: ` +
      `${listJoin(inp.groups.map((g) => `${g.count} rated ${fmt(g.kw)} kW`))}. ` +
      'Using the standard method, what is the demand load for the ranges on the service, in kW?'
  const givens: Given[] = [{ id: 'n', label: 'Number of ranges', value: N.n, unit: 'count', phrase: `${N.n}-unit` }]

  const colCMistakes = (base: number) => cleanMistakes(base, { rel: 0.001 }, [
    { value: 8 * N.n, mistake: 'range_per_range', message: `Column C already covers all ${N.n} ranges together: read the row for ${N.n}, do not multiply 8 kW by ${N.n}.` },
    { value: nameplateTotal, mistake: 'range_nameplate', message: `That is the total nameplate. Household ranges go through ${loc(REF.rangeTable)}, Column C.` },
    N.n > 1 && { value: rangeColumnC(N.n - 1), mistake: 'wrong_table_row', message: `That is the row for ${N.n - 1} ranges. Read the row for ${N.n}.` },
    N.n < 60 && { value: rangeColumnC(N.n + 1), mistake: 'wrong_table_row', message: `That is the row for ${N.n + 1} ranges. Read the row for ${N.n}.` },
  ])

  if (N.equal) {
    const kw = inp.groups[0]?.kw ?? 0
    lines.push(given({ id: 'n', label: 'Number of ranges', say: 'Write down how many ranges there are.', value: N.n, unit: 'count' }))
    lines.push(given({ id: 'kw', label: 'Rating of each range', say: 'Write down the rating of one range.', value: kw, unit: 'kW' }))
    givens.push({ id: 'kw', label: 'Range rating', value: kw, unit: 'kW', phrase: `${fmt(kw)}-kW` })
    lines.push(over12Line('over12', `each ${fmt(kw)}-kW range`, N.over))
  } else {
    inp.groups.forEach((g, i) => {
      const counts12 = g.kw < LOAD.rangeColCMaxKW
      givens.push({ id: `g${i}`, label: `Ranges rated ${fmt(g.kw)} kW`, value: g.count, unit: 'count', phrase: `${g.count} rated ${fmt(g.kw)} kW` })
      lines.push(product({
        id: `g${i}`, label: `${g.count} ranges at ${fmt(g.kw)} kW${counts12 ? ' (count as 12 kW)' : ''}`,
        say: counts12
          ? `Note 2: a range under 12 kW counts as 12 kW. Multiply ${g.count} × 12.`
          : `Multiply the number of ranges by their rating: ${g.count} × ${fmt(g.kw)}.`,
        why: 'Note 2 averages unequal ranges, but no range may count for less than 12 kW in that average.',
        ref: REF_LOAD.rangeNote2,
        parts: [g.count, Math.max(LOAD.rangeColCMaxKW, g.kw)], unit: 'kW',
        mistakes: counts12 ? [{ value: clean(g.count * g.kw), mistake: 'range_note2_average', message: `These ranges are under 12 kW. For the Note 2 average each one counts as 12 kW: ${g.count} × 12.` }] : [],
        checkpoint: counts12,
      }))
    })
    lines.push(sum({
      id: 'sumKW', label: 'Total kW for the average',
      say: 'Add the groups.',
      ref: REF_LOAD.rangeNote2,
      parts: N.counted, unit: 'kW',
      mistakes: cleanMistakes(N.sumKW, undefined, [
        { value: nameplateTotal, mistake: 'range_note2_average', message: 'Use 12 kW for every range under 12 kW, then add.' },
      ]),
    }))
    lines.push(given({ id: 'n', label: 'Number of ranges', say: 'Write down how many ranges there are in all.', value: N.n, unit: 'count' }))
    lines.push(calc({
      id: 'avg', label: 'Average rating',
      say: `Divide the total by the number of ranges: ${fmt(N.sumKW)} ÷ ${N.n}.`,
      ref: REF_LOAD.rangeNote2,
      a: N.sumKW, op: '÷', b: N.n, unit: 'kW', decimals: 2, tol: { abs: 0.01 },
      mistakes: cleanMistakes(N.rating, undefined, [
        { value: clean(nameplateTotal / N.n), mistake: 'range_note2_average', message: 'That average uses the nameplates. Count each range under 12 kW as 12 kW first.' },
      ]),
    }))
    lines.push(over12Line('over12', `the ${fmt(N.rating, 2)}-kW average`, N.over))
  }
  lines.push(lookup({
    id: 'colC', label: `Column C, ${N.n} ranges`,
    say: `${loc(REF.rangeTable)}, Column C: find the row for ${N.n} ranges and read the kW.`,
    why: 'Column C gives the demand for the whole group at once. The more ranges, the smaller the share each one adds.',
    ref: REF.rangeTable,
    value: N.colC, unit: 'kW',
    mistakes: colCMistakes(N.colC),
    checkpoint: true,
  }))
  let answerLine = 'colC'
  if (N.over) {
    const nl = note1Lines({
      rating: N.rating, base: N.colC, ratingWord: N.equal ? 'range rating' : 'average',
      ids: { excess: 'excess', steps: 'steps', pct: 'pct', demand: 'demand' },
      demandMistakes: [
        { value: clean(8 * N.n * (1 + N.pct / 100)), mistake: 'range_per_range', message: `Start from the Column C value for ${N.n} ranges (${fmt(N.colC)} kW), not 8 kW × ${N.n}.` },
        !N.equal && { value: rangesNums(inp, { no12: true }).demand, mistake: 'range_note2_average', message: 'Average with every range under 12 kW counted as 12 kW.' },
      ],
    })
    lines.push(...nl.lines)
    answerLine = 'demand'
  }

  const wrongs: WrongValue[] = wrongsFrom(N.demand, [
    { value: clean(8 * N.n), mistake: 'range_per_range', why: `Multiplied 8 kW by ${N.n}. Column C already gives the demand for all the ranges together.` },
    { value: nameplateTotal, mistake: 'range_nameplate', why: 'Added the nameplates. Household ranges go through Column C.' },
    N.over && N.steps > 0 && { value: N.colC, mistake: 'range_note1', why: 'Missed Note 1: the ranges (or their average) are over 12 kW.' },
    N.over && { value: rangesNums(inp, { wrongSteps: true }).demand, mistake: 'range_major_fraction', why: 'Rounded the kW over 12 the wrong way.' },
    !N.equal && { value: rangesNums(inp, { no12: true }).demand, mistake: 'range_note2_average', why: 'Averaged the nameplates without counting the small ranges as 12 kW.' },
    N.n > 1 && { value: clean(rangeColumnC(N.n - 1) * (1 + N.pct / 100)), mistake: 'wrong_table_row', why: `Read Column C for ${N.n - 1} ranges.` },
  ])

  return {
    recipeId: ID,
    seed,
    story,
    givens,
    ask: 'the demand load for several household ranges, in kW',
    lines,
    answerLine,
    choices: numericChoices(N.demand, rng.shuffle(wrongs), rng, { unit: 'kW', decimals: 2 }),
    visual: { kind: 'load', buckets: [{ label: `${N.n} ranges`, before: clean(nameplateTotal * 1000), after: clean(N.demand * 1000) }] },
  }
}

function generate(seed: number): ProblemInstance {
  return buildRangesMulti(pick(seed), seed)
}

export const dwellingRangesMulti: Recipe = {
  id: ID,
  family: 'dwelling',
  title: 'Several ranges: Column C, Notes 1 and 2',
  blurb: 'A building full of ranges: Column C for the count, 5% per kW over 12, and the Note 2 average when they differ.',
  topic: 'calculations',
  editions: ['2020'],
  generate,
  card: {
    whenToUse: 'The question gives several household ranges (an apartment building) and asks for their demand load.',
    steps: [
      { label: 'Unequal? Count as 12', how: 'Note 2: any range under 12 kW counts as 12 kW. Add them up and divide by the number of ranges.', ref: REF_LOAD.rangeNote2 },
      { label: 'Over 12 kW?', how: 'Compare the rating (or the average) with 12 kW.', ref: REF_LOAD.rangeNote1 },
      { label: 'Column C', how: 'The row for the number of ranges: that is the demand for all of them.', ref: REF.rangeTable },
      { label: 'Note 1', how: '5% more for each kW (or major fraction) over 12.', ref: REF_LOAD.rangeNote1 },
    ],
    traps: [
      'Column C is for the whole group: never multiply it by the number of ranges.',
      'In the Note 2 average, a 10-kW range counts as 12 kW.',
      'Note 1 raises the Column C value, not the nameplates.',
    ],
    formulas: ['Average = (sum of ratings, each at least 12 kW) ÷ number of ranges', 'Demand = Column C × (1 + 0.05 × kW over 12)'],
  },
}
