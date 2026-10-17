/**
 * Slice: one household range. "What is the demand load for a 13.6-kW household range?" Method (Table
 * 220.55): a range over 8¾ kW goes in Column C, 8 kW for one range up to 12 kW. Over 12 kW, Note 1
 * raises the 8 kW by 5% for each kW, or major fraction of a kW, over 12. Ratings are kept clear of
 * a half kW so the "major fraction" reading cannot change the answer.
 */
import { fmt, makeRng, numericChoices, type WrongValue } from '@/calc'
import { REF } from '@/data/refs'
import { LOAD, REF_LOAD } from '@/data/loadExtra'
import type { ProblemInstance, Recipe } from '@/shared/types'
import { RANGE_KW_SINGLE } from './catalog'
import { clean, clearFraction, loc, note1StepsWrong, rangeLines, withArticle, wrongsFrom } from './common'

const ID = 'dwelling-range'

const SETTINGS = [
  (p: string) => `A one-family dwelling has ${withArticle(p)} electric range.`,
  (p: string) => `A kitchen remodel adds ${withArticle(p)} household electric range.`,
  (p: string) => `An apartment has ${withArticle(p)} electric range on its own feeder.`,
]

export interface RangeSliceIn {
  kw: number
  setting: number
}

function pick(seed: number): RangeSliceIn {
  const rng = makeRng(seed)
  // Weighted toward Note 1, where the slips live.
  const over = RANGE_KW_SINGLE.filter((k) => k > LOAD.rangeColCMaxKW && clearFraction(k - LOAD.rangeColCMaxKW))
  const under = RANGE_KW_SINGLE.filter((k) => k <= LOAD.rangeColCMaxKW)
  const kw = rng.chance(0.7) ? rng.pick(over) : rng.pick(under)
  return { kw, setting: rng.int(0, SETTINGS.length - 1) }
}

export function buildRangeSlice(inp: RangeSliceIn, seed: number): ProblemInstance {
  const rng = makeRng(seed ^ 0x22)
  const R = rangeLines(inp.kw, undefined, false)
  const n = R.nums
  const phrase = `${fmt(inp.kw)}-kW`
  const story = `${(SETTINGS[inp.setting] ?? SETTINGS[0]!)(phrase)} Using the standard method, what is the demand load for the range, in kW?`

  const wrongSteps = n.over ? note1StepsWrong(n.excess) : 0
  const wrongs: WrongValue[] = wrongsFrom(n.demandKW, [
    { value: inp.kw, mistake: 'range_nameplate', why: `Used the nameplate. A household range goes through ${loc(REF.rangeTable)}.` },
    n.over && n.steps > 0 && { value: 8, mistake: 'range_note1', why: 'Missed Note 1: a range over 12 kW gets 5% more for each kW over 12.' },
    n.over && { value: clean(8 * (1 + (wrongSteps * LOAD.rangeNote1PctPerKW) / 100)), mistake: 'range_major_fraction', why: `Rounded the ${fmt(n.excess)} kW over 12 the wrong way.` },
    { value: clean(inp.kw * LOAD.rangeColBOnePct / 100), mistake: 'range_wrong_column', why: 'Took 80% from Column B. A range over 8¾ kW uses Column C.' },
    n.over && n.steps > 0 && { value: clean(inp.kw * (1 + n.pct / 100)), mistake: 'range_nameplate', why: 'Raised the nameplate by Note 1. The 5% steps raise the Column C value (8 kW).' },
    n.over && n.steps > 0 && { value: clean(8 * (n.pct / 100)), mistake: 'range_note1', why: 'That is only the Note 1 increase, not the whole demand.' },
  ])

  return {
    recipeId: ID,
    seed,
    story,
    givens: [{ id: 'range', label: 'Range', value: inp.kw, unit: 'kW', phrase: `${phrase}` }],
    ask: 'the demand load for one household range, in kW',
    lines: R.lines,
    answerLine: R.totalId,
    choices: numericChoices(n.demandKW, rng.shuffle(wrongs), rng, { unit: 'kW', decimals: 2 }),
    visual: { kind: 'load', buckets: [{ label: 'Range', before: clean(inp.kw * 1000), after: n.demandVA }] },
  }
}

function generate(seed: number): ProblemInstance {
  return buildRangeSlice(pick(seed), seed)
}

export const dwellingRange: Recipe = {
  id: ID,
  family: 'dwelling',
  title: 'One range: Column C and Note 1',
  blurb: 'One household range: 8 kW up to 12 kW; above that, 5% more for every kW over 12.',
  topic: 'calculations',
  editions: ['2020'],
  generate,
  card: {
    whenToUse: 'The question asks for the demand load of one household range (over 8¾ kW).',
    steps: [
      { label: 'Over 12 kW?', how: 'Compare the nameplate with 12 kW.', ref: REF_LOAD.rangeNote1 },
      { label: 'Column C', how: 'One range: 8 kW.', ref: REF.rangeTable },
      { label: 'kW over 12', how: 'Nameplate − 12.', ref: REF_LOAD.rangeNote1 },
      { label: 'Count the kW', how: 'Whole kW, plus one for a major fraction; drop a small fraction.', ref: REF_LOAD.rangeNote1 },
      { label: 'Raise Column C', how: '5% per kW counted: 8 × (1 + 0.05 × kW counted).', ref: REF_LOAD.rangeNote1 },
    ],
    traps: [
      'Never the nameplate: a household range always goes through the table.',
      'Up to 12 kW the answer is 8 kW, whatever the nameplate.',
      'Note 1 raises the 8 kW, not the nameplate.',
      '10% more means × 1.10, not × 0.10.',
    ],
    formulas: ['Demand = 8 kW × (1 + 0.05 × kW over 12)'],
  },
}
