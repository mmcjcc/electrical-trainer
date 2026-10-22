/**
 * The exam in progress (/exam/run): one item per screen, the clock (it runs only while this screen
 * is open), flag, previous/next, a grid of every item showing answered and flagged, and submit with a
 * confirm that counts what is blank and flagged. Plain and high contrast, no motion: it may be open
 * for four hours. Everything lives in the persisted exam session, so a reload loses nothing.
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookHint } from '@/components/ui/BookHint'
import { StudyAidNote } from '@/components/ui/StudyAidNote'
import { ChoiceList } from '@/components/question/ChoiceList'
import { hintLabel } from '@/components/question/QuestionCard'
import { InlineConfirm } from '@/components/question/InlineConfirm'
import { useChoiceKeys } from '@/components/question/useChoiceKeys'
import { btnPrimary, btnSecondary, card, PageHeader } from '@/components/question/ui'
import { useStore, type ExamSession, type QuestionEv, type RecipeEv } from '@/store'
import { itemView, safeScore } from './examItem'

/** The longest stretch one tick may add (a phone asleep for an hour is not exam time). */
const MAX_TICK_MS = 5000

export default function ExamRun() {
  const exam = useStore((s) => s.exam)
  const hasResults = useStore((s) => s.lastExam !== null)
  if (!exam) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Exam simulator" back={{ to: '/facts', label: 'Code questions' }} />
        <div className={`${card} space-y-3`}>
          <p className="text-ink">No exam is in progress.</p>
          <div className="flex flex-wrap gap-2">
            <Link to="/exam" className={btnPrimary}>
              Start an exam
            </Link>
            {hasResults && (
              <Link to="/exam/results" className={btnSecondary}>
                Last exam's results
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }
  return <Run exam={exam} />
}

/** Adds active time once a second while the page is open and visible. */
function useExamClock() {
  useEffect(() => {
    let last = Date.now()
    const id = window.setInterval(() => {
      const t = Date.now()
      const delta = t - last
      last = t
      if (typeof document !== 'undefined' && document.hidden) return
      useStore.getState().tickExam(Math.min(Math.max(0, delta), MAX_TICK_MS))
    }, 1000)
    const onVisible = () => {
      last = Date.now()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])
}

function clock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`
}

function Run({ exam }: { exam: ExamSession }) {
  const navigate = useNavigate()
  const answerExam = useStore((s) => s.answerExam)
  const flagExam = useStore((s) => s.flagExam)
  const hintExam = useStore((s) => s.hintExam)
  const gotoExam = useStore((s) => s.gotoExam)
  const finishExam = useStore((s) => s.finishExam)
  const edition = exam.paper.edition
  const [showGrid, setShowGrid] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const stemId = useId()
  const stemRef = useRef<HTMLHeadingElement>(null)
  const firstItem = useRef(true)
  useExamClock()

  const { paper, answers, flags, current } = exam
  const n = paper.items.length
  const i = Math.min(Math.max(0, current), n - 1)
  const item = paper.items[i]
  // Generating a calculation is pure but not free: once per item, not once per clock tick.
  const view = useMemo(() => (item ? itemView(item) : null), [item])

  const limitMs = paper.minutes * 60_000
  const leftMs = limitMs - exam.elapsedMs
  const answered = answers.filter((a) => a !== null).length
  const flagged = flags.filter(Boolean).length
  const blanks = answers.map((a, k) => (a === null ? k : -1)).filter((k) => k >= 0)
  const flaggedList = flags.map((f, k) => (f ? k : -1)).filter((k) => k >= 0)
  const expected = Math.min(n, Math.floor((exam.elapsedMs / limitMs) * n))
  const behind = expected - answered

  const go = (k: number) => {
    setConfirming(false)
    gotoExam(k)
  }
  const pick = (k: number) => answerExam(i, k)

  // A new item on screen: bring its stem into view and give it focus (not on first load).
  useEffect(() => {
    if (firstItem.current) {
      firstItem.current = false
      return
    }
    stemRef.current?.focus()
  }, [i])

  useChoiceKeys({
    enabled: !confirming && !!view && view.choices.length > 0,
    count: view?.choices.length ?? 0,
    onPick: pick,
    extra: {
      ArrowLeft: () => i > 0 && go(i - 1),
      ArrowRight: () => i < n - 1 && go(i + 1),
      f: () => flagExam(i, !flags[i]),
    },
  })

  function submit() {
    const score = safeScore(paper, answers)
    const msEach = n ? Math.round(exam.elapsedMs / n) : 0
    const perItem: Omit<QuestionEv, 't' | 'at'>[] = []
    paper.items.forEach((it, k) => {
      if (it.kind !== 'question') return
      const v = itemView(it)
      if (v.kind !== 'question') return
      const pickK = answers[k] ?? null
      // A blank counts as a miss so it comes back in Review; pick -1 means "left blank".
      perItem.push({ qid: v.q.id, topic: it.topic, pick: pickK ?? -1, correct: pickK === v.answer, hint: exam.hints[k] ?? 0, ms: msEach, mode: 'exam' })
    })
    // Calculation items count as Test-me runs of their recipe (stage, calc readiness, mistakes).
    const perCalc: Omit<RecipeEv, 't' | 'at'>[] = []
    paper.items.forEach((it, k) => {
      if (it.kind !== 'calc') return
      const v = itemView(it)
      if (v.kind !== 'calc') return
      const pickK = answers[k] ?? null
      const choice = pickK === null ? undefined : v.problem.choices[pickK]
      perCalc.push({
        rid: it.recipeId, seed: it.seed, mode: 'test', lines: 0, firstTry: 0, revealed: 0, hints: exam.hints[k] ?? 0,
        pickedCorrect: pickK === v.answer, ...(choice && !choice.correct && choice.mistake ? { mistake: choice.mistake } : {}), ms: msEach,
      })
    })
    finishExam({ pct: score.pct, passed: score.passed, byTopic: score.byTopic.map((t) => ({ topic: t.topic, right: t.right, asked: t.asked })) }, perItem, undefined, perCalc)
    navigate('/exam/results')
  }

  if (!item || !view) return null

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="sr-only">Exam in progress</h1>

      <div className="sticky top-0 z-30 -mx-4 border-b-2 border-ink bg-white px-4 py-2">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <p className="text-lg font-bold text-ink tabular">
            Question {i + 1} of {n}
          </p>
          <p className="font-bold text-ink tabular" role="timer" aria-live="off">
            {leftMs > 0 ? (
              <>
                <span className="font-semibold text-slate">Time left </span>
                {clock(leftMs)}
              </>
            ) : (
              <span className="text-bad">Time is up</span>
            )}
          </p>
        </div>
        <p className="text-sm text-slate tabular">
          {answered} answered · {flagged} flagged ·{' '}
          {behind > 1 ? `about ${behind} behind the exam's pace` : 'on pace'}
        </p>
      </div>

      {leftMs <= 0 && (
        <p role="alert" className="rounded-xl border-2 border-bad bg-bad-100 p-3 font-semibold text-ink">
          Time is up. On the real exam the test ends here. Submit to see your score; anything you answer now is past the limit.
        </p>
      )}

      <article aria-labelledby={stemId} className="space-y-4">
        {view.kind === 'calc' && <p className="text-sm font-semibold text-slate">Calculation</p>}
        <h2 id={stemId} ref={stemRef} tabIndex={-1} className="scroll-mt-28 whitespace-pre-line text-lg font-semibold leading-relaxed text-ink outline-none md:text-xl">
          {view.stem}
        </h2>
        {view.choices.length > 0 && (
          <ChoiceList choices={view.choices} selected={answers[i] ?? null} onSelect={pick} labelledBy={stemId} large />
        )}
        {exam.hintsOn && view.kind === 'question' && (
          <BookHint
            key={i}
            refTo={view.q.ref}
            edition={edition}
            label={hintLabel(view.q)}
            initialRung={exam.hints[i] ?? 0}
            onRung={(r) => hintExam(i, r)}
          />
        )}
      </article>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => go(i - 1)} disabled={i === 0} className={btnSecondary}>
          <span aria-hidden="true">←</span> Previous
        </button>
        {i < n - 1 ? (
          <button type="button" onClick={() => go(i + 1)} className={btnPrimary}>
            Next <span aria-hidden="true">→</span>
          </button>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className={btnPrimary}>
            Review and submit
          </button>
        )}
        <button
          type="button"
          aria-pressed={flags[i] ?? false}
          onClick={() => flagExam(i, !flags[i])}
          className={`inline-flex min-h-11 items-center gap-2 rounded-xl border-2 px-4 font-semibold ${
            flags[i] ? 'border-copper bg-copper-100 text-ink' : 'border-slate-100 bg-white text-ink hover:bg-slate-50'
          }`}
        >
          <span aria-hidden="true">⚑</span> {flags[i] ? 'Flagged' : 'Flag for review'}
        </button>
        {answers[i] !== null && (
          <button type="button" onClick={() => answerExam(i, null)} className="min-h-11 rounded-xl px-3 text-sm font-semibold text-slate underline">
            Clear my answer
          </button>
        )}
      </div>

      {confirming && (
        <InlineConfirm
          title="Submit the exam?"
          confirmLabel="Submit and see my score"
          cancelLabel="Keep working"
          onConfirm={submit}
          onCancel={() => setConfirming(false)}
        >
          <p>
            You answered {answered} of {n}.{' '}
            {blanks.length > 0 ? `${blanks.length} ${blanks.length === 1 ? 'is' : 'are'} blank and score zero.` : 'None are blank.'}{' '}
            {flaggedList.length > 0 ? `${flaggedList.length} ${flaggedList.length === 1 ? 'is' : 'are'} flagged.` : 'None are flagged.'}
          </p>
          {blanks.length > 0 && <JumpList label="Blank" items={blanks} onGo={go} />}
          {flaggedList.length > 0 && <JumpList label="Flagged" items={flaggedList} onGo={go} />}
        </InlineConfirm>
      )}

      <section aria-labelledby="grid-title" className={card}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="grid-title" className="font-bold text-ink">
            All questions
          </h2>
          <button type="button" onClick={() => setShowGrid((v) => !v)} aria-expanded={showGrid} className={btnSecondary}>
            {showGrid ? 'Hide the grid' : 'Show the grid'}
          </button>
        </div>
        {showGrid && <Navigator exam={exam} current={i} onGo={go} />}
        {!confirming && (
          <button type="button" onClick={() => setConfirming(true)} className={`${btnSecondary} mt-3`}>
            Submit the exam…
          </button>
        )}
      </section>
      <p className="text-sm text-slate">Leaving this screen stops the clock; come back to it from Home or Code questions.</p>
      <p className="hidden text-sm text-slate md:block">
        Keys: <kbd className="keycap">1</kbd>–<kbd className="keycap">4</kbd> or <kbd className="keycap">A</kbd>–<kbd className="keycap">D</kbd> answer,{' '}
        <kbd className="keycap">←</kbd> <kbd className="keycap">→</kbd> move, <kbd className="keycap">F</kbd> flags.
      </p>
      <StudyAidNote />
    </div>
  )
}

function JumpList({ label, items, onGo }: { label: string; items: number[]; onGo: (k: number) => void }) {
  return (
    <div className="mt-2">
      <p className="text-sm font-semibold">{label}:</p>
      <ul className="mt-1 flex flex-wrap gap-1.5">
        {items.slice(0, 30).map((k) => (
          <li key={k}>
            <button
              type="button"
              onClick={() => onGo(k)}
              aria-label={`Go to question ${k + 1}`}
              className="min-h-11 min-w-11 rounded-lg border-2 border-ink bg-white px-2 font-semibold text-ink tabular"
            >
              {k + 1}
            </button>
          </li>
        ))}
        {items.length > 30 && <li className="self-center text-sm">and {items.length - 30} more</li>}
      </ul>
    </div>
  )
}

function Navigator({ exam, current, onGo }: { exam: ExamSession; current: number; onGo: (k: number) => void }) {
  return (
    <div className="mt-3">
      <p className="mb-2 text-sm text-slate">
        <span className="font-semibold text-ink">■</span> answered · <span className="font-semibold text-ink">□</span> blank ·{' '}
        <span className="font-semibold text-ink">⚑</span> flagged · the outlined one is on screen
      </p>
      <ol className="grid grid-cols-6 gap-1.5 sm:grid-cols-10">
        {exam.paper.items.map((_, k) => {
          const done = exam.answers[k] !== null
          const flag = exam.flags[k]
          const here = k === current
          const words = `Question ${k + 1}, ${done ? 'answered' : 'blank'}${flag ? ', flagged' : ''}${here ? ', on screen' : ''}`
          return (
            <li key={k}>
              <button
                type="button"
                onClick={() => onGo(k)}
                aria-label={words}
                aria-current={here ? 'step' : undefined}
                className={`relative flex min-h-11 w-full items-center justify-center rounded-lg border-2 text-sm font-bold tabular ${
                  done ? 'border-ink bg-ink text-white' : 'border-slate-600 bg-white text-ink'
                } ${here ? 'outline-3 outline-offset-2 outline-safety' : ''}`}
              >
                {k + 1}
                {flag && (
                  <span aria-hidden="true" className={`absolute right-0.5 top-0 text-xs ${done ? 'text-safety' : 'text-copper-700'}`}>
                    ⚑
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
