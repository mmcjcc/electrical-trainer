/**
 * Shared pieces of the dwelling load-calculation recipes (owned by the load-calculation recipes
 * builder): nameplate ratings and their VA lines, the L bucket (lighting + small-appliance + laundry
 * through Table 220.42), the single-range rules of Table 220.55 (Column C and Note 1), the dryer floor
 * of 220.54, the amps line (220.5(B) rounding accepted both ways) and the service/OCPD line, and the
 * four answer choices for a standard size. 2020 NEC. Pure.
 *
 * Every location comes from REF / REF_LOAD; `loc(ref)` prints it inside a sentence.
 */
import {
  calc, choose, fmt, given, lookup, nextStandardUp, numericChoices, roundAmps220, standardAbove, standardBelow, sum,
  type Rng, type WrongValue,
} from '@/calc'
import { DWELLING } from '@/data/tables'
import { REF } from '@/data/refs'
import { LOAD, REF_LOAD } from '@/data/loadExtra'
import type { AnswerChoice, CodeRef, MistakeValue, WorkLine } from '@/shared/types'
import { cleanMistakes, opt, ruleLine, word } from '../kit'

/** The printed location of a reference, for use inside a sentence ("Table 220.55"). */
export const loc = (r: CodeRef): string => r.loc

/** Mistake lists may hold `false` for "does not apply here". */
export type MaybeMistake = MistakeValue | false | undefined | null

// ---------------------------------------------------------------------------------------------
// Ratings and appliances
// ---------------------------------------------------------------------------------------------

/** A nameplate as a story gives it: kW, W, or amperes at a voltage. */
export type Rating =
  | { kind: 'kW'; kw: number }
  | { kind: 'W'; w: number }
  | { kind: 'A'; amps: number; volts: 120 | 240 }

/** Drops float noise (4.5 × 1,000 stays 4,500). */
export const clean = (v: number): number => Math.round(v * 1e6) / 1e6

export function ratingVA(r: Rating): number {
  switch (r.kind) {
    case 'kW': return clean(r.kw * 1000)
    case 'W': return r.w
    case 'A': return clean(r.amps * r.volts)
  }
}

/** A fastened-in-place (or other named) appliance from the story. */
export interface Appliance {
  /** Unique within a problem; used in line ids. */
  key: string
  name: string
  rating: Rating
  /** Motor-driven (counts for "25% of the largest motor"). */
  motor: boolean
  /** Horsepower as printed ("1/2"); motor appliances state it so the 1/4 hp threshold is plain. */
  hp?: string
}

/** The words of the story that state the appliance: "4.5-kW water heater", "1/2-hp ... rated 8 A at 120 V". */
export function appliancePhrase(a: Appliance): string {
  const r = a.rating
  if (r.kind === 'kW') return `${fmt(r.kw)}-kW ${a.name}`
  if (r.kind === 'W') return `${fmt(r.w)}-W ${a.name}`
  return `${a.hp ? `${a.hp}-hp ` : ''}${a.name} rated ${fmt(r.amps)} A at ${r.volts} V`
}

/** "a 4.5-kW ..." / "an 8-kW ..." / "an 11-kW ..." / "an 18,000-W ...". */
export function withArticle(phrase: string): string {
  const an = /^8/.test(phrase) || /^1[18](?:[^\d,]|$)/.test(phrase) || /^1[18],\d{3}(?:[^\d,]|$)/.test(phrase) || /^[aeiou]/i.test(phrase)
  return `${an ? 'an' : 'a'} ${phrase}`
}

/** "a, b and c". */
export function listJoin(items: string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

/**
 * The VA of one nameplate, as one line: W is read as VA (a given), kW × 1,000, or amps × volts.
 * `extra` adds line-specific mistakes after the conversion slips.
 */
export function vaLine(id: string, label: string, r: Rating, section?: string, extra: MaybeMistake[] = [], why?: string): WorkLine {
  const va = ratingVA(r)
  if (r.kind === 'W') {
    return given({
      id, label, why,
      say: `Read the nameplate from the question. ${fmt(r.w)} W counts as ${fmt(r.w)} VA.`,
      value: r.w, unit: 'VA', section,
      mistakes: cleanMistakes(va, { rel: 0 }, extra),
    })
  }
  if (r.kind === 'kW') {
    return calc({
      id, label, why: why ?? 'Kilo means thousand. Every line of a load calculation is in VA.',
      say: `Change kW to VA: ${fmt(r.kw)} × 1,000.`,
      a: r.kw, op: '×', b: 1000, unit: 'VA', section,
      mistakes: cleanMistakes(va, undefined, [
        { value: r.kw, mistake: 'kilo_conversion', message: `${fmt(r.kw)} is still in kW. Multiply by 1,000 to get VA.` },
        ...extra,
      ]),
    })
  }
  const other = r.volts === 240 ? 120 : 240
  return calc({
    id, label, why: why ?? 'Volt-amperes are just what the name says: volts times amperes.',
    say: `Amps × volts gives VA: ${fmt(r.amps)} × ${r.volts}.`,
    a: r.amps, op: '×', b: r.volts, unit: 'VA', section,
    mistakes: cleanMistakes(va, undefined, [
      { value: r.amps * other, mistake: 'wrong_voltage', message: `The nameplate says ${r.volts} V. Multiply by ${r.volts}, not ${other}.` },
      ...extra,
    ]),
  })
}

// ---------------------------------------------------------------------------------------------
// L: general lighting + small-appliance + laundry, Table 220.42
// ---------------------------------------------------------------------------------------------

export interface LightingIn {
  /** Living area, ft² (220.11: outside dimensions, no open porches, garages or unfinished space). */
  area: number
  /** Spaces the story mentions that are NOT counted (distractors). */
  excluded: { name: string; ft2: number }[]
  /** 20-A small-appliance circuits (two at least). */
  saCircuits: number
  /** True when the story states the count; otherwise he looks up the minimum of two. */
  saStated: boolean
  /** One laundry circuit (false when the building has a common laundry). */
  laundry: boolean
}

export interface LightingNums {
  glVA: number
  saVA: number
  laundryVA: number
  total: number
  remainder: number
  at35: number
  demand: number
}

/** Table 220.42, dwelling units: first 3,000 VA at 100%, 3,001-120,000 at 35%, the rest at 25%. */
export function lightingDemandOf(total: number): number {
  let left = total
  let out = 0
  let floor = 0
  for (const step of DWELLING.lightingDemand) {
    const span = Math.min(left, step.upTo - floor)
    if (span <= 0) break
    out += (span * step.pct) / 100
    left -= span
    floor = step.upTo
  }
  return clean(out)
}

export function excludedFt2(inp: LightingIn): number {
  return inp.excluded.reduce((s, e) => s + e.ft2, 0)
}

export function lightingNums(inp: LightingIn): LightingNums {
  const glVA = inp.area * DWELLING.lightingVAperFt2
  const saVA = inp.saCircuits * DWELLING.smallApplianceVA
  const laundryVA = inp.laundry ? DWELLING.laundryVA : 0
  const total = glVA + saVA + laundryVA
  if (total <= LOAD.lightingFirstVA || total > LOAD.lightingSecondUpToVA) {
    throw new Error(`lighting total ${total} VA is outside the two-step range these lines show`)
  }
  const remainder = total - LOAD.lightingFirstVA
  const at35 = clean((remainder * LOAD.lightingSecondPct) / 100)
  return { glVA, saVA, laundryVA, total, remainder, at35, demand: clean(at35 + LOAD.lightingFirstVA) }
}

/** The L lines: area, 3 VA/ft², small-appliance circuits, laundry, total, then the demand in three steps. */
export function lightingLines(inp: LightingIn, section: string): { lines: WorkLine[]; nums: LightingNums; totalId: string } {
  const n = lightingNums(inp)
  const ex = excludedFt2(inp)
  const exNames = listJoin(inp.excluded.map((e) => e.name))
  const lines: WorkLine[] = []
  const first = LOAD.lightingFirstVA

  lines.push(given({
    id: 'area', label: 'Floor area that counts',
    say: 'Write down the living area. Leave out open porches, garages and unfinished spaces.',
    why: `${loc(REF.floorArea)}: the 3 VA per square foot is for the space people live in.`,
    ref: REF.floorArea,
    value: inp.area, unit: 'ft2', section,
    mistakes: cleanMistakes(inp.area, { rel: 0 }, [
      ex > 0 && { value: inp.area + ex, mistake: 'floor_area_extra', message: `Leave out the ${exNames}: only the living space counts toward the 3 VA per square foot.` },
      inp.excluded.length > 1 && { value: inp.area + (inp.excluded[0]?.ft2 ?? 0), mistake: 'floor_area_extra', message: `Leave out the ${inp.excluded[0]?.name}: only the living space counts.` },
    ]),
  }))
  lines.push(calc({
    id: 'glVA', label: 'General lighting load',
    say: 'Multiply the floor area by 3 VA per square foot.',
    why: 'This one number covers the lights and the general-use receptacles of the whole house.',
    ref: REF.dwellingLighting,
    a: inp.area, op: '×', b: DWELLING.lightingVAperFt2, unit: 'VA', section,
    mistakes: cleanMistakes(n.glVA, undefined, [
      ex > 0 && { value: (inp.area + ex) * DWELLING.lightingVAperFt2, mistake: 'floor_area_extra', message: `You counted the ${exNames}. Only the living area gets 3 VA per square foot.` },
    ]),
    sanity: 'About 3 VA for every square foot: a 2,000 square foot house is 6,000 VA.',
  }))
  if (inp.saStated) {
    lines.push(given({
      id: 'saCount', label: 'Small-appliance circuits',
      say: 'Write down how many 20-A small-appliance circuits the question gives.',
      value: inp.saCircuits, unit: 'count', section,
    }))
  } else {
    lines.push(lookup({
      id: 'saCount', label: 'Small-appliance circuits (the minimum)',
      say: 'The question does not say how many. Every dwelling needs at least two 20-A small-appliance circuits.',
      ref: REF_LOAD.smallApplianceCircuits,
      value: inp.saCircuits, unit: 'count', section,
      mistakes: [{ value: 1, mistake: 'missed_small_appliance', message: 'A dwelling needs at least TWO small-appliance circuits for the kitchen and dining area.' }],
    }))
  }
  lines.push(calc({
    id: 'saVA', label: 'Small-appliance load',
    say: `Multiply the number of small-appliance circuits by 1,500 VA: ${inp.saCircuits} × 1,500.`,
    ref: REF.smallAppliance,
    a: inp.saCircuits, op: '×', b: DWELLING.smallApplianceVA, unit: 'VA', section,
  }))
  if (inp.laundry) {
    lines.push(lookup({
      id: 'laundryVA', label: 'Laundry circuit',
      say: 'Add one laundry circuit at 1,500 VA.',
      ref: REF.laundry,
      value: DWELLING.laundryVA, unit: 'VA', section,
    }))
  }
  const parts = [n.glVA, n.saVA, ...(inp.laundry ? [n.laundryVA] : [])]
  lines.push(sum({
    id: 'lTotal', label: 'Lighting, small appliances and laundry',
    say: inp.laundry ? 'Add the lighting, the small-appliance circuits and the laundry circuit.' : 'Add the lighting and the small-appliance circuits.',
    why: 'They go through the demand table together, as one number.',
    ref: REF.lightingDemand,
    parts, unit: 'VA', section,
    mistakes: cleanMistakes(n.total, undefined, [
      { value: n.glVA + n.laundryVA, mistake: 'missed_small_appliance', message: `Add the small-appliance circuits too: ${inp.saCircuits} × 1,500 = ${fmt(n.saVA)} VA.` },
      inp.laundry && { value: n.glVA + n.saVA, mistake: 'missed_small_appliance', message: 'Add the 1,500 VA laundry circuit too.' },
      { value: n.glVA, mistake: 'missed_small_appliance', message: 'The small-appliance and laundry circuits are added to the lighting before the demand factor.' },
      ex > 0 && { value: n.total + ex * DWELLING.lightingVAperFt2, mistake: 'floor_area_extra', message: `The ${exNames} do not count. Use the living area only.` },
    ]),
  }))
  lines.push(calc({
    id: 'lRemainder', label: 'The part over 3,000 VA',
    say: `The first 3,000 VA counts at 100%. Take it off: ${fmt(n.total)} − 3,000.`,
    why: 'The demand table works in steps. Only the part above the first 3,000 VA gets the 35%.',
    ref: REF.lightingDemand,
    a: n.total, op: '−', b: first, unit: 'VA', section,
  }))
  lines.push(calc({
    id: 'l35', label: 'That part at 35%',
    say: `Multiply the part over 3,000 VA by 0.35: ${fmt(n.remainder)} × 0.35.`,
    why: 'Not every light and receptacle is used at once, so the code lets you count the part above 3,000 VA at 35%.',
    ref: REF.lightingDemand,
    a: n.remainder, op: '×', b: LOAD.lightingSecondPct / 100, unit: 'VA', section,
    mistakes: cleanMistakes(n.at35, undefined, [
      { value: n.total * 0.35, mistake: 'demand_on_whole_load', message: `Take 35% of the part OVER 3,000 VA (${fmt(n.remainder)}), not of the whole ${fmt(n.total)}.` },
    ]),
    checkpoint: true,
  }))
  lines.push(calc({
    id: 'lDemand', label: 'Lighting, small appliances and laundry after demand',
    say: 'Add back the first 3,000 VA, which counts at 100%.',
    ref: REF.lightingDemand,
    a: n.at35, op: '+', b: first, unit: 'VA', section,
    mistakes: cleanMistakes(n.demand, undefined, [
      { value: n.at35, mistake: 'forgot_first_step', message: 'You still need the first 3,000 VA at 100%. Add 3,000.' },
      { value: n.total * 0.35 + first, mistake: 'demand_on_whole_load', message: `The 35% goes only on the part over 3,000 VA: (${fmt(n.total)} − 3,000) × 0.35 + 3,000.` },
      { value: n.total * 0.35, mistake: 'demand_on_whole_load', message: 'That is 35% of the whole load. Only the part over 3,000 VA gets 35%; the first 3,000 stays at 100%.' },
      { value: n.total, mistake: 'demand_factor_missed', message: 'That is the load before the demand factor. Run it through the table: 3,000 at 100%, the rest at 35%.' },
      { value: lightingDemandOf(n.glVA), mistake: 'missed_small_appliance', message: 'The small-appliance and laundry circuits go into the demand step too.' },
      ex > 0 && { value: lightingDemandOf(n.total + ex * DWELLING.lightingVAperFt2), mistake: 'floor_area_extra', message: `The ${exNames} do not count toward the floor area.` },
    ]),
    sanity: 'For a house this is usually about half of the total before demand.',
    checkpoint: true,
  }))
  return { lines, nums: n, totalId: 'lDemand' }
}

// ---------------------------------------------------------------------------------------------
// R: household ranges, Table 220.55
// ---------------------------------------------------------------------------------------------

/**
 * Note 1 counting: the whole kW over 12, plus one for a major fraction. The generators never produce
 * a fraction near one half (whether exactly 0.5 is "major" is argued), so the answer key does not
 * depend on that reading; this function takes 0.5 as major, as the Annex D research reads it.
 */
export function note1Steps(excessKW: number): number {
  const x = clean(excessKW)
  const whole = Math.floor(x + 1e-9)
  return x - whole >= 0.5 - 1e-9 ? whole + 1 : whole
}

/** The other way of rounding the excess (for the "rounded the wrong way" slip). */
export function note1StepsWrong(excessKW: number): number {
  const x = clean(excessKW)
  const whole = Math.floor(x + 1e-9)
  return note1Steps(x) === whole ? whole + 1 : whole
}

/** True when a kW excess is safely away from the half (no "is 0.5 a major fraction?" argument). */
export function clearFraction(excessKW: number): boolean {
  const x = clean(excessKW)
  const frac = x - Math.floor(x + 1e-9)
  return Math.abs(frac - 0.5) > 0.05 + 1e-9
}

export interface RangeNums {
  kw: number
  colC: number
  over: boolean
  excess: number
  steps: number
  pct: number
  demandKW: number
  demandVA: number
}

/** One household range of 8¾ kW to 27 kW: Column C (8 kW), with Note 1 above 12 kW. */
export function singleRangeNums(kw: number): RangeNums {
  if (kw <= LOAD.rangeColBMaxKW || kw > LOAD.rangeNote1MaxKW) throw new Error(`single range ${kw} kW is outside Column C`)
  const colC = 8
  const over = kw > LOAD.rangeColCMaxKW + 1e-9
  const excess = over ? clean(kw - LOAD.rangeColCMaxKW) : 0
  const steps = over ? note1Steps(excess) : 0
  const pct = steps * LOAD.rangeNote1PctPerKW
  const demandKW = clean(colC * (1 + pct / 100))
  return { kw, colC, over, excess, steps, pct, demandKW, demandVA: clean(demandKW * 1000) }
}

/**
 * One household range by the standard method, in VA: Column C (with Note 1) over 8¾ kW; Column B
 * (80% for one appliance, permitted by Note 3) from 3½ to 8¾ kW, as Example D4(b) does for its 8-kW range.
 */
export function standardRangeVA(kw: number): number {
  if (kw > LOAD.rangeColBMaxKW) return singleRangeNums(kw).demandVA
  if (kw >= 3.5) return clean(kw * 1000 * (LOAD.rangeColBOnePct / 100))
  throw new Error(`range ${kw} kW is below Column B`)
}

/** The choose line "over 12 kW?" (shared by the single and multiple range recipes). */
export function over12Line(id: string, subject: string, over: boolean, section?: string): WorkLine {
  const Subject = subject.charAt(0).toUpperCase() + subject.slice(1)
  return choose({
    id, label: 'Over 12 kW?',
    say: `Is ${subject} more than 12 kW?`,
    why: 'Column C is written for ranges up to 12 kW. A bigger range gets more: Note 1 adds 5% for each kW over 12.',
    ref: REF_LOAD.rangeNote1,
    options: [
      opt('no', '12 kW or less: use Column C as it is',
        over ? `${Subject} is over 12 kW, so Note 1 raises the Column C value.` : undefined, over ? 'range_note1' : undefined),
      opt('yes', 'Over 12 kW: Column C plus 5% per kW over 12',
        over ? undefined : `${Subject} is not over 12 kW. Column C applies as it is.`, over ? undefined : 'range_note1'),
    ],
    answerId: over ? 'yes' : 'no',
    section, checkpoint: true,
  })
}

/**
 * The Note 1 lines on top of a Column C value: kW over 12, the steps, the percent, the raised demand.
 * `base` is the Column C value (kW), `rating` the range rating or the average (kW).
 */
export function note1Lines(p: {
  rating: number; base: number; section?: string; ids?: { excess: string; steps: string; pct: string; demand: string }
  /** Extra mistakes for the demand line (most specific first). */
  demandMistakes?: MaybeMistake[]
  ratingWord: string
}): { lines: WorkLine[]; excess: number; steps: number; pct: number; demand: number } {
  const ids = p.ids ?? { excess: 'rangeExcess', steps: 'rangeSteps', pct: 'rangePct', demand: 'rangeDemandKW' }
  const excess = clean(p.rating - LOAD.rangeColCMaxKW)
  const steps = note1Steps(excess)
  const wrongSteps = note1StepsWrong(excess)
  const pct = steps * LOAD.rangeNote1PctPerKW
  const mult = clean(1 + pct / 100)
  const demand = clean(p.base * mult)
  const lines: WorkLine[] = []
  lines.push(calc({
    id: ids.excess, label: 'kW over 12',
    say: `Subtract 12 from the ${p.ratingWord}: ${fmt(p.rating)} − 12.`,
    ref: REF_LOAD.rangeNote1,
    a: p.rating, op: '−', b: LOAD.rangeColCMaxKW, unit: 'kW', section: p.section,
  }))
  const isWhole = Math.abs(excess - Math.round(excess)) < 1e-9
  lines.push(ruleLine({
    id: ids.steps, label: 'Whole kW counted',
    say: isWhole
      ? `${fmt(excess)} is already a whole number of kW: count ${steps}.`
      : 'Count each whole kW over 12. A major fraction (0.6, 0.7, 0.8 ...) counts as one more kW; 0.1 to 0.4 is dropped.',
    why: 'Note 1 says "each kW or major fraction of a kW": a big piece of a kW counts as a whole one, a small piece does not.',
    ref: REF_LOAD.rangeNote1,
    value: steps, unit: 'count',
    expr: `${fmt(excess)} kW → ${steps}`,
    mistakes: isWhole ? [] : cleanMistakes(steps, { abs: 0 }, [
      { value: wrongSteps, mistake: 'range_major_fraction', message: wrongSteps > steps
        ? `${fmt(excess)} has a small fraction (under half a kW): drop it and count ${steps}.`
        : `${fmt(excess)} has a major fraction (more than half a kW): it counts as one more, ${steps}.` },
    ]),
    section: p.section, checkpoint: !isWhole,
  }))
  if (steps === 0) {
    // Over 12 kW by less than a major fraction: Note 1 adds nothing. One result line, no 0% line.
    const wrongDemand = clean(p.base * (1 + LOAD.rangeNote1PctPerKW / 100))
    lines.push(ruleLine({
      id: ids.demand, label: 'Range demand (no increase)',
      say: `${fmt(excess)} kW is less than a major fraction, so Note 1 adds nothing: the demand stays ${fmt(p.base)} kW.`,
      ref: REF_LOAD.rangeNote1,
      value: p.base, unit: 'kW',
      expr: `0 kW counted → ${fmt(p.base)} kW`,
      mistakes: cleanMistakes(p.base, undefined, [
        { value: wrongDemand, mistake: 'range_major_fraction', message: `${fmt(excess)} kW is a small fraction: it is dropped, so there is no 5% increase.` },
        ...(p.demandMistakes ?? []),
      ]),
      section: p.section, checkpoint: true,
    }))
    return { lines, excess, steps, pct, demand: p.base }
  }
  lines.push(calc({
    id: ids.pct, label: 'Percent increase',
    say: `5% for each kW counted: ${steps} × 5.`,
    ref: REF_LOAD.rangeNote1,
    a: steps, op: '×', b: LOAD.rangeNote1PctPerKW, unit: 'pct', section: p.section,
  }))
  lines.push(calc({
    id: ids.demand, label: 'Range demand with Note 1',
    say: `Raise the Column C value by ${pct}%: multiply ${fmt(p.base)} kW by ${fmt(mult)} (100% + ${pct}%).`,
    why: `${pct}% more means × ${fmt(mult)}. Multiplying by ${fmt(pct / 100)} would give only the increase.`,
    ref: REF_LOAD.rangeNote1,
    a: p.base, op: '×', b: mult, unit: 'kW',
    mistakes: cleanMistakes(demand, undefined, [
      { value: p.base, mistake: 'range_note1', message: `Over 12 kW, Column C is raised ${pct}%: ${fmt(p.base)} × ${fmt(mult)}.` },
      ...(p.demandMistakes ?? []),
      { value: clean(p.base * (pct / 100)), mistake: 'range_note1', message: `${fmt(p.base * (pct / 100))} kW is only the increase. Multiply by ${fmt(mult)} (100% + ${pct}%) to get the whole demand.` },
      wrongSteps !== steps && { value: clean(p.base * (1 + (wrongSteps * LOAD.rangeNote1PctPerKW) / 100)), mistake: 'range_major_fraction', message: `Count ${steps} kW over 12, not ${wrongSteps}: that makes ${pct}%.` },
    ]),
    section: p.section, checkpoint: true,
  }))
  return { lines, excess, steps, pct, demand }
}

/**
 * The R lines for ONE household range: nameplate, over 12?, Column C, Note 1 when over 12, and the
 * demand in VA when `toVA`. Returns the id of the bucket's total line.
 */
export function rangeLines(kw: number, section: string | undefined, toVA: boolean): { lines: WorkLine[]; nums: RangeNums; totalId: string } {
  const n = singleRangeNums(kw)
  const lines: WorkLine[] = []
  const kwText = `${fmt(kw)}-kW`
  lines.push(given({
    id: 'rangeKW', label: 'Range nameplate',
    say: 'Write down the range rating from the question, in kW.',
    value: kw, unit: 'kW', section,
  }))
  lines.push(over12Line('rangeOver12', `the ${kwText} range`, n.over, section))
  lines.push(lookup({
    id: 'rangeColC', label: 'Column C, one range',
    say: `${loc(REF.rangeTable)}, Column C, the row for 1 range: the demand in kW.`,
    why: 'A household range is never counted at its nameplate. The table allows for the burners not all being on at once.',
    ref: REF.rangeTable,
    value: n.colC, unit: 'kW', section,
    mistakes: cleanMistakes(n.colC, { rel: 0.001 }, [
      { value: kw, mistake: 'range_nameplate', message: `That is the nameplate. A household range goes through ${loc(REF.rangeTable)}: Column C, 1 range.` },
      { value: clean(kw * LOAD.rangeColBOnePct / 100), mistake: 'range_wrong_column', message: `That is 80% from Column B. A range over 8¾ kW uses Column C.` },
    ]),
    checkpoint: !n.over,
  }))
  let totalId = 'rangeColC'
  if (n.over) {
    const nl = note1Lines({
      rating: kw, base: n.colC, section, ratingWord: 'range rating',
      demandMistakes: [
        { value: kw, mistake: 'range_nameplate', message: `That is the nameplate. Note 1 raises the Column C value (8 kW), not the nameplate.` },
        { value: clean(kw * (1 + n.pct / 100)), mistake: 'range_nameplate', message: `Raise the Column C value (8 kW) by ${n.pct}%, not the nameplate.` },
      ],
    })
    lines.push(...nl.lines)
    totalId = 'rangeDemandKW'
  }
  if (toVA) {
    lines.push(calc({
      id: 'rangeVA', label: 'Range demand in VA',
      say: `Change kW to VA: ${fmt(n.demandKW)} × 1,000.`,
      a: n.demandKW, op: '×', b: 1000, unit: 'VA', section,
      mistakes: cleanMistakes(n.demandVA, undefined, [
        { value: clean(kw * 1000), mistake: 'range_nameplate', message: `That is the nameplate in VA. Use the demand from ${loc(REF.rangeTable)}: ${fmt(n.demandKW)} kW.` },
        n.over && n.steps > 0 && { value: 8000, mistake: 'range_note1', message: `Over 12 kW, the 8 kW is raised by Note 1: use ${fmt(n.demandKW)} kW.` },
        n.over && { value: clean(8000 * (1 + (note1StepsWrong(n.excess) * LOAD.rangeNote1PctPerKW) / 100)), mistake: 'range_major_fraction', message: `Count ${n.steps} kW over 12 (a major fraction counts, a small one is dropped): ${fmt(n.demandKW)} kW.` },
        { value: n.demandKW, mistake: 'kilo_conversion', message: `${fmt(n.demandKW)} is in kW. Multiply by 1,000 for VA.` },
      ]),
    }))
    totalId = 'rangeVA'
  }
  return { lines, nums: n, totalId }
}

// ---------------------------------------------------------------------------------------------
// D: household dryer, 220.54
// ---------------------------------------------------------------------------------------------

export function dryerVA(nameplateVA: number): number {
  return Math.max(DWELLING.dryerMinVA, nameplateVA)
}

/** Nameplate VA, then the 5,000 VA floor. */
export function dryerLines(r: Rating, section: string | undefined, ids = { name: 'dryerName', demand: 'dryer' }): { lines: WorkLine[]; nameplate: number; demand: number } {
  const np = ratingVA(r)
  const d = dryerVA(np)
  const lines: WorkLine[] = [vaLine(ids.name, 'Dryer nameplate', r, section)]
  lines.push(ruleLine({
    id: ids.demand, label: 'Dryer load (5,000 VA at least)',
    say: 'Use 5,000 VA or the nameplate, whichever is larger.',
    why: 'Dryers often get replaced with bigger ones, so the code sets a floor of 5,000 VA.',
    ref: REF.dryers,
    value: d, unit: 'VA',
    expr: `larger of 5,000 and ${fmt(np)} → ${fmt(d)}`,
    mistakes: cleanMistakes(d, undefined, [
      np < DWELLING.dryerMinVA && { value: np, mistake: 'dryer_minimum', message: `The nameplate is only ${fmt(np)} VA, but a dryer counts at least 5,000 VA.` },
      np > DWELLING.dryerMinVA && { value: DWELLING.dryerMinVA, mistake: 'dryer_nameplate_larger', message: `5,000 VA is the floor. This nameplate is bigger, ${fmt(np)} VA, so use it.` },
    ]),
    section, checkpoint: true,
  }))
  return { lines, nameplate: np, demand: d }
}

// ---------------------------------------------------------------------------------------------
// A: amperes and the service or overcurrent device
// ---------------------------------------------------------------------------------------------

/**
 * VA ÷ divisor. The value is the 220.5(B) rounding (half an amp and up goes up); the `calc` builder
 * adds the exact quotient to `accept`, so either is right (a 1.73-for-1.732 slip stays within it too).
 * Mistake values are kept clear of both forms.
 */
export function ampsLine(p: {
  id: string; label: string; va: number; divisor: number; say: string; why?: string; ref?: CodeRef
  section?: string; checkpoint?: boolean; mistakes: MaybeMistake[]
}): WorkLine {
  const exact = p.va / p.divisor
  const value = roundAmps220(exact)
  const rounded = Math.abs(exact - value) > 1e-9
  return calc({
    id: p.id, label: p.label, say: p.say,
    why: p.why ?? (rounded
      ? `${fmt(p.va)} ÷ ${fmt(p.divisor)} = ${fmt(exact, 2)} A. ${loc(REF.fractionsOfAmpere)} lets you round to the nearest whole amp (half an amp and up goes up), so ${value} A. Either is right.`
      : `${fmt(p.va)} ÷ ${fmt(p.divisor)} = ${value} A.`),
    ref: p.ref ?? REF.fractionsOfAmpere,
    a: p.va, op: '÷', b: p.divisor, round: roundAmps220, unit: 'A',
    mistakes: cleanMistakes(exact, undefined, cleanMistakes(value, undefined, p.mistakes)),
    section: p.section, checkpoint: p.checkpoint,
  })
}

/** The service or OCPD rating: the next standard size at or above, never below `min` when given. */
export function sizeFor(amps: number, min?: number): number {
  const s = nextStandardUp(amps)
  return min !== undefined ? Math.max(min, s) : s
}

/** True when rounding the amps per 220.5(B) (or not) gives the same standard size. */
export function sizeStable(exact: number, min?: number): boolean {
  return sizeFor(exact, min) === sizeFor(roundAmps220(exact), min)
}

/** The service / OCPD line. `min` = 100 for a one-family dwelling (230.79(C)). */
export function sizeLine(p: { id: string; label: string; amps: number; min?: number; section?: string; ref?: CodeRef; say?: string }): WorkLine {
  const value = sizeFor(p.amps, p.min)
  const plain = nextStandardUp(p.amps)
  const below = standardBelow(value)
  const ampsText = fmt(roundAmps220(p.amps))
  return ruleLine({
    id: p.id, label: p.label,
    say: p.say ?? (p.min !== undefined
      ? `Pick the next standard size at or above ${ampsText} A. A one-family house is never less than ${p.min} A.`
      : `Pick the next standard size at or above ${ampsText} A.`),
    why: `Standard sizes: 100, 110, 125, 150, 175, 200, 225, 250 ... (${loc(REF.standardOcpd)}). The rating must carry the load, so go UP.`,
    ref: p.ref ?? (p.min !== undefined ? REF.minServiceDwelling : REF.standardOcpd),
    value, unit: 'A',
    expr: `${ampsText} A → ${value} A`,
    mistakes: cleanMistakes(value, undefined, [
      p.min !== undefined && plain < p.min && { value: plain, mistake: 'service_min_100', message: `${plain} A would carry the load, but a one-family house service is never less than ${p.min} A.` },
      // Rounding down is a real slip only when the load (not the 100 A floor) sets the size.
      below !== undefined && plain === value && { value: below, mistake: 'ocpd_rounded_down', message: `${below} A is less than the ${ampsText} A it must carry. Go up to ${value} A.` },
    ]),
    section: p.section, checkpoint: true,
  })
}

/**
 * Four standard-size options: the right one, up to three sizes built from real mistakes (shuffled
 * so different slips show up), then the neighbouring sizes.
 */
export function sizeChoices(correct: number, wrongs: WrongValue[], rng: Rng, min?: number): AnswerChoice[] {
  const fill: WrongValue[] = []
  const down = standardBelow(correct)
  const up = standardAbove(correct)
  const up2 = up !== undefined ? standardAbove(up) : undefined
  if (down !== undefined) {
    fill.push(min !== undefined && down < min
      ? { value: down, mistake: 'service_min_100', why: `Below the ${min} A minimum for a one-family house service.` }
      : { value: down, mistake: 'ocpd_rounded_down', why: `Too small: ${correct} A is the smallest standard size at or above the calculated load.` })
  }
  if (up !== undefined) fill.push({ value: up, mistake: 'unknown', why: `Bigger than needed: ${correct} A is the smallest standard size that carries the load.` })
  if (up2 !== undefined) fill.push({ value: up2, mistake: 'unknown', why: `Bigger than needed: ${correct} A is the smallest standard size that carries the load.` })
  return numericChoices(correct, [...rng.shuffle(wrongs.filter((w) => w.value !== correct)), ...fill], rng, { unit: 'A', decimals: 0 })
}

/** Turns a list of (value, mistake, why) built from slips into WrongValues, dropping the right value. */
export function wrongsFrom(correct: number, list: (WrongValue | false | undefined | null)[]): WrongValue[] {
  return list.filter((w): w is WrongValue => !!w && Number.isFinite(w.value) && Math.abs(w.value - correct) > 1e-9)
}

// ---------------------------------------------------------------------------------------------
// Small text helpers
// ---------------------------------------------------------------------------------------------

/** "two 20-A small-appliance circuits and one laundry circuit". */
export function circuitsText(sa: number, laundry: boolean): string {
  return `${word(sa)} 20-A small-appliance circuits${laundry ? ' and one laundry circuit' : ''}`
}
