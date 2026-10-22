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
    provenance: agy('se-01', 'option "20 A, which may also supply outdoor receptacles" half-repeated the key and was replaced by 40 A; the neon whyNot no longer cites a subsection (2020 moved the rating rule); reworded in the 2026-10-22 similarity pass (stem echoed the code sentence)'),
    stem: 'In a new strip mall, every store entrance gets an outlet for the tenant’s sign. The circuit to that outlet feeds nothing else. What is the smallest rating that circuit may have?',
    choices: ['15 A', '20 A', '30 A', '40 A'],
    answer: 1,
    explain: 'A commercial building or occupancy that people walk into needs at least one sign outlet at each tenant entrance. Its circuit must be 20 A or more and carry no other load. Count it at 1,200 VA in the load calculation (220.14(F)).',
    whyNot: {
      0: '15 A is fine for general lighting, but a sign circuit needs at least 20 A.',
      2: '30 A is the top rating for a circuit feeding neon tubing (600.5), not the minimum here.',
      3: 'No sign rule uses 40 A; the floor is 20 A.',
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
    provenance: agy('se-05', 'options reordered; reworded in the 2026-10-22 similarity pass'),
    stem: 'An office tower has a bank of three passenger elevators. Each car has lights, a receptacle, a fan and a backup light source. What is the right way to feed those loads?',
    choices: [
      'A single 20-A circuit shared by all three cars in the bank',
      'Downstream of the car’s GFCI receptacle, so one device guards it all',
      'A circuit of its own for each car, with required lights not behind a GFCI',
      'The same circuit that feeds the car’s heating and air-conditioning unit',
    ],
    answer: 2,
    explain: 'One car, one circuit: the lights, receptacles, ventilation and auxiliary lighting power source in a car share a branch circuit that serves that car alone. Keep the required car lighting off the load side of any GFCI, so a trip at the receptacle never leaves riders standing in the dark.',
    whyNot: {
      0: 'Even in a bank of cars, each car needs a circuit of its own.',
      1: 'Required car lighting may not be fed from the load side of a GFCI.',
      3: 'Car heating and air-conditioning have a separate circuit of their own (620.22(B)).',
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
    provenance: agy('se-08', 'explanation trimmed; reworded in the 2026-10-22 similarity pass'),
    stem: 'A building owner wants a 50-A, 125/250-V receptacle on a column in the office parking deck so tenants can plug in their EV chargers. Under the 2020 NEC, how must that receptacle be protected?',
    choices: [
      'It needs nothing; at 50 A and 250 V it is outside the GFCI rules',
      'With a GFCI, but only when the space is out in the weather',
      'With equipment ground-fault protection (GFPE) at 30 mA',
      'With a GFCI that protects the people using it',
    ],
    answer: 3,
    explain: 'In the 2020 NEC, 625.54 calls for personnel GFCI on every receptacle put in for EV charging, on top of 210.8, no matter the voltage, the rating or whether it is indoors. The ampere and voltage limits in 210.8 do not excuse it.',
    whyNot: {
      0: '625.54 sets no voltage or ampere limit for EV charging receptacles.',
      1: 'Indoors or outdoors, the rule is the same.',
      2: 'The rule asks for GFCI that protects people, not 30-mA equipment protection.',
    },
    ref: nec('625.54', 'GFCI for EV charging receptacles'),
  },
  {
    id: 'special-equipment-009', topic: 'special-equipment', kind: 'lookup', difficulty: 1, editions: NEC2020,
    provenance: agy('se-09', 'whyNot corrected (175% is the Table 430.52 dual-element fuse value, not inverse-time breaker); options in ascending order; I1max noted; reworded in the 2026-10-22 similarity pass'),
    stem: 'A fab shop adds one arc welder with its own breaker. As a share of the welder’s rated primary current, how big can that breaker be?',
    choices: ['125%', '175%', '200%', '300%'],
    answer: 2,
    explain: 'Protection for an arc welder can go up to 200% of I1max. If the nameplate does not give I1max, use 200% of the rated primary current. Resistance welders are allowed 300% (630.32(A)).',
    whyNot: {
      0: '125% is the step for continuous loads, not the welder limit.',
      1: '175% is the Table 430.52 value for time-delay (dual-element) fuses on motors.',
      3: '300% belongs to resistance welders, not arc welders.',
    },
    ref: nec('630.12(A)', 'Arc welder overcurrent protection'),
  },
  {
    id: 'special-equipment-010', topic: 'special-equipment', kind: 'rule', difficulty: 2, editions: NEC2020,
    provenance: agy('se-10', 'stem no longer puts the controls "at the principal exit doors" (older wording; 2020 location wording not verified); reworded in the 2026-10-22 similarity pass (stem echoed the code wording)'),
    stem: 'A server room is wired under the special rules of Article 645. One approved control kills power to every piece of electronic equipment in the room, and a second, similar control is also required. What does the second one have to do?',
    choices: [
      'Turn off the egress lighting for the whole floor',
      'Open the building’s main service disconnect',
      'Shut down the HVAC that serves only that room and close the required fire/smoke dampers',
      'Kill only the underfloor receptacle circuits and leave the UPS outputs on',
    ],
    answer: 2,
    explain: 'Article 645’s easier wiring rules come with a price: one approved control to cut power to all the electronic equipment in the room, and a similar one to shut down the room’s own HVAC and close the required fire/smoke dampers. A single control may do both jobs.',
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
    provenance: agy('se-13', 'options reordered; reworded in the 2026-10-22 similarity pass'),
    stem: 'A homeowner’s pool pump motor burned out. It runs on 240 V, single phase, wired straight to a plain two-pole breaker with no GFCI. You are putting in the new motor under the 2020 NEC. What does the code ask of you?',
    choices: [
      'Nothing, since a hard-wired motor needs no GFCI',
      'Nothing, since a repair replacement is exempt',
      'A GFCI only for a 120-V motor or a circuit of 20 A or less',
      'A GFCI protecting the new motor',
    ],
    answer: 3,
    explain: 'The 2020 NEC closed the repair loophole: under 680.21(D), a pump motor you swap out for upkeep or repair has to end up GFCI protected. The base rule, 680.21(C), already covered pump motors fed at 120 V through 240 V single phase, plugged in or hard-wired.',
    whyNot: {
      0: 'Hard-wired pump motors are covered the same as plug-in ones.',
      1: 'That gap is what 680.21(D) closed in 2020; the new motor gets GFCI.',
      2: 'Single-phase pump circuits from 120 V to 240 V are all covered, at any ampere rating.',
    },
    ref: nec('680.21(D)', 'Pool pump motor replacement'),
  },
  {
    id: 'special-equipment-014', topic: 'special-equipment', kind: 'lookup', difficulty: 1, editions: NEC2020,
    provenance: agy('se-14', 'distractor ranges moved to keep the answer away from position 2; reworded in the 2026-10-22 similarity pass'),
    stem: 'A family puts a permanent pool in behind their house. The code wants at least one general-purpose 125-V receptacle, 15 or 20 A, near it. Measured from the pool’s inside wall, where does that receptacle go?',
    choices: ['6 ft to 20 ft', '10 ft to 20 ft', '10 ft to 25 ft', '15 ft to 25 ft'],
    answer: 0,
    explain: 'The window is 6 ft to 20 ft out from the inside wall. Mount it no higher than 6 ft 6 in. over the floor, platform or grade that serves the pool.',
    whyNot: {
      1: '10 ft was the minimum in older editions; today it is 6 ft.',
      2: 'It can be no farther than 20 ft from the pool.',
      3: 'The allowed band is 6 ft to 20 ft.',
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
    provenance: agy('se-17', 'option pairs ordered; the 6-AWG whyNot now points to a real confusion; reworded in the 2026-10-22 similarity pass'),
    stem: 'You are bonding the deck and steel around a new pool. What is the smallest bonding wire allowed, and how wide a band of the surrounding surface gets bonded, measured out from the pool’s inside walls?',
    choices: ['6 AWG solid copper; 5 ft', '8 AWG solid copper; 3 ft', '8 AWG solid copper; 5 ft', '8 AWG stranded copper; 3 ft'],
    answer: 1,
    explain: 'The surface around the pool gets bonded for 3 ft out from the inside walls. The bonding wire is solid copper, 8 AWG at the smallest, and it may be bare, covered or insulated.',
    whyNot: {
      0: '6 AWG is a size you see on electrode conductors, and 5 ft is the distance used for pool lights and disconnects.',
      2: '8 AWG solid is right, but the bonded surface reaches 3 ft, not 5 ft.',
      3: 'Stranded wire is not allowed; pool bonding wire is solid.',
    },
    ref: nec('680.26(B)', 'Pool equipotential bonding'),
  },
  {
    id: 'special-equipment-018', topic: 'special-equipment', kind: 'lookup', difficulty: 2, editions: NEC2020,
    provenance: agy('se-18', 'invented whyNot (24 in.² "a fraction of plate electrode area") replaced; distractor values moved; reworded in the 2026-10-22 similarity pass'),
    stem: 'In a fiberglass pool, none of the bonded metal touches the water. You add a corrosion-resistant conductive part so the water itself is tied into the bonding. At minimum, how much of its surface area must be wet at all times?',
    choices: ['6 in.²', '8 in.²', '9 in.²', '12 in.²'],
    answer: 2,
    explain: 'If nothing bonded touches the water, the water still has to be bonded. That takes an approved, corrosion-resistant conductive part with 9 in.² or more touching the water, tied into the equipotential bonding.',
    whyNot: {
      0: '6 in.² falls short of the 9 in.² minimum.',
      1: '8 in.² is still under 9 in.²',
      3: '12 in.² would work, but only 9 in.² is required.',
    },
    ref: nec('680.26(C)', 'Pool water bonding'),
  },
  {
    id: 'special-equipment-019', topic: 'special-equipment', kind: 'rule', difficulty: 2, editions: NEC2020,
    provenance: agy('se-19', 'key reworded to the code’s "at least 5 ft away"; reworded in the 2026-10-22 similarity pass'),
    stem: 'A hotel puts a hot tub in its guest gym. If someone gets in trouble, people need a fast way to kill the jets and the circulating pump. What does 680.41 call for?',
    choices: [
      'Only an outdoor spa needs a shutoff switch',
      'A switch in a locked room that only staff can enter',
      'A labeled switch users can reach, in view of the tub, 5 ft or more away',
      'A switch within 3 ft of the water, at every spa, homes included',
    ],
    answer: 2,
    explain: 'Put the switch where the people using the tub can get to it quickly: next to the tub, in plain view of it, but no closer than 5 ft. Label it clearly. It shuts down the circulation and jet motors. Only spas at single-family homes are left out of the rule.',
    whyNot: {
      0: 'Indoor and outdoor spas are both covered; only single-family homes are left out.',
      1: 'The people in and around the tub have to be able to reach it in an emergency.',
      3: 'Single-family homes are exempt, and the switch has to be at least 5 ft from the tub.',
    },
    ref: nec('680.41', 'Spa emergency switch'),
  },
  {
    id: 'special-equipment-020', topic: 'special-equipment', kind: 'lookup', difficulty: 1, editions: NEC2020,
    provenance: agy('se-20', 'whyNot on the low-voltage contact limit simplified; reworded in the 2026-10-22 similarity pass'),
    stem: 'A city plaza fountain has underwater lights and submersible pumps. What is the highest voltage between conductors that each one may run on?',
    choices: [
      'Lights 30 V; pumps 150 V',
      'Lights 120 V; pumps 240 V',
      'Lights 150 V; pumps 150 V',
      'Lights 150 V; pumps 300 V',
    ],
    answer: 3,
    explain: 'A 277-V pump is allowed in a fountain, but a 277-V light is not. Pumps and other submersible equipment may run at up to 300 V between conductors; the circuits feeding the lights stop at 150 V.',
    whyNot: {
      0: 'The low-voltage contact limit tells you when GFCI can be left off; it is not the operating cap.',
      1: 'Those are common system voltages, not the limits in the code.',
      2: 'Lights stop at 150 V, but pumps can go to 300 V.',
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
    provenance: agy('se-22', 'whyNot on 156% clarified; reworded in the 2026-10-22 similarity pass'),
    stem: 'A homeowner’s grid-tied solar inverter is rated 24 A of continuous output. Before you apply any correction or adjustment factors, what is the least ampacity the wire leaving the inverter may have?',
    choices: ['24 A', '30 A', '37.5 A', '48 A'],
    answer: 1,
    explain: 'Start with the inverter’s continuous output rating; that is the circuit’s maximum current. PV current counts as continuous, so the wire needs 125% of it before any derating: 24 A × 1.25 = 30 A.',
    whyNot: {
      0: '24 A leaves out the 125% for continuous current.',
      2: '37.5 A is 125% taken twice (156%), which belongs to dc PV source circuits based on short-circuit current, not to an inverter output.',
      3: '48 A is double the rating; no PV rule asks for 200%.',
    },
    ref: nec('690.8(B)(1)', 'PV conductor ampacity, 125%'),
  },
  {
    id: 'special-equipment-023', topic: 'special-equipment', kind: 'lookup', difficulty: 2, editions: NEC2020,
    provenance: agy('se-23', 'option pairs ordered; reworded in the 2026-10-22 similarity pass'),
    stem: 'A firefighter hits the rapid shutdown switch for the solar array on a building’s roof. The controlled conductors that run beyond the array boundary have to fall to what voltage, and how fast?',
    choices: ['30 V within 10 seconds', '30 V within 30 seconds', '50 V within 60 seconds', '80 V within 30 seconds'],
    answer: 1,
    explain: 'Once shutdown starts, you have 30 seconds to bring every controlled conductor beyond the array boundary (1 ft out from the array) down to 30 V or less. The same goes for those inside the building more than 3 ft past where they come in. Within the boundary the target is 80 V in 30 seconds, or a listed PV hazard control system.',
    whyNot: {
      0: '10 seconds was the 2014 rule; it has been 30 seconds since the 2017 edition.',
      2: 'No rapid shutdown limit uses 50 V or 60 seconds.',
      3: '80 V in 30 seconds is the limit inside the array boundary (690.12(B)(2)).',
    },
    ref: nec('690.12(B)(1)', 'Rapid shutdown outside the array boundary'),
  },
  {
    id: 'special-equipment-024', topic: 'special-equipment', kind: 'rule', difficulty: 3, editions: NEC2020,
    provenance: agy('se-24', 'kind changed from theory to rule; reference trimmed to 695.4(B)(2); whyNot subsection citations removed; reworded in the 2026-10-22 similarity pass'),
    stem: 'A fire pump gets its normal power from the utility, through a single disconnect and overcurrent device on the line side of the controller. What current must that device be able to carry with no time limit?',
    choices: [
      'Fire pump full-load current × 125%, plus the jockey pump full-load current',
      'Fire pump full-load current × 250%',
      'Fire pump full-load current × 150%, with overloads set at 115%',
      'Fire and jockey pump locked-rotor currents, plus accessory full-load current',
    ],
    answer: 3,
    explain: 'In a fire, we would rather the pump run until it burns up than trip off. So the device ahead of it has to hold, with no time limit, the locked-rotor current of the fire pump motor and the pressure maintenance (jockey) pump motor added together, plus the full-load current of the pump’s accessories.',
    whyNot: {
      0: '125% of full-load current is how you size fire pump conductors (695.6), not the overcurrent device.',
      1: '250% is the Table 430.52 inverse-time breaker value for ordinary motors; a locked rotor would trip it.',
      2: 'Fire pump circuits get no overload protection.',
    },
    ref: nec('695.4(B)(2)', 'Fire pump overcurrent device selection'),
  },
  {
    id: 'special-equipment-025', topic: 'special-equipment', kind: 'rule', difficulty: 3, editions: NEC2020,
    provenance: agy('se-25', 'key reworded to cover the listed fire-resistive systems as well as concrete; reworded in the 2026-10-22 similarity pass (stem echoed the code wording)'),
    stem: 'The feeder to a fire pump leaves the main electrical room and has to cross the building to reach the pump room. Apart from keeping it separate from all other wiring, how must it be protected along the way?',
    choices: [
      'In rigid metal conduit above the suspended ceiling, supported every 5 ft',
      'Buried in at least 2 in. of concrete, or run in a listed system rated for at least 2 hours of fire',
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
    provenance: ours('added: the spa receptacle rule (680.43) was on the watch list and not drafted; reworded in the 2026-10-22 similarity pass (stem echoed the code wording)'),
    stem: 'A homeowner puts a hot tub in a glassed-in sunroom, and you have to add at least one 125-V, 15- or 20-A general-purpose receptacle near it. Measured from the tub’s inside wall, where may that receptacle go?',
    choices: ['5 ft to 10 ft', '6 ft to 10 ft', '6 ft to 20 ft', '10 ft to 20 ft'],
    answer: 1,
    explain: 'Indoors, a spa or hot tub gets at least one 125-V, 15- or 20-A receptacle on a general-purpose branch circuit, set between 6 ft and 10 ft from its inside wall, measured across the floor.',
    whyNot: {
      0: 'Receptacles must be at least 6 ft from the inside wall of the spa.',
      2: '6 ft to 20 ft is the required receptacle for a permanently installed pool at a dwelling (680.22(A)(1)).',
      3: '10 ft is the upper limit for the spa receptacle, not the lower one.',
    },
    ref: nec('680.43(A)', 'Indoor spa receptacles'),
  },
]
