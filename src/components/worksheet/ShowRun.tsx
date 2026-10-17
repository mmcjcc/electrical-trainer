/**
 * Show me: the worked example, one line at a time, each with its why. A checkpoint line first asks
 * him to call it (the right value against the classic mistake, or a choose line's options), says
 * whether he was right and why, then shows the line. Passive reading is not enough.
 */
import { useEffect, useRef, useState } from 'react'
import type { NecEdition, ProblemInstance, WorkLine } from '@/shared/types'
import type { AttemptLog } from './LineWork'
import { predictOptions, type PredictOption } from './ladder'
import { useLatest } from './useLatest'
import { WorkedColumn } from './WorkedLine'

export interface ShowRunProps {
  instance: ProblemInstance
  edition: NecEdition
  keysAlways: boolean
  onAttempt: (e: AttemptLog) => void
  onLineShown: (line: WorkLine) => void
  onProgress: (shown: number, total: number) => void
  onComplete: (checkpoints: { right: number; asked: number }) => void
  announce: (text: string) => void
}

export function ShowRun({ instance, edition, keysAlways, onAttempt, onLineShown, onProgress, onComplete, announce }: ShowRunProps) {
  const lines = instance.lines
  const [shown, setShown] = useState(0)
  const [picks, setPicks] = useState<Record<string, PredictOption>>({})
  const [tally, setTally] = useState({ right: 0, asked: 0 })
  // Bumped after each action so the main control takes the focus (not on first render).
  const [focusTick, setFocusTick] = useState(0)
  const controlRef = useRef<HTMLDivElement>(null)

  const progress = useLatest(onProgress)
  useEffect(() => {
    progress.current(shown, lines.length)
  }, [shown, lines.length, progress])

  useEffect(() => {
    if (focusTick === 0) return
    controlRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
  }, [focusTick])

  const next = shown < lines.length ? lines[shown] : undefined
  const options = next ? predictOptions(next, instance.seed, shown) : null
  const picked = next ? picks[next.id] : undefined

  const showNext = () => {
    if (!next) return
    const n = shown + 1
    setShown(n)
    onLineShown(next)
    announce(`Line ${n}: ${next.label}, ${next.display}.`)
    if (n >= lines.length) onComplete(tally)
    setFocusTick((t) => t + 1)
  }

  const predict = (o: PredictOption) => {
    if (!next) return
    setPicks((p) => ({ ...p, [next.id]: o }))
    setTally((t) => ({ right: t.right + (o.correct ? 1 : 0), asked: t.asked + 1 }))
    onAttempt({ line: next.id, ok: o.correct, ...(o.correct ? {} : { mistake: o.mistake ?? 'unknown' }) })
    announce(o.correct ? `Right: ${o.label}.` : `Not this time. ${o.message ?? ''} The line is ${next.display}.`)
    setFocusTick((t) => t + 1)
  }

  return (
    <div>
      {shown > 0 && <WorkedColumn instance={instance} upTo={shown} edition={edition} keysAlways={keysAlways} freshLast />}

      {next && (
        <div ref={controlRef} className="mt-4">
          {options && !picked ? (
            <div className="rounded-2xl border-2 border-copper bg-white p-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-copper-700">Your call</p>
              <h3 className="mt-1 text-lg font-bold text-ink">
                <span className="tabular text-slate">{shown + 1}.</span> {next.label}
              </h3>
              <p className="mt-1 text-ink">{next.say}</p>
              <p className="mt-2 font-semibold text-ink">Which goes on this line?</p>
              <div role="group" aria-label={`Predict line ${shown + 1}`} className="mt-2 grid gap-2 sm:grid-cols-2">
                {options.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => predict(o)}
                    className="tabular min-h-12 rounded-xl border-2 border-slate-100 bg-white px-4 py-2 text-left font-semibold text-ink hover:border-copper hover:bg-copper-100"
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              {picked && (
                <p className={`mb-3 rounded-xl p-3 ${picked.correct ? 'bg-ok-100' : 'bg-bad-100'} text-ink`}>
                  {picked.correct ? (
                    <span className="font-bold text-ok">
                      <span aria-hidden="true">✓ </span>Right.{' '}
                    </span>
                  ) : (
                    <span className="font-bold text-bad">
                      <span aria-hidden="true">✗ </span>Not this time.{' '}
                    </span>
                  )}
                  {picked.correct ? `${picked.label} it is.` : `${picked.message ?? ''} The line is ${next.display}.`}
                </p>
              )}
              <button
                type="button"
                onClick={showNext}
                className="min-h-12 w-full rounded-xl bg-ink px-5 font-semibold text-white hover:bg-slate sm:w-auto"
              >
                {picked ? 'Show the line' : shown === 0 ? 'Show the first line' : 'Next line'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
