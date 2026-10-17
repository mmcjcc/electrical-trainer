/**
 * Box fill (314.16): count the items the way 314.16(B) counts them, multiply by the volume per conductor
 * (Table 314.16(B)), then pick the smallest standard box (Table 314.16(A)) or check the named one.
 *
 * Counting (2020 NEC):
 *   (B)(1) each conductor from outside the box counts once (spliced, terminated or passing through);
 *          an unbroken loop of 12 in. or more (twice the 6 in. of 300.14) counts twice; a conductor
 *          that never leaves the box (a pigtail, a jumper) does not count;
 *   (B)(2) internal cable clamps, however many: ONE, of the largest conductor;
 *   (B)(3) support fittings (luminaire stud, hickey): ONE for each TYPE, of the largest conductor;
 *   (B)(4) each yoke or strap: TWO, of the largest conductor connected to it (one wire size here);
 *   (B)(5) equipment grounding conductors: up to four count as ONE; each one beyond four adds 1/4
 *          (new in the 2020 NEC; before 2020 all grounds counted as one).
 * Every problem uses one wire size, so every allowance is that size's volume.
 */
import { calc, choose, fmt, given, labelChoices, lookup, makeRng, numericChoices, sum, valueOf, type WrongLabel, type WrongValue } from '@/calc'
import { BOX_VOLUME_PER_CONDUCTOR, STANDARD_BOXES, type StandardBox } from '@/data/tables'
import { BOX_COUNT } from '@/data/tablesExtra'
import { REF } from '@/data/refs'
import type { MistakeValue, ProblemInstance, Recipe, Section, WorkLine } from '@/shared/types'
import { cleanMistakes, opt, ruleLine, word } from '../kit'

const ID = 'box-fill'

type WireSize = '14' | '12' | '10'
type BoxKind = StandardBox['kind']

export interface BoxParams {
  size: WireSize
  method: 'nm' | 'conduit'
  /** NM: insulated conductors per cable (2 for x/2, 3 for x/3); every cable has a ground. */
  cables: number[]
  /** Conduit: conductors spliced or terminated, conductors passing straight through, long loops, EGCs. */
  spliced: number
  through: number
  loops: number
  egcs: number
  /** Yokes: switches and receptacles, and whether one of them is a combination device on one yoke. */
  devices: ('switch' | 'receptacle' | 'combo')[]
  clampsPresent: number
  studTypes: ('stud' | 'hickey')[]
  pigtails: number
  ask: 'volume' | 'pick'
  /** For `volume`: the box named in the story, checked at the end. */
  namedBox?: string
}

const DEVICE_TEXT = { switch: 'single-pole switch', receptacle: 'duplex receptacle', combo: 'combination switch and receptacle on one yoke' }

/** All the counts, in one place (the lines and the wrong answers both use them). */
export function boxCounts(p: BoxParams): {
  conductors: number; loops2: number; clamps: number; support: number; devices: number; egcCount: number; egc: number; total: number
} {
  const conductors = p.method === 'nm' ? p.cables.reduce((s, c) => s + c, 0) : p.spliced + p.through
  const loops2 = p.loops * BOX_COUNT.loopCounts
  const clamps = p.clampsPresent > 0 ? 1 : 0
  const support = new Set(p.studTypes).size
  const devices = p.devices.length * BOX_COUNT.perYoke
  const egcCount = p.method === 'nm' ? p.cables.length : p.egcs
  const egc = egcCount === 0 ? 0 : 1 + Math.max(0, egcCount - BOX_COUNT.egcSingleUpTo) * BOX_COUNT.egcExtraEach
  return { conductors, loops2, clamps, support, devices, egcCount, egc, total: conductors + loops2 + clamps + support + devices + egc }
}

function boxesOf(kind: BoxKind): StandardBox[] {
  return STANDARD_BOXES.filter((b) => b.kind === kind).sort((a, b) => a.volume - b.volume)
}

function kindFor(p: BoxParams): BoxKind {
  if (p.studTypes.length > 0) return 'round'
  if (p.devices.length === 1 && p.method === 'nm') return 'device'
  return 'square'
}

function pick(seed: number): BoxParams {
  const rng = makeRng(seed)
  for (let tries = 0; tries < 400; tries++) {
    const size = rng.pick(['14', '12', '12', '10'] as const)
    const method = rng.chance(0.65) ? 'nm' : 'conduit'
    const ceiling = rng.chance(0.2)
    const manyGrounds = rng.chance(0.2)
    const nCables = method === 'nm' ? (manyGrounds ? rng.int(5, 6) : rng.int(1, 4)) : 0
    const cables = Array.from({ length: nCables }, () => (rng.chance(0.65) ? 2 : 3))
    const spliced = method === 'conduit' ? rng.int(2, 8) : 0
    const through = method === 'conduit' && rng.chance(0.4) ? rng.int(1, 2) : 0
    const loops = method === 'conduit' && rng.chance(0.4) ? rng.int(1, 2) : 0
    const egcs = method === 'conduit' ? (manyGrounds && spliced >= 6 ? rng.int(5, 6) : rng.int(1, 3)) : 0
    const nDevices = ceiling ? 0 : rng.pick([0, 1, 1, 2, 2])
    const devices = Array.from({ length: nDevices }, () => rng.pick(['switch', 'receptacle', 'receptacle', 'combo'] as const))
    if (devices.filter((d) => d === 'combo').length > 1) continue
    const clampsPresent = method === 'nm' && rng.chance(0.85) ? 2 : 0
    const studTypes: ('stud' | 'hickey')[] = ceiling ? (rng.chance(0.3) ? ['stud', 'hickey'] : ['stud']) : []
    const pigtails = rng.chance(0.6) ? rng.int(1, 3) : 0
    // Only three round boxes are listed: too few for four exam options, so a ceiling box asks the volume.
    const ask = !ceiling && rng.chance(0.55) ? 'pick' : 'volume'
    const p: BoxParams = { size, method, cables, spliced, through, loops, egcs, devices, clampsPresent, studTypes, pigtails, ask }
    const { total } = boxCounts(p)
    if (total < 3) continue
    const need = total * (BOX_VOLUME_PER_CONDUCTOR[size] as number)
    const list = boxesOf(kindFor(p))
    const fit = list.find((b) => b.volume >= need - 1e-9)
    if (!fit) continue
    // Not right at the edge of the smallest box (the problem would have no "too small" option).
    if (ask === 'pick' && fit === list[0] && list.length > 1 && rng.chance(0.7)) continue
    if (ask === 'volume') p.namedBox = rng.pick(list).id
    return p
  }
  return { size: '12', method: 'nm', cables: [2, 2, 3], spliced: 0, through: 0, loops: 0, egcs: 0, devices: ['receptacle', 'switch'], clampsPresent: 2, studTypes: [], pigtails: 3, ask: 'pick' }
}

function itemsText(p: BoxParams): string[] {
  const s = p.size
  const out: string[] = []
  if (p.method === 'nm') {
    const n2 = p.cables.filter((c) => c === 2).length
    const n3 = p.cables.filter((c) => c === 3).length
    if (n2) out.push(`${word(n2)} ${s}/2 NM cable${n2 > 1 ? 's' : ''} with ground`)
    if (n3) out.push(`${word(n3)} ${s}/3 NM cable${n3 > 1 ? 's' : ''} with ground`)
  } else {
    out.push(`${word(p.spliced)} ${s} AWG conductors spliced or connected in the box`)
    if (p.through) out.push(`${word(p.through)} ${s} AWG conductor${p.through > 1 ? 's' : ''} passing straight through without a splice`)
    if (p.loops) out.push(`${word(p.loops)} unbroken ${s} AWG conductor${p.loops > 1 ? 's' : ''} looped 12 in. or more inside the box`)
    out.push(`${word(p.egcs)} ${s} AWG equipment grounding conductor${p.egcs > 1 ? 's' : ''} entering the box`)
  }
  for (const [d, n] of Object.entries(countBy(p.devices))) out.push(`${word(n)} ${DEVICE_TEXT[d as keyof typeof DEVICE_TEXT]}${n > 1 && d !== 'combo' ? 'es'.slice(d === 'switch' ? 0 : 1) : ''}`)
  if (p.clampsPresent) out.push(`${word(p.clampsPresent)} internal cable clamps`)
  if (p.studTypes.includes('stud')) out.push('one luminaire stud')
  if (p.studTypes.includes('hickey')) out.push('one hickey')
  if (p.pigtails) out.push(`${word(p.pigtails)} pigtail${p.pigtails > 1 ? 's' : ''} that stay${p.pigtails > 1 ? '' : 's'} inside the box`)
  return out
}

function countBy<T extends string>(xs: T[]): Partial<Record<T, number>> {
  const out: Partial<Record<T, number>> = {}
  for (const x of xs) out[x] = (out[x] ?? 0) + 1
  return out
}

function joinList(xs: string[]): string {
  return xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`
}

export function buildBoxFill(p: BoxParams, seed: number): ProblemInstance {
  const rng = makeRng(seed ^ 0xb0c5)
  const c = boxCounts(p)
  const per = BOX_VOLUME_PER_CONDUCTOR[p.size] as number
  const kind = kindFor(p)
  const list = boxesOf(kind)
  const items = itemsText(p)
  const named = p.namedBox ? STANDARD_BOXES.find((b) => b.id === p.namedBox) : undefined
  const kindText = { round: 'a 4 in. round or octagonal box', square: 'a square box', device: 'a device box' }[kind]
  const ceiling = p.studTypes.length ? ' at a ceiling luminaire outlet' : ''
  const where = named ? `A ${named.label}${named.kind === 'device' ? '' : ' metal box'}${ceiling}` : p.studTypes.length ? 'A ceiling outlet box for a luminaire' : 'A metal box'
  const story =
    `${where} contains ${joinList(items)}. All conductors are ${p.size} AWG. ` +
    (p.ask === 'volume'
      ? 'What is the minimum volume, in cubic inches, the box must have?'
      : `What is the smallest standard metal box of this type (${kindText}) permitted?`)

  const S_COUNT = 'count'
  const S_VOL = 'volume'
  const S_BOX = 'box'
  const lines: WorkLine[] = []
  const parts: number[] = []

  // ---- C: count -------------------------------------------------------------------------------------------
  if (p.method === 'nm') {
    lines.push(sum({
      id: 'conductors', label: 'Insulated conductors from the cables',
      say: `Add up the insulated (hot and neutral) conductors of each cable: a /2 cable has 2, a /3 cable has 3. Leave the grounds for later.`,
      why: 'Every wire that comes in from outside counts once (314.16(B)(1)). The bare grounds have their own rule.',
      ref: REF.boxConductorCount,
      parts: p.cables, unit: 'count', tol: { abs: 0 },
      mistakes: cleanMistakes(c.conductors, { abs: 0 }, [
        { value: c.conductors + p.cables.length, mistake: 'box_grounds_each', message: 'You counted each ground with the cable. Count only the insulated conductors here; all the grounds together are one line below.' },
      ]),
      section: S_COUNT,
    }))
  } else {
    const say = 'Add the conductors spliced in the box and the ones passing straight through. Each counts once.'
    const why = 'A wire that passes through without a splice still takes room: it counts once, the same as a spliced one.'
    lines.push(p.through
      ? sum({
          id: 'conductors', label: 'Conductors from outside', say, why, ref: REF.boxConductorCount,
          parts: [p.spliced, p.through], unit: 'count', tol: { abs: 0 },
          mistakes: cleanMistakes(c.conductors, { abs: 0 }, [
            { value: p.spliced, mistake: 'skipped_operation', message: 'The conductors that pass straight through count too: once each.' },
            { value: p.spliced + 2 * p.through, mistake: 'box_loop_once', message: 'A wire passing straight through counts once. Only a loop of 12 in. or more counts twice.' },
          ]),
          section: S_COUNT,
        })
      : given({
          id: 'conductors', label: 'Conductors from outside', say: 'Write down the conductors spliced or connected in the box. Each counts once.', why,
          ref: REF.boxConductorCount, value: p.spliced, unit: 'count', section: S_COUNT,
        }))
  }
  parts.push(c.conductors)
  if (p.loops) {
    lines.push(calc({
      id: 'loops', label: 'Long loops',
      say: 'Each unbroken loop of 12 in. or more counts as two.',
      why: 'A long loop takes as much room as two wires (314.16(B)(1)).',
      ref: REF.boxConductorCount,
      a: p.loops, op: '×', b: BOX_COUNT.loopCounts, unit: 'count', tol: { abs: 0 },
      mistakes: [{ value: p.loops, mistake: 'box_loop_once', message: 'A loop of 12 in. or more counts as TWO conductors.' }],
      section: S_COUNT, checkpoint: true,
    }))
    parts.push(c.loops2)
  }
  if (p.clampsPresent) {
    lines.push(lookup({
      id: 'clamps', label: 'Internal cable clamps',
      say: `There are ${word(p.clampsPresent)} internal clamps. How many conductors do they count as, all together?`,
      why: 'Clamps inside the box take room; the code gives them one allowance however many there are (314.16(B)(2)).',
      ref: REF.boxClamps,
      value: 1, unit: 'count', tol: { abs: 0 },
      mistakes: [{ value: p.clampsPresent, mistake: 'box_clamps_each', message: 'All the internal clamps together count as ONE.' }],
      section: S_COUNT, checkpoint: true,
    }))
    parts.push(1)
  }
  if (p.studTypes.length) {
    lines.push(lookup({
      id: 'support', label: 'Support fittings',
      say: `Count one for each TYPE of fitting: ${p.studTypes.length === 2 ? 'a stud and a hickey are two types' : 'one luminaire stud'}.`,
      ref: REF.boxSupportFittings,
      value: c.support, unit: 'count', tol: { abs: 0 },
      mistakes: cleanMistakes(c.support, { abs: 0 }, [
        c.support === 2 && { value: 1, mistake: 'box_support_fitting_missed', message: 'A stud and a hickey are two different types: one each.' },
        { value: c.support * 2, mistake: 'box_device_one', message: 'Support fittings count ONE per type, not two like a device.' },
      ]),
      section: S_COUNT, checkpoint: true,
    }))
    parts.push(c.support)
  }
  if (p.devices.length) {
    const hasCombo = p.devices.includes('combo')
    lines.push(calc({
      id: 'devices', label: 'Devices (yokes)',
      say: `Count the yokes (straps): ${p.devices.length}.${hasCombo ? ' A combination device on one yoke is ONE yoke.' : ''} Each yoke counts as two.`,
      why: 'A device fills the box with its body and its terminals: two conductors’ worth for each yoke (314.16(B)(4)).',
      ref: REF.boxDevices,
      a: p.devices.length, op: '×', b: BOX_COUNT.perYoke, unit: 'count', tol: { abs: 0 },
      mistakes: cleanMistakes(c.devices, { abs: 0 }, [
        { value: p.devices.length, mistake: 'box_device_one', message: 'Each yoke counts as TWO conductors.' },
        hasCombo && { value: (p.devices.length + 1) * 2, mistake: 'box_device_one', message: 'The combination switch and receptacle share one yoke: it counts two, not four.' },
      ]),
      section: S_COUNT, checkpoint: true,
    }))
    parts.push(c.devices)
  }
  // Grounds
  if (c.egcCount <= BOX_COUNT.egcSingleUpTo) {
    lines.push(lookup({
      id: 'egc', label: 'Equipment grounding conductors',
      say: `There ${c.egcCount > 1 ? 'are' : 'is'} ${word(c.egcCount)} ground${c.egcCount > 1 ? 's' : ''} entering. Up to four count as one, all together.`,
      why: 'The grounds are usually bundled together; the code gives up to four of them a single allowance (314.16(B)(5)).',
      ref: REF.boxEgc,
      value: 1, unit: 'count', tol: { abs: 0 },
      mistakes: cleanMistakes(1, { abs: 0 }, [
        c.egcCount > 1 && { value: c.egcCount, mistake: 'box_grounds_each', message: 'Up to four grounds count as ONE all together.' },
      ]),
      section: S_COUNT, checkpoint: c.egcCount > 1,
    }))
  } else {
    const extra = c.egcCount - BOX_COUNT.egcSingleUpTo
    lines.push(calc({
      id: 'egcExtra', label: 'Grounds beyond four',
      say: `There are ${word(c.egcCount)} grounds. The first four count as one. Each one beyond four adds 1/4: ${extra} × 0.25.`,
      why: '2020 NEC: a box with many grounds gets a little more room for them (314.16(B)(5)).',
      ref: REF.boxEgc,
      a: extra, op: '×', b: BOX_COUNT.egcExtraEach, unit: 'count', tol: { abs: 0.01 },
      mistakes: [{ value: extra, mistake: 'box_grounds_each', message: `Each ground beyond four adds only a QUARTER: ${extra} × 0.25.` }],
      section: S_COUNT, checkpoint: true,
    }))
    lines.push(sum({
      id: 'egc', label: 'Equipment grounding conductors',
      say: 'Add the one allowance for the first four.',
      ref: REF.boxEgc,
      parts: [1, extra * BOX_COUNT.egcExtraEach], unit: 'count', tol: { abs: 0.01 },
      mistakes: cleanMistakes(c.egc, { abs: 0.01 }, [
        { value: 1, mistake: 'box_egc_quarter', message: `2020 NEC: more than four grounds: each one beyond four adds 1/4. ${extra} extra = ${fmt(extra * 0.25)}.` },
        { value: c.egcCount, mistake: 'box_grounds_each', message: 'The grounds do not count one each: the first four are one, then 1/4 for each extra.' },
      ]),
      section: S_COUNT,
    }))
  }
  parts.push(c.egc)
  if (p.pigtails) {
    lines.push(choose({
      id: 'pigtails', label: 'Do the pigtails count?',
      say: p.pigtails > 1 ? `The ${word(p.pigtails)} pigtails start and end inside the box. Count them?` : 'The pigtail starts and ends inside the box. Count it?',
      why: 'A wire no part of which leaves the box does not count (314.16(B)(1)).',
      ref: REF.boxConductorCount,
      options: [
        opt('no', 'No: they never leave the box'),
        opt('yes', 'Yes: count each one', 'A pigtail never leaves the box, so it does not count.', 'box_pigtail_counted'),
      ],
      answerId: 'no',
      section: S_COUNT, checkpoint: true,
    }))
  }
  const totalMistakes: (MistakeValue | false)[] = [
    p.pigtails > 0 && { value: c.total + p.pigtails, mistake: 'box_pigtail_counted', message: 'Leave the pigtails out: they never leave the box.' },
    p.devices.length > 0 && { value: c.total - p.devices.length, mistake: 'box_device_one', message: 'Each yoke counts two, not one.' },
    c.egcCount > 1 && { value: c.total - c.egc + c.egcCount, mistake: 'box_grounds_each', message: 'The grounds count as one allowance (plus 1/4 each beyond four), not one each.' },
    p.clampsPresent > 1 && { value: c.total + p.clampsPresent - 1, mistake: 'box_clamps_each', message: 'All the clamps together count as one.' },
  ]
  lines.push(sum({
    id: 'total', label: `Total, in ${p.size} AWG conductors`,
    say: 'Add up the counts above.',
    parts, unit: 'count', tol: { abs: 0.01 },
    mistakes: cleanMistakes(c.total, { abs: 0.01 }, totalMistakes),
    section: S_COUNT,
  }))

  // ---- V: volume -------------------------------------------------------------------------------------------
  const neighbours: MistakeValue[] = (['14', '12', '10', '8'] as const)
    .filter((s) => s !== p.size)
    .map((s) => ({ value: BOX_VOLUME_PER_CONDUCTOR[s] as number, mistake: 'box_volume_row', message: `That is the ${s} AWG volume. The wires are ${p.size} AWG.` }))
  lines.push(lookup({
    id: 'per', label: `Volume for each ${p.size} AWG`,
    say: `Table 314.16(B): the ${p.size} AWG row, cubic inches per conductor.`,
    ref: REF.boxPerConductor,
    value: per, unit: 'in3',
    mistakes: cleanMistakes(per, { rel: 0.001 }, neighbours),
    section: S_VOL, checkpoint: true,
  }))
  const need = c.total * per
  lines.push(calc({
    id: 'need', label: 'Minimum box volume',
    say: 'Multiply the count by the volume for each conductor.',
    a: c.total, op: '×', b: per, unit: 'in3', decimals: 2,
    mistakes: cleanMistakes(need, undefined, [
      ...totalMistakes.map((m) => m && { ...m, value: m.value * per }),
      ...neighbours.map((n) => ({ value: c.total * n.value, mistake: 'box_volume_row', message: `Multiply by the ${p.size} AWG volume, ${fmt(per)} in³.` })),
    ]),
    section: S_VOL, checkpoint: p.ask === 'volume',
  }))

  // ---- B: the box ---------------------------------------------------------------------------------------------
  let answerLine = 'need'
  let choices
  const wrongCounts: { total: number; mistake: string; why: string }[] = [
    ...(p.pigtails ? [{ total: c.total + p.pigtails, mistake: 'box_pigtail_counted', why: 'Counted the pigtails; they never leave the box.' }] : []),
    ...(p.devices.length ? [{ total: c.total - p.devices.length, mistake: 'box_device_one', why: 'Counted each device as one instead of two.' }] : []),
    ...(c.egcCount > 1 ? [{ total: c.total - c.egc + c.egcCount, mistake: 'box_grounds_each', why: 'Counted every ground separately.' }] : []),
    ...(c.egcCount > 4 ? [{ total: c.total - c.egc + 1, mistake: 'box_egc_quarter', why: 'Missed the 1/4 allowance for each ground beyond four (2020 NEC).' }] : []),
    ...(p.loops ? [{ total: c.total - p.loops, mistake: 'box_loop_once', why: 'Counted each long loop once instead of twice.' }] : []),
    ...(p.clampsPresent > 1 ? [{ total: c.total + p.clampsPresent - 1, mistake: 'box_clamps_each', why: 'Counted each clamp.' }] : []),
  ]
  if (p.ask === 'pick') {
    const fit = list.find((b) => b.volume >= need - 1e-9) as StandardBox
    const fi = list.indexOf(fit)
    const below = list[fi - 1]
    lines.push(ruleLine({
      id: 'boxVolume', kind: 'lookup', label: 'Smallest box volume that is enough',
      say: `Table 314.16(A), the ${kind === 'device' ? 'device boxes' : kind === 'round' ? 'round and octagonal boxes' : 'square boxes'}: the first volume of ${fmt(need, 2)} in³ or more.`,
      why: 'Big enough means round UP to the next box.',
      ref: REF.boxVolumes,
      value: fit.volume, unit: 'in3',
      expr: `${fmt(need, 2)} in³ → ${fmt(fit.volume)} in³`,
      mistakes: cleanMistakes(fit.volume, { rel: 0.001 }, [
        below && { value: below.volume, mistake: 'rounded_wrong_way', message: `${fmt(below.volume)} in³ is less than the ${fmt(need, 2)} in³ you need.` },
        list[fi + 1] && { value: list[fi + 1]!.volume, mistake: 'unknown', message: `That box is bigger than needed: ${fmt(fit.volume)} in³ is already at least ${fmt(need, 2)} in³.` },
      ]),
      section: S_BOX, checkpoint: true,
    }))
    lines.push(choose({
      id: 'box', label: 'Smallest box',
      say: `Which box is the ${fmt(fit.volume)} in³ row?`,
      ref: REF.boxVolumes,
      options: list.map((b, i) => b === fit
        ? opt(b.id, b.label)
        : i < fi
          ? opt(b.id, b.label, `${b.label}: ${fmt(b.volume)} in³, less than the ${fmt(need, 2)} in³ needed.`, 'rounded_wrong_way')
          : opt(b.id, b.label, `It fits, but the ${fit.label} (${fmt(fit.volume)} in³) is smaller and still enough.`)),
      answerId: fit.id,
      section: S_BOX,
    }))
    answerLine = 'box'
    const wrongs: WrongLabel[] = []
    for (const w of wrongCounts) {
      const b = list.find((x) => x.volume >= w.total * per - 1e-9)
      if (b && b !== fit) wrongs.push({ label: b.label, mistake: w.mistake, why: w.why })
    }
    if (below) wrongs.push({ label: below.label, mistake: 'rounded_wrong_way', why: `Too small: ${fmt(below.volume)} in³ is under the ${fmt(need, 2)} in³ needed.` })
    choices = labelChoices(fit.label, wrongs, list.map((b) => b.label))
  } else {
    const wrongs: WrongValue[] = [
      ...wrongCounts.map((w) => ({ value: w.total * per, mistake: w.mistake, why: w.why })),
      ...neighbours.map((n) => ({ value: c.total * n.value, mistake: 'box_volume_row', why: 'Used the volume for the wrong wire size.' })),
    ]
    choices = numericChoices(valueOf(lines, 'need'), wrongs, rng, { unit: 'in3', decimals: 2 })
    if (named) {
      lines.push(lookup({
        id: 'namedVolume', label: 'Volume of the box in the question',
        say: `Table 314.16(A): the ${named.label} row.`,
        ref: REF.boxVolumes,
        value: named.volume, unit: 'in3',
        section: S_BOX,
      }))
      const ok = named.volume >= need - 1e-9
      lines.push(choose({
        id: 'check', label: 'Is that box big enough?',
        say: `Compare ${fmt(named.volume)} in³ with the ${fmt(need, 2)} in³ needed.`,
        ref: REF.boxFill,
        options: [
          opt('yes', 'Yes: it has at least the volume needed', ok ? undefined : `${fmt(named.volume)} in³ is less than ${fmt(need, 2)} in³: too small.`, ok ? undefined : 'rounded_wrong_way'),
          opt('no', 'No: it is too small', ok ? `${fmt(named.volume)} in³ is at least ${fmt(need, 2)} in³: it is big enough.` : undefined, ok ? 'unknown' : undefined),
        ],
        answerId: ok ? 'yes' : 'no',
        section: S_BOX, checkpoint: true,
      }))
    }
  }

  const sections: Section[] = [
    { id: S_COUNT, label: 'Count the conductors', totalLine: 'total', letter: 'C' },
    { id: S_VOL, label: 'Volume needed', totalLine: 'need', letter: 'V' },
    ...(lines.some((l) => l.section === S_BOX) ? [{ id: S_BOX, label: 'The box', totalLine: p.ask === 'pick' ? 'box' : 'check', letter: 'B' }] : []),
  ]

  const visualItems = [
    { item: p.method === 'nm' ? 'Insulated conductors from the cables' : 'Conductors from outside', counts: c.conductors },
    ...(p.loops ? [{ item: 'Long loops (2 each)', counts: c.loops2 }] : []),
    ...(p.clampsPresent ? [{ item: 'Internal clamps (one for all)', counts: 1 }] : []),
    ...(p.studTypes.length ? [{ item: 'Support fittings (one per type)', counts: c.support }] : []),
    ...(p.devices.length ? [{ item: 'Devices (2 per yoke)', counts: c.devices }] : []),
    { item: c.egcCount > 4 ? 'Grounds (one for four, + 1/4 each extra)' : 'Grounds (one for all)', counts: c.egc },
    ...(p.pigtails ? [{ item: 'Pigtails (do not count)', counts: 0 }] : []),
  ]

  return {
    recipeId: ID,
    seed,
    story,
    givens: [
      { id: 'size', label: 'Wire size', value: Number(p.size), unit: 'awg', phrase: `${p.size} AWG` },
      ...items.map((t, i) => ({ id: `item${i}`, label: 'In the box', value: 0, unit: 'none' as const, phrase: t })),
    ],
    ask: p.ask === 'volume' ? 'the minimum box volume in cubic inches' : `the smallest standard box (${kindText})`,
    lines,
    sections,
    answerLine,
    choices,
    visual: { kind: 'box', wireSize: p.size, items: visualItems, total: c.total, perConductor: per, need, boxKind: kind, namedBox: named?.label },
  }
}

function generate(seed: number): ProblemInstance {
  return buildBoxFill(pick(seed), seed)
}

export const boxFill: Recipe = {
  id: ID,
  family: 'box',
  title: 'Box fill',
  blurb: 'Count every item the way 314.16(B) counts it, multiply by the volume per wire, then pick the box.',
  topic: 'calculations',
  editions: ['2020'],
  generate,
  card: {
    whenToUse: 'The question lists what is in a box (cables, devices, clamps, grounds) and asks for the volume or the smallest box.',
    steps: [
      { label: 'Wires from outside', how: 'Each insulated conductor that comes in counts once. A loop of 12 in. or more counts two.', ref: REF.boxConductorCount },
      { label: 'Clamps', how: 'Internal clamps: one, however many.', ref: REF.boxClamps },
      { label: 'Support fittings', how: 'Luminaire stud, hickey: one for each type.', ref: REF.boxSupportFittings },
      { label: 'Devices', how: 'Two for each yoke.', ref: REF.boxDevices },
      { label: 'Grounds', how: 'Up to four: one. Beyond four: add 1/4 each (2020 NEC).', ref: REF.boxEgc },
      { label: 'Pigtails', how: 'Wires that never leave the box: zero.', ref: REF.boxConductorCount },
      { label: 'Volume', how: 'Total × the Table 314.16(B) volume for the wire size.', ref: REF.boxPerConductor },
      { label: 'Box', how: 'Table 314.16(A): the first box with at least that volume.', ref: REF.boxVolumes },
    ],
    traps: [
      'Pigtails do not count.',
      'All the grounds together count as one (2020: plus 1/4 for each beyond four).',
      'All the clamps together count as one.',
      'Each yoke counts as TWO, even a combination device on one yoke.',
      'Volume per wire: 14 AWG 2.00, 12 AWG 2.25, 10 AWG 2.50 in³.',
    ],
    formulas: ['Box volume needed = total count × volume per conductor'],
  },
}
