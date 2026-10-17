/**
 * Paper: only each bucket's total is a blank, as if he worked the L-F-D-R-H-A list on scratch paper.
 * A wrong total opens that bucket's lines in Coach style so he finds the one slip, then the sheet
 * moves on. Recipes without buckets run Coach me at fade 2 instead.
 */
import { useEffect, useMemo, useState } from 'react'
import type { FadeLevel, NecEdition, ProblemInstance, WorkLine } from '@/shared/types'
import { CoachRun } from './CoachRun'
import { LineWork, type AttemptLog } from './LineWork'
import { paperSteps, sectionLines } from './ladder'
import { useLatest } from './useLatest'
import { DoneLine, lineNumbers, SectionHeading, type DoneResult } from './WorkedLine'

export interface PaperTally {
  lines: number
  firstTry: number
  revealed: number
}

export interface PaperRunProps {
  instance: ProblemInstance
  fade: FadeLevel
  keysSetting: 'hint' | 'always'
  edition: NecEdition
  onAttempt: (e: AttemptLog) => void
  onHint: () => void
  onLineDone: (line: WorkLine) => void
  onProgress: (text: string) => void
  onComplete: (tally: PaperTally) => void
  announce: (text: string) => void
}

interface StepResult extends DoneResult {
  /** The bucket was opened to find a slip. */
  opened: boolean
}

export function PaperRun(props: PaperRunProps) {
  const { instance, fade, keysSetting, edition, onAttempt, onHint, onLineDone, onProgress, onComplete, announce } = props
  const steps = useMemo(() => paperSteps(instance), [instance])
  const numbers = useMemo(() => lineNumbers(instance), [instance])
  const numberOf = (l: WorkLine) => numbers.get(l.id) ?? 0
  const [stepIdx, setStepIdx] = useState(0)
  const [results, setResults] = useState<StepResult[]>([])
  const [open, setOpen] = useState<{ message: string | null } | null>(null)
  const [subLine, setSubLine] = useState<{ at: number; of: number } | null>(null)

  const noBuckets = steps.length === 0

  const progress = useLatest(onProgress)
  useEffect(() => {
    if (noBuckets) return
    const step = steps[Math.min(stepIdx, steps.length - 1)]
    if (!step) return
    const buckets = steps.filter((s) => s.section).length
    const base = step.section ? `Bucket ${Math.min(stepIdx + 1, buckets)} of ${buckets}` : 'Last: the answer'
    progress.current(open && subLine ? `${base} · line ${subLine.at + 1} of ${subLine.of}` : base)
  }, [noBuckets, stepIdx, steps, open, subLine, progress])

  if (noBuckets) {
    // No buckets to total: the sheet behaves like Coach me with only the labels showing.
    return (
      <CoachRun
        lines={instance.lines}
        sections={instance.sections}
        numberOf={numberOf}
        fade={2}
        keysSetting={keysSetting}
        edition={edition}
        onAttempt={onAttempt}
        onHint={onHint}
        onLineDone={(l) => onLineDone(l)}
        onProgress={(c, t) => onProgress(`Line ${c + 1} of ${t}`)}
        onComplete={(r) => {
          const vals = Object.values(r)
          onComplete({ lines: vals.length, firstTry: vals.filter((v) => v.firstTry).length, revealed: vals.filter((v) => v.revealed).length })
        }}
        announce={announce}
      />
    )
  }

  const finishStep = (r: StepResult) => {
    const next = [...results, r]
    setResults(next)
    setOpen(null)
    setSubLine(null)
    if (stepIdx + 1 >= steps.length) {
      setStepIdx(steps.length)
      onComplete({ lines: steps.length, firstTry: next.filter((x) => x.firstTry).length, revealed: next.filter((x) => x.revealed).length })
    } else {
      setStepIdx(stepIdx + 1)
    }
  }

  const step = steps[stepIdx]

  return (
    <div>
      <p className="mb-3 text-sm text-slate">
        A bucket is one group of lines with one subtotal. Write the bucket letters down the side of your scratch paper, work each
        bucket there, and type only its total here.
      </p>
      <ol className="space-y-2">
        {steps.slice(0, stepIdx).map((s, i) => (
          <DoneLine
            key={s.line.id}
            line={s.line}
            number={i + 1}
            result={results[i]!}
            fresh={i === stepIdx - 1}
            title={s.section ? `${s.section.letter ? `${s.section.letter} · ` : ''}${s.section.label}` : s.line.label}
          />
        ))}
        {step && !open && (
          <LineWork
            key={step.line.id}
            line={step.line}
            number={stepIdx + 1}
            fade={step.section ? 2 : fade}
            keysSetting={keysSetting}
            edition={edition}
            title={step.section ? `${step.section.letter ? `${step.section.letter} · ` : ''}${step.section.label}` : undefined}
            variant={step.section ? 'paper-total' : 'coach'}
            autoFocus={stepIdx > 0}
            onAttempt={onAttempt}
            onHint={onHint}
            onDone={(r) => {
              onLineDone(step.line)
              finishStep({ ...r, opened: false })
            }}
            onOpenBucket={(message) => {
              setOpen({ message })
              announce(message ? 'That total is off. Here are the bucket’s lines: find the slip.' : 'Here are the bucket’s lines.')
            }}
            announce={announce}
          />
        )}
      </ol>

      {step && open && step.section && (
        <div className="mt-3 rounded-2xl border-2 border-copper bg-white p-3">
          <SectionHeading section={step.section} />
          {open.message ? (
            <p className="mb-3 rounded-xl bg-bad-100 p-3 text-ink">
              <span className="font-bold text-bad">
                <span aria-hidden="true">✗ </span>That total is off.{' '}
              </span>
              {open.message} Work this bucket line by line; the slip will show itself.
            </p>
          ) : (
            <p className="mb-3 text-slate">Work this bucket line by line.</p>
          )}
          <CoachRun
            lines={sectionLines(instance, step.section.id)}
            numberOf={numberOf}
            fade={fade}
            keysSetting={keysSetting}
            edition={edition}
            focusFirst
            headings={false}
            onAttempt={onAttempt}
            onHint={onHint}
            onLineDone={(l) => onLineDone(l)}
            onProgress={(at, of) => setSubLine({ at, of })}
            onComplete={(r) => {
              const vals = Object.values(r)
              announce(`Bucket ${step.section?.letter ?? ''} done. Back to the totals.`)
              finishStep({ firstTry: false, revealed: vals.some((v) => v.revealed), opened: true })
            }}
            announce={announce}
          />
        </div>
      )}
    </div>
  )
}
