# Review of the code-book values (`src/data/tables.ts`), 2026-10-16

Reviewer: Antigravity (`agy`, Gemini 4 Argon High, plan mode, sandboxed, no web access), on a copy of
`tables.ts`. Every finding was checked by hand before it was applied. Raw output:
`C:\work\agy-briefs\etrainer-tables\review.md` (not in the repo).

| # | Finding | Verdict | Action |
|---|---|---|---|
| 1 | THW/THHW/THW-2 14-8 AWG areas were TW's (0.0139/0.0181/0.0243/0.0437); THW is 0.0209/0.0260/0.0333/0.0556 | **Real.** Matches Chapter 9 Table 5 as recalled independently (12 THW = 0.0260 is a staple exam value) | Fixed; TW added as its own insulation |
| 2 | Table 4 percent columns are computed from the internal diameter, not the rounded total; deriving them from the total is 0.001 off in 22 cells (e.g. RMC 1/2 at 40% prints 0.125, not 0.126) | **Real.** Our diameters reproduce every printed total; RMC 1/2 = 0.125 matches recall | Diameters stored (`RACEWAY_ID`); one total (IMC 2 in.) still differs by 0.001, so lookups accept ±0.001 (`TABLE4_TOL`) and generators reject problems whose answer would change with that 0.001 |
| 3 | THW/XHHW 600-750 kcmil missing; 1000 kcmil missing | Real gaps | Added |
| 4 | 4 × 2-1/8 device boxes missing | Real gap (10.3 / 13.0 / 14.5 in³) | Added |
| 5 | Masonry boxes missing | Its dimensions (3-1/2 × 2) disagree with ours (3-3/4 × 2); unresolved | Not added; the `masonry` kind removed |
| 6 | Table 220.55 Columns A/B for 26+ | Real gap | `rangeColumnAPct`, `rangeColumnBPct` |
| 7 | Table 430.52 Design B energy-efficient and wound-rotor rows; Exception No. 2 ceilings | Real gaps | Added |
| 8 | Table 450.3(B) primary-and-secondary row | Real gap | `transformerPrimaryAndSecondaryPct` |
| 9 | `dryerDemandPct` accepts n < 1 | Minor | Throws now |
| 10 | Edition locations (3 VA/ft² "in Table 220.12 (2020)", lighting demand "Table 220.42(A) (2023)", receptacles "Table 220.48 (2023)") | **Conflicts** with our own recall (2020: 220.14(J)) | Not used; settled by the sourced crosswalk (`docs/research/nec-crosswalk.md`) |

Values it confirmed with no finding: Table 8 circular mils, Table 310.16 (Cu, Al), the correction and
adjustment factors, THHN and XHHW areas, Table 314.16(A)/(B), Tables 430.248/430.250, the Table 430.52
main row, Article 220 demand tables, Table 450.3(B) primary-only.
