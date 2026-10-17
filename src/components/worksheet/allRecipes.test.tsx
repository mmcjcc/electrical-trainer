// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { beforeEach, describe, expect, it } from 'vitest'
import { cleanup } from '@testing-library/react'
import { listRecipes } from '@/content'
import { DEFAULT_SETTINGS, useStore } from '@/store'
import { MODES } from './ladder'
import { workThrough } from './flows.testkit'

beforeEach(() => {
  localStorage.clear()
  useStore.setState({ events: [], settings: { ...DEFAULT_SETTINGS } })
})

// Every registered recipe (more arrive over time) must run end to end in every mode.
describe.each(listRecipes().map((r) => [r.id, r] as const))('%s on the worksheet', (_id, recipe) => {
  for (const mode of MODES) {
    it(`${mode}: works through to the finish card for a few seeds`, () => {
      for (const seed of [1, 2, 3, 11, 42]) {
        const before = useStore.getState().events.filter((e) => e.t === 'recipe').length
        workThrough(recipe.generate(seed), mode, seed % 2 === 0 ? 2 : 1)
        const runs = useStore.getState().events.filter((e) => e.t === 'recipe')
        expect(runs).toHaveLength(before + 1)
        const last = runs.at(-1)!
        if (last.t === 'recipe' && (mode === 'coach' || mode === 'paper')) expect(last.firstTry).toBe(last.lines)
        if (last.t === 'recipe' && mode === 'test') expect(last.pickedCorrect).toBe(true)
        cleanup()
      }
      // A full dwelling calculation is ~30 lines; five seeds through jsdom can pass 20 s on a cold run.
    }, 90_000)
  }
})
