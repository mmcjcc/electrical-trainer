/**
 * The self-consistency checks every recipe must pass (DESIGN.md §6). A recipe's test file calls
 * `checkRecipe(recipe)` and adds its own hand-worked spot tests. Test-only helper (imports vitest).
 */
import { expect } from 'vitest'
import { checkChoice, checkLine } from '@/calc'
import type { ProblemInstance, Recipe } from '@/shared/types'

export function checkInstance(p: ProblemInstance): void {
  const ids = new Set<string>()
  for (const line of p.lines) {
    expect(ids.has(line.id), `duplicate line id ${line.id}`).toBe(false)
    ids.add(line.id)
    expect(line.label.length, `line ${line.id} has a label`).toBeGreaterThan(0)
    expect(line.say.length, `line ${line.id} says what to do`).toBeGreaterThan(0)
    if (line.kind === 'choose') {
      expect(line.options && line.options.length >= 2, `choose line ${line.id} has options`).toBe(true)
      expect(checkChoice(line, line.answerId as string).ok, `choose line ${line.id} accepts its own answer`).toBe(true)
      for (const o of line.options ?? []) {
        if (o.id !== line.answerId) expect(checkChoice(line, o.id).ok, `choose line ${line.id} rejects ${o.id}`).toBe(false)
      }
      continue
    }
    expect(Number.isFinite(line.value), `line ${line.id} has a finite value`).toBe(true)
    // The line's own value, typed the way it is displayed, is accepted.
    const typed = line.display.replace(/[^\d.,\-−/]/g, '')
    expect(checkLine(line, typed).ok, `line ${line.id} accepts its display "${line.display}" (typed "${typed}")`).toBe(true)
    if (line.kind === 'lookup') expect(line.ref, `lookup line ${line.id} has a book reference`).toBeTruthy()
    if (line.kind === 'calc' && line.operands) {
      expect(line.expr, `calc line ${line.id} prints its arithmetic`).toBeTruthy()
      expect(line.keys?.length, `calc line ${line.id} has keystrokes`).toBeGreaterThan(0)
    }
    // Every known mistake is rejected and named, and none equals the right value.
    for (const m of line.mistakes ?? []) {
      expect(Math.abs(m.value - (line.value as number)) > 1e-9, `line ${line.id}: mistake ${m.mistake} equals the right value`).toBe(true)
      const v = checkLine(line, String(m.value))
      expect(v.ok, `line ${line.id}: mistake value ${m.value} (${m.mistake}) must be rejected`).toBe(false)
      expect(m.message.length).toBeGreaterThan(10)
    }
  }
  // Sections: every referenced total exists; lines of one section are contiguous.
  for (const s of p.sections ?? []) {
    expect(ids.has(s.totalLine), `section ${s.id} total ${s.totalLine} exists`).toBe(true)
    const idxs = p.lines.map((l, i) => (l.section === s.id ? i : -1)).filter((i) => i >= 0)
    expect(idxs.length, `section ${s.id} has lines`).toBeGreaterThan(0)
    expect(idxs[idxs.length - 1]! - idxs[0]! + 1, `section ${s.id} lines are contiguous`).toBe(idxs.length)
  }
  for (const l of p.lines) {
    if (l.section) expect(p.sections?.some((s) => s.id === l.section), `line ${l.id} section ${l.section} is declared`).toBe(true)
  }
  // The answer line exists; exactly one choice is correct; four distinct labels; the correct
  // label is the answer line's display.
  const answer = p.lines.find((l) => l.id === p.answerLine)
  expect(answer, `answer line ${p.answerLine} exists`).toBeTruthy()
  expect(p.choices).toHaveLength(4)
  expect(p.choices.filter((c) => c.correct)).toHaveLength(1)
  expect(new Set(p.choices.map((c) => c.label)).size).toBe(4)
  const right = p.choices.find((c) => c.correct)!
  expect(right.label.replace(/\s/g, ''), 'correct choice matches the answer line').toBe(answer!.display.replace(/\s/g, ''))
  for (const c of p.choices) if (!c.correct) expect(c.why, `wrong choice ${c.label} explains itself`).toBeTruthy()
  // Every given is stated in the story.
  for (const g of p.givens) expect(p.story.includes(g.phrase), `story states given ${g.id} as "${g.phrase}"`).toBe(true)
  expect(p.ask.length).toBeGreaterThan(5)
}

/** Runs `checkInstance` for `n` seeds and checks determinism (same seed, same problem). */
export function checkRecipe(recipe: Recipe, n = 60): void {
  expect(recipe.card.steps.length).toBeGreaterThan(0)
  expect(recipe.card.whenToUse.length).toBeGreaterThan(10)
  for (let seed = 1; seed <= n; seed++) {
    const p = recipe.generate(seed)
    expect(p.recipeId).toBe(recipe.id)
    expect(p.seed).toBe(seed)
    checkInstance(p)
  }
  expect(JSON.stringify(recipe.generate(7))).toBe(JSON.stringify(recipe.generate(7)))
}
