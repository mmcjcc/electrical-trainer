import { describe, expect, it } from 'vitest'
import { locFor } from '@/data/necIndex'
import { REF } from '@/data/refs'
import type { NecEdition } from '@/shared/types'
import { bucketOf, FIND_IT_POOL, findItItem, findItRound, overlaps } from './findIt'

const EDITIONS: NecEdition[] = ['2020', '2023', '2026']

describe('findIt helpers', () => {
  it('knows when one location holds another', () => {
    expect(overlaps('314.16', '314.16(B)(4)')).toBe(true)
    expect(overlaps('Table 314.16(A)', '314.16')).toBe(true)
    expect(overlaps('Table 220.54', '220.54')).toBe(true)
    expect(overlaps('Annex C', 'Annex C, Table C.1')).toBe(true)
    expect(overlaps('Table 450.3(B)', 'Table 450.3(B), Note 1')).toBe(true)
    expect(overlaps('220.5(A)', '220.55')).toBe(false)
    expect(overlaps('220.5', '220.55')).toBe(false)
    expect(overlaps('Chapter 9, Table 1', 'Chapter 9, Table 10')).toBe(false)
    expect(overlaps('Table 250.66', 'Table 250.122')).toBe(false)
    expect(overlaps('240.4(D)', '240.4(B)')).toBe(false)
  })
  it('sorts locations into parts of the book', () => {
    expect(bucketOf('Chapter 9, Table 4')).toBe('ch9')
    expect(bucketOf('Annex C, Table C.1')).toBe('annexC')
    expect(bucketOf('Table 250.102(C)(1)')).toBe('250')
    expect(bucketOf('430.52(C)(1), Exception No. 1')).toBe('430')
  })
})

describe('findItRound', () => {
  it('is deterministic for a seed', () => {
    expect(findItRound(42, '2020')).toEqual(findItRound(42, '2020'))
    expect(findItRound(42, '2020')).not.toEqual(findItRound(43, '2020'))
  })

  for (const edition of EDITIONS) {
    it(`builds fair rounds of 10 for ${edition} over many seeds`, () => {
      for (let seed = 1; seed <= 80; seed++) {
        const round = findItRound(seed, edition)
        expect(round.items).toHaveLength(10)
        expect(new Set(round.items.map((i) => i.key)).size).toBe(10)
        for (const item of round.items) {
          const ref = REF[item.key as keyof typeof REF]
          expect(ref, item.key).toBeDefined()
          // The right answer is the edition's location for this concept.
          expect(item.choices[item.answer]).toBe(locFor(ref, edition))
          expect(item.prompt).toBe(item.ref.title)
          expect(item.ref.loc).toBe(ref.loc)
          expect(new Set(item.choices).size).toBe(4)
          // No two options can both be right: none holds another.
          for (let a = 0; a < 4; a++) {
            for (let b = a + 1; b < 4; b++) expect(overlaps(item.choices[a], item.choices[b]), `${item.choices[a]} / ${item.choices[b]}`).toBe(false)
            expect(locFor(item.choiceRefs[a] as (typeof REF)[keyof typeof REF], edition)).toBe(item.choices[a])
          }
          // The prompt never names a section number (it would give the answer away).
          expect(/\d{2,3}\.\d/.test(item.prompt)).toBe(false)
        }
      }
    })
  }

  it('prints the 2023 location when the edition moved it', () => {
    const entry = FIND_IT_POOL.find((e) => e.key === 'tempCorrection')!
    const item2020 = findItItem(entry, FIND_IT_POOL, '2020', 7)!
    const item2023 = findItItem(entry, FIND_IT_POOL, '2023', 7)!
    expect(item2020.choices[item2020.answer]).toBe('Table 310.15(B)(1)')
    expect(item2023.choices[item2023.answer]).toBe('Table 310.15(B)(1)(1)')
  })

  it('draws wrong options from the same family of tables', () => {
    const entry = FIND_IT_POOL.find((e) => e.key === 'gecTable')!
    for (let seed = 1; seed <= 20; seed++) {
      const item = findItItem(entry, FIND_IT_POOL, '2020', seed)!
      const wrong = item.choices.filter((_, i) => i !== item.answer)
      expect(wrong).toContain('Table 250.122')
      expect(wrong).toContain('Table 250.102(C)(1)')
      expect(wrong.every((w) => /^Table (250|310)\./.test(w))).toBe(true)
    }
  })

  it('leaves out rows still marked VERIFY in refs.ts', () => {
    const banned = ['showWindow', 'lightingDemand', 'annexC_PVC40', 'annexC_PVC80', 'dwellingLighting']
    for (let seed = 1; seed <= 40; seed++) {
      const round = findItRound(seed, '2020')
      for (const item of round.items) {
        expect(banned).not.toContain(item.key)
        for (const b of banned) expect(item.choices).not.toContain(locFor(REF[b as keyof typeof REF], '2020'))
      }
      for (const item of findItRound(seed, '2023').items) {
        expect(item.key).not.toBe('motorOcpdTable')
        expect(item.choices.some((c) => /^(Table )?220\./.test(c))).toBe(false)
      }
    }
  })

  it('returns a shorter round when the pool is small, never a repeat', () => {
    const small = FIND_IT_POOL.filter((e) => ['gecTable', 'egcTable', 'bondingJumperTable', 'ampacityTable', 'adjustment', 'tempCorrection'].includes(e.key))
    const round = findItRound(5, '2020', 10, small)
    expect(round.items.length).toBeLessThanOrEqual(small.length)
    expect(new Set(round.items.map((i) => i.key)).size).toBe(round.items.length)
  })
})
