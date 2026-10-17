/**
 * The appliances and ratings the dwelling generators draw from. Every fastened-in-place appliance here
 * is clearly at or over the 2020 220.53 threshold (1/4 hp or more, or 500 W or more): motor appliances
 * state their horsepower, and their order by horsepower is also their order by VA, so "the largest
 * motor" is never in doubt. Ratings are typical nameplates, not code values.
 */
import type { Rng } from '@/calc'
import type { Appliance, Rating } from './common'

const kW = (kw: number): Rating => ({ kind: 'kW', kw })
const W = (w: number): Rating => ({ kind: 'W', w })
const A = (amps: number, volts: 120 | 240): Rating => ({ kind: 'A', amps, volts })

interface ApplianceKind {
  key: string
  name: string
  motor: boolean
  hp?: string
  ratings: Rating[]
}

/** Fastened-in-place appliances (never cooking, dryers, space heating or A/C). */
export const FIXED_KINDS: ApplianceKind[] = [
  { key: 'wh', name: 'water heater', motor: false, ratings: [kW(4.5), kW(5), kW(5.5), W(4500), W(3800)] },
  { key: 'dw', name: 'dishwasher', motor: false, ratings: [W(1200), W(1500), A(10, 120), A(12, 120)] },
  // Motors, smallest to largest (hp order = VA order): 720, 840 or 960, 1,920, 2,400 VA.
  { key: 'comp', name: 'trash compactor', motor: true, hp: '1/3', ratings: [A(6, 120)] },
  { key: 'disp', name: 'food waste disposer', motor: true, hp: '1/2', ratings: [A(7, 120), A(8, 120)] },
  { key: 'well', name: 'well pump', motor: true, hp: '1', ratings: [A(8, 240)] },
  { key: 'pool', name: 'pool pump', motor: true, hp: '1-1/2', ratings: [A(10, 240)] },
]

/** `n` different fastened-in-place appliances; the water heater first when there is one. */
export function pickAppliances(rng: Rng, n: number): Appliance[] {
  if (n <= 0) return []
  const [wh, ...rest] = FIXED_KINDS
  const kinds = [wh as ApplianceKind, ...rng.shuffle(rest)].slice(0, Math.min(n, FIXED_KINDS.length))
  return kinds.map((k) => ({ key: k.key, name: k.name, motor: k.motor, hp: k.hp, rating: rng.pick(k.ratings) }))
}

/** Household dryer nameplates (some under 5,000 VA, some over). */
export const DRYER_RATINGS: Rating[] = [kW(4), kW(4.5), W(4500), W(4800), kW(5), kW(5.5), W(5600), kW(6), kW(7)]

/**
 * Single household ranges, kW. Column C territory (over 8¾ kW). Fractions are kept clear of one half
 * (x.2, x.4 are dropped; x.6, x.8 count as one more kW) so the "major fraction" reading cannot change
 * the answer.
 */
export const RANGE_KW_SINGLE = [9, 10, 11, 11.6, 12, 12.4, 12.8, 13, 13.4, 13.6, 14, 14.2, 14.8, 15, 15.6, 16, 16.4, 17, 18]

/** Fixed electric heat, kW (baseboard: no blower motor, so it never competes as "the largest motor"). */
export const HEAT_KW = [5, 6, 7.5, 8, 9, 10, 12, 15, 18, 20]

/** 240-V air conditioner nameplate amperes. */
export const AC_AMPS = [14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40]
