# Review of the worksheet engine (`src/calc/`), 2026-10-16

Reviewer: Antigravity (`agy`, Gemini 4 Argon High, plan mode, sandboxed, read-only) on a copy of `src/calc/`.
Every finding was checked against the code before acting; each fix has a test in `src/calc/calc.test.ts`.
A first, broader run (calc + store + exam together) timed out after 30 minutes; it was split in two.

| # | Finding (severity given) | Verdict | Fix |
|---|---|---|---|
| 1 | A zero operand gives `b / a = Infinity`, and `within` matched any number against Infinity (blocker) | Real | `within` and `near` refuse non-finite values; divisions by a zero operand are skipped |
| 2 | A line rounded per 220.5(B) rejected the exact result (41.67 for 42 A) and then told him to redo the sum (blocker) | Real | `WorkLine.accept`: a rounding `calc` line also accepts its exact value |
| 3 | Count lines used a 0.5% tolerance: 10.04 conductors, or 201 for 200, were "right" (major) | Real | Counts are exact unless the line sets its own tolerance |
| 4 | "Percent typed whole" fired on whole-number multipliers (2,400 × 3 → "300% means × 3") (major) | Real | Only on lines that talk about a percent, and only for fractional multipliers |
| 5 | The √3 messages assumed a division; on a line that multiplies by 1.732 they blamed the wrong direction; they also ran on lookups and in² lines (major) | Real | One neutral `sqrt3_slip` ("1.732 is in the wrong place"), only on electrical calc lines; recipes keep their own specific √3 mistakes |
| 6 | Detectors could fire on the right answer for identity operands (× 1, + 0); "skipped step" missed some cases (major) | Real | Detectors return nothing when the input is near the right value; skipped-step logic per operand |
| 7 | The loose match used a line's absolute tolerance for values of a different size (minor) | Real | Mistake matching is relative to the mistake value; absolute only for exact counts |
| 8 | Phone input: "½", "1½", "+5", "2400 ft2", "1-1/4 in." were not read; "7200/240" was evaluated; "5..." passed; "1,5" got a misleading message (major) | Real | Unicode fractions, a leading +, trailing unit words and one trailing period are accepted; a large fraction is "work it on the calculator first"; "5..." is unreadable; "1,5" is told to use a period |
| 9 | `numericChoices` threw for small answers (1 or 2), refused 0 values, and printed the right option with fewer decimals than the worksheet (77.3 A vs 77.25 A) (blocker/major) | Real | Step-away fillers for small answers; 0 allowed; the right option prints with the decimals its value needs |
| 10 | `labelChoices` misbehaved when the right label was not in the order (major) | Real | Throws (a programming error), neighbours searched across the whole order |
| 11 | 240.6(A)'s extra fuse ratings 1, 3, 6, 10, 601 A were missing (blocker) | Real gap (no recipe used them yet) | `STANDARD_FUSES`, `fuseAtOrBelow` |
| 12 | `standardAbove`/`standardBelow` equal `nextStandardUp`/`standardAtOrBelow` on non-standard values (major) | By design (callers pass a standard size) | Documented |
| 13 | `conductorsThatFit` cannot be passed as a unary `round` (minor) | Real | `roundNote7` |

Also from browser QA the same day: two known slips that land on the same number (counting a pigtail, or a
pass-through wire twice, both give 4) now name both instead of guessing.
