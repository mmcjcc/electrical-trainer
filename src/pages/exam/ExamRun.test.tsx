// @vitest-environment jsdom
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getRecipe, type ExamPaper } from '@/content'
import { defaultPersisted, useStore } from '@/store'
import ExamResults from './ExamResults'
import ExamRun from './ExamRun'

vi.mock('@/content/bank', async () => (await import('@/components/question/fixtures')).fixtureBankModule())

const CALC_SEED = 77
const PAPER: ExamPaper = {
  seed: 4242,
  edition: '2020',
  size: 'short',
  minutes: 11,
  shortfall: [],
  items: [
    { kind: 'question', topic: 'wiring-protection', questionId: 'wp-001' }, // answer A
    { kind: 'question', topic: 'theory', questionId: 'th-001' }, // answer C, worth 2 points
    { kind: 'question', topic: 'equipment', questionId: 'eq-001' }, // answer D
    { kind: 'calc', topic: 'calculations', recipeId: 'raceway-same-size', seed: CALC_SEED },
  ],
}

function renderRun() {
  return render(
    <MemoryRouter initialEntries={['/exam/run']}>
      <Routes>
        <Route path="/exam/run" element={<ExamRun />} />
        <Route path="/exam/results" element={<ExamResults />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
  useStore.setState({ ...defaultPersisted(), toasts: [] })
})

describe('exam run', () => {
  it('answers, flags, navigates, submits with a confirm, and scores on the results page', () => {
    useStore.getState().startExam(PAPER, false)
    renderRun()

    // Item 1: right, and flagged.
    expect(screen.getByText('Question 1 of 4')).toBeTruthy()
    expect(screen.getByRole('timer').textContent).toMatch(/Time left 1[01]:\d\d/)
    expect(screen.queryByRole('button', { name: /Where is it in the book/ })).toBeNull()
    fireEvent.click(screen.getByRole('radio', { name: /^A\. wp-001 option one/ }))
    fireEvent.click(screen.getByRole('button', { name: /Flag for review/ }))
    expect(screen.getByRole('button', { name: /Flagged/ }).getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: /Next/ }))

    // Item 2: wrong (B), with the keyboard.
    expect(screen.getByText('Question 2 of 4')).toBeTruthy()
    fireEvent.keyDown(window, { key: 'b' })
    fireEvent.keyDown(window, { key: 'ArrowRight' })

    // Item 3: left blank, flagged with the F key.
    expect(screen.getByText('Question 3 of 4')).toBeTruthy()
    fireEvent.keyDown(window, { key: 'f' })
    expect(screen.getByText(/2 answered · 2 flagged/)).toBeTruthy()

    // Jump to item 4 from the grid: the calculation.
    fireEvent.click(screen.getByRole('button', { name: 'Show the grid' }))
    expect(screen.getByRole('button', { name: 'Question 1, answered, flagged' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Question 3, blank, flagged, on screen' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Question 4, blank' }))
    expect(screen.getByText('Question 4 of 4')).toBeTruthy()
    const problem = getRecipe('raceway-same-size')!.generate(CALC_SEED)
    expect(screen.getByRole('heading', { level: 2, name: problem.story })).toBeTruthy()
    const right = problem.choices.findIndex((c) => c.correct)
    fireEvent.keyDown(window, { key: String(right + 1) })

    // The session is persisted, so a reload keeps it.
    const saved = JSON.parse(localStorage.getItem('et.exam') ?? 'null') as { answers: (number | null)[]; flags: boolean[]; current: number }
    expect(saved.answers).toEqual([0, 1, null, right])
    expect(saved.flags).toEqual([true, false, true, false])
    expect(saved.current).toBe(3)

    // Submit: the confirm counts blanks and flags.
    fireEvent.click(screen.getByRole('button', { name: 'Review and submit' }))
    const dialog = screen.getByRole('alertdialog', { name: 'Submit the exam?' })
    expect(dialog.textContent).toMatch(/You answered 3 of 4\. 1 is blank and score zero\. 2 are flagged\./)
    // Question 3 is both blank and flagged: it is listed under each.
    expect(within(dialog).getAllByRole('button', { name: 'Go to question 3' })).toHaveLength(2)
    expect(within(dialog).getByRole('button', { name: 'Go to question 1' })).toBeTruthy()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Submit and see my score' }))

    // Results: 1 (wiring) + 0 (theory, 2 possible) + 0 (equipment, blank) + 1 (calc) = 2 of 5 points.
    expect(screen.getByRole('heading', { level: 1, name: 'Exam results' })).toBeTruthy()
    expect(screen.getByRole('heading', { level: 2, name: /40%.*Not a pass yet/ })).toBeTruthy()
    expect(screen.getByText(/2 of 5 points\. The pass mark is 70%: 2 more points would have passed\./)).toBeTruthy()
    expect(screen.getByText(/0 of 2 points \(0 of 1 right\)/)).toBeTruthy()

    const s = useStore.getState()
    expect(s.exam).toBeNull()
    expect(s.lastExam?.answers).toEqual([0, 1, null, right])
    const qs = s.events.filter((e) => e.t === 'q')
    expect(qs).toEqual([
      expect.objectContaining({ qid: 'wp-001', pick: 0, correct: true, mode: 'exam' }),
      expect.objectContaining({ qid: 'th-001', pick: 1, correct: false, mode: 'exam' }),
      expect.objectContaining({ qid: 'eq-001', pick: -1, correct: false, mode: 'exam' }),
    ])
    expect(s.events.at(-1)).toMatchObject({ t: 'exam', pct: 40, passed: false, size: 'short', hints: false })

    // The review starts with what was missed: his answer, the right one, the explanation.
    expect(screen.getByText('Your answer: B, th-001 option two')).toBeTruthy()
    expect(screen.getByText('Right answer: C, th-001 option three')).toBeTruthy()
    expect(screen.getByText('Left blank')).toBeTruthy()
    expect(screen.getByText('Fixture explanation for eq-001.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'All 4' }))
    const work = screen.getByRole('link', { name: 'Work this problem again in Test me' })
    expect(work.getAttribute('href')).toBe(`/math/r/raceway-same-size/test/${CALC_SEED}`)
  })

  it('offers and records book hints only when the exam was started with them on', () => {
    useStore.getState().startExam(PAPER, true)
    renderRun()
    fireEvent.click(screen.getByRole('button', { name: /Where is it in the book/ }))
    fireEvent.click(screen.getByRole('button', { name: /Closer/ }))
    expect(useStore.getState().exam?.hints).toEqual([2, 0, 0, 0])
    // The calculation item has no book hint.
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByText('Question 4 of 4')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Where is it/ })).toBeNull()
  })

  it('says so when no exam is in progress', () => {
    renderRun()
    expect(screen.getByText('No exam is in progress.')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Start an exam' })).toBeTruthy()
  })
})
