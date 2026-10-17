/**
 * /math/r/:recipeId/:mode/:seed: one problem of a recipe in one of the four modes. The seed is in
 * the address, so a problem can be reopened or shared; "New problem" picks a fresh seed.
 */
import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { randomSeed } from '@/calc'
import { getRecipe } from '@/content'
import { isMode, MODE_LABEL } from '@/components/worksheet/ladder'
import { WorksheetRun } from '@/components/worksheet/WorksheetRun'
import { fadeFor, useStore } from '@/store'
import type { CoachMode, ProblemInstance, Recipe } from '@/shared/types'

export default function Worksheet() {
  const { recipeId = '', mode, seed = '' } = useParams()
  const recipe = getRecipe(recipeId)
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
  if (!isMode(mode)) return <Navigate to={`/math/r/${recipe.id}`} replace />
  const n = Number(seed)
  if (!/^\d+$/.test(seed) || !Number.isSafeInteger(n)) return <Navigate to={`/math/r/${recipe.id}/${mode}/${randomSeed()}`} replace />
  return <WorksheetPage key={`${recipe.id}/${mode}/${n}`} recipe={recipe} mode={mode} seed={n} />
}

function WorksheetPage({ recipe, mode, seed }: { recipe: Recipe; mode: CoachMode; seed: number }) {
  const navigate = useNavigate()
  // Read once: the fading must not change in the middle of a run (finishing one can change it).
  const [fade] = useState(() => fadeFor(useStore.getState().events, recipe.id))
  const generated = useMemo((): { ok: true; instance: ProblemInstance } | { ok: false } => {
    try {
      return { ok: true, instance: recipe.generate(seed) }
    } catch {
      return { ok: false }
    }
  }, [recipe, seed])
  const recipeHref = `/math/r/${recipe.id}`
  const start = (m: CoachMode) => navigate(`/math/r/${recipe.id}/${m}/${randomSeed()}`)

  return (
    <div className="mx-auto max-w-3xl">
      <nav aria-label="Breadcrumb" className="mb-1">
        <Link to={recipeHref} className="inline-flex min-h-11 items-center gap-1 font-semibold text-slate hover:text-ink">
          <span aria-hidden="true">←</span> {recipe.title}
        </Link>
      </nav>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3">
        <h1 className="text-2xl font-bold text-ink">{MODE_LABEL[mode]}</h1>
        {mode === 'coach' && (
          <p className="text-sm text-slate">{fade === 1 ? 'Instructions shown' : 'Labels only: the instructions are behind the hints'}</p>
        )}
      </div>
      {generated.ok ? (
        <WorksheetRun instance={generated.instance} mode={mode} fade={fade} recipeHref={recipeHref} onStart={start} />
      ) : (
        <div className="rounded-xl bg-bad-100 p-4 text-ink">
          <p>This problem could not be built. That is our bug, not yours.</p>
          <button type="button" onClick={() => start(mode)} className="mt-3 min-h-11 rounded-xl bg-ink px-4 font-semibold text-white">
            Try another problem
          </button>
        </div>
      )}
    </div>
  )
}
