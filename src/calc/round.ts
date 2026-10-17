/**
 * The rounding rules of the trade, each in one place, each with its plain-English rule.
 *
 *   Must FIT        -> round DOWN   (number of wires in a raceway; Chapter 9 Note 7 allows up at .8)
 *   Must be BIG ENOUGH -> round UP  (box size, raceway size, conductor size, the next standard OCPD
 *                                    where the code allows going up)
 *   Amperes in a load calculation: fractions under 0.5 may be dropped (220.5(B)).
 */

/** Standard ampere ratings for fuses and inverse-time breakers, 240.6(A) (the main list). */
export const STANDARD_OCPD = [
  15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200, 225, 250, 300, 350, 400,
  450, 500, 600, 700, 800, 1000, 1200, 1600, 2000, 2500, 3000, 4000, 5000, 6000,
] as const

/** The smallest standard rating at or above `amps` (the "next size up"). */
export function nextStandardUp(amps: number): number {
  const hit = STANDARD_OCPD.find((s) => s >= amps - 1e-9)
  if (hit === undefined) throw new Error(`no standard OCPD at or above ${amps} A`)
  return hit
}

/** The largest standard rating at or below `amps` (motor feeders, 430.62: never round up). */
export function standardAtOrBelow(amps: number): number {
  let best: number | undefined
  for (const s of STANDARD_OCPD) if (s <= amps + 1e-9) best = s
  if (best === undefined) throw new Error(`no standard OCPD at or below ${amps} A`)
  return best
}

/** The standard rating just below the given standard rating (for "rounded down" distractors). */
export function standardBelow(amps: number): number | undefined {
  let best: number | undefined
  for (const s of STANDARD_OCPD) if (s < amps - 1e-9) best = s
  return best
}

/** The standard rating just above (for "one size too big" distractors). */
export function standardAbove(amps: number): number | undefined {
  return STANDARD_OCPD.find((s) => s > amps + 1e-9)
}

/**
 * 220.5(B): calculations may drop a fraction of an ampere under 0.5; 0.5 and over is rounded up.
 * Exam keys use this; the worksheet accepts either the exact or the rounded value.
 */
export function roundAmps220(amps: number): number {
  const whole = Math.floor(amps + 1e-9)
  return amps - whole >= 0.5 - 1e-9 ? whole + 1 : whole
}

/**
 * How many conductors of one size fit (Chapter 9 Note 7): round down, but a decimal of .8 or more
 * permits the next whole number.
 */
export function conductorsThatFit(allowedArea: number, conductorArea: number): number {
  const exact = allowedArea / conductorArea
  const whole = Math.floor(exact + 1e-9)
  return exact - whole >= 0.8 - 1e-9 ? whole + 1 : whole
}

/** The first entry of an ordered list whose capacity is at least `need` (box, conduit, wire size). */
export function firstBigEnough<T>(list: readonly T[], capacity: (t: T) => number, need: number): T | undefined {
  return list.find((t) => capacity(t) >= need - 1e-9)
}
