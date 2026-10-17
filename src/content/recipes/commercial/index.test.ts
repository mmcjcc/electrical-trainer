import { describe, expect, it } from 'vitest'
import { MISTAKES } from '@/calc'
import { mistakeIdsUsed } from '../kitTesting'
import { COMMERCIAL_RECIPES } from './index'

describe('COMMERCIAL_RECIPES', () => {
  it('registers the store and kitchen recipes, 2020 only, on the calculations topic', () => {
    expect(COMMERCIAL_RECIPES.map((r) => r.id).sort()).toEqual(['commercial-kitchen', 'commercial-store'])
    for (const r of COMMERCIAL_RECIPES) {
      expect(r.family).toBe('commercial')
      expect(r.topic).toBe('calculations')
      expect(r.editions).toEqual(['2020'])
      for (const id of mistakeIdsUsed(r, 120)) expect(id in MISTAKES, `${r.id}: ${id}`).toBe(true)
      expect((r.generate(5).visual as { kind: string }).kind).toBe('load')
    }
  })
})
