/**
 * /math: every calculation recipe by family (load calculations first), each with the stage he is
 * at, plus the number drills, the exam strategy page, and the mistakes he makes most this fortnight.
 */
import { Link } from 'react-router-dom'
import { mistakeInfo } from '@/calc'
import { EXAM, FAMILY_ORDER, FAMILY_TITLE, recipesByFamily, topic } from '@/content'
import { MODE_LABEL } from '@/components/worksheet/ladder'
import { mistakeCounts, recipeStage, relativeDays, useStore, type RecipeStage } from '@/store'
import { mistakeTrend, recentMistakes, type Trend } from '@/store/selectors.math'
import type { Recipe } from '@/shared/types'

const TREND_TEXT: Record<Trend, string> = {
  better: 'getting better',
  worse: 'more than last week',
  same: 'same as last week',
  new: 'new this week',
  gone: 'none lately',
}

function StageChip({ stage }: { stage: RecipeStage }) {
  if (stage.mastered) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-ok-100 px-2.5 py-1 text-sm font-semibold text-ok">
        <span aria-hidden="true">✓</span> Exam ready
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-copper-100 px-2.5 py-1 text-sm font-semibold text-copper-700">
      Next: {MODE_LABEL[stage.suggested]}
      {stage.clean > 0 && <span className="ml-1 font-normal">({stage.clean} of {stage.needed})</span>}
    </span>
  )
}

function RecipeCard({ recipe, stage }: { recipe: Recipe; stage: RecipeStage }) {
  return (
    <li>
      <Link
        to={`/math/r/${recipe.id}`}
        className="flex h-full flex-col gap-2 rounded-2xl border-2 border-slate-100 bg-white p-4 hover:border-copper focus-visible:border-copper"
      >
        <span className="text-lg font-bold text-ink">{recipe.title}</span>
        <span className="text-slate">{recipe.blurb}</span>
        <span className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
          <StageChip stage={stage} />
          <span className="text-sm text-slate">{stage.lastAt ? `Last done ${relativeDays(stage.lastAt)}` : 'Not started'}</span>
        </span>
      </Link>
    </li>
  )
}

export default function MathHome() {
  const events = useStore((s) => s.events)
  const now = Date.now()
  const top = recentMistakes(mistakeCounts(events, now), 3)
  const families = FAMILY_ORDER.map((f) => ({ family: f, recipes: recipesByFamily(f) }))
  const ready = families.filter((x) => x.recipes.length > 0)
  const coming = families.filter((x) => x.recipes.length === 0)
  const calc = topic('calculations')

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Math</h1>
      <p className="mt-1 max-w-2xl text-ink">
        Calculations are {calc.questions} of the {EXAM.questions} questions. Each kind is a recipe: the same worksheet every time, only the
        numbers change. Start with Show me; the app tells you when to move on.
      </p>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        <li>
          <Link to="/math/drills" className="flex min-h-16 items-center gap-3 rounded-2xl bg-ink p-4 text-white hover:bg-slate">
            <span aria-hidden="true" className="text-2xl">⚡</span>
            <span>
              <span className="block font-bold">Number drills</span>
              <span className="block text-sm text-slate-100">45-second rounds: percents, divisors, rounding</span>
            </span>
          </Link>
        </li>
        <li>
          <Link to="/math/strategy" className="flex min-h-16 items-center gap-3 rounded-2xl border-2 border-ink bg-white p-4 text-ink hover:bg-slate-50">
            <span aria-hidden="true" className="text-2xl">🧭</span>
            <span>
              <span className="block font-bold">Exam strategy</span>
              <span className="block text-sm text-slate">Three passes, the brain dump, pacing</span>
            </span>
          </Link>
        </li>
      </ul>

      {top.length > 0 && (
        <section aria-labelledby="top-mistakes" className="mt-5 rounded-2xl bg-safety-100 p-4">
          <h2 id="top-mistakes" className="font-bold text-ink">Your top mistakes</h2>
          <ul className="mt-2 space-y-2">
            {top.map((m) => {
              const trend = mistakeTrend(m)
              return (
                <li key={m.id} className="text-ink">
                  <span className="font-semibold">{mistakeInfo(m.id).title}</span>
                  <span className="tabular block text-sm text-slate">
                    This week {m.thisWeek}, last week {m.lastWeek}: {TREND_TEXT[trend]}
                    {trend === 'better' && <span aria-hidden="true"> ↓</span>}
                    {trend === 'worse' && <span aria-hidden="true"> ↑</span>}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {ready.map(({ family, recipes }) => (
        <section key={family} aria-labelledby={`fam-${family}`} className="mt-6">
          <h2 id={`fam-${family}`} className="mb-2 text-lg font-bold text-ink">
            {FAMILY_TITLE[family]}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {recipes.map((r) => (
              <RecipeCard key={r.id} recipe={r} stage={recipeStage(events, r.id)} />
            ))}
          </ul>
        </section>
      ))}

      {coming.length > 0 && (
        <p className="mt-6 text-sm text-slate">
          <span className="font-semibold">On the way:</span> {coming.map((c) => FAMILY_TITLE[c.family]).join(', ')}.
        </p>
      )}
    </div>
  )
}
