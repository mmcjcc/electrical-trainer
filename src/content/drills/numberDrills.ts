/**
 * Number drills (DESIGN.md §3.6): 45-second rounds of ten items, no worksheet. Each drill trains one
 * reflex the worksheets lean on:
 *
 *   percent    a percent from the code becomes a multiplier ("125% of it: × 1.25")
 *   divisor    pick what to divide VA by for the system the question names (÷ 360 for 208 V 3φ)
 *   threshold  "first X at 100%, the rest at Y%": subtract, multiply, add back
 *   kw         kW / kVA to W / VA (× 1,000)
 *   rounding   keep or bump: 220.5(B) half amp, Chapter 9 Note 7 at .8, "big enough" always up,
 *              motor feeder short-circuit protection at or below (430.62(A))
 *
 * Pure and seeded: the same seed always builds the same round. Every code value comes from
 * data/tables(.Extra).ts and every location from data/refs.ts.
 */
import {
  fmt, fmtUnit, makeRng, nextStandardUp, parseNumberInput, roundAmps220, standardAtOrBelow, STANDARD_OCPD, within,
} from '@/calc'
import {
  ADJUSTMENT, COMMERCIAL, DWELLING, K_FACTOR, MOTOR_OCPD_PCT, STANDARD_BOXES, SQRT3, dryerDemandPct, transformerPrimaryOnlyPct,
} from '@/data/tables'
import { CONTINUOUS, MOTOR_PCT } from '@/data/tablesExtra'
import { REF } from '@/data/refs'
import { REF_EXTRA } from '@/data/refsExtra'
import type { CodeRef, Unit } from '@/shared/types'

export type DrillId = 'percent' | 'divisor' | 'threshold' | 'kw' | 'rounding'

/** One drill item. `choice` items are answered with a button, `number` items on a number pad. */
export interface DrillItem {
  /** Unique within a round. */
  key: string
  /** The big line ("125% of a load"). */
  prompt: string
  /** What to answer ("× ?", "Which divisor?"). */
  ask: string
  /** Where this shows up in the code, in plain words. */
  context?: string
  kind: 'choice' | 'number'
  /** Choice items: the button labels, in display order. */
  options?: string[]
  /** Choice items: the right label. Number items: the right value printed ("1.25", "6,255 VA"). */
  answer: string
  /** Number items: the right value. */
  value?: number
  unit?: Unit
  tol?: { abs?: number; rel?: number }
  /** Known wrong numbers and what each one means (number items). */
  wrongs?: { value: number; message: string }[]
  /** Why a wrong button is wrong (choice items), keyed by label. */
  optionNotes?: Record<string, string>
  /** Shown after every answer: the rule and the working. */
  explain: string
  ref?: CodeRef
}

export interface Drill {
  id: DrillId
  title: string
  /** One plain sentence on the drill list. */
  blurb: string
  /** How to answer, shown at the start of a round. */
  howTo: string
  /** Exactly ROUND_SIZE items, the same for the same seed. */
  generate: (seed: number) => DrillItem[]
}

export const ROUND_SIZE = 10
/** The pace a round aims for. */
export const ROUND_SECONDS = 45

export type DrillVerdict = { ok: true; message: string } | { ok: false; message: string; unreadable?: boolean }

/** Checks an answer: an option label for choice items, the typed text for number items. */
export function checkDrillAnswer(item: DrillItem, input: string): DrillVerdict {
  if (item.kind === 'choice') {
    if (input === item.answer) return { ok: true, message: item.explain }
    const note = item.optionNotes?.[input]
    return { ok: false, message: note ? `${note} ${item.explain}` : item.explain }
  }
  const parsed = parseNumberInput(input)
  if (!parsed.ok) return { ok: false, message: parsed.reason, unreadable: true }
  const want = item.value
  if (want === undefined) throw new Error(`drill item ${item.key} has no value`)
  if (within(parsed.value, want, item.tol ?? { rel: 0 })) return { ok: true, message: item.explain }
  for (const w of item.wrongs ?? []) {
    if (within(parsed.value, w.value, { rel: 0.001 })) return { ok: false, message: `${w.message} ${item.explain}` }
  }
  return { ok: false, message: `Not quite. ${item.explain}` }
}

/** Takes `n` items from a builder, skipping repeats of the same key. */
function collect(n: number, build: (i: number) => DrillItem, maxTries = 200): DrillItem[] {
  const out: DrillItem[] = []
  const seen = new Set<string>()
  for (let i = 0; out.length < n && i < maxTries; i++) {
    const item = build(i)
    if (seen.has(item.key)) continue
    seen.add(item.key)
    out.push(item)
  }
  if (out.length < n) throw new Error(`drill could only build ${out.length} distinct items`)
  return out
}

// ---------------------------------------------------------------------------------------------
// 1. Percent → multiplier
// ---------------------------------------------------------------------------------------------

interface PctFact {
  pct: number
  context: string
  ref?: CodeRef
}

const lightingRemainderPct = DWELLING.lightingDemand[1].pct
const adj = (from: number) => {
  const row = ADJUSTMENT.find((r) => r.from === from)
  if (!row) throw new Error(`no adjustment row from ${from}`)
  return row
}

/** Percents an exam calculation multiplies by, each with where it comes from. */
export const PCT_FACTS: PctFact[] = [
  { pct: lightingRemainderPct, context: 'Dwelling lighting demand, the part above the first 3,000 VA', ref: REF.lightingDemand },
  { pct: DWELLING.optionalRemainderPct, context: 'Optional method: general loads above the first 10 kVA', ref: REF.optionalDwellingGeneral },
  { pct: COMMERCIAL.receptacleRemainderPct, context: 'Non-dwelling receptacles above the first 10 kVA', ref: REF.nonDwellingReceptacles },
  { pct: DWELLING.appliancePct4OrMore, context: 'Four or more fastened-in-place appliances in a dwelling', ref: REF.fixedAppliances },
  { pct: adj(4).pct, context: `${adj(4).from} to ${adj(4).to} current-carrying wires in one raceway`, ref: REF.adjustment },
  { pct: adj(7).pct, context: `${adj(7).from} to ${adj(7).to} current-carrying wires in one raceway`, ref: REF.adjustment },
  { pct: adj(10).pct, context: `${adj(10).from} to ${adj(10).to} current-carrying wires in one raceway`, ref: REF.adjustment },
  { pct: CONTINUOUS.pct, context: 'A continuous load (on for 3 hours or more): conductor and breaker', ref: REF.continuousBranch },
  { pct: MOTOR_PCT.conductor, context: 'Conductors for one motor, on its table full-load current', ref: REF.motorConductor },
  { pct: MOTOR_PCT.overloadOther, context: 'Motor overload, "all other motors" (service factor under 1.15 and temperature rise over 40°C)', ref: REF.motorOverload },
  { pct: MOTOR_OCPD_PCT['inverse-time-cb'], context: 'Inverse-time breaker for a motor branch circuit (most motors)', ref: REF.motorOcpdTable },
  { pct: MOTOR_OCPD_PCT['dual-element-fuse'], context: 'Dual-element (time-delay) fuse for a motor branch circuit', ref: REF.motorOcpdTable },
  { pct: MOTOR_OCPD_PCT['nontime-fuse'], context: 'Nontime-delay fuse for a motor branch circuit', ref: REF.motorOcpdTable },
  { pct: transformerPrimaryOnlyPct(5).pct, context: 'Transformer, primary protection only, primary current 2 A to under 9 A', ref: REF.transformerOcpd },
  { pct: dryerDemandPct(5), context: 'Five household dryers on one feeder', ref: REF.dryerTable },
]

/** Builds a "percent → multiplier" item. Exported for spot tests. */
export function percentItem(fact: PctFact): DrillItem {
  const mult = fact.pct / 100
  const multText = fmt(mult)
  const wrongs: { value: number; message: string }[] = [
    { value: fact.pct, message: `Percent means "out of 100": ${fact.pct}% is ${fact.pct} ÷ 100.` },
  ]
  if (fact.pct > 100) {
    wrongs.push({ value: mult - 1, message: `That is only the extra ${fact.pct - 100}%. ${fact.pct}% keeps the whole thing and adds the extra.` })
  } else {
    wrongs.push({ value: 1 + mult, message: `That adds ${fact.pct}% on top. "${fact.pct}% of" the load keeps only part of it.` })
  }
  return {
    key: `pct-${fact.pct}-${fact.context}`,
    prompt: `${fact.pct}% of it`,
    ask: 'Multiply by what?',
    context: fact.context,
    kind: 'number',
    answer: multText,
    value: mult,
    unit: 'factor',
    tol: { abs: 1e-9 },
    wrongs,
    explain: `${fact.pct}% = ${fact.pct} ÷ 100 = × ${multText}.`,
    ref: fact.ref,
  }
}

/**
 * Table 220.55, Note 1: a range over 12 kW raises Column C by 5% for each kW over 12 (whole kW only
 * here, so the "major fraction" part of the note never comes up).
 */
export function rangeBoostItem(rangeKw: number): DrillItem {
  const over = rangeKw - 12
  if (!Number.isInteger(over) || over < 1) throw new Error(`range boost needs a whole kW over 12, got ${rangeKw}`)
  const pct = 5 * over
  const mult = 1 + pct / 100
  return {
    key: `boost-${rangeKw}`,
    prompt: `A ${rangeKw} kW range: Column C goes up 5% for each kW over 12`,
    ask: 'Multiply Column C by what?',
    context: 'One household range over 12 kW (Table 220.55, Note 1)',
    kind: 'number',
    answer: fmt(mult),
    value: mult,
    unit: 'factor',
    tol: { abs: 1e-9 },
    wrongs: [
      { value: pct / 100, message: `${fmt(pct / 100)} is only the increase. Keep the whole Column C value and add ${pct}%.` },
      { value: pct, message: `Percent means "out of 100": ${pct}% more is × ${fmt(mult)}.` },
    ],
    explain: `${rangeKw} − 12 = ${over} kW over; ${over} × 5% = ${pct}% more, so × ${fmt(mult)}.`,
    ref: REF.rangeTable,
  }
}

function percentRound(seed: number): DrillItem[] {
  const rng = makeRng(seed)
  const facts = rng.shuffle(PCT_FACTS)
  const boosts = rng.shuffle([13, 14, 15, 16, 17])
  // Eight from the code's percents, two range boosts, shuffled together.
  const items = [...collect(8, (i) => percentItem(facts[i % facts.length] as PctFact)), rangeBoostItem(boosts[0] as number), rangeBoostItem(boosts[1] as number)]
  return rng.shuffle(items)
}

// ---------------------------------------------------------------------------------------------
// 2. Pick the divisor
// ---------------------------------------------------------------------------------------------

export interface SystemFact {
  id: string
  text: string
  divisor: number
  phase: 1 | 3
  volts: number
}

/** The systems an exam names, and what to divide VA by. Three-phase divisors are volts × 1.732. */
export const SYSTEMS: SystemFact[] = [
  { id: '120', text: '120 V, single-phase', divisor: 120, phase: 1, volts: 120 },
  { id: '240-1', text: '120/240 V, single-phase (a house service)', divisor: 240, phase: 1, volts: 240 },
  { id: '208-1', text: '208 V, single-phase (two legs of a 208Y/120 V system)', divisor: 208, phase: 1, volts: 208 },
  { id: '208-3', text: '208Y/120 V, three-phase', divisor: 360, phase: 3, volts: 208 },
  { id: '240-3', text: '240 V, three-phase', divisor: 416, phase: 3, volts: 240 },
  { id: '480-1', text: '480 V, single-phase', divisor: 480, phase: 1, volts: 480 },
  { id: '480-3', text: '480Y/277 V, three-phase', divisor: 831, phase: 3, volts: 480 },
]

export const DIVISORS = [120, 208, 240, 360, 416, 480, 831] as const
const divLabel = (d: number) => `÷ ${d}`

/** Builds a "pick the divisor" item for a load of `va` on system `sys`. Exported for spot tests. */
export function divisorItem(sys: SystemFact, va: number): DrillItem {
  const amps = va / sys.divisor
  const rule =
    sys.phase === 3
      ? `Three-phase: ${sys.volts} × ${SQRT3} = ${fmt(sys.volts * SQRT3, 1)}, so ÷ ${sys.divisor}.`
      : `Single-phase: divide by the volts, ${sys.volts}. No 1.732.`
  const optionNotes: Record<string, string> = {}
  for (const d of DIVISORS) {
    if (d === sys.divisor) continue
    const other = SYSTEMS.find((s) => s.divisor === d)
    if (!other) continue
    if (sys.phase === 3 && other.phase === 1 && other.volts === sys.volts) {
      optionNotes[divLabel(d)] = `${d} alone is the single-phase number; three-phase needs the 1.732 too.`
    } else if (sys.phase === 1 && other.phase === 3) {
      optionNotes[divLabel(d)] = `÷ ${d} has 1.732 built in. That is only for three-phase.`
    } else if (other.volts !== sys.volts) {
      optionNotes[divLabel(d)] = `That is for ${other.volts} V. This system is ${sys.volts} V.`
    }
  }
  return {
    key: `div-${sys.id}-${va}`,
    prompt: `${fmtUnit(va, 'VA')} on a ${sys.text} system`,
    ask: 'Amps = VA ÷ what?',
    context: 'Turning a load in VA into amps',
    kind: 'choice',
    options: DIVISORS.map(divLabel),
    answer: divLabel(sys.divisor),
    optionNotes,
    explain: `${rule} ${fmt(va)} ÷ ${sys.divisor} = ${fmtUnit(amps, 'A', 1)}.`,
    ref: REF.voltagesForCalcs,
  }
}

function divisorRound(seed: number): DrillItem[] {
  const rng = makeRng(seed)
  const AMPS = [20, 25, 30, 40, 50, 60, 70, 80, 100, 125, 150, 200]
  // Every system once, then three more at random, each with its own load.
  const systems = [...SYSTEMS, ...rng.shuffle(SYSTEMS).slice(0, 3)]
  const items = collect(ROUND_SIZE, (i) => {
    const sys = systems[i % systems.length] as SystemFact
    const va = Math.round((rng.pick(AMPS) * sys.divisor) / 100) * 100
    return divisorItem(sys, va)
  })
  return rng.shuffle(items)
}

// ---------------------------------------------------------------------------------------------
// 3. The threshold split
// ---------------------------------------------------------------------------------------------

export interface SplitRule {
  id: string
  name: string
  first: number
  rate: number
  /** Totals drawn from this range, in steps of 100 VA. */
  range: [number, number]
  ref: CodeRef
}

export const SPLITS: SplitRule[] = [
  {
    id: 'lighting', name: 'Dwelling lighting (with small-appliance and laundry)', first: DWELLING.lightingDemand[0].upTo,
    rate: lightingRemainderPct, range: [6000, 30000], ref: REF.lightingDemand,
  },
  {
    id: 'receptacles', name: 'Non-dwelling receptacles', first: COMMERCIAL.receptacleFirstVA,
    rate: COMMERCIAL.receptacleRemainderPct, range: [12000, 60000], ref: REF.nonDwellingReceptacles,
  },
  {
    id: 'optional', name: 'Optional method, general loads', first: DWELLING.optionalFirstVA,
    rate: DWELLING.optionalRemainderPct, range: [14000, 60000], ref: REF.optionalDwellingGeneral,
  },
]

/** Builds a threshold-split item. Exported for spot tests. */
export function thresholdItem(rule: SplitRule, total: number): DrillItem {
  if (total <= rule.first) throw new Error(`total ${total} must be above the first ${rule.first}`)
  const m = rule.rate / 100
  const rest = total - rule.first
  // Integer arithmetic (totals are whole hundreds), so no float noise in the printed working.
  const restDemand = (rest * rule.rate) / 100
  const answer = rule.first + restDemand
  return {
    key: `split-${rule.id}-${total}`,
    prompt: `${rule.name}: ${fmtUnit(total, 'VA')}`,
    ask: `First ${fmtUnit(rule.first, 'VA')} at 100%, the rest at ${rule.rate}%. Demand load in VA?`,
    context: 'Subtract, multiply, add back',
    kind: 'number',
    answer: fmtUnit(answer, 'VA'),
    value: answer,
    unit: 'VA',
    tol: { abs: 1 },
    wrongs: [
      { value: (total * rule.rate) / 100, message: `You took ${rule.rate}% of the whole load. Only the part above ${fmt(rule.first)} gets ${rule.rate}%.` },
      { value: restDemand, message: `Almost: you forgot to add the first ${fmt(rule.first)} VA back.` },
      { value: rest, message: `You subtracted, but the rest still needs × ${fmt(m)}.` },
    ].filter((w) => Math.abs(w.value - answer) > 1e-9),
    explain: `${fmt(total)} − ${fmt(rule.first)} = ${fmt(rest)} → × ${fmt(m)} = ${fmt(restDemand)} → + ${fmt(rule.first)} = ${fmtUnit(answer, 'VA')}.`,
    ref: rule.ref,
  }
}

function thresholdRound(seed: number): DrillItem[] {
  const rng = makeRng(seed)
  const items = collect(ROUND_SIZE, (i) => {
    const rule = SPLITS[i % SPLITS.length] as SplitRule
    return thresholdItem(rule, rng.step(rule.range[0], rule.range[1], 100))
  })
  return rng.shuffle(items)
}

// ---------------------------------------------------------------------------------------------
// 4. kW → VA
// ---------------------------------------------------------------------------------------------

/** Heating-type (resistive) loads: watts and volt-amperes are the same number. Transformers in kVA. */
const KW_LOADS: { name: string; values: number[]; unit: 'kW' | 'kVA' }[] = [
  { name: 'water heater', values: [3.5, 4.5, 5.5], unit: 'kW' },
  { name: 'clothes dryer', values: [4.5, 5, 5.5, 5.6], unit: 'kW' },
  { name: 'household range', values: [8, 11, 12, 14, 15.5], unit: 'kW' },
  { name: 'cooktop', values: [6, 7.5], unit: 'kW' },
  { name: 'wall oven', values: [4, 6], unit: 'kW' },
  { name: 'electric baseboard heat', values: [0.75, 1.5, 2.5, 10], unit: 'kW' },
  { name: 'duct heater', values: [7.5, 9.6], unit: 'kW' },
  { name: 'transformer', values: [15, 22.5, 37.5, 45, 75, 112.5], unit: 'kVA' },
]

/** Builds a kW → VA item. Exported for spot tests. */
export function kwItem(name: string, value: number, unit: 'kW' | 'kVA'): DrillItem {
  const va = Math.round(value * 1000 * 1000) / 1000
  const out: Unit = unit === 'kW' ? 'W' : 'VA'
  const outText = unit === 'kW' ? 'watts (the same number of VA)' : 'VA'
  return {
    key: `kw-${name}-${value}`,
    prompt: `A ${fmtUnit(value, unit)} ${name}`,
    ask: `Write it in ${outText}.`,
    context: 'Every load goes on the sheet in VA before you add',
    kind: 'number',
    answer: fmtUnit(va, out),
    value: va,
    unit: out,
    tol: { abs: 0.5 },
    wrongs: [
      { value, message: 'That is still in kilo-units. "Kilo" means 1,000.' },
      { value: value * 100, message: 'One zero short. Multiply by 1,000 on the calculator; do not move the decimal in your head.' },
      { value: value * 10000, message: 'One zero too many. Multiply by 1,000, not 10,000.' },
    ],
    explain: `${fmt(value)} × 1,000 = ${fmtUnit(va, out)}.`,
  }
}

function kwRound(seed: number): DrillItem[] {
  const rng = makeRng(seed)
  return collect(ROUND_SIZE, () => {
    const load = rng.pick(KW_LOADS)
    return kwItem(load.name, rng.pick(load.values), load.unit)
  })
}

// ---------------------------------------------------------------------------------------------
// 5. Keep or bump
// ---------------------------------------------------------------------------------------------

/** 220.5(B): under .5 A may be dropped; .5 and over goes up. Exported for spot tests. */
export function amps220Item(amps: number): DrillItem {
  const whole = Math.floor(amps + 1e-9)
  const right = roundAmps220(amps)
  const down = `Drop to ${whole} A`
  const up = `Round up to ${whole + 1} A`
  const frac = fmt(amps - whole, 2).replace(/^0/, '')
  return {
    key: `r220-${amps}`,
    prompt: `${fmtUnit(amps, 'A', 2)} from a load calculation`,
    ask: 'Keep or bump?',
    context: 'Amps in a load calculation (220.5(B))',
    kind: 'choice',
    options: [down, up],
    answer: right === whole ? down : up,
    optionNotes: { [down]: 'Only fractions under .5 may be dropped.', [up]: 'Under .5 the fraction may be dropped.' },
    explain: right === whole ? `${frac} is under .5: drop it, ${whole} A.` : `${frac} is .5 or more: round up to ${right} A.`,
    ref: REF.fractionsOfAmpere,
  }
}

/** Chapter 9, Note 7: same-size wires round down unless the decimal is .8 or more. */
export function note7Item(count: number): DrillItem {
  const whole = Math.floor(count + 1e-9)
  const up = count - whole >= 0.8 - 1e-9
  const downLabel = `Down to ${whole} wires`
  const upLabel = `Up to ${whole + 1} wires`
  const frac = fmt(count - whole, 2).replace(/^0/, '')
  return {
    key: `n7-${count}`,
    prompt: `${fmt(count, 2)} wires fit (all the same size)`,
    ask: 'Keep or bump?',
    context: 'Same-size wires in a raceway (Chapter 9, Note 7)',
    kind: 'choice',
    options: [downLabel, upLabel],
    answer: up ? upLabel : downLabel,
    optionNotes: { [downLabel]: 'At .8 or more, Note 7 lets you go to the next whole wire.', [upLabel]: 'Under .8 you round down: you cannot pull part of a wire.' },
    explain: up ? `${frac} is .8 or more: Note 7 permits ${whole + 1}.` : `${frac} is under .8: round down to ${whole}.`,
    ref: REF.ch9Note7,
  }
}

const BOX_VOLUMES = [...new Set(STANDARD_BOXES.map((b) => b.volume))].sort((a, b) => a - b)

/** "Big enough" always goes up: the box must hold at least the volume the items need. */
export function boxItem(need: number, smaller: number, bigger: number): DrillItem {
  if (!(smaller < need && need < bigger)) throw new Error('need must sit between the two boxes')
  const downLabel = `The ${fmtUnit(smaller, 'in3', 1)} box`
  const upLabel = `The ${fmtUnit(bigger, 'in3', 1)} box`
  return {
    key: `box-${need}-${smaller}`,
    prompt: `Box fill adds up to ${fmtUnit(need, 'in3', 2)}`,
    ask: `Boxes on the truck: ${fmtUnit(smaller, 'in3', 1)} or ${fmtUnit(bigger, 'in3', 1)}. Which one?`,
    context: 'Anything that must be big enough rounds UP',
    kind: 'choice',
    options: [downLabel, upLabel],
    answer: upLabel,
    optionNotes: { [downLabel]: `${fmt(smaller, 1)} in³ is smaller than the ${fmt(need, 2)} in³ you need.` },
    explain: `The box must hold at least ${fmtUnit(need, 'in3', 2)}: go up to ${fmtUnit(bigger, 'in3', 1)}.`,
    ref: REF.boxFill,
  }
}

/** A continuous load: the breaker must be at least 125% of it, so a non-standard result goes UP. */
export function continuousItem(loadAmps: number): DrillItem {
  const need = (loadAmps * CONTINUOUS.pct) / 100
  const up = nextStandardUp(need)
  const below = [...STANDARD_OCPD].reverse().find((s) => s < up) ?? up
  const downLabel = `${below} A`
  const upLabel = `${up} A`
  return {
    key: `cont-${loadAmps}`,
    prompt: `A ${fmtUnit(loadAmps, 'A')} continuous load: ${fmt(loadAmps)} × ${fmt(CONTINUOUS.pct / 100)} = ${fmtUnit(need, 'A', 2)}`,
    ask: 'Breaker size?',
    context: 'Branch-circuit breaker for a continuous load (210.20(A))',
    kind: 'choice',
    options: [downLabel, upLabel],
    answer: upLabel,
    optionNotes: { [downLabel]: `${below} A is less than the ${fmt(need, 2)} A the rule asks for.` },
    explain: `The breaker must be at least ${fmtUnit(need, 'A', 2)}. The next standard size up is ${up} A.`,
    ref: REF.continuousBranchOcpd,
  }
}

/** Motor feeder short-circuit protection (430.62(A)): at or below the calculated value, never up. */
export function motorFeederItem(maxAmps: number): DrillItem {
  const at = standardAtOrBelow(maxAmps)
  const up = nextStandardUp(maxAmps)
  if (at === up) throw new Error('pick a value between standard sizes')
  const downLabel = `${at} A`
  const upLabel = `${up} A`
  return {
    key: `mf-${maxAmps}`,
    prompt: `Motor feeder: largest branch device plus the other motors comes to ${fmtUnit(maxAmps, 'A')}`,
    ask: 'Feeder protection size?',
    context: 'Motor feeder short-circuit protection (430.62(A))',
    kind: 'choice',
    options: [downLabel, upLabel],
    answer: downLabel,
    optionNotes: { [upLabel]: 'A motor feeder does not get the next size up.' },
    explain: `The feeder device may not be larger than ${fmtUnit(maxAmps, 'A')}: pick the standard size at or below, ${at} A.`,
    ref: REF.motorFeederOcpd,
  }
}

function roundingRound(seed: number): DrillItem[] {
  const rng = makeRng(seed)
  const tenths = [1, 2, 3, 4, 5, 5, 6, 7, 8, 9]
  const note7Fracs = [0.15, 0.35, 0.5, 0.62, 0.75, 0.79, 0.8, 0.84, 0.9, 0.95]
  const builders: (() => DrillItem)[] = [
    () => amps220Item(rng.int(40, 220) + (rng.pick(tenths) as number) / 10),
    () => amps220Item(rng.int(40, 220) + (rng.pick(tenths) as number) / 10),
    () => amps220Item(rng.int(40, 220) + (rng.pick(tenths) as number) / 10),
    () => note7Item(rng.int(3, 30) + (rng.pick(note7Fracs) as number)),
    () => note7Item(rng.int(3, 30) + (rng.pick(note7Fracs) as number)),
    () => note7Item(rng.int(3, 30) + (rng.pick(note7Fracs) as number)),
    () => {
      // Box-fill totals are sums of 1.5 to 5.0 in³ allowances, so whole quarters of a cubic inch.
      for (;;) {
        const i = rng.int(0, BOX_VOLUMES.length - 2)
        const lo = BOX_VOLUMES[i] as number
        const hi = BOX_VOLUMES[i + 1] as number
        const quarters: number[] = []
        for (let q = Math.floor(lo * 4) + 1; q / 4 < hi - 1e-9; q++) quarters.push(q / 4)
        if (quarters.length > 0) return boxItem(rng.pick(quarters), lo, hi)
      }
    },
    () => {
      // A load whose 125% is not itself a standard size.
      for (;;) {
        const load = rng.int(13, 130)
        const need = (load * CONTINUOUS.pct) / 100
        if (!(STANDARD_OCPD as readonly number[]).includes(need)) return continuousItem(load)
      }
    },
    () => {
      for (;;) {
        const v = rng.int(36, 590)
        if (!(STANDARD_OCPD as readonly number[]).includes(v)) return motorFeederItem(v)
      }
    },
    () => {
      for (;;) {
        const v = rng.int(36, 590)
        if (!(STANDARD_OCPD as readonly number[]).includes(v)) return motorFeederItem(v)
      }
    },
  ]
  const items = collect(ROUND_SIZE, (i) => (builders[i % builders.length] as () => DrillItem)())
  return rng.shuffle(items)
}

// ---------------------------------------------------------------------------------------------
// The registry
// ---------------------------------------------------------------------------------------------

export const NUMBER_DRILLS: Drill[] = [
  {
    id: 'percent',
    title: 'Percent to multiplier',
    blurb: '125% is × 1.25, 35% is × 0.35. No % key, ever.',
    howTo: 'Type the number you would multiply by. Example: 125% → 1.25.',
    generate: percentRound,
  },
  {
    id: 'divisor',
    title: 'Pick the divisor',
    blurb: 'VA to amps: ÷ 240 for a house, ÷ 360 for 208 V three-phase, ÷ 831 for 480 V.',
    howTo: 'Tap what you would divide the VA by. The three-phase numbers already have the 1.732 in them.',
    generate: divisorRound,
  },
  {
    id: 'threshold',
    title: 'First part at 100%, the rest at less',
    blurb: 'Subtract, multiply, add back. The rhythm of every demand table.',
    howTo: 'Work it on your calculator: total − first part =, × the rate =, + the first part =. Type the result.',
    generate: thresholdRound,
  },
  {
    id: 'kw',
    title: 'kW to VA',
    blurb: 'Kilo means 1,000: 4.5 kW is 4,500 W.',
    howTo: 'Type the load in W or VA. Multiply by 1,000 on the calculator.',
    generate: kwRound,
  },
  {
    id: 'rounding',
    title: 'Keep or bump up?',
    blurb: 'The trade’s rounding rules: half an amp, .8 of a wire, big enough, motor feeders.',
    howTo: 'Tap which way the number goes. Read the rule under the number first.',
    generate: roundingRound,
  },
]

export function getNumberDrill(id: string): Drill | undefined {
  return NUMBER_DRILLS.find((d) => d.id === id)
}

// ---------------------------------------------------------------------------------------------
// Facts the exam-strategy page prints (the UI reads code values through the content layer)
// ---------------------------------------------------------------------------------------------

export const STRATEGY_FACTS = {
  /** The three-phase divisors of the brain dump: volts × 1.732, rounded. */
  threePhase: SYSTEMS.filter((s) => s.phase === 3).map((s) => ({ volts: s.volts, text: s.text, divisor: s.divisor })),
  sqrt3: SQRT3,
  k: { cu: K_FACTOR.cu, al: K_FACTOR.al },
  refs: {
    standardOcpd: REF.standardOcpd,
    conductorProperties: REF.ch9Table8,
    voltages: REF.voltagesForCalcs,
    vdrop: REF_EXTRA.vdropFormula,
  },
} as const

/** 240.6(A) main list: is this a standard breaker/fuse size? */
export function isStandardOcpd(amps: number): boolean {
  return (STANDARD_OCPD as readonly number[]).includes(amps)
}
