/**
 * The conduit cross-section: the wires as circles sized by their area, and a fill gauge to the
 * percent line (40% for over two wires, 60% for a short nipple). Text alternative in the caption.
 *
 * Two data shapes: same-size `{ allowed, wire, count, fillPct }` (wire = one conductor's area) and
 * the mixed-fill recipe's `{ allowed, wire, fillPct, mixed: true, groups: {count, area, size?, ins?}[] }`
 * (wire = all the conductors' area together).
 */
import { useId, useMemo } from 'react'
import { fmt } from '@/calc'
import { packCircles, packMixed } from './pack'

interface Group {
  count: number
  area: number
  name?: string
}

export interface RacewayModel {
  allowed: number
  fillPct: number
  groups: Group[]
}

const pos = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x > 0

/** Reads either shape; null when it is not raceway data. */
export function racewayModel(v: Record<string, unknown>): RacewayModel | null {
  if (v.kind !== 'raceway' || !pos(v.allowed) || !pos(v.fillPct) || v.fillPct > 100) return null
  if (Array.isArray(v.groups) && v.groups.length > 0) {
    const groups: Group[] = []
    for (const raw of v.groups as unknown[]) {
      if (typeof raw !== 'object' || raw === null) return null
      const g = raw as Record<string, unknown>
      if (!pos(g.count) || !pos(g.area)) return null
      const name = [typeof g.size === 'string' ? `${g.size} AWG` : '', typeof g.ins === 'string' ? g.ins : ''].filter(Boolean).join(' ')
      groups.push({ count: Math.round(g.count), area: g.area, name: name || undefined })
    }
    return { allowed: v.allowed, fillPct: v.fillPct, groups }
  }
  if (!pos(v.wire) || !pos(v.count)) return null
  return { allowed: v.allowed, fillPct: v.fillPct, groups: [{ count: Math.round(v.count), area: v.wire }] }
}

const R = 88
const MAX_DRAWN = 200
/** Group fills (the legend names each group; colour is not the only signal). */
const FILLS = ['fill-copper-100', 'fill-safety-100', 'fill-slate-100', 'fill-ok-100']
const CORES = ['fill-copper', 'fill-copper-700', 'fill-slate-600', 'fill-ok']

export function RacewayVisual({ model }: { model: RacewayModel }) {
  const titleId = useId()
  const { allowed, fillPct, groups } = model
  const total = allowed / (fillPct / 100)
  const count = groups.reduce((s, g) => s + g.count, 0)
  const usedArea = groups.reduce((s, g) => s + g.count * g.area, 0)
  const used = (usedArea / total) * 100
  const over = used > fillPct + 1e-9
  const same = groups.length === 1

  const circles = useMemo(() => {
    if (same) {
      const g = groups[0]!
      const r = R * Math.sqrt(g.area / total)
      return packCircles(Math.min(g.count, MAX_DRAWN), R, r).map((p) => ({ ...p, r, group: 0 }))
    }
    const radii: { r: number; group: number }[] = []
    groups.forEach((g, gi) => {
      for (let k = 0; k < g.count && radii.length < MAX_DRAWN; k++) radii.push({ r: R * Math.sqrt(g.area / total), group: gi })
    })
    return packMixed(radii.map((x) => x.r), R).map((p, i) => ({ ...p, group: radii[i]!.group }))
  }, [same, groups, total])

  const wiresText = same
    ? `${count} wires of ${fmt(groups[0]!.area)} in² each take ${fmt(usedArea, 4)} in²`
    : `${groups.map((g) => `${g.count} × ${g.name ?? 'wire'} (${fmt(g.area)} in² each)`).join(', ')} take ${fmt(usedArea, 4)} in²`
  const caption =
    `${wiresText}, ${fmt(used, 1)}% of the inside of the pipe. The limit is ${fmt(fillPct)}% (${fmt(allowed, 4)} in²).` +
    (over && same ? ' The last wire goes a little past the line: Note 7 allows that when the count came out at .8 or more.' : '')

  return (
    <figure className="rounded-2xl border border-slate-100 bg-white p-4">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
        <svg viewBox="-100 -100 200 200" className="h-48 w-48 shrink-0" role="img" aria-labelledby={titleId}>
          <title id={titleId}>{`Cross-section of the raceway with ${count} wires`}</title>
          <circle cx="0" cy="0" r={R + 6} className="fill-slate-100" />
          <circle cx="0" cy="0" r={R} className="fill-white stroke-slate" strokeWidth="3" />
          {circles.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={p.r} className={`${FILLS[p.group % FILLS.length]} stroke-copper-700`} strokeWidth={Math.max(0.6, p.r * 0.08)} />
              <circle cx={p.x} cy={p.y} r={p.r * 0.5} className={CORES[p.group % CORES.length]} />
            </g>
          ))}
        </svg>
        <div className="w-full min-w-0 flex-1">
          <p className="mb-1 text-sm font-semibold text-ink">How full the pipe is</p>
          <svg viewBox="0 0 300 46" className="w-full" aria-hidden="true">
            <rect x="0" y="16" width="300" height="18" rx="4" className="fill-slate-100" />
            <rect x="0" y="16" width={Math.min(300, (used / 100) * 300)} height="18" rx="4" className="fill-copper" />
            <line x1={(fillPct / 100) * 300} x2={(fillPct / 100) * 300} y1="10" y2="40" className="stroke-ink" strokeWidth="2.5" strokeDasharray="4 2" />
            <text x={(fillPct / 100) * 300} y="9" textAnchor="middle" className="fill-ink" fontSize="10" fontWeight="700">
              {`limit ${fmt(fillPct)}%`}
            </text>
          </svg>
          <p className="tabular text-sm text-ink">
            <span className="font-semibold">Used {fmt(used, 1)}%</span> of the pipe; limit {fmt(fillPct)}%.
          </p>
          {!same && (
            <ul className="mt-2 space-y-1 text-sm text-ink">
              {groups.map((g, gi) => (
                <li key={gi} className="flex items-center gap-2">
                  <svg viewBox="-10 -10 20 20" className="h-4 w-4 shrink-0" aria-hidden="true">
                    <circle r="9" className={`${FILLS[gi % FILLS.length]} stroke-copper-700`} strokeWidth="1.5" />
                    <circle r="4.5" className={CORES[gi % CORES.length]} />
                  </svg>
                  <span className="tabular">
                    {g.count} × {g.name ?? 'wire'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <figcaption className="mt-3 text-sm text-slate">{caption}</figcaption>
    </figure>
  )
}
