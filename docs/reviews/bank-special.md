# Review of the Special Occupancies, Special Equipment and Special Conditions drafts, 2026-10-16

Files: `src/content/bank/specialOccupancies.ts`, `src/content/bank/specialEquipment.ts`,
`src/content/bank/specialConditions.ts`.

Drafter: Antigravity (`agy`, Gemini 4 Argon High), batches `so` (35), `se` (25) and `sc` (20), written
from memory with no web access. Raw output: `C:\work\agy-briefs\etrainer-bank\out\so.questions.json`,
`se.questions.json`, `sc.questions.json` (not in the repo). Verifier: Claude. Every keyed answer, number
and NEC location was checked against the 2020 NEC. Where memory was not enough, it was checked against
published 2020 text excerpts (Leviton "Captain Code" 2020 pages for 517.31, 555.35, 600.5/600.6, 551.71
and 625.54), the Minnesota DLI livestock bulletin (547 bonding text), and trade-press and forum
transcriptions of the code text (ECM, IAEI, Mike Holt forums) for 511.3, 525.5, 525.23, 620.51, 680.11,
680.13, 680.43, 695.6, 700.5, 700.32, 705.12, 706.15, 708.22, 720.4 and 810.21. NFPA's own 2020 text
was not available to download.

The three files are not yet registered in `src/content/bank/index.ts` (not mine to edit). The architect
needs to add the three imports.

## Totals

| | Special Occupancies | Special Equipment | Special Conditions |
|---|---|---|---|
| Drafts received | 35 | 25 | 20 |
| Kept (answer, reference and substance unchanged; only wording, option order, distractor values or whyNot trims) | 19 | 16 | 13 |
| Fixed (answer, reference, explanation, stem premise or a wrong whyNot changed) | 13 | 9 | 6 |
| Dropped | 3 | 0 | 1 |
| Added by Claude (`draftedBy: 'claude'`) | 1 | 1 | 2 |
| **Questions in the file** | **33** | **26** | **21** |
| Answers A / B / C / D | 7 / 9 / 9 / 8 | 6 / 7 / 6 / 7 | 5 / 5 / 5 / 6 |
| Difficulty 1 / 2 / 3 | 12 / 12 / 9 | 6 / 14 / 6 | 5 / 12 / 4 |
| Kind rule / lookup | 14 / 19 | 12 / 14 | 11 / 10 |

All three batches used a strict 0-1-2-3 answer cycle in id order, so every question was repositioned;
a scratch check confirmed no run of 8 consecutive answers follows the cycle. Numeric options are in
ascending order (AWG options from smallest to largest conductor); answer positions were moved by
changing distractor values, not by breaking the order. Every item is tagged `editions: ['2020']`: none
of the locations was verified for 2023 and 2026, and several are known to move (2023 moved the 517.2
definitions to Article 100 and renumbered Article 547; 2026 reorganized Articles 720-725 and Chapter 8).

Every draft carried `confidence: "high"`, including the wrong ones, so the drafter's confidence told us
nothing.

The files compile cleanly (`tsc -p tsconfig.app.json --noEmit`), and a temporary scratch test (now
deleted) ran the `bank.test.ts` rules against them, plus checks for sequential ids, the 0-1-2-3 cycle,
ascending numeric options and that every reference resolves in `bookHint`.

## 2020 changes a 2017-trained candidate would get wrong (called out in the explanations)

- 555.35 (was 555.3): shore power receptacles 30 mA, dock feeders and branch circuits 100 mA (2017: 30 mA at the marina supply).
- 680.11 (was 680.10): underground wiring within 5 ft of a pool is now allowed in listed wiring methods, cover per Table 300.5.
- 680.21(D): a replaced pool pump motor must get GFCI protection.
- 680.13: the maintenance disconnect moved from 680.12.
- 706.15(A): an ESS at a one- or two-family dwelling needs its disconnect, or a remote control, outside.
- 705.12(B)(3)(2): the 120% rule's number (2017: 705.12(B)(2)(3)(b)).

## Draft by draft: Special Occupancies (`so`)

| Draft | Result | New id | What changed / why |
|---|---|---|---|
| so-01 | kept | special-occupancies-001 | Stem set in a field situation; options reordered. |
| so-02 | kept | -002 | whyNots trimmed. |
| so-03 | kept | -003 | Options put in class/division order. |
| so-04 | kept | -004 | Explanation shortened. |
| so-05 | fixed | -005 | Reference was 500.8(A) (suitability of equipment); the concept is the Article 100 definition of explosionproof equipment. The key no longer repeats the definition text. |
| so-06 | kept | -006 | whyNots trimmed. |
| so-07 | kept | -007 | Options put in ascending order; "unless the enclosure is marked for a closer distance" added, as 501.15(A)(1) allows. |
| so-08 | kept | -008 | Distractor sizes moved to keep ascending order with the key in a new position. |
| so-09 | fixed | -009 | The stem was a close paraphrase of 501.15(C)(6). Rewritten as a field question. |
| so-10 | kept | -010 | Options put in ascending order. |
| so-11 | kept | -011 | The key was the code sentence word for word; reworded. |
| so-12 | fixed | -012 | **Premise wrong for 2020.** The draft said the whole floor of any gasoline repair garage is Division 2 to 18 in. In 2020 a major repair garage floor with 4 air changes/h or 1 cfm/ft² of ventilation is unclassified, and a minor repair garage floor without pits is unclassified. Stem now names a major repair garage without ventilation; reference narrowed to 511.3(C)(1). |
| so-13 | **dropped** | | Pit classification depends on major vs minor repair garage and on ventilation (511.3(C)(3) and (D)), which the stem did not give, and the whyNot's ventilation figure was not verifiable. No single defensible answer as written. |
| so-14 | fixed | -013 | Stem repeated the 513.3(C)(1) text. Two whyNots were invented ("10 ft around open tanks in some industrial settings") or cited Article 516 numbers that changed in 2020. Replaced. |
| so-15 | fixed | -014 | whyNot was wrong: it gave 10 ft as the Division 2 distance around a loose-fill tank opening (Table 514.3(B)(1) uses 5 ft for loose fill, 10 ft for tight fill). Replaced with a neutral note; distractor values moved. |
| so-16 | kept | -015 | Options in ascending order; explanation notes the same rule in 515.8(A), which absorbs so-18. |
| so-17 | fixed | -016 | The code says more than 20 ft and less than 100 ft; options rebuilt around the real confusion (the attended-station rule: within 100 ft, no minimum). |
| so-18 | **dropped** | | Near-duplicate of so-16 (2 ft of cover, last 2 ft in threaded RMC/IMC), only in Article 515. |
| so-19 | **dropped** | | Spray booth: the 3-ft value is right, but the whyNots taught the pre-2014 open-face booth distances (5 ft interlocked, 10 ft not interlocked; 2014 reduced these to 3 ft from openings). The 2020 location was also not verified: Article 516 was reorganized in 2020 and 516.3(D) is no longer the right cite. |
| so-20 | kept | -017 | Stem no longer recites the 517.2 definition; option pairs moved. Notes the 2023 move to Article 100. |
| so-21 | kept | -018 | Stem tightened; explanation says which MC cable armor qualifies. |
| so-22 | fixed | -019 | whyNot invented a rule ("6 receptacles for certain operating rooms with critical care beds under older rules"). Replaced: 4 and 6 were the older general care and critical care counts; 14 is critical care. "Hospital grade" dropped from the stem. |
| so-23 | kept | -020 | Distractor values moved. |
| so-24 | fixed | -021 | Reference was 517.31(B) (transfer switches); the three branches are in 517.31(A) "Separate Branches" (confirmed in the 2020 text). |
| so-25 | kept | -022 | whyNots trimmed. |
| so-26 | kept | -023 | Options reordered. |
| so-27 | fixed | -024 | Reference was 525.5(B)(2), which is the over-600-V rule. The 15-ft clearance for 600 V or less is 525.5(B)(1). Stem uses "portable structure", the code's term. |
| so-28 | fixed | -025 | The exemption condition was misstated as "not accessible to the general public"; the code says "not accessible from grade level". The mounting-height distractor, now covered by the stem, was replaced by "weather-resistant type". |
| so-29 | kept | -026 | Key simplified to Type UF cable. |
| so-30 | fixed | -027 | Keyed 8 AWG is right (checked: the reviewer's first recollection of 6 AWG was wrong). The explanation said "solid or stranded"; the code says solid copper. Fixed. |
| so-31 | kept | -028 | Stem reworded; options in ascending order. |
| so-32 | fixed | -029 | Two whyNots taught wrong numbers: "12,000 VA per 50-A RV site" and "9,600 VA for a tent/seasonal area". 551.73(A) uses 9,600 VA for a 50-A site. Corrected. |
| so-33 | kept | -030 | Options in ascending order. |
| so-34 | kept | -031 | Correct 2020 rule; stem reworded, pairs ordered. |
| so-35 | fixed | -032 | Two facts in one question (90-day limit and GFCI ratings). Split: the time limit stays here, the GFCI rule is special-occupancies-033. |
| (added) | added | -033 | 590.6(A)(1): temporary 125-V 15-, 20- and 30-A receptacles in use by personnel need GFCI. From so-35's second blank. |

## Draft by draft: Special Equipment (`se`)

| Draft | Result | New id | What changed / why |
|---|---|---|---|
| se-01 | fixed | special-equipment-001 | Option "20 A, which may also supply outdoor entrance receptacles" half-repeated the key; replaced by 40 A. The neon whyNot cited "600.5(B)(1)"; in 2020 the rating rule appears to have moved to 600.5(C) (see Open items), so it now cites 600.5 only. |
| se-02 | kept | -002 | Stem repeated the code sentence; reworded. |
| se-03 | fixed | -003 | whyNot said 22-1/2 in. is the attic passageway width; it is the access door dimension (the passageway is 3 ft high by 2 ft wide). Distractors rebuilt. |
| se-04 | kept | -004 | Options in conductor-size order. |
| se-05 | kept | -005 | Options reordered. |
| se-06 | kept | -006 | Stem set in a field situation. |
| se-07 | kept | -007 | 625.41 named for the 125% step. |
| se-08 | kept | -008 | Explanation trimmed. |
| se-09 | fixed | -009 | whyNot called 175% "a common inverse-time breaker multiplier"; in Table 430.52 175% is the dual-element fuse value (inverse-time breakers are 250%). I1max mentioned. |
| se-10 | fixed | -010 | The stem put the controls "at the principal exit doors" (older wording; the 2020 location wording could not be verified). That condition was removed; the keyed requirement (HVAC off, dampers close) is unchanged. |
| se-11 | fixed (rewritten) | -011 | **Wrong under 2020.** The draft keyed the pre-2020 rule that underground wiring not supplying pool equipment is prohibited within 5 ft of the pool. 2020 680.11 permits it in listed methods (RMC, IMC, PVC, RTRC, jacketed MC listed for burial, liquidtight conduit listed for direct burial) with Table 300.5 cover. Rewritten as a 2020-change question. |
| se-12 | kept | -012 | Options in ascending order (distractors moved). |
| se-13 | kept | -013 | Options reordered. |
| se-14 | kept | -014 | Distractor ranges moved. |
| se-15 | fixed | -015 | whyNot invented a meaning for 10 ft ("a diving-platform or indoor ceiling dimension"). Replaced: 10 ft is the horizontal limit in 680.22(B)(4). |
| se-16 | fixed | -016 | Stem was a paraphrase of 680.23(A)(5) and called the 4-in. floor an "exception" (it is in the main rule). Rewritten; the 18-in. standard depth is now a distractor. |
| se-17 | kept | -017 | Pairs ordered; the 6-AWG whyNot cited 250.64(B) for no reason, now plain. |
| se-18 | fixed | -018 | whyNot "24 in.² is a fraction of plate electrode area" was meaningless. Replaced; distractor values moved. |
| se-19 | kept | -019 | Key reworded to "at least 5 ft from it". |
| se-20 | kept | -020 | whyNot on the low-voltage contact limit simplified. |
| se-21 | kept | -021 | Metal piping placed within 5 ft so bonding clearly applies; key shortened. |
| se-22 | kept | -022 | 156% whyNot clarified. |
| se-23 | kept | -023 | Pairs ordered. |
| se-24 | fixed | -024 | `kind` was 'theory' (it is a rule). Reference trimmed from 695.4(B)(2)(a)(1) to 695.4(B)(2) (the deeper subdivision was not pinned). whyNot subsection citations to 695.6 removed. |
| se-25 | kept | -025 | Key now covers the listed fire-resistive systems as well as concrete; 2 hours confirmed for 2020. |
| (added) | added | -026 | 680.43(A): indoor spa required receptacle, 6 ft to 10 ft. The watch list named 680.42-680.43 and no draft covered them. |

## Draft by draft: Special Conditions (`sc`)

| Draft | Result | New id | What changed / why |
|---|---|---|---|
| sc-01 | kept | special-conditions-001 | Invented whyNot ("15 s generator warm-up timers") replaced. |
| sc-02 | kept | -002 | Key reworded; options reordered. |
| sc-03 | fixed | -003 | Reference was 700.5(C) (automatic transfer switches); "transfer equipment shall supply only emergency loads" is 700.5(D) "Use". |
| sc-04 | kept | -004 | The exception (two devices in series, no loads in parallel with the downstream one) is the 2017/2020 wording; stem states the general rule first. |
| sc-05 | fixed | -005 | Stem premise ("a single-lamp luminaire is generally not permitted") was wrong: single-lamp luminaires are fine when coverage overlaps. Rewritten around the actual rule; the 277-V distractor replaced. |
| sc-06 | kept | -006 | Options in ascending order. |
| sc-07 | kept | -007 | whyNots trimmed. |
| sc-08 | kept | -008 | Options reordered. |
| sc-09 | fixed | -009 | Reference narrowed from 705.12(B) to 705.12(B)(3)(2) (confirmed 2020 number); worked example added. |
| sc-10 | kept | -010 | Stem shortened. |
| sc-11 | kept | -011 | 706.15(A) confirmed in the 2020 text. |
| sc-12 | fixed | -012 | Reference was 708.20(F) (generator sets); the 72-hour full-load duration is 708.22(C). The draft's whyNot also mixed in the 1-1/2-hour battery rule. Stem and options rebuilt around the alternate source. |
| sc-13 | kept | -013 | Options in ascending order. |
| sc-14 | kept | -014 | Options reordered. |
| sc-15 | fixed | -015 | The explanation listed CL2 cable among the jacketed cables that remove the 2-in. separation. 725.136(I) accepts only raceway or MC, metal-sheathed, NM or UF cable (or a fixed nonconductor). Corrected. |
| sc-16 | fixed | -016 | Distractor "disconnect handle locked in the ON position with a padlock" was too close to a true statement (760.41(A) permits securing the disconnect in the on position). Replaced. |
| sc-17 | kept | -017 | Stem repeated the code text; reworded. |
| sc-18 | kept | -018 | Options in ascending order. |
| sc-19 | kept | -019 | Reference trimmed to 820.93; the 2020 cross-reference claim (820.100 to 800.100) was removed because it was not verified. |
| sc-20 | **dropped** | | Table 830.47 direct-burial cover for network-powered broadband (18 in.) and its whyNots (6 in. in RMC, 12 in. for low-power under driveways) could not be verified for 2020. The option "0 in. (no minimum in Chapter 8)" was also odd. Low exam value. |
| (added) | added | -020 | 720.4: conductors for circuits under 50 V, at least 12 AWG copper. Article 720 is in the topic range; no draft covered it. |
| (added) | added | -021 | 810.21(H): antenna grounding conductor, at least 10 AWG copper. Contrasts with the 14 AWG protector rule. |

## Open items and caveats

- **600.5 rating subsection.** The Leviton 2020 page shows 600.5(B) as "Marking" (new in 2020), (C) as
  "Rating" and (D) as "Wiring Methods". If that is right, the 20-A and 30-A sign circuit ratings are
  600.5(C) in 2020, not 600.5(B). `docs/research/nec-crosswalk.md` row G-6 (and the "unchanged" list)
  says 600.5(B) in all three editions with medium confidence; the crosswalk owner should check it.
  The questions here cite 600.5(A) (the required outlet, confirmed) and say only "600.5" for the rating.
- **705.20 (2020).** Cited for "open all ungrounded conductors simultaneously, readily accessible".
  2020 consolidated the source disconnect rules into 705.20 (705.11 refers to it); in 2017 the
  "readily accessible" part was 705.22. Medium-high confidence.
- **708.22(C), 525.5(B)(1), 620.51(B), 525.23(B).** Confirmed from text of earlier editions (2008 to
  2017) and later secondary sources; assumed unchanged in 2020.
- **695.6(A)(2).** The 2-hour rating and 2-in. concrete are confirmed for 2020; the exact lettering
  inside (A)(2) was not, so the citation stops at (A)(2).
- **517.18(B) and 517.19(B)(1).** The older counts (4 and 6) are described only as "older editions":
  the edition that raised them to 8 and 14 (2014 or 2017) was not pinned.
- **625.54.** Leviton calls it new in 2020; the explanation does not claim either way.
- **680.11 wiring-method list.** Taken from a secondary transcription of the 2020 text.
- Nothing in these files was checked against the published 2023 or 2026 code, hence `['2020']` throughout.
