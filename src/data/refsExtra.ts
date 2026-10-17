/**
 * Locations the wiring, ampacity, motor, transformer and basics recipes need that are not in refs.ts
 * (owned by the wiring/motor recipes builder). Same shape as REF: `loc` is the 2020 location.
 * `THEORY` entries are formulas that are not in the code book at all; the hint ladder says so.
 */
import type { CodeRef } from '@/shared/types'

const nec = (loc: string, title: string): CodeRef => ({ book: 'NEC', loc, title })
const theory = (loc: string, title: string): CodeRef => ({ book: 'THEORY', loc, title })

export const REF_EXTRA = {
  // ---- NEC (2020) ---------------------------------------------------------------------------------
  pullStraight: nec('314.28(A)(1)', 'Straight pulls: length at least 8 × the largest raceway'),
  pullAngle: nec('314.28(A)(2)', 'Angle or U pulls: 6 × the largest raceway plus the others in the row'),
  specificConductors: nec('240.4(G)', 'Specific conductor applications: motor circuits follow Article 430, not 240.4(D)'),
  transformerNote1: nec('Table 450.3(B), Note 1', 'Primary 9 A or more: next higher standard rating permitted'),

  // ---- theory (not in the code book) ----------------------------------------------------------------
  ohmsLaw: theory("Ohm's law: E = I × R", 'Volts, amps and ohms: cover the one you want'),
  powerLaw: theory('Power: P = E × I', 'Watts from volts and amps (and its two cousins, I × I × R and E × E ÷ R)'),
  threePhase: theory('Three-phase: VA = E × I × 1.732', 'Three-phase power and current'),
  powerFactor: theory('Power factor: PF = W ÷ VA', 'True power (watts) over apparent power (volt-amperes)'),
  vdropFormula: theory('VD = 2 × K × I × L ÷ CM (three-phase: 1.732 in place of 2)', 'Voltage drop by the K formula'),
  kFactor: theory('K = 12.9 (copper), 21.2 (aluminum)', 'Resistance of one circular-mil foot of wire'),
} as const satisfies Record<string, CodeRef>
