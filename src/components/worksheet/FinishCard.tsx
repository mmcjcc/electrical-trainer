/**
 * The end of a worksheet: how it went in one line, what to try next (the recipe's stage after this
 * run), and the way on: a new problem, the suggested mode, or back to the recipe card.
 */
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { recipeStage, useStore } from '@/store'
import type { CoachMode } from '@/shared/types'
import { MODE_LABEL } from './ladder'

export interface FinishCardProps {
  rid: string
  mode: CoachMode
  /** "6 of 7 lines right the first time." */
  summary: string
  /** Extra line under the summary (shown lines, hints). */
  detail?: string
  recipeHref: string
  onStart: (mode: CoachMode) => void
  /** Take the focus when it appears (not in Test me, where the verdict has it). */
  focus?: boolean
}

const CLEAN_RULE: Record<CoachMode, string> = {
  show: 'calling at least half of the key steps right',
  coach: 'no lines shown and at least 8 in 10 right the first time',
  paper: 'no lines shown and at least 8 in 10 totals right the first time',
  test: 'the right pick',
}

export function FinishCard({ rid, mode, summary, detail, recipeHref, onStart, focus = true }: FinishCardProps) {
  const events = useStore((s) => s.events)
  const stage = recipeStage(events, rid)
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!focus || !el) return
    // Scroll as little as possible, so the picture just above stays in view.
    el.focus({ preventScroll: true })
    if (typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'nearest' })
  }, [focus])

  const suggested = stage.suggested
  const primary: CoachMode = mode === 'show' ? 'coach' : mode
  const nextText = stage.mastered
    ? 'Exam ready on this one. Keep it fresh with a Test me now and then.'
    : suggested === mode
      ? `Stay with ${MODE_LABEL[mode]} for now: ${stage.clean} of ${stage.needed} clean runs (a clean run is ${CLEAN_RULE[mode]}).`
      : `Next suggested: ${MODE_LABEL[suggested]}.`

  return (
    <section ref={ref} tabIndex={-1} aria-label="Finished" className="mt-6 rounded-2xl border-2 border-ink bg-white p-4 outline-none">
      <h2 className="text-lg font-bold text-ink">{mode === 'test' ? 'Next step' : 'Worksheet done'}</h2>
      <p className="mt-1 text-lg text-ink">{summary}</p>
      {detail && <p className="mt-1 text-slate">{detail}</p>}
      <p className="mt-2 text-ink">{nextText}</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={() => onStart(primary)}
          className="min-h-12 rounded-xl bg-copper px-5 font-semibold text-white hover:bg-copper-700"
        >
          {mode === 'show' ? 'Your turn: Coach me' : mode === 'test' ? 'Next problem' : 'New problem'}
        </button>
        {!stage.mastered && suggested !== primary && (
          <button
            type="button"
            onClick={() => onStart(suggested)}
            className="min-h-12 rounded-xl border-2 border-ink px-5 font-semibold text-ink hover:bg-slate-50"
          >
            Try {MODE_LABEL[suggested]}
          </button>
        )}
        <Link to={recipeHref} className="flex min-h-12 items-center justify-center rounded-xl px-5 font-semibold text-slate underline decoration-copper decoration-2 underline-offset-4 hover:bg-slate-50">
          Back to the recipe
        </Link>
      </div>
    </section>
  )
}
