/**
 * Coach me: the lines in order, grouped by bucket. Only the current line is active; the lines above
 * show their accepted value. Also runs one bucket's lines when a paper total was off.
 */
import { useEffect, useState } from 'react'
import type { FadeLevel, NecEdition, Section, WorkLine } from '@/shared/types'
import { LineWork, type AttemptLog } from './LineWork'
import { useLatest } from './useLatest'
import { DoneLine, SectionHeading, type DoneResult } from './WorkedLine'

export interface CoachRunProps {
  lines: WorkLine[]
  sections?: Section[]
  /** The worksheet-wide number of a line (a bucket run keeps the sheet's numbering). */
  numberOf: (line: WorkLine) => number
  fade: FadeLevel
  keysSetting: 'hint' | 'always'
  edition: NecEdition
  /** Focus the first line as soon as it shows (later lines always take the focus). */
  focusFirst?: boolean
  /** Hide the bucket headings (a bucket run shows its own). */
  headings?: boolean
  onAttempt: (e: AttemptLog) => void
  onHint: () => void
  onLineDone?: (line: WorkLine, r: DoneResult) => void
  onProgress?: (current: number, total: number) => void
  onComplete: (results: Record<string, DoneResult>) => void
  announce: (text: string) => void
}

export function CoachRun({
  lines, sections = [], numberOf, fade, keysSetting, edition, focusFirst = false, headings = true,
  onAttempt, onHint, onLineDone, onProgress, onComplete, announce,
}: CoachRunProps) {
  const [current, setCurrent] = useState(0)
  const [results, setResults] = useState<Record<string, DoneResult>>({})
  const bySection = new Map(sections.map((s) => [s.id, s]))

  const progress = useLatest(onProgress)
  useEffect(() => {
    if (current < lines.length) progress.current?.(current, lines.length)
  }, [current, lines.length, progress])

  const done = (line: WorkLine, index: number, r: DoneResult) => {
    const next = { ...results, [line.id]: r }
    setResults(next)
    onLineDone?.(line, r)
    if (index + 1 >= lines.length) {
      setCurrent(lines.length)
      onComplete(next)
    } else {
      setCurrent(index + 1)
    }
  }

  const visible = lines.slice(0, Math.min(current + 1, lines.length))
  const remaining = lines.length - visible.length

  // Group the visible lines by bucket so each bucket gets its heading once.
  const groups: { section?: Section; items: { line: WorkLine; index: number }[] }[] = []
  visible.forEach((line, index) => {
    const section = line.section ? bySection.get(line.section) : undefined
    const last = groups[groups.length - 1]
    if (!last || last.section?.id !== section?.id) groups.push({ section, items: [] })
    groups[groups.length - 1]!.items.push({ line, index })
  })

  return (
    <div>
      {groups.map((g, gi) => (
        <div key={gi}>
          {headings && g.section && <SectionHeading section={g.section} />}
          <ol className="space-y-2">
            {g.items.map(({ line, index }) =>
              index < current ? (
                <DoneLine key={line.id} line={line} number={numberOf(line)} result={results[line.id]!} fresh={index === current - 1} />
              ) : (
                <LineWork
                  key={line.id}
                  line={line}
                  number={numberOf(line)}
                  fade={fade}
                  keysSetting={keysSetting}
                  edition={edition}
                  autoFocus={index > 0 || focusFirst}
                  onAttempt={onAttempt}
                  onHint={onHint}
                  onDone={(r) => done(line, index, r)}
                  announce={announce}
                />
              ),
            )}
          </ol>
        </div>
      ))}
      {remaining > 0 && (
        <p className="mt-3 text-sm text-slate">
          {remaining === 1 ? 'One more line after this one.' : `${remaining} more lines after this one.`}
        </p>
      )}
    </div>
  )
}
