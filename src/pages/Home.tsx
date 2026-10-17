/**
 * Home (/): the two doors (Code questions, Math and load calcs), the "Today" card with a short mixed
 * session, the exam countdown, the streak, and a one-line readiness by exam area.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { allQuestions, EXAM, FAMILY_ORDER, recipesByFamily, TOPICS } from '@/content'
import { card, link, MODE_LABEL, PctBadge, TOPIC_SHORT } from '@/components/question/ui'
import { daysToExam, streakDays, useStore } from '@/store'
import { readiness, todayPlan, type TodayStep } from '@/store/selectors.facts'

export default function Home() {
  const events = useStore((s) => s.events)
  const leitner = useStore((s) => s.leitner)
  const settings = useStore((s) => s.settings)
  const examInProgress = useStore((s) => s.exam !== null)
  const [now] = useState(() => Date.now())
  const recipes = useMemo(() => FAMILY_ORDER.flatMap((f) => recipesByFamily(f)), [])
  const questions = useMemo(() => allQuestions(settings.edition), [settings.edition])
  const plan = useMemo(() => todayPlan({ events, leitner, now, questions, topics: TOPICS, recipes }), [events, leitner, questions, recipes, now])
  const ready = useMemo(() => readiness(events, TOPICS, recipes), [events, recipes])
  const streak = streakDays(events, now)
  const days = daysToExam(settings.examDate, now)
  const calcPoints = TOPICS.find((t) => t.id === 'calculations')?.questions ?? 30

  return (
    <div className="space-y-5">
      <h1 className="sr-only">Master Electrician exam prep</h1>
      <A2HSCard />

      {(days !== null || streak > 0 || examInProgress) && (
        <div className="flex flex-wrap gap-3">
          {days !== null && <Countdown days={days} date={settings.examDate as string} />}
          {streak > 0 && (
            <p className="rounded-xl bg-safety-100 px-3 py-2 font-semibold text-ink">
              <span aria-hidden="true">⚡ </span>
              {streak === 1 ? 'Studied today or yesterday: a 1-day streak' : `${streak}-day study streak`}
            </p>
          )}
          {examInProgress && (
            <Link to="/exam/run" className="rounded-xl border-2 border-ink px-3 py-2 font-semibold text-ink hover:bg-slate-50">
              Exam in progress: resume <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>
      )}

      <nav aria-label="Study areas" className="grid gap-3 sm:grid-cols-2">
        <Link to="/facts" className="block rounded-2xl bg-ink p-5 text-white hover:bg-slate">
          <span className="block text-2xl font-bold">Code questions</span>
          <span className="mt-1 block text-slate-100">Practice by exam area, review, find it in the book, the exam simulator.</span>
        </Link>
        <Link to="/math" className="block rounded-2xl border-2 border-copper bg-copper-100 p-5 text-ink hover:bg-safety-100">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-2xl font-bold">Math and load calcs</span>
            <span className="rounded-md bg-ink px-2 py-0.5 text-sm font-semibold text-white">
              {calcPoints} of {EXAM.totalPoints} points
            </span>
          </span>
          <span className="mt-1 block text-ink">Load calculations, conduit and box fill, ampacity, motors: one worksheet, step by step.</span>
        </Link>
      </nav>

      <TodayCard plan={plan} />

      <section aria-labelledby="ready-title" className={card}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="ready-title" className="font-bold text-ink">
            Where you stand
          </h2>
          <Link to="/progress" className={`${link} text-sm`}>
            Details
          </Link>
        </div>
        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-2" aria-label="Recent accuracy by exam area">
          {ready.rows.map((r) => (
            <li key={r.topic} className="flex items-center gap-1.5 text-sm text-ink">
              <span className="font-semibold">{TOPIC_SHORT[r.topic] ?? r.title}</span>
              <PctBadge pct={r.pct} />
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-slate">
          {ready.estimate === null
            ? `Answer a few questions and this fills in. The exam needs ${EXAM.passPct}% of ${EXAM.totalPoints} points.`
            : `At your recent rates you would earn about ${ready.estimate} of the ${ready.coveredPoints} points in the areas you have tried. The exam has ${EXAM.totalPoints} points; you need ${Math.ceil((EXAM.totalPoints * EXAM.passPct) / 100)}.`}
        </p>
      </section>

      <p className="text-center text-sm">
        <Link to="/about" className={link}>
          About the exam and this app
        </Link>
      </p>
    </div>
  )
}

function Countdown({ days, date }: { days: number; date: string }) {
  const [y, m, d] = date.split('-').map(Number)
  const when = new Date(y ?? 0, (m ?? 1) - 1, d ?? 1).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  const text =
    days > 1 ? `${days} days to your exam (${when})` : days === 1 ? `Your exam is tomorrow (${when})` : days === 0 ? 'Your exam is today. Good luck.' : 'Your exam date has passed. Set a new one in Settings.'
  return (
    <p className="rounded-xl border-2 border-ink px-3 py-2 font-semibold text-ink">
      <span aria-hidden="true">📅 </span>
      {text}
    </p>
  )
}

function TodayCard({ plan }: { plan: TodayStep[] }) {
  return (
    <section aria-labelledby="today-title" className={card}>
      <h2 id="today-title" className="text-xl font-bold text-ink">
        Today
      </h2>
      <p className="mt-0.5 text-sm text-slate">A short mixed session, about 20 minutes. Do them in order, or pick one.</p>
      {plan.length === 0 ? (
        <p className="mt-3 text-ink">
          Start with{' '}
          <Link to="/facts/find" className={link}>
            Find it in the book
          </Link>{' '}
          while the question bank fills in.
        </p>
      ) : (
        <ol className="mt-3 space-y-2">
          {plan.map((s, i) => (
            <li key={s.kind}>
              <TodayLink step={s} n={i + 1} />
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

function TodayLink({ step, n }: { step: TodayStep; n: number }) {
  let to: string
  let title: string
  let sub: string
  switch (step.kind) {
    case 'review':
      to = '/facts/review'
      title = `Review ${step.due} due ${step.due === 1 ? 'question' : 'questions'}`
      sub = 'Missed and hinted ones come back on a schedule. Clear these first.'
      break
    case 'topic':
      to = `/facts/practice/${step.topic}`
      title = `${Math.min(10, step.available)} questions: ${step.title}`
      sub = `${step.pct === null ? 'Not tried yet' : `${step.pct}% right recently`} · ${step.points} points on the exam: the most to gain right now`
      break
    case 'recipe':
      to = `/math/r/${step.recipeId}`
      title = step.started ? `Keep going: ${step.title}` : `Start: ${step.title}`
      sub = step.stage.mastered
        ? 'Exam ready. One more Test me keeps it fresh.'
        : step.started
          ? `Next: ${MODE_LABEL[step.stage.suggested]} (${step.stage.clean} of ${step.stage.needed} clean runs)`
          : 'Begins with Show me: a worked example, one line at a time.'
      break
  }
  return (
    <Link to={to} className="flex min-h-11 items-start gap-3 rounded-xl border-2 border-slate-100 p-3 hover:bg-slate-50">
      <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">
        {n}
      </span>
      <span>
        <span className="block font-semibold text-ink">{title}</span>
        <span className="block text-sm text-slate">{sub}</span>
      </span>
    </Link>
  )
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return nav.standalone === true || (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches)
}

/** iOS Safari, where saved data is cleared after 7 days without a visit unless the site is on the Home Screen. */
function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const iOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  return iOS && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)
}

/** Shown once on iPhone Safari (and always on Settings with `force`): add to Home Screen to keep progress. */
export function A2HSCard({ force = false }: { force?: boolean }) {
  const seen = useStore((s) => s.settings.seenA2HS)
  const setSettings = useStore((s) => s.setSettings)
  const relevant = isIosSafari() && !isStandalone()
  if (!relevant || (!force && seen)) return null
  return (
    <section className="rounded-2xl border-2 border-safety bg-safety-100 p-4" aria-labelledby="a2hs-title">
      <h2 id="a2hs-title" className="font-bold text-ink">
        Add this to your Home Screen to keep your progress
      </h2>
      <p className="mt-1 text-sm text-ink">
        Safari clears saved data for sites you have not opened in 7 days. An app on the Home Screen is exempt, so your record
        survives a week off.
      </p>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink">
        <li>Tap the Share button (the square with an arrow) in Safari.</li>
        <li>Tap “Add to Home Screen”, then “Add”.</li>
        <li>Open the app from the Home Screen from now on.</li>
      </ol>
      {!force && (
        <button type="button" onClick={() => setSettings({ seenA2HS: true })} className="mt-3 min-h-11 rounded-xl bg-ink px-4 font-semibold text-white hover:bg-slate">
          Got it
        </button>
      )}
    </section>
  )
}
