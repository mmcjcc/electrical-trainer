/**
 * One fact question, practice style: the stem, four options A-D, the optional "Where is it in the
 * book?" ladder, Check answer, then the verdict in words, the explanation, why his pick was wrong
 * (when the question says), and the full reference. Records the answer through the store's
 * `answerQuestion` with the highest hint rung he opened and the time he took.
 */
import { useEffect, useId, useRef, useState } from 'react'
import { BookHint } from '@/components/ui/BookHint'
import type { NecEdition, Question, TopicId } from '@/shared/types'
import { useStore, type QuestionMode } from '@/store'
import { ChoiceList } from './ChoiceList'
import { useChoiceKeys } from './useChoiceKeys'
import { btnPrimary, LETTERS, TOPIC_SHORT } from './ui'

export interface AnswerResult {
  qid: string
  topic: TopicId
  pick: number
  correct: boolean
  hint: 0 | 1 | 2 | 3
  ms: number
}

export interface QuestionCardProps {
  question: Question
  edition: NecEdition
  mode: Exclude<QuestionMode, 'exam'>
  /** Offer the book hint before answering (settings.bookHints === 'button'). */
  showHint: boolean
  /** "Question 7 of 10". */
  position?: string
  onAnswered?: (r: AnswerResult) => void
  onNext?: () => void
  nextLabel?: string
  /** Move focus (and the scroll) to the stem when the card appears: the next question in a session. */
  focusOnMount?: boolean
}

/** Hint button wording by the kind of book the answer lives in. */
export function hintLabel(q: Pick<Question, 'ref'>): string {
  if (q.ref.book === 'MD') return 'Where is it in Maryland law?'
  if (q.ref.book === 'THEORY') return 'Where does this come from?'
  return 'Where is it in the book?'
}

/** A one-line tag above the stem: the area, and what kind of question it is. */
export function kindTag(q: Pick<Question, 'kind' | 'topic'>): string {
  if (q.kind === 'law') return 'Maryland law · not on the PSI exam outline'
  if (q.kind === 'theory' || q.topic === 'theory') return 'Electrical theory · 2 points each on the exam'
  return TOPIC_SHORT[q.topic] ?? q.topic
}

export function QuestionCard(props: QuestionCardProps) {
  // A new question is a new card: selection, hint rung and clock start over.
  return <Card key={props.question.id} {...props} />
}

function Card({ question: q, edition, mode, showHint, position, onAnswered, onNext, nextLabel = 'Next question', focusOnMount = false }: QuestionCardProps) {
  const answerQuestion = useStore((s) => s.answerQuestion)
  const [selected, setSelected] = useState<number | null>(null)
  const [result, setResult] = useState<AnswerResult | null>(null)
  const [hint, setHint] = useState<0 | 1 | 2 | 3>(0)
  const [started] = useState(() => Date.now())
  const stemId = useId()
  const stemRef = useRef<HTMLHeadingElement>(null)
  const submitted = useRef(false)
  useEffect(() => {
    if (focusOnMount) stemRef.current?.focus()
  }, [focusOnMount])

  function submit() {
    if (selected === null || submitted.current) return
    submitted.current = true
    const r: AnswerResult = { qid: q.id, topic: q.topic, pick: selected, correct: selected === q.answer, hint, ms: Math.max(0, Date.now() - started) }
    answerQuestion({ ...r, mode })
    setResult(r)
    onAnswered?.(r)
  }

  useChoiceKeys({
    enabled: true,
    count: q.choices.length,
    onPick: result ? undefined : setSelected,
    onEnter: result ? onNext : submit,
  })

  const why = result && !result.correct ? q.whyNot?.[result.pick as 0 | 1 | 2 | 3] : undefined
  const right = `${LETTERS[q.answer]}, ${q.choices[q.answer]}`

  return (
    <article className="space-y-4" aria-labelledby={stemId}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
        <p className={`font-semibold ${q.kind === 'law' ? 'text-copper-700' : 'text-slate'}`}>{kindTag(q)}</p>
        {position && <p className="font-semibold text-slate tabular">{position}</p>}
      </div>

      <h2 id={stemId} ref={stemRef} tabIndex={-1} className="scroll-mt-4 text-lg font-semibold leading-snug text-ink outline-none md:text-xl">
        {q.stem}
      </h2>

      <ChoiceList
        choices={q.choices}
        selected={result ? result.pick : selected}
        onSelect={setSelected}
        labelledBy={stemId}
        reveal={result ? { answer: q.answer, picked: result.pick } : undefined}
      />

      {showHint && !result && (
        <BookHint refTo={q.ref} edition={edition} label={hintLabel(q)} onRung={(r) => setHint((h) => (r > h ? r : h))} />
      )}

      {!result && (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={submit} disabled={selected === null} className={btnPrimary}>
            Check answer
          </button>
          <p className="hidden text-sm text-slate md:block">
            Keys: <kbd className="keycap">1</kbd>–<kbd className="keycap">4</kbd> or <kbd className="keycap">A</kbd>–<kbd className="keycap">D</kbd> to
            pick, <kbd className="keycap">Enter</kbd> to check
          </p>
        </div>
      )}

      <div role="status" aria-live="polite" aria-atomic="true">
        {result && (
          <p
            className={`rounded-xl border-2 p-3 text-lg font-bold ${result.correct ? 'border-ok bg-ok-100 text-ok' : 'border-bad bg-bad-100 text-bad'}`}
          >
            {result.correct ? (
              <>
                <span aria-hidden="true">✓ </span>Right: {right}.
              </>
            ) : (
              <>
                <span aria-hidden="true">✗ </span>Not this one. You picked {LETTERS[result.pick]}; the answer is {right}.
              </>
            )}
          </p>
        )}
      </div>

      {result && (
        <div className="space-y-4">
          <section aria-label="Why">
            <h3 className="font-semibold text-ink">Why</h3>
            <p className="mt-1 text-ink">{q.explain}</p>
          </section>
          {why && (
            <section aria-label={`Why not ${LETTERS[result.pick]}`}>
              <h3 className="font-semibold text-ink">Why not {LETTERS[result.pick]}</h3>
              <p className="mt-1 text-ink">{why}</p>
            </section>
          )}
          {q.kind === 'law' && (
            <p className="text-sm text-slate">
              Maryland law is not on the PSI exam outline. It is here because you will work under it once you hold the license.
            </p>
          )}
          <section aria-label="In the book">
            <h3 className="mb-1 font-semibold text-ink">{q.ref.book === 'MD' ? 'In Maryland law' : q.ref.book === 'THEORY' ? 'Where it comes from' : 'In the book'}</h3>
            <BookHint key="after" refTo={q.ref} edition={edition} initialRung={3} />
            {result.hint > 0 && (
              <p className="mt-2 text-sm text-slate">
                You opened the book hint ({result.hint} of 3 steps). It is recorded, never counted as wrong: finding it in the book is
                the exam skill.
              </p>
            )}
          </section>
          {onNext && (
            <button type="button" onClick={onNext} className={`${btnPrimary} w-full sm:w-auto`}>
              {nextLabel}
            </button>
          )}
        </div>
      )}
    </article>
  )
}
