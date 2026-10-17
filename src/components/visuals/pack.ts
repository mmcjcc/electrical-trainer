/**
 * Simple circle packing for the conduit cross-section: N equal circles of radius r inside a circle
 * of radius R, on a hexagonal grid. If the grid cannot hold them all (a full 60% nipple, say), the
 * spacing tightens a little (circles may touch the wall or each other slightly): it is a picture,
 * not a pulling calculation. Pure.
 */
export interface Pt {
  x: number
  y: number
}

const SQRT3 = Math.sqrt(3)

function grid(n: number, R: number, r: number, spacing: number, ox: number, oy: number, limit: number): Pt[] {
  const d = 2 * r * spacing
  const h = (d * SQRT3) / 2
  const k = Math.ceil(R / Math.min(d, h)) + 2
  const pts: Pt[] = []
  for (let j = -k; j <= k; j++) {
    for (let i = -k; i <= k; i++) {
      const x = ox + i * d + (Math.abs(j) % 2 === 1 ? d / 2 : 0)
      const y = oy + j * h
      if (Math.hypot(x, y) <= limit + 1e-9) pts.push({ x, y })
    }
  }
  pts.sort((a, b) => Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y) || a.y - b.y || a.x - b.x)
  return pts.length > n ? pts.slice(0, n) : pts
}

/**
 * Circles of different sizes (a mix of wires): largest first, each at the first free spot on a
 * spiral out from the center. A circle with no free spot goes where it overlaps least.
 */
export function packMixed(radii: readonly number[], R: number): (Pt & { r: number })[] {
  const order = radii.map((r, i) => ({ r, i })).sort((a, b) => b.r - a.r || a.i - b.i)
  const placed: (Pt & { r: number; i: number })[] = []
  for (const { r, i } of order) {
    let best: Pt = { x: 0, y: 0 }
    let bestOverlap = Infinity
    const step = Math.max(r * 0.5, R / 100)
    for (let rad = 0; rad <= R - r + 1e-9 && bestOverlap > 0; rad += step) {
      const n = rad === 0 ? 1 : Math.ceil((2 * Math.PI * rad) / step)
      for (let k = 0; k < n; k++) {
        const a = (k / n) * 2 * Math.PI
        const x = rad * Math.cos(a)
        const y = rad * Math.sin(a)
        let overlap = 0
        for (const p of placed) overlap = Math.max(overlap, p.r + r - Math.hypot(p.x - x, p.y - y))
        if (overlap <= 1e-9) {
          best = { x, y }
          bestOverlap = 0
          break
        }
        if (overlap < bestOverlap) {
          bestOverlap = overlap
          best = { x, y }
        }
      }
    }
    placed.push({ ...best, r, i })
  }
  return placed.sort((a, b) => a.i - b.i).map(({ x, y, r }) => ({ x, y, r }))
}

export function packCircles(n: number, R: number, r: number): Pt[] {
  if (n <= 0 || r <= 0 || R <= 0) return []
  if (n === 1) return [{ x: 0, y: 0 }]
  let best: Pt[] = []
  for (let spacing = 1; spacing >= 0.7 - 1e-9; spacing -= 0.02) {
    const d = 2 * r * spacing
    const h = (d * SQRT3) / 2
    const limit = R - r * spacing
    for (const [ox, oy] of [[0, 0], [d / 2, 0], [0, h / 2], [d / 2, h / 2], [d / 4, h / 3]] as const) {
      const pts = grid(n, R, r, spacing, ox, oy, limit)
      if (pts.length >= n) return pts
      if (pts.length > best.length) best = pts
    }
  }
  return best
}
