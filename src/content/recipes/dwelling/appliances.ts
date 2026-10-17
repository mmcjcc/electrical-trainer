/**
 * Slice: fastened-in-place appliances (2020 220.53). "A house has a 4.5-kW water heater, a 1,200-W
 * dishwasher, a 1/2-hp disposer ... What is the demand load for the fastened-in-place appliances?"
 * Method: each appliance in VA (kW × 1,000, or amps × volts), add them, and take 75% when there are
 * four or more. Ranges and other cooking units, dryers, space heating and A/C are left out (the story
 * names some of them as distractors). Every appliance generated is 1/4 hp or 500 W or more.
 */
import { calc, choose, fmt, makeRng, numericChoices, sum, type WrongValue } from '@/calc'
import { DWELLING } from '@/data/tables'
import { REF } from '@/data/refs'
import { LOAD } from '@/data/loadExtra'
import type { Given, ProblemInstance, Recipe, WorkLine } from '@/shared/types'
import { cleanMistakes, opt, word } from '../kit'
import { pickAppliances } from './catalog'
import { appliancePhrase, clean, listJoin, ratingVA, vaLine, withArticle, wrongsFrom, type Appliance } from './common'

const ID = 'dwelling-appliances'

/** Loads that are NOT fastened-in-place appliances for 220.53, with their VA (for the "counted it" slip). */
const EXCLUDED = [
  { text: 'a 12-kW range', va: 12000 },
  { text: 'a 5-kW clothes dryer', va: 5000 },
  { text: 'a 240-V air conditioner rated 20 A', va: 4800 },
  { text: 'an 8-kW electric furnace', va: 8000 },
  { text: 'a 3-kW wall-mounted oven', va: 3000 },
]

export interface AppliancesIn {
  appliances: Appliance[]
  /** Indexes into EXCLUDED: the distractors the story mentions. */
  others: number[]
}

function pick(seed: number): AppliancesIn {
  const rng = makeRng(seed)
  const n = rng.pick([2, 3, 3, 4, 4, 5, 5, 6])
  const others = rng.shuffle([0, 1, 2, 3, 4]).slice(0, rng.int(1, 3))
  return { appliances: pickAppliances(rng, n), others }
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function buildAppliances(inp: AppliancesIn, seed: number): ProblemInstance {
  const rng = makeRng(seed ^ 0x55)
  const apps = inp.appliances
  const n = apps.length
  const four = n >= LOAD.appliance75MinCount
  const total = clean(apps.reduce((s, a) => s + ratingVA(a.rating), 0))
  const demand = four ? clean(total * 0.75) : total
  const others = inp.others.map((i) => EXCLUDED[i]).filter((x): x is (typeof EXCLUDED)[number] => !!x)
  const othersVA = others.reduce((s, o) => s + o.va, 0)
  const withOthers = total + othersVA
  const withOthersDemand = n + others.length >= LOAD.appliance75MinCount ? clean(withOthers * 0.75) : withOthers

  const story =
    `A one-family dwelling has these fastened-in-place appliances: ${listJoin(apps.map((a) => withArticle(appliancePhrase(a))))}. ` +
    `It also has ${listJoin(others.map((o) => o.text))}. ` +
    'Using the standard method, what is the demand load for the fastened-in-place appliances, in VA?'
  const givens: Given[] = apps.map((a) => {
    const r = a.rating
    return { id: a.key, label: cap(a.name), value: r.kind === 'kW' ? r.kw : r.kind === 'W' ? r.w : r.amps, unit: r.kind === 'kW' ? 'kW' : r.kind === 'W' ? 'W' : 'A', phrase: appliancePhrase(a) }
  })

  const lines: WorkLine[] = apps.map((a) => vaLine(`f_${a.key}`, cap(a.name), a.rating))
  lines.push(sum({
    id: 'fSum', label: 'Fastened-in-place appliances, total',
    say: `Add the ${word(n)} appliances. Leave out the ${others.length === 1 ? 'other load' : 'other loads'}: they have their own rules.`,
    why: 'Ranges and other cooking units, dryers, space heating and A/C are left out of this rule.',
    ref: REF.fixedAppliances,
    parts: apps.map((a) => ratingVA(a.rating)), unit: 'VA',
    mistakes: cleanMistakes(total, undefined, [
      !four && { value: clean(total * 0.75), mistake: 'appliance_75_misused', message: `There are only ${word(n)}. Fewer than four stay at 100%.` },
      { value: withOthers, mistake: 'appliance_excluded_counted', message: `Leave out ${listJoin(others.map((o) => o.text.replace(/^an? /, 'the ')))}: they are not fastened-in-place appliances for this rule.` },
    ]),
  }))
  const countSlip = !four && n + others.length >= LOAD.appliance75MinCount ? 'appliance_excluded_counted' : 'appliance_75_misused'
  lines.push(choose({
    id: 'fFour', label: 'Four or more?',
    say: 'Count only the fastened-in-place appliances. Are there four or more?',
    why: 'With four or more, they will not all run at once, so the code lets you take 75% of their total.',
    ref: REF.fixedAppliances,
    options: [
      opt('yes', 'Four or more: multiply by 0.75',
        four ? undefined : `Only ${word(n)} count. ${cap(listJoin(others.map((o) => o.text.replace(/^an? /, 'the '))))} ${others.length === 1 ? 'does' : 'do'} not count toward the four.`,
        four ? undefined : countSlip),
      opt('no', 'Fewer than four: count them at 100%',
        four ? `There are ${word(n)} fastened-in-place appliances. Four or more get 75%.` : undefined,
        four ? 'appliance_75_misused' : undefined),
    ],
    answerId: four ? 'yes' : 'no',
    checkpoint: true,
  }))
  if (four) {
    lines.push(calc({
      id: 'fDemand', label: 'Fastened-in-place appliances at 75%',
      say: `Multiply the total by 0.75: ${fmt(total)} × 0.75.`,
      ref: REF.fixedAppliances,
      a: total, op: '×', b: DWELLING.appliancePct4OrMore / 100, unit: 'VA',
      mistakes: cleanMistakes(demand, undefined, [
        { value: total, mistake: 'appliance_75_misused', message: `There are ${word(n)}: four or more are counted at 75%.` },
        { value: withOthersDemand, mistake: 'appliance_excluded_counted', message: 'Only the fastened-in-place appliances go into this 75%.' },
      ]),
      checkpoint: true,
    }))
  }

  const wrongs: WrongValue[] = wrongsFrom(demand, [
    { value: four ? total : clean(total * 0.75), mistake: 'appliance_75_misused', why: four ? 'Left four or more appliances at 100%; they get 75%.' : 'Took 75% of fewer than four appliances.' },
    { value: withOthersDemand, mistake: 'appliance_excluded_counted', why: 'Counted the range, dryer, heat or A/C as fastened-in-place appliances.' },
    { value: withOthers, mistake: 'appliance_excluded_counted', why: 'Added in the loads that have their own rules, at 100%.' },
  ])

  return {
    recipeId: ID,
    seed,
    story,
    givens,
    ask: 'the demand load for the fastened-in-place appliances, in VA',
    lines,
    answerLine: four ? 'fDemand' : 'fSum',
    choices: numericChoices(demand, rng.shuffle(wrongs), rng, { unit: 'VA', decimals: 1 }),
    visual: { kind: 'load', buckets: [{ label: 'Fastened-in-place appliances', before: total, after: demand }] },
  }
}

function generate(seed: number): ProblemInstance {
  return buildAppliances(pick(seed), seed)
}

export const dwellingAppliances: Recipe = {
  id: ID,
  family: 'dwelling',
  title: 'Fastened-in-place appliances: the 75% rule',
  blurb: 'Add the water heater, dishwasher, disposer and the like; four or more get 75%.',
  topic: 'calculations',
  editions: ['2020'],
  generate,
  card: {
    whenToUse: 'The question lists a dwelling’s fixed appliances and asks for their demand load.',
    steps: [
      { label: 'Each in VA', how: 'kW × 1,000; amps × volts; watts count as VA.' },
      { label: 'Add them', how: 'Only fastened-in-place appliances: not the range, dryer, heat or A/C.', ref: REF.fixedAppliances },
      { label: 'Four or more?', how: 'Yes: × 0.75. No: 100%.', ref: REF.fixedAppliances },
    ],
    traps: [
      'The range, ovens, cooktops, dryer, space heat and A/C never count toward the four.',
      'Fewer than four: no 75%.',
      'A 240-V nameplate in amps: × 240, not × 120.',
    ],
    formulas: ['Four or more: demand = total × 0.75'],
  },
}
