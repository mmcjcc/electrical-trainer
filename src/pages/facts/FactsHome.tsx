/**
 * Code questions (/facts): every exam area with its weight on the exam, how many questions are here
 * to practise, and his recent accuracy; then the ways in: practice an area, mixed practice, review,
 * find it in the book, the exam simulator. A thin bank says so instead of looking broken.
 */
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { allQuestions, EXAM, EXAM_TOPICS, TOPICS, type Topic } from '@/content'
import { btnSecondary, card, PageHeader, PctBadge } from '@/components/question/ui'
import { topicStats, useStore } from '@/store'
import { countByTopic, dueInPool } from '@/store/selectors.facts'

function weightLine(t: Topic): string {
  if (t.offExam) return 'Not on the exam outline'
  if (t.points > 1) return `${t.questions} questions on the exam, ${t.points} points each (${t.questions * t.points} points)`
  if (t.id === 'calculations') return `${t.questions} questions on the exam: ${t.questions} of 100 points`
  return `${t.questions} questions on the exam`
}

export default function FactsHome() {
  const edition = useStore((s) => s.settings.edition)
  const events = useStore((s) => s.events)
  const leitner = useStore((s) => s.leitner)
  const bank = useMemo(() => allQuestions(edition), [edition])
  const counts = useMemo(() => countByTopic(bank), [bank])
  const stats = useMemo(() => new Map(topicStats(events, TOPICS.map((t) => t.id)).map((s) => [s.topic, s])), [events])
  const due = useMemo(() => dueInPool(leitner, bank, Date.now()).length, [leitner, bank])
  const examIds = new Set(EXAM_TOPICS.map((t) => t.id))
  const mixedCount = bank.filter((q) => examIds.has(q.topic)).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Code questions"
        lead={`Short four-option questions, open book, the way the exam asks them. Locations are for the ${edition} NEC.`}
      />

      <section aria-label="Ways to practise" className="grid gap-3 sm:grid-cols-2">
        <Door
          to={mixedCount > 0 ? '/facts/practice/mixed' : undefined}
          title="Mixed practice"
          sub={mixedCount > 0 ? `Ten from every area, unseen ones first (${mixedCount} in the bank)` : 'Questions for the exam areas are being written'}
          primary
        />
        <Door
          to="/facts/review"
          title={due > 0 ? `Review (${due} due)` : 'Review'}
          sub={due > 0 ? 'Missed and hinted questions, back on schedule' : 'Nothing due right now'}
        />
        <Door to="/facts/find" title="Find it in the book" sub="Where would you look? Ten quick ones, against the clock" />
        <Door to="/exam" title="Exam simulator" sub={`${EXAM.questions} questions in ${EXAM.minutes} minutes, or a short one of ${Math.round(EXAM.questions / 3)}`} />
      </section>

      <section aria-labelledby="areas-title" className="space-y-3">
        <h2 id="areas-title" className="text-xl font-bold text-ink">
          By exam area
        </h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {TOPICS.map((t) => {
            const n = counts.get(t.id) ?? 0
            const s = stats.get(t.id)
            return (
              <li key={t.id} className={`${card} flex flex-col gap-2`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="font-bold text-ink">{t.title}</h3>
                  <PctBadge pct={s?.recentPct ?? null} />
                </div>
                <p className={`text-sm font-semibold ${t.offExam ? 'text-copper-700' : 'text-ink'}`}>{weightLine(t)}</p>
                <p className="text-sm text-slate">{t.covers.join(' · ')}</p>
                <p className="text-sm text-ink">
                  {n > 0 ? (
                    <>
                      {n} {n === 1 ? 'question' : 'questions'} here
                      {s && s.asked > 0 && ` · ${s.right} of ${s.asked} right so far`}
                    </>
                  ) : t.id === 'calculations' ? (
                    'Worked step by step in Math and load calcs.'
                  ) : (
                    <span className="text-slate">Questions for this area are being written.</span>
                  )}
                </p>
                <div className="mt-auto flex flex-wrap gap-2 pt-1">
                  {n > 0 && (
                    <Link to={`/facts/practice/${t.id}`} className={btnSecondary} aria-label={`Practice ${t.title}`}>
                      Practice
                    </Link>
                  )}
                  {t.id === 'calculations' && (
                    <Link to="/math" className={btnSecondary}>
                      Math and load calcs
                    </Link>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}

function Door({ to, title, sub, primary = false }: { to?: string; title: string; sub: string; primary?: boolean }) {
  const inner = (
    <>
      <span className="block text-lg font-bold">{title}</span>
      <span className={`mt-0.5 block text-sm ${primary && to ? 'text-slate-100' : 'text-slate'}`}>{sub}</span>
    </>
  )
  if (!to) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50 p-4 text-ink" aria-disabled="true">
        {inner}
      </div>
    )
  }
  return (
    <Link
      to={to}
      className={`block min-h-11 rounded-2xl p-4 text-left ${
        primary ? 'bg-ink text-white hover:bg-slate' : 'border-2 border-slate-100 bg-white text-ink hover:bg-slate-50'
      }`}
    >
      {inner}
    </Link>
  )
}
