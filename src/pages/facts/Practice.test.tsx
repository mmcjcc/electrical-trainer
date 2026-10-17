// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FIXTURE_QUESTIONS } from '@/components/question/fixtures'
import { defaultPersisted, useStore, type Ev } from '@/store'
import Practice from './Practice'
import Review from './Review'

vi.mock('@/content/bank', async () => (await import('@/components/question/fixtures')).fixtureBankModule())

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/facts/practice/:topicId" element={<Practice />} />
        <Route path="/facts/review" element={<Review />} />
        <Route path="/facts" element={<p>Facts home</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

/** The id of the question on screen, read from its fixture stem ("Fixture stem wp-003?"). */
function currentId(): string {
  const h = screen.getByRole('heading', { level: 2, name: /^Fixture stem / })
  return (h.textContent ?? '').replace('Fixture stem ', '').replace('?', '')
}

const LETTER = ['A', 'B', 'C', 'D']

/** Answers the question on screen, right or wrong on purpose. */
function answer(right: boolean) {
  const q = FIXTURE_QUESTIONS.find((x) => x.id === currentId())
  if (!q) throw new Error('unknown fixture on screen')
  const k = right ? q.answer : (q.answer + 1) % 4
  fireEvent.click(screen.getByRole('radio', { name: new RegExp(`^${LETTER[k]}\\. `) }))
  fireEvent.click(screen.getByRole('button', { name: 'Check answer' }))
}

beforeEach(() => {
  useStore.setState({ ...defaultPersisted(), toasts: [] })
})

describe('Practice', () => {
  it('runs ten distinct questions, unseen first, with a running count and a summary', () => {
    // Five of the twelve wiring-and-protection questions were answered before.
    const at = Date.now() - 86_400_000
    const seen: Ev[] = ['wp-001', 'wp-002', 'wp-003', 'wp-004', 'wp-005'].map((qid, k) => ({
      t: 'q', at: at + k, qid, topic: 'wiring-protection', pick: 0, correct: true, hint: 0, ms: 1000, mode: 'practice',
    }))
    useStore.setState({ events: seen })
    renderAt('/facts/practice/wiring-protection')

    expect(screen.getByRole('heading', { level: 1, name: 'Wiring and Protection' })).toBeTruthy()
    expect(screen.getByText(/14 questions on the exam\. 12 here to practise/)).toBeTruthy()

    const ids: string[] = []
    for (let k = 1; k <= 10; k++) {
      expect(screen.getByText(`${k} of 10`)).toBeTruthy()
      ids.push(currentId())
      answer(k !== 4) // miss the fourth
      fireEvent.click(screen.getByRole('button', { name: k === 10 ? 'See how you did' : 'Next question' }))
    }
    expect(new Set(ids).size).toBe(10)
    // The seven unseen ones come first.
    const unseen = new Set(['wp-006', 'wp-007', 'wp-008', 'wp-009', 'wp-010', 'wp-011', 'wp-012'])
    expect(ids.slice(0, 7).every((id) => unseen.has(id))).toBe(true)

    expect(screen.getByRole('heading', { name: '9 of 10 right' })).toBeTruthy()
    expect(screen.getByText(/90%: at or above the 70% pass mark/)).toBeTruthy()
    expect(screen.getAllByText(/Missed/)).toHaveLength(1)
    // Ten answers logged, mode practice; the miss is due in Review now.
    const logged = useStore.getState().events.filter((e) => e.t === 'q' && e.mode === 'practice')
    expect(logged).toHaveLength(15)
    // (The store files a first answer in box 1, so how many are due depends on its Leitner rule.)
    expect(screen.getByRole('link', { name: /^Review \(\d+ due\)$/ })).toBeTruthy()

    // Another round starts at 1 of 10 again.
    fireEvent.click(screen.getByRole('button', { name: 'Another 10' }))
    expect(screen.getByText('1 of 10')).toBeTruthy()
  })

  it('mixed practice draws from every exam area and leaves out Maryland law', () => {
    renderAt('/facts/practice/mixed')
    expect(screen.getByText(/15 questions to draw from/)).toBeTruthy()
    const ids: string[] = []
    for (let k = 1; k <= 10; k++) {
      ids.push(currentId())
      answer(true)
      fireEvent.click(screen.getByRole('button', { name: k === 10 ? 'See how you did' : 'Next question' }))
    }
    expect(ids).not.toContain('law-001')
    expect(new Set(ids).size).toBe(10)
  })

  it('an area with no questions yet says so plainly', () => {
    renderAt('/facts/practice/special-equipment')
    expect(screen.getByText('Questions for this area are being written.')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Find it in the book' })).toBeTruthy()
  })

  it('review brings back what is due, in review mode', () => {
    const now = Date.now()
    useStore.setState({ leitner: { 'wp-002': { box: 1, due: now - 1 }, 'eq-001': { box: 2, due: now - 1 }, 'wp-003': { box: 3, due: now + 3 * 86_400_000 } } })
    renderAt('/facts/review')
    expect(screen.getByText('1 of 2')).toBeTruthy()
    answer(true)
    fireEvent.click(screen.getByRole('button', { name: 'Next question' }))
    expect(screen.getByText('2 of 2')).toBeTruthy()
    answer(true)
    fireEvent.click(screen.getByRole('button', { name: 'See how you did' }))
    const modes = useStore.getState().events.map((e) => (e.t === 'q' ? e.mode : null))
    expect(modes).toEqual(['review', 'review'])
    expect(screen.getByText(/That clears everything that was due/)).toBeTruthy()
  })
})
