# NEC Informative Annex D: calculation methods (2020 baseline, 2023 differences)

Prepared 2026-10-16 for the electrician exam-prep load-calculation worksheets.
This report describes the **method** of each example: the ordered line items, the rule or percentage on each line with its section, how VA becomes amperes, and how amperes are rounded. It does not reproduce the examples' text. The numeric "check values" are given so worksheet engines can be regression-tested against the published examples.

---

## 0. How this was verified (read first)

NFPA's free-access viewer needs a login, so it was not used. ecmag.com blocked automated access. The strongest evidence came from **NFPA's own public committee records** on docinfofiles.nfpa.org:

| Evidence type | What it proves |
|---|---|
| **TIA 20-6** (issued 2019-08-06, incorporated before the 2020 edition was printed) | The full 2020 text of Example D3 |
| **2023-cycle (A2022) CMP-2 First Revisions** (FR-9184, 9185, 9186, 9187) | These are marked up against the 2020 text, so they show the 2020 wording of D1(b), D5(a), D5(b) and D3, plus what changed for 2023 |
| **2026-cycle (A2025) CMP-2 Public Inputs and Second Revisions** (PI-62 to 67, 3074 to 3077; SR-7950 to 7978, SR-7974) | These are marked up against the 2023 text, so they show the 2023 wording of D1(a), D1(b), D2(a), D2(b), D2(c), D3, D3(a), D4(a), D4(b), D5(a) and D5(b) |
| **2020-cycle (A2019) CMP-2 and CMP-6 records** (FR-8057, 8062, 8075, 8076, 8080; SR-7754, 7755, 7759, 7764, 7596, 7772; CMP-6 FR-7971) | The 2020 wording of 220.53, 220.60, 220.14(J) and Table 220.12, and the 2020 versions of D5(b), D3(a) and D7 |
| Leviton "Captain Code 2020", Mike Holt forum threads, IAEI | 314.16(B)(5) and interpretation questions |
| flylib.com copy of a 2005-edition pocket guide | The method of D6, D8, D9 and D10 (old edition; see the confidence notes) |

**Confidence legend** used in each example heading:
- **[2020 seen]** / **[2023 seen]**: the example text for that edition was read in an NFPA record.
- **[2020 inferred]**: the 2023 text was seen, and neither the 2020-cycle nor the 2023-cycle CMP-2 records revise that example. The 2020 text is therefore the same except for renumbered section references.
- **[old-edition method]**: the method comes from an older printing (2005, or forum quotes from 2011 to 2016). No revision was found in the 2020-cycle or 2023-cycle records of the responsible panel. Check against a 2020 or 2023 book before shipping.

### 0.1 Section-number crosswalk, 2020 to 2023 (Article 220 was reorganized in 2023)

| Topic | 2020 | 2023 |
|---|---|---|
| Floor area rule | 220.11. Excludes open porches, **garages**, and unused or unfinished spaces not adaptable for future use | **220.5(C)**. Excludes only open porches and unfinished areas not adaptable for future use as a habitable room or occupiable space. **Garages are no longer excluded** for the standard method. (The 2026 cycle re-adds *detached* garages.) |
| Dwelling unit load, 3 VA/ft² (includes general-use receptacles, the bathroom and garage circuits, 210.52(E)/(G) outlets and 210.70 lighting outlets) | 220.14(J) | **220.41** |
| Non-dwelling lighting unit loads | 220.12, Table 220.12 | **220.42(A), Table 220.42(A)** |
| Lighting demand factors (dwelling: 3,000 VA at 100%, 3,001–120,000 VA at 35%, remainder at 25%) | 220.42, Table 220.42 | **220.45, Table 220.45** |
| Non-dwelling receptacle demand (first 10 kVA at 100%, remainder at 50%) | 220.44, Table 220.44 | **220.47, Table 220.47** |
| Motors in load calculations | 220.50 (430.24, 430.25, 430.26; 440.6) | **220.50(A)** motors (430.24, 430.25, 430.26) and **220.50(B)** A/C (Article 440, Part IV, which includes 440.33) |
| Fastened-in-place 75% factor | 220.53 (four exclusions) | 220.53 (adds a fifth exclusion: **EVSE**) |
| Noncoincident loads | 220.60 (motor wording) | 220.60 ("motor **or air-conditioning** load" wording) |
| Neutral | 220.61 | 220.61. (B)(1) and (B)(2) were restructured with headings; CMP-2 said this was not a technical change |
| Optional dwelling | 220.82 | 220.82 (text identical) |
| Rounding | 220.5(B) | 220.5(B) (text identical) |
| Range branch circuit | 210.19(A)(3) | 210.19(C) |
| 83% dwelling conductors | 310.12, Table 310.12 | 310.12, **Table 310.12(A)** (not deleted) |
| Motor short-circuit and ground-fault table | Table 430.52; 430.52(C)(1) Exceptions No. 1 and No. 2 | **Table 430.52(C)(1)**; the exceptions became **430.52(C)(1)(a) and (b)(1)–(4)** |

### 0.2 Conventions every example uses

1. **Voltages.** Use the nominal values of 220.5(A) (120, 120/240, 208Y/120, 480Y/277 V, and so on) unless the example gives others.
2. **VA to amperes.**
   - Single-phase 120/240-V 3-wire: VA ÷ 240.
   - Three-phase 4-wire: VA ÷ (V_LL × √3). The examples write 208 × 1.732 and 480 × √3.
   - Single-phase 3-wire feeder taken from a 208Y/120 system (two phase legs and a neutral): line-to-neutral VA ÷ (2 × 120), and line-to-line VA ÷ 208.
   - Neutral VA is divided by the same divisor as the phase load.
3. **Rounding (220.5(B), same text in 2020 and 2023).** Calculations *may* be rounded to the nearest whole ampere, with decimal fractions smaller than 0.5 dropped. So 0.5 rounds up: 77.5 becomes 78 and 89.5 becomes 90. Rounding is permitted, not required. D3 says so explicitly, and D3(a) carries VA to three significant figures before converting.
4. **Selecting equipment.**
   - Service or feeder ratings and OCPDs go to the next standard size in 240.6(A) (for example 104 A becomes 110 A, and 126 A becomes 150 A).
   - A one-family service never goes below **100 A**: 230.79(C) for the disconnecting means, and 230.42(B) for the conductors.
   - The motor *feeder* protective device rounds **down** (430.62(A)). Motor *branch-circuit* devices may round **up** (Table 430.52, Exception No. 1 in 2020; 430.52(C)(1)(a) in 2023).

---

## 1. Example-by-example methods

### D1(a) One-family dwelling, standard method. [2023 seen] [2020 inferred]

The inputs are the floor area (exclusive of unfinished cellar, unfinished attic and open porches), one 12-kW range and one 5.5-kW 240-V dryer. kW is taken as kVA per 220.54 and 220.55.

| # | Line item | Rule | 2020 ref (2023 ref) |
|---|---|---|---|
| 1 | General lighting and receptacles | ft² × 3 VA | 220.14(J) with 220.11 (220.41 with 220.5(C)) |
| 2 | Side calculation: minimum branch circuits | Lighting VA ÷ 120 V gives the 15/20-A, 2-wire circuit count. Add 2 small-appliance, 1 laundry and 1 bathroom 20-A circuits, with no load for the bathroom circuit | 210.11(A), (C)(1)–(3) |
| 3 | Small-appliance load | 2 × 1,500 VA | 220.52(A) |
| 4 | Laundry load | 1 × 1,500 VA | 220.52(B) |
| 5 | Lighting demand on lines 1+3+4 | First 3,000 VA at 100%, remainder (up to 120 kVA) at 35% | Table 220.42 (Table 220.45) |
| 6 | Range | One range not over 12 kW: Column C = 8 kW | Table 220.55 |
| 7 | Dryer | Larger of 5,000 VA or nameplate, at 100% for 1–4 dryers | 220.54, Table 220.54 |
| 8 | Net calculated load | Sum of lines 5, 6 and 7 | 220.40 |
| 9 | Amperes | Net VA ÷ 240 V, rounded per 220.5(B) | 220.5 |
| 10 | Minimum service | 100 A even though the calculation is lower | 230.42(B), 230.79(C) |
| N1 | Neutral: lighting, small-appliance and laundry | Demand-factored value from line 5, at 100% | 220.61(A) |
| N2 | Neutral: range | Line 6 × 70% | 220.61(B)(1) |
| N3 | Neutral: dryer | Line 7 × 70% | 220.61(B)(1) |
| N4 | Neutral amperes | Neutral VA ÷ 240 V, rounded. The "over 200 A at 70%" step does not apply because the result is far below 200 A | 220.61(B)(2) |

**Check values:**
- Load: 9,000 VA reduced by demand to 5,100 VA. Net 18,600 VA ÷ 240 = 77.5, rounded to **78 A**, so the service is **100 A**.
- Neutral: 14,550 VA ÷ 240 = **61 A**.
- Branch-circuit side calculation: 4,500 ÷ 120 = 37.5, shown as 38 A.

### D1(b) Same dwelling plus motors and appliances. [2020 seen via FR-9184 base] [2023 seen]

The added loads are:
- a 6-A, 230-V room A/C;
- a 12-A, 115-V room A/C;
- an 8-A, 115-V waste disposer;
- a 10-A, 120-V dishwasher.

The calculation is done **in amperes per conductor** (Line A, Neutral, Line B) and added to D1(a)'s results.

| # | Line item | Line A / N / Line B | Rule |
|---|---|---|---|
| 1 | Carry D1(a) results | 78 / 61 / 78 | D1(a) |
| 2 | 230-V A/C (line-to-line, so no neutral) | 6 / – / 6 | Nameplate amperes |
| 3 | 115-V A/C on Line A and 120-V dishwasher on Line B | 12 / 12 / 10 | The neutral carries the larger of the two for unbalance |
| 4 | 115-V disposer on Line B | – / 8 / 8 | Nameplate amperes |
| 5 | 25% adder | 3 / 3 / 2 | **2020:** "25% of largest motor (see 430.24)". **2023:** relabeled "25% of air-conditioner (see 440.33)" with the same numbers. Line A: 25% of the 12-A A/C. Line B: 2 A, which is 25% of the 8-A disposer under the 2020 label, or 25% of the 6-A A/C (1.5 rounded to 2) under the 2023 label |
| 6 | Totals | 99 / 84 / 104 | Sum of lines 1–5 |
| 7 | Service rating | 104 A becomes **110 A** | Next standard size, 240.6(A) |

220.53 is **not** applied: the disposer and dishwasher are only two fastened-in-place appliances, and room A/C is excluded from 220.53. There is no heating, so 220.60 is not involved.

### D2(a) Optional method, heating larger than A/C. [2023 seen] [2020 inferred]

The inputs are:
- 1,500 ft²;
- a 12-kW range;
- a 2.5-kW water heater;
- a 1.2-kW dishwasher;
- 9 kW of electric heat in five rooms (separately controlled);
- a 5-kW dryer;
- a 6-A, 230-V room A/C.

| # | Line item | Rule | Ref |
|---|---|---|---|
| 1 | A/C kVA | 6 A × 230 V ÷ 1000 = 1.38 kVA (this example uses the nameplate 230 V) | 220.82(C)(1) |
| 2 | Compare A/C with heat | 1.38 kVA is less than 40% × 9 kVA = 3.6 kVA, so A/C is omitted and heat is kept. The example labels the heat selection "item 6"; in the 2020 and 2023 list it is **(C)(5)** | 220.82(C) |
| 3 | General load pile, everything at nameplate | 3 VA/ft²; 2 × 1,500 small appliance; 1,500 laundry; range 12,000 (nameplate, not Table 220.55); water heater; dishwasher; dryer 5,000 | 220.82(B)(1)–(3) |
| 4 | Demand on the general pile | First 10 kVA at 100% plus the remainder at 40% | 220.82(B) |
| 5 | Heating | 9 kVA × 40% (four or more separately controlled units) | 220.82(C)(5) |
| 6 | Total and amperes | (4 + 5) ÷ 240 V, rounded | 220.5(B) |
| 7 | Minimum service | 100 A | 230.42, 230.79 |
| N | Neutral, by the **standard method** | Lighting 4,500 plus three 20-A circuits × 1,500, then Table 220.42 demand (3,000 at 100%, rest at 35%) = 5,100. Range: Table 220.55 Column C = 8 kVA × 70%. Dryer 5 kVA × 70%. Dishwasher 1,200 at 100%. Divide by 240 V | 220.82(A) last sentence, 220.61 |

**Check values:**
- General pile: 29,700 VA becomes 10,000 + 7,880 = 17,880 VA.
- Add heat 3,600 VA for 21,480 VA. 21,480 ÷ 240 = 89.5, shown as **90 A**, so the service is **100 A**.
- Neutral: 15,400 VA ÷ 240 = **64 A**.

### D2(b) Optional method, A/C larger than heating. [2023 seen] [2020 inferred]

The inputs are:
- 1,500 ft²;
- 2 small-appliance circuits and 1 laundry circuit;
- two 4-kW wall ovens and one 5.1-kW cooktop;
- a 4.5-kW water heater and a 1.2-kW dishwasher;
- a 5-kW combination washer/dryer;
- six 7-A, 230-V room A/C units;
- one 1.5-kW bathroom heater.

| # | Line item | Rule | Ref |
|---|---|---|---|
| 1 | A/C kVA | 6 × 7 A = 42 A; 42 A × **240 V** = 10.08 kVA (PF assumed 1.0) | 220.82(C)(1) |
| 2 | Heater | Omitted because A/C is the larger selection. The example says "item 5"; one heater actually falls under (C)(4) at 65%, which gives 0.975 kVA | 220.82(C) |
| 3 | General pile at nameplate | 3 VA/ft², 3 × 1,500, ovens 8,000, cooktop 5,100, water heater, dishwasher, washer/dryer 5,000 | 220.82(B) |
| 4 | Demand | 10 kVA at 100%, remainder at 40% | 220.82(B) |
| 5 | Add A/C at 100% | 10,080 VA | 220.82(C)(1) |
| 6 | Amperes | Total ÷ 240, rounded. The example states only the ampere value as the "service rating" | 220.5(B) |
| N | Neutral (standard method) | 5,100 (as in D2(a)). Ovens plus cooktop = 13.1 kVA × 55% (Table 220.55 Column B, 3 appliances) = 7.2 kVA, × 70% = 5,040. Washer/dryer 5 kVA × 70% = 3,500. Dishwasher 1,200. A/C and water heater are 240-V loads with no neutral. Divide by 240 | 220.61 |

**Check values:**
- General pile: 32,800 VA becomes 10,000 + 9,120 = 19,120 VA.
- Add A/C 10,080 VA for 29,200 VA. 29,200 ÷ 240 = **122 A** (the next standard size would be 125 A).
- Neutral: 14,840 VA ÷ 240 = **62 A**.

### D2(c) Optional method, heat pump with supplementary heat. [2023 seen] [2020 inferred]

The inputs are 2,000 ft², a 12-kW range, a 4.5-kW water heater, a 1.2-kW dishwasher, a 5-kW dryer, and a 24-A heat pump with 15 kW of supplementary heat.

| # | Line item | Rule | Ref |
|---|---|---|---|
| 1 | Heat-pump kVA | 24 A × 240 V = 5.76 kVA. This is smaller than the heating selection, so the *cooling* selection (C)(1)/(C)(2) is not the one used | 220.82(C) |
| 2 | General pile at nameplate | 6,000 + 3,000 + 1,500 + 12,000 + 4,500 + 1,200 + 5,000 | 220.82(B) |
| 3 | Demand | 10 kVA at 100%, remainder at 40% | 220.82(B) |
| 4 | Heating selection | 100% of the compressor plus 65% of the supplementary heat: 5,760 + 9,750 = 15,510 VA. If the compressor is interlocked so it cannot run with the strips, the compressor need not be added | 220.82(C)(3) |
| 5 | Amperes | (3 + 4) ÷ 240, rounded, then the next standard size | 220.5(B), 240.6(A) |

**Check values:**
- General pile: 33,200 VA becomes 10,000 + 9,280 = 19,280 VA.
- Total 34,790 VA ÷ 240 = 144.96, shown as **145 A**, so the service is **150 A**.
- No neutral calculation is shown.

### D3 Store building (non-dwelling). [2020 seen, TIA 20-6] [2023 seen]

**Important:** in both editions D3 is a **120/240-V, single-phase, 3-wire** service. Amperes are VA ÷ 240 (or ÷ 120 for 2-wire branch-circuit capacity). The three-phase non-dwelling example is D3(a).

The 2020 inputs, revised by TIA 20-6 before printing, are:
- an 80 ft × 60 ft store (4,800 ft²);
- 30 ft of show window;
- 80 duplex receptacles;
- 7,000 VA of actual lighting, all continuous.

The 2017 version had 3,000 ft², 3 VA/ft² and 8,500 VA. Do not mix the two.

| # | Line item | Rule | 2020 ref (2023 ref) |
|---|---|---|---|
| 1 | Receptacles (noncontinuous) | 80 × 180 VA = 14,400 VA | 220.14(I) |
| 2 | Receptacle demand | First 10,000 VA at 100%, remainder at 50%, giving 12,200 VA | 220.44, Table 220.44 (220.47, Table 220.47) |
| 3 | General lighting (continuous) | Table value: 4,800 ft² × 1.9 VA/ft² ("retail"; stores are retail) = 9,120 VA | Table 220.12 (Table 220.42(A)) |
| 3a | Actual vs table test | Actual 7,000 × 1.25 = 8,750 VA is less than 9,120 VA, so the table value governs. If actual × 125% were larger, the actual load would be used | Table note: the unit loads already include the 125% |
| 4 | Show-window lighting (continuous) | 30 ft × 200 VA/ft = 6,000 VA | 220.14(G) |
| 5 | Outside sign circuit (continuous) | 1,200 VA | 220.14(F), 600.5(A) |
| 6 | Calculated load, before the 125% sizing step | 12,200 + 9,120 + 6,000 + 1,200 = 28,520 VA | 220.40 |
| 7 | Side calculation: branch circuits | Lighting 8,750 VA ÷ 240 = 36 A (3-wire) or ÷ 120 = 73 A (2-wire); panel capacity must reflect the full 9,120 VA. Show window 6,000 × 1.25 = 7,500 VA, giving 31 A (3-wire) or 63 A (2-wire). Receptacles **14,400 VA undiminished** ÷ 240 = 60 A or ÷ 120 = 120 A | 210.11(B) |
| 8 | OCPD / feeder sizing load | Noncontinuous 12,200 **+** (sign + show window) 7,200 × **1.25** = 9,000 **+** table lighting 9,120 **with no further 125%** | 215.3, 230.90 |
| 9 | Amperes | Total ÷ 240 V, rounded | 220.5(B) |
| 10 | OCPD | Next standard size above the amperes | 240.6(A) |
| 11 | Conductors | Copper at 75°C ampacity ≥ amperes | 215.2, 230.42(A), Table 310.16 |

**Check values:** 30,320 VA ÷ 240 = **126 A**. The OCPD is **150 A** and the conductors are **1 AWG Cu** (130 A at 75°C).

The 2023 example differs only in references, plus FR-9187, which fixed the receptacle line so the ÷120 result is labeled 2-wire.

### D3(a) Industrial feeders in a common raceway (480Y/277 V, three-phase). [2020 seen in part, SR-7596/7772] [2023 seen]

Two building feeders share a raceway with a 35°C ambient and 75°C terminations, using XHHW-2 conductors. Each building has:
- 11,600 VA of 277-V discharge lighting (continuous);
- 22 receptacles on separately derived systems;
- a 5-hp air compressor and a 1.5-hp grinder;
- three AC transformer welders (23 A, 480 V, 60% duty);
- three 15-kW process dryers (continuous).

VA is carried to three significant figures and amperes are rounded per 220.5(B).

| # | Line item | Rule | Ref (2020) |
|---|---|---|---|
| 1 | Receptacles | 22 × 180 = 3,960 VA (≤10 kVA, so 100%) | 220.44 |
| 2 | Welders | Each: 480 V × 23 A × 0.78 (60% duty multiplier) = 8,610 VA. Group: 100%, 100%, 85% gives 24,500 VA | 630.11(A), Table 630.11(A), 630.11(B) |
| 3 | Motors | Table FLC × 480 × √3: 7.6 A gives 6,310 VA and 3.0 A gives 2,490 VA. Add 25% of the largest motor, 1,580 VA, for a motor subtotal of 10,400 VA | 430.24, Table 430.250 |
| 4 | Noncontinuous plus motors | 38,900 VA | 430.24 permits combining them |
| 5 | Continuous loads | Lighting 11,600 + dryers 45,000 = 56,600 VA | |
| 6 | OCPD load | Continuous + noncontinuous + 25% of continuous = 56,600 + 38,900 + 14,200 = 109,700 VA | 215.3 |
| 7 | Amperes | 109,700 ÷ (480 × √3) = **132 A**, so the OCPD is **150 A**. 125 A would be permitted only with a 100%-rated assembly | 240.6(A), 215.3 Exception |
| 8 | Conductor, termination check | 132 A in the 75°C column gives 1/0 AWG | 110.14(C), 215.2(A)(1) |
| 9 | Conductor, raceway check | Actual load 95,500 VA ÷ 0.70 (8 current-carrying conductors, because the neutrals count with nonlinear lighting) ÷ 0.96 (35°C correction, 90°C column) = 142,000 VA, which is 171 A, giving **2/0 AWG** (195 A at 90°C). Check: 195 × 0.96 × 0.70 = 131 A, protected by 150 A under 240.4(B) | 310.15(C)(1), 310.15(B)(1), 310.15(E)(3), 240.4(B) |
| 10 | Neutral | The whole lighting load is the maximum unbalance: 11,600 ÷ 277 = 42 A, which would be 8 AWG. It is raised to **6 AWG** (the Table 250.122 EGC size for 150 A) so it can carry fault current | 220.61, 215.2(A)(1) Exception No. 2, 215.2(A)(2), 250.122 |

### D4(a) Multifamily, standard method (40 units, 120/240 V). [2023 seen] [2020 inferred]

The inputs are 840 ft² per unit, 20 units with ranges of 12 kW or less and 20 with gas ranges, and a common laundry, so no laundry circuit is added to the units.

| # | Line item | Rule | Ref (2020) |
|---|---|---|---|
| 1 | Per-unit lighting | 840 × 3 = 2,520 VA | 220.14(J) |
| 2 | Per-unit small appliance | 2 × 1,500 = 3,000 VA, so the subtotal is 5,520 VA | 220.52(A) |
| 3 | Per-unit demand | 3,000 at 100% + 2,520 at 35% = 3,882 VA | Table 220.42 |
| 4 | Per-unit range | Column C = 8,000 VA, for a total of 11,882 VA | Table 220.55 |
| 5 | Per-unit feeder amperes | ÷ 240: without range 16 A; with range 49.5, shown as **50 A** | 215.2, 220.5(B) |
| 6 | Per-unit neutral | 3,882 + 8,000 × 70% = 9,482 VA ÷ 240 = 39.5 A (left unrounded in the printed example) | 220.61(B)(1) |
| 7 | Meter-bank feeder (20 units, 10 ranges) | 20 × 5,520 with Table 220.42 demand = 40,590 VA. Ranges: 10 under Column C = 25 kW. Total ÷ 240 | Tables 220.42 and 220.55 |
| 8 | Meter-bank neutral | 40,590 + 25,000 × 70%, ÷ 240. Then **the first 200 A at 100% and the excess over 200 A at 70%** | 220.61(B)(1) and (B)(2) |
| 9 | Service (40 units, 20 ranges) | 220,800 VA with demand: 3,000 at 100%, 117,000 at 35%, remainder at 25%, giving 69,150 VA. Ranges: 20 under Column C = 35 kW | Tables 220.42 and 220.55 |
| 10 | Service neutral | 69,150 + 35,000 × 70%, ÷ 240, then the over-200-A step | 220.61(B) |

**Check values:**

| Feeder | Phase load | Neutral |
|---|---|---|
| Meter bank (20 units) | 65,590 VA ÷ 240 = **273 A** | 58,090 VA ÷ 240 = 242 A; 200 + 42 × 0.7 = **229 A** |
| Service (40 units) | 104,150 VA ÷ 240 = **434 A** | 93,650 VA ÷ 240 = 390 A; 200 + 190 × 0.7 = **333 A** |

### D4(b) Multifamily, optional method (220.84). [2023 seen] [2020 inferred]

The inputs are 40 units of 840 ft², each with:
- an 8-kW range;
- four 1.5-kW separately controlled 240-V heaters (6 kW, "or A/C if larger");
- a 2.5-kW water heater;
- a common laundry.

| # | Line item | Rule | Ref (2020) |
|---|---|---|---|
| 1 | Per-unit feeder, standard method | 3,882 VA (as in D4(a)). Range: 8 kW × 80% (Table 220.55 Column B, one appliance) = 6,400 VA. Heat 6,000 VA at 100%. Water heater 2,500 VA. Total 18,782 VA ÷ 240 = **78 A** | Part III, 220.51, Table 220.55 |
| 2 | Per-unit neutral | 3,882 + 6,400 × 70% = 4,480. The 240-V heat and water heater add 0. Result: 8,362 VA ÷ 240 = **35 A** | 220.61 |
| 3 | Meter-bank feeder, optional method | Connected load: 20 × 5,520 (no demand) + 20 × 8,500 (heat + water heater) + 20 × 8,000 (ranges at nameplate) = 440,400 VA. × **38%** (20 units) = 167,352 VA ÷ 240 = **697 A** | 220.84(C), Table 220.84 |
| 4 | Service, optional method | 880,800 VA × **28%** (40 units) = 246,624 VA ÷ 240 = **1,028 A** | Table 220.84 |
| 5 | Neutrals, by the standard method | 20 units: 40,590 + 35,000 (Column C, 20 ranges) × 70% = 65,090 VA, which is 271 A, then 200 + 71 × 0.7 = **250 A**. 40 units: 69,150 + 55,000 (Column C, 40 ranges) × 70% = 107,650 VA, which is 449 A, then 200 + 249 × 0.7 = **374 A** | 220.61, Table 220.55 |

### D5(a) Multifamily at 208Y/120 V, three-phase, standard method. [2020 seen via FR-9186 base] [2023 seen]

This is the same as D4(a) except for the following.

| # | Line item | Rule | Ref |
|---|---|---|---|
| 1 | Per-unit feeder (2 phase legs + neutral) | Lighting 3,882 ÷ (2 × 120) = 16 A, plus range 8,000 ÷ 208 = 39 A, for **55 A**. (The range branch circuit is shown as 38 A.) | 215.2 |
| 2 | Per-unit neutral | **No 70% reduction is permitted** on a 3-wire feeder made of two phases and the neutral of a 4-wire wye | 220.61(C)(1) |
| 3 | Ranges on a 3-phase feeder | Use twice the largest number of ranges connected between any two phases. 10 ranges: largest between two phases = 4, × 2 = 8, Column C = 23 kW. ÷ 2 = 11,500 VA per phase; × 3 = 34,500 VA three-phase equivalent | 220.55 |
| 4 | Meter-bank feeder | (40,590 + 34,500) ÷ (208 × 1.732) = **208 A** | |
| 5 | Meter-bank neutral | (40,590 + 34,500 × 70%) ÷ (208 × 1.732) = **180 A** | 220.61(B)(1) |
| 6 | Service (20 ranges) | 7 between two phases, × 2 = 14, Column C = 29 kW, giving 43,500 VA. (69,150 + 43,500) ÷ 360 = **313 A** | |
| 7 | Service neutral | (69,150 + 43,500 × 70%) ÷ 360 = 277 A. Then 200 + 77 × 0.7 = **254 A** | 220.61(B) |

### D5(b) Multifamily at 208Y/120 V, optional method. [2020 seen via SR-7764 and FR-9185 base] [2023 seen]

| # | Line item | Rule |
|---|---|---|
| 1 | Per-unit feeder | 18,782 ÷ 208 = 90 A. Or split the loads: 3,882 ÷ (2 × 120) = 16.2 A, plus line-to-line 14,900 ÷ 208 = 71.6 A, for 88 A |
| 2 | Meter bank | 167,352 ÷ (208 × 1.732) = **465 A** |
| 3 | Meter-bank neutral | 40,590 + range equivalent 43,500 (14 → 29 kW, × 3/2) = 84,090 VA ÷ 360 = **234 A**. As printed, no 70% is taken here |
| 4 | Service | 246,624 ÷ 360 = **685 A** |
| 5 | Service neutral | 40 ranges: 14 between two phases, × 2 = 28, Column C = 15 + 28 = 43 kW. ÷ 2 = 21.5 kVA, × 3 = 64,500 VA, × 70% = 45,150 VA. 69,150 + 45,150 = 114,300 VA ÷ 360 = 317 A. Then 200 + 117 × 0.7 = **282 A** |

The 2020 edition corrected D5(b)'s neutral method (SR-7764). The 2023 edition only moved parentheses so the divisor reads ÷ (208 V × 1.732).

### D6 Maximum demand for range loads. [old-edition method] (no revision found in 2020 or 2023 CMP-2 records)

**Case A: all ranges the same rating, over 12 kW (Table 220.55, Note 1).**
1. Look up the Column C demand for the number of ranges as if they were 12 kW.
2. Add 5% to it for each kW (or major fraction of a kW) by which the rating exceeds 12 kW.
3. Check: 24 ranges at 16 kW. Column C gives 39 kW; +20% gives **46.8 kW**.

**Case B: unequal ratings (Note 2).**
1. Count any range under 12 kW as 12 kW, then average the ratings.
2. Round the excess over 12 kW to whole kW, rounding a major fraction (0.5 or more) up.
3. Add 5% per kW to the Column C value for that number of ranges.
4. Check: 30 ranges totaling 408 kW average 13.6 kW, so the excess of 1.6 kW counts as 2 kW. Column C (15 kW + 1 kW × 30) = 45 kW; +10% gives **49.5 kW**.

The example gives the results only in kW. For amperes, apply the feeder voltage divisor (÷ 240, or ÷ (V × √3) with the "twice the maximum between any two phases" rule for three-phase).

### D7 Sizing service conductors for dwellings (83% rule). [2020 seen via CMP-6 FR-7971] [2023 seen via the 2026-cycle FR-8175 base]

1. Pick the service rating, then multiply by **0.83**. Check: 175 A × 0.83 = 145.25 A.
   - This is permitted for a 100–400-A service, or a main feeder, carrying the **entire** load of a one-family dwelling or of an individual dwelling unit (310.12(A) and (B)).
2. With no correction or adjustment, select a conductor from the 75°C column: **1/0 Cu or 3/0 Al**. Equivalently, use Table 310.12 (2020) or Table 310.12(A) (2023), whose 175-A row gives the same sizes.
3. With correction: XHHW-2 in a 38°C ambient has a factor of 0.91. 145.25 ÷ 0.91 = 159.6 A, and the example selects **2/0 Cu or 4/0 Al**.
   - Forum experts argue that the 90°C column could be used, which would leave 1/0 Cu.
   - The 2026 cycle rewrote this part (49°C, factor 0.82, and an explicit comparison against the termination ampacity).
4. The dwelling table reads, in Cu/Al:

| Service (A) | 100 | 110 | 125 | 150 | 175 | 200 | 225 | 250 | 300 | 350 | 400 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Copper | 4 | 3 | 2 | 1 | 1/0 | 2/0 | 3/0 | 4/0 | 250 | 350 | 400 |
| Aluminum | 2 | 1 | 1/0 | 2/0 | 3/0 | 4/0 | 250 | 300 | 350 | 500 | 600 |

### D8 Motor circuit conductors, overload and short-circuit/ground-fault protection. [old-edition method; quoted 2011–2016] (no revision of D8 found in the 2020 or 2023 CMP-11 records)

The motors, on a 480-V three-phase feeder, are:
- one 25-hp, 460-V squirrel-cage motor, Design B, SF 1.15, nameplate 32 A;
- two 30-hp, 460-V wound-rotor motors, nameplate primary 38 A, secondary 65 A, 40°C rise.

| # | Step | Rule | Check |
|---|---|---|---|
| 1 | Branch-circuit conductors | **Table** FLC (not nameplate) × 125% | 25 hp: 34 A, so 43 A. 30 hp: 40 A, so 50 A |
| 2 | Wound-rotor secondary conductors | **Nameplate** secondary current × 125% | 65 A, so 81 A (430.23(A)) |
| 3 | Overload protection | **Nameplate** current × 125% (SF ≥ 1.15, or temperature rise ≤ 40°C). If the motor will not start, up to 140% per 430.32(C) | 32 A, so 40 A. 38 A, so 47.5 A |
| 4 | Branch short-circuit/ground-fault, 25-hp motor | Table 430.52 (2023: Table 430.52(C)(1)) × **Table** FLC | Nontime-delay fuse 300% = 102 A, rounded up to **110 A** (Exception No. 1; 2023: (C)(1)(a)). If it will not start, up to 400% = 136 A, so 125 A (Exception No. 2(a); 2023: (C)(1)(b)(1)). Time-delay fuse 175% = 59.5 A, so **60 A**. If it will not start, up to 225% = 76.5 A, so 70 A |
| 5 | Feeder short-circuit/ground-fault | Largest branch device + sum of the **other** motors' **table** FLCs, rounded **down** | 110 + 40 + 40 = 190 A, so **175 A** (430.62(A)) |

The wound-rotor secondary current is not added to the feeder. The copies seen do not compute a feeder *conductor* ampacity. If you add one, 430.24 gives 1.25 × 40 + 40 + 34 = 124 A.

### D9 and D10: these are **elevator** feeders (Article 620), not generators or general motors. [old-edition method] (no revision found in the 2020 or 2023 CMP-12 records; the 2023 220.40 informational note still points to "D1(a) through D10")

**D9, Feeder ampacity for generator-field control (motor-generator sets).** Six elevators on 460-V three-phase: one 40-hp motor (52 A) and five 30-hp motors (40 A).
1. Multiply each nameplate current by **140%**, the Table 430.22(E) intermittent-duty value for a continuous-rated motor (620.13, 620.61(B)). This gives 73 A and 56 A.
2. Sum the results: 353 A.
3. Apply the Table 620.14 demand factor for 6 elevators, **0.79** (620.14), giving 279 A. Constant loads are excluded from this step.
4. Add each 10-A continuous controller load × 125% (430.24, 215.3): 6 × 12.5 = 75 A.
5. Result: **354 A**, which is the basis for selecting the feeder conductor.

**D10, Feeder ampacity for adjustable-speed-drive control.** Six elevators, each with a 95-kVA drive transformer at 90% efficiency.
1. Per elevator: 95,000 ÷ (√3 × 460) ÷ 0.90 = 133 A.
2. All six: 798 A, × 0.79 = 630 A.
3. Add the controllers: 6 × 12.5 A = 75 A.
4. Result: **705 A**.

---

## 2. Answers to the specific questions

### Q1. "25% of the largest motor" in the standard method

- **Yes, it is added in D1(b), and only there among the one-family examples.**
  - D1(a) has no motors.
  - The optional-method examples (D2) never add it, because 220.82 has no motor adder.
- **How D1(b) applies it:** per conductor, to the largest motor on that line.
  - Line A and the neutral: 25% of the 12-A, 115-V room A/C, which is 3 A.
  - Line B: 2 A. In 2020 this is labeled "largest motor (430.24)", so it is 25% of the 8-A disposer.
  - The 2023 edition relabeled the line "25% of air-conditioner (see 440.33)" and kept the numbers. FR-9184 says the change shows "the largest air-conditioning or motor load as covered in 440.33". This matches the 2023 split of 220.50 into (A) motors under 430.24 and (B) A/C under Article 440, Part IV.
- **When heating is the larger noncoincident load and the A/C is dropped:**
  - No Annex D standard-method example shows this case. D1 has no heat; D4 lists heat "or A/C if larger" but has no motors.
  - The governing rule is 220.60. Its second sentence was added in 2020 by FR-8062, whose committee statement says it clarifies that the 125% motor treatment (220.18(A) in 2020) is used **when deciding** whether the motor load is one of the loads kept.
  - In the 2026 cycle (FR-8181), CMP-2 restated that intent: the 125% language was added so that *determining the largest* noncoincident load includes the motor-load treatment. They rewrote the section because the 2020/2023 wording confused people. IAEI (NFPA staff author, 2021) reads the 2020 text the same way: compare using 125% of the motor, and if it is still the smaller load, disregard it.
  - **Recommended worksheet logic:**
    1. Compare heat at 100% (220.51) against A/C at 125% when the compressor is the largest motor.
    2. Keep the larger and drop the other entirely; do not add both.
    3. If heat wins, apply the 125% of 430.24 (via 220.50) to the largest motor **still in** the calculation, such as a disposer or a blower. This last step is reasoned from 220.50 and 430.24; Annex D does not show it.
  - Note that some experts read the 2023 literal text as requiring both loads to be added; this was debated on Mike Holt's forum in 2023. Tell the user the topic is contested.

### Q2. Fastened-in-place appliances (220.53) in D1

- **D1 never applies the 75% factor.**
  - D1(a)'s only appliances are a range and a dryer, which are excluded.
  - D1(b) adds only two qualifying fastened-in-place appliances, the disposer and the dishwasher, which is fewer than four. They are added at 100% in amperes.
  - Room A/C is excluded.
  - No Annex D example demonstrates the 75% factor.
- **What counts toward "four or more"** (2020 SR-7755 and 2023 text): appliances that are fastened in place, rated **1/4 hp or more, or 500 W or more**, and served by the same feeder or service. This threshold is new in **2020**; 2017 had none.
- **Excluded in 2020:** household electric cooking equipment that is fastened in place, clothes dryers, space-heating equipment, and air-conditioning equipment.
- **Excluded in 2023:** the same four, **plus EVSE**.
- **Typical items that count:** water heater, dishwasher, disposer, compactor, well, sump or pool pump, attic fan. A built-in microwave is arguably fastened-in-place cooking equipment and excluded; this is debated.

### Q3. Optional method, 220.82 (identical in 2020 and 2023)

- **The "first 10 kVA at 100%, remainder at 40%" pile (220.82(B))** contains:
  1. 3 VA/ft². Floor area is from outside dimensions and excludes open porches, garages, and unused or unfinished spaces not adaptable for future use; 220.82(B)(1) still excludes garages in 2023.
  2. 1,500 VA for each 20-A small-appliance circuit and each laundry circuit.
  3. The **nameplate** rating of:
     - all appliances that are fastened in place, permanently connected, or located on a specific circuit;
     - ranges, wall ovens and counter-mounted cooking units, at **nameplate, not Table 220.55**;
     - clothes dryers not on the laundry circuit, at **nameplate, not the 5,000-VA minimum of 220.54**;
     - water heaters.
  4. The nameplate amperes or kVA of permanently connected motors not already in item 3.
- **Heating and A/C are not in the pile.** 220.82(C) adds the **largest** of these six selections:
  1. 100% of A/C and cooling.
  2. 100% of a heat pump used without supplemental electric heat.
  3. 100% of the heat-pump compressor plus 65% of the supplemental heat for central systems. The compressor may be left out if it is interlocked from running with the supplemental heat.
  4. 65% of electric space heating with fewer than four separately controlled units.
  5. 40% of electric space heating with four or more separately controlled units.
  6. 100% of thermal storage and other systems expected to run continuously at full nameplate. Such systems may not be calculated under any other selection.
- **Which selection each example uses:**
  - D2(a): **(5)**, 40% of 9 kVA; the A/C, at 1.38 kVA, is dropped.
  - D2(b): **(1)**, A/C at 10.08 kVA; the heater is dropped.
  - D2(c): **(3)**, 5.76 + 0.65 × 15 = 15.51 kVA.
- The neutral is calculated separately by 220.61, using standard-method demand factors (220.82(A)).
- Scope (220.82(A)): one dwelling unit served by a single 120/240-V or 208Y/120-V, 3-wire set of conductors with an ampacity of 100 A or more.

### Q4. Neutral (220.61)

- **Basic calculation (220.61(A)):** the neutral load is the maximum unbalance, meaning the largest net load between the neutral and any one ungrounded conductor. 240-V-only loads (A/C, water heaters, 240-V heat) contribute 0.
- **Permitted reductions (220.61(B)):**
  - (1) Ranges, wall ovens, cooktops and dryers, after applying Table 220.55 and Table 220.54, may be taken at **70%**.
  - (2) The portion of the unbalanced load **over 200 A** may be taken at **70%**. This applies to 3-wire DC or single-phase, 4-wire three-phase, and 2-phase systems.
- **Prohibited reductions (220.61(C)):**
  - (1) No reduction for a 3-wire circuit made of two phases and the neutral of a 4-wire wye. D5(a) uses this rule for the individual unit feeders.
  - (2) No reduction for the portion consisting of nonlinear loads on a 4-wire wye.
- **What D1 does:**
  - D1(a): demand-factored lighting, small-appliance and laundry load at 100%, + range 8 kVA × 70%, + dryer 5.5 kVA × 70%. 14,550 VA ÷ 240 = **61 A**. The 200-A step is not reached.
  - D1(b): adds only the 120-V loads in the neutral column (12-A A/C, 8-A disposer, and the 3-A 25% adder), giving 84 A.
- **Where the over-200-A step appears:** in D4(a), D4(b), D5(a) and D5(b), always applied in amperes after converting VA:

| Example | Neutral before the step | After: 200 A + excess × 70% |
|---|---|---|
| D4(a) meter bank | 242 A | 229 A |
| D4(a) service | 390 A | 333 A |
| D4(b) meter bank | 271 A | 250 A |
| D4(b) service | 449 A | 374 A |
| D5(a) service | 277 A | 254 A |
| D5(b) service | 317 A | 282 A |

### Q5. Store example D3

The method is in §1, D3.

- **Single-phase, not three-phase.** D3 is 120/240-V single-phase in 2020 and 2023, so amperes are VA ÷ 240.
- **Lighting:** the Table 220.12 / 220.42(A) unit load (1.9 VA/ft² retail) **already includes the 125%**, so it is not multiplied again.
  - The actual lighting × 125% is used only to decide whether actual or table governs, and to count branch circuits.
- **Continuous loads not from the table:** the show window (200 VA per linear foot, 220.14(G)) and the sign (1,200 VA, 220.14(F)) are multiplied by 125%.
- **Receptacles:** 180 VA each, with Table 220.44 / 220.47 demand: 10 kVA at 100%, remainder at 50%. These are noncontinuous, so there is no 125%.
- **Result:** 30,320 VA ÷ 240 = 126 A. The OCPD is 150 A and the conductors are 1 AWG Cu.
- **The three-phase case:** D3(a), at 480Y/277 V, is the industrial example. It converts with ÷ (480 × √3) and applies continuous × 125% + noncontinuous for the OCPD.

### Q6. Rounding and the minimum one-family service

- **220.5(B), identical in 2020 and 2023:** calculations may be rounded to the nearest whole ampere, with decimal fractions **smaller than 0.5 dropped**, so x.5 rounds up.
  - The 2026 cycle (FR-7994) adds the word "Load" to make clear that the rule applies to load calculations, not to ampacity or OCPD selection.
- **230.79(C), same in 2020 and 2023:** a one-family dwelling's service disconnecting means must be rated at least **100 A, 3-wire**. 230.42(B) ties the service-conductor ampacity to the same minimum.
  - Other installations: 230.79(D) requires 60 A; 230.79(A) and (B) require 15 A and 30 A for one-circuit and two-circuit installations.
  - D1(a) (78 A) and D2(a) (90 A) both end at 100 A.

### Q7. Box fill, 314.16(B)(5): EGCs beyond four

- **The quarter-allowance rule is a 2020 change, and it is unchanged in 2023.**
- **2017 and earlier:** one volume allowance, based on the largest EGC or bonding jumper present, covered all EGCs. An **additional** allowance was required for an additional set of isolated-ground EGCs permitted by 250.146(D).
- **2020 (and 2023):**
  - Where **up to four** EGCs or equipment bonding jumpers **enter** the box, make a single allowance per Table 314.16(B), based on the largest EGC or bonding jumper entering the box.
  - Make a **one-quarter** volume allowance for **each additional** EGC or bonding jumper that enters the box, based on the largest EGC or bonding conductor.
  - The separate 250.146(D) isolated-ground allowance was **deleted**. Isolated-ground EGCs now simply count in the total.
  - Source: Leviton's 2020 change page shows the struck and inserted text. Forum posts in 2025 quote the same rule from the 2023 NEC.
- **Worked check:** six 14 AWG EGCs = 1 × 2.00 + 2 × 0.25 × 2.00 = **3.00 in³**.
- **Open interpretations to flag in the app:**
  - With mixed sizes, it is debated whether the quarter allowances use the largest EGC in the box (the conservative and more common reading) or the largest of the "additional" conductors.
  - Pigtails and bonding jumpers that never leave the box are generally not counted, because the 2020/2023 text counts conductors that "enter" the box.
- The IRC (2024, E3905.12.2.5) mirrors the 2020 rule.

---

## 3. Quirks in the printed examples to handle in a grader

1. **220.82(C) item numbers are off by one.** D2(a) calls the 40% selection "item 6"; it is (C)(5). D2(b) cites "item 5" for omitting a single heater; that would be (C)(4). Cite selections by their content, not their number.
2. **A/C voltage is inconsistent.** D2(a) converts A/C at the 230-V nameplate (1.38 kVA); D2(b) and D2(c) use 240 V. 220.5(A) says to use nominal voltages unless others are specified. Accept both, or pick 240 V and document it.
3. **Rounding is inconsistent.**
   - D4(a)'s per-unit neutral is left at 39.5 A.
   - D5(a) shows the range at 38 A for the branch circuit and 39 A in the feeder (8,000 ÷ 208 = 38.46).
   - Several D5 three-phase results only match when 1.73 is used instead of 1.732: 99,600 VA gives 276.5 by calculation but 277 printed; 84,090 VA gives 233.4 but 234 printed.
   - Allow ±1 A on three-phase conversions.
4. **The 70% is applied inconsistently in D5(b).** The 20-unit meter-bank neutral adds the range equivalent without the 70% that is used in the 40-unit neutral and in D5(a).
5. **D2(c) wording.** The statement that the heat pump "need not be included" refers to the *cooling* selection. The compressor *is* included in selection (C)(3). The 2026 cycle deleted the sentence as confusing.
6. **2023 floor area.** For the standard method, 220.5(C) no longer lists garages as excluded, while 220.82(B)(1) still excludes them.
7. **D1(b) label.** The 2023 "25% of air-conditioner" label coincides numerically with the 2020 "largest motor" result on Line B.

## 4. Heads-up: the 2026 edition changes these examples

These come from the CMP-2 second-draft working output, which is marked subject to revision. The final 2026 text was not verified.
- Article 220 becomes Article 120.
- The dwelling feeder/service unit load drops to **2 VA/ft²**; branch circuits stay at 3 VA/ft².
- The optional dwelling method's first block becomes **8 kVA** at 100%.
- D3 applies 125% to the table lighting as well: 32,600 VA gives 136 A and 1/0 Cu.
- D5(b) is reworked using "twice the units between phases".
- D7 is reworked at 49°C with a 0.82 factor.
- 220.60 moves to 120.6 and is rewritten.

**Pin the edition in every worksheet.**

---

## 5. Sources

**NFPA official records (public PDFs):**
- TIA 20-6, Annex Example D3, 2020 NEC: https://docinfofiles.nfpa.org/files/AboutTheCodes/70/TIA_70_20_6.pdf (also in https://ags.hawaii.gov/wp-content/uploads/2024/07/2020-NFPA-70-NEC-TIAs.pdf)
- CMP-2, 2020 cycle:
  - First Draft working output: https://docinfofiles.nfpa.org/files/AboutTheCodes/70/70_A2019_NEC_P02_FD_PrelimFR.pdf (220.12, 220.14(J), 220.42, 220.53, 220.60 [FR-8062], D3(a) neutral)
  - Second Draft ballot: https://docinfofiles.nfpa.org/files/AboutTheCodes/70/70_A2019_NEC_P02_SD_BallotFinal.pdf (SR-7754, 7755 [220.53], 7759, 7764 [D5(b)], 7596 and 7772 [D3(a)], 7773 [D4(a)])
- CMP-2, 2023 cycle:
  - First Draft ballot: https://docinfofiles.nfpa.org/files/AboutTheCodes/70/70_A2022_NEC_P02_FD_BallotFinal.pdf (2020 base text of Article 220 including 220.5(B), 220.11 and 220.50; FR-9171 [220.60], 9178 [220.61], 9182 [220.53], 9184 [D1(b)], 9185 [D5(b)], 9186 [D5(a)], 9187 [D3])
  - Second Draft ballot: https://docinfofiles.nfpa.org/files/AboutTheCodes/70/70_A2022_NEC_P02_SD_BallotFinal.pdf (SR-8095 [220.5(C)], 8102 [220.60], 8103 [220.61(B)])
  - Second Draft agenda: https://docinfofiles.nfpa.org/files/AboutTheCodes/70/70_A2022_NEC_P02_SD_MeetingAgenda_10_21.pdf (2023 draft text of 220.42(A) table, 220.53, 220.60, 220.61)
- CMP-2, 2026 cycle (quotes the 2023 text):
  - FD agenda: https://docinfofiles.nfpa.org/files/AboutTheCodes/70/70_A2025_NEC_P02_FD_MeetingAgenda_0124.pdf (PIs quoting 2023 220.5(B), 220.53, 220.60, 220.82, and D1(b), D2(a), D2(b), D4(b))
  - FD working output: https://docinfofiles.nfpa.org/files/AboutTheCodes/70/70_A2025_NEC_P02_FD_PrelimFR.pdf (FR-8013 [220.41], 7995 [garages], 8181 [220.60 intent], 7994 [220.5(B)])
  - SD working output: https://docinfofiles.nfpa.org/files/AboutTheCodes/70/70_A2025_NEC_P02_SD_PrelimSR.pdf (SR-7950 to 7978 and SR-7974: full 2023-based text of D1(a) through D5(b), D3 and D3(a))
- CMP-6 (D7, 310.12):
  - https://docinfofiles.nfpa.org/files/AboutTheCodes/70/70_A2019_NEC_P06_FD_PrelimFR.pdf
  - https://docinfofiles.nfpa.org/files/AboutTheCodes/70/70_A2019_NEC_P06_SD_BallotFinal.pdf
  - https://docinfofiles.nfpa.org/files/AboutTheCodes/70/70_A2022_NEC_P06_FD_BallotFinal.pdf
  - https://docinfofiles.nfpa.org/files/AboutTheCodes/70/70_A2025_NEC_P06_FD_PrelimFR.pdf
- CMP-11 (Table 430.52(C)(1), 430.62(A), 2023): https://docinfofiles.nfpa.org/files/AboutTheCodes/70/70_A2022_NEC_P11_SD_BallotFinal.pdf and https://docinfofiles.nfpa.org/files/AboutTheCodes/70/70_A2019_NEC_P11_FD_PrelimFR.pdf
- CMP-10 (230.79, 2023 text): https://docinfofiles.nfpa.org/files/AboutTheCodes/70/70_A2025_NEC_P10_FD_MeetingAgenda_0124.pdf
- CMP-12 (no D9/D10 revisions found): https://docinfofiles.nfpa.org/files/AboutTheCodes/70/70_A2022_NEC_P12_FD_BallotFinal.pdf and https://docinfofiles.nfpa.org/files/AboutTheCodes/70/70_A2022_NEC_P12_SD_BallotFinal.pdf

**Trade and other sources:**
- Leviton Captain Code 2020, 314.16(B)(5): https://captaincode2020.leviton.com/node/246
- 314.16(B)(5), 2020 vs 2017: https://www.electricallicenserenewal.com/Electrical-Continuing-Education-Courses/NEC-Content.php?sectionID=884
- UpCodes, residential E3905.12.2.5 (2024): https://up.codes/s/equipment-grounding-conductor-fill
- IAEI, Vigstol (NFPA), "Performing Calculations…", March 2021 (220.60): https://iaeimagazine.org/?p=21045
- Mike Holt forums:
  - box fill 2020: https://forums.mikeholt.com/threads/box-fill-counting-ground-conductors-nec-2020-change.2568132
  - box fill 2023: https://forums.mikeholt.com/threads/314-16-box-fill.2586591
  - D1(b): https://forums.mikeholt.com/threads/nec-example-d1b.61876/
  - 220.60, 2023: https://forums.mikeholt.com/threads/220-60-noncoincident-loads-the-final-sentence-is-messing-me-up.2574122/
  - 220.60 PI: https://forums.mikeholt.com/threads/pi-220-60-noncoincident-loads.2575078/
  - D7: https://forums.mikeholt.com/threads/error-in-annex-d-example-d7.2573172
  - D8: https://forums.mikeholt.com/threads/example-d8-in-the-nec.129654/ and https://forums.mikeholt.com/threads/annex-d-problem-d8-wound-rotor-load-left-out-of-feeder-calc.103192/
  - Table 220.12, 2020: https://forums.mikeholt.com/threads/general-lighting-load-calc.2567334
- flylib (2005 Pocket Guide):
  - D6: https://flylib.com/books/en/2.419.1/example_no_d6_maximum_demand_for_range_loads.html
  - D8: https://flylib.com/books/en/2.419.1/example_no_d8_motor_circuit_conductors_overload_protection_and_short_circuit_and_ground_fault_protection.html
  - D9: https://flylib.com/books/en/2.419.1/example_no_d9_feeder_ampacity_determination_for_generator_field_control.html
  - D10: https://flylib.com/books/en/2.419.1/example_no_d10_feeder_ampacity_determination_for_adjustable_speed_drive_control_see_2152_43024_62013_62014_62061_tables_43022_e_and_62014_.html

**Downloaded files** (NFPA PDFs and their .txt extractions, forum HTML) are in `C:\Users\cohenjas\AppData\Local\Temp\claude\S--Users-cohenjas-OneDrive-electrical-trainer\e08c1bc2-d4df-4afa-9884-448d9d96587b\scratchpad\research\annexd\`. Two files there are block pages, not content: `TIA_70_20_6.pdf` (69 bytes, a 403 page from appa.org; the real TIA is `nfpa_TIA_70_20_6.pdf`, also inside `hawaii_2020_NEC_TIAs.pdf`) and `ecmag_310_12_heat.html` (a Cloudflare block page).
