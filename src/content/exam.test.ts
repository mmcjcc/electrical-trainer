import { describe, expect, it } from 'vitest'
import { buildExam, correctIndex, scoreExam } from './exam'
import { EXAM, EXAM_TOPICS, TOPICS } from './blueprint'

describe('blueprint', () => {
  it('matches the PSI bulletin: 90 questions, 100 points', () => {
    expect(EXAM_TOPICS.reduce((a, t) => a + t.questions, 0)).toBe(EXAM.questions)
    expect(EXAM_TOPICS.reduce((a, t) => a + t.questions * t.points, 0)).toBe(EXAM.totalPoints)
    expect(TOPICS.find((t) => t.id === 'calculations')?.questions).toBe(30)
    expect(TOPICS.find((t) => t.id === 'theory')?.points).toBe(2)
  })
})

describe('buildExam', () => {
  it('is deterministic for a seed and follows the blueprint as far as the content allows', () => {
    const a = buildExam(42, '2020')
    const b = buildExam(42, '2020')
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
    expect(a.minutes).toBe(240)
    const calc = a.items.filter((i) => i.topic === 'calculations')
    expect(calc).toHaveLength(30)
    expect(calc.every((i) => i.kind === 'calc')).toBe(true)
    // Every topic is either filled or listed in the shortfall, never silently short.
    for (const t of EXAM_TOPICS) {
      const got = a.items.filter((i) => i.topic === t.id).length
      const short = a.shortfall.find((s) => s.topic === t.id)
      if (short) expect(short.got).toBe(got)
      else expect(got).toBe(t.questions)
    }
  })
  it('a short exam is a third of the real one', () => {
    const s = buildExam(7, '2020', { size: 'short' })
    expect(s.minutes).toBe(80)
    expect(s.items.filter((i) => i.topic === 'calculations')).toHaveLength(10)
  })
  it('never repeats a question within one exam', () => {
    const ids = buildExam(3, '2020').items.flatMap((i) => (i.kind === 'question' ? [i.questionId] : []))
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('scoreExam', () => {
  it('all right passes with 100%; all blank fails with 0', () => {
    const paper = buildExam(11, '2020')
    const right = paper.items.map((i) => correctIndex(i))
    const full = scoreExam(paper, right)
    expect(full.pct).toBe(100)
    expect(full.passed).toBe(true)
    const blank = scoreExam(paper, paper.items.map(() => undefined))
    expect(blank.points).toBe(0)
    expect(blank.passed).toBe(false)
  })
  it('theory items count double', () => {
    const paper = buildExam(5, '2020')
    const answers = paper.items.map((i) => (i.topic === 'theory' ? correctIndex(i) : undefined))
    const s = scoreExam(paper, answers)
    const theory = s.byTopic.find((t) => t.topic === 'theory')
    if (theory) expect(theory.points).toBe(theory.asked * 2)
  })
})
