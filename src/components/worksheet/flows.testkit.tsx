/**
 * Test-only helper (imports Testing Library): works a whole worksheet through the UI the way a
 * student who knows every answer would, in any mode. Used to check that every registered recipe
 * runs end to end on the worksheet screens.
 */
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { CoachMode, ProblemInstance, WorkLine } from '@/shared/types'
import { paperSteps, predictOptions } from './ladder'
import { WorksheetRun } from './WorksheetRun'

const typed = (l: WorkLine) => l.display.replace(/[^\d.,\-−/]/g, '')

function activeCard(n: number): HTMLElement {
  return screen.getByRole('listitem', { name: new RegExp(`^${n}\\. `) })
}

function answerCard(card: HTMLElement, line: WorkLine) {
  if (line.kind === 'choose') {
    const right = line.options!.find((o) => o.id === line.answerId)!
    fireEvent.click(within(card).getByRole('button', { name: right.label }))
  } else {
    fireEvent.change(within(card).getByRole('textbox'), { target: { value: typed(line) } })
    fireEvent.click(within(card).getByRole('button', { name: 'Check' }))
  }
}

/** Renders the run and works it to the finish card. Throws (via Testing Library) when stuck. */
export function workThrough(instance: ProblemInstance, mode: CoachMode, fade: 1 | 2 = 1): void {
  render(
    <MemoryRouter>
      <WorksheetRun instance={instance} mode={mode} fade={fade} recipeHref="/math/r/x" onStart={() => {}} />
    </MemoryRouter>,
  )
  const numbers = new Map(instance.lines.map((l, i) => [l.id, i + 1]))
  if (mode === 'coach' || (mode === 'paper' && paperSteps(instance).length === 0)) {
    for (const line of instance.lines) answerCard(activeCard(numbers.get(line.id)!), line)
  } else if (mode === 'paper') {
    paperSteps(instance).forEach((step, i) => answerCard(activeCard(i + 1), step.line))
  } else if (mode === 'show') {
    instance.lines.forEach((line, i) => {
      const opts = predictOptions(line, instance.seed, i)
      if (opts) {
        const group = screen.getByRole('group', { name: `Predict line ${i + 1}` })
        fireEvent.click(within(group).getByRole('button', { name: opts.find((o) => o.correct)!.label }))
        fireEvent.click(screen.getByRole('button', { name: 'Show the line' }))
      } else {
        fireEvent.click(screen.getByRole('button', { name: i === 0 ? 'Show the first line' : 'Next line' }))
      }
    })
  } else {
    const group = screen.getByRole('group', { name: 'Answer choices' })
    const idx = instance.choices.findIndex((c) => c.correct)
    fireEvent.click(within(group).getAllByRole('button')[idx]!)
  }
  screen.getByRole('region', { name: 'Finished' })
}
