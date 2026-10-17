/**
 * Code-book values the wiring, ampacity, motor and transformer recipes need that are not in
 * tables.ts (owned by the wiring/motor recipes builder). 2020 NEC; an edition note is given where a
 * value is known to differ. Factual values only; locations live in data/refsExtra.ts.
 */
import type { ConductorSize } from './tables'

// ---------------------------------------------------------------------------------------------
// 240.4(D) and the continuous-load factor
// ---------------------------------------------------------------------------------------------

/**
 * 240.4(D): the most overcurrent protection allowed on small COPPER conductors (no correction or
 * adjustment changes this): 14 AWG 15 A, 12 AWG 20 A, 10 AWG 30 A. Motor circuits are exempt through
 * 240.4(G) (they follow Article 430).
 */
export const SMALL_CONDUCTOR_MAX_OCPD_CU: Partial<Record<ConductorSize, number>> = { '14': 15, '12': 20, '10': 30 }

/** 210.19(A)(1)(a) / 210.20(A) / 215.2 / 215.3: continuous loads (3 hours or more) count at 125%. */
export const CONTINUOUS = { hours: 3, pct: 125 } as const

// ---------------------------------------------------------------------------------------------
// 314.16(B) box fill counting rules and 314.28 pull boxes
// ---------------------------------------------------------------------------------------------

export const BOX_COUNT = {
  /** 314.16(B)(1): an unbroken conductor looped at least twice the 6 in. free length of 300.14 counts twice. */
  loopInches: 12,
  loopCounts: 2,
  /** 314.16(B)(4): each yoke or strap counts two conductors (the largest connected to the device). */
  perYoke: 2,
  /**
   * 314.16(B)(5), 2020 NEC (new in 2020): up to four equipment grounding conductors or bonding jumpers
   * count as ONE allowance (the largest); each one beyond four adds a 1/4 allowance (of the largest).
   * Before 2020 all grounds counted as one, however many.
   */
  egcSingleUpTo: 4,
  egcExtraEach: 0.25,
} as const

/**
 * 314.28(A)(1) and (A)(2), raceways containing 4 AWG and larger conductors: straight pull, the box is
 * at least 8 × the largest raceway trade size long; angle or U pull, the distance to the opposite wall is
 * at least 6 × the largest raceway plus the sum of the other raceways in the same row on that wall.
 */
export const PULL_BOX = { straight: 8, angle: 6, minConductor: '4' as ConductorSize } as const

// ---------------------------------------------------------------------------------------------
// Article 430 multipliers
// ---------------------------------------------------------------------------------------------

/**
 * 430.22: single motor conductor at 125% of the table FLC; 430.24: 125% of the largest plus the rest.
 * 430.32(A)(1): separate overload at most 125% of the nameplate FLA for a service factor of 1.15 or
 * more or a marked temperature rise of 40 °C or less; 115% for all other motors.
 */
export const MOTOR_PCT = { conductor: 125, overloadSf: 125, overloadOther: 115 } as const

