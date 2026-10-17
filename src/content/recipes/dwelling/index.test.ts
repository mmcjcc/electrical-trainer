import { describe, expect, it } from 'vitest'
import { MISTAKES } from '@/calc'
import { mistakeIdsUsed } from '../kitTesting'
import { DWELLING_RECIPES } from './index'

describe('DWELLING_RECIPES', () => {
  it('registers the nine dwelling recipes, 2020 only, on the calculations topic', () => {
    expect(DWELLING_RECIPES.map((r) => r.id).sort()).toEqual([
      'dwelling-appliances', 'dwelling-dryers', 'dwelling-lighting-demand', 'dwelling-neutral', 'dwelling-optional',
      'dwelling-range', 'dwelling-ranges-multi', 'dwelling-standard', 'multifamily-optional',
    ])
    for (const r of DWELLING_RECIPES) {
      expect(r.family).toBe('dwelling')
      expect(r.topic).toBe('calculations')
      expect(r.editions).toEqual(['2020'])
    }
  })

  it('uses only mistake ids from the catalog, and every problem carries a load picture', () => {
    for (const r of DWELLING_RECIPES) {
      for (const id of mistakeIdsUsed(r, 120)) expect(id in MISTAKES, `${r.id}: ${id}`).toBe(true)
      const v = r.generate(5).visual as { kind: string; buckets: { label: string; before: number; after: number }[] }
      expect(v.kind).toBe('load')
      expect(v.buckets.length).toBeGreaterThan(0)
      for (const b of v.buckets) expect(Number.isFinite(b.before) && Number.isFinite(b.after)).toBe(true)
    }
  })
})
