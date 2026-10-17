/**
 * Special Equipment, PSI area "Special Equipment" (NEC Articles 600-675 and 680-695): signs, elevators,
 * EV charging, welders, IT rooms, pools, spas, fountains and hydromassage tubs, PV systems, fire pumps.
 * Drafted by Antigravity (Gemini 4, batch se) and checked one by one by Claude against the 2020 NEC;
 * one draft was rewritten because it keyed the pre-2020 pool wiring rule, and one question was added.
 * Review trail: docs/reviews/bank-special.md (each note starts with the draft id). Every item is tagged
 * 2020 only: the locations were not verified for 2023 and 2026 (Article 600 and 690 subsections move).
 */
import type { CodeRef, Question } from '@/shared/types'

const NEC2020: Question['editions'] = ['2020']
type Provenance = NonNullable<Question['provenance']>
const AGY = 'antigravity gemini-4-argon-high'
const agy = (draft: string, change?: string): Provenance => ({
  draftedBy: AGY,
  verifiedBy: 'claude',
  note: change ? `${draft}: ${change}` : `${draft}: kept as drafted`,
})
const ours = (note: string): Provenance => ({ draftedBy: 'claude', verifiedBy: 'claude', note })
const nec = (loc: string, title: string): CodeRef => ({ book: 'NEC', loc, title })

export const QUESTIONS: Question[] = [
  // ---- Signs: Article 600 ---------------------------------------------------------------------------
  {
    id: 'special-equipment-001', topic: 'special-equipment', kind: 'lookup', difficulty: 1, editions: NEC2020,
    provenance: agy('se-01', 'option "20 A, which may also supply outdoor receptacles" half-repeated the key and was replaced by 40 A; the neon whyNot no longer cites a subsection (2020 moved the rating rule)'),
    stem: 'Each tenant entrance of a strip mall must have an outlet for a sign. The branch circuit for that outlet must be rated at least ___ and supply no other load.',
    choices: ['15 A', '20 A', '30 A', '40 A'],
    answer: 1,
    explain: 'Each commercial building or occupancy that pedestrians can enter needs at least one sign outlet at each tenant entrance, on a branch circuit of at least 20 A that serves nothing else. In the load calculation it counts at 1,200 VA (220.14(F)).',
    whyNot: {
      0: 'General lighting circuits may be 15 A; the sign circuit must be at least 20 A.',
      2: '30 A is the most a circuit supplying neon tubing may be rated (600.5), not the minimum here.',
      3: '40 A is not a sign circuit value; the minimum is 20 A.',
    },
    ref: nec('600.5(A)', 'Required sign branch circuit'),
  },
  {
    id: 'special-equipment-002', topic: 'special-equipment', kind: 'rule', difficulty: 2, editions: NEC2020,
    provenance: agy('se-02', 'stem reworded (it repeated the code sentence); options reordered'),
    stem: 'A sign’s disconnecting means is installed where it cannot be seen from some part of the sign that can be energized. What must the disconnect then have?',
    choices: [
      'A shunt trip controlled from the sign',
      'A location within 25 ft of the sign enclosure',
      'A portable lockout device kept inside the sign body',
      'A permanent provision for locking it in the open (off) position',
    ],
    answer: 3,
    explain: 'The sign disconnect is normally within sight of the sign. If any part that can be energized is out of sight of it, the disconnect must be lockable open, with the locking provision staying in place whether or not a lock is on it (110.25).',
    whyNot: {
      0: 'No shunt trip is required; a lockable disconnect meets the rule.',
      1: 'There is no 25-ft rule; "within sight" means visible and no more than 50 ft away.',
      2: 'Portable add-on locking means are not accepted under 110.25.',
    },
    ref: nec('600.6(A)(2)', 'Sign disconnect within sight or lockable'),
  },
  {
    id: 'special-equipment-003', topic: 'special-equipment', kind: 'lookup', difficulty: 2, editions: NEC2020,
    provenance: agy('se-03', 'whyNot corrected (22-1/2 in. is the attic access door, not the passageway width); distractors rebuilt'),
    stem: 'A sign transformer is installed remotely, not inside the sign. What working space must be provided at the transformer?',
    choices: [
      'At least 3 ft high, 3 ft wide and 3 ft deep',
      'At least 3 ft high, 2 ft wide and 3 ft deep',
      'At least 30 in. wide, 3 ft deep and 6 ft 6 in. high',
      'None; remote sign transformers need no working space',
    ],
    answer: 0,
    explain: 'Each ballast, transformer, electronic power supply or Class 2 power source that is not installed in a sign needs working space at least 3 ft high, 3 ft wide and 3 ft deep.',
    whyNot: {
      1: '3 ft high by 2 ft wide is the passageway size to equipment in attics and soffits (600.21(E)), not the working space.',
      2: 'That is the general 110.26 working space; sign equipment has its own 3-ft cube rule.',
      3: 'Working space is required at each remote ballast, transformer or power supply.',
    },
    ref: nec('600.21(D)', 'Working space at sign transformers'),
  },
  {
    id: 'special-equipment-004', topic: 'special-equipment', kind: 'lookup', difficulty: 1, editions: NEC2020,
    provenance: agy('se-04', 'options put in conductor-size order'),
    stem: 'Bonding conductors that bond the metal parts of a sign must be copper and at least what size?',
    choices: ['14 AWG', '12 AWG', '10 AWG', '8 AWG'],
    answer: 0,
    explain: 'Sign bonding conductors must be copper, not smaller than 14 AWG, and protected from physical damage where run outside the sign or raceway.',
    whyNot: {
      1: 'Picking 12 AWG to match a 20-A sign circuit is common, but the bonding minimum is 14 AWG.',
      2: '10 AWG is larger than required.',
      3: '8 AWG solid copper is the pool bonding size (680.26(B)), not the sign size.',
    },
    ref: nec('600.7(B)(7)', 'Sign bonding conductors'),
  },

  // ---- Elevators, EV charging, welders, IT rooms: Articles 620, 625, 630, 645 -------------------------
  {
    id: 'special-equipment-005', topic: 'special-equipment', kind: 'rule', difficulty: 2, editions: NEC2020,
    provenance: agy('se-05', 'options reordered'),
    stem: 'A building has three passenger elevators. How must the lights, receptacle, auxiliary lighting power source and ventilation in each car be supplied?',
    choices: [
      'From one shared 20-A branch circuit for all three cars',
      'From the load side of the car’s GFCI receptacle, so one device protects everything',
      'From a separate branch circuit for each car, with the required lighting not on the load side of a GFCI',
      'From the same branch circuit as the car’s air-conditioning and heating unit',
    ],
    answer: 2,
    explain: 'Each car gets its own branch circuit for its lights, receptacles, auxiliary lighting power source and ventilation. Required car lighting may not be on the load side of a GFCI, so a ground fault at a receptacle cannot leave riders in the dark.',
    whyNot: {
      0: 'Each car needs its own branch circuit, even in a bank of cars.',
      1: 'Required car lighting may not be on the load side of a GFCI.',
      3: 'Car air-conditioning and heating get their own separate branch circuit (620.22(B)).',
    },
    ref: nec('620.22(A)', 'Elevator car light branch circuit'),
  },
  {
    id: 'special-equipment-006', topic: 'special-equipment', kind: 'rule', difficulty: 3, editions: NEC2020,
    provenance: agy('se-06', 'stem set in a field situation; options reordered'),
    stem: 'Sprinklers are installed in an elevator hoistway and machine room. What does 620.51(B) allow for the elevator’s main disconnecting means?',
    choices: [
      'It may open automatically before water is applied, but it may be reclosed only by hand',
      'It may open automatically and reclose automatically when the fire alarm resets',
      'It must wait to open until 60 seconds after water starts to flow',
      'It may be replaced by a nonfused switch outside the building entrance',
    ],
    answer: 0,
    explain: 'Normally no one may open or close the elevator disconnect from anywhere else in the building. Where sprinklers protect the hoistway or machine room, it may open automatically (usually by shunt trip) before water is applied, but it may not close automatically; power comes back only by manual means.',
    whyNot: {
      1: 'Automatic reclosing is not permitted; power is restored manually.',
      2: 'The point is to open before water is applied, not after.',
      3: '620.51(A) calls for an enclosed fused motor-circuit switch or circuit breaker, not a nonfused switch.',
    },
    ref: nec('620.51(B)', 'Elevator disconnect operation'),
  },
  {
    id: 'special-equipment-007', topic: 'special-equipment', kind: 'rule', difficulty: 2, editions: NEC2020,
    provenance: agy('se-07', 'options reordered; 625.41 named for the 125% step'),
    stem: 'An outlet in a garage supplies Level 2 EV charging equipment with a maximum load of 32 A. How must the outlet be supplied?',
    choices: [
      'From a 40-A multi-outlet circuit that also feeds the garage door opener',
      'From an individual branch circuit with a 35-A overcurrent device',
      'From a 50-A circuit shared with a second EV charging outlet',
      'From an individual branch circuit with an overcurrent device rated at least 40 A',
    ],
    answer: 3,
    explain: 'Each EV charging outlet needs an individual branch circuit with no other outlets (625.40). EV charging is a continuous load, so the overcurrent device is at least 125% of the maximum load: 32 A × 1.25 = 40 A (625.41).',
    whyNot: {
      0: 'The circuit for an EV charging outlet may have no other outlets.',
      1: '35 A skips the 125% continuous-load step; 32 A × 1.25 = 40 A.',
      2: 'Each EV charging outlet needs its own individual branch circuit.',
    },
    ref: nec('625.40', 'EV branch circuit (125% in 625.41)'),
  },
  {
    id: 'special-equipment-008', topic: 'special-equipment', kind: 'rule', difficulty: 2, editions: NEC2020,
    provenance: agy('se-08', 'explanation trimmed'),
    stem: 'A 50-A, 125/250-V receptacle is installed in a commercial parking garage for plugging in an electric vehicle charger. Under the 2020 NEC, what protection does the receptacle need?',
    choices: [
      'None, because it is rated over 20 A and over 125 V',
      'GFCI protection only if the parking space is outdoors',
      'Ground-fault protection of equipment (GFPE) set at 30 mA',
      'GFCI protection for personnel',
    ],
    answer: 3,
    explain: '625.54 requires GFCI protection for personnel on every receptacle installed for EV charging, in addition to 210.8, whatever its voltage, rating or location. Do not use the 210.8 ampere and voltage limits to rule it out.',
    whyNot: {
      0: '625.54 has no voltage or ampere cutoff for EV charging receptacles.',
      1: 'The rule applies indoors and outdoors.',
      2: 'The rule calls for GFCI protection for personnel, not 30-mA equipment protection.',
    },
    ref: nec('625.54', 'GFCI for EV charging receptacles'),
  },
  {
    id: 'special-equipment-009', topic: 'special-equipment', kind: 'lookup', difficulty: 1, editions: NEC2020,
    provenance: agy('se-09', 'whyNot corrected (175% is the Table 430.52 dual-element fuse value, not inverse-time breaker); options in ascending order; I1max noted'),
    stem: 'The overcurrent device for an individual arc welder may be rated or set at no more than what percentage of the welder’s rated primary current?',
    choices: ['125%', '175%', '200%', '300%'],
    answer: 2,
    explain: 'An arc welder’s overcurrent device may be rated or set at up to 200% of I1max, or of the rated primary current when I1max is not marked. Resistance welders are allowed up to 300% (630.32(A)).',
    whyNot: {
      0: '125% is the continuous-load multiplier, not the welder limit.',
      1: '175% is the dual-element (time-delay) fuse value for motors in Table 430.52.',
      3: '300% is the limit for resistance welders, not arc welders.',
    },
    ref: nec('630.12(A)', 'Arc welder overcurrent protection'),
  },
  {
    id: 'special-equipment-010', topic: 'special-equipment', kind: 'rule', difficulty: 2, editions: NEC2020,
    provenance: agy('se-10', 'stem no longer puts the controls "at the principal exit doors" (older wording; 2020 location wording not verified)'),
    stem: 'An information technology equipment room is wired under Article 645. Its approved disconnecting means removes power from all electronic equipment in the room. What must a similar approved means also do?',
    choices: [
      'Turn off the emergency egress lighting for the floor',
      'Open the main service disconnect for the building',
      'Disconnect the dedicated HVAC systems serving the room and cause required fire/smoke dampers to close',
      'Shut off only the underfloor receptacle circuits, leaving UPS outputs energized',
    ],
    answer: 2,
    explain: 'To use the relaxed wiring rules of Article 645, the room needs an approved means to cut power to all its electronic equipment and a similar means to shut down the dedicated HVAC and close the required fire/smoke dampers. One control may do both.',
    whyNot: {
      0: 'Egress lighting must stay on during an emergency.',
      1: 'Only the room (or zone) is shut down, not the whole building.',
      3: 'UPS output supplying the room must be disconnected too (645.11).',
    },
    ref: nec('645.10', 'IT room disconnecting means'),
  },

  // ---- Pools, spas, fountains, hydromassage tubs: Article 680 ----------------------------------------
  {
    id: 'special-equipment-011', topic: 'special-equipment', kind: 'rule', difficulty: 3, editions: NEC2020,
    provenance: agy('se-11', 'rewritten: the draft keyed the pre-2020 rule (no unrelated underground wiring within 5 ft); 2020 680.11 permits it in the listed wiring methods with Table 300.5 cover'),
    stem: 'Under the 2020 NEC, an underground branch circuit to a detached garage must pass 3 ft from the inside wall of an in-ground pool. Which statement is correct?',
    choices: [
      'It is not permitted within 5 ft of the pool unless it supplies pool equipment',
      'It is permitted in a suitable method such as RMC, IMC, PVC or jacketed MC listed for burial, with cover per Table 300.5',
      'It is permitted only in RMC buried at least 6 in. deep',
      'It must be rerouted to run under the pool instead',
    ],
    answer: 1,
    explain: 'In 2020, 680.11 allows underground wiring within 5 ft of the pool if it uses one of the listed methods (RMC, IMC, PVC, RTRC, jacketed MC listed for burial, or liquidtight conduit listed for direct burial), with cover depths from Table 300.5. Earlier editions kept unrelated wiring out of the 5-ft zone, so a 2017-trained electrician may pick the first option.',
    whyNot: {
      0: 'That was the rule before 2020 (680.10); 2020 limits the wiring method instead.',
      2: 'The separate pool cover-depth table was deleted in 2020; Table 300.5 applies.',
      3: 'Wiring under the pool is still not permitted unless it supplies pool equipment.',
    },
    ref: nec('680.11(A)', 'Underground wiring near pools'),
  },
  {
    id: 'special-equipment-012', topic: 'special-equipment', kind: 'lookup', difficulty: 2, editions: NEC2020,
    provenance: agy('se-12', 'options in ascending order (distractor values moved)'),
    stem: 'A pool pump has a maintenance disconnect. With no permanent barrier between it and the water, it must be at least how far horizontally from the inside wall of the pool?',
    choices: ['2 ft', '3 ft', '5 ft', '6 ft'],
    answer: 2,
    explain: 'All pool utilization equipment other than lighting needs a maintenance disconnect that is readily accessible, within sight of the equipment and at least 5 ft from the inside walls of the pool, unless a permanent barrier makes the reach path 5 ft or more. 2020 moved this rule from 680.12 to 680.13.',
    whyNot: {
      0: '2 ft is far inside the 5-ft limit.',
      1: '3 ft is the width of the bonded perimeter surface (680.26(B)(2)), not this distance.',
      3: '6 ft is the minimum distance for receptacles (680.22(A)), not the disconnect.',
    },
    ref: nec('680.13', 'Pool maintenance disconnect'),
  },
  {
    id: 'special-equipment-013', topic: 'special-equipment', kind: 'rule', difficulty: 3, editions: NEC2020,
    provenance: agy('se-13', 'options reordered'),
    stem: 'An electrician replaces a failed 240-V, single-phase, hard-wired pool pump motor at a house. The circuit has a standard two-pole breaker with no GFCI. Under the 2020 NEC, what is required?',
    choices: [
      'Nothing; hard-wired motors do not need GFCI protection',
      'Nothing; replacing a motor for repair is exempt',
      'GFCI protection only if the motor runs at 120 V or is on a 20-A or smaller circuit',
      'GFCI protection for the replacement motor',
    ],
    answer: 3,
    explain: 'Outlets supplying pool pump motors on single-phase 120-V through 240-V circuits need GFCI protection, cord-connected or hard-wired (680.21(C)). New in 2020, 680.21(D) says a pump motor replaced for maintenance or repair must also be given GFCI protection.',
    whyNot: {
      0: 'The rule covers direct (hard-wired) connections as well as receptacles.',
      1: '680.21(D), new in 2020, closes that gap: a replacement motor gets GFCI protection.',
      2: 'The rule covers 120-V through 240-V single-phase pump circuits with no ampere cutoff.',
    },
    ref: nec('680.21(D)', 'Pool pump motor replacement'),
  },
  {
    id: 'special-equipment-014', topic: 'special-equipment', kind: 'lookup', difficulty: 1, editions: NEC2020,
    provenance: agy('se-14', 'distractor ranges moved to keep the answer away from position 2'),
    stem: 'At a dwelling with a permanently installed pool, at least one 125-V, 15- or 20-A general-purpose receptacle is required within what distance from the inside wall of the pool?',
    choices: ['6 ft to 20 ft', '10 ft to 20 ft', '10 ft to 25 ft', '15 ft to 25 ft'],
    answer: 0,
    explain: 'The required pool receptacle goes at least 6 ft and no more than 20 ft from the inside wall, no higher than 6 ft 6 in. above the floor, platform or grade serving the pool.',
    whyNot: {
      1: 'Older editions used 10 ft as the minimum; the current minimum is 6 ft.',
      2: 'The maximum distance is 20 ft.',
      3: 'The range is 6 ft to 20 ft.',
    },
    ref: nec('680.22(A)(1)', 'Required pool receptacle'),
  },
  {
    id: 'special-equipment-015', topic: 'special-equipment', kind: 'lookup', difficulty: 2, editions: NEC2020,
    provenance: agy('se-15', 'invented whyNot ("diving-platform" 10 ft) replaced; options in ascending order'),
    stem: 'A new luminaire is installed outdoors, 3 ft horizontally from the inside wall of a pool. Its minimum height above the maximum water level is:',
    choices: ['5 ft', '7 ft 6 in.', '10 ft', '12 ft'],
    answer: 3,
    explain: 'New outdoor luminaires, lighting outlets and ceiling fans over the pool or within 5 ft horizontally of its inside walls must be at least 12 ft above the maximum water level. At 3 ft out, this luminaire is inside that zone.',
    whyNot: {
      0: '5 ft applies to existing luminaires that are rigidly attached and GFCI protected (680.22(B)(3)), not new ones.',
      1: '7 ft 6 in. is allowed only indoors, for totally enclosed GFCI-protected luminaires (680.22(B)(2)).',
      2: '10 ft is a horizontal distance in 680.22(B)(4), not a mounting height.',
    },
    ref: nec('680.22(B)(1)', 'Outdoor pool luminaire height'),
  },
  {
    id: 'special-equipment-016', topic: 'special-equipment', kind: 'lookup', difficulty: 2, editions: NEC2020,
    provenance: agy('se-16', 'stem rewritten (it repeated the code text); options changed to ascending values with the 18-in. standard depth as a distractor'),
    stem: 'A wall-mounted underwater pool luminaire is listed for use at less than the standard depth. What is the shallowest the top of its lens may be below the normal water level?',
    choices: ['4 in.', '6 in.', '12 in.', '18 in.'],
    answer: 0,
    explain: 'The top of a wall-mounted underwater luminaire lens is normally at least 18 in. below the normal water level. A luminaire listed and identified for shallower use may be higher, but never less than 4 in. below the normal water level.',
    whyNot: {
      1: '6 in. is a common guess; listed luminaires may go as shallow as 4 in.',
      2: '12 in. is neither the standard depth nor the minimum.',
      3: '18 in. is the standard depth for luminaires not listed for lesser depths.',
    },
    ref: nec('680.23(A)(5)', 'Wall-mounted underwater luminaire depth'),
  },
  {
    id: 'special-equipment-017', topic: 'special-equipment', kind: 'lookup', difficulty: 2, editions: NEC2020,
    provenance: agy('se-17', 'option pairs ordered; the 6-AWG whyNot now points to a real confusion'),
    stem: 'For pool equipotential bonding, what is the minimum bonding conductor, and how far beyond the inside walls of the pool does the bonded perimeter surface extend?',
    choices: ['6 AWG solid copper; 5 ft', '8 AWG solid copper; 3 ft', '8 AWG solid copper; 5 ft', '8 AWG stranded copper; 3 ft'],
    answer: 1,
    explain: 'Pool equipotential bonding uses solid copper not smaller than 8 AWG (insulated, covered or bare), and the bonded perimeter surface extends 3 ft horizontally beyond the inside walls of the pool.',
    whyNot: {
      0: '6 AWG is a grounding electrode conductor size, and 5 ft is the zone used for luminaires and disconnects.',
      2: 'The conductor is right, but the perimeter surface extends 3 ft, not 5 ft.',
      3: 'Pool bonding conductors must be solid, not stranded.',
    },
    ref: nec('680.26(B)', 'Pool equipotential bonding'),
  },
  {
    id: 'special-equipment-018', topic: 'special-equipment', kind: 'lookup', difficulty: 2, editions: NEC2020,
    provenance: agy('se-18', 'invented whyNot (24 in.² "a fraction of plate electrode area") replaced; distractor values moved'),
    stem: 'A fiberglass pool has no bonded metal parts that touch the pool water. The conductive surface installed to bond the water must expose at least how much surface area to the water at all times?',
    choices: ['6 in.²', '8 in.²', '9 in.²', '12 in.²'],
    answer: 2,
    explain: 'When none of the bonded parts touches the water, an approved corrosion-resistant conductive surface with at least 9 in.² in contact with the water must be installed and connected to the equipotential bonding.',
    whyNot: {
      0: '6 in.² is less than the 9 in.² minimum.',
      1: '8 in.² is less than the 9 in.² minimum.',
      3: '12 in.² is more than needed; the minimum is 9 in.²',
    },
    ref: nec('680.26(C)', 'Pool water bonding'),
  },
  {
    id: 'special-equipment-019', topic: 'special-equipment', kind: 'rule', difficulty: 2, editions: NEC2020,
    provenance: agy('se-19', 'key reworded to the code’s "at least 5 ft away"'),
    stem: 'A hotel installs a whirlpool spa in its fitness room. What does 680.41 require for the emergency shutoff of the recirculation and jet pump motors?',
    choices: [
      'A switch is required only if the spa is outdoors',
      'A switch behind a locked door that only staff can open',
      'A clearly labeled switch, readily accessible to users, within sight of the spa and at least 5 ft from it',
      'A switch within 3 ft of the water, required at every spa including single-family homes',
    ],
    answer: 2,
    explain: 'Spas and hot tubs other than at single-family dwellings need a clearly labeled emergency shutoff or control switch for the recirculation and jet motors. It must be readily accessible to the users, adjacent to and within sight of the spa, and at least 5 ft away.',
    whyNot: {
      0: 'The rule applies indoors and outdoors; only single-family dwellings are exempt.',
      1: 'The users must be able to reach it in an emergency.',
      3: 'Single-family dwellings are exempt, and the switch must be at least 5 ft away.',
    },
    ref: nec('680.41', 'Spa emergency switch'),
  },
  {
    id: 'special-equipment-020', topic: 'special-equipment', kind: 'lookup', difficulty: 1, editions: NEC2020,
    provenance: agy('se-20', 'whyNot on the low-voltage contact limit simplified'),
    stem: 'In a decorative fountain, what is the most voltage between conductors allowed for luminaires and for submersible pumps?',
    choices: [
      '30 V for luminaires; 150 V for pumps',
      '120 V for luminaires; 240 V for pumps',
      '150 V for luminaires; 150 V for pumps',
      '150 V for luminaires; 300 V for pumps',
    ],
    answer: 3,
    explain: 'Fountain luminaires may not be supplied by circuits over 150 V between conductors; submersible pumps and other submersible equipment may run at up to 300 V. So a 277-V pump is allowed, but a 277-V luminaire is not.',
    whyNot: {
      0: 'The low-voltage contact limit decides when GFCI may be omitted; it is not the operating limit.',
      1: 'Those are nominal system voltages, not the code limits.',
      2: '150 V is the luminaire limit; pumps may go to 300 V.',
    },
    ref: nec('680.51(B)', 'Fountain operating voltage'),
  },
  {
    id: 'special-equipment-021', topic: 'special-equipment', kind: 'rule', difficulty: 3, editions: NEC2020,
    provenance: agy('se-21', 'stem and key shortened; metal piping put within 5 ft so bonding clearly applies'),
    stem: 'A hydromassage tub has a double-insulated pump motor, and there is metal piping within 5 ft of the tub. What does Part VII of Article 680 require?',
    choices: [
      'A readily accessible GFCI, and an 8 AWG solid copper bonding jumper long enough for a future replacement motor, terminated to the motor circuit’s equipment grounding conductor',
      'A GFCI receptacle behind a screwed-on tub access panel, with no bonding jumper',
      'An 8 AWG solid copper conductor run back to the service grounding electrode',
      'A 12 AWG stranded copper jumper bonded to the double-insulated motor housing',
    ],
    answer: 0,
    explain: 'The tub is on an individual branch circuit with a readily accessible GFCI (680.71). Metal parts within 5 ft are bonded with 8 AWG or larger solid copper; with a double-insulated motor, the jumper is left long enough for a future replacement motor and terminated to the motor circuit’s EGC (680.74(B)).',
    whyNot: {
      1: 'The GFCI must be readily accessible, and the bonding jumper is still required.',
      2: 'The jumper does not have to go to the service, a panelboard or an electrode.',
      3: 'The jumper is 8 AWG solid, and double-insulated motors are not bonded.',
    },
    ref: nec('680.74(B)', 'Hydromassage bonding jumper'),
  },

  // ---- PV systems and fire pumps: Articles 690, 695 ------------------------------------------------
  {
    id: 'special-equipment-022', topic: 'special-equipment', kind: 'lookup', difficulty: 1, editions: NEC2020,
    provenance: agy('se-22', 'whyNot on 156% clarified'),
    stem: 'A PV system’s interactive inverter has a continuous output current rating of 24 A. Before any correction or adjustment factors, the inverter output circuit conductors must have an ampacity of at least:',
    choices: ['24 A', '30 A', '37.5 A', '48 A'],
    answer: 1,
    explain: 'The maximum current of an inverter output circuit is its continuous output current rating, and PV currents are continuous, so the conductors need 125% before correction and adjustment: 24 A × 1.25 = 30 A.',
    whyNot: {
      0: '24 A leaves out the 125% continuous-current step.',
      2: '37.5 A applies 125% twice (156%); that is for dc PV source circuits figured from short-circuit current, not inverter output.',
      3: '48 A is 200%, which no PV rule requires.',
    },
    ref: nec('690.8(B)(1)', 'PV conductor ampacity, 125%'),
  },
  {
    id: 'special-equipment-023', topic: 'special-equipment', kind: 'lookup', difficulty: 2, editions: NEC2020,
    provenance: agy('se-23', 'option pairs ordered'),
    stem: 'When rapid shutdown of a rooftop PV system is started, controlled conductors outside the array boundary must drop to no more than what voltage, within what time?',
    choices: ['30 V within 10 seconds', '30 V within 30 seconds', '50 V within 60 seconds', '80 V within 30 seconds'],
    answer: 1,
    explain: 'Outside the array boundary (more than 1 ft from the array), and inside the building more than 3 ft from the point of entry, controlled conductors must be at 30 V or less within 30 seconds. Inside the boundary the limit is 80 V within 30 seconds, or a listed PV hazard control system.',
    whyNot: {
      0: '10 seconds was the 2014 NEC time; it has been 30 seconds since 2017.',
      2: 'Neither 50 V nor 60 seconds is a rapid shutdown value.',
      3: '80 V within 30 seconds is the limit inside the array boundary (690.12(B)(2)).',
    },
    ref: nec('690.12(B)(1)', 'Rapid shutdown outside the array boundary'),
  },
  {
    id: 'special-equipment-024', topic: 'special-equipment', kind: 'rule', difficulty: 3, editions: NEC2020,
    provenance: agy('se-24', 'kind changed from theory to rule; reference trimmed to 695.4(B)(2); whyNot subsection citations removed'),
    stem: 'A fire pump is supplied from the utility through one disconnect and overcurrent device ahead of the controller. That overcurrent device must be selected or set to carry indefinitely:',
    choices: [
      '125% of the fire pump full-load current plus 100% of the jockey pump full-load current',
      '250% of the fire pump full-load current',
      '150% of the fire pump full-load current, with overloads set at 115%',
      'The sum of the locked-rotor currents of the fire pump and jockey pump motors, plus the full-load current of the accessory equipment',
    ],
    answer: 3,
    explain: 'A fire pump is meant to run until it fails rather than trip off during a fire. So the overcurrent device ahead of it must carry the locked-rotor current of the fire pump and pressure maintenance (jockey) pump motors, plus the full-load current of the fire pump accessories, indefinitely.',
    whyNot: {
      0: '125% of the full-load currents is the fire pump conductor sizing rule (695.6), not the overcurrent device rule.',
      1: '250% is the inverse-time breaker value for ordinary motors (Table 430.52); it would trip on a locked rotor.',
      2: 'Fire pump circuits do not get overload protection.',
    },
    ref: nec('695.4(B)(2)', 'Fire pump overcurrent device selection'),
  },
  {
    id: 'special-equipment-025', topic: 'special-equipment', kind: 'rule', difficulty: 3, editions: NEC2020,
    provenance: agy('se-25', 'key reworded to cover the listed fire-resistive systems as well as concrete'),
    stem: 'Fire pump feeder conductors on the load side of the final disconnect must be routed through the building to the fire pump room. Besides keeping them independent of all other wiring, how must they be protected?',
    choices: [
      'In rigid metal conduit above the suspended ceiling, supported every 5 ft',
      'Encased in at least 2 in. of concrete, or in a listed system with at least a 2-hour fire rating',
      'In Schedule 80 PVC inside a 1-hour rated corridor wall',
      'In liquidtight flexible metal conduit covered with 1 in. of plaster',
    ],
    answer: 1,
    explain: 'Inside a building, fire pump feeders must be protected from fire for 2 hours: encased in at least 2 in. of concrete, or run as a listed fire-resistive cable system, a listed electrical circuit protective system, or in a dedicated 2-hour enclosure. The same section exempts the parts inside the electrical room where they start and inside the fire pump room.',
    whyNot: {
      0: 'Plain RMC in a ceiling has no 2-hour fire rating.',
      2: 'Neither PVC nor a 1-hour wall gives the 2-hour protection.',
      3: 'LFMC in plaster is not one of the accepted methods.',
    },
    ref: nec('695.6(A)(2)', 'Fire pump feeders inside buildings'),
  },

  // ---- Added in review ------------------------------------------------------------------------------
  {
    id: 'special-equipment-026', topic: 'special-equipment', kind: 'lookup', difficulty: 2, editions: NEC2020,
    provenance: ours('added: the spa receptacle rule (680.43) was on the watch list and not drafted'),
    stem: 'An indoor hot tub is installed in a house’s sunroom. At least one 125-V, 15- or 20-A general-purpose receptacle must be installed within what distance from the inside wall of the hot tub?',
    choices: ['5 ft to 10 ft', '6 ft to 10 ft', '6 ft to 20 ft', '10 ft to 20 ft'],
    answer: 1,
    explain: 'For an indoor spa or hot tub, at least one 125-V, 15- or 20-A receptacle on a general-purpose branch circuit goes 6 ft to 10 ft from the inside wall, measured horizontally.',
    whyNot: {
      0: 'Receptacles must be at least 6 ft from the inside wall of the spa.',
      2: '6 ft to 20 ft is the required receptacle for a permanently installed pool at a dwelling (680.22(A)(1)).',
      3: '10 ft is the upper limit for the spa receptacle, not the lower one.',
    },
    ref: nec('680.43(A)', 'Indoor spa receptacles'),
  },
]
