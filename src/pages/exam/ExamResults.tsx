/**
 * Exam results (/exam/results), from the last finished exam: the score against the 70% pass mark,
 * points by area against the blueprint, the time used, then every item with the right answer, his
 * answer, the explanation and where it is in the book (calculations: why his pick was wrong and a link
 * to work the same problem in Test me).
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EXAM, TOPICS } from '@/content'
import { BookHint } from '@/components/ui/BookHint'
import { StudyAidNote } from '@/components/ui/StudyAidNote'
import { btnPrimary, btnSecondary, card, fmtDuration, LETTERS, link, Meter, PageHeader } from '@/components/question/ui'
import { examHistory, useStore, type FinishedExam } from '@/store'
import { itemView, safeScore, type ItemView } from './examItem'

type Filter = 'all' | 'missed' | 'flagged'

const topicOf = (id: string) => TOPICS.find((t) => t.id === id)

export default function ExamResults() {
  const last = useStore((s) => s.lastExam)
  if (!last) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Exam results" back={{ to: '/exam', label: 'Exam simulator' }} />
        <div className={`${card} space-y-3`}>
          <p className="text-ink">No finished exam yet. Results show here after you submit one.</p>
          <Link to="/exam" className={btnPrimary}>
            Start an exam
          </Link>
        </div>
      </div>
    )
  }
  return <Results last={last} />
}

function Results({ last }: { last: FinishedExam }) {
  const events = useStore((s) => s.events)
  const edition = last.paper.edition
  const score = useMemo(() => safeScore(last.paper, last.answers), [last])
  const views = useMemo(() => last.paper.items.map((it) => itemView(it)), [last])
  const ev = useMemo(() => examHistory(events).filter((e) => e.seed === last.paper.seed).at(-1), [events, last])
  
  const limitMs = last.paper.minutes * 60_000
  const over = last.elapsedMs - limitMs
  const passed = score.passed
  const missedCount = views.filter((v, k) => v.kind !== 'missing' && last.answers[k] !== v.answer).length
  const flaggedCount = last.flags.filter(Boolean).length
  const [filter, setFilter] = useState<Filter>(() => (missedCount > 0 ? 'missed' : 'all'))

  const shown = views
    .map((v, k) => ({ v, k }))
    .filter(({ v, k }) => (filter === 'all' ? true : filter === 'flagged' ? last.flags[k] : v.kind !== 'missing' && last.answers[k] !== v.answer))

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        title="Exam results"
        lead={`${last.paper.size === 'full' ? 'Full' : 'Short'} exam, ${new Date(last.finishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}${
          last.hintsOn ? ', with book hints on' : ''
        }.`}
        back={{ to: '/exam', label: 'Exam simulator' }}
      />

      <section aria-labelledby="score-title" className={`rounded-2xl border-2 p-4 ${passed ? 'border-ok bg-ok-100' : 'border-bad bg-bad-100'}`}>
        <h2 id="score-title" className="text-3xl font-bold text-ink tabular">
          {score.pct}%{' '}
          <span className={passed ? 'text-ok' : 'text-bad'}>
            <span aria-hidden="true">{passed ? '✓' : '✗'} </span>
            {passed ? 'Pass' : 'Not a pass yet'}
          </span>
        </h2>
        <p className="mt-1 text-ink">
          {score.points} of {score.possible} points. The pass mark is {EXAM.passPct}%
          {passed ? '.' : `: ${Math.max(0, Math.ceil((score.possible * EXAM.passPct) / 100) - score.points)} more points would have passed.`}
        </p>
        <p className="mt-1 text-ink">
          Time: {fmtDuration(last.elapsedMs)} of {fmtDuration(limitMs)}
          {over > 60_000 ? `, ${fmtDuration(over)} over the limit (the real exam would have ended).` : '.'}
        </p>
        {ev && ev.pct !== score.pct && <p className="mt-1 text-sm text-ink">Scored {ev.pct}% when you submitted; a question has changed since.</p>}
      </section>

      <section aria-labelledby="areas-title" className={card}>
        <h2 id="areas-title" className="text-lg font-bold text-ink">
          Points by area
        </h2>
        <p className="mt-0.5 text-sm text-slate">The bar shows the share you got; the black tick is the 70% pass mark.</p>
        <ul className="mt-3 space-y-3">
          {score.byTopic.map((t) => {
            const pct = t.possible ? Math.round((t.points / t.possible) * 100) : 0
            const bp = topicOf(t.topic)
            return (
              <li key={t.topic}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="font-semibold text-ink">{t.title}</span>
                  <span className="text-sm text-ink tabular">
                    {t.points} of {t.possible} points ({t.right} of {t.asked} right) · {pct}%
                  </span>
                </div>
                <Meter pct={pct} />
                <p className="mt-0.5 text-xs text-slate">
                  {bp ? `On the real exam: ${bp.questions * bp.points} of ${EXAM.totalPoints} points` : null}
                </p>
              </li>
            )
          })}
        </ul>
      </section>

      <section aria-labelledby="review-title" className="space-y-3">
        <h2 id="review-title" className="text-xl font-bold text-ink">
          Go over every item
        </h2>
        <div role="group" aria-label="Show" className="flex flex-wrap gap-2">
          {(
            [
              ['missed', `Missed or blank (${missedCount})`],
              ['flagged', `Flagged (${flaggedCount})`],
              ['all', `All ${views.length}`],
            ] as const
          ).map(([f, label]) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={`min-h-11 rounded-xl border-2 px-3 text-sm font-semibold ${filter === f ? 'border-ink bg-ink text-white' : 'border-slate-100 bg-white text-ink'}`}
            >
              {label}
            </button>
          ))}
        </div>
        {shown.length === 0 && <p className="text-ink">Nothing here.</p>}
        <ol className="space-y-3">
          {shown.map(({ v, k }) => (
            <li key={k}>
              <ReviewItem view={v} index={k} pick={last.answers[k] ?? null} flagged={last.flags[k] ?? false} edition={edition} topicTitle={topicOf(last.paper.items[k]?.topic ?? '')?.title ?? ''} />
            </li>
          ))}
        </ol>
      </section>

      <div className="flex flex-wrap gap-2">
        <Link to="/exam" className={btnPrimary}>
          Take another exam
        </Link>
        <Link to="/facts" className={btnSecondary}>
          Practise by area
        </Link>
        <Link to="/progress" className={btnSecondary}>
          Progress
        </Link>
      </div>
      <StudyAidNote />
    </div>
  )
}

function ReviewItem({
  view,
  index,
  pick,
  flagged,
  edition,
  topicTitle,
}: {
  view: ItemView
  index: number
  pick: number | null
  flagged: boolean
  edition: FinishedExam['paper']['edition']
  topicTitle: string
}) {
  if (view.kind === 'missing') {
    return (
      <article className={card}>
        <p className="text-sm font-semibold text-slate">Question {index + 1}</p>
        <p className="mt-1 text-ink">{view.stem}</p>
      </article>
    )
  }
  const right = pick === view.answer
  const blank = pick === null
  const answerText = `${LETTERS[view.answer]}, ${view.choices[view.answer]}`
  const pickText = pick === null ? '' : `${LETTERS[pick]}, ${view.choices[pick]}`
  const why =
    view.kind === 'question'
      ? pick !== null && !right
        ? view.q.whyNot?.[pick as 0 | 1 | 2 | 3]
        : undefined
      : pick !== null && !right
        ? view.problem.choices[pick]?.why
        : undefined
  return (
    <article className={`rounded-2xl border-2 p-4 ${right ? 'border-slate-100 bg-white' : 'border-bad-100 bg-white'}`}>
      <p className="flex flex-wrap gap-x-2 text-sm font-semibold text-slate">
        <span>Question {index + 1}</span>
        <span>· {topicTitle}</span>
        {flagged && (
          <span className="text-copper-700">
            · <span aria-hidden="true">⚑</span> flagged
          </span>
        )}
      </p>
      <p className="mt-1 whitespace-pre-line font-semibold text-ink">{view.stem}</p>
      <p className={`mt-2 font-bold ${right ? 'text-ok' : 'text-bad'}`}>
        <span aria-hidden="true">{right ? '✓ ' : '✗ '}</span>
        {right ? `Right: ${answerText}` : blank ? 'Left blank' : `Your answer: ${pickText}`}
      </p>
      {!right && <p className="mt-1 font-semibold text-ink">Right answer: {answerText}</p>}
      {why && <p className="mt-1 text-ink">Why not {pick !== null ? LETTERS[pick] : ''}: {why}</p>}
      {view.kind === 'question' ? (
        <>
          <p className="mt-2 text-ink">{view.q.explain}</p>
          <div className="mt-2">
            <BookHint refTo={view.q.ref} edition={edition} initialRung={3} />
          </div>
        </>
      ) : (
        <p className="mt-2 text-ink">
          {view.recipeTitle}.{' '}
          <Link to={`/math/r/${view.recipeId}/test/${view.problem.seed}`} className={link}>
            Work this problem again in Test me
          </Link>
          ; the worksheet after it shows every step.
        </p>
      )}
    </article>
  )
}
