/**
 * Pure helpers for the worksheet screens: the hint ladder of a line, the paper-stage steps, when the
 * picture may appear, and the predict-the-line options of Show-me checkpoints. No React.
 */
import { fmtUnit } from '@/calc'
import type { CoachMode, FadeLevel, ProblemInstance, Section, WorkLine } from '@/shared/types'

/** The rungs of one line's hint ladder, in the order they open. */
export type RungKind = 'say' | 'book' | 'numbers' | 'keys' | 'reveal'

/** True for a line that is a real calculator operation (not a rounding or decision step). */
export function isArithmetic(line: WorkLine): boolean {
  return line.kind === 'calc' && (line.keys?.length ?? 0) > 0
}

/**
 * The ladder (DESIGN §3.2/§3.4): (1) the instruction, only at fade 2 (fade 1 shows it already);
 * (2) the book location, for lines with a ref; (3) the numbers ("2,400 × 3"); (4) the calculator
 * keys, unless the setting shows them always; (5) reveal the line.
 */
export function hintRungs(line: WorkLine, fade: FadeLevel, keys: 'hint' | 'always'): RungKind[] {
  const out: RungKind[] = []
  if (fade === 2 && line.say) out.push('say')
  if (line.ref) out.push('book')
  if (isArithmetic(line) && line.expr) out.push('numbers')
  if (isArithmetic(line) && keys === 'hint') out.push('keys')
  out.push('reveal')
  return out
}

/** Button text for the rung that opens next. */
export function rungLabel(kind: RungKind, fade: FadeLevel): string {
  switch (kind) {
    case 'say': return 'What do I do here?'
    case 'book': return fade === 2 ? 'Which part of the book?' : 'Where is it in the book?'
    case 'numbers': return 'Show me the numbers'
    case 'keys': return 'Show the calculator keys'
    case 'reveal': return 'Show me this line'
  }
}

/**
 * Mistakes that mean "right numbers, wrong keys": after one of these the keystrokes are offered
 * without being asked for.
 */
export const KEY_SLIPS: ReadonlySet<string> = new Set(['inverse_op', 'flipped_division', 'percent_as_whole', 'decimal_slip', 'skipped_operation'])

/** Wrong tries on one line before "Show me this line" is offered up front. */
export const REVEAL_AFTER = 3

/** One blank of the paper stage: a bucket total (with its bucket), or the final answer. */
export interface PaperStep {
  line: WorkLine
  section?: Section
}

/**
 * Paper stage: each bucket's total in order, then the answer line when no bucket ends on it.
 * Empty when the recipe has no buckets (the page then runs coach at fade 2).
 */
export function paperSteps(p: ProblemInstance): PaperStep[] {
  const sections = p.sections ?? []
  if (sections.length === 0) return []
  const steps: PaperStep[] = []
  for (const s of sections) {
    const line = p.lines.find((l) => l.id === s.totalLine)
    if (line) steps.push({ line, section: s })
  }
  if (!steps.some((st) => st.line.id === p.answerLine)) {
    const answer = p.lines.find((l) => l.id === p.answerLine)
    if (answer) steps.push({ line: answer })
  }
  return steps
}

/** The lines of one bucket, in order. */
export function sectionLines(p: ProblemInstance, sectionId: string): WorkLine[] {
  return p.lines.filter((l) => l.section === sectionId)
}

/**
 * The line after which the picture may show, so it never gives the answer away early. A recipe may
 * name it in `visual.after`; otherwise the answer line.
 */
export function visualAfter(p: ProblemInstance): string {
  const after = p.visual?.after
  return typeof after === 'string' && p.lines.some((l) => l.id === after) ? after : p.answerLine
}

/** One button of a Show-me prediction. */
export interface PredictOption {
  id: string
  label: string
  correct: boolean
  /** Why the wrong pick is wrong (the line's own mistake message or option feedback). */
  message?: string
  mistake?: string
}

/**
 * The prediction for a checkpoint line: a choose line offers its own options; a number line offers
 * its right value against its first known mistake, in an order set by the seed. Null when the line
 * has nothing to predict (no checkpoint, or no known mistake).
 */
export function predictOptions(line: WorkLine, seed: number, index: number): PredictOption[] | null {
  if (!line.checkpoint) return null
  if (line.kind === 'choose') {
    if (!line.options || !line.answerId) return null
    return line.options.map((o) => ({
      id: o.id,
      label: o.label,
      correct: o.id === line.answerId,
      message: o.feedback,
      mistake: o.mistake,
    }))
  }
  const m = line.mistakes?.[0]
  if (!m || line.value === undefined) return null
  const right: PredictOption = { id: 'right', label: line.display, correct: true }
  const wrong: PredictOption = { id: 'wrong', label: fmtUnit(m.value, line.unit), correct: false, message: m.message, mistake: m.mistake }
  if (wrong.label === right.label) return null
  return (seed + index) % 2 === 0 ? [right, wrong] : [wrong, right]
}

// ---------------------------------------------------------------------------------------------
// Modes: names and one-line descriptions, shared by the recipe page and the worksheet
// ---------------------------------------------------------------------------------------------

export const MODES: CoachMode[] = ['show', 'coach', 'paper', 'test']

export const MODE_LABEL: Record<CoachMode, string> = {
  show: 'Show me',
  coach: 'Coach me',
  paper: 'Paper',
  test: 'Test me',
}

export const MODE_BLURB: Record<CoachMode, string> = {
  show: 'Watch one worked out, line by line. You call the key steps before they show.',
  coach: 'You fill in every line. Hints when you want them, a reason when you miss.',
  paper: 'Only the bucket totals, like working it on scratch paper. A miss opens that bucket.',
  test: 'Exam style: the question and four choices. Then the worked answer.',
}

export function isMode(m: string | undefined): m is CoachMode {
  return m === 'show' || m === 'coach' || m === 'paper' || m === 'test'
}
