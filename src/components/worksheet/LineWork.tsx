/**
 * The active line of a worksheet (Coach me, and the blanks of Paper): the label, the instruction
 * (fade 1) or the instruction behind the first hint (fade 2), a number box with its unit or big
 * option buttons, Check (Enter), a reason for every miss, the hint ladder and "why?".
 *
 * Unreadable input is answered but never logged or counted. Three misses put "Show me this line"
 * up front. A diagnosed calculator slip offers the keystrokes without being asked.
 */
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { checkChoice, checkLine, UNIT_NAME, UNIT_TEXT } from '@/calc'
import { BookHint } from '@/components/ui/BookHint'
import type { FadeLevel, NecEdition, WorkLine } from '@/shared/types'
import { Keycaps } from './Keycaps'
import { hintRungs, isArithmetic, KEY_SLIPS, REVEAL_AFTER, rungLabel } from './ladder'
import type { DoneResult } from './WorkedLine'

export interface AttemptLog {
  line: string
  ok: boolean
  mistake?: string
  revealed?: boolean
}

export interface LineWorkProps {
  line: WorkLine
  number: number
  fade: FadeLevel
  keysSetting: 'hint' | 'always'
  edition: NecEdition
  /** Heading in place of the line label (a paper bucket: "L · Lighting ..."). */
  title?: ReactNode
  /**
   * 'paper-total': a bucket total in the paper stage. No hint ladder; a wrong total (or "open this
   * bucket") hands over to the bucket's own lines through `onOpenBucket`.
   */
  variant?: 'coach' | 'paper-total'
  /** Focus the input (or the first option) when the line appears. */
  autoFocus?: boolean
  onAttempt: (e: AttemptLog) => void
  onHint: () => void
  onDone: (r: DoneResult) => void
  onOpenBucket?: (message: string | null) => void
  announce: (text: string) => void
}

type Verdict = { tone: 'bad' | 'info'; message: string } | null

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function LineWork({
  line, number, fade, keysSetting, edition, title, variant = 'coach', autoFocus = false,
  onAttempt, onHint, onDone, onOpenBucket, announce,
}: LineWorkProps) {
  const [value, setValue] = useState('')
  const [tries, setTries] = useState(0)
  const [verdict, setVerdict] = useState<Verdict>(null)
  const [opened, setOpened] = useState(0)
  const [keysOffered, setKeysOffered] = useState(false)
  const [wrongPicks, setWrongPicks] = useState<string[]>([])
  const cardRef = useRef<HTMLLIElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const optionsRef = useRef<HTMLDivElement>(null)
  const headingId = useId()
  const inputId = useId()
  const verdictId = useId()

  const paper = variant === 'paper-total'
  const ladder = paper ? [] : hintRungs(line, fade, keysSetting)
  const open = ladder.slice(0, opened)
  const next = ladder[opened]
  const showSay = fade === 1 || open.includes('say')
  const arithmetic = isArithmetic(line)
  const keysVisible = arithmetic && !!line.keys?.length && (keysSetting === 'always' || open.includes('keys') || keysOffered)

  const bringIntoView = () => {
    const el = cardRef.current
    if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }

  useEffect(() => {
    if (!autoFocus) return
    const target = line.kind === 'choose' ? optionsRef.current?.querySelector<HTMLButtonElement>('button:not([disabled])') : inputRef.current
    target?.focus({ preventScroll: true })
    bringIntoView()
    // Only when the line first appears.
  }, [])

  const right = (note?: string) => {
    onAttempt({ line: line.id, ok: true })
    announce(`Right. ${line.label}: ${line.display}.${note ? ` ${note}` : ''}${line.sanity ? ` ${line.sanity}` : ''}`)
    onDone({ firstTry: tries === 0, revealed: false, note })
  }

  const miss = (mistake: string, message: string) => {
    onAttempt({ line: line.id, ok: false, mistake })
    setTries((t) => t + 1)
    setVerdict({ tone: 'bad', message })
    if (KEY_SLIPS.has(mistake) && arithmetic && line.keys?.length) setKeysOffered(true)
    announce(`Not yet. ${message}`)
    if (paper) onOpenBucket?.(message)
  }

  const check = (e?: FormEvent) => {
    e?.preventDefault()
    const v = checkLine(line, value)
    if (v.ok) return right(v.note)
    if (v.unreadable) {
      setVerdict({ tone: 'info', message: v.message })
      announce(v.message)
      inputRef.current?.focus()
      return
    }
    miss(v.mistake, v.message)
    inputRef.current?.select()
  }

  const pick = (optionId: string) => {
    const v = checkChoice(line, optionId)
    if (v.ok) return right()
    setWrongPicks((w) => [...w, optionId])
    miss(v.mistake, v.message)
    // The tried button is now disabled; keep focus inside the options.
    window.setTimeout(() => optionsRef.current?.querySelector<HTMLButtonElement>('button:not([disabled])')?.focus(), 0)
  }

  const reveal = () => {
    onAttempt({ line: line.id, ok: false, revealed: true })
    announce(`Shown. ${line.label}: ${line.display}.`)
    onDone({ firstTry: false, revealed: true })
  }

  const openNext = () => {
    if (!next) return
    if (next === 'reveal') return reveal()
    setOpened((o) => o + 1)
    onHint()
  }

  const unit = UNIT_TEXT[line.unit]
  const unitName = UNIT_NAME[line.unit]
  const stuck = tries >= REVEAL_AFTER

  return (
    <li
      ref={cardRef}
      aria-labelledby={headingId}
      className="scroll-mt-48 scroll-mb-40 rounded-2xl border-2 border-copper bg-white p-4 shadow-sm"
    >
      <h3 id={headingId} className="text-lg font-bold text-ink">
        <span className="tabular text-slate">{number}.</span> {title ?? line.label}
      </h3>
      {title && <p className="text-sm text-slate">{line.label}</p>}
      {showSay && !paper && <p className="mt-1 text-ink">{line.say}</p>}
      {paper && <p className="mt-1 text-sm text-slate">Work this bucket on scratch paper, then type its total.</p>}

      {line.kind === 'choose' ? (
        <div ref={optionsRef} role="group" aria-labelledby={headingId} className="mt-3 grid gap-2 sm:grid-cols-2">
          {(line.options ?? []).map((o) => {
            const tried = wrongPicks.includes(o.id)
            return (
              <button
                key={o.id}
                type="button"
                disabled={tried}
                onClick={() => pick(o.id)}
                className={`min-h-12 rounded-xl border-2 px-4 py-2 text-left font-semibold ${
                  tried ? 'border-bad bg-bad-100 text-bad' : 'border-slate-100 bg-white text-ink hover:border-copper hover:bg-copper-100'
                }`}
              >
                {tried && <span aria-hidden="true">✗ </span>}
                {o.label}
                {tried && <span className="sr-only"> (tried, not this one)</span>}
              </button>
            )
          })}
        </div>
      ) : (
        <form onSubmit={check} noValidate className="mt-3 flex flex-wrap items-center gap-2">
          <label htmlFor={inputId} className="sr-only">
            {typeof title === 'string' ? title : line.label}
            {unitName ? `, in ${unitName}` : ''}
          </label>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              inputMode="decimal"
              enterKeyHint="done"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onFocus={() => window.setTimeout(bringIntoView, 250)}
              aria-describedby={verdict ? verdictId : undefined}
              aria-invalid={verdict?.tone === 'bad' ? true : undefined}
              className="tabular min-h-12 w-full min-w-0 flex-1 rounded-xl border-2 border-slate-100 bg-white px-3 text-lg text-ink focus:border-copper"
            />
            {unit && (
              <span className="shrink-0 font-semibold text-slate" aria-hidden="true">
                {unit}
              </span>
            )}
          </div>
          <button type="submit" className="min-h-12 rounded-xl bg-ink px-5 font-semibold text-white hover:bg-slate">
            Check
          </button>
        </form>
      )}

      {verdict && (
        <p
          id={verdictId}
          className={`mt-3 rounded-xl p-3 ${verdict.tone === 'bad' ? 'bg-bad-100 text-ink' : 'bg-slate-50 text-ink'}`}
        >
          {verdict.tone === 'bad' ? (
            <span className="font-bold text-bad">
              <span aria-hidden="true">✗ </span>Not yet.{' '}
            </span>
          ) : (
            <span className="font-bold text-slate">
              <span aria-hidden="true">? </span>
            </span>
          )}
          {verdict.message}
        </p>
      )}

      {keysOffered && !open.includes('keys') && keysSetting === 'hint' && (
        <p className="mt-3 text-sm font-semibold text-slate">Your numbers look right. Try the keys in this order:</p>
      )}
      {keysVisible && line.keys && (
        <div className="mt-2">
          <Keycaps keys={line.keys} />
        </div>
      )}

      {/* Opened hint rungs (the instruction shows in its usual place above). */}
      {open.includes('book') && line.ref && (
        <div className="mt-3">
          <BookHint refTo={line.ref} edition={edition} initialRung={1} />
        </div>
      )}
      {open.includes('numbers') && line.expr && (
        <p className="mt-3 rounded-xl bg-slate-50 p-3 text-ink">
          <span className="font-semibold">The numbers: </span>
          <span className="tabular font-mono">{line.expr}</span>
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {paper ? (
          <button
            type="button"
            onClick={() => {
              onHint()
              onOpenBucket?.(null)
            }}
            className="min-h-11 rounded-xl border-2 border-slate-100 px-4 font-semibold text-slate hover:bg-slate-50"
          >
            Open this bucket’s lines
          </button>
        ) : (
          <>
            {next && next !== 'reveal' && (
              <button
                type="button"
                onClick={openNext}
                className="min-h-11 rounded-xl border-2 border-slate-100 px-4 font-semibold text-slate hover:bg-slate-50"
              >
                <span aria-hidden="true">💡 </span>
                {rungLabel(next, fade)}
              </button>
            )}
            {(next === 'reveal' || stuck) && (
              <button
                type="button"
                onClick={reveal}
                className={`min-h-11 rounded-xl px-4 font-semibold ${
                  stuck ? 'bg-copper text-white hover:bg-copper-700' : 'border-2 border-slate-100 text-slate hover:bg-slate-50'
                }`}
              >
                {stuck ? 'Stuck? Show me this line' : 'Show me this line'}
                <span className={`ml-1 text-xs font-normal ${stuck ? 'text-white' : 'text-slate'}`}>(marked as shown)</span>
              </button>
            )}
          </>
        )}
      </div>

      {line.why && !paper && (
        <details className="mt-2">
          <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-slate">Why this line?</summary>
          <p className="pb-1 text-ink">{line.why}</p>
        </details>
      )}
    </li>
  )
}
