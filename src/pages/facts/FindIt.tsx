/**
 * Find it in the book (/facts/find): the open-book navigation drill. Ten items, each names something
 * in the code book; he picks where he would open it. A tap answers (it is a speed drill). After each
 * pick: the right place, what is at the place he picked, and the chapter → article → section ladder.
 * The round is logged with `logDrill`.
 */
import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { randomSeed } from '@/calc'
import { BookHint } from '@/components/ui/BookHint'
import { ChoiceList } from '@/components/question/ChoiceList'
import { useChoiceKeys } from '@/components/question/useChoiceKeys'
import { btnPrimary, btnSecondary, card, fmtShort, LETTERS, PageHeader } from '@/components/question/ui'
// Until the drills index re-exports it through '@/content' (see the SHELL builder's report).
import { FIND_IT_DRILL, findItRound, type FindItRound } from '@/content'
import type { NecEdition } from '@/shared/types'
import { relativeDays, useStore } from '@/store'
import { drillRounds } from '@/store/selectors.facts'

export default function FindIt() {
  const edition = useStore((s) => s.settings.edition)
  return <FindItRun key={edition} edition={edition} />
}

function EditionNote({ edition }: { edition: NecEdition }) {
  if (edition === '2020') return null
  return (
    <p className="rounded-xl bg-safety-100 p-3 text-sm text-ink">
      <span aria-hidden="true">! </span>
      {edition === '2023'
        ? 'Locations are shown for the 2023 NEC where we have checked them. Article 220 moved a lot in 2023 and is left out until it is checked.'
        : 'The 2026 NEC locations are not mapped yet, so these are the 2020 locations. Your exam uses the 2020 NEC unless PSI says otherwise.'}
    </p>
  )
}

function FindItRun({ edition }: { edition: NecEdition }) {
  const logDrill = useStore((s) => s.logDrill)
  const events = useStore((s) => s.events)
  const [round, setRound] = useState<FindItRound | null>(null)
  const [index, setIndex] = useState(0)
  const [picks, setPicks] = useState<number[]>([])
  const [done, setDone] = useState(false)
  const [itemMs, setItemMs] = useState<number[]>([])
  const shownAt = useRef(0)
  const promptId = useId()
  const promptRef = useRef<HTMLHeadingElement>(null)

  function start() {
    setRound(findItRound(randomSeed(), edition))
    setIndex(0)
    setPicks([])
    setItemMs([])
    setDone(false)
    shownAt.current = Date.now()
  }

  const item = round?.items[index]
  const picked = picks[index]
  const answered = picked !== undefined

  function pick(i: number) {
    if (!round || !item || answered) return
    const ms = Math.max(0, Date.now() - shownAt.current)
    const nextPicks = [...picks, i]
    const nextMs = [...itemMs, ms]
    setPicks(nextPicks)
    setItemMs(nextMs)
    if (nextPicks.length === round.items.length) {
      const right = round.items.filter((it, k) => nextPicks[k] === it.answer).length
      logDrill({ drill: FIND_IT_DRILL, right, total: round.items.length, ms: nextMs.reduce((a, b) => a + b, 0) })
    }
  }

  function next() {
    if (!round || !answered) return
    if (index + 1 < round.items.length) {
      setIndex(index + 1)
      shownAt.current = Date.now()
    } else {
      setDone(true)
    }
  }

  // Each new item: focus its prompt, so the page scrolls to it and a screen reader reads it.
  useEffect(() => {
    if (round && !done) promptRef.current?.focus()
  }, [round, index, done])

  useChoiceKeys({ enabled: !!item && !done, count: 4, onPick: answered ? undefined : pick, onEnter: answered ? next : undefined })

  const header = (
    <PageHeader
      title="Find it in the book"
      lead="Open-book speed is a skill of its own. Each one names something in the code book: where would you open it?"
      back={{ to: '/facts', label: 'Code questions' }}
    />
  )

  if (!round) {
    const past = drillRounds(events, FIND_IT_DRILL).slice(-5).reverse()
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        {header}
        <EditionNote edition={edition} />
        <div className={`${card} space-y-3`}>
          <p className="text-ink">
            Ten quick ones. Tap where you would look; the answer and the way there (chapter, article, section) come right after.
            On the exam you have about 2.7 minutes a question, so a page found in 20 seconds leaves time to read it.
          </p>
          <button type="button" onClick={start} className={btnPrimary}>
            Start a round
          </button>
        </div>
        {past.length > 0 && (
          <section aria-labelledby="past-rounds" className={card}>
            <h2 id="past-rounds" className="font-bold text-ink">
              Your last rounds
            </h2>
            <ul className="mt-2 divide-y divide-slate-100">
              {past.map((r) => (
                <li key={r.at} className="flex justify-between gap-3 py-2 text-ink">
                  <span>
                    {r.right} of {r.total} right
                  </span>
                  <span className="text-slate">
                    {fmtShort(r.ms)} · {relativeDays(r.at)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    )
  }

  if (round.items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        {header}
        <p className={card}>There are not enough checked locations for this edition to make a round yet.</p>
      </div>
    )
  }

  if (done || !item) {
    const right = round.items.filter((it, k) => picks[k] === it.answer).length
    const total = itemMs.reduce((a, b) => a + b, 0)
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        {header}
        <section aria-labelledby="find-score" className="space-y-3">
          <h2 id="find-score" className="text-2xl font-bold text-ink">
            {right} of {round.items.length} found
          </h2>
          <p className="text-ink">
            Time: {fmtShort(total)} (about {fmtShort(total / round.items.length)} each).
          </p>
          <ol className="space-y-2">
            {round.items.map((it, k) => {
              const ok = picks[k] === it.answer
              return (
                <li key={it.key} className={`rounded-xl border-2 p-3 ${ok ? 'border-ok-100' : 'border-bad-100 bg-bad-100'}`}>
                  <p className="font-semibold text-ink">
                    <span className={ok ? 'text-ok' : 'text-bad'}>
                      <span aria-hidden="true">{ok ? '✓' : '✗'} </span>
                      {ok ? 'Found' : 'Missed'}
                    </span>
                    <span className="text-slate"> · </span>
                    {it.prompt}
                  </p>
                  <p className="mt-1 text-sm text-ink">
                    {it.choices[it.answer]}
                    {!ok && picks[k] !== undefined && ` (you picked ${it.choices[picks[k] as number]})`}
                  </p>
                </li>
              )
            })}
          </ol>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={start} className={btnPrimary}>
              Another round
            </button>
            <Link to="/facts" className={btnSecondary}>
              Back to Code questions
            </Link>
          </div>
        </section>
      </div>
    )
  }

  const correct = picked === item.answer
  const pickedRef = answered ? item.choiceRefs[picked as number] : undefined
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {header}
      <EditionNote edition={edition} />
      <article className="space-y-4" aria-labelledby={promptId}>
        <p className="text-sm font-semibold text-slate tabular">
          {index + 1} of {round.items.length}
        </p>
        <div>
          <p className="text-sm font-semibold text-slate">Where would you look for:</p>
          <h2 id={promptId} ref={promptRef} tabIndex={-1} className="mt-1 scroll-mt-4 text-lg font-semibold leading-snug text-ink outline-none md:text-xl">
            {item.prompt}
          </h2>
        </div>
        <ChoiceList
          choices={item.choices}
          selected={answered ? (picked as number) : null}
          onSelect={pick}
          labelledBy={promptId}
          reveal={answered ? { answer: item.answer, picked: picked as number } : undefined}
        />
        <div role="status" aria-live="polite" aria-atomic="true">
          {answered && (
            <p className={`rounded-xl border-2 p-3 text-lg font-bold ${correct ? 'border-ok bg-ok-100 text-ok' : 'border-bad bg-bad-100 text-bad'}`}>
              {correct ? (
                <>
                  <span aria-hidden="true">✓ </span>Found it: {item.choices[item.answer]}.
                </>
              ) : (
                <>
                  <span aria-hidden="true">✗ </span>Not there. It is in {item.choices[item.answer]} ({LETTERS[item.answer]}).
                </>
              )}
            </p>
          )}
        </div>
        {answered && (
          <div className="space-y-3">
            {!correct && pickedRef?.title && (
              <p className="text-ink">
                {item.choices[picked as number]} is where you find: {pickedRef.title}.
              </p>
            )}
            <div>
              <h3 className="mb-1 font-semibold text-ink">The way there</h3>
              <BookHint key={item.key} refTo={item.ref} edition={edition} initialRung={3} />
            </div>
            <button type="button" onClick={next} className={`${btnPrimary} w-full sm:w-auto`}>
              {index + 1 < round.items.length ? 'Next' : 'See your score'}
            </button>
          </div>
        )}
      </article>
    </div>
  )
}
