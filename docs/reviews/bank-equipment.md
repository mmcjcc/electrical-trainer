# Review of the Equipment for General Use question drafts (`src/content/bank/equipment.ts`), 2026-10-16

Drafter: Antigravity (`agy`, Gemini 4 Argon High), batches `eq-a` and `eq-b`, 25 questions each, from
memory with no web access. Raw output: `C:\work\agy-briefs\etrainer-bank\out\eq-a.questions.json` and
`eq-b.questions.json` (not in the repo). Verifier: Claude. Every keyed answer, number and NEC location
was checked by hand against the 2020 NEC. Where recall alone was not enough (424.4(B) wording, 480.10(C)
numbering, 408.37 → 312.2, 430.83(C), 406.12 2020 list, 445.18(D), 440.14 history, 422.16(B) cord
lengths), secondary sources were read (Mike Holt forum quotes of the 2020 text, EC&M and EC Mag code
quizzes, Leviton 2020 change summaries). Edition differences come from `docs/research/nec-crosswalk.md`
§E.

## Totals

| | Count |
|---|---|
| Drafts received | 50 |
| Kept (keyed answer, reference and teaching content unchanged; options reordered, a distractor value swapped to rebalance, or wording trimmed) | 26 |
| Fixed (a wrong or weak answer option, explanation, whyNot, reference or stem corrected; two items rewritten) | 24 |
| Dropped | 0 |
| Added by Claude (`draftedBy: 'claude'`) | 3 |
| **Questions in `equipment.ts`** | **53** |

Answers per position A/B/C/D: 13 / 14 / 13 / 13, with no repeating pattern (sequence
`31021201303213012213012102300330130223203021102113213`). Numeric options ascend (AWG sizes run from
smallest wire to largest); answer positions were moved by changing distractor values, never by breaking the
order. Difficulty 1/2/3: 18 / 29 / 6. Kinds: 33 rule, 20 lookup.

Editions: 50 items carry 2020 only. Three carry 2020, 2023 and 2026 because the crosswalk lists both the
rule and its location as unchanged in all three: equipment-027 (430.6(A)(1), E-1), equipment-029
(430.32(A)(1), E-5) and equipment-039 (430.110(A), E-8). Two references carry `byEdition`: Table 430.52
(2023/2026 Table 430.52(C)(1)) and Table 450.3(B) (2026 Table 450.5(B)).

No draft keyed a clearly wrong answer, though two keyed options overstated the rule (eq-a-12, eq-a-24). Most problems were in the teaching around the answer: whyNots that taught
false side facts, wrong section numbers, and two stems that tested two rules at once. Every draft carried
`confidence: "high"`, including the ones with wrong references, so the drafter's confidence told us
nothing. The drafts were already spread (14 / 12 / 12 / 12) and did not follow a strict 0-1-2-3 cycle, but options
were reordered or distractors changed on almost every item anyway, so positions no longer follow the drafts.

## Most serious problems found

1. **eq-a-24 (424.4(B))**: one stem asked for both the conductor ampacity and the breaker size at 125%,
   plus the disconnect rule. The 2020 text of 424.4(B) was reworded to state 125% for the branch-circuit
   conductors (2017 424.3(B) called the heater a continuous load), so the breaker half is arguable, and the
   disconnect half duplicated eq-a-23. Rewritten to ask only conductor ampacity.
2. **eq-b-09 (430.83)**: cited 430.83(A)(2), which is the circuit-breaker-as-controller item; the snap-switch
   rule is 430.83(C)(2). It also taught the same 80% snap-switch fact as eq-a-08 (404.14(A)(3)). Rewritten
   to the companion rule 430.83(C)(1): a general-use switch rated at least twice the motor current.
3. **eq-b-25 (480.10)**: cited 480.10(A), which is ventilation. Working space about batteries is 480.10(C).
4. **eq-a-16 (408.37)**: the 1/4-in. airspace is in 312.2; 408.37 only points there. Reference moved;
   "metal" added to the stem because nonmetallic enclosures on masonry are exempt.
5. **Wrong side facts in whyNots**, each of which would have taught a candidate something false:
   eq-b-07 (inverse-time breaker exception ceiling given as 300% up to 100 A; it is 400% for FLC of 100 A
   or less, 300% above), eq-a-22 (range-hood cord given as 24-48 in.; it is 18 in. to 4 ft, and the
   3-6.5 ft range is dishwashers only), eq-a-08 (404.14(B) 50% misdescribed), eq-b-14 (claimed the
   nameplate rule in 440.14 was new in 2020; it is older), eq-b-03 (wrong 430.7(A) item numbers and a
   Design E motor, which the 2020 NEC does not list), eq-b-18 (integral overcurrent protection attributed to
   the 100% exception; that is 445.13(B)).

## Draft by draft

| Draft | Result | New id | What changed / why |
|---|---|---|---|
| eq-a-01 | kept | equipment-001 | kind lookup → rule; options reworded and reordered; whyNots trimmed. |
| eq-a-02 | fixed | equipment-002 | whyNot for the "8 in. of free conductor" option talked about 6 in.; rewritten. |
| eq-a-03 | kept | equipment-003 | Options put in size order, 12 AWG replaces 20 AWG so the answer moves; explanation trimmed. |
| eq-a-04 | fixed | equipment-004 | whyNot cited 404.2(A) (three- and four-way switches) for the neutral rule; reference narrowed to 404.2(B) Exception; difficulty 3 → 2. |
| eq-a-05 | fixed | equipment-005 | "Bond the neutral to the box" filler option replaced by the real confusion (whether an office is covered). |
| eq-a-06 | kept | equipment-006 | 5 ft 6 in. replaces 8 ft to move the answer; whyNots rewritten for the new values. |
| eq-a-07 | fixed | equipment-007 | whyNot claimed older editions allowed omitting the switch ground with nonmetallic box and plate; unverified, rewritten. |
| eq-a-08 | fixed | equipment-008 | whyNot said 404.14(B) limits tungsten or noninductive loads to 50%; it is inductive loads on ac-dc switches. Distractors changed to move the answer. |
| eq-a-09 | fixed | equipment-009 | "In a bedroom" removed: it raised AFCI and tamper-resistant questions the item does not ask. |
| eq-a-10 | kept | equipment-010 | Wording trims; options reordered. |
| eq-a-11 | kept | equipment-011 | Stem asks for the nonferrous plate (0.040 in.) so the ferrous value (0.030 in.) is a distractor and the answer moves; numbers unchanged. |
| eq-a-12 | fixed | equipment-012 | Keyed option said the rule requires an extra-duty in-use cover; the rule requires an enclosure weatherproof with a plug in, and a hood, if used, must be extra-duty (2020 also allows other listed weatherproof products). Reworded. |
| eq-a-13 | kept | equipment-013 | Wording trims; explanation names the 2020 change (dwelling garages and accessory buildings spelled out in 406.12(1)); difficulty 3 → 2. |
| eq-a-14 | kept | equipment-014 | Options reordered; difficulty 2 → 1. |
| eq-a-15 | kept | equipment-015 | Wording trims; options reordered. |
| eq-a-16 | fixed | equipment-016 | Reference 408.37 → 312.2 (where the 1/4 in. lives); "metal" added to the stem; distractors kept ascending. |
| eq-a-17 | kept | equipment-017 | Wording trims; options reordered. |
| eq-a-18 | kept | equipment-018 | whyNots simplified (pool and 404.9(B) side remarks dropped); options reordered. |
| eq-a-19 | fixed | equipment-019 | whyNot for 18 in. cited Article 511 as a residential-garage rule (511 is commercial garages); distractors changed to move the answer. |
| eq-a-20 | kept | equipment-020 | Wording trims; options reordered. |
| eq-a-21 | fixed | equipment-021 | Reference 410.116(A)(1) → 410.116: the insulation half of the answer is 410.116(B). Difficulty 3 → 2. |
| eq-a-22 | fixed | equipment-022 | Two whyNots wrong: range hoods are 18 in. to 4 ft (not 24-48 in.); 3-6.5 ft is dishwashers only (trash compactors are 3-4 ft). The range-hood length is now a distractor. |
| eq-a-23 | fixed | equipment-023 | "Panel door with a key lock" distractor is arguable under 110.25; replaced by a directory label, which is clearly wrong. Difficulty 3 → 2. |
| eq-a-24 | fixed (rewritten) | equipment-024 | See problem 1. Now: conductor ampacity for a 16-A baseboard heater, 20 A. Notes the 2017 → 2020 renumbering (424.3(B) → 424.4(B)). |
| eq-a-25 | fixed | equipment-025 | Unsourced "typically 30 mA" claim and an irrelevant 230.67 remark removed; difficulty 3 → 2. |
| eq-b-01 | fixed | equipment-026 | whyNot for "larger of nameplate or table" misdescribed Article 440; locked-rotor whyNot made accurate. Kept alongside eq-b-02 on purpose: they test the two halves of 430.6(A) and have different answers. |
| eq-b-02 | kept | equipment-027 | 20 hp, 460 V added so the 27-A table value can be checked (Table 430.250); editions widened to all three (crosswalk E-1). |
| eq-b-03 | fixed | equipment-028 | whyNots cited wrong 430.7(A) item numbers and a Design E motor, which the 2020 NEC does not list; rewritten without item numbers. |
| eq-b-04 | kept | equipment-029 | Options put in ascending order; editions widened to all three (crosswalk E-5). |
| eq-b-05 | kept | equipment-030 | 115% and 125% replace 150% and 175% to move the answer. |
| eq-b-06 | fixed | equipment-031 | Historical claim (older codes allowed two overload units) removed from the explanation and whyNots; not verified. |
| eq-b-07 | fixed | equipment-032 | whyNot gave the wrong exception ceiling (see problem 5); 400% is now a distractor with the right explanation; 2023/2026 name Table 430.52(C)(1) noted. |
| eq-b-08 | kept | equipment-033 | Wording trims; options reordered. |
| eq-b-09 | fixed (rewritten) | equipment-034 | See problem 2. |
| eq-b-10 | fixed | equipment-036 | Explanation called the exception "430.102(B)(2)"; it is the exception to (B)(1) and (B)(2). Options reworded. |
| eq-b-11 | kept | equipment-037 | Stem set on a platform-mounted motor; difficulty 2 → 1. |
| eq-b-12 | kept | equipment-038 | Wording trims; options reordered. |
| eq-b-13 | kept | equipment-039 | 80% replaces 150% to move the answer; editions widened to all three (crosswalk E-8). |
| eq-b-14 | fixed | equipment-041 | False "new in 2020" claim removed; stem said "mounting on the cabinet" while one option was 15 ft away, now neutral. |
| eq-b-15 | kept | equipment-042 | 400% replaces 200% to move the answer. |
| eq-b-16 | fixed | equipment-043 | whyNot claimed horsepower tables are used when a compressor nameplate has no current; unsupported, removed. |
| eq-b-17 | kept | equipment-040 | 440.35 named for the conductor rule; difficulty 3 → 2. |
| eq-b-18 | fixed | equipment-044 | whyNot attributed integral overcurrent protection to the 100% exception (that is 445.13(B), the tap allowance). |
| eq-b-19 | kept | equipment-045 | Wording trims; 445.18(C) named as the separate over-15-kW rule. |
| eq-b-20 | kept | equipment-048 | Options put in ascending order; difficulty 3 → 2. |
| eq-b-21 | kept | equipment-049 | Options put in ascending order. Kept with eq-b-22: same 12 in. and 112.5 kVA numbers, but indoor and outdoor rules point opposite ways (indoor: 112.5 kVA or less; outdoor: over 112.5 kVA). |
| eq-b-22 | kept | equipment-050 | 37.5 kVA replaces 500 kVA to move the answer; difficulty 3 → 2. |
| eq-b-23 | kept | equipment-051 | Options put in ascending order. |
| eq-b-24 | kept | equipment-052 | Options put in order (voltage, then time); kind rule → lookup; difficulty 3 → 2. |
| eq-b-25 | fixed | equipment-053 | See problem 3. |
| (new) | added | equipment-035 | 430.102(A): controller disconnect in sight from the controller. The drafts covered only the motor half of 430.102. |
| (new) | added | equipment-046 | Table 450.3(B), primary-only protection, 9 A or more: 125% (Note 1 round-up). No draft covered transformer overcurrent protection. |
| (new) | added | equipment-047 | Table 450.3(B), primary and secondary protection: primary up to 250%. |

## Open points

- **424.4(B), 2020 wording** (equipment-024): taken from secondary quotes of the 2020 text (125% for the
  branch-circuit conductors, from Public Comment 695). The item asks only for conductor ampacity, which is
  20 A under either the 2017 or the 2020 wording. Check the explanation's description of the 2020 change
  against the code book.
- **480.10(C)** (equipment-053): the 2020 number rests on one 2020-based code quiz (EC&M) plus recall; the
  content (measure from the edge of the cabinet, racks or trays) is the same in every edition seen.
- **2023 and 2026**: only three items are tagged for them. Many others are probably unchanged (404.8(A),
  406.6(A), 410.10(D), 450.21(A), 450.42), but were not checked in those editions.
