# Electrical Trainer: working notes for every engineer and agent

Maryland Master Electrician exam prep (PSI exam, **2020 NEC**, 90 questions / 100 points, 240 min, 70%).
Read `docs/DESIGN.md` first (the product and the teaching approach), then `docs/research/maryland-exam.md`
(the exam facts). The Math & Science Trainer (`S:\Users\cohenjas\OneDrive\math\precalc-trainer`) is the
base this app's stack and conventions come from; read its files for patterns, never edit them.

Hosting: use the homelab skill, or run "ssh homelab contract" and follow it. Never ssh to docker01 any other way.

## Where to work

The working copy is `C:\work\electrical-trainer` (outside OneDrive: builds and node_modules never go into
OneDrive). `S:\Users\cohenjas\OneDrive\electrical_trainer` holds the same repo with sources only; it pulls
from the working copy. Use the **Bash tool** (Git Bash): `node`/`npm` are on PATH there (portable Node 22),
not in PowerShell. Call tools through node; `npx` and `node_modules/.bin` shims do not work here.

```
npm run typecheck                                  # tsc for app and config
node node_modules/vitest/vitest.mjs run <path>     # a subset while iterating
npm test                                           # everything
node node_modules/vite/bin/vite.js build           # production build without the typecheck
npm run dev                                        # http://localhost:5174
```

## Layers (imports flow downward only; `@/` is `src/`)

`shared <- data <- calc <- content <- store <- ui (components, pages, App.tsx)`

- `src/shared/types.ts`: fixed contracts. Change only additively and say so in your report.
- `src/data/`: `tables.ts` (code-book values), `refs.ts` (concept → location per edition; recipes and
  questions use `REF.*`, never a typed section number), `necIndex.ts` (the hint ladder).
- `src/calc/`: the worksheet engine. `index.ts` is its API: builders `given/lookup/calc/sum/choose`,
  `checkLine/checkChoice`, `numericChoices/labelChoices`, rounding rules, `makeRng`, the mistake catalog.
- `src/content/`: recipes (`recipes/<family>/`), the question bank (`bank/<topic>.ts`), `blueprint.ts`,
  `exam.ts`. `content/index.ts` is the UI's only entry.

## Rules

- Only edit files you own (your brief names them). Do not reformat others' files. If typecheck fails in a
  file you do not own, report it; do not fix it.
- Strict TypeScript, no `any` unless unavoidable (comment why). Colocated tests (`foo.test.ts`); UI tests
  start with `// @vitest-environment jsdom`.
- **Accuracy is the product.** Every number comes from `data/tables.ts`, every location from
  `data/refs.ts`. If a value or a rule is not there and you are not certain of it, stop and report it;
  never guess. Write the NEC 2020 rule; note any edition difference in a comment.
- **Copyright:** never paste NEC text or reproduce a whole table in the UI; paraphrase. Questions are our
  own, never copied from a publisher or a vendor bank.
- **Voice:** a patient journeyman teaching an apprentice. Plain words, short sentences, name the rule, never
  just "wrong". Numbers with units and thousands separators (`fmtUnit`).
- Every recipe passes `checkRecipe` from `content/recipes/harness.ts` (≥ 60 seeds) plus hand-worked spot
  tests whose expected values you computed by hand in a comment.
- Never commit secrets. Commit messages end with the Co-Authored-By line the session gives you.
