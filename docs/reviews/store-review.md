# Review of the progress store and exam scoring, 2026-10-17

Reviewer: Antigravity (`agy`, Gemini 4 Argon High, plan mode, sandboxed, read-only) on a copy of `src/store/`,
`exam.ts` and `blueprint.ts`. Each finding was checked against the code; fixes carry tests in
`src/store/store.test.ts` and `src/content/exam.test.ts`.

| # | Finding (severity given) | Verdict | Fix |
|---|---|---|---|
| 1 | Streak used now − 24 h for "yesterday"; wrong on daylight-saving days (major) | Real | Yesterday by the calendar |
| 2 | Last-week boundary = week start − 7 × 24 h (minor) | Real | A calendar week back |
| 3 | Review cards came due at the same clock time, so "back tomorrow" was hidden until evening (major) | Real | Due at the start of the target calendar day |
| 4 | A missed Test-me run while still in Show/Coach *promoted* him to Paper; dirty runs did not reset the clean count (major) | Real | A miss drops to Paper only from Paper/Test; clean runs must be in a row; the count is capped |
| 5 | Find-it rounds counted in topic stats and "seen" (major) | Real | Excluded |
| 6 | Merging two devices kept an older box-4 card over a newer miss; replace left an old exam behind; duplicates inside one file survived (major) | Real | Cards carry `last` (answer time) and the newer wins; replace clears the exam and last results; de-duplication inside the file |
| 7 | A slice that fails to parse was silently replaced by an empty one on the next write (blocker) | Real | The raw text is kept at `<key>.corrupt` and the storage warning is raised; hydrated events are validated |
| 8 | Exam arrays not validated on reload; calculation items left no trace in his calc record; hinted exam answers advanced review boxes (blocker) | Real | Sessions whose arrays do not match the paper are dropped; calc items are recorded as Test-me runs; hinted answers count as hinted |
| 9 | Duplicate questions or calculation problems on one paper (major) | Bank ids are already unique (the bank throws on a duplicate); same recipe many times was possible | At most three problems from one recipe per paper |
| 10 | Short exam rounding skews Theory's weight; null vs undefined blanks; pass checked on a rounded percent (major) | Real, the first is accepted for a practice paper | Blank = null or undefined; pass on exact points |
| 11 | Grading re-derived answers from live code, so an app update could grade a saved exam differently from what was shown (blocker) | Real (rare) | Each item stores its answer index when the paper is built |
