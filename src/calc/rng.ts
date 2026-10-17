/** Seeded random numbers: the same seed always builds the same problem (shareable links, tests). */

export interface Rng {
  /** Float in [0, 1). */
  next(): number
  /** Integer in [lo, hi], inclusive. */
  int(lo: number, hi: number): number
  /** One element of a non-empty list. */
  pick<T>(list: readonly T[]): T
  /** A multiple of `step` in [lo, hi]. */
  step(lo: number, hi: number, step: number): number
  /** A shuffled copy. */
  shuffle<T>(list: readonly T[]): T[]
  /** True with probability p. */
  chance(p: number): boolean
}

/** mulberry32: small, fast, good enough for problem generation. */
export function makeRng(seed: number): Rng {
  let a = seed >>> 0 || 0x9e3779b9
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const int = (lo: number, hi: number) => lo + Math.floor(next() * (hi - lo + 1))
  return {
    next,
    int,
    pick: <T,>(list: readonly T[]): T => {
      if (list.length === 0) throw new Error('pick from an empty list')
      return list[Math.floor(next() * list.length)] as T
    },
    step: (lo, hi, step) => lo + step * int(0, Math.floor((hi - lo) / step)),
    shuffle: <T,>(list: readonly T[]): T[] => {
      const out = [...list]
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1))
        const tmp = out[i] as T
        out[i] = out[j] as T
        out[j] = tmp
      }
      return out
    },
    chance: (p) => next() < p,
  }
}

/** A fresh random seed for "new problem" (not cryptographic). */
export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31)
}
