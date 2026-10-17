# Review of the wiring-methods question bank, 2026-10-16

Topic `wiring-methods`, PSI area "Wiring Methods and Materials" (NEC 2020 Articles 300, 310-314,
320-330, 332-356, 358-374, 376-398). Drafts: Antigravity (`agy`, Gemini 4 Argon High), files
`C:\work\agy-briefs\etrainer-bank\out\wm-a.questions.json` and `wm-b.questions.json` (30 each, not in
the repo). Verifier: Claude, working from its own knowledge of the 2020 NEC (no code book or web source
was open during the review). Output: `src/content/bank/wiringMethods.ts`.

## Totals

| | Count |
|---|---|
| Drafts received | 60 |
| Kept (key, facts and location confirmed; only wording, option order or answer position changed) | 44 |
| Fixed (a real error found and corrected) | 16 |
| Dropped | 0 |
| Added by Claude | 4 |
| **Questions in the bank** | **64** |

Right answers after rebalancing: A 17, B 17, C 14, D 16, in no repeating pattern (both draft files
cycled 0, 1, 2, 3 in id order). Numeric options are in ascending order in every question; where an
answer had to move, the distractor values were changed, not the order. All 64 are tagged
`editions: ['2020']`: Table 300.5 became Table 300.5(A) in 2023, several 2023 rules here were
rewritten (338.10(B)(4)(a) among them), and the 2026 locations were not checked.

## Every draft

"Answer moved" means the right option changed position (by reordering non-numeric options, or by
changing distractor values). Kept items also had their wording simplified to the bank's voice, and
`whyNot` notes were trimmed of cross-references that could not be confirmed.

| Draft | New id | Verdict | What changed and why |
|---|---|---|---|
| wm-a-01 | 001 | kept | 300.3(B) confirmed. Answer moved; dropped a doubtful whyNot claim about strapping bonding jumpers outside. |
| wm-a-02 | 002 | kept | 300.4(A)(1), 1-1/4 in. confirmed. Kind lookup -> rule. |
| wm-a-03 | 004 | kept | Table 300.5 Column 3 under a 4 in. slab = 4 in. confirmed. Options were descending; now ascending (answer moved). |
| wm-a-04 | 005 | kept | Table 300.5 Column 4 under a dwelling driveway = 12 in. confirmed. Options put in order (answer moved). |
| wm-a-05 | 007 | kept | 300.5(D)(1), 8 ft confirmed. Options put in order (answer moved). |
| wm-a-06 | 008 | **fixed** | Ref was 300.6(A)(3) (ferrous metal in concrete or earth). The 1/4 in. airspace for indoor wet locations is **300.6(D)**. |
| wm-a-07 | 009 | kept | 300.7(A) confirmed. The explosionproof option reworded so it is plainly "required" (the code says it is not). |
| wm-a-08 | 010 | kept | Answer confirmed. Ref 300.11(B)(1) broadened to 300.11: 2020 moved the suspended-ceiling rules into 300.11(B), but I could not confirm the subdivision independently. Answer moved. |
| wm-a-09 | 011 | **fixed** | Impossible stem: a 4 in. × 2-1/8 in. box with the raceway entry "4 in. behind the front opening", then 4 + 3 = 7 in. trick arithmetic. Rewritten to ask the two 300.14 requirements (6 in. free, 3 in. past an opening under 8 in.). |
| wm-a-10 | 012 | **fixed** | Answer right. whyNot cited 334.40(B) for "concealing an existing cable repair", which is not what that section covers; replaced. Answer moved. |
| wm-a-11 | 013 | kept | 300.17 confirmed. Stem reworded away from the code text; kind theory -> rule; answer moved. |
| wm-a-12 | 014 | **fixed** | Answer (100 ft) right. whyNot said 120 ft "exceeds the maximum 100 ft support spacing permitted for any conductor size". False: Table 300.19(A) allows aluminum up to 200 ft. Distractors replaced with real aluminum values (135, 180, 200 ft); answer moved. |
| wm-a-13 | 015 | kept | 300.21 confirmed. Answer moved. |
| wm-a-14 | 016 | kept | 300.22(C)(1) confirmed. |
| wm-a-15 | 006 | kept | Answer right. Ref changed from 310.10(C) to 300.5(B), the rule that makes the inside of an underground raceway a wet location (310.10(C) named in the explanation). Kind theory -> rule; answer moved. |
| wm-a-16 | 017 | kept | 310.10(G)(1), 1/0 AWG, and the 2017 location 310.10(H)(1) confirmed. |
| wm-a-17 | 018 | **fixed** | 83 percent and 310.12(A) right, but the explanation said the rule covers "120/240-volt or 208Y/120-volt" services; the 2020 rule is for 120/240-volt single-phase systems. Removed "without engineering supervision" from the stem (irrelevant). Options ascending. |
| wm-a-18 | 020 | kept | 310.15(E)(2), 6 conductors, and the 2017 location 310.15(B)(5)(b) confirmed. Options ascending (answer moved). |
| wm-a-19 | 021 | kept | 312.2 confirmed. Answer moved. Shares the 1/4 in. airspace number with 008 but tests a different section (cabinets, plus weatherproof); kept both. |
| wm-a-20 | 022 | **fixed** | Answer right. whyNot said compact stranding "is addressed in a footnote to Table 312.6(B)" as if that bore on the choice of table; replaced. Answer moved. |
| wm-a-21 | 024 | kept | 2020 314.16(B)(5): four EGCs = 1 allowance, 1/4 for each beyond. 1-1/2 allowances = 3.375 in.³ confirmed. Options ascending (answer moved). |
| wm-a-22 | 025 | kept | 314.16(B)(4) per-yoke sizing confirmed. Stem shortened; options put in ascending order of volume (answer moved). |
| wm-a-23 | 026 | kept | 8 in. confirmed. Ref 314.17(B)(2) broadened to 314.17 (2020 subdivision not independently confirmed). Options ascending (answer moved). |
| wm-a-24 | 027 | **fixed** | Two defensible answers: "flush in both walls" also complies. Options rewritten as limits ("no setback allowed in either wall", etc.) so only one is right. |
| wm-a-25 | 028 | kept | 314.21, 1/8 in. confirmed. Options ascending (answer moved). |
| wm-a-26 | 029 | kept | 314.23(F), 18 in. confirmed. Options ascending (answer moved); vague 12 in. whyNot removed. |
| wm-a-27 | 030 | **fixed** | Key over-stated the rule. The stem used a small round canopy and the whyNot said there is "no allowance"; the luminaire rule (410.23) requires covering exposed combustible finish for canopies or pans of 180 in.² or more. Stem now uses a 24 in. × 24 in. pan, where the answer holds without argument. |
| wm-a-28 | 031 | **fixed** | 50 lb / 70 lb right. The stem ("minimum weight a standard box must support without special weight markings") muddled the rule; the ref 314.27(C) covered only the fan half. Stem rewritten, ref 314.27, distractors changed, answer moved. |
| wm-a-29 | 032 | kept | 314.28(A)(2) confirmed. Options shortened; answer moved. |
| wm-a-30 | 033 | kept | 314.29 exception confirmed. Stem reworded away from the code text; answer moved. |
| wm-b-01 | 034 | kept | 320.30(B), 4-1/2 ft confirmed. Options ascending (answer moved). |
| wm-b-02 | 035 | kept | 320.24, 5 × diameter confirmed. |
| wm-b-03 | 036 | kept | 320.80(A), 90°C conductors, 60°C ampacity (20 A) confirmed. |
| wm-b-04 | 037 | kept | 330.30(B), 6 ft confirmed. |
| wm-b-05 | 038 | **fixed** | 12 in. right. whyNot invented an 18 in. rule for "unbroken nonmetallic-sheathed cable entries"; replaced. |
| wm-b-06 | 039 | kept | 330.24, 7 × and 12 × confirmed. Distractors changed (answer moved); ref "330.24(A) and (B)" -> 330.24. |
| wm-b-07 | 040 | kept | 330.30(D)(2), 6 ft confirmed. Distractors changed (answer moved). |
| wm-b-08 | 041 | kept | 334.10(3), 15-minute finish rating confirmed. Options ascending (answer moved). |
| wm-b-09 | 042 | kept | 334.12(A)(2) confirmed. Answer moved. |
| wm-b-10 | 043 | kept | 334.15(B), 6 in. confirmed. |
| wm-b-11 | 044 | kept | 334.15(C), two 6 AWG / three 8 AWG confirmed. Distractors shifted one size smaller (answer moved). |
| wm-b-12 | 045 | **fixed** | Both 4-1/2 ft values right. whyNot cited 320.30(D)(4) for the AC cable whip; that subdivision is wrong (citation removed). Ref "334.30 and 334.30(B)(2)" -> 334.30; options ordered (answer moved). |
| wm-b-13 | 046 | kept | 334.80, 60°C confirmed. |
| wm-b-14 | 047 | kept | 334.80, more than two cables confirmed. |
| wm-b-15 | 048 | **fixed** | The draft keyed SE cable with a 60°C thermal-insulation ampacity for an unsized interior feeder. That ampacity rule is edition-sensitive (2023 rewrote 338.10(B)(4)(a)) and I could not confirm its 2020 scope for large feeders, so the question was rewritten to test only what is certain: SE may run indoors under the Article 334 Part II rules, USE may not (338.12(B)). |
| wm-b-16 | 049 | kept | 340.12, UF not as service-entrance cable, confirmed. Ref 340.12(1) -> 340.12. |
| wm-b-17 | 050 | kept | 344.30(A), 5 ft confirmed. Options ascending (answer moved). |
| wm-b-18 | 051 | kept | Table 344.30(B)(2), trade size 2 = 16 ft confirmed. Distractors changed (answer moved). |
| wm-b-19 | 052 | kept | 348.20(A), trade size 1/2 confirmed. |
| wm-b-20 | 054 | **fixed** | 36 in. right. whyNot cited 320.30(D)(3) for the 2 ft AC allowance (wrong subdivision). Distractors replaced with the other 348.30(A) lengths (4 ft, 5 ft, 6 ft); ref -> 348.30(A); answer moved. |
| wm-b-21 | 055 | kept | 350.60 confirmed. whyNot reworded (its "20 A" belongs to trade sizes 3/8-1/2 under 250.118(6), not 3/4). Answer moved. |
| wm-b-22 | 056 | kept | 352.44, 1/4 in. confirmed. |
| wm-b-23 | 057 | kept | Table 352.30, trade size 2 = 5 ft confirmed. Distractors replaced with the larger-size spacings (answer moved). |
| wm-b-24 | 058 | **fixed** | Schedule 80 and 50°C right, but the ref said "352.10(F) and 352.12(D)" while the explanation cited 352.12(C). Ref -> 352.12; options reordered (answer moved). |
| wm-b-25 | 059 | kept | 358.26, 360 degrees confirmed. Options ascending (answer moved); an invented "job-specification" whyNot removed. |
| wm-b-26 | 060 | kept | 358.30(A), 3 ft / 10 ft confirmed. Options ordered (answer moved). |
| wm-b-27 | 061 | **fixed** | EMT 4 / ENT 2 right. whyNot said "Trade size 6 is permitted for RMC, IMC, and PVC"; IMC stops at trade size 4. Ref -> 358.20(B) (362.20(B) named in the explanation). |
| wm-b-28 | 062 | **fixed** | 20 percent right. whyNot cited 366.58(A) for the gutter splice fill (it is 366.56(A)); citation removed. Ref -> 376.22(A); options ascending (answer moved). |
| wm-b-29 | 063 | kept | 376.30(A), 5 ft confirmed. Options ascending (answer moved). |
| wm-b-30 | 064 | kept | 376.22(B) (more than 30) and 376.56(A) (75 percent) confirmed. Ref -> 376.22(B); options ordered (answer moved). |

## Added by Claude

| New id | Rule | Why |
|---|---|---|
| 003 | 300.4(E): 1-1/2 in. below metal-corrugated roof decking | A common field and exam rule; the drafts used it only as a distractor. |
| 019 | 310.15(B)(2): 33°C (60°F) rooftop adder below 7/8 in. | A 2020 relocation (2017: 310.15(B)(3)(c)); distractors are the old pre-2017 distance-table adders. |
| 023 | 312.8: feed-through conductors 40 percent, with splices 75 percent | Pairs with the wireway 20 percent rule, a common mix-up. |
| 053 | 348.30(A): FMC 12 in. from boxes, 4-1/2 ft supports | The brief's support-spacing list includes FMC; no draft asked the basic rule. |

## The most serious problems in the drafts

1. **wm-a-27**: the key over-stated the rule. For a small canopy the NEC does not require the
   noncombustible cover (410.23 sets a 180 in.² threshold), and the whyNot told the student there is
   "no allowance".
2. **wm-a-12**: a whyNot taught a false fact: "100 ft is the maximum support spacing for any conductor
   size". Aluminum 6 AWG through 1/0 goes to 200 ft.
3. **wm-b-27**: a whyNot taught that IMC is made up to trade size 6; it stops at 4.
4. **wm-a-09**: the stem could not exist (a raceway entry 4 in. behind the opening of a 2-1/8 in. deep
   box) and was built around trick arithmetic.
5. **wm-a-06**: wrong code location (300.6(A)(3) instead of 300.6(D)). Close behind: wm-a-17 extended the
   2020 dwelling 83 percent rule to 208Y/120-volt systems, and wm-b-15 keyed an edition-sensitive rule.

Patterns across both files: answer keys cycled 0, 1, 2, 3 in id order; about 20 numeric option sets were
not in ascending order; whyNot notes often cited a subdivision for a side fact, and several of those
were wrong (wm-a-10, wm-b-12, wm-b-20, wm-b-28). No keyed answer was flatly wrong, and every draft
carried `confidence: "high"`, including the ones above.

## Uncertain points

- 2020 subdivisions I could not pin down, so the bank cites the section: 300.11 (suspended ceilings,
  likely 300.11(B)(1) in 2020), 314.17 (the 8 in. clamp-free allowance, likely 314.17(B)(2)), 314.29
  (likely 314.29(B) and its exception), 312.8 (likely 312.8(A)), 352.12 (physical damage and the 50°C
  limit).
- 030: the 180 in.² threshold in 410.23, and whether the 2020 314.25(B) refers to it. The question
  uses a 576 in.² pan, so the answer holds either way.
- 019: 310.15(B)(2) as the 2020 number of the rooftop adder (fairly sure; the rule itself is certain).
- 048: whether the 2020 338.10(B)(4)(a) 60°C thermal-insulation limit for SE cable applies to all sizes
  (I believe 2023 narrowed it to 10 AWG and smaller). The rewritten question avoids it.
- Editions: every question is tagged 2020 only. Many would carry over to 2023 and 2026 unchanged; a
  pass with those books could widen the tags.

## Notes for the architect

- `src/content/bank/index.ts` needs `import { QUESTIONS as WIRING_METHODS } from './wiringMethods'` added
  to `BANK` (not done here; not my file). The bank checks of `bank.test.ts` were run against this file
  through a temporary test, now deleted: all pass.
- Questions use inline `{ book: 'NEC', loc, title }` refs (the mdLaw.ts style the brief asked for), not
  `REF.*` from `data/refs.ts`.
- `data/refs.ts` `REF.boxEgc` is titled "Equipment grounding conductor fill: one for all". That is the
  2017 rule; 2020 adds 1/4 allowance for each EGC beyond four (question 024).
