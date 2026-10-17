/**
 * Where each concept lives in the code book, per NEC edition. Recipes and questions point here
 * instead of typing section numbers, so an edition change is one edit. `loc` is the 2020 location;
 * `byEdition['2023']` is given only where 2023 moved it. Verified against the crosswalk research
 * (docs/research/nec-crosswalk.md); rows marked `// VERIFY` are still waiting for a second source.
 */
import type { CodeRef } from '@/shared/types'

const nec = (loc: string, title: string, loc2023?: string): CodeRef => ({
  book: 'NEC',
  loc,
  title,
  ...(loc2023 && loc2023 !== loc ? { byEdition: { '2023': loc2023 } } : {}),
})

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
  annexC_EMT: nec('Annex C, Table C.1', 'Max. number of same-size conductors in EMT'),
  annexC_FMC: nec('Annex C, Table C.3', 'Max. number of same-size conductors in FMC'),
  annexC_IMC: nec('Annex C, Table C.4', 'Max. number of same-size conductors in IMC'),
  annexC_RMC: nec('Annex C, Table C.8', 'Max. number of same-size conductors in RMC'),
  annexC_PVC80: nec('Annex C, Table C.9', 'Max. number of same-size conductors in Schedule 80 PVC'), // VERIFY
  annexC_PVC40: nec('Annex C, Table C.10', 'Max. number of same-size conductors in Schedule 40 PVC'), // VERIFY

  // ---- Article 310 / 110 / 240 -------------------------------------------------------------------------
  ampacityTable: nec('Table 310.16', 'Ampacities of insulated conductors, 0-2000 V, not more than three in a raceway, 30°C'),
  tempCorrection: nec('Table 310.15(B)(1)', 'Ambient temperature correction factors (30°C basis)', 'Table 310.15(B)(1)(1)'),
  adjustment: nec('Table 310.15(C)(1)', 'Adjustment factors for more than three current-carrying conductors'),
  neutralCounting: nec('310.15(E)', 'When the neutral counts as current-carrying'),
  dwellingService83: nec('310.12', 'Single-phase dwelling services and feeders: 83% of the rating'),
  terminalTemp: nec('110.14(C)', 'Temperature limitations at terminals'),
  smallConductor: nec('240.4(D)', 'Small conductors: 14 AWG 15 A, 12 AWG 20 A, 10 AWG 30 A (copper)'),
  nextSizeUp: nec('240.4(B)', 'Overcurrent devices rated 800 A or less: next higher standard rating'),
  standardOcpd: nec('240.6(A)', 'Standard ampere ratings of fuses and inverse-time breakers'),
  continuousBranch: nec('210.19(A)(1)', 'Branch-circuit conductors: 125% of continuous load'),
  continuousBranchOcpd: nec('210.20(A)', 'Branch-circuit OCPD: 125% of continuous load'),
  continuousFeeder: nec('215.2(A)(1)', 'Feeder conductors: 125% of continuous load'),
  continuousFeederOcpd: nec('215.3', 'Feeder OCPD: 125% of continuous load'),

  // ---- 314 boxes ----------------------------------------------------------------------------------------
  boxFill: nec('314.16', 'Number of conductors in outlet, device, and junction boxes'),
  boxVolumes: nec('Table 314.16(A)', 'Metal boxes: minimum volume and max. number of conductors'),
  boxPerConductor: nec('Table 314.16(B)', 'Volume allowance required per conductor'),
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
  motorOcpdTable: nec('Table 430.52', 'Max. rating of motor branch-circuit short-circuit and ground-fault protection', 'Table 430.52(C)(1)'), // VERIFY 2023
  motorOcpdNextSize: nec('430.52(C)(1), Exception No. 1', 'Next higher standard size permitted'), // VERIFY 2023
  motorFeederOcpd: nec('430.62(A)', 'Motor feeder OCPD: largest branch device plus the other FLCs; do not round up'),

  // ---- 450 transformers ----------------------------------------------------------------------------------
  transformerOcpd: nec('Table 450.3(B)', 'Transformer overcurrent protection, 1000 V and less'),

  // ---- 220 load calculations (2023 reorganized Part III; every row waits for the crosswalk) ----------------
  voltagesForCalcs: nec('220.5(A)', 'Voltages to use: 120, 120/240, 208Y/120, 240, 480Y/277, 480 ...'),
  fractionsOfAmpere: nec('220.5(B)', 'Fractions of an ampere under 0.5 may be dropped'),
  floorArea: nec('220.11', 'Floor area: outside dimensions; not porches, garages, unfinished spaces'), // VERIFY
  dwellingLighting: nec('220.14(J)', 'Dwelling units: 3 VA per ft² (includes general-use receptacles)', '220.41'), // VERIFY
  nonDwellingLighting: nec('Table 220.12', 'General lighting load by non-dwelling occupancy', 'Table 220.42(A)'), // VERIFY
  receptacleOutlets: nec('220.14(I)', 'Receptacle outlets: 180 VA per single, duplex, or triple yoke'),
  signOutlet: nec('220.14(F)', 'Sign and outline lighting outlet: 1,200 VA'),
  showWindow: nec('220.14(G)', 'Show windows: 200 VA per linear foot'), // VERIFY
  lightingDemand: nec('Table 220.42', 'Lighting load demand factors', 'Table 220.45'), // VERIFY
  nonDwellingReceptacles: nec('Table 220.44', 'Demand factors for non-dwelling receptacle loads', 'Table 220.47'), // VERIFY
  smallAppliance: nec('220.52(A)', 'Small-appliance circuits: 1,500 VA each'),
  laundry: nec('220.52(B)', 'Laundry circuit: 1,500 VA'),
  fixedAppliances: nec('220.53', 'Fastened-in-place appliances: 75% when four or more'),
  dryers: nec('220.54', 'Household dryers: 5,000 VA or nameplate, demand per Table 220.54'),
  dryerTable: nec('Table 220.54', 'Demand factors for household electric clothes dryers'),
  ranges: nec('220.55', 'Household ranges and cooking appliances'),
  rangeTable: nec('Table 220.55', 'Demand loads for household ranges, ovens, cooktops (Columns A, B, C and Notes)'),
  kitchenEquipment: nec('Table 220.56', 'Demand factors for commercial kitchen equipment'),
  noncoincident: nec('220.60', 'Noncoincident loads: keep the larger of heat and A/C'),
  neutralLoad: nec('220.61', 'Feeder or service neutral load'),
  motorLoadCalc: nec('220.50', 'Motor loads per 430.24 (125% of the largest motor)'),
  optionalDwelling: nec('220.82', 'Optional method, one dwelling unit'),
  optionalDwellingGeneral: nec('220.82(B)', 'Optional method: general loads, first 10 kVA at 100%, remainder 40%'),
  optionalDwellingHvac: nec('220.82(C)', 'Optional method: heating and air-conditioning load'),
  optionalMultifamily: nec('220.84', 'Optional method, three or more dwelling units'),
  optionalMultifamilyTable: nec('Table 220.84', 'Demand factors for three or more multifamily dwelling units'),
  minServiceDwelling: nec('230.79(C)', 'One-family dwelling service: not less than 100 A'),

  // ---- 250 grounding ------------------------------------------------------------------------------------------
  gecTable: nec('Table 250.66', 'Grounding electrode conductor for AC systems'),
  egcTable: nec('Table 250.122', 'Minimum size equipment grounding conductors'),
  bondingJumperTable: nec('Table 250.102(C)(1)', 'Grounded conductor, main and system bonding jumpers, supply-side bonding jumper'),
} as const satisfies Record<string, CodeRef>

export type RefKey = keyof typeof REF
