/**
 * Raceway fill, same-size conductors: "How many 12 AWG THHN may be installed in 3/4 in. EMT?"
 * Method (Chapter 9): the raceway's allowed area (Table 4, the percent column from Table 1) divided
 * by one conductor's area (Table 5), rounded down unless the decimal is .8 or more (Note 7).
 * Annex C prints the same answer, which is the quick check on the exam.
 *
 * The reference recipe: other recipes follow its shape (story, givens, lines, choices, card).
 */
import {
  calc, choose, conductorsThatFit, fmt, lookup, makeRng, numericChoices, type WrongValue,
} from '@/calc'
import {
  AWG_SIZES, conductorArea, CONDUCTOR_AREA, FILL_PCT, RACEWAY_NAME, racewayArea, racewaySizes,
  sizeLabel, tradeLabel, type ConductorSize, type FillCase, type Insulation, type RacewayType, type TradeSize,
} from '@/data/tables'
import { REF } from '@/data/refs'
import type { CodeRef, MistakeValue, ProblemInstance, Recipe } from '@/shared/types'

const ID = 'raceway-same-size'

const RACEWAYS: RacewayType[] = ['EMT', 'EMT', 'EMT', 'RMC', 'IMC', 'PVC40', 'PVC80', 'FMC']
const INSULATIONS: Insulation[] = ['THHN', 'THHN', 'THHN', 'THW', 'XHHW']
const SIZES: ConductorSize[] = ['14', '12', '12', '10', '10', '8', '6', '4', '3', '2', '1', '1/0', '2/0', '3/0', '4/0', '250', '350', '500']

const ANNEX_C_REF: Record<RacewayType, CodeRef> = {
  EMT: REF.annexC_EMT, IMC: REF.annexC_IMC, RMC: REF.annexC_RMC, PVC40: REF.annexC_PVC40,
  PVC80: REF.annexC_PVC80, FMC: REF.annexC_FMC,
}

const SHORT: Record<RacewayType, string> = {
  EMT: 'EMT', IMC: 'IMC', RMC: 'rigid metal conduit (RMC)', PVC40: 'Schedule 40 PVC conduit',
  PVC80: 'Schedule 80 PVC conduit', FMC: 'flexible metal conduit (FMC)',
}

const FILL_LABEL: Record<FillCase, string> = {
  one: '53% (one conductor)',
  two: '31% (two conductors)',
  over2: '40% (over two conductors)',
  nipple: '60% (a nipple 24 in. or shorter)',
}

interface Pick {
  raceway: RacewayType
  trade: TradeSize
  ins: Insulation
  size: ConductorSize
  nipple: boolean
}

/** Chooses a combination whose answer is a sensible count (3 to 40). */
function pick(seed: number): Pick {
  const rng = makeRng(seed)
  for (let tries = 0; tries < 200; tries++) {
    const raceway = rng.pick(RACEWAYS)
    const ins = rng.pick(INSULATIONS)
    const size = rng.pick(SIZES)
    if (CONDUCTOR_AREA[ins][size] === undefined) continue
    const trade = rng.pick(racewaySizes(raceway))
    const nipple = rng.chance(0.15)
    const n = conductorsThatFit(racewayArea(raceway, trade, nipple ? 'nipple' : 'over2'), conductorArea(ins, size))
    if (n >= 3 && n <= 40) return { raceway, trade, ins, size, nipple }
  }
  return { raceway: 'EMT', trade: '3/4', ins: 'THHN', size: '12', nipple: false }
}

function generate(seed: number): ProblemInstance {
  const rng = makeRng(seed ^ 0x5eed)
  const { raceway, trade, ins, size, nipple } = pick(seed)
  const fill: FillCase = nipple ? 'nipple' : 'over2'
  const allowed = racewayArea(raceway, trade, fill)
  const wire = conductorArea(ins, size)
  const exact = allowed / wire
  const answer = conductorsThatFit(allowed, wire)
  const whole = Math.floor(exact + 1e-9)
  const roundedUpAtPoint8 = answer > whole

  const tradeText = tradeLabel(trade)
  const sizeText = `${sizeLabel(size)} ${ins}`
  const racewayText = nipple ? `an ${tradeText} ${SHORT[raceway]} nipple 18 in. long` : `${tradeText} ${SHORT[raceway]}`
  const story =
    `What is the maximum number of ${sizeText} copper conductors permitted in ${racewayText}? ` +
    `All conductors are the same size.`

  // ---- the wrong values, each from a real mistake ---------------------------------------------------
  const total = racewayArea(raceway, trade, 'one') / 0.53 // the 100% column, recomputed from the table
  const total100 = Math.round(total * 1000) / 1000
  const at40 = racewayArea(raceway, trade, 'over2')
  const otherIns: Insulation = ins === 'THHN' ? 'THW' : 'THHN'
  const otherWire = CONDUCTOR_AREA[otherIns][size]
  const sizeIdx = AWG_SIZES.indexOf(size)
  const neighbour = AWG_SIZES[sizeIdx + 1] ?? AWG_SIZES[sizeIdx - 1]
  const neighbourWire = neighbour ? CONDUCTOR_AREA[ins][neighbour] : undefined

  const areaMistakes: MistakeValue[] = [
    { value: total100, mistake: 'used_100pct_area', message: `That is the total (100%) area. With ${nipple ? 'a nipple' : 'more than two wires'}, use the ${FILL_PCT[fill]}% column of Table 4.` },
    ...(nipple ? [{ value: at40, mistake: 'wrong_fill_percent', message: 'That is the 40% column. A nipple 24 in. or shorter may be filled to 60% (Chapter 9, Note 4).' }] : []),
    { value: racewayArea(raceway, trade, 'one'), mistake: 'wrong_fill_percent', message: 'That is the 53% column, for one wire only. Many wires: 40% (60% for a short nipple).' },
    { value: racewayArea(raceway, trade, 'two'), mistake: 'wrong_fill_percent', message: 'That is the 31% column, for exactly two wires. More than two: 40%.' },
  ].filter((m) => Math.abs(m.value - allowed) > 1e-9)

  const wireMistakes: MistakeValue[] = [
    ...(otherWire !== undefined && otherWire !== wire
      ? [{ value: otherWire, mistake: 'wrong_insulation_column', message: `That is the ${otherIns} row. The question says ${ins}: find ${ins} in Table 5, then the ${sizeLabel(size)} line.` }]
      : []),
    ...(neighbourWire !== undefined && neighbourWire !== wire && neighbour
      ? [{ value: neighbourWire, mistake: 'unknown', message: `That is the ${sizeLabel(neighbour)} line. Slide down to ${sizeLabel(size)}.` }]
      : []),
  ]

  const roundMistakes: MistakeValue[] = roundedUpAtPoint8
    ? [{ value: whole, mistake: 'ignored_note7', message: `${fmt(exact, 2)} ends in .8 or more, so Note 7 lets you go up to ${answer}.` }]
    : [
        ...(whole + 1 !== answer
          ? [{ value: whole + 1, mistake: 'rounded_count_up', message: `You cannot pull ${fmt(exact, 2)} wires, and the decimal is under .8: round DOWN to ${whole}.` }]
          : []),
      ]

  const lines = [
    choose({
      id: 'fillcase',
      label: 'Which fill percent?',
      say: `Count the wires: ${nipple ? 'this is a short nipple' : 'more than two'}. Pick the percent from Chapter 9, Table 1${nipple ? ' and its Note 4' : ''}.`,
      why: 'The more wires, the less of the pipe you may fill, so they can be pulled without damage. A short nipple is the exception.',
      ref: nipple ? REF.ch9Note4Nipple : REF.ch9Table1,
      options: (['one', 'two', 'over2', 'nipple'] as FillCase[]).map((f) => ({
        id: f,
        label: FILL_LABEL[f],
        feedback:
          f === 'one' ? '53% is for a single wire.'
          : f === 'two' ? '31% is for exactly two wires.'
          : f === 'nipple' ? 'Only a nipple 24 in. or shorter gets 60%. This is a full run.'
          : 'This is a nipple 24 in. or shorter: Note 4 allows 60%.',
        mistake: 'wrong_fill_percent',
      })),
      answerId: fill,
      checkpoint: true,
    }),
    lookup({
      id: 'allowed',
      label: `Allowed area of ${tradeText} ${raceway}`,
      say: `In Chapter 9, Table 4, find the ${RACEWAY_NAME[raceway]} section, the ${tradeText} row, and read the ${FILL_PCT[fill]}% column.`,
      why: 'This is how much of the inside of the pipe the wires may take up.',
      ref: REF.ch9Table4,
      value: allowed,
      unit: 'in2',
      mistakes: areaMistakes,
      sanity: `A ${tradeText} pipe gives you well under one square inch until you get past 1-1/4 in.`,
    }),
    lookup({
      id: 'wire',
      label: `Area of one ${sizeText}`,
      say: `In Chapter 9, Table 5, find type ${ins}, then the ${sizeLabel(size)} line, and read the area in square inches.`,
      why: 'Each wire, with its insulation, takes up this much room.',
      ref: REF.ch9Table5,
      value: wire,
      unit: 'in2',
      mistakes: wireMistakes,
    }),
    calc({
      id: 'divide',
      label: 'How many fit (before rounding)',
      say: 'Divide the allowed area by the area of one wire.',
      why: 'Room available ÷ room per wire = how many wires.',
      a: allowed,
      op: '÷',
      b: wire,
      unit: 'count',
      decimals: 2,
      tol: { rel: 0.01 },
    }),
    calc({
      id: 'count',
      label: 'Maximum number of conductors',
      say: 'Round DOWN to a whole wire, unless the decimal is .8 or more (then round up).',
      why: 'You cannot pull part of a wire. Chapter 9, Note 7 allows the next whole number at .8 or more.',
      ref: REF.ch9Note7,
      a: exact,
      op: '×',
      b: 1,
      round: () => answer,
      unit: 'count',
      tol: { abs: 0 },
      mistakes: roundMistakes,
      sanity: `Annex C prints the same number: ${answer}.`,
      checkpoint: true,
    }),
  ]
  // The rounding line is not a real multiplication; drop the operands so the generic detectors do
  // not read "× 1" as a step he skipped, and show the rule instead of keystrokes.
  const countLine = lines[4]!
  delete countLine.operands
  countLine.expr = `${fmt(exact, 2)} → ${answer}`
  countLine.keys = undefined

  const wrongs: WrongValue[] = [
    roundedUpAtPoint8
      ? { value: whole, mistake: 'ignored_note7', why: `Rounded ${fmt(exact, 2)} down; Note 7 allows the next whole number at .8 or more.` }
      : { value: whole + 1, mistake: 'rounded_count_up', why: `Rounded ${fmt(exact, 2)} up; under .8 you must round down.` },
    { value: Math.floor(total100 / wire), mistake: 'used_100pct_area', why: 'Used the total (100%) area of the raceway instead of the allowed percent.' },
    ...(otherWire !== undefined && otherWire !== wire
      ? [{ value: conductorsThatFit(allowed, otherWire), mistake: 'wrong_insulation_column', why: `Used the ${otherIns} area instead of ${ins}.` }]
      : []),
    nipple
      ? { value: conductorsThatFit(at40, wire), mistake: 'wrong_fill_percent', why: 'Used 40%; a nipple 24 in. or shorter may be filled to 60%.' }
      : { value: conductorsThatFit(racewayArea(raceway, trade, 'one'), wire), mistake: 'wrong_fill_percent', why: 'Used the 53% (one-wire) column.' },
  ]

  return {
    recipeId: ID,
    seed,
    story,
    givens: [
      { id: 'size', label: 'Conductor', value: 0, unit: 'none', phrase: sizeText },
      { id: 'raceway', label: 'Raceway', value: 0, unit: 'none', phrase: racewayText },
    ],
    ask: 'the maximum number of conductors',
    lines,
    answerLine: 'count',
    choices: numericChoices(answer, wrongs, rng, { unit: 'count' }),
    visual: { kind: 'raceway', raceway, trade, allowed, wire, count: answer, fillPct: FILL_PCT[fill] },
  }
}

export const sameSizeFill: Recipe = {
  id: ID,
  family: 'raceway',
  title: 'How many wires fit in a pipe',
  blurb: 'All the wires are the same size: allowed area ÷ one wire’s area, then round the trade’s way.',
  topic: 'calculations',
  editions: ['2020', '2023'],
  generate,
  card: {
    whenToUse: 'The question names one wire size and type and one raceway, and asks how many wires are permitted.',
    steps: [
      { label: 'Pick the fill percent', how: 'Over two wires: 40%. A nipple 24 in. or shorter: 60%.', ref: REF.ch9Table1 },
      { label: 'Allowed area', how: 'Table 4: your raceway type, your trade size, the percent column.', ref: REF.ch9Table4 },
      { label: 'One wire’s area', how: 'Table 5: your insulation type, your wire size.', ref: REF.ch9Table5 },
      { label: 'Divide', how: 'Allowed area ÷ one wire’s area.' },
      { label: 'Round', how: 'Down to a whole wire, unless the decimal is .8 or more.', ref: REF.ch9Note7 },
    ],
    traps: [
      'Use the percent column, never the total (100%) area.',
      'THHN and THW are different rows in Table 5; the question tells you which.',
      'Round DOWN (you cannot pull part of a wire), except .8 or more rounds up (Note 7).',
      'Fast check on the exam: Annex C has the answer printed for each raceway type.',
    ],
    formulas: ['Number of wires = allowed area ÷ area of one wire'],
  },
}

// Annex C location for the check line in the card and the explanation.
export const annexCFor = (r: RacewayType): CodeRef => ANNEX_C_REF[r]
