/**
 * The load calculation as stacked buckets, before and after the demand factors: how much each rule
 * takes off. The bar is decoration for the table under it, which carries every number.
 */
import { useId } from 'react'
import { fmtUnit, UNIT_TEXT } from '@/calc'
import type { Unit } from '@/shared/types'

export interface LoadBucket {
  label: string
  before: number
  after: number
}

export interface LoadData {
  kind: 'load'
  buckets: LoadBucket[]
  unit?: Unit
}

export function isLoadData(v: Record<string, unknown>): v is Record<string, unknown> & LoadData {
  if (v.kind !== 'load' || !Array.isArray(v.buckets) || v.buckets.length === 0) return false
  if (v.unit !== undefined && !(typeof v.unit === 'string' && v.unit in UNIT_TEXT)) return false
  return v.buckets.every(
    (b: unknown) =>
      typeof b === 'object' && b !== null && typeof (b as LoadBucket).label === 'string' &&
      typeof (b as LoadBucket).before === 'number' && typeof (b as LoadBucket).after === 'number',
  )
}

/** Fills cycle through the palette; the table and the order carry the meaning, not the color. */
const FILLS = ['fill-copper', 'fill-slate', 'fill-safety', 'fill-slate-600', 'fill-copper-700', 'fill-ok']
const SWATCH = ['bg-copper', 'bg-slate', 'bg-safety', 'bg-slate-600', 'bg-copper-700', 'bg-ok']

export function LoadVisual({ buckets, unit = 'VA' }: LoadData) {
  const titleId = useId()
  const descId = useId()
  const totalBefore = buckets.reduce((s, b) => s + Math.max(0, b.before), 0)
  const totalAfter = buckets.reduce((s, b) => s + Math.max(0, b.after), 0)
  const scale = 300 / Math.max(totalBefore, totalAfter, 1)
  const bar = (key: 'before' | 'after', y: number) => {
    let x = 0
    return buckets.map((b, i) => {
      const w = Math.max(0, b[key]) * scale
      const rect = (
        <g key={`${key}-${i}`}>
          <rect x={x} y={y} width={w} height="24" className={`${FILLS[i % FILLS.length]} stroke-white`} strokeWidth="1.5" />
          {w >= 16 && (
            <text x={x + w / 2} y={y + 16} textAnchor="middle" fontSize="11" fontWeight="700" className={i % FILLS.length === 2 ? 'fill-ink' : 'fill-white'}>
              {i + 1}
            </text>
          )}
        </g>
      )
      x += w
      return rect
    })
  }
  return (
    <figure className="rounded-2xl border border-slate-100 bg-white p-4">
      <p className="mb-2 font-semibold text-ink">The buckets before and after demand</p>
      <svg viewBox="0 0 300 104" className="w-full" role="img" aria-labelledby={`${titleId} ${descId}`}>
        <title id={titleId}>Load before and after demand factors</title>
        <desc id={descId}>{`Before demand ${fmtUnit(totalBefore, unit, 0)}; after demand ${fmtUnit(totalAfter, unit, 0)}.`}</desc>
        <text x="0" y="12" fontSize="11" fontWeight="700" className="fill-ink">Before demand</text>
        {bar('before', 18)}
        <text x="0" y="66" fontSize="11" fontWeight="700" className="fill-ink">After demand</text>
        {bar('after', 72)}
      </svg>
      <table className="tabular mt-3 w-full text-sm">
        <thead>
          <tr className="text-left text-slate">
            <th scope="col" className="py-1 font-semibold">Bucket</th>
            <th scope="col" className="py-1 text-right font-semibold">Before</th>
            <th scope="col" className="py-1 text-right font-semibold">After</th>
          </tr>
        </thead>
        <tbody>
          {buckets.map((b, i) => (
            <tr key={i} className="border-t border-slate-100">
              <td className="py-1 pr-2">
                <span aria-hidden="true" className={`mr-1.5 inline-block h-3 w-3 rounded-sm align-middle ${SWATCH[i % SWATCH.length]}`} />
                {i + 1}. {b.label}
              </td>
              <td className="py-1 text-right">{fmtUnit(b.before, unit, 0)}</td>
              <td className="py-1 text-right">{fmtUnit(b.after, unit, 0)}</td>
            </tr>
          ))}
          <tr className="border-t-2 border-ink font-bold">
            <td className="py-1">Total</td>
            <td className="py-1 text-right">{fmtUnit(totalBefore, unit, 0)}</td>
            <td className="py-1 text-right">{fmtUnit(totalAfter, unit, 0)}</td>
          </tr>
        </tbody>
      </table>
    </figure>
  )
}
