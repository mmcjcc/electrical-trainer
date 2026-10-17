/**
 * The mistake catalog. Every wrong value a recipe knows about, and every generic detector, carries
 * one of these ids, so the progress screen can say "forgot the 125%: 4 times, last one 3 days ago".
 * Recipes may add ids; add them here with a title and a one-line lesson.
 */

export interface MistakeInfo {
  /** Short name for the progress screen. */
  title: string
  /** The one-line rule that fixes it, in plain words. */
  lesson: string
}

export const MISTAKES = {
  // ---- generic arithmetic (calc/check.ts detects these from any calc line) ----------------------
  decimal_slip: {
    title: 'Decimal point in the wrong place',
    lesson: 'Your digits were right but the size was off by 10, 100 or 1,000. Estimate first: about how big should it be?',
  },
  inverse_op: {
    title: 'Divided instead of multiplied (or the reverse)',
    lesson: 'Say the line out loud: "VA divided by volts gives amps." The words tell you which key to press.',
  },
  flipped_division: {
    title: 'Divided the wrong way round',
    lesson: 'Division has an order: the thing you are splitting goes first. Amps = VA ÷ volts, not volts ÷ VA.',
  },
  percent_as_whole: {
    title: 'Typed a percent as a whole number',
    lesson: 'Percent means "out of 100": 125% is × 1.25, 35% is × 0.35, 80% is × 0.8.',
  },
  skipped_operation: {
    title: 'Carried a number forward without doing the step',
    lesson: 'Each line does one thing to the number. If your answer equals the number you started with, the step was skipped.',
  },
  subtract_backwards: {
    title: 'Subtracted the wrong way round',
    lesson: 'Take the smaller away from the bigger the way the line says: "total minus the first 3,000".',
  },
  sqrt3_extra: {
    title: 'Used 1.732 on single-phase',
    lesson: '1.732 (the square root of 3) is only for three-phase. Single-phase: Amps = VA ÷ volts.',
  },
  sqrt3_missing: {
    title: 'Left out 1.732 on three-phase',
    lesson: 'Three-phase: Amps = VA ÷ (volts × 1.732). Multiply the volts by 1.732 first, then divide.',
  },
  sqrt3_slip: {
    title: '1.732 in the wrong place',
    lesson: 'Three-phase: Amps = VA ÷ (volts × 1.732). Single-phase never uses 1.732. Say which system it is before you start.',
  },
  wrong_voltage: {
    title: 'Used the wrong voltage',
    lesson: 'Use the system voltage the question gives (a dwelling service is 240 V; 208 V and 480 V are three-phase systems).',
  },
  rounded_wrong_way: {
    title: 'Rounded the wrong way',
    lesson: 'Things that must fit round DOWN (wires in a pipe). Things that must be big enough round UP (box, pipe, breaker, wire size).',
  },
  // ---- load calculation ---------------------------------------------------------------------------
  forgot_125_continuous: {
    title: 'Forgot 125% for a continuous load',
    lesson: 'A load on for 3 hours or more is continuous: size the conductor and breaker at 125% (× 1.25).',
  },
  demand_on_whole_load: {
    title: 'Applied the demand percent to the whole load',
    lesson: 'Demand tables work in steps: the first 3,000 VA at 100%, only the part above that at 35%.',
  },
  forgot_first_step: {
    title: 'Left out the first step of a demand table',
    lesson: 'After taking 35% of the remainder, add back the first 3,000 VA at 100%.',
  },
  missed_small_appliance: {
    title: 'Left out small-appliance or laundry circuits',
    lesson: 'Every dwelling gets at least two 1,500 VA small-appliance circuits and one 1,500 VA laundry circuit, added to the lighting before demand.',
  },
  range_nameplate: {
    title: 'Used the range nameplate instead of the demand table',
    lesson: 'A household range uses Table 220.55 (8 kW in Column C for one range up to 12 kW), not its nameplate.',
  },
  range_note1: {
    title: 'Missed the 5%-per-kW increase for a big range',
    lesson: 'Over 12 kW: add 5% to Column C for every kW (or major fraction) above 12.',
  },
  dryer_minimum: {
    title: 'Used less than 5,000 VA for a dryer',
    lesson: 'A household dryer counts as 5,000 VA or its nameplate, whichever is larger.',
  },
  appliance_75_misused: {
    title: 'Used 75% with fewer than four appliances (or forgot it with four or more)',
    lesson: 'Fastened-in-place appliances get 75% only when there are four or more of them.',
  },
  added_both_heat_and_ac: {
    title: 'Added both heat and air conditioning',
    lesson: 'Heat and A/C never run together (noncoincident): count only the larger one.',
  },
  used_smaller_noncoincident: {
    title: 'Kept the smaller of heat and A/C',
    lesson: 'Noncoincident loads: keep the LARGER one and drop the smaller.',
  },
  // ---- raceway and box ----------------------------------------------------------------------------
  wrong_fill_percent: {
    title: 'Used the wrong fill percent',
    lesson: 'Chapter 9 Table 1: one wire 53%, two wires 31%, three or more 40%. Nipples 24 in. or shorter: 60%.',
  },
  used_100pct_area: {
    title: 'Used the total (100%) conduit area',
    lesson: 'Table 4 lists several columns; for three or more wires use the 40% column.',
  },
  rounded_count_up: {
    title: 'Rounded the number of wires up',
    lesson: 'You cannot pull 9.6 wires. Round down, unless the decimal is .8 or more (Chapter 9, Note 7).',
  },
  ignored_note7: {
    title: 'Missed the .8 rule',
    lesson: 'When all wires are the same size and the decimal is .8 or more, the next whole number is permitted (Chapter 9, Note 7).',
  },
  wrong_insulation_column: {
    title: 'Read the wrong insulation type',
    lesson: 'THHN and THW have different areas in Chapter 9 Table 5. Find the row for the insulation the question names.',
  },
  box_device_one: {
    title: 'Counted a device as one',
    lesson: 'Each switch or receptacle on a yoke counts as TWO conductors of the largest wire connected to it.',
  },
  box_grounds_each: {
    title: 'Counted every ground wire',
    lesson: 'All the equipment grounding conductors together count as ONE (the largest one).',
  },
  box_clamps_each: {
    title: 'Counted each clamp',
    lesson: 'All the internal cable clamps together count as ONE (the largest wire in the box).',
  },
  box_pigtail_counted: {
    title: 'Counted a pigtail',
    lesson: 'A wire that starts and ends inside the box (a pigtail or jumper) does not count.',
  },
  // ---- ampacity, OCPD, motors, transformers ---------------------------------------------------------
  wrong_temp_column: {
    title: 'Read the wrong temperature column',
    lesson: 'Derate from the 90°C column when the wire is rated 90°C, but the final answer cannot exceed the 75°C (or 60°C) terminal rating.',
  },
  correction_vs_adjustment: {
    title: 'Mixed up correction and adjustment',
    lesson: 'Correction is for hot (or cold) air around the wire; adjustment is for more than three current-carrying wires together. Apply both when both happen.',
  },
  ocpd_rounded_down: {
    title: 'Picked the standard size below',
    lesson: 'When the code lets you go to the next standard size, go UP to the next size in 240.6(A).',
  },
  ocpd_next_size_not_allowed: {
    title: 'Went up a size where it is not allowed',
    lesson: 'Motor feeders (430.62) do NOT round up: pick the standard size at or below the calculated value.',
  },
  motor_nameplate_vs_table: {
    title: 'Used the nameplate instead of the table (or the reverse)',
    lesson: 'Conductors and short-circuit protection use the FLC tables (430.248/430.250); overloads use the nameplate FLA.',
  },
  motor_wrong_percent: {
    title: 'Used the wrong motor percentage',
    lesson: 'Conductors 125%; inverse-time breaker 250%; dual-element fuse 175%; overloads 115% or 125% depending on the motor.',
  },
  largest_motor_25: {
    title: 'Missed the extra 25% of the largest motor',
    lesson: 'Several motors on one feeder: 125% of the LARGEST motor plus 100% of all the others.',
  },
  vd_one_way_length: {
    title: 'Used the round-trip length (or forgot the 2)',
    lesson: 'Use the one-way length in the formula; the 2 in 2 × K × I × L already accounts for the return trip.',
  },
  vd_wrong_k: {
    title: 'Used the wrong K',
    lesson: 'K is 12.9 for copper and 21.2 for aluminum.',
  },
  // ---- added by the wiring/motor recipes builder (append only, keep this comment) -------------------------
  continuous_125_whole: {
    title: 'Took 125% of the noncontinuous part too',
    lesson: 'Only the continuous load gets × 1.25. Add the noncontinuous load as it is.',
  },
  noncontinuous_125: {
    title: 'Used 125% on a load that is not continuous',
    lesson: 'Continuous means on for 3 hours or more. A shorter load counts at 100%.',
  },
  small_conductor_limit: {
    title: 'Missed the small-wire breaker limit',
    lesson: '14, 12 and 10 AWG copper may be protected at no more than 15, 20 and 30 A (240.4(D)), whatever the ampacity table says.',
  },
  neutral_count: {
    title: 'Counted the neutral wrong',
    lesson: 'A neutral that carries only the unbalanced current does not count. It does count on a 2-wire circuit, two phases of a wye, or mostly nonlinear loads.',
  },
  egc_counted: {
    title: 'Counted the ground as current-carrying',
    lesson: 'Equipment grounding conductors never count toward the adjustment factor.',
  },
  terminal_limit_missed: {
    title: 'Kept a number above the terminal limit',
    lesson: 'After derating from the 90°C column, compare with the 75°C (terminal) ampacity and keep the SMALLER one.',
  },
  box_loop_once: {
    title: 'Counted a long loop as one',
    lesson: 'An unbroken wire looped 12 in. or more inside the box counts as TWO.',
  },
  box_support_fitting_missed: {
    title: 'Left out a fixture stud or hickey',
    lesson: 'Each type of support fitting (fixture stud, hickey) inside the box counts as one of the largest wire.',
  },
  box_egc_quarter: {
    title: 'Missed the quarter allowance for extra grounds',
    lesson: '2020 NEC: up to four grounds count as one; each ground beyond four adds 1/4 of one.',
  },
  box_volume_row: {
    title: 'Used the volume for the wrong wire size',
    lesson: 'Table 314.16(B): 14 AWG 2.00 in³, 12 AWG 2.25 in³, 10 AWG 2.50 in³, 8 AWG 3.00 in³, 6 AWG 5.00 in³.',
  },
  pull_wrong_multiplier: {
    title: 'Used the wrong pull-box multiplier',
    lesson: 'Straight pull: 8 × the largest raceway. Angle or U pull: 6 × the largest plus the others in the row.',
  },
  pull_forgot_others: {
    title: 'Left out the other raceways in the row',
    lesson: 'Angle pull: after 6 × the largest, ADD the trade sizes of the other raceways on the same wall and row.',
  },
  fill_missed_wires: {
    title: 'Left out some of the wires',
    lesson: 'Mixed fill counts every wire in the pipe, the equipment ground included.',
  },
  vd_wrong_percent: {
    title: 'Used the wrong voltage-drop percent',
    lesson: 'The NEC recommends 3% for a branch circuit (5% for feeder and branch together). Use the percent the question gives.',
  },
  motor_feeder_used_flc: {
    title: 'Used the largest FLC instead of its breaker or fuse',
    lesson: 'Motor feeder protection starts from the largest BRANCH-CIRCUIT DEVICE rating, then adds the other motors’ FLCs.',
  },
  motor_feeder_125_all: {
    title: 'Took 125% of every motor',
    lesson: 'Only the LARGEST motor gets 125% on a feeder. The others count at 100%.',
  },
  xfmr_wrong_percent: {
    title: 'Used the wrong transformer percent',
    lesson: 'Primary-only protection: 9 A or more 125%; 2 A to under 9 A 167%; under 2 A 300% (Table 450.3(B)).',
  },
  xfmr_no_round_up: {
    title: 'Rounded up a small transformer fuse',
    lesson: 'Under 9 A primary, 167% and 300% are maximums: pick the standard fuse at or BELOW. Only 9 A and up may go to the next size.',
  },
  ohms_wrong_formula: {
    title: 'Picked the wrong formula',
    lesson: 'Write what you have and what you want. Have volts and ohms, want amps: I = E ÷ R. Have volts and amps, want watts: P = E × I.',
  },
  square_as_double: {
    title: 'Doubled instead of squared',
    lesson: 'Squared means times itself: I² is I × I, not I × 2.',
  },
  kilo_conversion: {
    title: 'Forgot to change kVA or kW to VA or W',
    lesson: 'Kilo means thousand: 15 kVA is 15 × 1,000 = 15,000 VA. Change it before you divide by volts.',
  },
  pf_ignored: {
    title: 'Treated watts as volt-amperes',
    lesson: 'With a power factor, VA = W ÷ PF. Watts are always the smaller number (or equal at PF 1).',
  },
  small_conductor_motor: {
    title: 'Applied the small-wire limit to a motor circuit',
    lesson: 'Motor branch circuits follow Article 430 (240.4(G)): a 14 AWG motor circuit may have a breaker over 15 A when Table 430.52 allows it.',
  },
  motor_feeder_raw_device: {
    title: 'Used the calculated branch value, not the device rating',
    lesson: 'Motor feeder protection starts from the largest branch device AS INSTALLED (its standard rating), plus the other FLCs.',
  },

  // ---- added by the load-calculation recipes builder (append only, keep this comment) ---------------------
  floor_area_extra: {
    title: 'Counted the garage or porch in the floor area',
    lesson: 'The 3 VA per square foot is for the living space only. Leave out open porches, garages and unfinished spaces that cannot be lived in.',
  },
  dryer_nameplate_larger: {
    title: 'Used 5,000 VA when the dryer nameplate is bigger',
    lesson: '5,000 VA is the floor, not a fixed number: a dryer counts as its nameplate when that is more than 5,000 VA.',
  },
  range_major_fraction: {
    title: 'Rounded the kW over 12 the wrong way',
    lesson: 'For a big range, count each whole kW over 12, plus one more for a major fraction (more than half a kW). A smaller fraction is dropped.',
  },
  range_wrong_column: {
    title: 'Read the wrong column of the range table',
    lesson: 'A household range over 8¾ kW goes in Column C (8 kW for one range up to 12 kW). Columns A and B are percents for smaller cooking units.',
  },
  range_per_range: {
    title: 'Multiplied the range demand by the number of ranges',
    lesson: 'Column C already gives the demand for ALL the ranges together. Read the row for your count and stop there.',
  },
  range_note2_average: {
    title: 'Averaged unequal ranges wrong',
    lesson: 'Unequal ranges: count every range under 12 kW as 12 kW, add them all, divide by the number of ranges, then 5% for each kW the average is over 12.',
  },
  wrong_table_row: {
    title: 'Read the wrong row of the table',
    lesson: 'Find the row for the exact count in the question (ranges, dryers, units, pieces of equipment) before you read across.',
  },
  demand_factor_missed: {
    title: 'Skipped the demand factor',
    lesson: 'A demand table cuts the connected load down (lighting, receptacles, dryers, kitchen equipment, apartments). Apply it before the bucket goes into the total.',
  },
  appliance_excluded_counted: {
    title: 'Counted the range, dryer, heat or A/C as a fastened-in-place appliance',
    lesson: 'The 75% rule leaves out ranges and other cooking units, dryers, space heating and air conditioning. They have their own lines.',
  },
  service_min_100: {
    title: 'Went below the 100 A minimum service',
    lesson: 'A one-family house service is never smaller than 100 A, even when the calculation comes out lower.',
  },
  motor25_wrong_motor: {
    title: 'Took 25% of the wrong motor',
    lesson: 'The extra 25% goes on the largest motor still in the calculation: the A/C compressor when the A/C is kept, otherwise the biggest motor appliance.',
  },
  optional_used_standard_rules: {
    title: 'Used standard-method rules in the optional method',
    lesson: 'The optional method takes nameplates as they are: no range table, no 5,000 VA dryer floor, no 75% for appliances. Then the first 10 kVA at 100% and the rest at 40%.',
  },
  optional_heat_pct: {
    title: 'Used the wrong percent for heat or A/C (one-dwelling optional method)',
    lesson: 'A/C at 100%. Electric heat at 65% with fewer than four separately controlled units, 40% with four or more. Heat pump: 100% plus 65% of the backup heat. Keep the largest.',
  },
  optional_hvac_in_pile: {
    title: 'Put the heat or A/C in the 10 kVA pile',
    lesson: 'In the one-dwelling optional method, heat and A/C stay out of the general loads. Add the largest heat or A/C choice after the 40% step.',
  },
  multifamily_hvac_pct: {
    title: 'Took a percent of the heat or A/C (multifamily optional method)',
    lesson: 'For three or more units, each unit counts the larger of its A/C and its heat at full nameplate. The table percent is applied once, to the whole building.',
  },
  neutral_240_loads: {
    title: 'Put 240-volt loads on the neutral',
    lesson: 'A load that runs on 240 V only (water heater, A/C, 240-V heat) puts no current on the neutral: it adds nothing there.',
  },
  neutral_no_70: {
    title: 'Missed the 70% for the range and dryer on the neutral',
    lesson: 'On the neutral, the range (or oven and cooktop) and the dryer may be counted at 70% of their demand.',
  },
  neutral_70_on_all: {
    title: 'Took 70% of loads that do not get it',
    lesson: 'Only the cooking and dryer demand gets 70% on the neutral. Lighting and other 120-V loads stay at 100%; the over-200 A step only applies above 200 A.',
  },
  table_lighting_125_twice: {
    title: 'Added 125% to the table lighting load',
    lesson: '2020 NEC: the commercial lighting unit loads already include the 125% for continuous lighting. Multiply only the actual lighting by 1.25, to compare.',
  },
  lighting_kept_smaller: {
    title: 'Kept the smaller lighting load',
    lesson: 'Commercial lighting: compare the table load with the actual lighting × 1.25 and keep the LARGER one.',
  },
  kitchen_two_largest: {
    title: 'Missed the two-largest minimum',
    lesson: 'Commercial kitchen demand is never less than the two largest pieces of equipment added together.',
  },
  kitchen_counted_hvac: {
    title: 'Counted ventilation, heat or A/C as kitchen equipment',
    lesson: 'The kitchen demand table is for cooking, dishwashing and water-heating equipment. Exhaust fans, space heat and A/C are not counted in it.',
  },
  left_out_load: {
    title: 'Left a load out of the total',
    lesson: 'Before you add, tick off every load in the question so none is left behind.',
  },

  // ---- fallback ---------------------------------------------------------------------------------------
  unknown: {
    title: 'Other slip',
    lesson: 'Check each number you used against the line above it, then redo the one operation.',
  },
} as const satisfies Record<string, MistakeInfo>

export type MistakeId = keyof typeof MISTAKES

/** Looks up a catalog entry; unknown ids (from a newer content version) fall back to "Other slip". */
export function mistakeInfo(id: string): MistakeInfo {
  return (MISTAKES as Record<string, MistakeInfo>)[id] ?? MISTAKES.unknown
}
