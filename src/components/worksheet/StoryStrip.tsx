/**
 * The word problem, pinned at the top of the worksheet (DESIGN §7): the numbers the story gives are
 * highlighted, "what they ask" sits under it, and the progress line is always visible. Collapsible
 * so the active line keeps the screen on a phone.
 */
import { useId, useState, type ReactNode } from 'react'
import type { Given } from '@/shared/types'

/** Splits the story into plain text and highlighted given phrases (first occurrence, no overlaps). */
export function highlightStory(story: string, givens: readonly Given[]): ReactNode[] {
  const hits: { start: number; end: number; label: string }[] = []
  for (const g of givens) {
    if (!g.phrase) continue
    const start = story.indexOf(g.phrase)
    if (start < 0) continue
    const end = start + g.phrase.length
    if (hits.some((h) => start < h.end && end > h.start)) continue
    hits.push({ start, end, label: g.label })
  }
  hits.sort((a, b) => a.start - b.start)
  const out: ReactNode[] = []
  let at = 0
  hits.forEach((h, i) => {
    if (h.start > at) out.push(story.slice(at, h.start))
    out.push(
      <mark key={i} title={h.label} className="rounded bg-safety-100 px-0.5 font-semibold text-ink underline decoration-copper decoration-2 underline-offset-2">
        {story.slice(h.start, h.end)}
      </mark>,
    )
    at = h.end
  })
  if (at < story.length) out.push(story.slice(at))
  return out
}

export interface StoryStripProps {
  story: string
  givens: readonly Given[]
  ask: string
  /** "Line 4 of 9" and the like. */
  progress: string
  /** Start collapsed (e.g. the explanation after a Test-me pick). */
  startOpen?: boolean
}

export function StoryStrip({ story, givens, ask, progress, startOpen = true }: StoryStripProps) {
  const [open, setOpen] = useState(startOpen)
  const bodyId = useId()
  return (
    <section
      aria-label="The question"
      className="sticky top-0 z-30 -mx-4 mb-4 border-b border-slate-100 bg-white px-4 pb-2 pt-2 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setOpen((o) => !o)}
          className="flex min-h-11 items-center gap-2 rounded-lg pr-2 text-sm font-semibold text-slate hover:bg-slate-50"
        >
          <span aria-hidden="true" className="inline-block w-4 text-center">{open ? '▾' : '▸'}</span>
          {open ? 'Hide the question' : 'Show the question'}
        </button>
        <p className="tabular text-sm font-semibold text-ink" data-testid="progress">
          {progress}
        </p>
      </div>
      <div id={bodyId}>
        {open ? (
          <div className="max-h-[34dvh] overflow-y-auto pb-1">
            <p className="text-base leading-relaxed text-ink">{highlightStory(story, givens)}</p>
            <p className="mt-2 text-sm text-slate">
              <span className="font-semibold">They ask for:</span> {ask}
            </p>
          </div>
        ) : (
          <p className="truncate text-sm text-slate">{story}</p>
        )}
      </div>
    </section>
  )
}
