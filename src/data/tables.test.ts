import { describe, expect, it } from 'vitest'
import {
  RACEWAY_ID, RACEWAY_TOTAL_AREA, racewayArea, racewayTotal, conductorArea, ampacity, tempCorrection,
  adjustmentPct, rangeColumnC, dryerDemandPct, multifamilyOptionalPct, kitchenDemandPct, FLC_3PH, FLC_1PH,
  type RacewayType, type TradeSize,
} from './tables'

describe('Chapter 9 Table 4', () => {
  it('internal diameters reproduce every printed total area to the third decimal (±0.001)', () => {
    // The printed table is not a pure rounding of π/4 × ID² (IMC 2 in. computes 3.6305, printed 3.630),
    // which is why lookups accept ±0.001 (TABLE4_TOL) and generators avoid answers that hinge on it.
    for (const type of Object.keys(RACEWAY_ID) as RacewayType[]) {
      for (const [size, total] of Object.entries(RACEWAY_TOTAL_AREA[type])) {
        expect(Math.abs(racewayTotal(type, size as TradeSize) - (total as number)), `${type} ${size}`).toBeLessThanOrEqual(0.0011)
      }
    }
  })
  it('percent columns match printed values checked by hand', () => {
    expect(racewayArea('EMT', '1/2', 'over2')).toBe(0.122)
    expect(racewayArea('EMT', '3/4', 'over2')).toBe(0.213)
    expect(racewayArea('EMT', '1', 'over2')).toBe(0.346)
    expect(racewayArea('RMC', '1/2', 'over2')).toBe(0.125)
    expect(racewayArea('EMT', '3/4', 'one')).toBe(0.283)
  })
})

describe('spot values', () => {
  it('Table 5', () => {
    expect(conductorArea('THHN', '12')).toBe(0.0133)
    expect(conductorArea('THW', '12')).toBe(0.026)
    expect(conductorArea('TW', '12')).toBe(0.0181)
    expect(conductorArea('XHHW', '6')).toBe(0.059)
  })
  it('Table 310.16 and its factors', () => {
    expect(ampacity('cu', '3/0', 75)).toBe(200)
    expect(ampacity('al', '4/0', 75)).toBe(180)
    expect(ampacity('cu', '12', 90)).toBe(30)
    expect(tempCorrection(40, 'C', 90)).toBe(0.91)
    expect(tempCorrection(104, 'F', 75)).toBe(0.88)
    expect(adjustmentPct(3)).toBe(100)
    expect(adjustmentPct(6)).toBe(80)
    expect(adjustmentPct(9)).toBe(70)
    expect(adjustmentPct(20)).toBe(50)
  })
  it('Article 220 tables', () => {
    expect(rangeColumnC(1)).toBe(8)
    expect(rangeColumnC(5)).toBe(20)
    expect(rangeColumnC(30)).toBe(45)
    expect(rangeColumnC(41)).toBeCloseTo(55.75)
    expect(dryerDemandPct(5)).toBe(85)
    expect(dryerDemandPct(12)).toBe(46)
    expect(dryerDemandPct(24)).toBe(34.5)
    expect(multifamilyOptionalPct(10)).toBe(43)
    expect(kitchenDemandPct(6)).toBe(65)
  })
  it('motor FLC', () => {
    expect(FLC_3PH['10'][460]).toBe(14)
    expect(FLC_3PH['25'][208]).toBe(74.8)
    expect(FLC_1PH['5'][230]).toBe(28)
  })
})
