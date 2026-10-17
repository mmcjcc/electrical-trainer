/**
 * "Where is it in the book?": the three-rung codebook hint, shared by fact questions and worksheet
 * lines. Each tap opens one more rung (chapter → article and part → exact section/table, plus the tab
 * tip). `onRung` reports the highest rung opened so the page can record it. Respects the edition.
 */
import { useState } from 'react'
import { bookHint } from '@/data/necIndex'
import type { CodeRef, NecEdition } from '@/shared/types'

export interface BookHintProps {
  refTo: CodeRef
  edition: NecEdition
  /** Called with 1, 2 or 3 as rungs open. */
  onRung?: (rung: 1 | 2 | 3) => void
  /** Start with this many rungs open (e.g. 3 after the question is answered). */
  initialRung?: 0 | 1 | 2 | 3
  /** Button text when nothing is open yet. */
  label?: string
}

export function BookHint({ refTo, edition, onRung, initialRung = 0, label = 'Where is it in the book?' }: BookHintProps) {
  const [rung, setRung] = useState<0 | 1 | 2 | 3>(initialRung)
  const hint = bookHint(refTo, edition)
  const open = () => {
    const next = Math.min(3, rung + 1) as 1 | 2 | 3
    setRung(next)
    onRung?.(next)
  }
  const rows: { title: string; text: string }[] = [
    { title: 'Part of the book', text: hint.chapter },
    { title: 'Article', text: hint.article },
    { title: 'Exactly', text: hint.exact },
  ]
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm">
      {rung > 0 && (
        <ol className="mb-2 space-y-1.5">
          {rows.slice(0, rung).map((r) => (
            <li key={r.title}>
              <span className="font-semibold text-slate">{r.title}: </span>
              <span>{r.text}</span>
            </li>
          ))}
          {rung === 3 && hint.tip && <li className="text-copper-700">Tab tip: {hint.tip}</li>}
          {rung === 3 && refTo.title && <li className="text-slate-600">What it covers: {refTo.title}</li>}
        </ol>
      )}
      {rung < 3 && (
        <button
          type="button"
          onClick={open}
          className="min-h-11 rounded-lg px-3 font-semibold text-slate underline decoration-copper decoration-2 underline-offset-4 hover:bg-slate-100"
        >
          {rung === 0 ? `📖 ${label}` : 'Closer…'}
        </button>
      )}
    </div>
  )
}
