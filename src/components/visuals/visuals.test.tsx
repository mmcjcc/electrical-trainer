// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { packCircles } from './pack'
import { RecipeVisual, hasVisual } from './RecipeVisual'

describe('circle packing', () => {
  it('places every wire inside the pipe without overlap at 40% fill', () => {
    for (const n of [3, 4, 7, 9, 16, 25, 40]) {
      const R = 88
      const r = R * Math.sqrt(0.4 / n)
      const pts = packCircles(n, R, r)
      expect(pts).toHaveLength(n)
      for (const p of pts) expect(Math.hypot(p.x, p.y) + r).toBeLessThanOrEqual(R + 1e-6)
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          expect(Math.hypot(pts[i]!.x - pts[j]!.x, pts[i]!.y - pts[j]!.y)).toBeGreaterThanOrEqual(2 * r - 1e-6)
        }
      }
    }
  })
  it('still draws them all for a full 60% nipple (spacing may tighten)', () => {
    const R = 88
    const pts = packCircles(12, R, R * Math.sqrt(0.6 / 12))
    expect(pts).toHaveLength(12)
  })
})

describe('recipe pictures', () => {
  it('raceway: the cross-section with a text alternative and the fill against the limit', () => {
    render(<RecipeVisual visual={{ kind: 'raceway', allowed: 0.213, wire: 0.0133, count: 16, fillPct: 40 }} />)
    expect(screen.getByRole('img', { name: 'Cross-section of the raceway with 16 wires' })).toBeInTheDocument()
    // 16 × 0.0133 = 0.2128 in²; the whole pipe is 0.213 ÷ 0.4 = 0.5325 in²; 0.2128 ÷ 0.5325 = 40.0%.
    expect(screen.getByText(/16 wires of 0.0133 in² each take 0.2128 in², 40% of the inside/)).toBeInTheDocument()
  })
  it('raceway, a mix of wires: every group drawn and named', () => {
    render(
      <RecipeVisual
        visual={{
          kind: 'raceway', allowed: 0.346, wire: 0.2533, fillPct: 40, mixed: true,
          groups: [
            { count: 3, size: '6', ins: 'THHN', area: 0.0507, total: 0.1521 },
            { count: 6, size: '12', ins: 'THHN', area: 0.0133, total: 0.0798 },
          ],
        }}
      />,
    )
    expect(screen.getByRole('img', { name: 'Cross-section of the raceway with 9 wires' })).toBeInTheDocument()
    expect(screen.getByText('3 × 6 AWG THHN')).toBeInTheDocument()
    expect(screen.getByText('6 × 12 AWG THHN')).toBeInTheDocument()
  })
  it('box, the box-fill recipe shape: allowances × volume per conductor', () => {
    render(
      <RecipeVisual
        visual={{
          kind: 'box', wireSize: '12',
          items: [
            { item: 'Conductors from outside', counts: 4 },
            { item: 'Devices (2 per yoke)', counts: 2 },
            { item: 'Pigtails (do not count)', counts: 0 },
          ],
          total: 6, perConductor: 2.25, need: 13.5, namedBox: '3 × 2 × 3-1/2 in. device box',
        }}
      />,
    )
    expect(screen.getByText('Devices (2 per yoke):')).toBeInTheDocument()
    expect(screen.getByText(/6 × 2.25 in³ = 13.5 in³/)).toBeInTheDocument()
    expect(screen.getByText(/3 × 2 × 3-1\/2 in. device box/)).toBeInTheDocument()
  })
  it('box: a row per counted item and the total against the box', () => {
    render(
      <RecipeVisual
        visual={{
          kind: 'box',
          items: [
            { label: '12 AWG conductors', count: 4, each: 2.25, volume: 9 },
            { label: 'Device (two for the yoke)', count: 2, each: 2.25, volume: 4.5 },
          ],
          total: 13.5,
          boxVolume: 18,
        }}
      />,
    )
    expect(screen.getByText('12 AWG conductors:')).toBeInTheDocument()
    expect(screen.getByText(/it fits/)).toBeInTheDocument()
  })
  it('load: stacked bars with a table of every bucket before and after', () => {
    render(
      <RecipeVisual
        visual={{
          kind: 'load',
          buckets: [
            { label: 'Lighting', before: 12000, after: 6150 },
            { label: 'Dryer', before: 5000, after: 5000 },
          ],
        }}
      />,
    )
    expect(screen.getByRole('img', { name: /Load before and after demand factors/ })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: '17,000 VA' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: '11,150 VA' })).toBeInTheDocument()
  })
  it('unknown kinds and bad data render nothing', () => {
    const { container } = render(
      <>
        <RecipeVisual visual={{ kind: 'mystery' }} />
        <RecipeVisual visual={{ kind: 'raceway', allowed: 'x' }} />
        <RecipeVisual />
      </>,
    )
    expect(container).toBeEmptyDOMElement()
    expect(hasVisual({ kind: 'mystery' })).toBe(false)
  })
})
