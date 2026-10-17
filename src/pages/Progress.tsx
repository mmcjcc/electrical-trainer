/**
 * Progress (/progress): by exam area (asked, right, recent %, hint use, the blueprint weight), by
 * recipe (stage, Test-me record, last done), the mistakes he makes most with this week against last
 * week, exam history and find-it rounds. All derived from the event log on this device.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { mistakeInfo } from '@/calc'
import { EXAM, FAMILY_ORDER, FAMILY_TITLE, recipesByFamily, TOPICS } from '@/content'
import { FIND_IT_DRILL } from '@/content'
import { card, fmtDuration, link, MODE_LABEL, PageHeader, PctBadge } from '@/components/question/ui'
import { examHistory, mistakeCounts, recipeStage, relativeDays, topicStats, useStore } from '@/store'
import { drillRounds } from '@/store/selectors.facts'

export default function Progress() {
  const events = useStore((s) => s.events)
  const [now] = useState(() => Date.now())
  const stats = useMemo(() => topicStats(events, TOPICS.map((t) => t.id)), [events])
  const mistakes = useMemo(() => mistakeCounts(events, now).slice(0, 8), [events, now])
  const exams = useMemo(() => examHistory(events).slice().reverse(), [events])
  const finds = useMemo(() => drillRounds(events, FIND_IT_DRILL).slice(-5).reverse(), [events])
  const families = useMemo(
    () =>
      FAMILY_ORDER.map((f) => ({ f, recipes: recipesByFamily(f).map((r) => ({ r, stage: recipeStage(events, r.id) })) })).filter(
        (x) => x.recipes.length > 0,
      ),
    [events],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Progress"
        lead={
          <>
            Everything here is worked out from what you have done on this device. To carry it to another device, export it in{' '}
            <Link to="/settings" className={link}>
              Settings
            </Link>
            .
          </>
        }
      />

      <section aria-labelledby="by-area" className={card}>
        <h2 id="by-area" className="text-lg font-bold text-ink">
          By exam area
        </h2>
        <p className="mt-0.5 text-sm text-slate">“Recent” is your last 30 answers in the area. Hints are never counted against you.</p>
        <ul className="mt-2 divide-y divide-slate-100">
          {TOPICS.map((t, k) => {
            const s = stats[k]
            const asked = s?.asked ?? 0
            return (
              <li key={t.id} className="py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-ink">{t.title}</h3>
                  <PctBadge pct={s?.recentPct ?? null} />
                </div>
                <p className="mt-0.5 text-sm text-ink tabular">
                  {t.offExam ? 'Not on the exam outline' : `${t.questions * t.points} of ${EXAM.totalPoints} points on the exam`} ·{' '}
                  {asked === 0 ? 'none asked yet' : `${s?.right ?? 0} of ${asked} right · book hint on ${s?.hinted ?? 0}`}
                </p>
              </li>
            )
          })}
        </ul>
        <p className="mt-2 text-sm text-slate">Calculations are scored by the recipes below (Test me) and by exam items.</p>
      </section>

      <section aria-labelledby="by-recipe" className={card}>
        <h2 id="by-recipe" className="text-lg font-bold text-ink">
          Math recipes
        </h2>
        <p className="mt-0.5 text-sm text-slate">Two clean runs move a recipe on: Show me, Coach me, Paper, Test me. Two right in Test me is exam ready.</p>
        {families.length === 0 && <p className="mt-2 text-ink">No recipes yet.</p>}
        {families.map(({ f, recipes }) => (
          <div key={f} className="mt-3">
            <h3 className="font-semibold text-ink">{FAMILY_TITLE[f]}</h3>
            <ul className="mt-1 divide-y divide-slate-100">
              {recipes.map(({ r, stage }) => (
                <li key={r.id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 py-2 text-sm">
                  <Link to={`/math/r/${r.id}`} className={link}>
                    {r.title}
                  </Link>
                  <span className="text-ink">
                    {stage.mastered ? (
                      <span className="font-semibold text-ok">
                        <span aria-hidden="true">✓ </span>Exam ready
                      </span>
                    ) : stage.runs === 0 ? (
                      <span className="text-slate">Not started</span>
                    ) : (
                      <>
                        {MODE_LABEL[stage.suggested]} ({stage.clean} of {stage.needed} clean)
                      </>
                    )}
                    {stage.testAsked > 0 && ` · Test me ${stage.testRight} of ${stage.testAsked}`}
                    {stage.lastAt !== undefined && ` · ${relativeDays(stage.lastAt, now)}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section aria-labelledby="mistakes" className={card}>
        <h2 id="mistakes" className="text-lg font-bold text-ink">
          The slips you make most
        </h2>
        {mistakes.length === 0 ? (
          <p className="mt-2 text-ink">None recorded yet. When a worksheet line or a Test-me pick goes wrong, the reason shows up here.</p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-100">
            {mistakes.map((m) => {
              const info = mistakeInfo(m.id)
              const trend = m.thisWeek < m.lastWeek ? 'down' : m.thisWeek > m.lastWeek ? 'up' : 'same'
              return (
                <li key={m.id} className="py-2">
                  <p className="font-semibold text-ink">{info.title}</p>
                  <p className="text-sm text-ink tabular">
                    {m.total} in all · last week {m.lastWeek} → this week {m.thisWeek}{' '}
                    <span className={trend === 'down' ? 'font-semibold text-ok' : trend === 'up' ? 'font-semibold text-bad' : 'text-slate'}>
                      ({trend === 'down' ? 'getting better' : trend === 'up' ? 'more this week' : 'no change'})
                    </span>
                  </p>
                  <p className="text-sm text-slate">{info.lesson}</p>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="exams" className={card}>
        <h2 id="exams" className="text-lg font-bold text-ink">
          Practice exams
        </h2>
        {exams.length === 0 ? (
          <p className="mt-2 text-ink">
            None yet.{' '}
            <Link to="/exam" className={link}>
              Take a practice exam
            </Link>{' '}
            when you have a few areas under your belt.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-100">
            {exams.map((e) => (
              <li key={`${e.at}-${e.seed}`} className="flex flex-wrap items-baseline justify-between gap-x-3 py-2 text-sm text-ink">
                <span className="font-semibold">
                  {e.pct}%{' '}
                  <span className={e.passed ? 'text-ok' : 'text-bad'}>
                    <span aria-hidden="true">{e.passed ? '✓' : '✗'} </span>
                    {e.passed ? 'pass' : 'not a pass'}
                  </span>
                </span>
                <span className="text-slate">
                  {e.size === 'full' ? 'Full' : 'Short'} · {fmtDuration(e.ms)}
                  {e.hints ? ' · hints on' : ''} · {relativeDays(e.at, now)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="finds" className={card}>
        <h2 id="finds" className="text-lg font-bold text-ink">
          Find it in the book
        </h2>
        {finds.length === 0 ? (
          <p className="mt-2 text-ink">
            No rounds yet.{' '}
            <Link to="/facts/find" className={link}>
              Try one
            </Link>
            : ten quick ones.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-100">
            {finds.map((r) => (
              <li key={r.at} className="flex justify-between gap-3 py-2 text-sm text-ink">
                <span>
                  {r.right} of {r.total} found
                </span>
                <span className="text-slate">{relativeDays(r.at, now)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
