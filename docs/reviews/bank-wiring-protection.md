# Review of the Wiring and Protection question drafts (`src/content/bank/wiringProtection.ts`), 2026-10-16

Drafter: Antigravity (`agy`, Gemini 4 Argon High), batches `wp-a` (Articles 100/110, 22 questions), `wp-b`
(200/210, 25), `wp-c` (215-240, 25) and `wp-d` (250/285, 30), from memory with no web access. Raw output:
`C:\work\agy-briefs\etrainer-bank\out\wp-a.questions.json` to `wp-d.questions.json` (not in the repo).
Verifier: Claude. Every keyed answer, value and NEC location was checked by hand against the 2020 NEC as
recalled; nothing was checked against a printed book in this pass (see Open points).

## Totals

| | Count |
|---|---|
| Drafts received | 102 |
| Kept (facts, key and location unchanged; only wording trims, option order or distractor values for the answer spread) | 41 |
| Fixed (stem, key wording, options, reference, explanation or whyNot corrected) | 57 |
| Dropped | 4 |
| Added by Claude (`draftedBy: 'claude'`) | 4 |
| **Questions in `wiringProtection.ts`** | **102** |

Answers per position A/B/C/D: 25 / 26 / 26 / 25, longest run of one letter 3, no repeating pattern.
All four batches used a strict 0-1-2-3 cycle in id order, so every question was repositioned. Thirty-seven
drafts had numeric options out of order (for example 60 °C, 75 °C, 90 °C, 85 °C); numeric options are
now ascending (conductor sizes from smallest wire to largest), and the answer position was moved by
changing distractor values, not by breaking the order. Difficulty 1/2/3: 32 / 39 / 31. Kind: 85 rule,
17 lookup (the drafts' three "theory" items are code rules and were re-tagged).

Editions: 101 items are tagged 2020 only; one (110.2, "approved" means acceptable to the AHJ) carries
2020, 2023 and 2026. Many rules in this area changed in 2023 (210.8, 210.52(C)(2), 230.85, 250.118's
numbering) and 2026 locations were not verified, so nothing else was widened.

Every draft carried `confidence: "high"`, including the wrong ones; the drafter's confidence told us
nothing.

## The most serious problems

1. **A probably outdated value keyed as right (wp-c-06).** 8 ft over a flat roof (225.19(A)) is the
   older value; the 2020 text reads 8 ft 6 in. as best I recall. I could not confirm it either way, so the
   question was dropped, and wp-c-09 no longer states the general roof value in a whyNot.
2. **Wrong content for a label rule (wp-a-09).** The stem and explanation said the 110.16(B) service label
   shows the arc-flash boundary and PPE. 110.16(B) lists nominal voltage, available fault current,
   clearing time of the service OCPD and the date; the boundary/PPE label is the NFPA 70E alternative.
3. **An invented edition change (wp-d-29).** It taught that the 2017 NEC made every EGC in a box be spliced,
   even for pass-through circuits, and that 2020 relaxed it. The "associated with those circuit
   conductors" wording predates 2020. The answer was right; the history was removed.
4. **Second defensible answers.** wp-c-12 offered "exempt from listing if utility provided" for a meter
   socket, and 2020 230.66 does except utility-controlled sockets from listing. wp-d-30 asked which SPD
   may go on the supply side, and 230.82(8) lets a Type 2 SPD do that as part of listed equipment. wp-d-20
   set the raceway in a concentric knockout, where a bonding jumper is needed around the impaired
   connection, which made two of the "acceptable" options doubtful. All three were rewritten.
5. **Made-up supporting facts in whyNots and explanations** (about 15 items): 3/8 in. "airspace rule" in
   Article 312 (wp-a-04); "5 ft is not in Table 110.26(A)(1)" (wp-a-16, it is the 601-1000 V Condition 3
   value); "24 in. was the older island drop" (wp-b-22); "6 ft 6 in. was the old imperial equivalent"
   (wp-c-23); "major fraction = 6 ft or more" (wp-b-23, it means more than half); the 250.53(A)(3)
   informational note misquoted (wp-d-11); "lighting rule applies in electrical equipment rooms" (wp-a-21);
   a split-bolt "permitted for bonding jumpers between electrodes" (wp-d-14). Plus an incomplete key in
   wp-b-06 (210.5(C)(1)(b) allows "documented and readily available" as well as posting), and the 2017
   wording "maximum available fault current" in wp-a-12.

## Draft by draft

| Draft | Result | New id | What changed / why |
|---|---|---|---|
| wp-a-01 | fixed | wiring-protection-001 | Explanation used the wiring-method meaning of accessible ("without damaging the building finish"); rewritten to the equipment definition. Options repositioned. |
| wp-a-02 | kept | wiring-protection-002 | Stem tightened. Tagged 2020/2023/2026 (Article 100 and 110.2 unchanged). |
| wp-a-03 | kept | wiring-protection-003 | Wording tightened. |
| wp-a-04 | fixed | wiring-protection-004 | Options out of order (1/16, 1/8, 3/8, 1/4); the Article 312 claim for 3/8 in. was unsupported. |
| wp-a-05 | kept | wiring-protection-005 | Options repositioned. |
| wp-a-06 | fixed | wiring-protection-006 | "85 °C" is not a Table 310.16 column (the same flaw the theory review found in th-b-25). Options rebuilt as "may not be used / 60 / 75 / 90 °C column"; stem no longer mixes a 60 A circuit with 100 A equipment. |
| wp-a-07 | kept | wiring-protection-007 | Wording shortened; options repositioned. |
| wp-a-08 | kept | wiring-protection-008 | Options repositioned. |
| wp-a-09 | fixed | wiring-protection-009 | **Wrong label content** (see problem 2). Options in ascending order. |
| wp-a-10 | kept | wiring-protection-010 | Options repositioned. |
| wp-a-11 | fixed | wiring-protection-011 | Key said "identification of the enclosure that is the source"; reworded to the 2020 rule, the circuit source that supplies the disconnect. |
| wp-a-12 | fixed | wiring-protection-012 | "Maximum available fault current" is the pre-2020 wording; 2020 says "available fault current". |
| wp-a-13 | kept | wiring-protection-013 | |
| wp-a-14 | **dropped** | | Near-duplicate: wp-a-14/15/16 were the same 480Y/277 V row with Conditions 1/2/3. Kept Condition 2 and 3; Condition 1 (3 ft) is still taught by the 3 ft whyNots. |
| wp-a-15 | fixed | wiring-protection-014 | Options out of order. |
| wp-a-16 | fixed | wiring-protection-015 | Options out of order; whyNot wrongly said 5 ft is not in Table 110.26(A)(1). New distractors (2 ft 6 in. = the width) move the key. |
| wp-a-17 | kept | wiring-protection-016 | |
| wp-a-18 | kept | wiring-protection-017 | |
| wp-a-19 | fixed | wiring-protection-018 | Options out of order. |
| wp-a-20 | kept | wiring-protection-019 | Options ordered by ampere rating. |
| wp-a-21 | fixed | wiring-protection-020 | Explanation limited the rule to "electrical equipment rooms"; it covers all indoor working spaces at this equipment. |
| wp-a-22 | fixed | wiring-protection-021 | Options out of order. |
| wp-b-01 | fixed | wiring-protection-022 | Stem limited to a raceway installation (PV wire and MI cable have their own 200.6(A) rules). |
| wp-b-02 | kept | wiring-protection-023 | Options repositioned. |
| wp-b-03 | fixed | wiring-protection-024 | Reference 200.11 moved to 200.10(C), where the screw-shell rule is. |
| wp-b-04 | kept | wiring-protection-025 | |
| wp-b-05 | kept | wiring-protection-026 | Options repositioned. |
| wp-b-06 | fixed | wiring-protection-027 | Key incomplete: the scheme may be posted or documented where readily available (210.5(C)(1)(b)). |
| wp-b-07 | kept | wiring-protection-028 | 2020 "basements" (finished or not) plus AFCI for a family room: both. |
| wp-b-08 | kept | wiring-protection-029 | |
| wp-b-09 | fixed | wiring-protection-030 | Options out of order. The explanation makes no edition claim: I am not sure whether the 50 A/100 A reach of 210.8(B) came in 2017 or 2020. |
| wp-b-10 | **dropped** | | Keyed on "2020 removed doorways from the 6 ft cord-path measurement". I believe that is right, but could not confirm the 2020 wording well enough to key a question on it. Restore after checking 210.8 in the book. |
| wp-b-11 | kept | wiring-protection-031 | Kind lookup → rule; options reordered. |
| wp-b-12 | kept | wiring-protection-032 | Options repositioned. |
| wp-b-13 | kept | wiring-protection-033 | Kind lookup → rule; explanation trimmed. |
| wp-b-14 | kept | wiring-protection-034 | Explanation names the matching feeder rule 215.2(A)(1) (wp-c-01 dropped). |
| wp-b-15 | fixed | wiring-protection-035 | Options out of order. |
| wp-b-16 | fixed | wiring-protection-036 | Unsupported "NEMA skips 40 A" explanation removed; options ordered by set. |
| wp-b-17 | fixed | wiring-protection-037 | Options out of order. |
| wp-b-18 | fixed | wiring-protection-038 | WhyNot for 10 AWG ("two sizes down from 6 AWG") made no sense. |
| wp-b-19 | kept | wiring-protection-039 | Kind lookup → rule; reference 210.52(A)(2). |
| wp-b-20 | fixed | wiring-protection-040 | Options out of order. |
| wp-b-21 | fixed | wiring-protection-041 | Options out of order. 2020 only: 2023 made island receptacles optional (with provisions for one). |
| wp-b-22 | fixed | wiring-protection-042 | Options out of order; the "24 in. older island drop" whyNot was wrong. |
| wp-b-23 | fixed | wiring-protection-043 | "Major fraction" was defined as 6 ft or more; it means more than half of 12 ft. |
| wp-b-24 | fixed | wiring-protection-044 | Options reordered by distance; reference 210.63 (the 25 ft is in the parent text, same-level and load-side rules in (A)). |
| wp-b-25 | kept | wiring-protection-045 | |
| wp-c-01 | **dropped** | | Duplicate of wp-b-14 (100% noncontinuous + 125% continuous), feeder instead of branch circuit. |
| wp-c-02 | fixed | wiring-protection-046 | Options out of order; voltage limits left out of the explanation. |
| wp-c-03 | fixed | wiring-protection-047 | Options out of order. |
| wp-c-04 | fixed | wiring-protection-048 | Options out of order. |
| wp-c-05 | kept | wiring-protection-049 | |
| wp-c-06 | **dropped** | | **Likely outdated key** (see problem 1): 8 ft over a roof vs. 8 ft 6 in. in 2020. |
| wp-c-07 | kept | wiring-protection-050 | The RMC/230.6 whyNot was simplified. |
| wp-c-08 | fixed | wiring-protection-051 | Options out of order. |
| wp-c-09 | fixed | wiring-protection-052 | Options out of order; the general roof-clearance whyNot no longer states a value. Key (3 ft, Exception No. 2) is unaffected. |
| wp-c-10 | kept | wiring-protection-053 | Unverified 820.44(C) citation removed from a whyNot. |
| wp-c-11 | fixed | wiring-protection-054 | Options out of order; cited to 230.43 (the list item number "(15)" was not verified); 3 ft whyNot rewritten. |
| wp-c-12 | fixed | wiring-protection-055 | **Arguable second answer** (see problem 4); cited to 230.66. |
| wp-c-13 | kept | wiring-protection-056 | Options reordered; location rule 230.67(B) added to the explanation. |
| wp-c-14 | kept | wiring-protection-057 | |
| wp-c-15 | fixed | wiring-protection-058 | Options out of order. |
| wp-c-16 | kept | wiring-protection-059 | |
| wp-c-17 | fixed | wiring-protection-060 | Options out of order. |
| wp-c-18 | kept | wiring-protection-061 | |
| wp-c-19 | fixed | wiring-protection-062 | Options out of order. |
| wp-c-20 | fixed | wiring-protection-063 | Options out of order; new distractors (160/175/200 A) move the key. |
| wp-c-21 | fixed | wiring-protection-064 | Options out of order. |
| wp-c-22 | kept | wiring-protection-065 | Kind theory → rule. |
| wp-c-23 | fixed | wiring-protection-066 | Options out of order; the "older imperial equivalent" and "7 ft by exception" whyNots were invented. |
| wp-c-24 | kept | wiring-protection-067 | |
| wp-c-25 | fixed | wiring-protection-068 | Each option mixed two claims (trip setting and temporary instantaneous adjustment). Now a plain yes/no on the 1,200 A trigger. |
| wp-d-01 | fixed | wiring-protection-069 | Options out of order; stem no longer recites the code text. |
| wp-d-02 | kept | wiring-protection-070 | |
| wp-d-03 | fixed | wiring-protection-071 | Options out of order. |
| wp-d-04 | fixed | wiring-protection-072 | WhyNot called bonding at both ends a violation, but Exception No. 2 allows it for an outdoor source; stem now names an indoor transformer. |
| wp-d-05 | kept | wiring-protection-073 | Options repositioned. |
| wp-d-06 | kept | wiring-protection-074 | |
| wp-d-07 | fixed | wiring-protection-075 | Options out of order; 6 ft replaces 20 ft as a distractor. |
| wp-d-08 | kept | wiring-protection-076 | |
| wp-d-09 | fixed | wiring-protection-077 | Options out of order; new distractors. |
| wp-d-10 | fixed | wiring-protection-078 | Options out of order. |
| wp-d-11 | fixed | wiring-protection-079 | Options out of order; the informational note suggests twice the rod length, not "at least their length". |
| wp-d-12 | kept | wiring-protection-080 | Options repositioned. |
| wp-d-13 | fixed | wiring-protection-081 | Options out of order. |
| wp-d-14 | fixed | wiring-protection-082 | Unsupported split-bolt whyNot removed. |
| wp-d-15 | kept | wiring-protection-083 | |
| wp-d-16 | fixed | wiring-protection-084 | Options out of order; 3/0 distractor replaced by 2/0, the Table 250.66 size for 2 × 500 kcmil. |
| wp-d-17 | fixed | wiring-protection-085 | Options out of order. |
| wp-d-18 | kept | wiring-protection-086 | |
| wp-d-19 | kept | wiring-protection-087 | Options repositioned. |
| wp-d-20 | fixed | wiring-protection-088 | **Doubtful "acceptable" options** in a concentric-knockout scenario (see problem 4). |
| wp-d-21 | fixed | wiring-protection-089 | Reference 250.94(A)(4) is the mounting item, not the three-terminal rule; cited to 250.94(A). |
| wp-d-22 | fixed | wiring-protection-090 | Options out of order. |
| wp-d-23 | kept | wiring-protection-091 | |
| wp-d-24 | fixed | wiring-protection-092 | Options out of order. |
| wp-d-25 | fixed | wiring-protection-093 | Options out of order; stem limited to a single conductor in a raceway (250.119(B) allows any size in multiconductor cable under qualified maintenance). |
| wp-d-26 | kept | wiring-protection-094 | |
| wp-d-27 | fixed | wiring-protection-095 | Cited to 250.122(F); the "(F)(1)(b)" subdivision was not verified. |
| wp-d-28 | kept | wiring-protection-096 | |
| wp-d-29 | fixed | wiring-protection-097 | **Invented edition history** (see problem 3); answer unchanged. |
| wp-d-30 | fixed | wiring-protection-098 | **Arguable second answer** (see problem 4); Type 3 whyNot corrected (the 30 ft applies only where the instructions call for it). |

## Added by Claude

| New id | Rule | Why |
|---|---|---|
| wiring-protection-099 | 210.8(F) dwelling outdoor outlets, 50 A | A 2020 change named in the brief; no draft covered it. Note: Maryland's model performance code amends the 210.8(F) exception for HVAC equipment (docs/research/maryland-exam.md §4); the exam follows the book, so the question does not mention it. |
| wiring-protection-100 | 230.85 location: readily accessible outdoors | Companion to the marking question (wiring-protection-059). |
| wiring-protection-101 | 250.53(A)(2) Exception, 25 ohms | Named in the brief; the spacing item does not test it. |
| wiring-protection-102 | 240.24(E) not in bathrooms (with (D) closets and (F) over steps) | Named in the brief; no draft covered 240.24's location rules. |

## Open points

- **Check in the 2020 book before restoring or widening:** 225.19(A)/230.24(A) roof clearance (8 ft or
  8 ft 6 in.); the 210.8 measurement wording on doors and doorways; whether the 210.8(B) 50 A/100 A reach
  came in 2017 or 2020; 230.43 item (15); 230.66(B) and its utility exception; 250.122(F)(1)(b).
- Lower-confidence keys that were kept: wiring-protection-087 (2020 250.68(C)(3), rebar may not
  interconnect electrodes) and wiring-protection-079's whyNot (informational note to 250.53(A)(3),
  twice the rod length). Both match my recall of the 2020 text but deserve a look in the book.
- The NEC locations are typed (`'110.26(C)(2)'`, `'Table 250.66'`), as in `mdLaw.ts` and `theory.ts`;
  none is in `data/refs.ts`. Moving them there would let the 2023/2026 tags be widened in one place.
- `src/content/bank/index.ts` does not import this file yet (the architect registers topic files). The
  `bank.test.ts` checks were run against it through a temporary test, since deleted: all pass.
