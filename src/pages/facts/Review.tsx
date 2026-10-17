/**
 * Spaced review (/facts/review): the questions that are due (Leitner boxes: a miss goes back to box
 * 1, due today; right answers move up: 1, 3, 7, 16 days). Ten at a time.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { allQuestions } from '@/content'
import { QuizSession } from '@/components/question/QuizSession'
import { btnPrimary, btnSecondary, card, PageHeader } from '@/components/question/ui'
import type { NecEdition, Question } from '@/shared/types'
import { useStore } from '@/store'
import { dueInPool } from '@/store/selectors.facts'

const SESSION = 10
const DAY = 86_400_000

export default function Review() {
  const edition = useStore((s) => s.settings.edition)
  return <ReviewRun key={edition} edition={edition} />
}

interface Round {
  n: number
  questions: Question[]
}

function newRound(pool: readonly Question[], n: number): Round {
  const ids = dueInPool(useStore.getState().leitner, pool, Date.now()).slice(0, SESSION)
  const byId = new Map(pool.map((q) => [q.id, q]))
  return { n, questions: ids.map((id) => byId.get(id)).filter((q): q is Question => !!q) }
}

function ReviewRun({ edition }: { edition: NecEdition }) {
  const bookHints = useStore((s) => s.settings.bookHints)
  const leitner = useStore((s) => s.leitner)
  const pool = useMemo(() => allQuestions(edition), [edition])
  const [round, setRound] = useState<Round>(() => newRound(pool, 1))
  const { dueNow, inBoxes, nextDueDays } = useMemo(() => {
    const now = Date.now()
    const have = new Set(pool.map((q) => q.id))
    const cards = Object.entries(leitner).filter(([id]) => have.has(id))
    const later = cards.map(([, c]) => c.due).filter((d) => d > now)
    const next = later.length ? Math.min(...later) : null
    return {
      dueNow: dueInPool(leitner, pool, now).length,
      inBoxes: cards.length,
      nextDueDays: next === null ? null : Math.max(1, Math.ceil((next - now) / DAY)),
    }
  }, [leitner, pool])

  const header = (
    <PageHeader
      title="Review"
      lead="Missed and hinted questions come back sooner. Each right answer sends a question further out: 1 day, then 3, 7 and 16."
      back={{ to: '/facts', label: 'Code questions' }}
    />
  )

  if (round.questions.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        {header}
        <div className={`${card} space-y-3`}>
          <p className="text-lg font-semibold text-ink">
            <span aria-hidden="true" className="text-ok">
              ✓{' '}
            </span>
            Nothing is due right now.
          </p>
          <p className="text-ink">
            {inBoxes === 0
              ? 'Questions land here after you answer them in practice or in an exam. Misses come back first; the ones you keep getting right wait longer each time, out to 16 days.'
              : `${inBoxes} ${inBoxes === 1 ? 'question is' : 'questions are'} in review. ${
                  nextDueDays === null ? '' : `The next one comes back in ${nextDueDays === 1 ? 'a day' : `${nextDueDays} days`}.`
                }`}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link to="/facts/practice/mixed" className={btnPrimary}>
              Mixed practice
            </Link>
            <Link to="/facts" className={btnSecondary}>
              Back to Code questions
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      {header}
      <QuizSession
        key={round.n}
        questions={round.questions}
        mode="review"
        edition={edition}
        showHint={bookHints === 'button'}
        summaryNote={dueNow > 0 ? `${dueNow} more ${dueNow === 1 ? 'is' : 'are'} due.` : 'That clears everything that was due.'}
        summaryActions={
          <>
            {dueNow > 0 && (
              <button type="button" onClick={() => setRound(newRound(pool, round.n + 1))} className={btnPrimary}>
                Keep going ({dueNow} due)
              </button>
            )}
            <Link to="/facts" className={btnSecondary}>
              Back to Code questions
            </Link>
          </>
        }
      />
    </div>
  )
}
