## 1. Why Field Electricians Lose Points on Exam Math (Separated & Ranked)

When an experienced electrician says he is "not a math person," he almost never means he cannot multiply $28 \times 1.25$ on a calculator. He means that when he looks at a dense block of text containing six numbers, his working memory overloads before he knows what to multiply by what.

Here are the seven distinct steps in an exam calculation, ranked from **most points lost** to **least points lost**, with concrete examples.

| Rank | Failure Stage | Est. Share of Lost Points | What Actually Goes Wrong |
| :--- | :--- | :--- | :--- |
| **1** | **Problem Translation & Bucket Routing** ("What applies to what?") | **~30%** | Dumping loads into the wrong bucket, applying a demand factor to the wrong subtotal, or applying a multiplier to everything instead of one item. |
| **2** | **NEC Table Navigation, Column Selection & Footnotes** | **~25%** | Pulling from the wrong column ($90^\circ\text{C}$ vs. $75^\circ\text{C}$, Table 220.55 Col B vs. Col C), missing a mandatory table note, or using problem-text nameplate amps instead of NEC table amps. |
| **3** | **Method Selection** ("Which recipe?") | **~15%** | Running the Standard Calculation (Art. 220 Part III) when the question asks for the Optional Calculation (Art. 220 Part IV), or using Annex C when wire sizes are mixed. |
| **4** | **Units, Scale & Formula Setup** | **~12%** | Mixing $\text{kW}$ and $\text{VA}$, forgetting the round-trip $2$ in single-phase voltage drop, or putting $\sqrt{3}$ on the wrong side of the division sign. |
| **5** | **Calculator Execution on a 4-Function Keypad** | **~8%** | Chaining `12300 - 3000 × 0.35 =` without hitting `=` after the subtraction, or dividing by `208 × 1.732` without parentheses so the calculator multiplies by `1.732` instead of dividing by it. |
| **6** | **NEC Rounding & "Next Standard Size" Rules** | **~6%** | Applying schoolhouse rounding ($0.5$ rounds up) where the NEC requires $0.8$ (conduit fill) or prohibits rounding up (box fill, tap rules, small transformer primaries). |
| **7** | **Multiple-Choice Distractor Traps** | **~4%** | Seeing his exact calculator number in Option B and assuming he is right—not realizing Option B was engineered specifically for the mistake he just made. |

### Breakdown of the 7 Stages

#### 1. Reading the Word Problem & Routing Numbers into Buckets (#1 Point Killer)
Exam writers pack calculation questions with three kinds of numbers:
* **Active inputs** you must calculate with (e.g., `"2,600 sq ft"`, `"14 kW range"`).
* **Override inputs** that exist solely to trick you into using them instead of a code minimum or table value (e.g., `"4,500 W dryer"` when 220.54 mandates a $5,000\text{ VA}$ floor; `"motor nameplate FLA 25 A"` when 430.6(A)(1) mandates Table 430.248's $28\text{ A}$).
* **Pure distractors** that do nothing (e.g., `"a 2,600 sq ft house with an unfinished 800 sq ft basement not adaptable for future use and a 400 sq ft open porch"`—both excluded by 220.12; or `"four 20-amp small-appliance branch circuits"` when the question asks for *minimum* required small-appliance load).

A weak math student reads left-to-right and starts punching numbers into the calculator as he sees them. By the third sentence, he has added the water heater to the lighting load and applied the $35\%$ lighting demand factor (Table 220.42) to both.

#### 2. Looking Up the Right Value in the NEC (#2 Point Killer)
Even when he finds the right table, NEC tables are booby-trapped with headers and footnotes:
* **Header trap**: In Table 310.16, a #6 THHN copper wire has three ampacities across the row: `55 A` ($60^\circ\text{C}$), `65 A` ($75^\circ\text{C}$), and `75 A` ($90^\circ\text{C}$). He must start in the $90^\circ\text{C}$ column (`75 A`) to multiply temperature/bundling factors, then cap his final answer at the $75^\circ\text{C}$ column (`65 A`) per 110.14(C). Non-math test-takers either do the whole problem in one column or forget the cap.
* **Footnote trap**: In Table 220.55 (Household Ranges), the main grid shows `8 kW` in Column C for 1 range. Only **Note 1** below the table tells you that for a range over $12\text{ kW}$, you must increase that $8\text{ kW}$ by $5\%$ for each kW (or major fraction) over $12\text{ kW}$.

#### 3. Picking the Method (#3 Point Killer)
The NEC often has two completely different legal recipes for the same building:
* **Dwelling Standard (Art. 220 Part III)** vs. **Dwelling Optional (Art. 220 Part IV, 220.82)**:
  * Standard takes $100\%$ of the first $3,000\text{ VA}$ and $35\%$ of the remainder on *only* general lighting + small appliance + laundry, applies $75\%$ to 4+ fixed appliances, uses Table 220.55 for the range, and takes $100\%$ of heat vs. $100\%$ of A/C.
  * Optional dumps lighting, small appliance, laundry, fixed appliances, dryer, and range nameplate into **one giant pile**, takes $100\%$ of the first $10\text{ kVA}$ and $40\%$ of the remainder, and takes only $65\%$ of central electric space heating (if $<4$ separately controlled units).
  * On a 4-option test, the Standard answer (`152 A`) and the Optional answer (`118 A`) are **both listed in A, B, C, D**.

#### 4. Units & Scale Conversions
He knows what a kilowatt is on a jobsite, but under exam stress he writes:
$$\text{Total} = 6,255\text{ VA (lighting)} + 5\text{ (dryer)} + 8.8\text{ (range)} = 6,268.8$$
Or in Voltage Drop ($VD = \frac{2 \cdot K \cdot I \cdot L}{CM}$), the problem states `"150 feet from panel to load"` and he forgets whether $L$ is `150` or `300`, or he plugs `#10` (`10`) into the denominator instead of looking up `10,380` circular mils in Chapter 9, Table 8.

#### 5. The Arithmetic & Calculator Execution
Basic 4-function calculators (and the on-screen PSI calculator) have no parentheses and often evaluate left-to-right or mess up chained operations.
* **Classic subtraction-before-multiplication failure**: To take $35\%$ of $(12,300 - 3,000)$, he types `12300 - 3000 × .35 =`.
  * If his calculator has order-of-operations, it calculates $12,300 - (3,000 \times 0.35) = 11,250$.
  * Only if he forces an intermediate equals (`12300 - 3000 =` $\rightarrow$ `9300` $\rightarrow$ `× .35 =` $\rightarrow$ `3255`) does he get the right number.
* **Classic 3-phase division failure**: To calculate $I = \frac{45,000}{208 \times 1.732}$, he types `45000 ÷ 208 × 1.732 =`. Every calculator on earth evaluates that as $(45,000 \div 208) \times 1.732 = 374.7\text{ A}$ instead of the right answer, $124.9\text{ A}$.

#### 6. Rounding Rules
School math taught him: *"0.5 and up rounds up; below 0.5 rounds down."* The NEC uses three different rules:
1. **Service/Feeder Amp Calculations (220.5(B))**: Standard rounding—drop fractions $< 0.5\text{ A}$, round up $\ge 0.5\text{ A}$.
2. **Conduit Fill Conductor Count (Ch. 9, Table 1, Note 7)**: Round up **only if the decimal is $0.8$ or higher** ($5.79\text{ wires} = 5\text{ wires}$; $5.80\text{ wires} = 6\text{ wires}$).
3. **Hard Physical/Code Ceilings & Floors (Box Fill 314.16, Wire Ampacity 310.16, Motor Overload 430.32)**: If your required box volume is $21.1\text{ in}^3$, a $21.0\text{ in}^3$ box is a code violation—even a `.01` overage forces the next box size up. Conversely, if a motor overload calculation yields $34.8\text{ A}$, you must pick a heater/setting **at or below** $34.8\text{ A}$ unless stepping up to the 430.32(C) exception.

#### 7. Choosing Among Multiple-Choice Answers
Unlike school tests where wrong options are random numbers, licensing exam distractors are **forensically constructed**. Getting a number on his calculator that matches Option C to the decimal place gives him zero proof he did the problem right—it only proves he followed one of the four paths the test writer anticipated.

---

## 2. Screen-by-Screen Teaching Sequence: Single-Family Dwelling Standard Load Calculation

**Target Problem Used Across Screens**:
> *What is the minimum service ungrounded (phase) demand load in amps for a $2,600\text{ sq ft}$ single-family dwelling ($120/240\text{V}$, $1\Phi$) with standard small-appliance and laundry circuits, a $4.5\text{ kW}$ water heater, a $1.2\text{ kW}$ dishwasher, a $1.0\text{ kW}$ trash compactor, a $0.9\text{ kW}$ disposal, a $4.5\text{ kW}$ clothes dryer, a $14\text{ kW}$ electric range, a $240\text{V}$ A/C unit ($28\text{ A}$ compressor + $3.2\text{ A}$ blower), and $10\text{ kW}$ of electric baseboard heat?*

### Persistent UI Header (Pinned to Top of Phone Viewport on All Screens)
Because scrolling up and down on a phone causes transcription mistakes, the top $64\text{ px}$ of the screen is a pinned **Specs Strip + Running Ledger**:
* **Specs Strip (horizontally scrollable pills)**: `[2600 sq ft]` `[WH 4.5kW]` `[DW 1.2kW]` `[Comp 1.0kW]` `[Disp 0.9kW]` `[Dryer 4.5kW]` `[Range 14kW]` `[AC 28A+3.2A @240V]` `[Heat 10kW]`
* **Running Demand Ledger**: `B1: 0 | B2: 0 | B3: 0 | B4: 0 | B5: 0 | Total: 0 VA`

---

### Screen 0: The Recipe Gate (Method Selection)
* **What he sees**: The problem text with two highlighted phrases (`single-family dwelling`, `minimum service... demand load`). Two big cards:
  * **Card A**: `Standard Method (Art. 220 Part III)` — *Use unless the question explicitly says "Optional".*
  * **Card B**: `Optional Method (Art. 220 Part IV / 220.82)` — *Only when the word "Optional" appears.*
* **What he taps**: Card A.
* **Wrong feedback (if he taps Card B)**: *"Stop. Does the question contain the word 'Optional'? No. If the exam doesn't say 'Optional', using 220.82 will give you a wrong multiple-choice trap answer."*

---

### Screen 1: Bucket 1 — General Lighting, Small Appliance & Laundry (220.12, 220.52, Table 220.42)
* **What he sees**:
  * **Line 1.1 (Floor Area)**: `2,600 sq ft × [ ___ ] VA/sq ft = [ ______ ] VA`
  * **Line 1.2 (Mandatory Add-ins)**: Checkboxes to include:
    * `[ ] Small Appliance (2 circuits × 1,500 VA = 3,000 VA)`
    * `[ ] Laundry (1 circuit × 1,500 VA = 1,500 VA)`
    * `[ ] Water Heater (4,500 VA)` *(Trap option)*
  * **Line 1.3 (Gross Bucket 1 Total)**: `7,800 + 3,000 + 1,500 = [ ______ ] VA`
  * **Line 1.4 (The 3,000 VA Splitter — Table 220.42)**:
    * Visual split box:
      * `First 3,000 VA @ 100% = 3,000 VA` (locked)
      * `Remainder: [ 12,300 ] - 3,000 = [ ______ ] VA`
      * `Remainder × 0.35 = [ ______ ] VA`
      * `Bucket 1 Net Demand: 3,000 + [ 3,255 ] = [ ______ ] VA`
    * **Calculator Keystroke Strip**: `[1][2][3][0][0] [-] [3][0][0][0] [=]  -->  [×] [.][3][5] [=]  -->  [+] [3][0][0][0] [=]`
* **What he types/taps**:
  * Types `3` and `7800`.
  * Checks Small Appliance and Laundry.
  * Types `12300`, `9300`, `3255`, `6255`.
* **Targeted Error Feedback**:
  * If he checks `Water Heater`: *"No. Only General Lighting, Small Appliance (3,000 VA), and Laundry (1,500 VA) go into the 35% demand bucket. Water heaters are Fixed Appliances (Bucket 2)."*
  * If he enters `4305` for Bucket 1 Net Demand: *"Trap caught! 4,305 is 12,300 × 0.35. You forgot to protect the first 3,000 VA at 100%. Always subtract 3,000 FIRST, multiply the leftover (9,300) by 0.35 (= 3,255), then add 3,000 back (= 6,255)."*
  * If he enters `11250` for the remainder calculation: *"Calculator order-of-operations error! You typed `12300 - 3000 × 0.35 =` without pressing `=` after `3000`. Press `=` after subtracting 3,000 so `9300` is on your screen before you hit `× .35`."*

---

### Screen 2: Bucket 2 — Fixed Appliances (220.53: The "4-or-More Rule")
* **What he sees**:
  * Prompt: *"Tap ONLY the appliances that belong in Fixed Appliances (220.53), and enter each in VA (not kW):"*
  * 6 tappable chips from the problem:
    * `[Water Heater: 4.5 kW]` `[Dishwasher: 1.2 kW]` `[Compactor: 1.0 kW]` `[Disposal: 0.9 kW]` `[Dryer: 4.5 kW]` `[Range: 14 kW]`
  * When tapped, each valid chip opens a VA box:
    * Water Heater: `[ ______ ] VA`
    * Dishwasher: `[ ______ ] VA`
    * Compactor: `[ ______ ] VA`
    * Disposal: `[ ______ ] VA`
  * **Subtotal**: `[ ______ ] VA`
  * **Gate Question**: *"How many fixed appliances did you count? [ 4 ]. Are there 4 or more?"*
    * Buttons: `[Yes: Multiply by 0.75]` `[No: Keep 100%]`
  * **Bucket 2 Net Demand**: `7,600 × 0.75 = [ ______ ] VA`
* **Targeted Error Feedback**:
  * If he taps `Dryer` or `Range`: *"NEC 220.53 excludes 4 things from Fixed Appliances: Ranges, Clothes Dryers, Space Heating, and A/C. Never count a dryer or range here."*
  * If he types `4.5` instead of `4500`: *"Unit mismatch! Every number on your sheet must be in VA (Watts) before you add them. Multiply kW by 1,000: 4.5 × 1,000 = 4,500."*
  * If he enters `7600` as the final Bucket 2 Net Demand: *"You have 4 fixed appliances (WH, DW, Compactor, Disposal). Once you hit 4 or more, NEC 220.53 gives you a 75% multiplier (7,600 × 0.75 = 5,700 VA)."*

---

### Screen 3: Bucket 3 — Clothes Dryer (220.54: The "5,000 VA Floor")
* **What he sees**:
  * Problem spec shown: `Clothes Dryer = 4.5 kW (4,500 W)`
  * Question: *"What VA value must you enter for this dryer under NEC 220.54?"*
  * Input box: `[ ______ ] VA`
* **Targeted Error Feedback**:
  * If he types `4500`: *"Trap! NEC 220.54 says use 5,000 VA OR the nameplate rating, whichever is LARGER. Because 4,500 is under 5,000, you must throw away 4,500 and use 5,000 VA."*

---

### Screen 4: Bucket 4 — Household Electric Range (Table 220.55)
* **What he sees**:
  * Problem spec shown: `1 Range = 14 kW`
  * **Step 4.1**: *"Open NEC Table 220.55. Is 14 kW over 12 kW?"* $\rightarrow$ `[Yes — Use Column C + Note 1]`
  * **Step 4.2**: *"Column C base demand for 1 range (in VA):"* `[ 8000 ] VA`
  * **Step 4.3**: *"How many kW over 12 kW is a 14 kW range? (14 - 12):"* `[ 2 ] kW over`
  * **Step 4.4**: *"Note 1 boost: 2 kW × 5% per kW = 10% boost. What decimal multiplier adds 10%?"*
    * Options: `[ × 0.10 ]` `[ × 1.05 ]` `[ × 1.10 ]`
  * **Step 4.5 (Bucket 4 Net Demand)**: `8,000 × 1.10 = [ ______ ] VA`
* **Targeted Error Feedback**:
  * If he types `14000`: *"You used the raw nameplate. Household ranges in standard calculations always go through Table 220.55."*
  * If he types `8000` for Step 4.5: *"You stopped at Column C (8,000 VA) and forgot Note 1 at the bottom of Table 220.55. Any range over 12 kW gets +5% per kW over 12."*
  * If he types `800` for Step 4.5: *"800 is just the 10% increase (8,000 × 0.10). Add it to 8,000 (or multiply 8,000 × 1.10) to get 8,800 VA."*

---

### Screen 5: Bucket 5 — HVAC Duel (220.60) & Largest Motor 25% Adder (220.50 / 430.24)
* **What he sees**:
  * **Side-by-Side Duel Card (220.60 Non-Coincident Loads)**:
    * **Left (Cooling)**: `(28 A + 3.2 A) × 240 V = [ 7,488 ] VA`
    * **Right (Heating — 220.51 @ 100%)**: `10 kW × 1,000 = [ 10,000 ] VA`
    * Prompt: *"Tap the WINNER (larger load) to keep it. The loser drops to 0 VA."*
  * **Largest Motor 25% Adder (220.50)**:
    * Prompt: *"Identify the largest motor load in the house and add 25% (× 0.25) of it:"*
    * *(Note: App explicitly teaches both Maryland/PSI conventions: if heating wins and A/C is dropped, check whether the exam counts the largest active appliance motor [Disposal $900\text{ VA}$ / Compactor $1,000\text{ VA}$ / DW $1,200\text{ VA} \times 0.25 = 300\text{ VA}$] vs. only when A/C wins, and shows how small that difference is [$1.25\text{ A}$] compared to the answer spread).*
* **Targeted Error Feedback**:
  * If he tries to add `7,488 + 10,000 = 17,488`: *"Nobody runs the A/C and the electric heat at the same time! NEC 220.60 lets you drop the smaller one completely. Keep 10,000 VA; cross out 7,488 VA."*
  * If he enters `6500` for Heating: *"65% is the Optional Method (220.82) rule for heat. In the Standard Method (220.51), electric space heat is 100% (10,000 VA)."*

---

### Screen 6: Total VA $\rightarrow$ Amps & Rounding (220.5(B))
* **What he sees**:
  * **Ledger Stack** (all 5 bucket totals pre-filled from his work):
    * Bucket 1 (Lighting/SA/Laundry): `6,255 VA`
    * Bucket 2 (Fixed Appliances @ 75%): `5,700 VA`
    * Bucket 3 (Dryer Floor): `5,000 VA`
    * Bucket 4 (Range Col C + Note 1): `8,800 VA`
    * Bucket 5 (Heat Winner + 25% Motor): `10,300 VA` *(or `10,000 VA` without appliance motor)*
  * **Grand Total VA**: `[ 36,055 ] VA`
  * **Convert to Amps**: `36,055 VA ÷ [ 240 ] V = [ 150.23 ] A`
  * **NEC 220.5(B) Rounding Check**: *"Is .23 less than .50?"* $\rightarrow$ `[Yes: Drop decimal -> 150 A]`
* **Targeted Error Feedback**:
  * If he divides by `120`: *"A single-family service is 120/240V. Always divide total service VA by 240V, never 120V."*
  * If he rounds `150.23` up to `151`: *"NEC 220.5(B) says drop fractions under 0.5 A. Only 0.50 and higher rounds up."*

---

### How the Scaffolding Fades Over Repeated Problems (4 Stages)

Do not jump from full fill-in-the-blanks to a bare multiple-choice question. Fade in four steps:

1. **Problems 1–2 (Full Guided Rails)**: All 6 screens, sub-lines, unit reminders, and calculator keystroke ribbons are visible.
2. **Problems 3–4 (Collapsed Sub-Steps)**: Each screen shows **only the Bucket Title and 1 final input box** (e.g., `Bucket 1: General Lighting + SA + Laundry Net VA = [ _____ ]`). The sub-lines (`× 3`, `+ 4,500`, `- 3,000`, `× 0.35`, `+ 3,000`) are hidden unless he enters a wrong number—if he misses it, the card expands to catch which sub-step failed.
3. **Problems 5–6 (Blank Scratchpad + Mnemonic Checklist)**: A single screen showing only the word problem and 6 empty rows labeled **L – F – D – R – H – A** (`Lighting/SA/Lndry`, `Fixed`, `Dryer`, `Range`, `HVAC/Motor`, `Amps`). No NEC section numbers, no hints, no formulas shown until submission.
4. **Problems 7+ (Timed Exam Mode with Diagnostic Autopsy)**: Word problem + 4 multiple-choice options + timer. He works on physical scratch paper using the `L-F-D-R-H-A` list. If he picks a wrong option, the app immediately tells him *which exact bucket* created that wrong option and drops him into Stage 2 for that single bucket only.

---

## 3. The 25 Most Common Specific Mistakes on Electrical Exam Math

Every item below is a classic trap that exam writers deliberately use to build the three wrong options (A, B, C, D) on a licensing test.

### Article 220: Dwelling, Multifamily & Commercial Load Calculations

1. **Applying the 35% lighting demand to the entire lighting/small-appliance/laundry total instead of only the portion over 3,000 VA**
   * **Problem Type**: Dwelling Standard Load Calc (Table 220.42).
   * **What the wrong number looks like**: Always **$1,950\text{ VA}$ ($8.1\text{ A}$ at $240\text{V}$) too low** (e.g., on $12,300\text{ VA}$ gross, wrong is $12,300 \times 0.35 = 4,305\text{ VA}$ instead of $3,000 + (9,300 \times 0.35) = 6,255\text{ VA}$).
   * **Correction**: Subtract $3,000\text{ VA}$ from the lighting subtotal first, multiply what is left by $0.35$, and then add the $3,000\text{ VA}$ back.

2. **Forgetting to bundle the two 1,500 VA small-appliance circuits and one 1,500 VA laundry circuit into the general lighting load before taking the 35% demand**
   * **Problem Type**: Dwelling Standard & Multifamily Load Calc (220.52(A)&(B)).
   * **What the wrong number looks like**: Either **$1,575\text{ VA}$ too low** (if omitted completely: $4,500 \times 0.35$) or **$2,925\text{ VA}$ too high** (if added at $100\%$ after the demand step instead of before it).
   * **Correction**: Always add $3,000\text{ VA}$ for small appliances and $1,500\text{ VA}$ for laundry ($4,500\text{ VA}$ total) to the square-footage lighting VA before you touch Table 220.42.

3. **Using a clothes dryer nameplate rating under 5,000 W (such as 4,000 W or 4,500 W) instead of the 5,000 VA code minimum**
   * **Problem Type**: Dwelling Standard Load Calc (220.54).
   * **What the wrong number looks like**: **$500\text{ VA}$ to $1,000\text{ VA}$ too low** on single-family (or scaled by the Table 220.54 demand factor on multifamily).
   * **Correction**: For any dwelling dryer in the Standard Method, throw away any nameplate number under $5,000\text{ W}$ and write down $5,000\text{ VA}$.

4. **Counting the dryer, range, A/C, or space heater as one of the "4 or more" fixed appliances to trigger the 75% demand factor**
   * **Problem Type**: Dwelling Standard Load Calc (220.53).
   * **What the wrong number looks like**: If there are only 3 real fixed appliances (say, $5,600\text{ VA}$ total), wrongly counting the dryer as #4 makes the fixed-appliance bucket **$25\%$ ($1,400\text{ VA}$) too low**—or worse, shrinks the dryer or range by $25\%$.
   * **Correction**: Never put ranges, clothes dryers, space heaters, or A/C units into the 220.53 fixed-appliance list; only water heaters, dishwashers, disposals, compactors, and permanently fastened motors/appliances count toward the 4-appliance threshold.

5. **Using a household range's full nameplate kW, or forgetting the 5%-per-kW adder over 12 kW in Table 220.55 Note 1**
   * **Problem Type**: Dwelling Range Load Calc (Table 220.55, Column C & Note 1).
   * **What the wrong number looks like**: For one $15\text{ kW}$ range, the right answer is $9,200\text{ VA}$ ($8,000 \times 1.15$); the wrong answers are **$15,000\text{ VA}$** (raw nameplate, $63\%$ too high) or **$8,000\text{ VA}$** (unadjusted Column C, $13\%$ too low).
   * **Correction**: For one range between $12\text{ kW}$ and $27\text{ kW}$, start with $8,000\text{ VA}$ (Column C) and increase it by $5\%$ for every whole kW the range exceeds $12\text{ kW}$.

6. **Adding both electric heat and A/C into the total instead of dropping the smaller non-coincident load**
   * **Problem Type**: Dwelling & Commercial Service Load Calc (220.60).
   * **What the wrong number looks like**: Inflated by the **entire VA rating of the smaller system** (typically $5,000\text{ to }10,000\text{ VA}$ or $20\text{ to }42\text{ A}$ too high).
   * **Correction**: Compare the total A/C VA against the total heating VA, keep only the larger number, and cross the smaller one out completely.

7. **Using the Optional Method's 65% heating demand factor inside a Standard Method calculation (or vice versa)**
   * **Problem Type**: Dwelling Standard (220.51) vs. Optional (220.82(C)(4)).
   * **What the wrong number looks like**: In a Standard calculation with $10\text{ kW}$ of heat, the wrong heating load is **$6,500\text{ VA}$ instead of $10,000\text{ VA}$** ($3,500\text{ VA}$ / $14.6\text{ A}$ too low).
   * **Correction**: In the Standard Method, electric space heating is always taken at $100\%$; the $65\%$ factor only exists in the Optional Method (220.82).

8. **Sweeping the A/C or heating load into the "First 10 kVA at 100%, Remainder at 40%" general bucket in the Optional Dwelling Method**
   * **Problem Type**: Dwelling Optional Load Calc (220.82(B) & (C)).
   * **What the wrong number looks like**: Shrinks an A/C unit by $60\%$ (e.g., a $6,000\text{ VA}$ A/C gets counted as $2,400\text{ VA}$ instead of $6,000\text{ VA}$, making the total **$3,600\text{ VA}$ / $15\text{ A}$ too low**).
   * **Correction**: In the Optional Method (220.82), calculate the $10\text{ kVA} + 40\%$ demand on all non-HVAC loads first, and add the winning HVAC load afterward from 220.82(C).

9. **Applying the 50% commercial receptacle demand factor (Table 220.44) to the entire receptacle load instead of only the portion over 10,000 VA**
   * **Problem Type**: Commercial Load Calc (220.14(I) & Table 220.44).
   * **What the wrong number looks like**: Always **$5,000\text{ VA}$ too low** whenever total receptacle load exceeds $10,000\text{ VA}$ (e.g., for $18,000\text{ VA}$ of receptacles, wrong is $9,000\text{ VA}$ instead of $10,000 + 4,000 = 14,000\text{ VA}$).
   * **Correction**: For non-dwelling receptacles, keep the first $10,000\text{ VA}$ at $100\%$ and multiply only the amount above $10,000\text{ VA}$ by $0.50$.

10. **Applying the 70% neutral dryer/range reduction (220.61(B)) when calculating the phase (ungrounded) service conductors**
    * **Problem Type**: Service Neutral vs. Phase Load Calc (220.61(B)).
    * **What the wrong number looks like**: Phase load is **$30\%$ of the dryer and range demand too low** (e.g., $3,500\text{ VA}$ instead of $5,000\text{ VA}$ on the dryer, plus $5,600\text{ VA}$ instead of $8,000\text{ VA}$ on the range = $3,900\text{ VA}$ too low).
    * **Correction**: Only use the $70\%$ multiplier on the dryer and range when the question specifically asks for the **neutral (grounded) conductor** load—never on the phase load.

### Continuous Loads & Branch Circuits

11. **Forgetting the 125% multiplier on continuous loads (3 hours or more)**
    * **Problem Type**: Commercial Lighting, Sign Circuits, Show Windows, EV Chargers, Feeder/Branch Sizing (210.19(A), 210.20(A), 215.2, 215.3).
    * **What the wrong number looks like**: Exactly **$20\%$ smaller than the right answer** ($\text{Wrong} = 0.80 \times \text{Right}$, e.g., $40\text{ A}$ instead of $50\text{ A}$).
    * **Correction**: Whenever a load runs for 3 hours or more (commercial lighting, store signs, show windows, solar/EV), multiply it by $1.25$ before sizing the breaker or wire.

### Box Fill (NEC 314.16)

12. **Counting every equipment grounding conductor (EGC) entering a box as 1 full conductor each**
    * **Problem Type**: Box Fill Calculation (314.16(B)(5) — note 2020 NEC rule).
    * **What the wrong number looks like**: For a box with three #12 Romex cables (3 EGCs), wrong is $3 \times 2.25 = 6.75\text{ in}^3$ instead of $1 \times 2.25 = 2.25\text{ in}^3$ (**$4.5\text{ in}^3$ too high**).
    * **Correction**: Up to four equipment grounding wires in a box count as **one single conductor volume total** (sized to the largest ground wire in the box), plus $\frac{1}{4}$ volume allowance for each additional EGC over four (per 2020 NEC 314.16(B)(5)).

13. **Counting a switch or receptacle yoke (strap) as 1 conductor instead of 2 conductors**
    * **Problem Type**: Box Fill Calculation (314.16(B)(4)).
    * **What the wrong number looks like**: **$1$ conductor volume ($2.00\text{ to }2.50\text{ in}^3$) per device too low** (e.g., counting 2 switches as 2 allowances instead of 4 allowances).
    * **Correction**: Every yoke or strap (whether it holds one switch, one duplex receptacle, or three pilot lights) counts as **2 conductors** of the wire gauge attached to that specific device.

14. **Counting pigtails (wires that start and end inside the box) or external Romex connectors as conductor allowances**
    * **Problem Type**: Box Fill Calculation (314.16(B)(1) & (2)).
    * **What the wrong number looks like**: **$1\text{ to }3$ conductor allowances ($2.00\text{ to }6.75\text{ in}^3$) too high**.
    * **Correction**: Pigtails that never leave the box and cable clamps that clamp *outside* the box count as **zero** in box fill; only *internal* factory cable clamps add 1 allowance (total, regardless of how many clamps).

### Conduit & Raceway Fill (Chapter 9, Tables 1, 4, 5 & Annex C)

15. **Rounding the maximum number of conductors in a conduit using the normal 0.5 rule instead of the NEC 0.8 rule (or truncating 0.8+ down)**
    * **Problem Type**: Conduit Fill (Chapter 9, Table 1, Note 7).
    * **What the wrong number looks like**: Off by **$\pm 1$ conductor** (e.g., calculating $6.83$ conductors and picking `6` because "you can't go over 40%," or calculating $6.55$ and rounding up to `7`).
    * **Correction**: When calculating how many same-size wires fit in a raceway, round up to the next whole wire **only when the decimal is `.8` or higher**; drop any decimal of `.79` or lower.

16. **Comparing mixed-conductor total wire area against the 100% column of Chapter 9 Table 4 instead of the 40% column (or dividing by 0.40 twice)**
    * **Problem Type**: Mixed-Wire Conduit Sizing (Chapter 9, Tables 4 & 5).
    * **What the wrong number looks like**: Picking a conduit area **$2.5\times$ too small** (if using the $100\%$ column) or **$2.5\times$ too big** (if dividing wire area by $0.40$ and then looking in the $40\%$ column).
    * **Correction**: Add up the raw square-inch areas of all wires from Table 5 (do not divide by $0.40$), and go straight down the **Over 2 Wires (40%)** column of Table 4 to find the conduit whose $40\%$ area is equal to or larger than your sum.

### Ampacity Derating & Temperature Correction (310.15 / Table 310.16)

17. **Starting ampacity derating from the $75^\circ\text{C}$ column instead of the $90^\circ\text{C}$ column for THHN/THWN-2, OR forgetting to cap the final answer at the $75^\circ\text{C}$ terminal limit**
    * **Problem Type**: Conductor Ampacity Correction & Adjustment (310.15(B)(1), 310.15(C)(1), 110.14(C)).
    * **What the wrong number looks like**: For #8 THHN (`55 A` @ $90^\circ\text{C}$, `50 A` @ $75^\circ\text{C}$) at an $80\%$ bundling factor, starting in the $75^\circ\text{C}$ column gives **$40\text{ A}$** (wrong) instead of $55 \times 0.80 = \mathbf{44\text{ A}}$ (right). Conversely, at a $91\%$ factor ($55 \times 0.91 = 50.05\text{ A}$), failing to check the $75^\circ\text{C}$ cap (`50 A`) leaves a high number when derating is mild.
    * **Correction**: For $90^\circ\text{C}$-rated wire (THHN, THWN-2, XHHW-2), always start with the $90^\circ\text{C}$ ampacity to multiply your temp and fill percentages, then compare your answer to the $75^\circ\text{C}$ column ($60^\circ\text{C}$ if $\le 100\text{ A}$ unmarked) and keep whichever is **smaller**.

18. **Counting the equipment ground or a balanced neutral as a current-carrying conductor when applying Table 310.15(C)(1) bundling adjustment**
    * **Problem Type**: Raceway Bundling Derating (310.15(E) & (F)).
    * **What the wrong number looks like**: Turns 3 current-carrying conductors ($100\%$, no derating) into "4 or 5 conductors" ($80\%$ bracket), making the ampacity **$20\%$ too low**.
    * **Correction**: Never count grounding/bonding conductors—or a neutral that only carries the unbalanced load of a $120/240\text{V}$ single-phase or $4$-wire $3\Phi$ wye circuit (without major harmonics)—when counting wires for Table 310.15(C)(1).

### Motors (NEC Article 430)

19. **Using the motor's nameplate FLA from the problem text instead of NEC Table 430.248 / 430.250 to size branch-circuit wires and short-circuit breakers (or vice versa for overloads)**
    * **Problem Type**: Motor Wire, Breaker & Overload Sizing (430.6(A)(1) vs. 430.32).
    * **What the wrong number looks like**: For a $10\text{ hp}$, $230\text{V}$, $3\Phi$ motor with a nameplate FLA of `25 A` (Table 430.250 FLC = `28 A`), using `25 A` gives wire ampacity of **$31.25\text{ A}$ instead of $35\text{ A}$**; conversely, for a $1.15\text{ SF}$ overload (430.32(A)(1) @ $125\%$), using Table `28 A` gives **$35\text{ A}$ instead of $25 \times 1.25 = 31.25\text{ A}$**.
    * **Correction**: Use **Nameplate FLA** *only* for sizing running overload protection (430.32); for everything else (wire size, breaker/fuse size, feeder load), ignore the nameplate amps and look up the horsepower in Table 430.248 ($1\Phi$) or 430.250 ($3\Phi$).

20. **Picking the next standard breaker size DOWN instead of UP on a motor branch circuit (or picking the next size UP on a non-motor load over 800 A)**
    * **Problem Type**: Motor Short-Circuit OCPD Sizing (430.52(C)(1) Ex. 1 & 240.6(A)).
    * **What the wrong number looks like**: For a $27\text{ A}$ motor using an inverse-time breaker ($27 \times 2.50 = 67.5\text{ A}$), picking a **$60\text{ A}$ breaker** (next size down) instead of a **$70\text{ A}$ breaker** (next size up per Exception 1), or leaving the raw `67.5 A` when the question asks for a standard OCPD.
    * **Correction**: When a motor's Table 430.52 multiplier lands between two standard breaker sizes in 240.6(A), Exception 1 permits going **up** to the next standard breaker size (unless the question specifically asks for the strict "non-exception" limit).

21. **Multiplying ALL motors on a feeder by 125% instead of only the single largest motor**
    * **Problem Type**: Motor Feeder Load & Conductor Sizing (430.24).
    * **What the wrong number looks like**: For a feeder with threemotors (`28 A`, `22 A`, `14 A`), multiplying all three by $1.25$ gives **$80\text{ A}$** instead of $(28 \times 1.25) + 22 + 14 = \mathbf{71\text{ A}}$ ($25\%$ of every smaller motor too high).
    * **Correction**: On a multi-motor feeder, multiply **only the one largest motor** by $1.25$ (or add $0.25 \times \text{largest motor}$ at the end) and add all other motors at $100\%$.

### Voltage Drop, Three-Phase Power, Transformers & Ohm's Law

22. **Forgetting the `2` in single-phase voltage drop, or using `2` instead of `1.732` in three-phase voltage drop**
    * **Problem Type**: Voltage Drop ($VD = \frac{2 \cdot K \cdot I \cdot L}{CM}$ for $1\Phi$; $VD = \frac{1.732 \cdot K \cdot I \cdot L}{CM}$ for $3\Phi$).
    * **What the wrong number looks like**: On $1\Phi$, forgetting `2` gives **exactly half ($50\%$) of the right voltage drop** (e.g., $3.4\text{ V}$ instead of $6.8\text{ V}$). On $3\Phi$, using `2` instead of `1.732` makes the answer **$15.5\%$ too high** ($2 \div 1.732 = 1.155$).
    * **Correction**: Always start the top of the voltage drop fraction with **`2`** for single-phase and **`1.732`** for three-phase, and use the **one-way** distance for $L$.

23. **Forgetting to divide by $\sqrt{3}$ ($1.732$) on a three-phase current calculation—or typing `÷ Volts × 1.732` so the calculator multiplies instead of dividing**
    * **Problem Type**: Three-Phase Power/Current ($I = \frac{\text{VA}}{E \times 1.732}$) & Transformer Sizing.
    * **What the wrong number looks like**: For a $45\text{ kVA}$, $208\text{V}$, $3\Phi$ load (true amps = $124.9\text{ A}$):
      * Forgetting $1.732$ altogether gives **$216.3\text{ A}$** ($1.732\times$ too high).
      * Typing `45000 ÷ 208 × 1.732 =` gives **$374.7\text{ A}$** ($3\times$ too high!).
    * **Correction**: Never type `× 1.732` after a division sign; memorize the three pre-multiplied $3\Phi$ divisors (**`360`** for $208\text{V}$, **`416`** for $240\text{V}$, **`831`** for $480\text{V}$) and divide total VA by that single number.

24. **Sizing a transformer's primary OCPD using the secondary voltage, or rounding UP to the next standard breaker when primary current is under 9 amps**
    * **Problem Type**: Transformer Overcurrent Protection (450.3(B) & Table 450.3(B) Note 1).
    * **What the wrong number looks like**:
      * Dividing a $480\text{V}$-to-$208\text{V}$ transformer's kVA by $208\text{V}$ instead of $480\text{V}$ makes the primary breaker **$2.3\times$ too large**.
      * For a $5\text{ kVA}$, $480\text{V}$, $3\Phi$ transformer ($I_p = 6.01\text{ A}$, under $9\text{ A}$ $\rightarrow$ Table 450.3(B) uses $167\%$: $6.01 \times 1.67 = 10.04\text{ A}$), rounding up to a **$15\text{ A}$ breaker** instead of going down to **$10\text{ A}$** (Note 1 only allows "next size up" for the $125\%$ row at $9\text{ A}$ or more!).
    * **Correction**: Match the voltage to the side of the transformer you are protecting, and remember that Table 450.3(B) Note 1 ("next higher standard rating") **only applies to the $125\%$ row** ($\ge 9\text{ A}$)—for currents under $9\text{ A}$ (the $167\%$ and $300\%$ rows), you cannot exceed the calculated amp value.

25. **Forgetting to square the current ($I^2$) when finding power from current and resistance, or multiplying instead of dividing in Ohm's Law**
    * **Problem Type**: Ohm's Law & Power ($P = I^2 \times R$, $P = E^2 \div R$, $I = E \div R$).
    * **What the wrong number looks like**: Given $I = 15\text{ A}$ and $R = 8\,\Omega$, calculating $P = 15 \times 8 = \mathbf{120\text{ W}}$ (which is actually Volts!) instead of $15 \times 15 \times 8 = \mathbf{1,800\text{ W}}$ (off by a factor of $I$).
    * **Correction**: When Volts ($E$) are missing and you want Watts ($P$), you must multiply Amps by Amps first ($I \times I \times R$).

---

## 4. Cold Arithmetic Skills & Minimal Micro-Drills

An adult who struggles with math should never do two mental translations at once. Before he does full NEC worksheets, build these six atomic reflexes with 45-second phone drills.

### Skill 1: The "No-Percent-Key" Multiplier Reflex
The `%` key on basic 4-function calculators behaves differently across models and ruins calculations. **Ban the `%` key.** He must translate every NEC percentage directly into a decimal multiplier in one step—including "increase by X%" as `1.XX`.

| NEC Rule | Percentage in Book | What He Punches |
| :--- | :--- | :--- |
| Lighting demand (Table 220.42) | $35\%$ | `× .35` |
| Optional dwelling remainder (220.82) | $40\%$ | `× .4` |
| Commercial receptacles >10 kVA (Table 220.44) | $50\%$ | `× .5` |
| Optional dwelling heat (220.82(C)(4)) | $65\%$ | `× .65` |
| Dryer neutral (220.61(B)) / 7–9 wires in conduit | $70\%$ | `× .7` |
| 4+ Fixed appliances (220.53) | $75\%$ | `× .75` |
| 4–6 wires in conduit (Table 310.15(C)(1)) | $80\%$ | `× .8` |
| Motor overload (1.0 SF) (430.32) | $115\%$ | `× 1.15` |
| Continuous load / Motor wire / Overload (1.15 SF) | $125\%$ | `× 1.25` |
| Range Note 1: $14\text{ kW}$ ($2\text{ kW}$ over $12 \times 5\% = +10\%$) | $+10\%$ | `× 1.1` |
| Range Note 1: $16\text{ kW}$ ($4\text{ kW}$ over $12 \times 5\% = +20\%$) | $+20\%$ | `× 1.2` |
| Non-time-delay fuse / Transformer $<9\text{ A}$ | $175\%$ / $167\%$ | `× 1.75` / `× 1.67` |
| Inverse-time breaker motor (Table 430.52) | $250\%$ | `× 2.5` |

* **Smallest Drill ("Kill the % Sign")**: Flash a prompt (`"Boost 8,000 by 15%"` or `"Take 125% of 34"`). He does not solve the math—he only types the decimal multiplier (`1.15` or `1.25`) on a keypad with no `%` key. 15 cards in 45 seconds.

### Skill 2: The "Three Magic 3-Phase Divisors" (`360`, `416`, `831`)
Never let a non-math person divide by `208 × 1.732` on a basic calculator. Have him memorize the three pre-multiplied denominators (and write them at the top of his scratch paper the second the exam timer starts):
* **$208\text{V}$, 3-Phase**: $208 \times 1.732 = \mathbf{360}$ $\rightarrow$ $\text{Amps} = \text{VA} \div 360$
* **$240\text{V}$, 3-Phase**: $240 \times 1.732 = \mathbf{416}$ $\rightarrow$ $\text{Amps} = \text{VA} \div 416$
* **$480\text{V}$, 3-Phase**: $480 \times 1.732 = \mathbf{831}$ $\rightarrow$ $\text{Amps} = \text{VA} \div 831$
* *(Note: Using `360`, `416`, and `831` is accurate to within $0.07\%$, which never changes a multiple-choice answer and eliminates $100\%$ of calculator order-of-operation bugs on 3-phase power).*
* **Smallest Drill ("Pick the Bottom Number")**: Flash `"45,000 VA at 208V 3Φ"` or `"18,000 VA at 120/240V 1Φ"`. Five big buttons: `[÷ 120]` `[÷ 208]` `[÷ 240]` `[÷ 360]` `[÷ 416]` `[÷ 831]`. He taps the right divisor in under 2 seconds.

### Skill 3: The "Subtract – Equals – Multiply – Add Back" Rhythm
Whenever a problem says *"First $X$ at $100\%$, remainder at $Y\%$"*, he must execute the exact same 3-step calculator rhythm:
1. `Total - Threshold =` *(MUST hit `=` here)*
2. `× Rate =`
3. `+ Threshold =`
* **Smallest Drill ("Threshold Split")**: Show one number and which NEC rule applies (e.g., `15,000 VA [Dwelling Lighting: 3,000 / 35%]` or `24,000 VA [Commercial Receptacles: 10,000 / 50%]`). He punches it on his calculator and enters only the final net VA.

### Skill 4: Instant `k` Expansion ($\times 1,000$)
Decimal kW/kVA values (`0.75 kW`, `4.5 kW`, `112.5 kVA`) cause misplaced-zero errors.
* **Smallest Drill ("Kill the K")**: Show `0.9 kW`, `4.5 kW`, `22.5 kVA`, `112.5 kVA`. He types `900`, `4500`, `22500`, `112500`. If he misses one, show the visual rule: *"Multiply by 1,000 on your calculator—don't move the decimal in your head."*

### Skill 5: Top-Then-Bottom Fraction Flattening
In Voltage Drop ($VD = \frac{2 \cdot K \cdot I \cdot L}{CM}$) or Finding Wire Size ($CM = \frac{2 \cdot K \cdot I \cdot L}{VD}$), non-math students try to punch everything in one string and lose track.
* **Rule**: Multiply all top numbers $\rightarrow$ press `=` $\rightarrow$ divide by the single bottom number $\rightarrow$ press `=`.
* **Smallest Drill ("Flip the Swap")**: Give him the 4 top numbers (`2`, `12.9`, `30 A`, `150 ft` = `116,100`) and either `CM = 10,380` (solve for `VD`) or `Max VD = 7.2 V` (solve for `CM`). Teach him that the top (`116,100`) never changes—you just divide by `CM` to get `VD`, or divide by `VD` to get `CM`.

### Skill 6: The 3-Way NEC Rounding Reflex
* **Smallest Drill ("Keep or Bump Up?")**: Flash a calculated result with its code context and two buttons (`[ Drop / Keep ]` vs. `[ Bump Up ]`):
  * `134.4 Amps (Service Load - 220.5(B))` $\rightarrow$ **Drop to 134 A** ($< 0.50$)
  * `134.5 Amps (Service Load - 220.5(B))` $\rightarrow$ **Bump Up to 135 A** ($\ge 0.50$)
  * `5.75 Conductors (Conduit Fill - Ch. 9 T1 Note 7)` $\rightarrow$ **Drop to 5** ($< 0.80$)
  * `5.80 Conductors (Conduit Fill - Ch. 9 T1 Note 7)` $\rightarrow$ **Bump Up to 6** ($\ge 0.80$)
  * `20.25 sq in required (Box Fill - 314.16)` $\rightarrow$ **Bump Up to next box size** ($\ge 20.25\text{ in}^3$; never round down required volume)

---

## 5. Exam Strategy for Calculation Questions on a Timed Open-Book Test

On the Maryland Master Electrician PSI exam, every question is worth **1 point**. A 15-second code lookup on grounding electrode size and an 8-minute multifamily service calculation pay the exact same point.

### 1. The Three-Pass Triage System
If a man who dislikes math attempts a full Article 220 load calculation on Question #3, he will spend 10 minutes second-guessing himself, fall behind the clock, and panic on the easy questions later. Enforce this strict pass rule in your app's simulated exams:

* **Pass 1 — Zero-Math & 1-Line Math ($\le 60$ seconds per question)**:
  * Answer all code lookups and 1-step calculations (e.g., continuous load $40\text{ A} \times 1.25$, single box fill, single motor FLC lookup).
  * **Hard Triage Rule**: If a question contains **more than 3 numbers** or requires **more than 1 table lookup**, do not even read the numbers on Pass 1. Flag it, click a placeholder answer, and move on in 5 seconds.
* **Pass 2 — Single-Formula / 2-Table Math ($2\text{ to }3$ minutes per question)**:
  * Ampacity derating (Table 310.16 + temp/fill), conduit fill (Table 4 & 5 or Annex C), box fill with devices/clamps, voltage drop, motor branch circuit + OCPD, transformer protection.
* **Pass 3 — Multi-Bucket Ledger Math ($5\text{ to }8$ minutes per question)**:
  * Full dwelling, multifamily, commercial, or restaurant service/feeder calculations. By Pass 3, he has already banked 80%+ of his points and has zero time-pressure anxiety.

### 2. Pacing & The "3-Minute Bailout Rule"
* Give him a ** scratch-paper brain dump** to write down in the first 30 seconds of the test:
  * `208V 3Φ = ÷ 360 | 240V 3Φ = ÷ 416 | 480V 3Φ = ÷ 831`
  * `VD = (2 or 1.732 × K × I × L) ÷ CM   (Copper K=12.9, Alum K=21.2)`
  * `Dwelling Standard: L - F - D - R - H - M`
* If he punches a medium math question twice and his number is not within $2\%$ of any of the 4 choices, **flag it and move on immediately**. Staring at a botched calculation for 9 minutes costs three other questions.

### 3. Using the 4 Answer Choices to Check Work (Before & After Calculating)
Train him to read the four choices **before** picking up his calculator:

* **Technique A: Cross Off Non-Standard Breaker/Wire Sizes First**
  * If the question asks *"What is the standard rating of the overcurrent device..."* and the choices are:
    * `A) 67.5 A`  `B) 70 A`  `C) 78 A`  `D) 80 A`
  * `67.5 A` and `78 A` are **not standard breaker sizes** in 240.6(A). Cross them out before doing a single calculation. Now it is a 50/50 between `70 A` and `80 A`.
* **Technique B: Spot the "Twin Trap Pairs" in the Choices**
  * Exam writers generate wrong options by flipping one variable. Suppose a $3\Phi$ continuous-load question has these four choices:
    * `A) 100 A`
    * `B) 125 A` *(100 × 1.25)*
    * `C) 173 A` *(100 × 1.732)*
    * `D) 216 A` *(100 × 1.732 × 1.25)*
  * Notice the pairs: `(100, 125)` and `(173, 216)` both differ by $1.25$, and `(100, 173)` and `(125, 216)` differ by $1.732$. Once he computes the base 3-phase amps (`100 A`), seeing `125 A` confirms he needs the $1.25$ continuous multiplier and that `173 A` / `216 A` are the "forgot to divide by 1.732" traps.

### 4. When to Estimate (and How)
* **When to Estimate**: Whenever the 4 answer choices are **more than $20\%$ apart** (e.g., `A) 62 A`, `B) 115 A`, `C) 168 A`, `D) 225 A`), or when he is down to the last 5 minutes of the exam with three long load calculations left.
* **When NOT to Estimate**: When two choices are within $5\text{ to }10\text{ A}$ of each other (e.g., `142 A` vs. `148 A`), because the question is specifically testing a small rule like the $5,000\text{ VA}$ dryer floor or the $25\%$ largest-motor adder.
* **Fast Field-Electrician Estimation Anchors**:
  * **At 240V $1\Phi$**: Every **$2,400\text{ VA}$ is $10\text{ A}$** (every **$24\text{ kW}$ is $100\text{ A}$**). If a dwelling's demand buckets eyeball to roughly $36\text{ kW}$, the answer is right around $150\text{ A}$ ($24\text{ kW} = 100\text{ A}$ + $12\text{ kW} = 50\text{ A}$).
  * **At 208V $3\Phi$**: Every **$36\text{ kVA}$ is $100\text{ A}$** (or $\text{kVA} \times 3$ minus $10\%$).
  * **At 480V $3\Phi$**: Every **$83\text{ kVA}$ is $100\text{ A}$** (rough rule: $\text{Amps} \approx \text{kVA} \times 1.2$). A $75\text{ kVA}$ transformer at $480\text{V}$ has a primary current of $75 \times 1.2 = 90\text{ A}$.

---

## 6. What Is Wrong with Your Proposed Worksheet Design

Here is your proposed design:
> *"every calculation is a fixed worksheet of numbered lines, one operation or one book lookup per line, with the calculator keystrokes shown, a mistake diagnosis on wrong entries, and three modes: Show me (worked example), Coach me (blanks with hints), Test me (exam-style multiple choice whose wrong options are the classic mistakes)."*

The mistake-diagnosis engine and trap-based distractors are strong ideas. **Five specific parts of the rest of this design will backfire on a math-averse adult** if you build them as described:

### 1. The "Vanishing Crutch" Cliff Between *Coach Me* and *Test Me*
In *Coach Me*, your fixed numbered worksheet hands him the exact sequence of steps on a silver platter. He never has to decide what Step 1 is, which bucket an appliance goes into, or which lines exist—he just fills in the blanks on rails.
Then he switches to *Test Me* (or walks into the PSI testing center), and **the worksheet is gone**. There is only a paragraph of text, a blank piece of scratch paper, and four radio buttons.
* **What will happen**: He will score $95\%$ in *Coach Me* and crash to $40\%$ in *Test Me* because the worksheet was doing the hardest part of the math for him: **structuring the problem from a blank page**.
* **How to fix it**: Add a mandatory mode between *Coach Me* and *Test Me* (**"Scratchpad Mode"**) where the screen shows only the problem and a blank ledger, and he must tap/select which buckets apply in order using a 5-letter paper mnemonic (`L-F-D-R-H-A`) that he can write on his physical scratch sheet in the exam room.

### 2. NEC Calculations Branch; Fixed Numbered Lines Do Not
NEC math is not a linear tax form like the old 1040EZ; it is full of conditional `IF / ELSE` forks:
* In a dwelling load calc, what if there are only **3** fixed appliances instead of 4? If Line 5 is fixed as `"Multiply Fixed Appliances by 0.75"`, what does he do when there are only 3 appliances? Type `× 1.0`? Leave it blank? Either way, a fixed line teaches him that fixed appliances *always* get a multiplier line, or confuses him when the line shouldn't apply.
* What if the range is $10\text{ kW}$ ($\le 12\text{ kW}$, no Note 1 boost) vs. $15\text{ kW}$ (Note 1 boost) vs. two unequal ranges ($10\text{ kW}$ and $16\text{ kW}$, Note 2 averaging after bumping the $10\text{ kW}$ to $12\text{ kW}$)?
* What if an ampacity problem has ambient temperature correction, bundling adjustment, and a $75^\circ\text{C}$ terminal cap—or only one of the three?
* **What will happen**: If you put every possible conditional line into one rigid numbered worksheet, a simple problem has 6 dead lines where he enters `0` or `1`, creating visual clutter on a small phone screen.
* **How to fix it**: Keep the top-level **buckets** fixed, but gate conditional lines behind a 2-button decision (`"4 or more fixed appliances? [Yes -> × 0.75] [No -> Keep 100%]"`).

### 3. Showing Calculator Keystrokes Up Front Breeds Mindless "Simon Says" Typing
If a line displays `[1][2][3][0][0] [-] [3][0][0][0] [=]` while he is solving the step, an adult who dislikes math stops thinking about the electrical rule and simply copies the keystrokes onto his calculator like a cashier scanning barcodes. Five minutes later, he cannot tell you *why* he subtracted `3000`.
* **How to fix it**: **Hide calculator keystrokes by default in *Coach Me*.** Only pop up the keystroke strip **after** a wrong entry when your mistake diagnosis detects that he chose the right numbers (`12,300` and `3,000` and `0.35`) but botched the calculator sequence (e.g., he entered `11,250` because he didn't press `=` after subtracting `3,000`).

### 4. Passive *Show Me* (Worked Examples) Fails on a Phone Screen
When a math-averse adult reads a completed 12-line worked example from top to bottom, he nods along with every line (*"Sure, 2,600 times 3 is 7,800, got it"*). This creates an illusion of mastery while requiring zero active recall. Worse, on a vertical phone screen, a 12-line worked example is a wall of numbers he will scroll past in 10 seconds to get to the interactive mode.
* **How to fix it**: Replace passive *Show Me* with **Interactive Walkthrough (1-Tap Checkpoints)**. Reveal the worked example one bucket at a time, and before revealing the next line, ask one 2-option question (*"The dryer nameplate is 4,500 W. Which number goes on the next line: `[4,500]` or `[5,000]`?"*).

### 5. "One Book Lookup Per Line" Gives Away the Hardest Part of Open-Book Exams
If Line 6 of your worksheet says *"Look up Table 430.250 for 10 HP at 230V: [ ____ ]"*, your app just did $80\%$ of the open-book work for him—it told him **which table** to open! On the exam, the question just says *"A 10 hp, 230V, 3-phase squirrel-cage motor with a nameplate rating of 25 A..."*
* **How to fix it**: Never print the table number inside the worksheet prompt after the very first introductory problem. Make **identifying the table** (`"Which table do you open: 430.248, 430.250, or use the 25A nameplate?"`) the actual question on that line, and only reveal the table citation if he gets it wrong or taps a hint.

### 6. Exam Questions Often Ask for One Isolated Slice or Run the Formula Backwards
Half of the calculation questions on the Maryland Master exam do **not** ask you to run a full worksheet from Line 1 to Line 12:
* Some ask only for **Line 4** (*"What is the feeder demand load for five 11 kW household ranges and three 16 kW ranges?"*).
* Some run a formula **backwards** (*"What minimum AWG copper conductor is required to limit voltage drop to 3% on a 200 ft run at 30 A, 240V?"*—solving for $CM$ instead of $VD$; or *"What is the maximum ambient temperature in which #10 THHN carrying 28 A can operate?"*—solving for the temperature factor $28 \div 40 = 0.70$ and working backwards into Table 310.15(B)(1)).
* **How to fix it**: Do not force him to run a 12-line service worksheet just to practice range Note 2, and do not assume every formula runs in one direction. Build **single-bucket micro-worksheets** (e.g., *Ranges Only*, *Motor Feeder Only*) and explicit **Forward / Reverse pairs** for Voltage Drop and Ampacity Derating.
