/**
 * Where each concept lives in the code book, per NEC edition (2020 is the exam's; 2026 is the next). Recipes and questions point here
 * instead of typing section numbers, so an edition change is one edit. `loc` is the 2020 location;
 * `byEdition['2023']` is given only where 2023 moved it. Verified against the crosswalk research
 * (docs/research/nec-crosswalk.md) and the Annex D research (docs/research/annex-d-methods.md); rows
 * marked `// VERIFY` are still waiting for a second source.
 */
import type { CodeRef } from '@/shared/types'

/** `loc` is the 2020 location; give 2023/2026 only where they differ (crosswalk research). */
const nec = (loc: string, title: string, loc2023?: string, loc2026?: string): CodeRef => {
  const byEdition: Partial<Record<'2023' | '2026', string>> = {}
  if (loc2023 && loc2023 !== loc) byEdition['2023'] = loc2023
  const l26 = loc2026 ?? loc2023
  if (l26 && l26 !== loc) byEdition['2026'] = l26
  return { book: 'NEC', loc, title, ...(Object.keys(byEdition).length ? { byEdition } : {}) }
}

export const REF = {
  // ---- Chapter 9 and Annex C -----------------------------------------------------------------------
  ch9Table1: nec('Chapter 9, Table 1', 'Percent of cross section of conduit and tubing for conductors'),
  ch9Note4Nipple: nec('Chapter 9, Notes to Tables, Note 4', 'Nipples 24 in. or shorter: 60% fill'),
  ch9Note7: nec('Chapter 9, Notes to Tables, Note 7', 'Same-size conductors: next whole number at .8 or more'),
  ch9Table4: nec('Chapter 9, Table 4', 'Dimensions and percent area of conduit and tubing'),
  ch9Table5: nec('Chapter 9, Table 5', 'Dimensions of insulated conductors and fixture wires'),
  ch9Table8: nec('Chapter 9, Table 8', 'Conductor properties (circular mils)'),
  ch9Table9: nec('Chapter 9, Table 9', 'AC resistance and reactance'),
  annexC: nec('Annex C', 'Fill tables for conductors of the same size'),
  annexD: nec('Annex D', 'Worked load calculation examples'),
  annexD1b: nec('Annex D, Example D1(b)', 'One-family dwelling, standard method, with A/C and 25% of the largest motor'),
  annexC_EMT: nec('Annex C, Table C.1', 'Max. number of same-size conductors in EMT'),
  annexC_FMC: nec('Annex C, Table C.3', 'Max. number of same-size conductors in FMC'),
  annexC_IMC: nec('Annex C, Table C.4', 'Max. number of same-size conductors in IMC'),
  annexC_RMC: nec('Annex C, Table C.8', 'Max. number of same-size conductors in RMC'),
  annexC_PVC80: nec('Annex C, Table C.9', 'Max. number of same-size conductors in Schedule 80 PVC'), // VERIFY
  annexC_PVC40: nec('Annex C, Table C.10', 'Max. number of same-size conductors in Schedule 40 PVC'), // VERIFY

  // ---- Article 310 / 110 / 240 -------------------------------------------------------------------------
  ampacityTable: nec('Table 310.16', 'Ampacities of insulated conductors, 0-2000 V, not more than three in a raceway, 30°C'),
  tempCorrection: nec('Table 310.15(B)(1)', 'Ambient temperature correction factors (30°C basis)', 'Table 310.15(B)(1)(1)', 'Table 310.15(B)(1)(1)'),
  adjustment: nec('Table 310.15(C)(1)', 'Adjustment factors for more than three current-carrying conductors'),
  neutralCounting: nec('310.15(E)', 'When the neutral counts as current-carrying'),
  dwellingService83: nec('310.12', 'Single-phase dwelling services and feeders: 83% of the rating (Table 310.12 lists sizes)'),
  terminalTemp: nec('110.14(C)', 'Temperature limitations at terminals'),
  smallConductor: nec('240.4(D)', 'Small conductors: 14 AWG 15 A, 12 AWG 20 A, 10 AWG 30 A (copper)'),
  nextSizeUp: nec('240.4(B)', 'Overcurrent devices rated 800 A or less: next higher standard rating'),
  standardOcpd: nec('240.6(A)', 'Standard ampere ratings of fuses and inverse-time breakers'),
  continuousBranch: nec('210.19(A)(1)(a)', 'Branch-circuit conductors: 125% of continuous load', '210.19(A)(1)', '210.19(A)(1)'),
  continuousBranchOcpd: nec('210.20(A)', 'Branch-circuit OCPD: 125% of continuous load'),
  continuousFeeder: nec('215.2(A)(1)(a)', 'Feeder conductors: 125% of continuous load', '215.2(A)(1)', '215.4(A)(1)'),
  vdBranchNote: nec('210.19(A), Informational Note No. 3', 'Voltage drop: 3% for a branch circuit, 5% branch plus feeder (a recommendation)', '210.19, Informational Note', '210.19, Informational Note'),
  vdFeederNote: nec('215.2(A)(1), Informational Note No. 2', 'Voltage drop: 3% for a feeder, 5% feeder plus branch (a recommendation)', '215.2(A)(2), Informational Note No. 2', '215.4(A)(2), Informational Note No. 2'), // VERIFY 2026
  continuousFeederOcpd: nec('215.3', 'Feeder OCPD: 125% of continuous load', '215.3', '215.5'),

  // ---- 314 boxes ----------------------------------------------------------------------------------------
  boxFill: nec('314.16', 'Number of conductors in outlet, device, and junction boxes'),
  boxVolumes: nec('Table 314.16(A)', 'Metal boxes: minimum volume and max. number of conductors'),
  boxPerConductor: nec('Table 314.16(B)', 'Volume allowance required per conductor', 'Table 314.16(B)(1)', 'Table 314.16(B)(1)'),
  boxConductorCount: nec('314.16(B)(1)', 'Conductor fill: each conductor from outside counts once'),
  boxClamps: nec('314.16(B)(2)', 'Clamp fill: all internal clamps count as one'),
  boxSupportFittings: nec('314.16(B)(3)', 'Support fittings fill: each type counts as one'),
  boxDevices: nec('314.16(B)(4)', 'Device or equipment fill: two for each yoke'),
  boxEgc: nec('314.16(B)(5)', 'Equipment grounding conductor fill: one for all'),
  pullBox: nec('314.28', 'Pull and junction boxes: straight pulls 8×, angle pulls 6×'),

  // ---- 430 motors -------------------------------------------------------------------------------------
  motorFlcUse: nec('430.6(A)(1)', 'Use the FLC tables, not the nameplate, for conductors and OCPD'),
  motorFla: nec('430.6(A)(2)', 'Use the nameplate current for separate overload protection'),
  motorFlc1ph: nec('Table 430.248', 'Full-load current, single-phase AC motors'),
  motorFlc3ph: nec('Table 430.250', 'Full-load current, three-phase AC motors'),
  motorConductor: nec('430.22', 'Single motor: conductors at 125% of FLC'),
  motorFeeder: nec('430.24', 'Several motors: 125% of the largest plus the others'),
  motorOverload: nec('430.32(A)(1)', 'Overload: 125% (SF 1.15+ or temp rise 40°C or less), else 115%'),
  motorOcpdTable: nec('Table 430.52', 'Max. rating of motor branch-circuit short-circuit and ground-fault protection', 'Table 430.52(C)(1)'),
  motorOcpdNextSize: nec('430.52(C)(1), Exception No. 1', 'Next higher standard size permitted', '430.52(C)(1)(a)'),
  motorFeederOcpd: nec('430.62(A)', 'Motor feeder OCPD: largest branch device plus the other FLCs; do not round up'),

  // ---- 450 transformers ----------------------------------------------------------------------------------
  transformerOcpd: nec('Table 450.3(B)', 'Transformer overcurrent protection, 1000 V and less', 'Table 450.3(B)', 'Table 450.5(B)'),

  // ---- 220 load calculations (2023 reorganized Part III; 2020 rows confirmed 2026-10-16) ----------------
  voltagesForCalcs: nec('220.5(A)', 'Voltages to use: 120, 120/240, 208Y/120, 240, 480Y/277, 480 ...', '220.5(A)', '120.5(A)'),
  fractionsOfAmpere: nec('220.5(B)', 'Fractions of an ampere under 0.5 may be dropped', '220.5(B)', '120.5(B)'),
  floorArea: nec('220.11', 'Floor area: outside dimensions; not open porches, garages, unfinished spaces (2023 no longer excludes garages)', '220.5(C)', '120.5(C)'),
  dwellingLighting: nec('220.14(J)', 'Dwelling units: 3 VA per ft² (includes general-use receptacles)', '220.41', '120.41'),
  nonDwellingLighting: nec('Table 220.12', 'General lighting load by non-dwelling occupancy (the 125% for continuous load is already included)', 'Table 220.42(A)', 'Table 120.42(A)'),
  receptacleOutlets: nec('220.14(I)', 'Receptacle outlets: 180 VA per single, duplex, or triple yoke', '220.14(I)', '120.14(I)'),
  showWindowFeeder: nec('220.43(A)', 'Show windows in a feeder or service calculation: 200 VA per linear foot', '220.46(A)', '120.46'),
  signOutlet: nec('220.14(F)', 'Sign and outline lighting outlet: 1,200 VA', '220.14(F)', '120.14(F)'),
  showWindow: nec('220.14(G)', 'Show windows (branch circuits): 200 VA per linear foot', '220.14(G)', '120.14(G)'),
  lightingDemand: nec('Table 220.42', 'Lighting load demand factors', 'Table 220.45', 'Table 120.45'),
  nonDwellingReceptacles: nec('Table 220.44', 'Demand factors for non-dwelling receptacle loads', 'Table 220.47', 'Table 120.47'),
  smallAppliance: nec('220.52(A)', 'Small-appliance circuits: 1,500 VA each', '220.52(A)', '120.52(A)'),
  laundry: nec('220.52(B)', 'Laundry circuit: 1,500 VA', '220.52(B)', '120.52(B)'),
  fixedAppliances: nec('220.53', 'Fastened-in-place appliances: 75% when four or more', '220.53', '120.53'),
  dryers: nec('220.54', 'Household dryers: 5,000 VA or nameplate, demand per Table 220.54', '220.54', '120.54'),
  dryerTable: nec('Table 220.54', 'Demand factors for household electric clothes dryers', 'Table 220.54', 'Table 120.54'),
  ranges: nec('220.55', 'Household ranges and cooking appliances', '220.55', '120.55'),
  rangeTable: nec('Table 220.55', 'Demand loads for household ranges, ovens, cooktops (Columns A, B, C and Notes)', 'Table 220.55', 'Table 120.55'),
  kitchenEquipment: nec('Table 220.56', 'Demand factors for commercial kitchen equipment', 'Table 220.56', 'Table 120.56'),
  noncoincident: nec('220.60', 'Noncoincident loads: keep the larger of heat and A/C', '220.60', '120.6'),
  neutralLoad: nec('220.61', 'Feeder or service neutral load', '220.61', '120.61'),
  motorLoadCalc: nec('220.50', 'Motor loads per 430.24 (125% of the largest motor)', '220.50(A)', '120.50'),
  optionalDwelling: nec('220.82', 'Optional method, one dwelling unit', '220.82', '120.82'),
  optionalDwellingGeneral: nec('220.82(B)', 'Optional method: general loads, first 10 kVA at 100%, remainder 40%', '220.82(B)', '120.82(B)'),
  optionalDwellingHvac: nec('220.82(C)', 'Optional method: heating and air-conditioning load', '220.82(C)', '120.82(C)'),
  optionalMultifamily: nec('220.84', 'Optional method, three or more dwelling units', '220.84', '120.84'),
  optionalMultifamilyTable: nec('Table 220.84', 'Demand factors for three or more multifamily dwelling units', 'Table 220.84(B)', 'Table 120.84(C)'),
  minServiceDwelling: nec('230.79(C)', 'One-family dwelling service: not less than 100 A'),

  // ---- 250 grounding ------------------------------------------------------------------------------------------
  gecTable: nec('Table 250.66', 'Grounding electrode conductor for AC systems'),
  egcTable: nec('Table 250.122', 'Minimum size equipment grounding conductors'),
  bondingJumperTable: nec('Table 250.102(C)(1)', 'Grounded conductor, main and system bonding jumpers, supply-side bonding jumper'),
} as const satisfies Record<string, CodeRef>

export type RefKey = keyof typeof REF
