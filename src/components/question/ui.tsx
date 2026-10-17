/**
 * Small shared pieces for the shell pages: button and card classes, a switch, a meter with words,
 * and a page header. Theme tokens only (src/index.css); color is never the only signal.
 */
import { useId, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

export const btnPrimary =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ink px-4 font-semibold text-white hover:bg-slate disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate'
export const btnSecondary =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-slate-100 bg-white px-4 font-semibold text-ink hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-600'
export const btnDanger =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-bad bg-white px-4 font-semibold text-bad hover:bg-bad-100'
export const card = 'rounded-2xl border border-slate-100 bg-white p-4'
export const link = 'font-semibold text-ink underline decoration-copper decoration-2 underline-offset-4 hover:text-copper-700'

export function PageHeader({ title, lead, back }: { title: string; lead?: ReactNode; back?: { to: string; label: string } }) {
  return (
    <header className="mb-5">
      {back && (
        <Link to={back.to} className="mb-1 inline-flex min-h-11 items-center text-sm font-semibold text-slate hover:text-ink">
          <span aria-hidden="true">←&nbsp;</span>
          {back.label}
        </Link>
      )}
      <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">{title}</h1>
      {lead && <p className="mt-1 text-slate">{lead}</p>}
    </header>
  )
}

/** An on/off switch with its label and a one-line description. */
export function Switch({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  const id = useId()
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <p id={`${id}-label`} className="font-semibold text-ink">
          {label}
        </p>
        {description && (
          <p id={`${id}-desc`} className="mt-0.5 text-sm text-slate">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-desc` : undefined}
        onClick={() => onChange(!checked)}
        className={`min-h-11 min-w-20 shrink-0 rounded-full px-3 text-sm font-semibold ${
          checked ? 'bg-ink text-white hover:bg-slate' : 'border-2 border-slate-100 bg-white text-ink hover:bg-slate-50'
        }`}
      >
        {checked ? (
          <>
            <span aria-hidden="true">✓ </span>On
          </>
        ) : (
          'Off'
        )}
      </button>
    </div>
  )
}

/** Choose-one buttons as native radios (arrow keys work), styled as a segmented row or a list. */
export function RadioGroup<T extends string>({
  legend,
  value,
  options,
  onChange,
  stacked = false,
}: {
  legend: string
  value: T
  options: { value: T; label: string; note?: string }[]
  onChange: (v: T) => void
  stacked?: boolean
}) {
  const name = useId()
  return (
    <fieldset>
      <legend className="font-semibold text-ink">{legend}</legend>
      <div className={`mt-2 ${stacked ? 'space-y-2' : 'flex flex-wrap gap-2'}`}>
        {options.map((o) => {
          const checked = value === o.value
          return (
            <label
              key={o.value}
              className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border-2 px-3 py-2 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-safety ${
                checked ? 'border-ink bg-slate-50' : 'border-slate-100 bg-white hover:bg-slate-50'
              }`}
            >
              <input type="radio" name={name} value={o.value} checked={checked} onChange={() => onChange(o.value)} className="h-5 w-5 shrink-0 accent-ink" />
              <span>
                <span className="font-semibold text-ink">{o.label}</span>
                {o.note && <span className="block text-sm text-slate">{o.note}</span>}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

/**
 * A percent with words and a mark, never color alone: "✓ 82%", "! 55%", "– not tried".
 * At or above the pass mark (70%) is ok.
 */
export function PctBadge({ pct, pass = 70, empty = 'not tried' }: { pct: number | null; pass?: number; empty?: string }) {
  if (pct === null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-1.5 py-0.5 text-sm font-semibold text-slate">
        <span aria-hidden="true">–</span> {empty}
      </span>
    )
  }
  const ok = pct >= pass
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-sm font-semibold tabular ${ok ? 'bg-ok-100 text-ok' : 'bg-bad-100 text-bad'}`}>
      <span aria-hidden="true">{ok ? '✓' : '!'}</span>
      {pct}%<span className="sr-only">{ok ? ', at or above the pass mark' : ', below the pass mark'}</span>
    </span>
  )
}

/** A horizontal bar with the pass mark drawn on it. The number is printed next to it by the caller. */
export function Meter({ pct, pass = 70 }: { pct: number | null; pass?: number }) {
  return (
    <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
      {pct !== null && <div className={`h-full ${pct >= pass ? 'bg-ok' : 'bg-copper'}`} style={{ width: `${Math.max(2, Math.min(100, pct))}%` }} />}
      <div className="absolute inset-y-0 w-0.5 bg-ink" style={{ left: `${pass}%` }} />
    </div>
  )
}

/** Minutes as "2 h 14 min" / "38 min" / "under a minute". */
export function fmtDuration(ms: number): string {
  const totalMin = Math.floor(Math.max(0, ms) / 60_000)
  if (totalMin < 1) return 'under a minute'
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

/** "about 2 minutes" style for short rounds: "45 seconds", "3 min 10 s". */
export function fmtShort(ms: number): string {
  const s = Math.round(Math.max(0, ms) / 1000)
  if (s < 60) return `${s} seconds`
  const m = Math.floor(s / 60)
  const r = s % 60
  return r ? `${m} min ${r} s` : `${m} min`
}

/** Short names for the blueprint areas, for chips and narrow tables. */
export const TOPIC_SHORT: Record<string, string> = {
  theory: 'Theory',
  'wiring-protection': 'Wiring & protection',
  'wiring-methods': 'Wiring methods',
  equipment: 'Equipment',
  'special-occupancies': 'Special occupancies',
  'special-equipment': 'Special equipment',
  'special-conditions': 'Special conditions',
  calculations: 'Calculations',
  'md-law': 'Maryland law',
}

export const MODE_LABEL: Record<'show' | 'coach' | 'paper' | 'test', string> = {
  show: 'Show me',
  coach: 'Coach me',
  paper: 'Paper',
  test: 'Test me',
}

export const LETTERS = ['A', 'B', 'C', 'D'] as const
