/**
 * /math/r/:recipeId: the recipe card (when to use it, the steps with their book locations, the
 * traps, the formulas) and the four ways to work it, the suggested one highlighted. Each mode
 * starts a fresh problem.
 */
import { Link, useNavigate, useParams } from 'react-router-dom'
import { randomSeed } from '@/calc'
import { FAMILY_TITLE, getRecipe } from '@/content'
import { BookHint } from '@/components/ui/BookHint'
import { MODE_BLURB, MODE_LABEL, MODES } from '@/components/worksheet/ladder'
import { recipeStage, relativeDays, useStore } from '@/store'
import type { CoachMode, Recipe } from '@/shared/types'

/** Short recipes have no buckets; their Paper stage is every line with the label only. */
const PAPER_NO_BUCKETS = 'Every line, labels only: no instructions unless you ask. As close to a blank sheet as it gets.'

function hasBuckets(generate: Recipe['generate']): boolean {
  try {
    return (generate(1).sections?.length ?? 0) > 0
  } catch {
    return false
  }
}

export default function RecipePage() {
  const { recipeId = '' } = useParams()
  const navigate = useNavigate()
  const recipe = getRecipe(recipeId)
  const events = useStore((s) => s.events)
  const edition = useStore((s) => s.settings.edition)

  if (!recipe) {
    return (
      <div className="py-10 text-center">
        <p className="text-ink">That recipe is not here (it may have been renamed).</p>
        <Link to="/math" className="mt-3 inline-flex min-h-11 items-center font-semibold text-slate underline decoration-copper decoration-2 underline-offset-4">
          Back to Math
        </Link>
      </div>
    )
  }

  const stage = recipeStage(events, recipe.id)
  const start = (mode: CoachMode) => navigate(`/math/r/${recipe.id}/${mode}/${randomSeed()}`)
  const { card } = recipe
  const blurb = (m: CoachMode) => (m === 'paper' && !hasBuckets(recipe.generate) ? PAPER_NO_BUCKETS : MODE_BLURB[m])

  return (
    <div className="mx-auto max-w-3xl">
      <nav aria-label="Breadcrumb" className="mb-1">
        <Link to="/math" className="inline-flex min-h-11 items-center gap-1 font-semibold text-slate hover:text-ink">
          <span aria-hidden="true">←</span> Math
        </Link>
      </nav>
      <p className="text-sm font-semibold uppercase tracking-wide text-copper-700">{FAMILY_TITLE[recipe.family]}</p>
      <h1 className="text-2xl font-bold text-ink">{recipe.title}</h1>
      <p className="mt-1 text-ink">{recipe.blurb}</p>

      <section aria-labelledby="modes" className="mt-5">
        <h2 id="modes" className="sr-only">Work it</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {MODES.map((m) => {
            const suggested = !stage.mastered && stage.suggested === m
            return (
              <li key={m}>
                <button
                  type="button"
                  onClick={() => start(m)}
                  aria-describedby={`mode-${m}`}
                  className={`flex h-full min-h-16 w-full flex-col items-start gap-1 rounded-2xl border-2 p-4 text-left ${
                    suggested ? 'border-copper bg-copper-100' : 'border-slate-100 bg-white hover:border-copper'
                  }`}
                >
                  <span className="flex w-full items-center justify-between gap-2">
                    <span className="text-lg font-bold text-ink">{MODE_LABEL[m]}</span>
                    {suggested && <span className="rounded-full bg-copper px-2 py-0.5 text-xs font-bold text-white">Suggested</span>}
                  </span>
                  <span id={`mode-${m}`} className="text-sm text-slate">
                    {blurb(m)}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        <p className="mt-2 text-sm text-slate">
          {stage.mastered
            ? 'Exam ready: two right Test-me picks in a row. Any mode is open any time.'
            : stage.runs === 0
              ? 'Nothing is locked. Start with Show me if this one is new to you.'
              : `${stage.runs} ${stage.runs === 1 ? 'run' : 'runs'} so far${stage.lastAt ? `, last ${relativeDays(stage.lastAt)}` : ''}${
                  stage.testAsked ? `; Test me ${stage.testRight} of ${stage.testAsked} right` : ''
                }.`}
        </p>
      </section>

      <section aria-labelledby="when" className="mt-6">
        <h2 id="when" className="text-lg font-bold text-ink">When to use it</h2>
        <p className="mt-1 text-ink">{card.whenToUse}</p>
      </section>

      <section aria-labelledby="steps" className="mt-6">
        <h2 id="steps" className="text-lg font-bold text-ink">The steps</h2>
        <ol className="mt-2 space-y-3">
          {card.steps.map((s, i) => (
            <li key={i} className="rounded-xl border border-slate-100 bg-white p-3">
              <p className="font-semibold text-ink">
                <span className="tabular mr-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-ink text-sm text-white">{i + 1}</span>
                {s.label}
              </p>
              <p className="mt-1 text-ink">{s.how}</p>
              {s.ref && (
                <div className="mt-2">
                  <BookHint refTo={s.ref} edition={edition} />
                </div>
              )}
            </li>
          ))}
        </ol>
      </section>

      {card.traps.length > 0 && (
        <section aria-labelledby="traps" className="mt-6 rounded-2xl bg-safety-100 p-4">
          <h2 id="traps" className="text-lg font-bold text-ink">
            <span aria-hidden="true">⚠ </span>Traps
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-ink">
            {card.traps.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </section>
      )}

      {card.formulas && card.formulas.length > 0 && (
        <section aria-labelledby="formulas" className="mt-6">
          <h2 id="formulas" className="text-lg font-bold text-ink">Formulas</h2>
          <ul className="mt-2 space-y-2">
            {card.formulas.map((f, i) => (
              <li key={i} className="tabular rounded-xl bg-slate-50 p-3 font-mono text-ink">
                {f}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
