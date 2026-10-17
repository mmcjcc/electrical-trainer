/**
 * Test-only helpers for the wiring/motor recipes (imports vitest). On top of `checkRecipe`, they check
 * that every line-specific mistake is NAMED (the right catalog id comes back, not just "wrong") and
 * that every id a recipe uses exists in the mistake catalog.
 */
import { expect } from 'vitest'
import { checkChoice, checkLine, MISTAKES } from '@/calc'
import type { ProblemInstance, Recipe, WorkLine } from '@/shared/types'

const KNOWN = new Set(Object.keys(MISTAKES))

/** Every known mistake on every line comes back with its own id; every choose option with its own. */
export function expectMistakesNamed(p: ProblemInstance): void {
  for (const line of p.lines) {
    for (const m of line.mistakes ?? []) {
      expect(KNOWN.has(m.mistake), `line ${line.id}: mistake id ${m.mistake} is in the catalog`).toBe(true)
      const v = checkLine(line, String(m.value))
      expect(v.ok, `line ${line.id}: ${m.value} is rejected`).toBe(false)
      if (!v.ok) expect(v.mistake, `line ${line.id}: ${m.value} is named ${m.mistake}`).toBe(m.mistake)
    }
    if (line.kind === 'choose') {
      for (const o of line.options ?? []) {
        if (o.id === line.answerId) continue
        if (o.mistake) expect(KNOWN.has(o.mistake), `option ${line.id}/${o.id}: id ${o.mistake} is in the catalog`).toBe(true)
        const v = checkChoice(line, o.id)
        expect(!v.ok && v.mistake).toBe(o.mistake ?? 'unknown')
      }
    }
  }
  for (const c of p.choices) {
    if (c.mistake) expect(KNOWN.has(c.mistake), `choice ${c.label}: id ${c.mistake} is in the catalog`).toBe(true)
  }
}

/**
 * Show-me asks him to predict a checkpoint between the right value and its first known mistake, so a
 * numeric checkpoint needs at least one mistake (a choose checkpoint has its own options). Opt-in.
 */
export function expectCheckpointsPredictable(p: ProblemInstance): void {
  for (const l of p.lines) {
    if (!l.checkpoint || l.kind === 'choose') continue
    expect((l.mistakes ?? []).length, `checkpoint ${l.id} (${p.recipeId} seed ${p.seed}) has a mistake to predict against`).toBeGreaterThan(0)
  }
}

/**
 * Runs `expectMistakesNamed` over many seeds; with `checkpoints`, also `expectCheckpointsPredictable`.
 */
export function expectRecipeMistakesNamed(recipe: Recipe, n = 80, opts: { checkpoints?: boolean } = {}): void {
  for (let seed = 1; seed <= n; seed++) {
    const p = recipe.generate(seed)
    expectMistakesNamed(p)
    if (opts.checkpoints) expectCheckpointsPredictable(p)
  }
}

/** The line by id (throws when missing, so a test fails loudly). */
export function line(p: ProblemInstance, id: string): WorkLine {
  const l = p.lines.find((x) => x.id === id)
  if (!l) throw new Error(`no line ${id} in ${p.recipeId} seed ${p.seed}: ${p.lines.map((x) => x.id).join(', ')}`)
  return l
}

/** The answer line's display. */
export function answerOf(p: ProblemInstance): string {
  return line(p, p.answerLine).display
}

/** The first seed (from 1) whose problem passes the test, for "this case is generated" checks. */
export function findSeed(recipe: Recipe, test: (p: ProblemInstance) => boolean, max = 3000): ProblemInstance | undefined {
  for (let s = 1; s <= max; s++) {
    const p = recipe.generate(s)
    if (test(p)) return p
  }
  return undefined
}

/** Ids of every mistake a recipe produces over many seeds (lines, options, exam choices). */
export function mistakeIdsUsed(recipe: Recipe, n = 300): Set<string> {
  const out = new Set<string>()
  for (let s = 1; s <= n; s++) {
    const p = recipe.generate(s)
    for (const l of p.lines) {
      for (const m of l.mistakes ?? []) out.add(m.mistake)
      for (const o of l.options ?? []) if (o.mistake) out.add(o.mistake)
    }
    for (const c of p.choices) if (c.mistake) out.add(c.mistake)
  }
  return out
}
