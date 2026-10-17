# Review of the Electrical Theory question drafts (`src/content/bank/theory.ts`), 2026-10-16

Drafter: Antigravity (`agy`, Gemini 4 Argon High), batches `th-a` and `th-b`, 25 questions each, from
memory with no web access. Raw output: `C:\work\agy-briefs\etrainer-bank\out\th-a.questions.json` and
`th-b.questions.json` (not in the repo). Verifier: Claude. Every keyed answer, number and NEC location
was checked by hand against the 2020 NEC and standard theory, and every one-step calculation was
reworked.

## Totals

| | Count |
|---|---|
| Drafts received | 50 |
| Kept (no change, or only option order and wording trims) | 16 |
| Fixed (answer, explanation, reference, stem or options changed) | 30 |
| Dropped | 4 |
| Added by Claude (`draftedBy: 'claude'`) | 4 |
| **Questions in `theory.ts`** | **50** |

Answers per position A/B/C/D: 13 / 13 / 11 / 13, with no repeating pattern. Both draft batches used a
strict 0-1-2-3-0-1-2-3 cycle, so every question was repositioned. Numeric options are in ascending
order; the answer position was moved by changing distractor values, not by breaking the order.
Difficulty 1/2/3: 22 / 18 / 10. Editions: the 35 pure theory items carry 2020, 2023 and 2026; the 15
that point into the NEC carry 2020 only, because their locations were not verified for 2023 and 2026.
None of these answers changed from the 2017 NEC. Two locations did change: the conductor-insulation
table (2017 Table 310.104(A), now Table 310.4(1)) and Table 310.16 (2017 Table 310.15(B)(16)). The
`-2` item says so.

Every draft carried `confidence: "high"`, including the ones with wrong content, so the drafter's
confidence told us nothing.

## Draft by draft

| Draft | Result | New id | What changed / why |
|---|---|---|---|
| th-a-01 | fixed | theory-001 | The stem quoted the Article 100 definition of ampacity almost word for word. It now asks what limits ampacity, with real confusions as options (OCPD rating, voltage drop, load). |
| th-a-02 | fixed | theory-002 | Stem set in a field situation. The invented whyNots ("battery standby durations", "thermal steady state") were replaced. The 125% rule is cited (210.19(A)(1), 210.20(A), 215.2(A)(1)). |
| th-a-03 | fixed | theory-003 | The service-lateral whyNot taught the pre-2017 definition ("to the first point of connection to the building"). Corrected to "utility supply to the service point". |
| th-a-04 | fixed | theory-005 | The stem was the verbatim definition of bonded. Reworded; the "dead-front construction" filler option was replaced by "guarding". |
| th-a-05 | fixed | theory-007 | "Available fault current" is not a condition and was a weak option; it was replaced by "locked rotor". The stem no longer names the faults it excludes, which gave the answer away. |
| th-a-06 | fixed | theory-006 | Stem set in a field situation; the "bonding jumper" option (a thing, not a condition) was replaced by "open circuit". Absorbs th-b-23. |
| th-a-07 | fixed | theory-004 | Stem set in a field situation instead of reciting the definition; whyNots trimmed. |
| th-a-08 | fixed | theory-008 | Three invented distractors ("service-entrance system", "autotransformer distribution unit", "supplementary power source") replaced with real confusions. The 250.30 consequence was added. |
| th-a-09 | fixed | theory-009 | The options were straw men ("only above 600 volts", "ferrous metal only"). It now asks which item is not a raceway: a ladder cable tray (Article 392, a support system). |
| th-a-10 | fixed | theory-010 | The "maximum rms voltage" distractor is close to the NEC's own definition of *Voltage (of a circuit)*, so it invited argument. Replaced by "peak voltage"; the stem is now a meter reading. |
| th-a-11 | kept | theory-012 | Options rewritten as ascending quantities (¼, ½, same, 2×). |
| th-a-12 | kept | theory-013 | Options put in ascending order. |
| th-a-13 | kept | theory-016 | Options reordered and trimmed. |
| th-a-14 | kept | theory-014 | Options reordered. |
| th-a-15 | **dropped** | | Near-duplicate of th-b-02 (open neutral on a multiwire branch circuit). th-b-02 was kept because it has numbers the student can check (192 V and 48 V). |
| th-a-16 | kept | theory-017 | The whyNot citing Chapter 9, Table 8 was reworded so the item holds for every edition. |
| th-a-17 | kept | theory-018 | Explanation and whyNots lightly reworded. |
| th-a-18 | fixed | theory-019 | "Why is it 10 ohms and not 14?" had two filler options. It is now the one-step impedance question: 2 / 10 / 14 / 48 ohms, keyed 10 (√(6² + 8²)). |
| th-a-19 | fixed | theory-020 | Naming the ratio W ÷ VA duplicated th-b-21. It is now the one-step calculation 3,840 ÷ 4,800 = 0.80. The distractors are 0.20, 0.60 (var ÷ VA, checked: 2,880 var) and 1.25 (inverted). |
| th-a-20 | fixed | theory-021 | The right answer was the only long, complete option, a test-wise giveaway. Options rewritten to similar length. |
| th-a-21 | fixed | theory-022 | Removed the unsupported claim that the neutral carries "up to 1.732 times the phase current". The "even harmonics double the voltage" straw man was replaced by the fifth harmonic (which cancels on the neutral). Options evened out. |
| th-a-22 | kept | theory-023 | Options put in ascending order. |
| th-a-23 | fixed | theory-024 | The 200 A distractor was replaced by 141.4 A (the √2 mix-up) to move the answer position. 58 A is now shown as 57.7 A. |
| th-a-24 | kept | theory-025 | Options reordered. "Control transformer" was removed from the stem, because 2,400 VA is not a control-transformer size. |
| th-a-25 | fixed | theory-026 | The "supplies only purely reactive loads" straw man was replaced. Options were brought to similar length (the right answer was the only explanatory one). |
| th-b-01 | kept | theory-027 | Options in ascending order; the stem now says 12/2 NM with ground. |
| th-b-02 | fixed | theory-028 | Single-phase legs were called "Phase A" and "Phase B". Renamed, and the loads are stated as 120-volt resistive so the 192/48 V check holds. Options reordered. |
| th-b-03 | fixed | theory-037 | **Wrong location.** The 2020 table is **Table 310.4(1)**, not "Table 310.4(A)". The "600 volts" option was not a temperature and was replaced by 105°C/90°C. The 2017 → 2020 renumbering is noted in the explanation. |
| th-b-04 | kept | theory-042 | Options in ascending order. Added a note that the NEC sizes motor circuits from its FLC tables, not from 746 W. |
| th-b-05 | kept | theory-049 | Explanation and whyNots lightly reworded. |
| th-b-06 | fixed | theory-032 | **Defensible second answer.** "Jumper the conductors together" was keyed wrong, but tying conductors together to test them all to ground is a normal megger practice, and its whyNot taught the opposite. Replaced. The stem was restructured, and "surge arresters" became surge-protective devices. |
| th-b-07 | fixed | theory-040 | The made-up markings "CU-AL" and "AL-2" were replaced with real lug markings, AL7CU and AL9CU. Location 406.3(C) confirmed, with 404.14(C) for switches. |
| th-b-08 | fixed | theory-030 | The filler options "calibrate the internal fuse" and "warm up the leads" were replaced with real misconceptions. |
| th-b-09 | fixed | theory-044 | Location "Table 310.15(B)(1)" changed to Theory. The distractors are now slips in the formula: 103 (subtracted 32), 135 (forgot 32), 193 (added 32 first). Arithmetic: 75 × 1.8 + 32 = 167. |
| th-b-10 | kept | theory-048 | Options trimmed and reordered. The whyNot citing 404.2(A) was reworded so the item holds for every edition. |
| th-b-11 | kept | theory-029 | Wording tightened. |
| th-b-12 | fixed | theory-034 | Plain wording replaced "infinite insulation resistance". The GFCI threshold is stated as about 5 mA (4 to 6 mA, Class A). Options reordered. |
| th-b-13 | fixed | theory-038 | **Wrong location**: "Table 310.4(A)" corrected to Table 310.4(1). Options reordered. |
| th-b-14 | kept | theory-031 | Options trimmed to similar length. |
| th-b-15 | fixed | theory-043 | The distractors were shifted (135,000 W replaced by 13.5 W) to move the answer position. |
| th-b-16 | kept | theory-046 | Options reordered and trimmed. |
| th-b-17 | fixed | theory-033 | "240 volts" is not an ohmmeter reading. It was replaced by "several megohms, like good insulation", the real confusion. Options in ascending order. |
| th-b-18 | fixed | theory-039 | The location was 110.14, but this is a property of the metals, so the ref is now Theory. The whyNot citing Table 310.16 was reworded so the item holds for every edition. |
| th-b-19 | fixed | theory-050 | **Wrong circuit in the options.** They put start buttons "in parallel relative to the starter coil", which would short the coil. They now say "in series/parallel with the existing stop/start". Overload placement moved into the explanation. |
| th-b-20 | kept | theory-036 | Wording trimmed. |
| th-b-21 | **dropped** | | Near-duplicate of th-a-19: the same fact, power factor = W ÷ VA. |
| th-b-22 | fixed | theory-041 | It asked "according to the NEC, why…", but the NEC states the rule, not a reason. The key "does not have a flame-retardant covering" also overstated it: 338.2 says USE is *not required* to have one. It now asks the rule itself (338.12(B)(1), no interior wiring) with permitted uses as distractors. |
| th-b-23 | **dropped** | | Duplicate of th-a-06 (ground fault definition). |
| th-b-24 | fixed | theory-035 | **Wrong teaching.** The draft said reversed line/load wiring leaves the downstream receptacles live and unprotected. In fact the GFCI's own face is the unprotected part (power lands on it directly, around the sensor). The downstream outlets still lose power when the device trips. Key and explanation corrected. |
| th-b-25 | **dropped** | | 110.14(C)(1)(a) terminal temperature is an Article 110 rule and belongs in Wiring and Protection, not Theory. Its fourth option, an "85°C column", does not exist. The item is otherwise sound (keyed 75°C); worth rewriting for the `wiring-protection` bank. |

## Added by Claude

| New id | Sub-area | Why |
|---|---|---|
| theory-011 | Definitions | Voltage to ground on 480Y/277 V (277 V). It is the value behind Table 110.26(A)(1) and the branch-circuit voltage limits. |
| theory-015 | Ohm's law / math | Series voltage drops add to the source (120 − 30 − 50 = 40 V). |
| theory-045 | Conversions | 250 kcmil = 250,000 circular mils. |
| theory-047 | Symbols | Normally closed contact on a ladder diagram. No draft covered the "Symbols" sub-area. |

## Open points

- The NEC locations in this file are typed (`Article 100`, `Table 310.4(1)`, `406.3(C)`, `338.12(B)(1)`),
  as in `mdLaw.ts`; none of them is in `data/refs.ts` yet. Moving them there would let the 2023/2026
  tags be widened in one place once their locations are verified.
- The 15 NEC-located items are tagged 2020 only. The definitions are very likely unchanged in 2023, but
  2023 and 2026 were not checked.
