/**
 * Test me: exam style. The story above, four options A-D, an optional per-question timer at exam
 * pace. After a pick: right or wrong; a wrong pick says what mistake builds that option and the rule
 * that fixes it. Then the whole worksheet is the explanation.
 */
import { useEffect, useRef, useState } from 'react'
import { mistakeInfo } from '@/calc'
import type { AnswerChoice, NecEdition, ProblemInstance } from '@/shared/types'
import { WorkedColumn } from './WorkedLine'

const LETTERS = ['A', 'B', 'C', 'D'] as const

export interface TestPick {
  index: number
  choice: AnswerChoice
}

export interface TestRunProps {
  instance: ProblemInstance
  edition: NecEdition
  keysAlways: boolean
  /** Seconds for the per-question timer; omit for no timer. */
  timerSeconds?: number
  onPick: (pick: TestPick) => void
  announce: (text: string) => void
}

function clock(s: number): string {
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

function Timer({ seconds, running }: { seconds: number; running: boolean }) {
  const [left, setLeft] = useState(seconds)
  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000)
    return () => window.clearInterval(id)
  }, [running])
  const over = left === 0
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
      <span role="timer" aria-live="off" className={`tabular rounded-lg px-2 py-1 font-semibold ${over ? 'bg-bad-100 text-bad' : 'bg-slate-50 text-ink'}`}>
        <span aria-hidden="true">⏱ </span>
        {over ? 'Time is up' : `${clock(left)} left`}
      </span>
      {over && running && <span className="text-slate">On the exam: pick your best guess, flag it, move on.</span>}
    </div>
  )
}

export function TestRun({ instance, edition, keysAlways, timerSeconds, onPick, announce }: TestRunProps) {
  const [picked, setPicked] = useState<number | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (picked !== null) resultRef.current?.focus()
  }, [picked])

  const pick = (index: number) => {
    if (picked !== null) return
    const choice = instance.choices[index]
    if (!choice) return
    setPicked(index)
    onPick({ index, choice })
    const right = instance.choices.findIndex((c) => c.correct)
    announce(
      choice.correct
        ? `Right. ${LETTERS[index]} is the answer.`
        : `Not this time. The answer is ${LETTERS[right]}, ${instance.choices[right]?.label}.`,
    )
  }

  const rightIndex = instance.choices.findIndex((c) => c.correct)
  const choice = picked !== null ? instance.choices[picked] : undefined

  return (
    <div>
      {timerSeconds !== undefined && <Timer seconds={timerSeconds} running={picked === null} />}
      <div role="group" aria-label="Answer choices" className="grid gap-2 sm:grid-cols-2">
        {instance.choices.map((c, i) => {
          const isPicked = picked === i
          const isRight = picked !== null && c.correct
          const tone =
            picked === null
              ? 'border-slate-100 bg-white hover:border-copper hover:bg-copper-100'
              : isRight
                ? 'border-ok bg-ok-100'
                : isPicked
                  ? 'border-bad bg-bad-100'
                  : 'border-slate-100 bg-white opacity-70'
          return (
            <button
              key={i}
              type="button"
              onClick={() => pick(i)}
              disabled={picked !== null}
              aria-pressed={isPicked}
              className={`tabular flex min-h-14 items-center gap-3 rounded-xl border-2 px-4 py-2 text-left text-lg font-semibold text-ink disabled:cursor-default ${tone}`}
            >
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink text-base text-white">{LETTERS[i]}</span>
              <span className="flex-1">{c.label}</span>
              {isRight && (
                <span className="text-sm text-ok">
                  <span aria-hidden="true">✓ </span>right answer
                </span>
              )}
              {isPicked && !c.correct && (
                <span className="text-sm text-bad">
                  <span aria-hidden="true">✗ </span>your pick
                </span>
              )}
            </button>
          )
        })}
      </div>

      {choice && (
        <div ref={resultRef} tabIndex={-1} className="mt-4 outline-none">
          {choice.correct ? (
            <p className="rounded-xl bg-ok-100 p-3 text-ink">
              <span className="font-bold text-ok">
                <span aria-hidden="true">✓ </span>Right: {LETTERS[picked!]}, {choice.label}.
              </span>{' '}
              Here is the worksheet behind it, so you can check your steps matched.
            </p>
          ) : (
            <div className="rounded-xl bg-bad-100 p-3 text-ink">
              <p>
                <span className="font-bold text-bad">
                  <span aria-hidden="true">✗ </span>Not this time.
                </span>{' '}
                You picked {LETTERS[picked!]}, {choice.label}. The answer is {LETTERS[rightIndex]}, {instance.choices[rightIndex]?.label}.
              </p>
              {choice.why && (
                <p className="mt-2">
                  <span className="font-semibold">Where {choice.label} comes from: </span>
                  {choice.why}
                </p>
              )}
              {choice.mistake && choice.mistake !== 'unknown' && (
                <p className="mt-2">
                  <span className="font-semibold">The rule: </span>
                  {mistakeInfo(choice.mistake).lesson}
                </p>
              )}
            </div>
          )}
          <h2 className="mt-5 mb-2 text-lg font-bold text-ink">The worked answer</h2>
          <WorkedColumn instance={instance} edition={edition} keysAlways={keysAlways} />
        </div>
      )}
    </div>
  )
}
