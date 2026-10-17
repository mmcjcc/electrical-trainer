// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Question } from '@/shared/types'
import { defaultPersisted, useStore, type QuestionEv } from '@/store'
import { QuestionCard } from './QuestionCard'

const Q: Question = {
  id: 'gnd-001',
  topic: 'wiring-protection',
  stem: 'According to the NEC, which table sizes the grounding electrode conductor?',
  choices: ['Table 250.122', 'Table 250.66', 'Table 310.16', 'Table 250.102(C)(1)'],
  answer: 1,
  explain: 'The GEC is sized from the largest service-entrance conductor in Table 250.66.',
  ref: { book: 'NEC', loc: 'Table 250.66', title: 'Grounding electrode conductor for AC systems' },
  difficulty: 1,
  editions: ['2020'],
  kind: 'lookup',
  whyNot: { 0: 'Table 250.122 is for equipment grounding conductors, sized by the breaker.' },
}

function lastEvent(): QuestionEv {
  const e = useStore.getState().events.at(-1)
  if (!e || e.t !== 'q') throw new Error('no question event')
  return e
}

beforeEach(() => {
  useStore.setState({ ...defaultPersisted(), toasts: [] })
})

describe('QuestionCard', () => {
  it('records the pick, the highest hint rung and the time, then explains a wrong answer', () => {
    const onAnswered = vi.fn()
    const onNext = vi.fn()
    render(<QuestionCard question={Q} edition="2020" mode="practice" showHint onAnswered={onAnswered} onNext={onNext} position="3 of 10" />)

    expect(screen.getByText('3 of 10')).toBeTruthy()
    const check = screen.getByRole('button', { name: 'Check answer' }) as HTMLButtonElement
    expect(check.disabled).toBe(true)

    // Two rungs of the book hint.
    fireEvent.click(screen.getByRole('button', { name: /Where is it in the book/ }))
    expect(screen.getByText(/Chapter 2: Wiring and Protection/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Closer/ }))
    expect(screen.getByText(/Article 250: Grounding and Bonding/)).toBeTruthy()

    fireEvent.click(screen.getByRole('radio', { name: /^A\. Table 250\.122/ }))
    expect(check.disabled).toBe(false)
    fireEvent.click(check)

    const e = lastEvent()
    expect(e).toMatchObject({ qid: 'gnd-001', topic: 'wiring-protection', pick: 0, correct: false, hint: 2, mode: 'practice' })
    expect(e.ms).toBeGreaterThanOrEqual(0)
    expect(useStore.getState().leitner['gnd-001']?.box).toBe(1)
    expect(onAnswered).toHaveBeenCalledWith(expect.objectContaining({ pick: 0, correct: false, hint: 2 }))

    // The verdict, in words, in a live region.
    const status = screen.getByRole('status')
    expect(status.textContent).toMatch(/Not this one\. You picked A; the answer is B, Table 250\.66/)
    expect(screen.getByText(Q.explain)).toBeTruthy()
    expect(screen.getByText(/equipment grounding conductors, sized by the breaker/)).toBeTruthy()
    // The full reference, opened to the exact table.
    expect(screen.getByText('Exactly:')).toBeTruthy()
    expect(screen.getAllByText('Table 250.66').length).toBeGreaterThan(0)
    expect(screen.getByText(/You opened the book hint \(2 of 3 steps\)/)).toBeTruthy()
    // The options are locked and marked.
    expect(screen.getByText(/Right answer$/)).toBeTruthy()
    expect(screen.getByText(/Your pick/)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Next question' }))
    expect(onNext).toHaveBeenCalledOnce()
    // Answering again is impossible.
    expect(useStore.getState().events).toHaveLength(1)
  })

  it('answers from the keyboard: a letter picks, Enter checks, Enter again moves on', () => {
    const onNext = vi.fn()
    render(<QuestionCard question={Q} edition="2020" mode="review" showHint={false} onNext={onNext} />)
    expect(screen.queryByRole('button', { name: /Where is it in the book/ })).toBeNull()
    fireEvent.keyDown(window, { key: 'b' })
    expect((screen.getByRole('radio', { name: /^B\. Table 250\.66/ }) as HTMLInputElement).checked).toBe(true)
    fireEvent.keyDown(window, { key: '3' })
    expect((screen.getByRole('radio', { name: /^C\. Table 310\.16/ }) as HTMLInputElement).checked).toBe(true)
    fireEvent.keyDown(window, { key: '2' })
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(lastEvent()).toMatchObject({ pick: 1, correct: true, hint: 0, mode: 'review' })
    expect(screen.getByRole('status').textContent).toMatch(/Right: B, Table 250\.66/)
    // The reference is shown after answering even with hints off.
    expect(screen.getByText('Exactly:')).toBeTruthy()
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(onNext).toHaveBeenCalledOnce()
  })

  it('says a Maryland law question is not on the exam outline', () => {
    const law: Question = { ...Q, id: 'law-1', topic: 'md-law', kind: 'law', ref: { book: 'MD', loc: 'BOP §6-604' } }
    render(<QuestionCard question={law} edition="2020" mode="practice" showHint />)
    expect(screen.getByText(/Maryland law · not on the PSI exam outline/)).toBeTruthy()
    expect(screen.getByRole('button', { name: /Where is it in Maryland law/ })).toBeTruthy()
  })
})
