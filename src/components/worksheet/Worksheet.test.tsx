// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import { calc, given, mistakeInfo, sum } from '@/calc'
import { getRecipe } from '@/content'
import Worksheet from '@/pages/math/Worksheet'
import { DEFAULT_SETTINGS, useStore, type LineEv, type RecipeEv } from '@/store'
import type { ProblemInstance, WorkLine } from '@/shared/types'
import { WorksheetRun } from './WorksheetRun'

const RID = 'raceway-same-size'
const recipe = getRecipe(RID)!
const SEED = 7
const inst = recipe.generate(SEED)
const L = (id: string): WorkLine => inst.lines.find((l) => l.id === id)!
/** What he would type for a line: its display without the unit. */
const typed = (l: WorkLine) => l.display.replace(/[^\d.,\-−/]/g, '')

const events = () => useStore.getState().events
const lineEvents = () => events().filter((e): e is LineEv => e.t === 'line')
const recipeEvents = () => events().filter((e): e is RecipeEv => e.t === 'recipe')

function Where() {
  const p = useParams()
  return <p>Now at {p.mode} {p.seed}</p>
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/math/r/:recipeId/:mode/:seed" element={<Worksheet />} />
        <Route path="/math/r/:recipeId" element={<p>Recipe card</p>} />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>,
  )
}

function card(label: string | RegExp) {
  return screen.getByRole('listitem', { name: label instanceof RegExp ? label : new RegExp(escapeRe(label)) })
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function enter(l: WorkLine, value: string) {
  const input = screen.getByRole('textbox', { name: new RegExp(escapeRe(l.label)) })
  fireEvent.change(input, { target: { value } })
  fireEvent.click(screen.getByRole('button', { name: 'Check' }))
}

/** Elements showing this text on the page (the screen-reader announcer left out). */
function shown(re: RegExp): HTMLElement[] {
  return screen.queryAllByText(re).filter((el) => !el.closest('[data-testid="announcer"]'))
}

function choose(label: string) {
  fireEvent.click(screen.getByRole('button', { name: label }))
}

beforeEach(() => {
  localStorage.clear()
  useStore.setState({ events: [], settings: { ...DEFAULT_SETTINGS } })
})

describe('Coach me (fade 1)', () => {
  it('accepts right lines, names a wrong one, ignores unreadable input, and finishes', () => {
    renderAt(`/math/r/${RID}/coach/${SEED}`)
    expect(screen.getByRole('heading', { name: 'Coach me' })).toBeInTheDocument()
    expect(screen.getByTestId('progress')).toHaveTextContent(`Line 1 of ${inst.lines.length}`)
    // The story is pinned with its givens highlighted.
    expect(screen.getByText(inst.givens[0]!.phrase)).toBeInTheDocument()

    // Fade 1 shows the instruction.
    const fill = L('fillcase')
    expect(screen.getByText(fill.say)).toBeInTheDocument()
    choose(fill.display)
    expect(lineEvents().at(-1)).toMatchObject({ line: 'fillcase', ok: true, mode: 'coach', rid: RID, seed: SEED })
    expect(screen.getByTestId('progress')).toHaveTextContent(`Line 2 of ${inst.lines.length}`)

    // A known wrong value is named, not just "wrong", and logged with its mistake id.
    const allowed = L('allowed')
    const wrong = allowed.mistakes![0]!
    enter(allowed, String(wrong.value))
    expect(within(card(allowed.label)).getByText(wrong.message)).toBeInTheDocument()
    expect(within(card(allowed.label)).getByText(/Not yet/)).toBeInTheDocument()
    expect(lineEvents().at(-1)).toMatchObject({ line: 'allowed', ok: false, mistake: wrong.mistake })
    // Screen readers hear it too.
    expect(screen.getByTestId('announcer')).toHaveTextContent(`Not yet. ${wrong.message}`)

    // Unreadable input is answered but neither logged nor counted.
    const before = events().length
    enter(allowed, 'abc')
    expect(within(card(allowed.label)).getByText(/does not read as a number/)).toBeInTheDocument()
    expect(events().length).toBe(before)

    // Enter (a form submit) checks too; the focus moves on to the next line's box.
    const box = screen.getByRole('textbox', { name: new RegExp(escapeRe(allowed.label)) })
    fireEvent.change(box, { target: { value: typed(allowed) } })
    fireEvent.submit(box.closest('form')!)
    expect(lineEvents().at(-1)).toMatchObject({ line: 'allowed', ok: true })
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: new RegExp(escapeRe(L('wire').label)) }))
    // The finished line keeps its accepted value.
    expect(screen.getAllByText(allowed.display).length).toBeGreaterThan(0)

    // No picture before the answer line is done.
    expect(screen.queryByRole('img', { name: /Cross-section/ })).toBeNull()
    enter(L('wire'), typed(L('wire')))
    enter(L('divide'), typed(L('divide')))
    enter(L('count'), typed(L('count')))

    expect(screen.getByRole('img', { name: /Cross-section of the raceway/ })).toBeInTheDocument()
    expect(screen.getByText(`${inst.lines.length - 1} of ${inst.lines.length} lines right the first time.`)).toBeInTheDocument()
    expect(recipeEvents()).toHaveLength(1)
    expect(recipeEvents()[0]).toMatchObject({ mode: 'coach', lines: inst.lines.length, firstTry: inst.lines.length - 1, revealed: 0, hints: 0 })
    expect(screen.getByRole('button', { name: 'New problem' })).toBeInTheDocument()
  })

  it('a line that is still wrong after three tries offers to show it; showing is logged as revealed', () => {
    renderAt(`/math/r/${RID}/coach/${SEED}`)
    choose(L('fillcase').display)
    const allowed = L('allowed')
    expect(screen.queryByRole('button', { name: /Stuck\? Show me this line/ })).toBeNull()
    for (const v of ['1', '2', '3']) enter(allowed, v)
    fireEvent.click(screen.getByRole('button', { name: /Stuck\? Show me this line/ }))
    expect(lineEvents().at(-1)).toMatchObject({ line: 'allowed', ok: false, revealed: true })
    expect(screen.getByText('(shown)')).toBeInTheDocument()
  })

  it('a calculator slip offers the keys without being asked', () => {
    renderAt(`/math/r/${RID}/coach/${SEED}`)
    choose(L('fillcase').display)
    enter(L('allowed'), typed(L('allowed')))
    enter(L('wire'), typed(L('wire')))
    const divide = L('divide')
    expect(screen.queryByRole('img', { name: /Calculator keys/ })).toBeNull()
    // Multiplied instead of divided: the generic detector calls it inverse_op.
    enter(divide, String(divide.operands!.a * divide.operands!.b))
    expect(lineEvents().at(-1)).toMatchObject({ line: 'divide', ok: false, mistake: 'inverse_op' })
    expect(screen.getByText(/Your numbers look right/)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Calculator keys: .* divided by .* equals/ })).toBeInTheDocument()
  })
})

describe('Coach me (fade 2)', () => {
  beforeEach(() => {
    // One clean coach run moves the recipe to fade 2.
    useStore.setState({
      events: [{ t: 'recipe', at: Date.now() - 1000, rid: RID, seed: 1, mode: 'coach', lines: 5, firstTry: 5, revealed: 0, hints: 0, ms: 1 }],
    })
  })

  it('shows only the label; the instruction, the book, the numbers and the keys are hint rungs', () => {
    renderAt(`/math/r/${RID}/coach/${SEED}`)
    const fill = L('fillcase')
    expect(screen.queryByText(fill.say)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /What do I do here\?/ }))
    expect(screen.getByText(fill.say)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Which part of the book\?/ }))
    expect(within(card(fill.label)).getByText(/Part of the book:/)).toBeInTheDocument()
    // The last rung shows the line and marks it.
    fireEvent.click(screen.getByRole('button', { name: /Show me this line/ }))
    expect(lineEvents().at(-1)).toMatchObject({ line: 'fillcase', ok: false, revealed: true })

    enter(L('allowed'), typed(L('allowed')))
    enter(L('wire'), typed(L('wire')))

    const divide = L('divide')
    expect(screen.queryByText(divide.say)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /What do I do here\?/ }))
    expect(screen.getByText(divide.say)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Show me the numbers/ }))
    expect(within(card(divide.label)).getByText(divide.expr!)).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /Calculator keys/ })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Show the calculator keys/ }))
    expect(screen.getByRole('img', { name: /Calculator keys/ })).toBeInTheDocument()
    enter(divide, typed(divide))
    enter(L('count'), typed(L('count')))

    const run = recipeEvents().at(-1)!
    expect(run).toMatchObject({ mode: 'coach', revealed: 1, hints: 5 })
  })
})

describe('Show me', () => {
  it('asks him to call each checkpoint, reveals line by line, then hands over to Coach me', () => {
    renderAt(`/math/r/${RID}/show/${SEED}`)
    const fill = L('fillcase')
    // Line 1 is a checkpoint: a choose line offers its own options.
    const group = screen.getByRole('group', { name: 'Predict line 1' })
    expect(within(group).getAllByRole('button')).toHaveLength(fill.options!.length)
    const wrongOpt = fill.options!.find((o) => o.id !== fill.answerId)!
    fireEvent.click(within(group).getByRole('button', { name: wrongOpt.label }))
    expect(shown(/Not this time/).length).toBeGreaterThan(0)
    expect(lineEvents().at(-1)).toMatchObject({ line: 'fillcase', ok: false, mode: 'show', mistake: wrongOpt.mistake })
    fireEvent.click(screen.getByRole('button', { name: 'Show the line' }))
    if (fill.why) expect(screen.getByText(fill.why)).toBeInTheDocument()

    // Plain lines just reveal.
    for (let i = 1; i < inst.lines.length - 1; i++) {
      const line = inst.lines[i]!
      expect(line.checkpoint).toBeFalsy()
      fireEvent.click(screen.getByRole('button', { name: 'Next line' }))
      expect(screen.getAllByText(line.display).length).toBeGreaterThan(0)
    }

    // The rounding line is a checkpoint: the right value against the classic mistake.
    const count = L('count')
    const g2 = screen.getByRole('group', { name: `Predict line ${inst.lines.length}` })
    expect(within(g2).getAllByRole('button')).toHaveLength(2)
    fireEvent.click(within(g2).getByRole('button', { name: count.display }))
    expect(screen.getByText(/it is\./)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Show the line' }))

    expect(screen.getByText('You called 1 of 2 key steps right.')).toBeInTheDocument()
    expect(recipeEvents().at(-1)).toMatchObject({ mode: 'show', checkpoints: { right: 1, asked: 2 } })
    fireEvent.click(screen.getByRole('button', { name: 'Your turn: Coach me' }))
    expect(screen.getByRole('heading', { name: 'Coach me' })).toBeInTheDocument()
  })
})

describe('Test me', () => {
  it('a wrong pick says which mistake builds it and the rule, then shows the worked answer', () => {
    renderAt(`/math/r/${RID}/test/${SEED}`)
    const group = screen.getByRole('group', { name: 'Answer choices' })
    expect(within(group).getAllByRole('button')).toHaveLength(4)
    const idx = inst.choices.findIndex((c) => !c.correct && c.mistake && c.mistake !== 'unknown')
    const wrong = inst.choices[idx]!
    fireEvent.click(within(group).getAllByRole('button')[idx]!)

    expect(shown(/Not this time\./).length).toBeGreaterThan(0)
    expect(screen.getByText(wrong.why!)).toBeInTheDocument()
    expect(screen.getByText(mistakeInfo(wrong.mistake!).lesson)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'The worked answer' })).toBeInTheDocument()
    for (const l of inst.lines) expect(screen.getAllByText(l.label).length).toBeGreaterThan(0)
    expect(screen.getByRole('img', { name: /Cross-section/ })).toBeInTheDocument()
    expect(recipeEvents().at(-1)).toMatchObject({ mode: 'test', pickedCorrect: false, mistake: wrong.mistake })
    // One pick only.
    expect(within(group).getAllByRole('button').every((b) => (b as HTMLButtonElement).disabled)).toBe(true)
    expect(screen.getByRole('button', { name: 'Next problem' })).toBeInTheDocument()
  })

  it('shows the exam-pace timer when the setting is on', () => {
    useStore.setState({ settings: { ...DEFAULT_SETTINGS, testTimer: true } })
    renderAt(`/math/r/${RID}/test/${SEED}`)
    expect(screen.getByRole('timer')).toHaveTextContent('2:40 left')
  })
})

describe('Paper', () => {
  it('a recipe without buckets runs like Coach me with labels only', () => {
    renderAt(`/math/r/${RID}/paper/${SEED}`)
    expect(screen.queryByText(L('fillcase').say)).toBeNull()
    expect(screen.getByRole('button', { name: /What do I do here\?/ })).toBeInTheDocument()
  })

  // A made-up bucketed worksheet (no bucketed recipe exists yet). Numbers are only for the test.
  const lines: WorkLine[] = [
    given({ id: 'area', label: 'Floor area', say: 'Read the floor area from the question.', value: 2000, unit: 'ft2', section: 'L' }),
    calc({ id: 'light', label: 'General lighting load', say: 'Multiply the floor area by 3 VA per square foot.', a: 2000, op: '×', b: 3, unit: 'VA', section: 'L' }),
    sum({ id: 'ltotal', label: 'Lighting bucket', say: 'Add the small-appliance and laundry circuits.', parts: [6000, 3000, 1500], unit: 'VA', section: 'L' }),
    given({ id: 'dryer', label: 'Dryer nameplate', say: 'Read the dryer rating.', value: 5500, unit: 'VA', section: 'D' }),
    calc({ id: 'dtotal', label: 'Dryer bucket', say: 'The larger of 5,000 VA and the nameplate.', a: 5500, op: '×', b: 1, unit: 'VA', section: 'D' }),
    sum({ id: 'total', label: 'Total load', say: 'Add the bucket totals.', parts: [10500, 5500], unit: 'VA' }),
  ]
  const fake: ProblemInstance = {
    recipeId: 'fake-bucketed', seed: 3,
    story: 'A 2,000 ft² house has a 5,500 VA dryer. What is the load?',
    givens: [
      { id: 'area', label: 'Floor area', value: 2000, unit: 'ft2', phrase: '2,000 ft²' },
      { id: 'dryer', label: 'Dryer', value: 5500, unit: 'VA', phrase: '5,500 VA dryer' },
    ],
    ask: 'the total load in VA',
    lines,
    sections: [
      { id: 'L', label: 'Lighting, small appliances and laundry', totalLine: 'ltotal', letter: 'L' },
      { id: 'D', label: 'Dryer', totalLine: 'dtotal', letter: 'D' },
    ],
    answerLine: 'total',
    choices: [
      { label: '16,000 VA', correct: true },
      { label: '12,000 VA', correct: false, mistake: 'unknown', why: 'x' },
      { label: '14,000 VA', correct: false, mistake: 'unknown', why: 'x' },
      { label: '18,000 VA', correct: false, mistake: 'unknown', why: 'x' },
    ],
  }

  it('asks only the bucket totals; a wrong total opens that bucket, then the sheet moves on', () => {
    render(
      <MemoryRouter>
        <WorksheetRun instance={fake} mode="paper" fade={2} recipeHref="/math/r/fake" onStart={() => {}} />
      </MemoryRouter>,
    )
    expect(screen.getByTestId('progress')).toHaveTextContent('Bucket 1 of 2')
    // Only the bucket total is a blank: no floor-area input yet.
    expect(screen.queryByRole('textbox', { name: /Floor area/ })).toBeNull()
    const total = screen.getByRole('textbox', { name: /L · Lighting, small appliances and laundry/ })
    fireEvent.change(total, { target: { value: '9000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Check' }))
    expect(lineEvents().at(-1)).toMatchObject({ rid: 'fake-bucketed', line: 'ltotal', ok: false, mode: 'paper' })
    expect(shown(/That total is off/).length).toBeGreaterThan(0)
    expect(screen.getByTestId('progress')).toHaveTextContent('Bucket 1 of 2 · line 1 of 3')

    // The bucket's own lines, coach style.
    enter(lines[0]!, '2000')
    enter(lines[1]!, '6000')
    enter(lines[2]!, '10500')
    expect(shown(/That total is off/)).toHaveLength(0)
    expect(screen.getByTestId('progress')).toHaveTextContent('Bucket 2 of 2')

    const dryer = screen.getByRole('textbox', { name: /D · Dryer/ })
    fireEvent.change(dryer, { target: { value: '5,500' } })
    fireEvent.click(screen.getByRole('button', { name: 'Check' }))
    expect(screen.getByTestId('progress')).toHaveTextContent('Last: the answer')

    enter(lines[5]!, '16000')
    expect(screen.getByText('2 of 3 totals right the first time.')).toBeInTheDocument()
    expect(recipeEvents().at(-1)).toMatchObject({ rid: 'fake-bucketed', mode: 'paper', lines: 3, firstTry: 2, revealed: 0 })
  })
})

describe('the page', () => {
  it('an unknown mode goes back to the recipe card; an unknown recipe says so', () => {
    renderAt(`/math/r/${RID}/nonsense/1`)
    expect(screen.getByText('Recipe card')).toBeInTheDocument()
  })
  it('an unknown recipe says so', () => {
    renderAt('/math/r/no-such-recipe/coach/1')
    expect(screen.getByText(/That recipe is not here/)).toBeInTheDocument()
  })
})
