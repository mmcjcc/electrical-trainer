// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defaultPersisted, useStore, type Ev } from '@/store'
import Settings from './Settings'

const T0 = new Date(2026, 9, 14, 12).getTime()
const EVENTS: Ev[] = [
  { t: 'q', at: T0, qid: 'gnd-001', topic: 'wiring-protection', pick: 1, correct: true, hint: 0, ms: 9000, mode: 'practice' },
  { t: 'drill', at: T0 + 1, drill: 'find-it', right: 8, total: 10, ms: 95_000 },
]

function renderSettings() {
  return render(
    <MemoryRouter>
      <Settings />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
  useStore.setState({ ...defaultPersisted(), toasts: [] })
  window.__ET_CONFIG__ = { signOutUrl: '' }
})

afterEach(() => {
  window.__ET_CONFIG__ = { signOutUrl: '' }
})

describe('Settings', () => {
  it('exports the progress as text and imports it back by merge, then by replace', () => {
    useStore.setState({ events: EVENTS, leitner: { 'gnd-001': { box: 2, due: T0 + 86_400_000 } } })
    renderSettings()
    expect(screen.getByText('No backup from this device yet.')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Show backup text' }))
    const text = (screen.getByLabelText('Backup text') as HTMLTextAreaElement).value
    const file = JSON.parse(text) as { app: string; events: Ev[]; leitner: Record<string, unknown> }
    expect(file.app).toBe('electrical-trainer')
    expect(file.events).toHaveLength(2)
    expect(file.leitner['gnd-001']).toEqual({ box: 2, due: T0 + 86_400_000 })
    expect(screen.getByText(/Last backup: today/)).toBeTruthy()

    // Merge into a device that already has the first event: only the second is new.
    useStore.setState({ events: [EVENTS[0] as Ev], leitner: {} })
    fireEvent.change(screen.getByLabelText('…or paste the backup text'), { target: { value: text } })
    fireEvent.click(screen.getByRole('button', { name: 'Import and merge' }))
    expect(screen.getByText('Merged: 1 record added.')).toBeTruthy()
    expect(useStore.getState().events).toHaveLength(2)
    expect(useStore.getState().leitner['gnd-001']?.box).toBe(2)

    // Replace wipes this device's progress first.
    useStore.setState({ events: [{ t: 'drill', at: 5, drill: 'pct', right: 1, total: 1, ms: 1 }] })
    fireEvent.click(screen.getByRole('radio', { name: /Replace this device's progress/ }))
    fireEvent.change(screen.getByLabelText('…or paste the backup text'), { target: { value: text } })
    fireEvent.click(screen.getByRole('button', { name: 'Replace my progress' }))
    expect(screen.getByText(/Replaced: this device now holds the backup's progress \(2 records\)/)).toBeTruthy()
    expect(useStore.getState().events.map((e) => e.t)).toEqual(['q', 'drill'])
  })

  it('refuses a file that is not a backup, and asks for one when the box is empty', () => {
    renderSettings()
    fireEvent.click(screen.getByRole('button', { name: 'Import and merge' }))
    expect(screen.getByRole('alert').textContent).toMatch(/Choose a backup file or paste the backup text first/)
    fireEvent.change(screen.getByLabelText('…or paste the backup text'), { target: { value: '{"app":"something-else"}' } })
    fireEvent.click(screen.getByRole('button', { name: 'Import and merge' }))
    expect(screen.getByRole('alert').textContent).toMatch(/not a backup from this app/)
  })

  it('changes settings and resets progress only after a confirm', () => {
    useStore.setState({ events: EVENTS })
    renderSettings()
    fireEvent.click(screen.getByRole('radio', { name: /2026 NEC/ }))
    expect(useStore.getState().settings.edition).toBe('2026')
    fireEvent.click(screen.getByRole('switch', { name: 'Codebook hints in practice' }))
    expect(useStore.getState().settings.bookHints).toBe('off')
    fireEvent.click(screen.getByRole('radio', { name: /Always shown/ }))
    expect(useStore.getState().settings.keys).toBe('always')
    fireEvent.change(screen.getByLabelText('Exam date'), { target: { value: '2026-12-01' } })
    expect(useStore.getState().settings.examDate).toBe('2026-12-01')

    fireEvent.click(screen.getByRole('button', { name: 'Reset progress…' }))
    fireEvent.click(screen.getByRole('button', { name: 'Keep my progress' }))
    expect(useStore.getState().events).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'Reset progress…' }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, reset everything' }))
    expect(useStore.getState().events).toHaveLength(0)
    // Settings survive a reset.
    expect(useStore.getState().settings.edition).toBe('2026')
  })

  it('shows Sign out as a plain link only when the platform gives a URL', () => {
    const { unmount } = renderSettings()
    expect(screen.queryByRole('link', { name: 'Sign out' })).toBeNull()
    unmount()
    window.__ET_CONFIG__ = { signOutUrl: 'https://auth.apps.mmcjcc.com/oauth2/sign_out' }
    renderSettings()
    const a = screen.getByRole('link', { name: 'Sign out' })
    expect(a.getAttribute('href')).toBe('https://auth.apps.mmcjcc.com/oauth2/sign_out')
    expect(a.closest('form')).toBeNull()
  })
})
