/**
 * Load-calculation values and locations the dwelling and commercial recipes need that are not in
 * tables.ts or refs.ts (owned by the load-calculation recipes builder). 2020 NEC; factual values
 * only. Sources: docs/research/annex-d-methods.md (NFPA committee records for the 2020 text) unless a
 * comment says otherwise. Locations are given for 2020; the recipes are 2020-only.
 */
import type { CodeRef } from '@/shared/types'

// ---------------------------------------------------------------------------------------------
// Values
// ---------------------------------------------------------------------------------------------

export const LOAD = {
  /** 210.11(C)(1): at least two 20-A small-appliance branch circuits in a dwelling unit. */
  minSmallApplianceCircuits: 2,
  /** Table 220.42: the first block at 100% (dwelling lighting, small-appliance and laundry). */
  lightingFirstVA: 3000,
  /** Table 220.42: 3,001 to 120,000 VA at 35%. */
  lightingSecondPct: 35,
  lightingSecondUpToVA: 120000,
  /** Table 220.55 Column C: one range not over 12 kW = 8 kW; Note 1 starts above 12 kW. */
  rangeColCMaxKW: 12,
  /** Table 220.55 Note 1: 5% more for each kW (or major fraction) over 12 kW, up to 27 kW. */
  rangeNote1PctPerKW: 5,
  rangeNote1MaxKW: 27,
  /** Table 220.55: Column B covers 3.5 to 8.75 kW; Note 2 averages unequal ranges over 8.75 kW. */
  rangeColBMaxKW: 8.75,
  /** Table 220.55 Column B, one appliance (only used to name the "wrong column" slip). */
  rangeColBOnePct: 80,
  /**
   * 220.53 (2020): 75% for four or more fastened-in-place appliances rated 1/4 hp or more, or 500 W or
   * more (the rating threshold is new in 2020). Not ranges or other cooking, dryers, space heating, A/C.
   */
  appliance75MinCount: 4,
  /** 220.50 -> 430.24: the largest motor counts at 125%, so 25% of it is added on top. */
  largestMotorExtraPct: 25,
  /** 220.61(B)(1): range, oven, cooktop and dryer demand may be taken at 70% on the neutral. */
  neutralCookingDryerPct: 70,
  /** 220.61(B)(2): the part of the neutral load over 200 A may be taken at 70%. */
  neutralStepAmps: 200,
  neutralOverStepPct: 70,
  /** 230.79(C): one-family dwelling service disconnecting means not less than 100 A. */
  minServiceOneFamilyA: 100,
  /** 220.82(C) selections (one dwelling, optional method). */
  optAcPct: 100,
  optHeatPumpPct: 100,
  optSupplementalPct: 65,
  optHeatFewUnitsPct: 65,
  optHeatManyUnitsPct: 40,
  /** 220.82(C): "four or more separately controlled units" is the 40% case. */
  optHeatManyUnits: 4,
  /** 220.84(A): the multifamily optional method needs three or more dwelling units. */
  multifamilyMinUnits: 3,
  /** Table 220.56: three or more units get a demand factor; never less than the two largest together. */
  kitchenMinUnits: 3,
  /** 220.14(K): banks and office buildings, receptacle load at least 1 VA per ft² (11 VA/m²). */
  officeReceptacleVAperFt2: 1,
  /**
   * 220.60 (2020, second sentence) with 220.50 -> 430.24: when the A/C compressor is the largest motor,
   * it is compared with the heat at 125%.
   */
  largestMotorPct: 125,
} as const

/**
 * 2020 Table 220.12 unit loads (VA per ft²). In 2020 the table's unit loads already include the 125%
 * for continuous lighting (table note, confirmed by TIA 20-6 / Example D3). Only the occupancies the
 * Annex D research confirmed are entered; others are left out on purpose until a second source.
 */
export const NONDWELLING_UNIT_LOAD = {
  retail: 1.9,
  office: 1.3,
} as const
export type NonDwellingOccupancy = keyof typeof NONDWELLING_UNIT_LOAD

// ---------------------------------------------------------------------------------------------
// Locations (2020)
// ---------------------------------------------------------------------------------------------

const nec = (loc: string, title: string): CodeRef => ({ book: 'NEC', loc, title })

export const REF_LOAD = {
  smallApplianceCircuits: nec('210.11(C)(1)', 'Dwelling: at least two 20-A small-appliance branch circuits'),
  laundryCircuit: nec('210.11(C)(2)', 'Dwelling: at least one 20-A laundry branch circuit'),
  rangeNote1: nec('Table 220.55, Note 1', 'Ranges of the same rating over 12 kW: Column C plus 5% for each kW (or major fraction) over 12'),
  rangeNote2: nec('Table 220.55, Note 2', 'Ranges of unequal ratings: count each under 12 kW as 12 kW, average, then 5% per kW of the average over 12'),
  spaceHeating: nec('220.51', 'Fixed electric space heating at 100%'),
  neutralReduction: nec('220.61(B)(1)', 'Neutral: range, oven, cooktop and dryer demand at 70%'),
  neutralOver200: nec('220.61(B)(2)', 'Neutral: the part over 200 A at 70%'),
  multifamilyLoads: nec('220.84(C)', 'Multifamily optional method: what goes into the connected load'),
  smallApplianceAndLaundry: nec('220.52', 'Small-appliance and laundry circuits: 1,500 VA each, added to the general lighting before Table 220.42'),
  optionalFloorArea: nec('220.82(B)(1)', 'Optional method: 3 VA per ft² of floor area (figured as in 220.11)'),
  optionalCircuits: nec('220.82(B)(2)', 'Optional method: 1,500 VA for each 20-A small-appliance and laundry circuit'),
  officeReceptacles: nec('220.14(K)', 'Banks and office buildings: receptacles are the larger of 220.14(I) after demand, or 1 VA per ft²'),
  serviceConductors: nec('230.42(A)(1)', 'Service conductors: the noncontinuous load plus 125% of the continuous load'),
  kitchenSection: nec('220.56', 'Commercial kitchen equipment: thermostatic or intermittent use; not heat, ventilation or A/C; never below the two largest'),
} as const satisfies Record<string, CodeRef>
