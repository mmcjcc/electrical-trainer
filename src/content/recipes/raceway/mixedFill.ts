/**
 * Raceway fill, conductors of different sizes or insulations: "What minimum trade size EMT is required
 * for three 3/0 AWG THHN and one 4 AWG THHN?" Method (Chapter 9): add up the areas of all the wires
 * (Table 5, each size and insulation, × how many), pick the fill percent (Table 1: over two wires 40%;
 * Note 4: a nipple 24 in. or shorter 60%), then go down that column of Table 4 for the raceway type to
 * the first trade size whose area is at least the total ("big enough" rounds up). Note 7 (the .8 rule)
 * is only for same-size conductors and plays no part here.
 */
import { calc, choose, fmt, labelChoices, lookup, makeRng, sum, type WrongLabel } from '@/calc'
import {
  AWG_SIZES, conductorArea, CONDUCTOR_AREA, FILL_PCT, RACEWAY_NAME, racewayArea, racewaySizes, racewayTotal, sizeLabel,
  TABLE4_TOL, tradeLabel, type ConductorSize, type FillCase, type Insulation, type RacewayType, type TradeSize,
} from '@/data/tables'
import { REF } from '@/data/refs'
import type { MistakeValue, ProblemInstance, Recipe, Section, WorkLine } from '@/shared/types'
import { cleanMistakes, opt, ruleLine, word } from '../kit'

const ID = 'raceway-mixed'

const RACEWAYS: RacewayType[] = ['EMT', 'EMT', 'EMT', 'RMC', 'IMC', 'PVC40', 'PVC40', 'PVC80', 'FMC']
const SHORT: Record<RacewayType, string> = {
  EMT: 'EMT', IMC: 'IMC', RMC: 'rigid metal conduit (RMC)', PVC40: 'Schedule 40 PVC conduit',
  PVC80: 'Schedule 80 PVC conduit', FMC: 'flexible metal conduit (FMC)',
}
const FEEDER_SIZES: ConductorSize[] = ['8', '6', '4', '3', '2', '1', '1/0', '2/0', '3/0', '4/0', '250', '350', '500']
/**
 * A realistic equipment grounding conductor to pull with each feeder size (roughly Table 250.122 for the
 * breaker such a feeder would have). Only for a believable story: the fill does not depend on why.
 */
const EGC_WITH: Partial<Record<ConductorSize, ConductorSize>> = {
  '8': '10', '6': '8', '4': '8', '3': '8', '2': '6', '1': '6', '1/0': '6', '2/0': '6', '3/0': '6', '4/0': '4', '250': '4', '350': '3', '500': '3',
}

export interface Group {
  count: number
  size: ConductorSize
  ins: Insulation
  /** Shown in the story ("equipment grounding conductor"). */
  role?: string
}

export interface MixedParams {
  raceway: RacewayType
  groups: Group[]
  nipple: boolean
}

/** The total area of all the wires (Table 5 values × counts). */
export function totalArea(groups: Group[]): number {
  return groups.reduce((s, g) => s + g.count * conductorArea(g.ins, g.size), 0)
}

/** The smallest trade size whose `fill` column is at least `need` (undefined if none). */
export function smallestRaceway(type: RacewayType, fill: FillCase | 'total', need: number, shift = 0): TradeSize | undefined {
  return racewaySizes(type).find((t) => (fill === 'total' ? racewayTotal(type, t) : racewayArea(type, t, fill)) + shift >= need - 1e-9)
}

function pickGroups(rng: ReturnType<typeof makeRng>): Group[] {
  const kind = rng.pick(['feeder', 'feeder', 'branch', 'mixedIns'] as const)
  if (kind === 'feeder') {
    const i = rng.int(0, FEEDER_SIZES.length - 1)
    const size = FEEDER_SIZES[i]!
    const ins: Insulation = rng.pick(['THHN', 'THHN', 'XHHW', 'THW'])
    const egc = EGC_WITH[size] as ConductorSize
    return [
      { count: rng.pick([3, 4]), size, ins },
      { count: 1, size: egc, ins: 'THHN', role: 'equipment grounding conductor' },
    ]
  }
  if (kind === 'branch') {
    return [
      { count: rng.int(3, 9), size: '12', ins: 'THHN' },
      { count: rng.int(2, 6), size: '10', ins: 'THHN' },
      ...(rng.chance(0.5) ? [{ count: 1, size: '10' as ConductorSize, ins: 'THW' as Insulation, role: 'equipment grounding conductor' }] : []),
    ]
  }
  const a: ConductorSize = rng.pick(['14', '12', '10', '8'])
  const b: ConductorSize = rng.pick(['8', '6', '4', '3', '2'])
  return [
    { count: rng.int(2, 6), size: a, ins: rng.pick(['THW', 'TW', 'XHHW']) },
    { count: rng.int(2, 4), size: b, ins: 'THHN' },
  ]
}

function pick(seed: number): MixedParams {
  const rng = makeRng(seed)
  for (let tries = 0; tries < 400; tries++) {
    const raceway = rng.pick(RACEWAYS)
    const groups = pickGroups(rng)
    if (groups.some((g) => CONDUCTOR_AREA[g.ins][g.size] === undefined)) continue
    if (new Set(groups.map((g) => `${g.size}${g.ins}`)).size !== groups.length) continue
    const nipple = rng.chance(0.15)
    const fill: FillCase = nipple ? 'nipple' : 'over2'
    const need = totalArea(groups)
    const t = smallestRaceway(raceway, fill, need)
    if (!t) continue
    // Stable against a printing that rounds Table 4's third decimal the other way.
    if (smallestRaceway(raceway, fill, need, 0.001) !== t || smallestRaceway(raceway, fill, need, -0.001) !== t) continue
    // Not the smallest size listed (keep a "too small" option), and not a size that only just fits by luck.
    if (racewaySizes(raceway).indexOf(t) < 1) continue
    return { raceway, groups, nipple }
  }
  return { raceway: 'EMT', groups: [{ count: 3, size: '3/0', ins: 'THHN' }, { count: 1, size: '4', ins: 'THHN' }], nipple: false }
}

function groupText(g: Group): string {
  return `${word(g.count)} ${sizeLabel(g.size)} ${g.ins}${g.role ? ` ${g.role}` : ''}`
}

const FILL_LABEL: Record<FillCase, string> = {
  one: '53% (one conductor)', two: '31% (two conductors)', over2: '40% (over two conductors)', nipple: '60% (a nipple 24 in. or shorter)',
}

export function buildMixed(p: MixedParams, seed: number): ProblemInstance {
  const { raceway, groups, nipple } = p
  const fill: FillCase = nipple ? 'nipple' : 'over2'
  const need = totalArea(groups)
  const trade = smallestRaceway(raceway, fill, need) as TradeSize
  const sizes = racewaySizes(raceway)
  const ti = sizes.indexOf(trade)
  const allowed = racewayArea(raceway, trade, fill)
  const list = groups.map(groupText)
  const listText = list.length === 2 ? `${list[0]} and ${list[1]}` : `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`
  const what = nipple ? `${SHORT[raceway]} nipple 18 in. long` : SHORT[raceway]
  const story = `What is the minimum trade size of ${what} for these copper conductors: ${listText}?`

  const S_WIRES = 'wires'
  const S_RACEWAY = 'raceway'
  const lines: WorkLine[] = []
  const groupTotals: number[] = []

  groups.forEach((g, i) => {
    const area = conductorArea(g.ins, g.size)
    const otherIns: Insulation = g.ins === 'THHN' ? 'THW' : 'THHN'
    const otherArea = CONDUCTOR_AREA[otherIns][g.size]
    const si = AWG_SIZES.indexOf(g.size)
    const neighbour = AWG_SIZES[si + 1]
    const mistakes: MistakeValue[] = cleanMistakes(area, { rel: 0.001 }, [
      otherArea !== undefined && { value: otherArea, mistake: 'wrong_insulation_column', message: `That is the ${otherIns} row. The question says ${g.ins}.` },
      neighbour !== undefined && CONDUCTOR_AREA[g.ins][neighbour] !== undefined && { value: CONDUCTOR_AREA[g.ins][neighbour] as number, mistake: 'unknown', message: `That is the ${sizeLabel(neighbour)} line. Slide to ${sizeLabel(g.size)}.` },
    ])
    lines.push(lookup({
      id: `area${i + 1}`, label: `Area of one ${sizeLabel(g.size)} ${g.ins}`,
      say: `Chapter 9, Table 5: type ${g.ins}, the ${sizeLabel(g.size)} line, the area in square inches.`,
      ref: REF.ch9Table5,
      value: area, unit: 'in2',
      mistakes,
      section: S_WIRES, checkpoint: i === 0,
    }))
    if (g.count > 1) {
      lines.push(calc({
        id: `group${i + 1}`, label: `${word(g.count).replace(/^\w/, (c) => c.toUpperCase())} ${sizeLabel(g.size)} ${g.ins}`,
        say: `Multiply by how many there are: ${g.count}.`,
        a: g.count, op: '×', b: area, unit: 'in2', decimals: 4,
        section: S_WIRES,
      }))
    }
    groupTotals.push(g.count * area)
  })
  lines.push(sum({
    id: 'total', label: 'Total area of all the wires',
    say: 'Add the areas of every group, the ground included.',
    why: 'Every wire in the pipe takes room, the equipment grounding conductor too.',
    parts: groupTotals, unit: 'in2', decimals: 4,
    mistakes: cleanMistakes(need, undefined, groups.map((g, i) => ({
      value: need - groupTotals[i]!, mistake: 'fill_missed_wires', message: `You left out the ${groupText(g)}. Every wire counts.`,
    }))),
    section: S_WIRES,
  }))

  lines.push(choose({
    id: 'fill', label: 'Which fill percent?',
    say: nipple ? 'This is a nipple 18 in. long, with more than two wires.' : `There are ${groups.reduce((s, g) => s + g.count, 0)} wires in a full-length run.`,
    why: 'Over two wires: 40%, so they can be pulled without damage. A nipple 24 in. or shorter is not pulled through bends: 60%.',
    ref: nipple ? REF.ch9Note4Nipple : REF.ch9Table1,
    options: (['one', 'two', 'over2', 'nipple'] as FillCase[]).map((f) => opt(f, FILL_LABEL[f],
      f === fill ? undefined
        : f === 'one' ? '53% is for a single wire.'
        : f === 'two' ? '31% is for exactly two wires.'
        : f === 'nipple' ? 'Only a nipple 24 in. or shorter gets 60%. This is a full run.'
        : 'This is a nipple 24 in. or shorter: 60% (Chapter 9, Note 4).',
      f === fill ? undefined : 'wrong_fill_percent')),
    answerId: fill,
    section: S_RACEWAY, checkpoint: true,
  }))
  const below = sizes[ti - 1]
  const byTotal = smallestRaceway(raceway, 'total', need)
  lines.push(ruleLine({
    id: 'allowed', kind: 'lookup', label: `First ${raceway} size that is big enough`,
    say: `Chapter 9, Table 4, the ${RACEWAY_NAME[raceway]} section, the ${FILL_PCT[fill]}% column: go down to the first area of ${fmt(need, 4)} in² or more.`,
    why: 'Big enough means round UP to the next trade size.',
    ref: REF.ch9Table4,
    value: allowed, unit: 'in2', tol: TABLE4_TOL,
    expr: `${fmt(need, 4)} in² → ${fmt(allowed, 3)} in² (${tradeLabel(trade)})`,
    mistakes: cleanMistakes(allowed, TABLE4_TOL, [
      below && { value: racewayArea(raceway, below, fill), mistake: 'rounded_wrong_way', message: `${fmt(racewayArea(raceway, below, fill), 3)} in² is less than the ${fmt(need, 4)} in² of wire. Go down one more row.` },
      byTotal && { value: racewayTotal(raceway, byTotal), mistake: 'used_100pct_area', message: `That is the total (100%) column. Use the ${FILL_PCT[fill]}% column.` },
      nipple && { value: racewayArea(raceway, smallestRaceway(raceway, 'over2', need) ?? trade, 'over2'), mistake: 'wrong_fill_percent', message: 'That is the 40% column. A nipple 24 in. or shorter may be filled to 60%.' },
    ]),
    section: S_RACEWAY, checkpoint: true,
  }))
  const window = sizes.slice(Math.max(0, ti - 2), ti + 2)
  lines.push(choose({
    id: 'trade', label: 'Minimum trade size',
    say: `Which trade size is that row?`,
    ref: REF.ch9Table4,
    options: window.map((t) => t === trade
      ? opt(t, tradeLabel(t))
      : sizes.indexOf(t) < ti
        ? opt(t, tradeLabel(t), `${tradeLabel(t)} allows only ${fmt(racewayArea(raceway, t, fill), 3)} in²; the wires need ${fmt(need, 4)} in².`, 'rounded_wrong_way')
        : opt(t, tradeLabel(t), `${tradeLabel(t)} works, but ${tradeLabel(trade)} is smaller and still big enough.`)),
    answerId: trade,
    section: S_RACEWAY,
  }))

  const sections: Section[] = [
    { id: S_WIRES, label: 'Area of the wires', totalLine: 'total', letter: 'W' },
    { id: S_RACEWAY, label: 'Raceway size', totalLine: 'trade', letter: 'R' },
  ]

  const wrongs: WrongLabel[] = []
  const add = (t: TradeSize | undefined, mistake: string, why: string) => {
    if (t && t !== trade) wrongs.push({ label: tradeLabel(t), mistake, why })
  }
  add(byTotal, 'used_100pct_area', 'Compared with the total (100%) area instead of the fill column.')
  const smallestGroup = groupTotals.indexOf(Math.min(...groupTotals))
  add(smallestRaceway(raceway, fill, need - groupTotals[smallestGroup]!), 'fill_missed_wires', `Left out the ${groupText(groups[smallestGroup]!)}.`)
  add(nipple ? smallestRaceway(raceway, 'over2', need) : smallestRaceway(raceway, 'nipple', need), 'wrong_fill_percent', nipple ? 'Used 40%; a short nipple may be filled to 60%.' : 'Used 60%; that is only for a nipple 24 in. or shorter.')
  add(smallestRaceway(raceway, 'one', need), 'wrong_fill_percent', 'Used the 53% column; that is for one wire.')
  add(below, 'rounded_wrong_way', 'One size too small: its fill area is less than the wires need.')

  return {
    recipeId: ID,
    seed,
    story,
    givens: [
      { id: 'raceway', label: 'Raceway', value: 0, unit: 'none', phrase: what },
      ...groups.map((g, i) => ({ id: `group${i + 1}`, label: 'Conductors', value: g.count, unit: 'count' as const, phrase: groupText(g) })),
    ],
    ask: `the minimum trade size of ${SHORT[raceway]}`,
    lines,
    sections,
    answerLine: 'trade',
    choices: labelChoices(tradeLabel(trade), wrongs, sizes.map(tradeLabel)),
    visual: {
      kind: 'raceway', raceway, trade, allowed, wire: need, fillPct: FILL_PCT[fill], mixed: true,
      groups: groups.map((g, i) => ({ count: g.count, size: g.size, ins: g.ins, area: conductorArea(g.ins, g.size), total: groupTotals[i] })),
    },
  }
}

function generate(seed: number): ProblemInstance {
  return buildMixed(pick(seed), seed)
}

export const mixedFill: Recipe = {
  id: ID,
  family: 'raceway',
  title: 'Smallest pipe for a mix of wires',
  blurb: 'Add up every wire’s area, then find the first trade size whose 40% (or 60% nipple) area is big enough.',
  topic: 'calculations',
  editions: ['2020'],
  generate,
  card: {
    whenToUse: 'The question lists wires of different sizes or insulation types and asks for the smallest raceway (or a short nipple).',
    steps: [
      { label: 'Each wire’s area', how: 'Table 5: the insulation type, the size.', ref: REF.ch9Table5 },
      { label: 'Times how many', how: 'Multiply each area by the number of those wires.' },
      { label: 'Total', how: 'Add all the groups, the ground included.' },
      { label: 'Fill percent', how: 'Over two wires 40%; a nipple 24 in. or shorter 60%.', ref: REF.ch9Table1 },
      { label: 'Raceway', how: 'Table 4: your raceway type, the percent column, the first area that is at least the total.', ref: REF.ch9Table4 },
    ],
    traps: [
      'Count the equipment grounding conductor too.',
      'THHN, THW and XHHW are different rows in Table 5.',
      'Use the percent column of Table 4, never the total area.',
      'Round the raceway UP to the next size; the .8 rule does not apply to mixed sizes.',
    ],
    formulas: ['Total wire area = Σ (number × area of one)', 'Pick the first size with allowed area ≥ total'],
  },
}
