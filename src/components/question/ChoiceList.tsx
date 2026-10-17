/**
 * Four options as big native radio buttons labelled A-D. Before an answer: pick one (tap, arrows,
 * 1-4 or A-D through useChoiceKeys). After: each option says in words whether it is the right one
 * and whether it was his pick, with ✓ / ✗ marks, so color is never the only signal.
 */
import { useId } from 'react'
import { LETTERS } from './ui'

export interface ChoiceListProps {
  choices: readonly string[]
  selected: number | null
  onSelect: (index: number) => void
  /** Id of the element that states the question (the group's accessible name). */
  labelledBy: string
  /** After answering: the right index and his pick (null = left blank). Locks the list. */
  reveal?: { answer: number; picked: number | null }
  disabled?: boolean
  /** Larger type for the exam screen. */
  large?: boolean
}

export function ChoiceList({ choices, selected, onSelect, labelledBy, reveal, disabled, large }: ChoiceListProps) {
  const name = useId()
  const locked = disabled || !!reveal
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="space-y-2.5">
      {choices.map((text, i) => {
        const letter = LETTERS[i] ?? String(i + 1)
        const checked = selected === i
        const isAnswer = reveal?.answer === i
        const isWrongPick = !!reveal && reveal.picked === i && !isAnswer
        const tone = isAnswer
          ? 'border-ok bg-ok-100'
          : isWrongPick
            ? 'border-bad bg-bad-100'
            : checked
              ? 'border-ink bg-slate-50'
              : 'border-slate-100 bg-white'
        const mark = isAnswer ? (reveal?.picked === i ? 'right answer, your pick' : 'right answer') : isWrongPick ? 'your pick, not right' : ''
        return (
          <label
            key={i}
            className={`flex min-h-14 items-start gap-3 rounded-xl border-2 p-3 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-safety ${tone} ${
              locked ? 'cursor-default' : 'cursor-pointer hover:border-slate-600'
            }`}
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={checked}
              disabled={locked}
              onChange={() => onSelect(i)}
              aria-label={`${letter}. ${text}${mark ? ` (${mark})` : ''}`}
            />
            <span
              aria-hidden="true"
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base font-bold ${
                checked || isAnswer || isWrongPick ? 'bg-ink text-white' : 'bg-slate-50 text-ink'
              }`}
            >
              {letter}
            </span>
            <span className={`min-w-0 flex-1 pt-0.5 text-ink ${large ? 'text-lg' : ''}`}>
              {text}
              {reveal && (isAnswer || isWrongPick) && (
                <span className={`mt-1 block text-sm font-bold ${isAnswer ? 'text-ok' : 'text-bad'}`}>
                  {isAnswer ? (
                    <>
                      <span aria-hidden="true">✓ </span>
                      {reveal.picked === i ? 'Right answer, your pick' : 'Right answer'}
                    </>
                  ) : (
                    <>
                      <span aria-hidden="true">✗ </span>Your pick
                    </>
                  )}
                </span>
              )}
            </span>
            {!reveal && checked && (
              <span aria-hidden="true" className="pt-1 text-sm font-bold text-ink">
                ✓
              </span>
            )}
          </label>
        )
      })}
    </div>
  )
}
