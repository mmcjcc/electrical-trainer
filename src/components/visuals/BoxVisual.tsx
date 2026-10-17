/**
 * Box fill: every counted item as a tile (a conductor, a device's two, the clamps' one), each row
 * with its arithmetic, then the total against the box. Text in the rows; the tiles are decoration.
 *
 * Accepts two data shapes: the brief's `{ items: {label, count, each, volume}[], total, boxVolume? }`
 * (total in in³) and the box-fill recipe's `{ items: {item, counts}[], perConductor, total, need,
 * namedBox? }` (total in allowances, need in in³).
 */
import { fmt, fmtUnit } from '@/calc'

interface Row {
  label: string
  count: number
  each?: number
  volume?: number
}

export interface BoxModel {
  rows: Row[]
  /** Allowances counted (when the data gives them separately from the volume). */
  totalCount?: number
  each?: number
  totalVolume?: number
  boxVolume?: number
  boxLabel?: string
}

const num = (x: unknown): number | undefined => (typeof x === 'number' && Number.isFinite(x) ? x : undefined)
const str = (x: unknown): string | undefined => (typeof x === 'string' && x.length > 0 ? x : undefined)

/** Reads either shape; null when it is not box data. */
export function boxModel(v: Record<string, unknown>): BoxModel | null {
  if (v.kind !== 'box' || !Array.isArray(v.items)) return null
  const per = num(v.perConductor)
  const rows: Row[] = []
  for (const raw of v.items as unknown[]) {
    if (typeof raw !== 'object' || raw === null) return null
    const it = raw as Record<string, unknown>
    const label = str(it.label) ?? str(it.item)
    const count = num(it.count) ?? num(it.counts)
    if (label === undefined || count === undefined) return null
    const each = num(it.each) ?? per
    const volume = num(it.volume) ?? (each !== undefined ? count * each : undefined)
    rows.push({ label, count, each, volume })
  }
  const need = num(v.need)
  const total = num(v.total)
  return need !== undefined
    ? { rows, totalCount: total, each: per, totalVolume: need, boxVolume: num(v.boxVolume), boxLabel: str(v.namedBox) }
    : { rows, totalVolume: total, boxVolume: num(v.boxVolume), boxLabel: str(v.namedBox) }
}

const MAX_TILES = 24

export function BoxVisual({ model }: { model: BoxModel }) {
  const { rows, totalCount, each, totalVolume, boxVolume, boxLabel } = model
  const fits = boxVolume === undefined || totalVolume === undefined ? undefined : totalVolume <= boxVolume + 1e-9
  return (
    <figure className="rounded-2xl border border-slate-100 bg-white p-4">
      <p className="mb-2 font-semibold text-ink">What counts in the box</p>
      <ul className="space-y-3">
        {rows.map((it, i) => {
          const whole = Math.min(MAX_TILES, Math.floor(it.count + 1e-9))
          const part = it.count - Math.floor(it.count + 1e-9)
          return (
            <li key={i}>
              <p className="tabular text-sm text-ink">
                <span className="font-semibold">{it.label}:</span>{' '}
                {it.each !== undefined && it.volume !== undefined
                  ? `${fmt(it.count)} × ${fmtUnit(it.each, 'in3')} = ${fmtUnit(it.volume, 'in3')}`
                  : fmt(it.count)}
              </p>
              <div className="mt-1 flex min-h-6 flex-wrap gap-1" aria-hidden="true">
                {Array.from({ length: whole }, (_, k) => (
                  <span key={k} className="h-6 w-6 rounded border-2 border-copper bg-copper-100" />
                ))}
                {part > 1e-9 && (
                  <span className="h-6 rounded border-2 border-copper bg-copper-100" style={{ width: `${Math.max(0.25, part) * 1.5}rem` }} />
                )}
                {it.count > MAX_TILES && <span className="text-sm text-slate">…</span>}
                {it.count === 0 && <span className="text-sm text-slate">none</span>}
              </div>
            </li>
          )
        })}
      </ul>
      <div className="tabular mt-3 space-y-1 border-t border-slate-100 pt-2 text-ink">
        {totalCount !== undefined && (
          <p>
            <span className="font-semibold">Counted:</span> {fmt(totalCount)}
            {each !== undefined && totalVolume !== undefined && ` × ${fmtUnit(each, 'in3')} = ${fmtUnit(totalVolume, 'in3')}`}
          </p>
        )}
        {totalCount === undefined && totalVolume !== undefined && (
          <p>
            <span className="font-semibold">Total:</span> {fmtUnit(totalVolume, 'in3')}
          </p>
        )}
        {(boxVolume !== undefined || boxLabel) && (
          <p>
            <span className="font-semibold">The box:</span> {boxLabel ?? ''}
            {boxVolume !== undefined && ` ${boxLabel ? '(' : ''}${fmtUnit(boxVolume, 'in3')}${boxLabel ? ')' : ''}`}{' '}
            {fits === true && (
              <span className="text-ok">
                <span aria-hidden="true">✓ </span>it fits
              </span>
            )}
            {fits === false && (
              <span className="text-bad">
                <span aria-hidden="true">✗ </span>too small
              </span>
            )}
          </p>
        )}
      </div>
    </figure>
  )
}
