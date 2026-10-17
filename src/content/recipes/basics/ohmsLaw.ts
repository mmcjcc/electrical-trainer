/**
 * Ohm's law and power (DC or resistive single-phase): I = E ÷ R, R = E ÷ I, E = I × R, P = E × I,
 * I = P ÷ E, P = I² × R (two lines: I × I, then × R), P = E² ÷ R (E × E, then ÷ R) and R = E² ÷ P.
 * The first line is always the decision: which formula, from what the question gives and asks.
 * Squares are worked as "times itself": the exam's calculator is a basic one.
 */
import { calc, choose, fmt, given, makeRng, numericChoices, valueOf, type WrongValue } from '@/calc'
import { REF_EXTRA } from '@/data/refsExtra'
import type { CodeRef, LineOption, ProblemInstance, Recipe, Unit, WorkLine } from '@/shared/types'
import { cleanMistakes, opt } from '../kit'

const ID = 'basics-ohms-law'

export type OhmsForm = 'I=E/R' | 'R=E/I' | 'E=IR' | 'P=EI' | 'I=P/E' | 'P=I2R' | 'P=E2/R' | 'R=E2/P'
const FORMS: OhmsForm[] = ['I=E/R', 'R=E/I', 'E=IR', 'P=EI', 'I=P/E', 'I=P/E', 'P=I2R', 'P=E2/R', 'R=E2/P']

export interface OhmsParams { form: OhmsForm; e: number; i: number; r: number; p: number }

/** Formula labels for the choose line. */
const LABEL: Record<string, string> = {
  'I=E/R': 'I = E ÷ R', 'I=R/E': 'I = R ÷ E', 'I=ER': 'I = E × R', 'I=P/E': 'I = P ÷ E', 'I=E/P': 'I = E ÷ P',
  'R=E/I': 'R = E ÷ I', 'R=I/E': 'R = I ÷ E', 'R=EI': 'R = E × I',
  'E=IR': 'E = I × R', 'E=I/R': 'E = I ÷ R', 'E=R/I': 'E = R ÷ I',
  'P=EI': 'P = E × I', 'P=E/I': 'P = E ÷ I', 'P=I2R': 'P = I × I × R', 'P=IR': 'P = I × R', 'P=E2/R': 'P = E × E ÷ R', 'P=E/R': 'P = E ÷ R',
  'R=E2/P': 'R = E × E ÷ P', 'R=P/E': 'R = P ÷ E', 'R=P/I': 'R = P ÷ I',
}
/** The right formula first, then three wrong ones that people actually reach for. */
const OPTIONS: Record<OhmsForm, string[]> = {
  'I=E/R': ['I=E/R', 'I=R/E', 'I=ER', 'I=P/E'],
  'R=E/I': ['R=E/I', 'R=I/E', 'R=EI', 'R=P/I'],
  'E=IR': ['E=IR', 'E=I/R', 'E=R/I', 'P=EI'],
  'P=EI': ['P=EI', 'P=E/I', 'P=I2R', 'I=P/E'],
  'I=P/E': ['I=P/E', 'I=E/P', 'P=EI', 'I=E/R'],
  'P=I2R': ['P=I2R', 'P=IR', 'P=EI', 'P=E2/R'],
  'P=E2/R': ['P=E2/R', 'P=E/R', 'P=I2R', 'P=EI'],
  'R=E2/P': ['R=E2/P', 'R=P/E', 'R=E/I', 'P=E2/R'],
}

function pick(seed: number): OhmsParams {
  const rng = makeRng(seed)
  for (let tries = 0; tries < 300; tries++) {
    const form = rng.pick(FORMS)
    let e = 0
    let i = 0
    let r = 0
    if (form === 'P=I2R') {
      i = rng.pick([5, 10, 12, 15, 20, 25, 30, 40, 50])
      r = rng.pick([0.05, 0.1, 0.2, 0.25, 0.5, 1, 2])
      e = i * r
    } else if (form === 'P=E2/R' || form === 'R=E2/P') {
      e = rng.pick([120, 240])
      const p = rng.pick(e === 120 ? [600, 1000, 1200, 1500, 1800] : [2400, 3000, 3600, 4000, 4500, 4800, 5000, 6000])
      r = (e * e) / p
      i = e / r
    } else {
      e = rng.pick([12, 24, 120, 120, 208, 240, 240, 277, 480])
      i = rng.pick([0.5, 1.5, 2, 4, 5, 6, 8, 10, 12, 12.5, 15, 16, 20, 24, 25, 30, 40])
      r = e / i
    }
    const p = e * i
    // Clean numbers: R to at most two decimals, P a whole number of watts.
    if (Math.abs(r * 100 - Math.round(r * 100)) > 1e-6 || Math.abs(p - Math.round(p)) > 1e-6) continue
    if (r <= 0 || p <= 0) continue
    return { form, e, i, r, p }
  }
  return { form: 'I=P/E', e: 120, i: 12.5, r: 9.6, p: 1500 }
}

const LOADS = ['heating element', 'resistance heater', 'lamp bank', 'baseboard heater']

export function buildOhms(prm: OhmsParams, seed: number): ProblemInstance {
  const rng = makeRng(seed ^ 0x0e)
  const { form, e, i, r, p } = prm
  const load = LOADS[seed % LOADS.length]!
  const ref: CodeRef = form.startsWith('P') || form === 'I=P/E' || form === 'R=E2/P' ? REF_EXTRA.powerLaw : REF_EXTRA.ohmsLaw
  const W = (v: number) => `${fmt(v)} W`
  const V = (v: number) => `${fmt(v)} V`
  const A = (v: number) => `${fmt(v)} A`
  const O = (v: number) => `${fmt(v)} Ω`

  let story = ''
  let askText = ''
  let unit: Unit = 'A'
  const givens: { id: string; label: string; value: number; unit: Unit; phrase: string }[] = []
  const lines: WorkLine[] = []
  const g = (id: string, label: string, value: number, u: Unit, phrase: string, say: string) => {
    givens.push({ id, label, value, unit: u, phrase })
    lines.push(given({ id, label, say, value, unit: u }))
  }

  const formulaOptions: LineOption[] = OPTIONS[form].map((f, k) => opt(f, LABEL[f]!, k === 0 ? undefined : wrongFormulaWhy(form, f), k === 0 ? undefined : 'ohms_wrong_formula'))
  const formulaLine = choose({
    id: 'formula', label: 'Which formula?',
    say: 'Write what you have and what you want, then pick the formula that uses exactly those.',
    why: 'E is volts, I is amps, R is ohms, P is watts. Every formula here comes from E = I × R and P = E × I.',
    ref,
    options: rng.shuffle(formulaOptions),
    answerId: form,
    checkpoint: true,
  })

  const wrongs: WrongValue[] = []
  switch (form) {
    case 'I=E/R': {
      story = `A ${V(e)} ${load} has a resistance of ${O(r)}. How much current does it draw?`
      askText = 'the current in amperes'
      lines.push(formulaLine)
      g('e', 'Voltage (E)', e, 'V', V(e), 'Write down the volts.')
      g('r', 'Resistance (R)', r, 'ohm', O(r), 'Write down the ohms.')
      lines.push(calc({ id: 'answer', label: 'Current (I)', say: 'Divide the volts by the ohms.', ref, a: e, op: '÷', b: r, unit: 'A', decimals: 2 }))
      wrongs.push({ value: r / e, mistake: 'flipped_division', why: 'Divided ohms by volts.' }, { value: e * r, mistake: 'inverse_op', why: 'Multiplied instead of dividing.' })
      unit = 'A'
      break
    }
    case 'R=E/I': {
      story = `A ${V(e)} ${load} draws ${A(i)}. What is its resistance?`
      askText = 'the resistance in ohms'
      lines.push(formulaLine)
      g('e', 'Voltage (E)', e, 'V', V(e), 'Write down the volts.')
      g('i', 'Current (I)', i, 'A', A(i), 'Write down the amps.')
      lines.push(calc({ id: 'answer', label: 'Resistance (R)', say: 'Divide the volts by the amps.', ref, a: e, op: '÷', b: i, unit: 'ohm', decimals: 2 }))
      wrongs.push({ value: i / e, mistake: 'flipped_division', why: 'Divided amps by volts.' }, { value: e * i, mistake: 'ohms_wrong_formula', why: 'Volts × amps is watts, not ohms.' })
      unit = 'ohm'
      break
    }
    case 'E=IR': {
      story = `A current of ${A(i)} flows through a resistance of ${O(r)}. What is the voltage across the resistance?`
      askText = 'the voltage'
      lines.push(formulaLine)
      g('i', 'Current (I)', i, 'A', A(i), 'Write down the amps.')
      g('r', 'Resistance (R)', r, 'ohm', O(r), 'Write down the ohms.')
      lines.push(calc({ id: 'answer', label: 'Voltage (E)', say: 'Multiply the amps by the ohms.', ref, a: i, op: '×', b: r, unit: 'V', decimals: 2 }))
      wrongs.push({ value: i / r, mistake: 'inverse_op', why: 'Divided instead of multiplying.' }, { value: r / i, mistake: 'flipped_division', why: 'Divided ohms by amps.' })
      unit = 'V'
      break
    }
    case 'P=EI': {
      story = `A ${V(e)} ${load} draws ${A(i)}. How many watts does it use?`
      askText = 'the power in watts'
      lines.push(formulaLine)
      g('e', 'Voltage (E)', e, 'V', V(e), 'Write down the volts.')
      g('i', 'Current (I)', i, 'A', A(i), 'Write down the amps.')
      lines.push(calc({ id: 'answer', label: 'Power (P)', say: 'Multiply the volts by the amps.', ref, a: e, op: '×', b: i, unit: 'W', decimals: 2 }))
      wrongs.push({ value: e / i, mistake: 'ohms_wrong_formula', why: 'Volts ÷ amps is ohms, not watts.' }, { value: e * i * 1.732, mistake: 'sqrt3_extra', why: 'Used 1.732; this is not three-phase.' })
      unit = 'W'
      break
    }
    case 'I=P/E': {
      story = `A ${W(p)}, ${V(e)} ${load} is connected. How much current does it draw?`
      askText = 'the current in amperes'
      lines.push(formulaLine)
      g('p', 'Power (P)', p, 'W', W(p), 'Write down the watts.')
      g('e', 'Voltage (E)', e, 'V', V(e), 'Write down the volts.')
      lines.push(calc({ id: 'answer', label: 'Current (I)', say: 'Divide the watts by the volts.', ref, a: p, op: '÷', b: e, unit: 'A', decimals: 2 }))
      wrongs.push({ value: e / p, mistake: 'flipped_division', why: 'Divided volts by watts.' }, { value: p / (e * 1.732), mistake: 'sqrt3_extra', why: 'Used 1.732; this is single-phase.' }, ...(e === 240 || e === 120 ? [{ value: p / (e === 240 ? 120 : 240), mistake: 'wrong_voltage', why: `Used ${e === 240 ? 120 : 240} V; the load is ${e} V.` }] : []))
      unit = 'A'
      break
    }
    case 'P=I2R': {
      story = `A conductor with a resistance of ${O(r)} carries ${A(i)}. How much power is lost as heat in the conductor?`
      askText = 'the power lost, in watts'
      lines.push(formulaLine)
      g('i', 'Current (I)', i, 'A', A(i), 'Write down the amps.')
      g('r', 'Resistance (R)', r, 'ohm', O(r), 'Write down the ohms.')
      lines.push(calc({
        id: 'i2', label: 'I squared (I × I)', say: 'Squared means times itself: amps × amps.', ref, a: i, op: '×', b: i, unit: 'none',
        mistakes: cleanMistakes(i * i, undefined, [{ value: i * 2, mistake: 'square_as_double', message: `Squared means times ITSELF: ${fmt(i)} × ${fmt(i)}, not × 2.` }]),
        checkpoint: true,
      }))
      lines.push(calc({
        id: 'answer', label: 'Power (P)', say: 'Multiply by the ohms.', ref, a: i * i, op: '×', b: r, unit: 'W', decimals: 2,
        mistakes: cleanMistakes(i * i * r, undefined, [
          { value: i * 2 * r, mistake: 'square_as_double', message: 'Square the amps (I × I) before multiplying by the ohms.' },
          { value: i * r, mistake: 'ohms_wrong_formula', message: 'I × R is volts. For watts the amps are squared: I × I × R.' },
        ]),
      }))
      wrongs.push({ value: i * r, mistake: 'ohms_wrong_formula', why: 'I × R is the voltage, not the power.' }, { value: i * 2 * r, mistake: 'square_as_double', why: 'Doubled the current instead of squaring it.' }, { value: (i * i) / r, mistake: 'inverse_op', why: 'Divided by the ohms instead of multiplying.' })
      unit = 'W'
      break
    }
    case 'P=E2/R': {
      story = `A ${V(e)} ${load} has a resistance of ${O(r)}. What is its power in watts?`
      askText = 'the power in watts'
      lines.push(formulaLine)
      g('e', 'Voltage (E)', e, 'V', V(e), 'Write down the volts.')
      g('r', 'Resistance (R)', r, 'ohm', O(r), 'Write down the ohms.')
      lines.push(calc({
        id: 'e2', label: 'E squared (E × E)', say: 'Volts × volts.', ref, a: e, op: '×', b: e, unit: 'none',
        mistakes: cleanMistakes(e * e, undefined, [{ value: e * 2, mistake: 'square_as_double', message: `Squared means times ITSELF: ${fmt(e)} × ${fmt(e)}.` }]),
        checkpoint: true,
      }))
      lines.push(calc({
        id: 'answer', label: 'Power (P)', say: 'Divide by the ohms.', ref, a: e * e, op: '÷', b: r, unit: 'W', decimals: 2,
        mistakes: cleanMistakes((e * e) / r, undefined, [
          { value: e / r, mistake: 'ohms_wrong_formula', message: 'E ÷ R is the current. For watts the volts are squared: E × E ÷ R.' },
          { value: (e * 2) / r, mistake: 'square_as_double', message: 'Square the volts (E × E) first.' },
        ]),
      }))
      wrongs.push({ value: e / r, mistake: 'ohms_wrong_formula', why: 'E ÷ R is the current in amps.' }, { value: e * r, mistake: 'ohms_wrong_formula', why: 'E × R is not a power formula.' })
      unit = 'W'
      break
    }
    case 'R=E2/P': {
      story = `A water-heater element is rated ${W(p)} at ${V(e)}. What is its resistance?`
      askText = 'the resistance in ohms'
      lines.push(formulaLine)
      g('p', 'Power (P)', p, 'W', W(p), 'Write down the watts.')
      g('e', 'Voltage (E)', e, 'V', V(e), 'Write down the volts.')
      lines.push(calc({
        id: 'e2', label: 'E squared (E × E)', say: 'Volts × volts.', ref, a: e, op: '×', b: e, unit: 'none',
        mistakes: cleanMistakes(e * e, undefined, [{ value: e * 2, mistake: 'square_as_double', message: `Squared means times ITSELF: ${fmt(e)} × ${fmt(e)}.` }]),
        checkpoint: true,
      }))
      lines.push(calc({
        id: 'answer', label: 'Resistance (R)', say: 'Divide by the watts.', ref, a: e * e, op: '÷', b: p, unit: 'ohm', decimals: 2,
        mistakes: cleanMistakes((e * e) / p, undefined, [
          { value: p / e, mistake: 'ohms_wrong_formula', message: 'P ÷ E is the current. For ohms: E × E ÷ P.' },
        ]),
      }))
      wrongs.push({ value: p / e, mistake: 'ohms_wrong_formula', why: 'P ÷ E is the current in amps, not the resistance.' }, { value: (e * 2) / p, mistake: 'square_as_double', why: 'Doubled the volts instead of squaring them.' })
      unit = 'ohm'
      break
    }
  }

  return {
    recipeId: ID,
    seed,
    story,
    givens,
    ask: askText,
    lines,
    answerLine: 'answer',
    choices: numericChoices(valueOf(lines, 'answer'), wrongs, rng, { unit, decimals: 2 }),
    visual: { kind: 'ohms-wheel', want: form.split('=')[0], form, e, i, r, p },
  }
}

function wrongFormulaWhy(right: OhmsForm, wrong: string): string {
  const want = right.split('=')[0]
  if (wrong.split('=')[0] !== want) return `That formula gives ${({ I: 'amps', R: 'ohms', E: 'volts', P: 'watts' } as Record<string, string>)[wrong.split('=')[0]!]}; the question asks for ${({ I: 'amps', R: 'ohms', E: 'volts', P: 'watts' } as Record<string, string>)[want!]}.`
  return `That one does not use the numbers in the question the right way. Start from E = I × R and P = E × I.`
}

function generate(seed: number): ProblemInstance {
  return buildOhms(pick(seed), seed)
}

export const ohmsLaw: Recipe = {
  id: ID,
  family: 'basics',
  title: "Ohm's law and power",
  blurb: 'Volts, amps, ohms and watts: pick the formula from what you have and what you want.',
  topic: 'theory',
  editions: ['2020'],
  generate,
  card: {
    whenToUse: 'The question gives two of volts, amps, ohms and watts on a single-phase or DC load and asks for a third.',
    steps: [
      { label: 'Have and want', how: 'Write down the two numbers you have and the one you want.', ref: REF_EXTRA.ohmsLaw },
      { label: 'Formula', how: 'E = I × R and P = E × I, turned around as needed.', ref: REF_EXTRA.powerLaw },
      { label: 'Squares', how: 'I² is I × I; E² is E × E. Do the square first.' },
      { label: 'Calculate', how: 'One operation per line.' },
    ],
    traps: [
      'Squared means times itself, not times 2.',
      'E ÷ R is amps; E × E ÷ R is watts.',
      'No 1.732 on single-phase or DC.',
    ],
    formulas: ['I = E ÷ R', 'R = E ÷ I', 'E = I × R', 'P = E × I', 'I = P ÷ E', 'P = I × I × R', 'P = E × E ÷ R', 'R = E × E ÷ P'],
  },
}
