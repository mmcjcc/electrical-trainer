# Electrical Trainer: Maryland Master Electrician exam prep (design)

Status: design v1, 2026-10-16. Owner: Jason. Built by Claude (architect and final say), with Antigravity
(Gemini 4 Argon High) drafting and reviewing; every Antigravity claim is checked before it is used
(`docs/reviews/`).

## 1. Who it is for and what he needs

One adult candidate for the **Maryland Master Electrician** license. He is an experienced electrician,
not a math person. He studies on his phone in short sessions and sometimes at a computer. Two needs:

1. **The facts**, practised the way the real exam presents them: short four-option questions, open
   book, against the clock, with **where it is in the code book** as an optional hint.
2. **The math**: load calculations above all, then conduit and box fill, ampacity, voltage drop,
   motors and transformers, walked through so that a man who is not a math whiz can do them
   reliably under time pressure.

The exam facts (vendor, format, blueprint, NEC edition, allowed references) are in
`docs/research/maryland-exam.md`; the blueprint numbers live in exactly one file,
`src/content/blueprint.ts`.

## 2. Where it comes from

- **Base: the Math & Science Trainer** (`S:\Users\cohenjas\OneDrive\math\precalc-trainer`). Reused:
  the stack (Vite, React 19, TypeScript, Tailwind 4, Zustand, Vitest), the layer discipline, the idea of
  checking every line of work and naming the mistake, seeded generators with a full canonical path per
  problem, the hint ladder, the append-only event log with export/import, the phone-first layout
  rules, the static nginx image. Not reused: the symbolic math engine (these problems are arithmetic
  chains, not algebra), KaTeX, the graphing, Azure.
- **Hosting: app-broker contract 2** (`S:\Users\cohenjas\OneDrive\app-broker`), see §9.

## 3. The teaching approach for the math (Part 2)

The candidate does not need more math; he needs the problem to stop being a wall of numbers. What
loses points, in order (our analysis, cross-checked with Antigravity's, `docs/reviews/pedagogy.md`):
sorting the numbers in the story into the right buckets; reading the right table, column and note;
picking the method; units and scale (kW vs VA, one-way length); calculator sequencing; the trade's
three rounding rules; and trusting an answer choice that was built from his own mistake.

So every calculation type is a **recipe**:

1. **The same worksheet every time.** A recipe is a fixed list of numbered lines grouped in
   **buckets** (a dwelling: L-F-D-R-H-A = Lighting/small appliance/laundry, Fixed appliances, Dryer,
   Range, Heat or A/C, Amps). Every line is **one** thing: read a number from the story, look one
   value up in the book, do one operation, or make one decision. Lines that do not apply to a
   particular problem are left out, and every fork is an explicit decision line
   ("Four or more fastened-in-place appliances? Yes: × 0.75 / No: 100%"), never a dead line with 0.
2. **Plain words first, then the book, then the keys.** Each line has a label ("General lighting
   load"), an instruction in plain words ("Multiply the floor area by 3 VA per square foot"), a book
   location as a hint ladder (chapter → article → exact table), and calculator keystrokes. The
   keystrokes are **hidden** until he asks or until a diagnosed slip shows he had the right numbers
   but the wrong key sequence (no "Simon says" typing).
3. **Every wrong entry gets a reason, never just "wrong".** The line's own known mistakes first
   ("You used the range nameplate; a household range goes through Table 220.55"), then generic
   detectors (inverted operation, divided the wrong way round, percent typed as a whole number,
   carried a number without doing the step, √3 slipped in or out, decimal point). Unreadable input
   never counts as an attempt. Three misses on a line reveal it (marked as revealed).
4. **Four modes, fading the help** (Renkl's faded worked examples; the "paper" stage closes the gap
   Antigravity flagged between a guided worksheet and a blank exam sheet):
   - **Show me**: the worked example, one line at a time. Lines that carry a rule are
     **checkpoints**: before the line is revealed he picks between the right value and the classic
     mistake ("The dryer is 4,500 W. Next line: 4,500 or 5,000?"). Passive reading is not enough.
   - **Coach me**: every line is a blank. Fade 1 shows the instruction; fade 2 shows only the label,
     and the instruction, book location and keys are hint rungs. The book location at fade 2 is the
     question, not the given ("Which table do you open?").
   - **Paper**: only the bucket totals are blanks, as if working on scratch paper with the L-F-D-R-H-A
     list. A wrong bucket total opens that bucket's lines so he finds the one slip.
   - **Test me**: exam style. The story and four options, an optional per-question timer. The wrong
     options are the classic mistakes, so a wrong pick is explained ("C is what you get if you take
     35% of the whole lighting load"), then the worksheet is the explanation.
   The app suggests the next mode per recipe from his record (two clean runs move him on; a missed
   test sends him back to Paper for that bucket only). Nothing is ever locked.
5. **Micro-recipes and reverse problems.** Exam questions often ask for one slice ("the demand load
   for five 11 kW ranges") or run a formula backwards (smallest conductor for 3% voltage drop; highest
   ambient for a load). Each slice is its own short recipe, and voltage drop and ampacity have
   forward and reverse versions.
6. **Number drills** (45 seconds, no worksheet): percent → multiplier ("125% is × 1.25"), pick the
   divisor (÷ 240, ÷ 360 for 208 V three-phase, ÷ 831 for 480 V), the threshold split (subtract,
   equals, multiply, add back), kW → VA, keep-or-bump-up rounding (220.5(B) half-amp, Chapter 9 Note 7
   at .8, "big enough" sizes always up, motor feeders at or below).
7. **Pictures where they carry the idea**: the conduit cross-section with a fill gauge to the 40%
   line, the box with every counted item as a tile, the load calculation as stacked buckets before
   and after demand.
8. **Exam habits taught explicitly**: the three-pass triage (lookups first, single-formula second,
   full load calcs last), the scratch-paper brain dump at the start (÷360/÷416/÷831, the VD formula,
   L-F-D-R-H-A), crossing off non-standard breaker sizes before calculating, estimation anchors
   (2,400 VA ≈ 10 A at 240 V; 36 kVA ≈ 100 A at 208 V three-phase).

Recipes, v1 (each with its card, generator, worksheet, mistakes, distractors and tests):

| family | recipes |
|---|---|
| basics | Ohm's law and power (single-phase); three-phase current from kVA/kW; power factor |
| dwelling | one-family standard method (full); its slices: lighting + small appliance + laundry demand, range demand (one range, Note 1; several ranges, Note 2), dryers (Table 220.54), fixed appliances 75%; one-family optional method (220.82); multifamily optional (220.84); neutral (220.61) |
| commercial | store/office: lighting unit load × 125%, receptacles with the non-dwelling demand, show window, sign; kitchen equipment (Table 220.56) |
| raceway | how many same-size wires fit (Table 4 ÷ Table 5, Note 7) and the Annex C cross-check; smallest raceway for a mix; nipples (60%) |
| box | box fill: count the items, total the volume, pick or check the box |
| ampacity | continuous load: 125%, standard OCPD, conductor; ampacity with temperature correction and adjustment and the terminal limit; reverse: highest ambient |
| vdrop | voltage drop single- and three-phase; reverse: smallest conductor for 3% |
| motor | branch circuit: FLC, conductor 125%, short-circuit device %, next size up, overload 115/125%; feeder: 125% largest + others, feeder OCPD at or below |
| transformer | primary and secondary current; primary-only protection 125/167/300% |

## 4. The facts (Part 1)

- **Question bank**: original exam-style questions (we never copy a vendor's or a publisher's bank):
  a short stem in the exam's neutral voice ("According to the NEC, ..."), four options, one right
  answer, a plain explanation, and a **book reference** for the hint ladder. Every question names the
  editions it is valid for; a rule that changed between editions is two questions. Topics follow the
  exam blueprint, plus Maryland law and rules (Business Regulation Article Title 6, COMAR 09.09).
- **Practice**: by topic, one question at a time, immediate feedback with the explanation and the
  reference. **Codebook hints are optional** (a setting, and a per-question "Where is it in the
  book?" button): rung 1 the chapter, rung 2 the article and part, rung 3 the exact section or
  table, plus a tab tip. Using a hint is recorded but never penalised.
- **Find it in the book** drill: "Where would you look for ...?", four NEC locations as options.
  Open-book speed is a skill of its own on a timed exam.
- **Review**: missed and hinted questions come back sooner (Leitner boxes: right moves a question up
  a box, wrong sends it to box 1; box intervals 0, 1, 3, 7, 16 days).
- **Exam simulator**: the real exam's question count, time limit and blueprint weights; calculation
  areas draw from the recipe generators in Test-me form. Flag for review, a navigator grid, a pacing
  indicator, hints off by default (switchable for a practice exam), score by topic against the pass
  mark, then a review of every question with the explanation and reference.

## 5. Accuracy and copyright policy

- **Code text is NFPA's.** We never reproduce code text or whole tables in the app. Values the
  generators need (an ampacity, a conductor area, a demand percent) are entered as facts in
  `src/data/tables.ts`; the student is sent to his own book to look them up, which is the exam skill.
  Explanations paraphrase. Maryland statutes and regulations are public law and may be quoted briefly.
- **Every number and every reference is checked twice**: entered from our knowledge, checked against
  a second source (research with URLs, Antigravity's independent review), spot-tested
  (`tables.test.ts` against Annex C counts and known exam results), and every disagreement resolved
  by hand with the reason recorded in `docs/reviews/`. A question or recipe whose answer we cannot
  pin down is left out, not guessed.
- **Edition-aware references.** `src/data/refs.ts` maps each concept to its location in each NEC
  edition. The app shows the location for the edition his exam uses (a setting, defaulting to the
  exam's current edition).

## 6. Architecture

```
src/
  shared/types.ts      contracts (fixed; additive changes only)
  data/                tables.ts (code-book values), refs.ts (concept → location per edition),
                       necIndex.ts (chapters, articles, parts: for the hint ladder), mdLaw.ts
  calc/                the worksheet engine: numbers, check, mistakes, lines, choices, round, rng
  content/
    recipes/<family>/  one file per recipe + tests; recipes/index.ts registers them
    bank/              the question bank, one file per topic; bank/index.ts
    drills/            number drills and the find-it-in-the-book drill
    blueprint.ts       the exam's topics, counts, time and pass mark
    exam.ts            assembling a simulated exam
  store/               event log, settings, Leitner boxes, selectors (adapted from the Math app)
  components/ pages/ App.tsx
```

Imports flow `shared <- data <- calc <- content <- store <- ui`, never upward.

**Self-consistency tests are mandatory for every recipe**: for at least 50 seeds, every line's own
value passes `checkLine`, every known mistake value is rejected with its own mistake id, the answer
line's value matches the correct choice, the four choices are distinct with exactly one correct, and
the story mentions every given. Spot tests pin a few problems to hand-worked results.

## 7. Screens

Home (two big doors: Facts and Math, plus "Today": a short mixed session and the next suggested
recipe), Topic practice, Find-it drill, Review, Exam simulator and its results, Math home (families,
each recipe with its mastery stage), Recipe card, Worksheet (the four modes), Number drills,
Progress (by exam topic and by recipe; the mistakes he makes most, "forgot 125%: 4 → 0 this week"),
Settings (NEC edition, codebook hints, timer, export/import), About (sources, edition, disclaimer).

Phone first: one column, the story pinned in a collapsible strip at the top of the worksheet, big
number pad-friendly inputs (`inputmode="decimal"`), 44 px targets, high contrast for daylight,
color never the only signal.

## 8. Progress and data

All progress stays on the device (localStorage) with export/import, as in the Math app: an
append-only event log (question answered, line attempted, mistake hit, hint used, exam finished),
compacted after 60 days, plus derived selectors. Nothing personal is stored or sent anywhere.
Cross-device sync is a possible follow-up (a tiny API with `/data`), not v1.

## 9. Hosting (app-broker contract 2)

- App `electrician` at `https://electrician.apps.mmcjcc.com` (name to confirm with Jason), image
  `ghcr.io/mmcjcc/electrical-trainer`, static nginx on port 8080 as uid 10005, health `/healthz`,
  read-only root, tmpfs `/tmp`, no secrets, no `/data` in v1.
- Sign-in by the platform: `auth: {profile: electrician}` with the app's own user list (Jason names
  the addresses); the app keeps no allow-list of its own. Exposure `public` if the candidate studies
  away from home (needs his Google account on the list and as a test user of the OAuth client), else
  `lan`/`vpn`.
- CI builds, tests and smoke-tests the image on every push; pushes to `main` publish
  `ghcr.io/mmcjcc/electrical-trainer:<sha>` with the two OCI labels; `sh deploy/deploy.sh` does the
  first deploy, and after it the platform deploys green pushes by itself.

## 10. Out of scope for v1

Accounts beyond the platform sign-in, server-side progress, an AI tutor (the Math app's tutor
sidecar can be added later), the journeyperson exam, NEC 2026.
