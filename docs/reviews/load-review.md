# NEC review of the load-calculation recipes, 2026-10-17

Reviewer: Antigravity (`agy`, Gemini 4 Argon High, plan mode, sandboxed, read-only) on 33 generated problems
(11 recipes × 3 seeds, every worksheet line and option) plus the recipe source and our Annex D research. Each claim
was checked by hand; the fixes were made by the load-recipe builder with a test for each.

Before this review the recipes already reproduced Annex D's published results (D1(a) 18,600 VA / 77.5 A / 100 A;
D2(a)-(c); D3 30,320 VA / 126 A; D4(b); D5(b); D6), and one dwelling-standard sample was worked by hand by the
architect (2,750 ft², 15 kW range, 4 kW dryer, 10 kW heat vs 18 A A/C → 30,612.5 VA → 128 A → 150 A) and matched.

| # | Finding | Verdict | Action |
|---|---|---|---|
| 1 | Motor appliances given with hp and nameplate amps must use Table 430.248 (called a blocker) | **Rejected**: 430.6(A)(1) Exception No. 3, a listed motor-operated appliance marked with both uses its nameplate current. The keys were right | Stories give amps × volts only (as Annex D D1(b) does), and the line says appliances use their nameplate |
| 2 | 2020 220.60 compares the A/C (largest motor) at 125% against heat | Accepted (matches our research; outcome never changes thanks to the ≥30% margin) | A/C compared at 125%; no separate 25% line for it |
| 3 | "25% of the largest motor" said its 100% was already counted, false after the 75% appliance demand | Accepted | Reworded |
| 4 | Office buildings miss 220.14(K) (receptacles: larger of the demand-factored load or 1 VA/ft²) | Accepted | Compare line added; some seeds make 1 VA/ft² win |
| 5 | The store's "total calculated load" includes the 125% for continuous loads | Accepted as a labelling error (the asked OCPD was right) | Labelled the service-sizing load; 125% lines cite 230.42(A)(1) (service) or 215.2/215.3 (feeder) |
| 6 | Minimum service rating cited only 230.79(C) | Accepted | Cites 240.6(A) too |
| 7 | Optional method reused standard-method citations (220.11, 220.52) | Accepted | 220.82(B)(1)/(B)(2) |
| 8 | One optional-method wrong option double-counted the heat-pump compressor | Accepted | Fixed |
| 9 | Unequal ranges cited Note 1 instead of Note 2; decimals inconsistent between two lines | Accepted | Note 2; consistent decimals |
| 10 | "Major fraction" taught as 0.6 and up | Accepted (exam courses read 0.5 and up) | "Half a kW or more counts"; exact x.5 ratings still not generated |
| 11 | Fastened-in-place instructions omitted the 2020 220.53 exclusions and the 1/4 hp / 500 W threshold | Accepted | Stated |
| 12 | Apartment dryer and range stories did not say single-phase (three-phase changes the answer) | Accepted | "Served at 120/240 V, single-phase" |
| 13 | Kitchen exclusions and the two-largest floor are in 220.56's text, not the table | Accepted | Cites 220.56; mentions thermostatic or intermittent use |
| 14 | Some wrong-option explanations named loads the story did not have | Accepted | Built from the actual items |
| 15 | Store sample with actual lighting below the table value is "ambiguous" | Rejected: the worksheet follows Annex D D3 (actual × 125% vs the table, keep the larger) | Explanation made explicit |
