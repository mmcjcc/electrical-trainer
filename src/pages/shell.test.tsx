// @vitest-environment jsdom
import { listRecipes } from '@/content'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Frame } from '@/components/shell/Frame'
import { defaultPersisted, useStore, type Ev } from '@/store'
import About from './About'
import ExamStart from './exam/ExamStart'
import FactsHome from './facts/FactsHome'
import FindIt from './facts/FindIt'
import Home from './Home'
import Progress from './Progress'

vi.mock('@/content/bank', async () => (await import('@/components/question/fixtures')).fixtureBankModule())

function at(path: string, element: React.ReactNode, extra: { path: string; text: string }[] = []) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Frame>
        <Routes>
          <Route path={path} element={element} />
          {extra.map((r) => (
            <Route key={r.path} path={r.path} element={<p>{r.text}</p>} />
          ))}
        </Routes>
      </Frame>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
  useStore.setState({ ...defaultPersisted(), toasts: [] })
})

describe('shell screens', () => {
  it('Home: two doors, Today, countdown, streak and readiness', () => {
    const now = Date.now()
    const evs: Ev[] = [{ t: 'q', at: now - 1000, qid: 'wp-001', topic: 'wiring-protection', pick: 1, correct: false, hint: 0, ms: 1, mode: 'practice' }]
    const d = new Date(now + 10 * 86_400_000)
    const examDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    useStore.setState({ events: evs, leitner: { 'wp-001': { box: 1, due: now - 1 } }, settings: { ...useStore.getState().settings, examDate } })
    at('/', <Home />)
    expect(screen.getByRole('link', { name: /Code questions/ })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Math and load calcs.*30 of 100 points/ })).toBeTruthy()
    expect(screen.getByText(/10 days to your exam/)).toBeTruthy()
    expect(screen.getByText(/1-day streak/)).toBeTruthy()
    const today = screen.getByRole('region', { name: 'Today' })
    const steps = within(today).getAllByRole('link')
    expect(steps[0]?.textContent).toMatch(/Review 1 due question/)
    // Wiring at 0% stands to gain 14 points; untried Theory counts as 50% of 20 = 10.
    expect(steps[1]?.getAttribute('href')).toBe('/facts/practice/wiring-protection')
    // A fresh learner is offered the first recipe of the learning path.
    expect(steps[2]?.getAttribute('href')).toBe(`/math/r/${listRecipes()[0]!.id}`)
    expect(screen.getByRole('list', { name: 'Recent accuracy by exam area' }).textContent).toMatch(/Wiring & protection.*0%/)
    // The frame shows the edition and marks the current tab.
    expect(screen.getByText('MD · NEC 2020')).toBeTruthy()
  })

  it('Facts home: every area with its weight; empty areas look intentional', () => {
    at('/facts', <FactsHome />)
    expect(screen.getByText(/10 questions on the exam, 2 points each \(20 points\)/)).toBeTruthy()
    expect(screen.getByText(/30 questions on the exam: 30 of 100 points/)).toBeTruthy()
    expect(screen.getAllByText('Questions for this area are being written.').length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: 'Practice Wiring and Protection' }).getAttribute('href')).toBe('/facts/practice/wiring-protection')
    expect(screen.getByRole('link', { name: /Mixed practice/ })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Find it in the book/ })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Exam simulator/ })).toBeTruthy()
  })

  it('Find it: a round of ten, logged as a drill', () => {
    at('/facts/find', <FindIt />)
    fireEvent.click(screen.getByRole('button', { name: 'Start a round' }))
    for (let k = 1; k <= 10; k++) {
      expect(screen.getByText(`${k} of 10`)).toBeTruthy()
      fireEvent.keyDown(window, { key: '1' })
      expect(screen.getByRole('status').textContent).toMatch(/Found it|Not there/)
      fireEvent.keyDown(window, { key: 'Enter' })
    }
    expect(screen.getByRole('heading', { name: /of 10 found/ })).toBeTruthy()
    const drills = useStore.getState().events.filter((e) => e.t === 'drill')
    expect(drills).toEqual([expect.objectContaining({ drill: 'find-it', total: 10 })])
  })

  it('Exam start: shows the shortfall honestly and starts the exam', () => {
    at('/exam', <ExamStart />, [{ path: '/exam/run', text: 'Exam screen' }])
    expect(screen.getByText(/This paper has \d+ of the 90 items the blueprint calls for/)).toBeTruthy()
    expect(screen.getByText('Wiring and Protection: 12 of 14')).toBeTruthy()
    const hints = screen.getByRole('switch', { name: 'Book hints during the exam' })
    expect(hints.getAttribute('aria-checked')).toBe('false')
    expect(screen.getByText('Study aid only.')).toBeTruthy()
    expect(screen.getByText(/NEC® are registered trademarks of the National Fire Protection Association/)).toBeTruthy()
    fireEvent.click(screen.getByRole('radio', { name: /Short exam/ }))
    fireEvent.click(screen.getByRole('button', { name: /Start the exam/ }))
    expect(screen.getByText('Exam screen')).toBeTruthy()
    const exam = useStore.getState().exam
    expect(exam?.paper.size).toBe('short')
    expect(exam?.hintsOn).toBe(false)
    expect(exam?.paper.minutes).toBeLessThanOrEqual(80)
  })

  it('Progress and About render', () => {
    useStore.setState({
      events: [
        { t: 'line', at: Date.now(), rid: 'raceway-same-size', seed: 1, line: 'allowed', ok: false, mistake: 'wrong_fill_percent', mode: 'coach' },
        { t: 'exam', at: Date.now(), seed: 1, size: 'short', pct: 72, passed: true, byTopic: [], ms: 3_600_000, hints: false },
      ],
    })
    const { unmount } = at('/progress', <Progress />)
    expect(screen.getByRole('heading', { name: 'By exam area' })).toBeTruthy()
    expect(screen.getByText(/72%/)).toBeTruthy()
    expect(screen.getByText(/last week 0 → this week 1/)).toBeTruthy()
    unmount()
    at('/about', <About />)
    expect(screen.getByText(/Not affiliated with, sponsored or endorsed by the National Fire Protection\s+Association \(NFPA\), PSI Services LLC or the Maryland State Board of Electricians/)).toBeTruthy()
    expect(screen.getByText(/NEC® are registered trademarks of the National Fire Protection Association/)).toBeTruthy()
    expect(screen.getByText(/not for\s+design or installation work/)).toBeTruthy()
    expect(screen.queryByText(/real exam questions|official|guaranteed|complete tables/i)).toBeNull()
  })
})
