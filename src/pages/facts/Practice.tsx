/**
 * Topic practice (/facts/practice/:topicId, or `mixed` for every exam area): ten questions, the ones
 * he has never seen first, then the ones he is weakest on, never the same one twice in a session.
 */
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { randomSeed } from '@/calc'
import { allQuestions, EXAM_TOPICS, questionsForTopic, TOPICS } from '@/content'
import { QuizSession } from '@/components/question/QuizSession'
import { btnPrimary, btnSecondary, card, link, PageHeader } from '@/components/question/ui'
import type { NecEdition, Question } from '@/shared/types'
import { useStore } from '@/store'
import { dueInPool, pickPractice } from '@/store/selectors.facts'

const SESSION = 10
const EXAM_IDS = new Set(EXAM_TOPICS.map((t) => t.id))

export default function Practice() {
  const { topicId = 'mixed' } = useParams()
  const edition = useStore((s) => s.settings.edition)
  return <PracticeTopic key={`${topicId}|${edition}`} topicId={topicId} edition={edition} />
}

interface Round {
  n: number
  questions: Question[]
}

function newRound(pool: readonly Question[], n: number): Round {
  const ids = pickPractice(pool, useStore.getState().events, { n: SESSION, seed: randomSeed() })
  const byId = new Map(pool.map((q) => [q.id, q]))
  return { n, questions: ids.map((id) => byId.get(id)).filter((q): q is Question => !!q) }
}

function PracticeTopic({ topicId, edition }: { topicId: string; edition: NecEdition }) {
  const bookHints = useStore((s) => s.settings.bookHints)
  const leitner = useStore((s) => s.leitner)
  const mixed = topicId === 'mixed'
  const t = mixed ? undefined : TOPICS.find((x) => x.id === topicId)
  const pool = useMemo(
    () => (mixed ? allQuestions(edition).filter((q) => EXAM_IDS.has(q.topic)) : questionsForTopic(topicId, edition)),
    [mixed, topicId, edition],
  )
  const [round, setRound] = useState<Round>(() => newRound(pool, 1))
  const due = useMemo(() => dueInPool(leitner, pool, Date.now()).length, [leitner, pool])

  const back = { to: '/facts', label: 'Code questions' }
  if (!mixed && !t) {
    return (
      <div>
        <PageHeader title="Practice" back={back} />
        <p className="text-ink">
          There is no exam area called “{topicId}”. Pick one from{' '}
          <Link to="/facts" className={link}>
            Code questions
          </Link>
          .
        </p>
      </div>
    )
  }

  const title = t ? t.title : 'Mixed practice'
  const lead = t
    ? t.offExam
      ? `Not on the PSI exam outline: the Maryland license law, for the license itself. ${pool.length} here to practise.`
      : `${t.questions} questions on the exam${t.points > 1 ? `, ${t.points} points each` : ''}. ${pool.length} here to practise.`
    : `Every exam area, mixed the way the exam mixes them. ${pool.length} questions to draw from.`

  if (pool.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title={title} back={back} />
        <EmptyArea calculations={topicId === 'calculations'} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={title} lead={lead} back={back} />
      <QuizSession
        key={round.n}
        questions={round.questions}
        mode="practice"
        edition={edition}
        showHint={bookHints === 'button'}
        summaryNote={due > 0 ? `${due} ${due === 1 ? 'question is' : 'questions are'} due in Review.` : undefined}
        summaryActions={
          <>
            <button type="button" onClick={() => setRound(newRound(pool, round.n + 1))} className={btnPrimary}>
              Another {Math.min(SESSION, pool.length)}
            </button>
            {due > 0 && (
              <Link to="/facts/review" className={btnSecondary}>
                Review ({due} due)
              </Link>
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

/** The bank has nothing here yet: say so plainly and point at what works today. */
function EmptyArea({ calculations = false }: { calculations?: boolean }) {
  return (
    <div className={`${card} space-y-3`}>
      <p className="text-lg font-semibold text-ink">Questions for this area are being written.</p>
      <p className="text-ink">
        Every question is written and checked by hand against the code book, so the bank fills in a few areas at a time. Nothing
        you do is lost while it grows.
      </p>
      {calculations ? (
        <p className="text-ink">
          Calculations are worked as step-by-step problems in{' '}
          <Link to="/math" className={link}>
            Math and load calcs
          </Link>
          .
        </p>
      ) : (
        <p className="text-ink">Meanwhile, these work today:</p>
      )}
      <div className="flex flex-wrap gap-2">
        <Link to="/facts/find" className={btnPrimary}>
          Find it in the book
        </Link>
        <Link to="/math" className={btnSecondary}>
          Math and load calcs
        </Link>
      </div>
    </div>
  )
}
