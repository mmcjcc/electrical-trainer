/**
 * /math/drills and /math/drills/:drillId: the number drills. A round is ten quick items (about 45
 * seconds), big buttons or the number pad, the rule after every answer, the score at the end
 * (logged with `logDrill`).
 */
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { randomSeed } from '@/calc'
import { checkDrillAnswer, getNumberDrill, NUMBER_DRILLS, ROUND_SECONDS, type Drill, type DrillItem } from '@/content'
import { relativeDays, useStore } from '@/store'
import { drillStats } from '@/store/selectors.math'
import { locFor } from '@/data/necIndex'

export default function Drills() {
  const { drillId } = useParams()
  if (!drillId) return <DrillList />
  const drill = getNumberDrill(drillId)
  if (!drill) {
    return (
      <div className="py-10 text-center">
        <p className="text-ink">That drill is not here.</p>
        <Link to="/math/drills" className="mt-3 inline-flex min-h-11 items-center font-semibold text-slate underline decoration-copper decoration-2 underline-offset-4">
          All drills
        </Link>
      </div>
    )
  }
  return <DrillRound key={drill.id} drill={drill} />
}

function seconds(ms: number): string {
  return `${Math.round(ms / 1000)} s`
}

function DrillList() {
  const events = useStore((s) => s.events)
  return (
    <div className="mx-auto max-w-3xl">
      <nav aria-label="Breadcrumb" className="mb-1">
        <Link to="/math" className="inline-flex min-h-11 items-center gap-1 font-semibold text-slate hover:text-ink">
          <span aria-hidden="true">←</span> Math
        </Link>
      </nav>
      <h1 className="text-2xl font-bold text-ink">Number drills</h1>
      <p className="mt-1 text-ink">
        Ten quick ones, about {ROUND_SECONDS} seconds. No worksheet: just the reflexes the worksheets lean on, so the exam’s numbers stop
        being a wall.
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {NUMBER_DRILLS.map((d) => {
          const st = drillStats(events, d.id)
          return (
            <li key={d.id}>
              <Link to={`/math/drills/${d.id}`} className="flex h-full flex-col gap-1 rounded-2xl border-2 border-slate-100 bg-white p-4 hover:border-copper">
                <span className="text-lg font-bold text-ink">{d.title}</span>
                <span className="text-slate">{d.blurb}</span>
                <span className="tabular mt-auto pt-1 text-sm text-slate">
                  {st.last
                    ? `Best ${st.best!.right} of ${st.best!.total} · last ${st.last.right} of ${st.last.total}, ${relativeDays(st.last.at)}`
                    : 'Not tried yet'}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
      <p className="mt-5 text-sm text-slate">
        The find-it-in-the-book drill is under <Link to="/facts/find" className="font-semibold underline decoration-copper decoration-2 underline-offset-4">Code</Link>.
      </p>
    </div>
  )
}

interface Answer {
  item: DrillItem
  given: string
  ok: boolean
  message: string
}

function DrillRound({ drill }: { drill: Drill }) {
  const logDrill = useStore((s) => s.logDrill)
  const edition = useStore((s) => s.settings.edition)
  const [items, setItems] = useState<DrillItem[]>(() => drill.generate(randomSeed()))
  const [phase, setPhase] = useState<'ready' | 'run' | 'done'>('ready')
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [current, setCurrent] = useState<Answer | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const startedAt = useRef(0)
  const finalMs = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const firstOptionRef = useRef<HTMLButtonElement>(null)
  const advanceTimer = useRef<number | undefined>(undefined)
  const inputId = useId()

  const item = items[index]

  useEffect(() => {
    if (phase !== 'run') return
    const id = window.setInterval(() => setElapsed(Date.now() - startedAt.current), 500)
    return () => window.clearInterval(id)
  }, [phase])

  useEffect(() => () => window.clearTimeout(advanceTimer.current), [])

  // Focus: number items keep it in the box (Enter checks, then moves on); button items put it on
  // the first option, then on Next after an answer.
  useEffect(() => {
    if (phase !== 'run') return
    if (item?.kind === 'number') inputRef.current?.focus()
    else if (current) nextRef.current?.focus()
    else firstOptionRef.current?.focus()
  }, [phase, index, current, item])

  const begin = () => {
    startedAt.current = Date.now()
    setElapsed(0)
    setPhase('run')
  }

  const again = () => {
    setItems(drill.generate(randomSeed()))
    setIndex(0)
    setAnswers([])
    setCurrent(null)
    setNote(null)
    setInput('')
    begin()
  }

  const record = (given: string) => {
    if (!item || current) return
    const v = checkDrillAnswer(item, given)
    if (!v.ok && 'unreadable' in v && v.unreadable) {
      setNote(v.message)
      return
    }
    const a: Answer = { item, given, ok: v.ok, message: v.message }
    const all = [...answers, a]
    setAnswers(all)
    setCurrent(a)
    setNote(null)
    if (all.length === items.length) {
      finalMs.current = Date.now() - startedAt.current
      logDrill({ drill: drill.id, right: all.filter((x) => x.ok).length, total: all.length, ms: finalMs.current })
    } else if (v.ok) {
      // Right answers move on by themselves; a miss waits so the rule can be read.
      advanceTimer.current = window.setTimeout(next, 900)
    }
  }

  function next() {
    window.clearTimeout(advanceTimer.current)
    setCurrent(null)
    setInput('')
    if (index + 1 >= items.length) setPhase('done')
    else setIndex(index + 1)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    record(input)
  }

  const right = answers.filter((a) => a.ok).length

  return (
    <div className="mx-auto max-w-2xl">
      <nav aria-label="Breadcrumb" className="mb-1">
        <Link to="/math/drills" className="inline-flex min-h-11 items-center gap-1 font-semibold text-slate hover:text-ink">
          <span aria-hidden="true">←</span> All drills
        </Link>
      </nav>
      <h1 className="text-2xl font-bold text-ink">{drill.title}</h1>

      {phase === 'ready' && (
        <div className="mt-3 rounded-2xl border-2 border-slate-100 bg-white p-4">
          <p className="text-ink">{drill.howTo}</p>
          <p className="mt-2 text-sm text-slate">
            Ten items. Aim for about {ROUND_SECONDS} seconds, but right beats fast.
          </p>
          <button type="button" onClick={begin} className="mt-4 min-h-12 w-full rounded-xl bg-copper px-5 font-semibold text-white hover:bg-copper-700 sm:w-auto">
            Start
          </button>
        </div>
      )}

      {phase === 'run' && item && (
        <div className="mt-3">
          <div className="tabular mb-3 flex items-center justify-between text-sm font-semibold text-slate">
            <span>
              {index + 1} of {items.length}
            </span>
            <span role="timer" aria-live="off">
              {seconds(elapsed)} <span className="font-normal">/ about {ROUND_SECONDS} s</span>
            </span>
          </div>
          <div className="rounded-2xl border-2 border-copper bg-white p-4">
            {item.context && <p className="text-sm font-semibold text-copper-700">{item.context}</p>}
            <p className="tabular mt-1 text-2xl font-bold text-ink">{item.prompt}</p>
            <p className="mt-1 text-lg text-ink">{item.ask}</p>

            {item.kind === 'choice' ? (
              <div role="group" aria-label="Answers" className={`mt-4 grid gap-2 ${(item.options?.length ?? 0) > 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
                {(item.options ?? []).map((o, i) => {
                  const chosen = current?.given === o
                  const isRight = current !== null && o === item.answer
                  return (
                    <button
                      key={o}
                      ref={i === 0 ? firstOptionRef : undefined}
                      type="button"
                      disabled={current !== null}
                      onClick={() => record(o)}
                      className={`tabular min-h-14 rounded-xl border-2 px-3 py-2 text-lg font-semibold text-ink ${
                        isRight ? 'border-ok bg-ok-100' : chosen ? 'border-bad bg-bad-100' : 'border-slate-100 bg-white hover:border-copper hover:bg-copper-100'
                      }`}
                    >
                      {isRight && <span aria-hidden="true">✓ </span>}
                      {chosen && !isRight && <span aria-hidden="true">✗ </span>}
                      {o}
                    </button>
                  )
                })}
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="mt-4 flex items-center gap-2">
                <label htmlFor={inputId} className="sr-only">
                  Your answer
                </label>
                <input
                  ref={inputRef}
                  id={inputId}
                  type="text"
                  inputMode="decimal"
                  enterKeyHint="done"
                  autoComplete="off"
                  spellCheck={false}
                  value={input}
                  // Read-only (not disabled) after an answer, so the phone keeps its number pad up and
                  // Enter moves on to the next item.
                  readOnly={current !== null}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && current) {
                      e.preventDefault()
                      next()
                    }
                  }}
                  onChange={(e) => setInput(e.target.value)}
                  className="tabular min-h-14 w-full min-w-0 flex-1 rounded-xl border-2 border-slate-100 px-3 text-2xl text-ink read-only:bg-slate-50 focus:border-copper"
                />
                <button type="submit" disabled={current !== null} className="min-h-14 rounded-xl bg-ink px-5 text-lg font-semibold text-white hover:bg-slate disabled:opacity-60">
                  Check
                </button>
              </form>
            )}

            <div aria-live="polite">
              {note && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-ink">{note}</p>}
              {current && (
                <p className={`mt-3 rounded-xl p-3 text-ink ${current.ok ? 'bg-ok-100' : 'bg-bad-100'}`}>
                  {current.ok ? (
                    <span className="font-bold text-ok">
                      <span aria-hidden="true">✓ </span>Right.{' '}
                    </span>
                  ) : (
                    <span className="font-bold text-bad">
                      <span aria-hidden="true">✗ </span>Not this one. The answer is {item.answer}.{' '}
                    </span>
                  )}
                  {current.ok ? item.explain : current.message}
                </p>
              )}
            </div>
            {current && (
              <button ref={nextRef} type="button" onClick={next} className="mt-3 min-h-12 w-full rounded-xl bg-ink px-5 font-semibold text-white hover:bg-slate sm:w-auto">
                {index + 1 >= items.length ? 'See the score' : 'Next'}
              </button>
            )}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <section aria-labelledby="score" className="mt-3 rounded-2xl border-2 border-ink bg-white p-4">
          <h2 id="score" className="tabular text-2xl font-bold text-ink">
            {right} of {answers.length} right in {seconds(finalMs.current)}
          </h2>
          <p className="mt-1 text-ink">
            {right === answers.length
              ? finalMs.current <= ROUND_SECONDS * 1000
                ? 'Clean and quick. That reflex is yours.'
                : `All right. Next time aim for about ${ROUND_SECONDS} seconds.`
              : 'Read the misses below once, then go again: the same kinds come back with new numbers.'}
          </p>
          {answers.some((a) => !a.ok) && (
            <ul className="mt-3 space-y-2">
              {answers
                .filter((a) => !a.ok)
                .map((a) => (
                  <li key={a.item.key} className="rounded-xl bg-bad-100 p-3 text-ink">
                    <p className="font-semibold">{a.item.prompt}</p>
                    <p className="tabular text-sm">
                      You: {a.given || '(blank)'} · Answer: {a.item.answer}
                    </p>
                    <p className="text-sm">{a.item.explain}</p>
                    {a.item.ref && <p className="text-sm text-slate">📖 {locFor(a.item.ref, edition)}</p>}
                  </li>
                ))}
            </ul>
          )}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={again} className="min-h-12 rounded-xl bg-copper px-5 font-semibold text-white hover:bg-copper-700">
              Another round
            </button>
            <Link to="/math/drills" className="flex min-h-12 items-center justify-center rounded-xl px-5 font-semibold text-slate underline decoration-copper decoration-2 underline-offset-4">
              All drills
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
