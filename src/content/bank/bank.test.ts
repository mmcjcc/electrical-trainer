import { describe, expect, it } from 'vitest'
import { allQuestions } from '.'
import { TOPICS } from '../blueprint'

describe('question bank', () => {
  const qs = allQuestions()
  it('every question is well formed', () => {
    const topics = new Set(TOPICS.map((t) => t.id))
    for (const q of qs) {
      expect(topics.has(q.topic), `${q.id} topic ${q.topic}`).toBe(true)
      expect(q.id.startsWith(`${q.topic}-`) || q.id.includes('-'), q.id).toBe(true)
      expect(q.choices).toHaveLength(4)
      expect(new Set(q.choices).size, `${q.id} has four distinct options`).toBe(4)
      expect(q.answer).toBeGreaterThanOrEqual(0)
      expect(q.answer).toBeLessThanOrEqual(3)
      expect(q.stem.length).toBeGreaterThan(15)
      expect(q.explain.length).toBeGreaterThan(15)
      expect(q.ref.loc.length).toBeGreaterThan(0)
      expect(q.editions.length).toBeGreaterThan(0)
      for (const k of Object.keys(q.whyNot ?? {})) expect(Number(k), `${q.id} whyNot only for wrong options`).not.toBe(q.answer)
    }
  })
  it('ids are unique', () => {
    expect(new Set(qs.map((q) => q.id)).size).toBe(qs.length)
  })
  it('right answers are spread over A-D in every topic with 12 or more questions', () => {
    for (const t of TOPICS) {
      const list = qs.filter((q) => q.topic === t.id)
      if (list.length < 12) continue
      for (let pos = 0; pos < 4; pos++) {
        const share = list.filter((q) => q.answer === pos).length / list.length
        expect(share, `${t.id}: position ${pos}`).toBeGreaterThan(0.1)
        expect(share, `${t.id}: position ${pos}`).toBeLessThan(0.45)
      }
    }
  })
})
