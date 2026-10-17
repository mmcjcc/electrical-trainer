/**
 * One worksheet, in one of the four modes (DESIGN §3.4): the pinned story, the mode's column, the
 * picture once the lines it would give away are done, and the finish card. Logs every checked line
 * (`logLine`) and the finished run (`finishRecipe`) through the store.
 */
import { useCallback, useMemo, useRef, useState } from 'react'
import { EXAM } from '@/content'
import { RecipeVisual } from '@/components/visuals/RecipeVisual'
import { useStore } from '@/store'
import type { CoachMode, FadeLevel, ProblemInstance, WorkLine } from '@/shared/types'
import { CoachRun } from './CoachRun'
import { FinishCard } from './FinishCard'
import { visualAfter } from './ladder'
import type { AttemptLog } from './LineWork'
import { PaperRun, type PaperTally } from './PaperRun'
import { ShowRun } from './ShowRun'
import { StoryStrip } from './StoryStrip'
import { TestRun, type TestPick } from './TestRun'
import { lineNumbers } from './WorkedLine'

/** Exam pace: the whole exam's minutes over its questions (240 / 90 ≈ 2.7 minutes). */
export const TEST_SECONDS = Math.round((EXAM.minutes * 60) / EXAM.questions)

export interface WorksheetRunProps {
  instance: ProblemInstance
  mode: CoachMode
  /** Coach fading, fixed for the run (read once when the page opens). */
  fade: FadeLevel
  recipeHref: string
  /** Start a new problem in a mode (a fresh seed). */
  onStart: (mode: CoachMode) => void
}

interface Finished {
  summary: string
  detail?: string
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

export function WorksheetRun({ instance, mode, fade, recipeHref, onStart }: WorksheetRunProps) {
  const settings = useStore((s) => s.settings)
  const logLine = useStore((s) => s.logLine)
  const finishRecipe = useStore((s) => s.finishRecipe)
  const startedAt = useRef(Date.now())
  const hints = useRef(0)
  const [doneIds, setDoneIds] = useState<ReadonlySet<string>>(() => new Set())
  const [finished, setFinished] = useState<Finished | null>(null)
  const [testPicked, setTestPicked] = useState(false)
  const [progress, setProgress] = useState(() => (mode === 'test' ? 'Pick one of four' : `Line 1 of ${instance.lines.length}`))
  const [said, setSaid] = useState({ text: '', n: 0 })

  const rid = instance.recipeId
  const seed = instance.seed
  const numbers = useMemo(() => lineNumbers(instance), [instance])
  const numberOf = useCallback((l: WorkLine) => numbers.get(l.id) ?? 0, [numbers])
  const keysAlways = settings.keys === 'always'

  const announce = useCallback((text: string) => setSaid((s) => ({ text, n: s.n + 1 })), [])
  const onHint = useCallback(() => {
    hints.current += 1
  }, [])
  const onAttempt = useCallback(
    (e: AttemptLog) =>
      logLine({ rid, seed, mode, line: e.line, ok: e.ok, ...(e.mistake ? { mistake: e.mistake } : {}), ...(e.revealed ? { revealed: true } : {}) }),
    [logLine, rid, seed, mode],
  )
  const markDone = useCallback((l: WorkLine) => setDoneIds((s) => (s.has(l.id) ? s : new Set(s).add(l.id))), [])
  const ms = () => Date.now() - startedAt.current

  const finishLines = (t: PaperTally, unit: 'lines' | 'totals') => {
    finishRecipe({ rid, seed, mode, lines: t.lines, firstTry: t.firstTry, revealed: t.revealed, hints: hints.current, ms: ms() })
    const parts: string[] = []
    if (t.revealed) parts.push(`${plural(t.revealed, 'line', 'lines')} shown`)
    if (hints.current) parts.push(plural(hints.current, 'hint', 'hints'))
    setFinished({
      summary: `${t.firstTry} of ${t.lines} ${unit === 'lines' ? (t.lines === 1 ? 'line' : 'lines') : t.lines === 1 ? 'total' : 'totals'} right the first time.`,
      detail: parts.length ? `${parts.join(', ')}.` : undefined,
    })
    setProgress('Done')
  }

  const onTestPick = ({ choice }: TestPick) => {
    finishRecipe({
      rid, seed, mode: 'test', lines: 0, firstTry: 0, revealed: 0, hints: 0, ms: ms(),
      pickedCorrect: choice.correct, ...(choice.correct ? {} : { mistake: choice.mistake ?? 'unknown' }),
    })
    setTestPicked(true)
    setProgress('The worked answer')
    setFinished({ summary: choice.correct ? 'Right answer.' : 'Not this time. The worksheet above shows where it went.' })
  }

  const showPicture = finished !== null || testPicked || doneIds.has(visualAfter(instance))

  return (
    <div>
      <StoryStrip story={instance.story} givens={instance.givens} ask={instance.ask} progress={progress} />

      {mode === 'coach' && (
        <CoachRun
          lines={instance.lines}
          sections={instance.sections}
          numberOf={numberOf}
          fade={fade}
          keysSetting={settings.keys}
          edition={settings.edition}
          onAttempt={onAttempt}
          onHint={onHint}
          onLineDone={markDone}
          onProgress={(c, t) => setProgress(`Line ${c + 1} of ${t}`)}
          onComplete={(r) => {
            const vals = Object.values(r)
            finishLines({ lines: vals.length, firstTry: vals.filter((v) => v.firstTry).length, revealed: vals.filter((v) => v.revealed).length }, 'lines')
          }}
          announce={announce}
        />
      )}

      {mode === 'paper' && (
        <PaperRun
          instance={instance}
          fade={fade}
          keysSetting={settings.keys}
          edition={settings.edition}
          onAttempt={onAttempt}
          onHint={onHint}
          onLineDone={markDone}
          onProgress={setProgress}
          onComplete={(t) => finishLines(t, (instance.sections?.length ?? 0) > 0 ? 'totals' : 'lines')}
          announce={announce}
        />
      )}

      {mode === 'show' && (
        <ShowRun
          instance={instance}
          edition={settings.edition}
          keysAlways={keysAlways}
          onAttempt={onAttempt}
          onLineShown={markDone}
          onProgress={(s, t) => setProgress(s >= t ? `All ${t} lines shown` : `Line ${s + 1} of ${t}`)}
          onComplete={(cp) => {
            finishRecipe({ rid, seed, mode: 'show', lines: 0, firstTry: 0, revealed: 0, hints: 0, ms: ms(), checkpoints: cp })
            setFinished({
              summary: cp.asked > 0 ? `You called ${cp.right} of ${cp.asked} key ${cp.asked === 1 ? 'step' : 'steps'} right.` : 'You walked the whole worksheet.',
              detail: 'Now work one yourself, with hints when you want them.',
            })
          }}
          announce={announce}
        />
      )}

      {mode === 'test' && (
        <TestRun
          instance={instance}
          edition={settings.edition}
          keysAlways={keysAlways}
          timerSeconds={settings.testTimer ? TEST_SECONDS : undefined}
          onPick={onTestPick}
          announce={announce}
        />
      )}

      {showPicture && (
        <div className="mt-6">
          <RecipeVisual visual={instance.visual} />
        </div>
      )}

      {finished && (
        <FinishCard
          rid={rid}
          mode={mode}
          summary={finished.summary}
          detail={finished.detail}
          recipeHref={recipeHref}
          onStart={onStart}
          focus={mode !== 'test'}
        />
      )}

      <div aria-live="polite" aria-atomic="true" className="sr-only" data-testid="announcer">
        {said.text}
        {/* A changing invisible suffix makes a repeated message speak again. */}
        <span key={said.n} />
      </div>
    </div>
  )
}
