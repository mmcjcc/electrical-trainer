# Master Electrician Prep (Maryland)

Practice for the **Maryland Master Electrician** exam (PSI, computer-based, open book on the
**2020 NEC**: 90 questions worth 100 points, 240 minutes, 70% to pass; Calculations 30 points,
Electrical Theory 20). Built for one candidate who knows the trade and wants help with the math.

Two parts:

1. **Code questions**, the way the exam asks them: four options, a timer when you want one, and an
   optional **"Where is it in the book?"** hint that opens in three steps (chapter → article and part →
   exact section or table, with a tab tip). Practice by exam area, spaced review of misses, a
   find-it-in-the-book drill, and a full or short exam simulator scored against the PSI blueprint.
2. **Math and load calculations**, as recipes: the same numbered worksheet every time, one lookup or
   one operation per line, plain words first, the book location as a hint, calculator keys only when
   needed, and a specific reason for every wrong entry ("you took 35% of the whole lighting load").
   Four stages fade the help: **Show me** (worked example with predict-the-next-line checkpoints),
   **Coach me**, **Paper** (only the bucket totals, like scratch paper), **Test me** (exam-style, where
   each wrong option is a classic mistake). Number drills and an exam-strategy page round it out.

Progress stays on the device (export/import to move it between phone and computer).

The design and the reasons behind it: `docs/DESIGN.md`. The exam facts, with sources:
`docs/research/maryland-exam.md`. Reviews of the content (what was checked, what was fixed):
`docs/reviews/`.

## Run it

Node 22. On Jason's laptop Node is a portable install that only Git Bash sees (see `CLAUDE.md`), and
the working copy lives outside OneDrive (`C:\work\electrical-trainer`).

```bash
npm ci
npm run dev        # http://localhost:5174
npm test
npm run build      # typecheck + production build into dist/
```

## Hosting

On Jason's home platform (app-broker, contract 2) as `electrician` behind the platform's sign-in;
see `deploy/README.md`.

## Accuracy and copyright

Questions and worksheets are original practice material, not real exam items. Code-book values used by
the generators were entered by hand and cross-checked (`docs/reviews/`); the app sends the student to his
own NEC to look values up, which is the skill the open-book exam tests, and never reproduces code text.
NEC® and NFPA 70® are registered trademarks of the National Fire Protection Association. Not affiliated
with PSI or the Maryland State Board of Electricians. Check the current PSI bulletin before testing.
