/**
 * A short run of fact questions (practice or review): one at a time, a running "7 of 10", then a
 * summary with every question, right or wrong, and its right answer. The question list is fixed when
 * the session starts, so nothing repeats inside it.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { NecEdition, Question } from '@/shared/types'
import { QuestionCard, type AnswerResult } from './QuestionCard'
import { LETTERS } from './ui'

export interface QuizSessionProps {
  questions: readonly Question[]
  mode: 'practice' | 'review'
  edition: NecEdition
  showHint: boolean
  /** Buttons under the summary ("Another 10", "Back"). */
  summaryActions: ReactNode
  /** Extra line under the summary score (e.g. "3 more are due"). */
  summaryNote?: ReactNode
}

export function QuizSession({ questions, mode, edition, showHint, summaryActions, summaryNote }: QuizSessionProps) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<AnswerResult[]>([])
  const n = questions.length
  const q = questions[index]

  if (!q) return <Summary questions={questions} answers={answers} actions={summaryActions} note={summaryNote} />

  const right = answers.filter((a) => a.correct).length
  const last = index === n - 1
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3" aria-hidden="true">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full bg-copper" style={{ width: `${(answers.length / n) * 100}%` }} />
        </div>
        <span className="text-sm font-semibold text-slate tabular">
          {right} right so far
        </span>
      </div>
      <QuestionCard
        question={q}
        edition={edition}
        mode={mode}
        showHint={showHint}
        position={`${index + 1} of ${n}`}
        onAnswered={(r) => setAnswers((a) => [...a, r])}
        onNext={() => setIndex((i) => i + 1)}
        nextLabel={last ? 'See how you did' : 'Next question'}
        focusOnMount={index > 0}
      />
    </div>
  )
}

function Summary({ questions, answers, actions, note }: { questions: readonly Question[]; answers: AnswerResult[]; actions: ReactNode; note?: ReactNode }) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => heading.current?.focus(), [])
  const right = answers.filter((a) => a.correct).length
  const total = answers.length
  const hinted = answers.filter((a) => a.hint > 0).length
  const pct = total ? Math.round((right / total) * 100) : 0
  const byId = new Map(answers.map((a) => [a.qid, a]))
  return (
    <section aria-labelledby="session-summary" className="space-y-4">
      <h2 id="session-summary" ref={heading} tabIndex={-1} className="text-2xl font-bold text-ink outline-none">
        {right} of {total} right
      </h2>
      <p className="text-ink">
        {pct >= 70 ? (
          <>
            <span aria-hidden="true" className="text-ok">
              ✓{' '}
            </span>
            {pct}%: at or above the 70% pass mark.
          </>
        ) : (
          <>
            <span aria-hidden="true" className="text-bad">
              !{' '}
            </span>
            {pct}%: under the 70% pass mark for now. The ones you missed come back in Review.
          </>
        )}
        {hinted > 0 && ` You used the book hint on ${hinted}.`}
      </p>
      {note && <p className="text-ink">{note}</p>}
      <ol className="space-y-2">
        {questions.map((q, i) => {
          const a = byId.get(q.id)
          if (!a) return null
          return (
            <li key={q.id} className={`rounded-xl border-2 p-3 ${a.correct ? 'border-ok-100' : 'border-bad-100 bg-bad-100'}`}>
              <p className="font-semibold text-ink">
                <span className={a.correct ? 'text-ok' : 'text-bad'}>
                  <span aria-hidden="true">{a.correct ? '✓' : '✗'} </span>
                  {a.correct ? 'Right' : 'Missed'}
                </span>
                <span className="text-slate"> · {i + 1}.</span> {q.stem}
              </p>
              <p className="mt-1 text-sm text-ink">
                Answer: {LETTERS[q.answer]}, {q.choices[q.answer]}
                {!a.correct && ` (you picked ${LETTERS[a.pick]})`}
                {a.hint > 0 && ' · book hint used'}
              </p>
            </li>
          )
        })}
      </ol>
      <div className="flex flex-wrap gap-2">{actions}</div>
    </section>
  )
}
