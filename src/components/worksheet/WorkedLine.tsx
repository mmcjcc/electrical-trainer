/**
 * How a line looks once it is known: the full worked form (Show me, and the explanation after a
 * Test-me pick) and the compact done row of Coach me and Paper. Bucket headings too.
 */
import { locFor } from '@/data/necIndex'
import type { NecEdition, ProblemInstance, Section, WorkLine } from '@/shared/types'
import { Keycaps } from './Keycaps'

/** "0.213 ÷ 0.0133 = 16.02", a rounding step as printed ("16.02 → 16"), or null. */
export function workText(line: WorkLine): string | null {
  if (line.kind !== 'calc' || !line.expr) return null
  return line.expr.includes('→') ? line.expr : `${line.expr} = ${line.display}`
}

export function SectionHeading({ section, id }: { section: Section; id?: string }) {
  return (
    <h3 id={id} className="mt-5 mb-2 flex items-center gap-2 text-base font-bold text-ink first:mt-0">
      {section.letter && (
        <span aria-hidden="true" className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-ink px-2 text-sm text-white">
          {section.letter}
        </span>
      )}
      <span>
        {section.letter && <span className="sr-only">Bucket {section.letter}: </span>}
        {section.label}
      </span>
    </h3>
  )
}

export interface WorkedLineProps {
  line: WorkLine
  number: number
  edition: NecEdition
  keysAlways: boolean
  /** Highlight the line just revealed. */
  fresh?: boolean
}

export function WorkedLine({ line, number, edition, keysAlways, fresh }: WorkedLineProps) {
  const work = workText(line)
  const loc = line.ref ? locFor(line.ref, edition) : null
  return (
    <li className={`rounded-xl border p-3 ${fresh ? 'border-copper bg-copper-100/40' : 'border-slate-100 bg-white'}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="font-semibold text-ink">
          <span className="tabular text-slate">{number}.</span> {line.label}
        </p>
        <p className="tabular ml-auto text-right font-bold text-ink">{line.display}</p>
      </div>
      <p className="mt-1 text-ink">{line.say}</p>
      {work && <p className="tabular mt-1 font-mono text-sm text-ink">{work}</p>}
      {loc && (
        <p className="mt-1 text-sm text-slate">
          <span aria-hidden="true">📖 </span>
          <span className="sr-only">In the book: </span>
          {loc}
          {line.ref?.title ? `: ${line.ref.title}` : ''}
        </p>
      )}
      {line.why && (
        <p className="mt-1 text-sm text-slate-600">
          <span className="font-semibold">Why: </span>
          {line.why}
        </p>
      )}
      {line.sanity && <p className="mt-1 text-sm text-slate-600">Ballpark: {line.sanity}</p>}
      {line.keys && line.keys.length > 0 && (
        keysAlways ? (
          <div className="mt-2"><Keycaps keys={line.keys} /></div>
        ) : (
          <details className="mt-1">
            <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-slate">Calculator keys</summary>
            <Keycaps keys={line.keys} />
          </details>
        )
      )}
    </li>
  )
}

export interface DoneResult {
  firstTry: boolean
  revealed: boolean
  note?: string
}

/** A finished line in Coach me / Paper: its accepted value; the newest one also its ballpark. */
export function DoneLine({ line, number, result, fresh, title }: { line: WorkLine; number: number; result: DoneResult; fresh?: boolean; title?: string }) {
  return (
    <li className={`rounded-xl px-3 py-2 ${result.revealed ? 'bg-slate-50' : 'bg-ok-100'}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="text-ink">
          <span className="tabular text-slate">{number}.</span> {title ?? line.label}
        </span>
        <span className="tabular ml-auto text-right font-semibold text-ink">
          {result.revealed ? (
            <span className="mr-1 text-sm font-semibold text-slate">(shown)</span>
          ) : (
            <span className="mr-1 text-ok">
              <span aria-hidden="true">✓</span>
              <span className="sr-only">Right:</span>
            </span>
          )}
          {line.display}
        </span>
      </div>
      {fresh && (result.note || line.sanity) && (
        <p className="mt-1 text-sm text-slate-600">
          {result.note && <span>{result.note} </span>}
          {line.sanity && <span>Ballpark: {line.sanity}</span>}
        </p>
      )}
    </li>
  )
}

/** Line numbers across the whole worksheet (1-based), by line id. */
export function lineNumbers(p: ProblemInstance): Map<string, number> {
  return new Map(p.lines.map((l, i) => [l.id, i + 1]))
}

/** The whole worksheet (or its first `upTo` lines) in worked form, grouped by bucket. */
export function WorkedColumn({
  instance, upTo, edition, keysAlways, freshLast,
}: { instance: ProblemInstance; upTo?: number; edition: NecEdition; keysAlways: boolean; freshLast?: boolean }) {
  const lines = instance.lines.slice(0, upTo ?? instance.lines.length)
  const sections = new Map((instance.sections ?? []).map((s) => [s.id, s]))
  const groups: { section?: Section; lines: { line: WorkLine; n: number }[] }[] = []
  lines.forEach((line, i) => {
    const last = groups[groups.length - 1]
    const section = line.section ? sections.get(line.section) : undefined
    if (!last || last.section?.id !== section?.id) groups.push({ section, lines: [] })
    groups[groups.length - 1]!.lines.push({ line, n: i + 1 })
  })
  return (
    <div>
      {groups.map((g, gi) => (
        <div key={gi}>
          {g.section && <SectionHeading section={g.section} />}
          <ol className="space-y-2">
            {g.lines.map(({ line, n }) => (
              <WorkedLine key={line.id} line={line} number={n} edition={edition} keysAlways={keysAlways} fresh={freshLast && n === lines.length} />
            ))}
          </ol>
        </div>
      ))}
    </div>
  )
}
