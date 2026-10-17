import { describe, expect, it } from 'vitest'
import { checkLine } from '@/calc'
import { checkRecipe } from '../harness'
import { sameSizeFill } from './sameSize'

describe('raceway-same-size', () => {
  it('passes the recipe self-consistency checks', () => {
    checkRecipe(sameSizeFill, 120)
  })

  it('agrees with Annex C for common EMT cases', () => {
    // Hand-checked against Annex C, Table C.1 (EMT): 12 THHN in 3/4 = 16, 12 THHN in 1/2 = 9,
    // 14 THHN in 1/2 = 12, 10 THHN in 3/4 = 10.
    const seen: Record<string, number> = {}
    for (let s = 1; s < 3000; s++) {
      const p = sameSizeFill.generate(s)
      const v = p.visual as { raceway: string; trade: string; count: number; fillPct: number }
      const conductor = p.story.match(/of (\S+) AWG (\w+)/)
      if (!conductor || v.raceway !== 'EMT' || v.fillPct !== 40) continue
      seen[`${conductor[1]} ${conductor[2]} in ${v.trade}`] = v.count
    }
    if (seen['12 THHN in 3/4'] !== undefined) expect(seen['12 THHN in 3/4']).toBe(16)
    if (seen['12 THHN in 1/2'] !== undefined) expect(seen['12 THHN in 1/2']).toBe(9)
    if (seen['14 THHN in 1/2'] !== undefined) expect(seen['14 THHN in 1/2']).toBe(12)
    if (seen['10 THHN in 3/4'] !== undefined) expect(seen['10 THHN in 3/4']).toBe(10)
    expect(Object.keys(seen).length).toBeGreaterThan(5)
  })

  it('names the 100% column mistake', () => {
    for (let s = 1; s < 50; s++) {
      const p = sameSizeFill.generate(s)
      const allowed = p.lines.find((l) => l.id === 'allowed')!
      const m = allowed.mistakes!.find((x) => x.mistake === 'used_100pct_area')!
      const v = checkLine(allowed, String(m.value))
      expect(!v.ok && v.mistake).toBe('used_100pct_area')
    }
  })
})
