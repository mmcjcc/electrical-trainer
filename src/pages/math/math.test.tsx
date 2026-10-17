// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import { getNumberDrill, listRecipes, type DrillItem } from '@/content'
import { DEFAULT_SETTINGS, useStore } from '@/store'
import MathHome from './MathHome'
import RecipePage from './RecipePage'
import Drills from './Drills'
import Strategy from './Strategy'

function Where() {
  const p = useParams()
  return <p>Worksheet {p.recipeId} {p.mode} {p.seed}</p>
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/math" element={<MathHome />} />
        <Route path="/math/r/:recipeId" element={<RecipePage />} />
        <Route path="/math/r/:recipeId/:mode/:seed" element={<Where />} />
        <Route path="/math/drills" element={<Drills />} />
        <Route path="/math/drills/:drillId" element={<Drills />} />
        <Route path="/math/strategy" element={<Strategy />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
  useStore.setState({ events: [], settings: { ...DEFAULT_SETTINGS } })
})
afterEach(() => {
  vi.restoreAllMocks()
})

describe('Math home', () => {
  it('lists every registered recipe with its stage, the drills and the strategy page', () => {
    renderAt('/math')
    const links = screen.getAllByRole('link')
    for (const r of listRecipes()) {
      // Titles overlap ("Voltage drop" / "Voltage drop: the smallest wire"), so find the card by its target.
      const link = links.find((l) => l.getAttribute('href') === `/math/r/${r.id}`)
      if (!link) throw new Error(`no card for ${r.id}`)
      expect(link.textContent).toContain(r.title)
      expect(within(link).getByText(/Next: Show me/)).toBeInTheDocument()
      expect(within(link).getByText('Not started')).toBeInTheDocument()
    }
    expect(screen.getByRole('link', { name: /Number drills/ })).toHaveAttribute('href', '/math/drills')
    expect(screen.getByRole('link', { name: /Exam strategy/ })).toHaveAttribute('href', '/math/strategy')
    expect(screen.queryByRole('heading', { name: 'Your top mistakes' })).toBeNull()
  })
  it('shows the top mistakes with this week against last week, and exam-ready recipes', () => {
    const rid = listRecipes()[0]!.id
    const now = Date.now()
    useStore.setState({
      events: [
        { t: 'line', at: now, rid, seed: 1, line: 'x', ok: false, mistake: 'rounded_count_up', mode: 'coach' },
        { t: 'line', at: now, rid, seed: 1, line: 'x', ok: false, mistake: 'rounded_count_up', mode: 'coach' },
        { t: 'recipe', at: now, rid, seed: 1, mode: 'test', lines: 0, firstTry: 0, revealed: 0, hints: 0, ms: 1, pickedCorrect: true },
        { t: 'recipe', at: now, rid, seed: 2, mode: 'test', lines: 0, firstTry: 0, revealed: 0, hints: 0, ms: 1, pickedCorrect: true },
      ],
    })
    renderAt('/math')
    const strip = screen.getByRole('region', { name: 'Your top mistakes' })
    expect(within(strip).getByText('Rounded the number of wires up')).toBeInTheDocument()
    expect(within(strip).getByText(/This week 2, last week 0/)).toBeInTheDocument()
    expect(screen.getByText('Exam ready')).toBeInTheDocument()
  })
})

describe('Recipe page', () => {
  it('prints the card and starts the chosen mode with a fresh seed', () => {
    const r = listRecipes()[0]!
    renderAt(`/math/r/${r.id}`)
    expect(screen.getByRole('heading', { name: r.title })).toBeInTheDocument()
    expect(screen.getByText(r.card.whenToUse)).toBeInTheDocument()
    for (const s of r.card.steps) expect(screen.getByText(s.how)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Where is it in the book\?/ }).length).toBe(r.card.steps.filter((s) => s.ref).length)
    for (const t of r.card.traps) expect(screen.getByText(t)).toBeInTheDocument()
    // Nothing done yet: Show me is suggested.
    expect(within(screen.getByRole('button', { name: /Show me/ })).getByText('Suggested')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Coach me/ }))
    expect(screen.getByText(new RegExp(`Worksheet ${r.id} coach \\d+`))).toBeInTheDocument()
  })
  it('an unknown recipe says so', () => {
    renderAt('/math/r/nope')
    expect(screen.getByText(/That recipe is not here/)).toBeInTheDocument()
  })
})

describe('Drills', () => {
  it('lists the drills', () => {
    renderAt('/math/drills')
    for (const t of ['Percent to multiplier', 'Pick the divisor', 'First part at 100%, the rest at less', 'kW to VA', 'Keep or bump up?']) {
      expect(screen.getByRole('link', { name: new RegExp(t.replace(/[?%]/g, '.')) })).toBeInTheDocument()
    }
  })

  function answer(item: DrillItem, right: boolean) {
    if (item.kind === 'choice') {
      const pick = right ? item.answer : item.options!.find((o) => o !== item.answer)!
      fireEvent.click(within(screen.getByRole('group', { name: 'Answers' })).getByRole('button', { name: new RegExp(pick.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }))
    } else {
      const input = screen.getByRole('textbox', { name: 'Your answer' })
      fireEvent.change(input, { target: { value: right ? String(item.value) : '99999' } })
      fireEvent.click(screen.getByRole('button', { name: 'Check' }))
    }
  }

  for (const id of ['divisor', 'threshold'] as const) {
    it(`${id}: a round of ten, the rule after each answer, the score at the end, logged`, () => {
      // randomSeed() reads Math.random: pin it so the test knows the round.
      vi.spyOn(Math, 'random').mockReturnValue(0.25)
      const items = getNumberDrill(id)!.generate(Math.floor(0.25 * 2 ** 31))
      renderAt(`/math/drills/${id}`)
      fireEvent.click(screen.getByRole('button', { name: 'Start' }))
      items.forEach((item, i) => {
        expect(screen.getByText(`${i + 1} of 10`)).toBeInTheDocument()
        expect(screen.getByText(item.prompt)).toBeInTheDocument()
        answer(item, i !== 3)
        if (i === 3) expect(screen.getByText(/Not this one/)).toBeInTheDocument()
        else expect(screen.getByText(/Right\./)).toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: i === 9 ? 'See the score' : 'Next' }))
      })
      expect(screen.getByRole('heading', { name: /9 of 10 right in/ })).toBeInTheDocument()
      const ev = useStore.getState().events.at(-1)
      expect(ev).toMatchObject({ t: 'drill', drill: id, right: 9, total: 10 })
      expect(screen.getByRole('button', { name: 'Another round' })).toBeInTheDocument()
    })
  }

  it('unreadable input is not counted', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    renderAt('/math/drills/kw')
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Your answer' }), { target: { value: 'lots' } })
    fireEvent.click(screen.getByRole('button', { name: 'Check' }))
    expect(screen.getByText(/does not read as a number/)).toBeInTheDocument()
    expect(screen.getByText('1 of 10')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
  })
})

describe('Strategy', () => {
  it('teaches the passes, the brain dump, crossing off sizes, the anchors and the pace', () => {
    renderAt('/math/strategy')
    for (const h of ['1. Three passes through the test', '2. The brain dump', '3. Read the four choices first', '4. Estimate before you punch', '5. Pacing', '6. The calculator']) {
      expect(screen.getByRole('heading', { name: h })).toBeInTheDocument()
    }
    for (const d of ['208 V 3φ: ÷ 360', '240 V 3φ: ÷ 416', '480 V 3φ: ÷ 831']) expect(screen.getByText(new RegExp(d))).toBeInTheDocument()
    expect(screen.getByText(/K = 12.9 copper, 21.2 aluminum/)).toBeInTheDocument()
    expect(screen.getAllByText('not a standard size')).toHaveLength(2)
    expect(screen.getByText(/240 minutes for 90 questions is about 2.7 minutes/)).toBeInTheDocument()
    expect(screen.getByText(/on-screen calculator/i)).toBeInTheDocument()
  })
})
