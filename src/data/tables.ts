/**
 * Numbers from the code book that the calculation generators need. Factual values only, entered by
 * hand for the problem types we generate; the app never displays a whole table (he looks the value
 * up in his own book, which is the exam skill). Every table here is checked against a second source
 * by src/data/tables.test.ts spot values and docs/reviews/tables-review.md.
 *
 * Values are the same in the 2020 and 2023 NEC unless a comment says otherwise. Section numbers are
 * NOT here; they live in data/refs.ts, per edition.
 */

// ---------------------------------------------------------------------------------------------
// Conductor sizes
// ---------------------------------------------------------------------------------------------

export const AWG_SIZES = [
  '14', '12', '10', '8', '6', '4', '3', '2', '1', '1/0', '2/0', '3/0', '4/0',
  '250', '300', '350', '400', '500', '600', '700', '750',
] as const
export type ConductorSize = (typeof AWG_SIZES)[number]

/** "12 AWG", "1/0 AWG", "250 kcmil". */
export function sizeLabel(size: ConductorSize): string {
  return Number(size) >= 250 ? `${size} kcmil` : `${size} AWG`
}

/** Chapter 9, Table 8: area in circular mils. */
export const CIRCULAR_MILS: Record<ConductorSize, number> = {
  '14': 4110, '12': 6530, '10': 10380, '8': 16510, '6': 26240, '4': 41740, '3': 52620, '2': 66360,
  '1': 83690, '1/0': 105600, '2/0': 133100, '3/0': 167800, '4/0': 211600,
  '250': 250000, '300': 300000, '350': 350000, '400': 400000, '500': 500000, '600': 600000,
  '700': 700000, '750': 750000,
}

// ---------------------------------------------------------------------------------------------
// Table 310.16: allowable ampacities, not more than three current-carrying conductors, 30°C ambient
// ---------------------------------------------------------------------------------------------

export type TempColumn = 60 | 75 | 90
export type Metal = 'cu' | 'al'

/** [60°C, 75°C, 90°C] ampacity by size. Aluminum starts at 12 AWG. */
export const AMPACITY: Record<Metal, Partial<Record<ConductorSize, [number, number, number]>>> = {
  cu: {
    '14': [15, 20, 25], '12': [20, 25, 30], '10': [30, 35, 40], '8': [40, 50, 55], '6': [55, 65, 75],
    '4': [70, 85, 95], '3': [85, 100, 115], '2': [95, 115, 130], '1': [110, 130, 145],
    '1/0': [125, 150, 170], '2/0': [145, 175, 195], '3/0': [165, 200, 225], '4/0': [195, 230, 260],
    '250': [215, 255, 290], '300': [240, 285, 320], '350': [260, 310, 350], '400': [280, 335, 380],
    '500': [320, 380, 430], '600': [350, 420, 475], '700': [385, 460, 520], '750': [400, 475, 535],
  },
  al: {
    '12': [15, 20, 25], '10': [25, 30, 35], '8': [35, 40, 45], '6': [40, 50, 55], '4': [55, 65, 75],
    '3': [65, 75, 85], '2': [75, 90, 100], '1': [85, 100, 115], '1/0': [100, 120, 135],
    '2/0': [115, 135, 150], '3/0': [130, 155, 175], '4/0': [150, 180, 205], '250': [170, 205, 230],
    '300': [195, 230, 260], '350': [210, 250, 280], '400': [225, 270, 305], '500': [260, 310, 350],
    '600': [285, 340, 385], '700': [315, 375, 425], '750': [320, 385, 435],
  },
}

export function ampacity(metal: Metal, size: ConductorSize, col: TempColumn): number {
  const row = AMPACITY[metal][size]
  if (!row) throw new Error(`no ${metal} ampacity for ${size}`)
  return row[col === 60 ? 0 : col === 75 ? 1 : 2]
}

/**
 * Ambient temperature correction factors based on 30°C (86°F). `null` where the table has a dash.
 * 2020: Table 310.15(B)(1). 2023: Table 310.15(B)(1)(1). Same values.
 */
export const TEMP_CORRECTION: { c: [number, number]; f: [number, number]; factor: [number | null, number | null, number] }[] = [
  { c: [-99, 10], f: [-99, 50], factor: [1.29, 1.2, 1.15] },
  { c: [11, 15], f: [51, 59], factor: [1.22, 1.15, 1.12] },
  { c: [16, 20], f: [60, 68], factor: [1.15, 1.11, 1.08] },
  { c: [21, 25], f: [69, 77], factor: [1.08, 1.05, 1.04] },
  { c: [26, 30], f: [78, 86], factor: [1.0, 1.0, 1.0] },
  { c: [31, 35], f: [87, 95], factor: [0.91, 0.94, 0.96] },
  { c: [36, 40], f: [96, 104], factor: [0.82, 0.88, 0.91] },
  { c: [41, 45], f: [105, 113], factor: [0.71, 0.82, 0.87] },
  { c: [46, 50], f: [114, 122], factor: [0.58, 0.75, 0.82] },
  { c: [51, 55], f: [123, 131], factor: [0.41, 0.67, 0.76] },
  { c: [56, 60], f: [132, 140], factor: [null, 0.58, 0.71] },
  { c: [61, 65], f: [141, 149], factor: [null, 0.47, 0.65] },
  { c: [66, 70], f: [150, 158], factor: [null, 0.33, 0.58] },
  { c: [71, 75], f: [159, 167], factor: [null, null, 0.5] },
  { c: [76, 80], f: [168, 176], factor: [null, null, 0.41] },
  { c: [81, 85], f: [177, 185], factor: [null, null, 0.29] },
]

export function tempCorrection(ambient: number, scale: 'C' | 'F', col: TempColumn): number {
  const row = TEMP_CORRECTION.find((r) => {
    const [lo, hi] = scale === 'C' ? r.c : r.f
    return ambient >= lo && ambient <= hi
  })
  const v = row?.factor[col === 60 ? 0 : col === 75 ? 1 : 2]
  if (v === undefined || v === null) throw new Error(`no correction factor for ${ambient}°${scale} at ${col}°C`)
  return v
}

/** Adjustment factors for more than three current-carrying conductors: Table 310.15(C)(1), percent. */
export const ADJUSTMENT: { from: number; to: number; pct: number }[] = [
  { from: 4, to: 6, pct: 80 },
  { from: 7, to: 9, pct: 70 },
  { from: 10, to: 20, pct: 50 },
  { from: 21, to: 30, pct: 45 },
  { from: 31, to: 40, pct: 40 },
  { from: 41, to: 9999, pct: 35 },
]

export function adjustmentPct(currentCarrying: number): number {
  if (currentCarrying <= 3) return 100
  const row = ADJUSTMENT.find((r) => currentCarrying >= r.from && currentCarrying <= r.to)
  if (!row) throw new Error(`no adjustment for ${currentCarrying}`)
  return row.pct
}

// ---------------------------------------------------------------------------------------------
// Chapter 9, Table 5: conductor area (in²) by insulation type
// ---------------------------------------------------------------------------------------------

export type Insulation = 'THHN' | 'THW' | 'XHHW'

/** THHN = THHN/THWN/THWN-2; THW = THW/THHW/THW-2 (and TW for 14-8); XHHW = XHHW/XHHW-2. */
export const CONDUCTOR_AREA: Record<Insulation, Partial<Record<ConductorSize, number>>> = {
  THHN: {
    '14': 0.0097, '12': 0.0133, '10': 0.0211, '8': 0.0366, '6': 0.0507, '4': 0.0824, '3': 0.0973,
    '2': 0.1158, '1': 0.1562, '1/0': 0.1855, '2/0': 0.2223, '3/0': 0.2679, '4/0': 0.3237,
    '250': 0.397, '300': 0.4608, '350': 0.5242, '400': 0.5863, '500': 0.7073, '600': 0.8676,
    '700': 0.9887, '750': 1.0496,
  },
  THW: {
    '14': 0.0139, '12': 0.0181, '10': 0.0243, '8': 0.0437, '6': 0.0726, '4': 0.0973, '3': 0.1134,
    '2': 0.1333, '1': 0.1901, '1/0': 0.2223, '2/0': 0.2624, '3/0': 0.3117, '4/0': 0.3718,
    '250': 0.4596, '300': 0.5281, '350': 0.5958, '400': 0.6619, '500': 0.7901,
  },
  XHHW: {
    '14': 0.0139, '12': 0.0181, '10': 0.0243, '8': 0.0437, '6': 0.059, '4': 0.0814, '3': 0.0962,
    '2': 0.1146, '1': 0.1534, '1/0': 0.1825, '2/0': 0.219, '3/0': 0.2642, '4/0': 0.3197,
    '250': 0.3904, '300': 0.4536, '350': 0.5166, '400': 0.5782, '500': 0.6984,
  },
}

export function conductorArea(ins: Insulation, size: ConductorSize): number {
  const v = CONDUCTOR_AREA[ins][size]
  if (v === undefined) throw new Error(`no area for ${size} ${ins}`)
  return v
}

// ---------------------------------------------------------------------------------------------
// Chapter 9, Table 4: raceway internal area (in²); the percent columns are total × percent,
// rounded to three decimals the way the table prints them.
// ---------------------------------------------------------------------------------------------

export const TRADE_SIZES = ['3/8', '1/2', '3/4', '1', '1-1/4', '1-1/2', '2', '2-1/2', '3', '3-1/2', '4'] as const
export type TradeSize = (typeof TRADE_SIZES)[number]

export type RacewayType = 'EMT' | 'IMC' | 'RMC' | 'PVC40' | 'PVC80' | 'FMC'

export const RACEWAY_NAME: Record<RacewayType, string> = {
  EMT: 'EMT (electrical metallic tubing)',
  IMC: 'IMC (intermediate metal conduit)',
  RMC: 'RMC (rigid metal conduit)',
  PVC40: 'Schedule 40 PVC',
  PVC80: 'Schedule 80 PVC',
  FMC: 'FMC (flexible metal conduit)',
}

/** 100% internal area by trade size. */
export const RACEWAY_TOTAL_AREA: Record<RacewayType, Partial<Record<TradeSize, number>>> = {
  EMT: { '1/2': 0.304, '3/4': 0.533, '1': 0.864, '1-1/4': 1.496, '1-1/2': 2.036, '2': 3.356, '2-1/2': 5.858, '3': 8.846, '3-1/2': 11.545, '4': 14.753 },
  IMC: { '1/2': 0.342, '3/4': 0.586, '1': 0.959, '1-1/4': 1.647, '1-1/2': 2.225, '2': 3.63, '2-1/2': 5.135, '3': 7.922, '3-1/2': 10.584, '4': 13.631 },
  RMC: { '1/2': 0.314, '3/4': 0.549, '1': 0.887, '1-1/4': 1.526, '1-1/2': 2.071, '2': 3.408, '2-1/2': 4.866, '3': 7.499, '3-1/2': 10.01, '4': 12.882 },
  PVC40: { '1/2': 0.285, '3/4': 0.508, '1': 0.832, '1-1/4': 1.453, '1-1/2': 1.986, '2': 3.291, '2-1/2': 4.695, '3': 7.268, '3-1/2': 9.737, '4': 12.554 },
  PVC80: { '1/2': 0.217, '3/4': 0.409, '1': 0.688, '1-1/4': 1.237, '1-1/2': 1.711, '2': 2.874, '2-1/2': 4.119, '3': 6.442, '3-1/2': 8.688, '4': 11.258 },
  FMC: { '3/8': 0.116, '1/2': 0.317, '3/4': 0.533, '1': 0.817, '1-1/4': 1.277, '1-1/2': 1.858, '2': 3.269, '2-1/2': 4.909, '3': 7.069, '3-1/2': 9.621, '4': 12.566 },
}

/** Chapter 9 Table 1 fill percent: 1 wire 53, 2 wires 31, over 2 wires 40; Note 4: nipples ≤ 24 in. 60. */
export type FillCase = 'one' | 'two' | 'over2' | 'nipple'
export const FILL_PCT: Record<FillCase, number> = { one: 53, two: 31, over2: 40, nipple: 60 }

export function fillCaseFor(count: number, nipple = false): FillCase {
  if (nipple) return 'nipple'
  return count === 1 ? 'one' : count === 2 ? 'two' : 'over2'
}

/** The Table 4 column value: total × percent, rounded to 3 decimals as printed. */
export function racewayArea(type: RacewayType, size: TradeSize, fill: FillCase): number {
  const total = RACEWAY_TOTAL_AREA[type][size]
  if (total === undefined) throw new Error(`no ${type} in ${size}`)
  return Math.round(total * FILL_PCT[fill] * 10) / 1000
}

export function racewaySizes(type: RacewayType): TradeSize[] {
  return TRADE_SIZES.filter((s) => RACEWAY_TOTAL_AREA[type][s] !== undefined)
}

/** "3/4 in." ("trade size 3/4"). */
export function tradeLabel(size: TradeSize): string {
  return `${size} in.`
}

// ---------------------------------------------------------------------------------------------
// 314.16: box fill
// ---------------------------------------------------------------------------------------------

/** Table 314.16(B): volume allowance per conductor (in³). */
export const BOX_VOLUME_PER_CONDUCTOR: Partial<Record<'18' | '16' | ConductorSize, number>> = {
  '18': 1.5, '16': 1.75, '14': 2.0, '12': 2.25, '10': 2.5, '8': 3.0, '6': 5.0,
}

export interface StandardBox {
  id: string
  /** "4 in. square × 1-1/2 in." */
  label: string
  kind: 'round' | 'square' | 'device' | 'masonry'
  volume: number
}

/** Table 314.16(A): metal boxes (minimum volume, in³), the common ones used in problems. */
export const STANDARD_BOXES: StandardBox[] = [
  { id: 'dev-3x2x1.5', label: '3 × 2 × 1-1/2 in. device box', kind: 'device', volume: 7.5 },
  { id: 'dev-3x2x2', label: '3 × 2 × 2 in. device box', kind: 'device', volume: 10.0 },
  { id: 'dev-3x2x2.25', label: '3 × 2 × 2-1/4 in. device box', kind: 'device', volume: 10.5 },
  { id: 'dev-3x2x2.5', label: '3 × 2 × 2-1/2 in. device box', kind: 'device', volume: 12.5 },
  { id: 'dev-3x2x2.75', label: '3 × 2 × 2-3/4 in. device box', kind: 'device', volume: 14.0 },
  { id: 'dev-3x2x3.5', label: '3 × 2 × 3-1/2 in. device box', kind: 'device', volume: 18.0 },
  { id: 'rnd-4x1.25', label: '4 in. round/octagonal × 1-1/4 in.', kind: 'round', volume: 12.5 },
  { id: 'rnd-4x1.5', label: '4 in. round/octagonal × 1-1/2 in.', kind: 'round', volume: 15.5 },
  { id: 'rnd-4x2.125', label: '4 in. round/octagonal × 2-1/8 in.', kind: 'round', volume: 21.5 },
  { id: 'sq-4x1.25', label: '4 in. square × 1-1/4 in.', kind: 'square', volume: 18.0 },
  { id: 'sq-4x1.5', label: '4 in. square × 1-1/2 in.', kind: 'square', volume: 21.0 },
  { id: 'sq-4x2.125', label: '4 in. square × 2-1/8 in.', kind: 'square', volume: 30.3 },
  { id: 'sq-411x1.25', label: '4-11/16 in. square × 1-1/4 in.', kind: 'square', volume: 25.5 },
  { id: 'sq-411x1.5', label: '4-11/16 in. square × 1-1/2 in.', kind: 'square', volume: 29.5 },
  { id: 'sq-411x2.125', label: '4-11/16 in. square × 2-1/8 in.', kind: 'square', volume: 42.0 },
]

// ---------------------------------------------------------------------------------------------
// Article 430: motor full-load current (use these, not the nameplate, for conductors and OCPD)
// ---------------------------------------------------------------------------------------------

export const HP_SIZES_3PH = ['1/2', '3/4', '1', '1-1/2', '2', '3', '5', '7-1/2', '10', '15', '20', '25', '30', '40', '50', '60', '75', '100', '125', '150', '200'] as const
export type Hp3 = (typeof HP_SIZES_3PH)[number]
export type Volts3 = 200 | 208 | 230 | 460 | 575

/** Table 430.250: three-phase AC induction motors, FLC in amperes. 115 V column omitted. */
export const FLC_3PH: Record<Hp3, Record<Volts3, number>> = {
  '1/2': { 200: 2.5, 208: 2.4, 230: 2.2, 460: 1.1, 575: 0.9 },
  '3/4': { 200: 3.7, 208: 3.5, 230: 3.2, 460: 1.6, 575: 1.3 },
  '1': { 200: 4.8, 208: 4.6, 230: 4.2, 460: 2.1, 575: 1.7 },
  '1-1/2': { 200: 6.9, 208: 6.6, 230: 6.0, 460: 3.0, 575: 2.4 },
  '2': { 200: 7.8, 208: 7.5, 230: 6.8, 460: 3.4, 575: 2.7 },
  '3': { 200: 11.0, 208: 10.6, 230: 9.6, 460: 4.8, 575: 3.9 },
  '5': { 200: 17.5, 208: 16.7, 230: 15.2, 460: 7.6, 575: 6.1 },
  '7-1/2': { 200: 25.3, 208: 24.2, 230: 22, 460: 11, 575: 9 },
  '10': { 200: 32.2, 208: 30.8, 230: 28, 460: 14, 575: 11 },
  '15': { 200: 48.3, 208: 46.2, 230: 42, 460: 21, 575: 17 },
  '20': { 200: 62.1, 208: 59.4, 230: 54, 460: 27, 575: 22 },
  '25': { 200: 78.2, 208: 74.8, 230: 68, 460: 34, 575: 27 },
  '30': { 200: 92, 208: 88, 230: 80, 460: 40, 575: 32 },
  '40': { 200: 120, 208: 114, 230: 104, 460: 52, 575: 41 },
  '50': { 200: 150, 208: 143, 230: 130, 460: 65, 575: 52 },
  '60': { 200: 177, 208: 169, 230: 154, 460: 77, 575: 62 },
  '75': { 200: 221, 208: 211, 230: 192, 460: 96, 575: 77 },
  '100': { 200: 285, 208: 273, 230: 248, 460: 124, 575: 99 },
  '125': { 200: 359, 208: 343, 230: 312, 460: 156, 575: 125 },
  '150': { 200: 414, 208: 396, 230: 360, 460: 180, 575: 144 },
  '200': { 200: 552, 208: 528, 230: 480, 460: 240, 575: 192 },
}

export const HP_SIZES_1PH = ['1/6', '1/4', '1/3', '1/2', '3/4', '1', '1-1/2', '2', '3', '5', '7-1/2', '10'] as const
export type Hp1 = (typeof HP_SIZES_1PH)[number]
export type Volts1 = 115 | 200 | 208 | 230

/** Table 430.248: single-phase AC motors, FLC in amperes. */
export const FLC_1PH: Record<Hp1, Record<Volts1, number>> = {
  '1/6': { 115: 4.4, 200: 2.5, 208: 2.4, 230: 2.2 },
  '1/4': { 115: 5.8, 200: 3.3, 208: 3.2, 230: 2.9 },
  '1/3': { 115: 7.2, 200: 4.1, 208: 4.0, 230: 3.6 },
  '1/2': { 115: 9.8, 200: 5.6, 208: 5.4, 230: 4.9 },
  '3/4': { 115: 13.8, 200: 7.9, 208: 7.6, 230: 6.9 },
  '1': { 115: 16, 200: 9.2, 208: 8.8, 230: 8 },
  '1-1/2': { 115: 20, 200: 11.5, 208: 11, 230: 10 },
  '2': { 115: 24, 200: 13.8, 208: 13.2, 230: 12 },
  '3': { 115: 34, 200: 19.6, 208: 18.7, 230: 17 },
  '5': { 115: 56, 200: 32.2, 208: 30.8, 230: 28 },
  '7-1/2': { 115: 80, 200: 46, 208: 44, 230: 40 },
  '10': { 115: 100, 200: 57.5, 208: 55, 230: 50 },
}

export type OcpdType = 'nontime-fuse' | 'dual-element-fuse' | 'instantaneous-cb' | 'inverse-time-cb'
export const OCPD_NAME: Record<OcpdType, string> = {
  'nontime-fuse': 'nontime-delay fuse',
  'dual-element-fuse': 'dual-element (time-delay) fuse',
  'instantaneous-cb': 'instantaneous-trip breaker',
  'inverse-time-cb': 'inverse-time breaker',
}

/**
 * Maximum rating of motor branch-circuit short-circuit and ground-fault protection, percent of FLC,
 * for single-phase and squirrel-cage polyphase motors other than Design B energy-efficient
 * (2020: Table 430.52; 2023: Table 430.52(C)(1)).
 */
export const MOTOR_OCPD_PCT: Record<OcpdType, number> = {
  'nontime-fuse': 300,
  'dual-element-fuse': 175,
  'instantaneous-cb': 800,
  'inverse-time-cb': 250,
}

// ---------------------------------------------------------------------------------------------
// Article 220 demand factors (values; locations in data/refs.ts)
// ---------------------------------------------------------------------------------------------

export const DWELLING = {
  /** General lighting unit load, VA per ft². */
  lightingVAperFt2: 3,
  smallApplianceVA: 1500,
  laundryVA: 1500,
  /** Dryer: 5,000 VA or the nameplate, whichever is larger. */
  dryerMinVA: 5000,
  /** Lighting demand: first 3,000 VA at 100%, 3,001-120,000 at 35%, the rest at 25%. */
  lightingDemand: [
    { upTo: 3000, pct: 100 },
    { upTo: 120000, pct: 35 },
    { upTo: Infinity, pct: 25 },
  ],
  /** Fastened-in-place appliances (not range, dryer, space heating, A/C): 75% when four or more. */
  appliancePct4OrMore: 75,
  /** Optional method 220.82(B): first 10 kVA at 100%, remainder at 40%. */
  optionalFirstVA: 10000,
  optionalRemainderPct: 40,
} as const

/** Table 220.55 Column C: maximum demand (kW) for N ranges, each not over 12 kW. N = 1..25. */
export const RANGE_COL_C_KW = [8, 11, 14, 17, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40]

/** Column C for any count (26 and over follow the table's "kW + kW per range" rows). */
export function rangeColumnC(n: number): number {
  if (n < 1) throw new Error('need at least one range')
  if (n <= 25) return RANGE_COL_C_KW[n - 1] as number
  if (n <= 40) return 15 + n
  return 25 + 0.75 * n
}

/** Table 220.55 Column A (less than 3.5 kW) and Column B (3.5-8.75 kW), percent, N = 1..25. */
export const RANGE_COL_A_PCT = [80, 75, 70, 66, 62, 59, 56, 53, 51, 49, 47, 45, 43, 41, 40, 39, 38, 37, 36, 35, 34, 33, 32, 31, 30]
export const RANGE_COL_B_PCT = [80, 65, 55, 50, 45, 43, 40, 36, 35, 34, 32, 32, 32, 32, 32, 28, 28, 28, 28, 28, 26, 26, 26, 26, 26]

/** Table 220.54: household dryer demand percent for N dryers. */
export function dryerDemandPct(n: number): number {
  if (n <= 4) return 100
  const fixed: Record<number, number> = { 5: 85, 6: 75, 7: 65, 8: 60, 9: 55, 10: 50, 11: 47 }
  if (n <= 11) return fixed[n] as number
  if (n <= 23) return 47 - (n - 11)
  if (n <= 42) return 35 - 0.5 * (n - 23)
  return 25
}

/** Table 220.56: commercial kitchen equipment demand percent for N units. */
export function kitchenDemandPct(n: number): number {
  if (n <= 2) return 100
  if (n === 3) return 90
  if (n === 4) return 80
  if (n === 5) return 70
  return 65
}

/** Table 220.84: multifamily optional method demand percent for N dwelling units (3 or more). */
export function multifamilyOptionalPct(n: number): number {
  const rows: [number, number, number][] = [
    [3, 5, 45], [6, 7, 44], [8, 10, 43], [11, 11, 42], [12, 13, 41], [14, 15, 40], [16, 17, 39],
    [18, 20, 38], [21, 21, 37], [22, 23, 36], [24, 25, 35], [26, 27, 34], [28, 30, 33], [31, 31, 32],
    [32, 33, 31], [34, 36, 30], [37, 38, 29], [39, 42, 28], [43, 45, 27], [46, 50, 26], [51, 55, 25],
    [56, 61, 24], [62, 99999, 23],
  ]
  const row = rows.find(([lo, hi]) => n >= lo && n <= hi)
  if (!row) throw new Error(`Table 220.84 starts at 3 units, got ${n}`)
  return row[2]
}

/** Non-dwelling receptacles: first 10 kVA at 100%, remainder at 50%. 180 VA per yoke. */
export const COMMERCIAL = {
  receptacleVA: 180,
  receptacleFirstVA: 10000,
  receptacleRemainderPct: 50,
  showWindowVAperFt: 200,
  signOutletVA: 1200,
  continuousPct: 125,
} as const

// ---------------------------------------------------------------------------------------------
// Voltage drop and the three-phase constant
// ---------------------------------------------------------------------------------------------

/** K: ohms per circular-mil foot, the values exam courses use. */
export const K_FACTOR: Record<Metal, number> = { cu: 12.9, al: 21.2 }
export const SQRT3 = 1.732

// ---------------------------------------------------------------------------------------------
// Article 450: transformer overcurrent protection, 1000 V and less (Table 450.3(B))
// ---------------------------------------------------------------------------------------------

/** Primary-only protection, percent of rated primary current, by current band. */
export function transformerPrimaryOnlyPct(primaryAmps: number): { pct: number; nextSizeUp: boolean } {
  if (primaryAmps >= 9) return { pct: 125, nextSizeUp: true }
  if (primaryAmps >= 2) return { pct: 167, nextSizeUp: false }
  return { pct: 300, nextSizeUp: false }
}
