/**
 * Special Conditions and Communications, PSI area "Special Conditions" (NEC Articles 700-708 and
 * 720-830): emergency, legally required and optional standby systems, interconnected sources and
 * energy storage, COPS, Class 1/2/3 circuits, fire alarm circuits, communications, antennas and CATV.
 * Drafted by Antigravity (Gemini 4, batch sc) and checked one by one by Claude against the 2020 NEC;
 * one draft was dropped and two questions were added. Review trail: docs/reviews/bank-special.md (each
 * note starts with the draft id). Every item is tagged 2020 only: Chapters 7 and 8 were reorganized in
 * 2023 and 2026 (Article 725 split, Article 720 removed, Chapter 8 narrowed), so the locations differ.
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
  // ---- Emergency systems: Article 700 ---------------------------------------------------------------
  {
    id: 'special-conditions-001', topic: 'special-conditions', kind: 'lookup', difficulty: 1, editions: NEC2020,
    provenance: agy('sc-01', 'invented whyNot (15 s "generator warm-up timers") replaced'),
    stem: 'When the normal supply fails, an Article 700 emergency system must have power available to its loads within no more than:',
    choices: ['10 seconds', '15 seconds', '30 seconds', '60 seconds'],
    answer: 0,
    explain: 'Emergency systems feed life-safety loads such as egress lighting and exit signs, so power must be available within the time the application needs and never more than 10 seconds. Legally required standby systems get up to 60 seconds (701.12).',
    whyNot: {
      1: '15 seconds is not a time limit in Article 700 or 701.',
      2: '30 seconds is three times the emergency limit.',
      3: '60 seconds is the limit for legally required standby systems (701.12), not emergency systems.',
    },
    ref: nec('700.12', 'Emergency power within 10 seconds'),
  },
  {
    id: 'special-conditions-002', topic: 'special-conditions', kind: 'rule', difficulty: 1, editions: NEC2020,
    provenance: agy('sc-02', 'key reworded; options reordered; reworded in the 2026-10-22 similarity pass'),
    stem: 'You are pulling the circuits that carry emergency power out to a building’s egress lights. Apart from a few listed cases, how do they have to be kept from the everyday light and power wiring?',
    choices: [
      'They may share a raceway with it if every conductor has 600-V insulation',
      'They may share a box with it if held 2 in. away from its conductors',
      'They need raceways, cables, boxes and cabinets of their own',
      'They may be bundled with it if the emergency conductors are taped orange',
    ],
    answer: 2,
    explain: 'Emergency circuits stay apart from every other circuit and piece of equipment, so a fault or a fire in the normal wiring cannot also knock out the life-safety loads. 700.10(B) allows only a handful of exceptions, such as inside transfer equipment enclosures and in exit or emergency luminaires fed from two sources.',
    whyNot: {
      0: 'Equal insulation ratings let ordinary circuits share a raceway (300.3(C)(1)); 700.10(B) takes that away for emergency circuits.',
      1: 'A 2-in. gap is the Class 2 and Class 3 separation (725.136), not a way to mix emergency and normal wiring.',
      3: 'Orange tape only marks the emergency conductors; it does not stand in for keeping them separate.',
    },
    ref: nec('700.10(B)', 'Emergency wiring kept independent'),
  },
  {
    id: 'special-conditions-003', topic: 'special-conditions', kind: 'rule', difficulty: 2, editions: NEC2020,
    provenance: agy('sc-03', 'reference corrected from 700.5(C) (automatic transfer switches) to 700.5(D) (use); reworded in the 2026-10-22 similarity pass'),
    stem: 'An office building’s single generator has room for both the egress lighting on the emergency system (Article 700) and the HVAC on optional standby (Article 702). How do you lay out the transfer switches?',
    choices: [
      'Sizing the generator at 125% of the total lets one automatic switch take both loads',
      'The emergency loads get their own transfer switch, and that switch feeds nothing but them',
      'A single manual switch can carry both loads if building maintenance watches over it',
      'A single automatic switch can carry both loads if separate panels split them on its load side',
    ],
    answer: 1,
    explain: 'Sharing a generator between system types is allowed. Sharing the emergency transfer switch is not: it may carry only emergency loads. So the HVAC on optional standby goes through a transfer switch of its own.',
    whyNot: {
      0: 'Oversizing the generator changes nothing here. The emergency transfer switch still carries only emergency loads.',
      2: 'Emergency transfer has to be automatic (700.5(A)), and even then the switch carries emergency loads only.',
      3: 'Separate panels downstream do not help. The HVAC would still pass through the emergency transfer switch.',
    },
    ref: nec('700.5(D)', 'Emergency transfer equipment use'),
  },
  {
    id: 'special-conditions-004', topic: 'special-conditions', kind: 'rule', difficulty: 3, editions: NEC2020,
    provenance: agy('sc-04', 'stem states the general rule first; options reordered; reworded in the 2026-10-22 similarity pass'),
    stem: 'Overcurrent devices on an emergency system normally have to be selectively coordinated, so a fault opens only the device nearest to it. For two of those devices in series, when is coordination between the pair not needed?',
    choices: [
      'When neither device is rated over 100 A',
      'When a breaker sits upstream and a fuse sits downstream',
      'When the downstream panel sees under 10,000 A of short-circuit current',
      'When the upstream device feeds nothing except the downstream one',
    ],
    answer: 3,
    explain: 'Coordination is there so a fault darkens as little as possible. If the upstream device feeds only the downstream one, it makes no difference which of the two opens: the same loads go out either way. That pair is exempt; every other emergency device still has to coordinate.',
    whyNot: {
      0: 'Small ratings earn no exemption.',
      1: 'Pairing a breaker with a fuse affects how you get coordination, not whether you need it.',
      2: 'A low fault current earns no exemption either.',
    },
    ref: nec('700.32', 'Selective coordination (series exception)'),
  },
  {
    id: 'special-conditions-005', topic: 'special-conditions', kind: 'rule', difficulty: 2, editions: NEC2020,
    provenance: agy('sc-05', 'stem premise fixed (single-lamp luminaires are allowed when coverage overlaps); the 277-V distractor replaced'),
    stem: 'Emergency lighting for an exit corridor must be designed and installed so that:',
    choices: [
      'Every emergency luminaire is controlled by its own wall switch',
      'The failure of any single lamp or lighting element cannot leave the corridor in total darkness',
      'Every emergency luminaire has its own battery in addition to the generator',
      'Alternate luminaires are on the two halves of a multiwire branch circuit',
    ],
    answer: 1,
    explain: 'One burned-out lamp must never leave a space that needs emergency illumination completely dark, so use overlapping luminaires or luminaires with more than one lamp. Emergency lighting branch circuits may not be part of a multiwire branch circuit (700.19).',
    whyNot: {
      0: 'Switching of emergency lighting is restricted (700.21); local switches are not the reliability rule.',
      2: 'Unit equipment is one permitted source, not a requirement on top of a generator.',
      3: 'Emergency branch circuits may not be part of a multiwire branch circuit (700.19).',
    },
    ref: nec('700.16', 'Emergency illumination reliability'),
  },

  // ---- Legally required and optional standby: Articles 701, 702 -------------------------------------
  {
    id: 'special-conditions-006', topic: 'special-conditions', kind: 'lookup', difficulty: 1, editions: NEC2020,
    provenance: agy('sc-06', 'options in ascending order; rewritten after the 2026-10-22 similarity screen (same four option values as a prep-site question on the emergency limit)'),
    stem: 'At a sewage pumping station, the pumps run on a legally required standby system. When the utility fails, what is the longest the code allows before standby power reaches them?',
    choices: ['10 seconds', '60 seconds', '3 minutes', '5 minutes'],
    answer: 1,
    explain: 'Legally required standby loads, such as sewage disposal, smoke removal and some industrial processes, have to be picked up within 60 seconds. They do not light the way out of the building, so they get more time than the 10 seconds an emergency system has.',
    whyNot: {
      0: '10 seconds is the deadline for emergency systems (700.12).',
      2: '3 minutes is three times the 60-second limit.',
      3: '5 minutes is five times the 60-second limit.',
    },
    ref: nec('701.12', 'Legally required standby within 60 seconds'),
  },
  {
    id: 'special-conditions-007', topic: 'special-conditions', kind: 'rule', difficulty: 2, editions: NEC2020,
    provenance: agy('sc-07', 'whyNots trimmed; reworded in the 2026-10-22 similarity pass'),
    stem: 'A homeowner wants an optional standby generator that takes over on its own through an automatic transfer switch, but no load-management controller. What does that mean for the size of the generator?',
    choices: [
      'Half the service rating or more',
      'Big enough for just the loads the owner expects to run at one time',
      'The biggest motor plus 25% of the lighting load',
      'Big enough to carry everything the transfer switch hands over',
    ],
    answer: 3,
    explain: 'An automatic switch moves every load on it to the generator, even when nobody is home to turn things off. With nothing to shed load, the generator has to handle all of it, calculated by Article 220 or another approved method. Only with manual transfer may the owner pick which loads to run (702.4(B)(1)).',
    whyNot: {
      0: 'Generator size comes from the calculated load it picks up, not a fraction of the service.',
      1: 'Picking the loads is for manual or non-automatic transfer only (702.4(B)(1)).',
      2: 'No generator sizing rule works that way.',
    },
    ref: nec('702.4(B)(2)', 'Optional standby capacity, automatic transfer'),
  },
  {
    id: 'special-conditions-008', topic: 'special-conditions', kind: 'rule', difficulty: 2, editions: NEC2020,
    provenance: agy('sc-08', 'options reordered'),
    stem: 'A power inlet is installed on a building for connecting a portable generator to an optional standby system. What must the warning sign at the inlet state?',
    choices: [
      'Whether the inlet is for a separately derived (bonded neutral) or nonseparately derived (floating neutral) generator',
      'The generator’s kW rating and fuel type',
      'The distance from the inlet to the grounding electrode',
      'The minimum cord size for the inlet',
    ],
    answer: 0,
    explain: 'Whether the generator’s neutral should be bonded depends on whether the transfer equipment switches the neutral. The sign at the inlet tells the user which kind of generator, bonded neutral or floating neutral, the system is wired for.',
    whyNot: {
      1: 'The NEC does not require the generator rating or fuel type on this sign.',
      2: 'Electrode distance is not part of the inlet sign.',
      3: 'The inlet’s configuration sets the cord; the sign is about the neutral.',
    },
    ref: nec('702.7(C)', 'Power inlet warning sign'),
  },

  // ---- Interconnected sources, ESS, COPS: Articles 705, 706, 708 -----------------------------------
  {
    id: 'special-conditions-009', topic: 'special-conditions', kind: 'lookup', difficulty: 3, editions: NEC2020,
    provenance: agy('sc-09', 'reference narrowed from 705.12(B) to 705.12(B)(3)(2); options in ascending order; worked example added'),
    stem: 'A PV inverter is connected through a backfed breaker at the end of a panelboard busbar opposite the main breaker. Under the 2020 NEC, the main breaker rating plus 125% of the inverter output current may not exceed what percentage of the busbar rating?',
    choices: ['100%', '120%', '125%', '150%'],
    answer: 1,
    explain: 'With the two sources at opposite ends, their currents do not add along the whole bar, so the sum may reach 120% of the busbar rating (705.12(B)(3)(2) in 2020; 705.12(B)(2)(3)(b) in 2017). On a 200-A bus with a 200-A main that leaves 40 A, enough for a 32-A inverter (32 A × 1.25 = 40 A).',
    whyNot: {
      0: '100% is the limit when the backfed breaker may be anywhere on the bus (705.12(B)(3)(1)).',
      2: '125% is the multiplier on the inverter current, not the busbar limit.',
      3: '150% is beyond the 120% limit.',
    },
    ref: nec('705.12(B)(3)(2)', 'Busbar 120% rule'),
  },
  {
    id: 'special-conditions-010', topic: 'special-conditions', kind: 'rule', difficulty: 1, editions: NEC2020,
    provenance: agy('sc-10', 'stem shortened; options reordered; reworded in the 2026-10-22 similarity pass'),
    stem: 'A customer’s on-site generating equipment runs in parallel with the utility. Under the 2020 rules in Article 705, which conductors does its output disconnect have to open, and where do you put it?',
    choices: [
      'Both the grounded and the ungrounded conductors; in an electrical room kept locked',
      'A single conductor, whichever is at the highest potential to ground; 50 ft or less from the inverter',
      'Every conductor, the equipment grounding conductor too; outside the building',
      'Every ungrounded conductor at once; in a readily accessible spot',
    ],
    answer: 3,
    explain: 'One operation of the handle has to open every ungrounded conductor of the source output, and the switch has to be readily accessible so the source can be cut off fast. A disconnect never opens an equipment grounding conductor.',
    whyNot: {
      0: 'The grounded conductor is not normally switched, and a room behind a lock is not readily accessible.',
      1: 'Open just one and the rest stay live.',
      2: 'The equipment grounding conductor is never switched; opening it would break the fault path.',
    },
    ref: nec('705.20', 'Power source disconnecting means'),
  },
  {
    id: 'special-conditions-011', topic: 'special-conditions', kind: 'rule', difficulty: 2, editions: NEC2020,
    provenance: agy('sc-11', 'whyNots trimmed; reworded in the 2026-10-22 similarity pass'),
    stem: 'You are setting a battery energy storage system (ESS) in the garage of a one-family home, working to the 2020 NEC. Where does its disconnect, or a remote control that operates the disconnect, need to go?',
    choices: [
      'On a garage wall, 6 ft or less from the battery cabinet',
      'Beside the panelboard inside the house',
      'Outside the house, in a readily accessible place',
      'Down in the basement, where the inverter is in sight',
    ],
    answer: 2,
    explain: 'The 2020 NEC added this for one- and two-family dwellings: the ESS disconnect, or a remote control for it, goes outdoors where it is readily accessible. Firefighters can then shut the system down without going inside. Someone used to the 2017 rules might put it only next to the ESS.',
    whyNot: {
      0: 'A garage spot near the batteries is still indoors, and 2020 wants it outside.',
      1: 'A spot by the indoor panel still makes responders go inside.',
      3: 'The basement is indoors; the 2020 rule puts it outside.',
    },
    ref: nec('706.15(A)', 'ESS disconnect at dwellings'),
  },
  {
    id: 'special-conditions-012', topic: 'special-conditions', kind: 'lookup', difficulty: 2, editions: NEC2020,
    provenance: agy('sc-12', 'reference corrected from 708.20(F) (generator sets) to 708.22(C) (duration of operation); stem asks about the alternate source; options rebuilt'),
    stem: 'The alternate power source for a Critical Operations Power System (COPS) must be able to run the critical operations area at full load for at least:',
    choices: ['2 hours', '24 hours', '48 hours', '72 hours'],
    answer: 3,
    explain: 'COPS serve places such as 911 centers and emergency operations centers that must keep working through a long disaster, so the alternate source must be able to run at full load for 72 hours. Emergency and legally required standby generators need only 2 hours of on-site fuel.',
    whyNot: {
      0: '2 hours is the on-site fuel minimum for emergency and legally required standby generators.',
      1: '24 hours is one day; COPS must run three.',
      2: '48 hours is two days; COPS must run three.',
    },
    ref: nec('708.22(C)', 'COPS duration of operation'),
  },

  // ---- Class 1, 2, 3 and fire alarm circuits: Articles 725, 760 ------------------------------------
  {
    id: 'special-conditions-013', topic: 'special-conditions', kind: 'lookup', difficulty: 2, editions: NEC2020,
    provenance: agy('sc-13', 'options in ascending order; reworded in the 2026-10-22 similarity pass'),
    stem: 'You are wiring a control circuit as Class 1 power-limited instead of Class 2. What is the highest rating the power supply feeding it can have?',
    choices: ['30 V and 100 VA', '30 V and 1,000 VA', '150 V and 1,000 VA', '600 V, with no VA limit'],
    answer: 1,
    explain: 'The source for a Class 1 power-limited circuit tops out at 30 V and 1,000 VA. The other kind of Class 1 circuit, remote-control and signaling, can go to 600 V with no cap on power (725.41(B)).',
    whyNot: {
      0: '100 VA is a common Class 2 ceiling, not the Class 1 figure.',
      2: '150 V is five times the 30-V limit.',
      3: 'That fits Class 1 remote-control and signaling circuits (725.41(B)), not power-limited ones.',
    },
    ref: nec('725.41(A)', 'Class 1 power-limited source'),
  },
  {
    id: 'special-conditions-014', topic: 'special-conditions', kind: 'rule', difficulty: 2, editions: NEC2020,
    provenance: agy('sc-14', 'options reordered'),
    stem: 'A control circuit needs more current than one Class 2 transformer can supply. When may two Class 2 power sources have their outputs connected in parallel?',
    choices: [
      'Only when the power sources are listed for that interconnection',
      'Whenever both are fed from the same 15-A branch circuit',
      'Whenever a fuse of 5 A or less is added on the secondary',
      'Never; it is prohibited in every case',
    ],
    answer: 0,
    explain: 'Paralleling or otherwise interconnecting Class 2 or Class 3 power source outputs can push current and power past Class 2 limits, so it is allowed only when the sources are listed for it. Otherwise, split the load into separate Class 2 circuits.',
    whyNot: {
      1: 'A common primary circuit does not limit the combined secondary output.',
      2: 'An added fuse does not make two paralleled sources a listed Class 2 source.',
      3: 'It is allowed when the sources are listed for interconnection.',
    },
    ref: nec('725.121(B)', 'Interconnecting Class 2 power sources'),
  },
  {
    id: 'special-conditions-015', topic: 'special-conditions', kind: 'lookup', difficulty: 3, editions: NEC2020,
    provenance: agy('sc-15', 'explanation corrected: the draft counted CL2 cable among the jackets that remove the separation; only raceway or MC, metal-sheathed, NM or UF cable do'),
    stem: 'Open (unjacketed) Class 2 conductors run near open light and power conductors, with no raceway, cable sheath or fixed nonconductor between them. What minimum separation is required?',
    choices: ['1/4 in.', '1 in.', '2 in.', '6 in.'],
    answer: 2,
    explain: 'Class 2 and Class 3 conductors need at least 2 in. from light, power, Class 1 and non-power-limited fire alarm conductors, unless one of the systems is in raceway or in MC, metal-sheathed, NM or UF cable, or a fixed nonconductor such as porcelain tubes separates them. A Class 2 cable jacket by itself does not count.',
    whyNot: {
      0: '1/4 in. is a routing separation allowed inside enclosures (725.136(D)).',
      1: '1 in. is less than the 2 in. required.',
      3: '6 in. is more than the code requires.',
    },
    ref: nec('725.136(I)', 'Class 2 separation, other applications'),
  },
  {
    id: 'special-conditions-016', topic: 'special-conditions', kind: 'rule', difficulty: 2, editions: NEC2020,
    provenance: agy('sc-16', 'distractor "disconnect locked ON with a padlock" replaced: 760.41(A) permits securing the disconnect in the on position, so the option was too close to a true statement'),
    stem: 'Which of these is required for the branch circuit that supplies the power source of a fire alarm control unit?',
    choices: [
      'It must be protected by a combination-type AFCI',
      'It may also supply exit signs in the same area',
      'Its disconnect must be within sight of the service disconnect',
      'It must be an individual branch circuit, and its disconnect must have red identification',
    ],
    answer: 3,
    explain: 'The fire alarm power source gets an individual branch circuit that is not supplied through a GFCI or AFCI. Its disconnect must have red identification, be accessible only to qualified persons and be marked FIRE ALARM CIRCUIT.',
    whyNot: {
      0: 'The fire alarm branch circuit may not be supplied through an AFCI or GFCI; a nuisance trip would kill the alarm.',
      1: 'It must be an individual branch circuit with no other loads.',
      2: 'There is no such location rule; the disconnect is identified and accessible only to qualified persons.',
    },
    ref: nec('760.41(B)', 'Fire alarm branch circuit'),
  },

  // ---- Communications: Articles 800, 810, 820 ------------------------------------------------------
  {
    id: 'special-conditions-017', topic: 'special-conditions', kind: 'lookup', difficulty: 3, editions: NEC2020,
    provenance: agy('sc-17', 'stem reworded (it repeated the code text); whyNots now point to real confusions'),
    stem: 'At a one-family house, the bonding conductor or grounding electrode conductor for the communications primary protector must be at least what size, and no longer than what length unless a separate communications ground rod is added?',
    choices: ['14 AWG; 20 ft', '12 AWG; 25 ft', '10 AWG; 20 ft', '6 AWG; 15 ft'],
    answer: 0,
    explain: 'The protector’s bonding or grounding electrode conductor is at least 14 AWG and, at one- and two-family dwellings, no more than 20 ft long. If 20 ft cannot be met, drive a separate communications ground rod and bond it to the power grounding electrode system with at least 6 AWG copper (800.100(D)).',
    whyNot: {
      1: 'Neither 12 AWG nor 25 ft is a protector grounding value.',
      2: '10 AWG copper is the antenna grounding conductor minimum (810.21(H)), not the protector minimum.',
      3: '6 AWG is the bonding jumper between a separate communications rod and the power electrode system.',
    },
    ref: nec('800.100(A)', 'Primary protector grounding conductor'),
  },
  {
    id: 'special-conditions-018', topic: 'special-conditions', kind: 'lookup', difficulty: 1, editions: NEC2020,
    provenance: agy('sc-18', 'options in ascending order; reworded in the 2026-10-22 similarity pass'),
    stem: 'A phone and data cable runs down the outside wall of a building that also has a lightning-rod down conductor. When the layout allows it, what is the least space the code wants between the two?',
    choices: ['4 in.', '18 in.', '6 ft', '10 ft'],
    answer: 2,
    explain: 'Wherever you can, hold communications cable 6 ft or more away from lightning down conductors. A strike can side-flash from the down conductor into metal close by.',
    whyNot: {
      0: '4 in. is much too close to stop a side flash.',
      1: '18 in. shows up as a burial depth, not as this spacing.',
      3: '10 ft is more than the 6-ft minimum.',
    },
    ref: nec('800.53', 'Separation from lightning conductors'),
  },
  {
    id: 'special-conditions-019', topic: 'special-conditions', kind: 'rule', difficulty: 2, editions: NEC2020,
    provenance: agy('sc-19', 'reference trimmed to 820.93; whyNots trimmed'),
    stem: 'A CATV coaxial cable enters a commercial building from outside. Where must its outer conductive shield be grounded, and with at least what size grounding conductor?',
    choices: [
      'As close to the point of entrance as practicable; 14 AWG',
      'At the telecom rack inside the building; 6 AWG',
      'Within 50 ft of the point of entrance; 12 AWG',
      'At the utility pole only; 10 AWG',
    ],
    answer: 0,
    explain: 'The shield is grounded as close as practicable to where the cable enters the building, so a surge goes to ground before it travels inside (820.93). The bonding or grounding conductor is at least 14 AWG (820.100).',
    whyNot: {
      1: 'Grounding deep inside the building brings the surge in first.',
      2: '50 ft is the limit for unlisted outside cable run inside a building, not the grounding point.',
      3: 'Grounding at the pole does not meet the point-of-entrance rule.',
    },
    ref: nec('820.93', 'Grounding the coaxial cable shield'),
  },

  // ---- Added in review ------------------------------------------------------------------------------
  {
    id: 'special-conditions-020', topic: 'special-conditions', kind: 'lookup', difficulty: 2, editions: NEC2020,
    provenance: ours('added: Article 720 (circuits under 50 V) is in the topic range and was not drafted'),
    stem: 'Under Article 720 (circuits and equipment operating at less than 50 V), the general minimum conductor size is:',
    choices: ['18 AWG copper', '16 AWG copper', '14 AWG copper', '12 AWG copper'],
    answer: 3,
    explain: 'Article 720 sets 12 AWG copper as the minimum for circuits under 50 V, because low voltage means more current for the same power. Appliance branch circuits supplying more than one appliance or appliance receptacle need at least 10 AWG copper.',
    whyNot: {
      0: '18 AWG is common for Class 2 control wiring (Article 725), which Article 720 does not cover.',
      1: '16 AWG is below the 12 AWG minimum.',
      2: '14 AWG is the usual minimum for 120-V branch circuits, but Article 720 asks for 12 AWG.',
    },
    ref: nec('720.4', 'Conductors, circuits under 50 V'),
  },
  {
    id: 'special-conditions-021', topic: 'special-conditions', kind: 'lookup', difficulty: 2, editions: NEC2020,
    provenance: ours('added: Article 810 antenna grounding, to contrast with the 14 AWG protector rule; reworded in the 2026-10-22 similarity pass'),
    stem: 'You are grounding a rooftop TV antenna mast and the discharge unit on its lead-in (receiving equipment). If you use copper for the grounding conductor, what is the smallest size allowed?',
    choices: ['14 AWG', '12 AWG', '10 AWG', '8 AWG'],
    answer: 2,
    explain: 'For receiving antennas, Article 810 calls for at least 10 AWG copper (or 17 AWG copper-clad steel or bronze). The size is mostly about mechanical strength, since the conductor runs outdoors. Do not confuse it with the 14 AWG used for communications and CATV protectors.',
    whyNot: {
      0: '14 AWG is the minimum for communications protectors and CATV shields (800.100, 820.100), not antennas.',
      1: '12 AWG is one size too small.',
      3: '8 AWG works, but it is bigger than the minimum.',
    },
    ref: nec('810.21(H)', 'Antenna grounding conductor size'),
  },
]
