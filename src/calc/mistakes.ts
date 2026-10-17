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

  // ---- added by the load-calculation recipes builder (append only, keep this comment) ---------------------

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
