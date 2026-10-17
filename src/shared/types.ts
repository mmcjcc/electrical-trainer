/**
 * Fixed contracts shared by every layer. Types only (plus a few constant lists).
 *
 * Layers, imports flow downward only:  shared <- data <- calc <- content <- store <- ui
 *   data     factual values from the code book (tables), the NEC article index, Maryland law facts
 *   calc     the worksheet engine: number parsing, checking a line, mistake diagnosis, distractors
 *   content  recipes (calculation generators), the question bank, the exam blueprint
 *   store    progress (event log in localStorage)
 *   ui       components, pages
 *
 * Change a contract here only additively, and say so in your report.
 */

// ---------------------------------------------------------------------------------------------
// Code book references
// ---------------------------------------------------------------------------------------------

/**
 * Editions the app can point into. The Maryland exam uses 2020 today and is expected to move to 2026
 * (docs/research/maryland-exam.md §4); 2023 is kept for candidates who learned on it. The exam's
 * edition is a setting, default '2020'.
 */
export type NecEdition = '2020' | '2023' | '2026'

/** Which book a reference points into. `MD` = Maryland law (statute or COMAR); `THEORY` = no book. */
export type RefBook = 'NEC' | 'MD' | 'THEORY'

/**
 * A place in the book. `loc` is what an electrician would flip to: '250.66', 'Table 250.66',
 * '314.16(B)(4)', 'Chapter 9, Table 4', 'Annex C, Table C.1', 'Art. 680'.
 * When the location differs between editions, give `byEdition`; `loc` is then the 2020 value.
 */
export interface CodeRef {
  book: RefBook
  loc: string
  byEdition?: Partial<Record<NecEdition, string>>
  /** Short title of what is found there, in our own words ("Grounding electrode conductor size"). */
  title?: string
}

/** The three-rung "where is it in the book?" hint, derived from a CodeRef by data/necIndex. */
export interface BookHint {
  /** Rung 1: the chapter ("Chapter 2: Wiring and Protection"). */
  chapter: string
  /** Rung 2: the article and part ("Article 250, Part III: Grounding Electrode System and GEC"). */
  article: string
  /** Rung 3: the exact section or table ("Table 250.66"). */
  exact: string
  /** Optional tab tip: where it sits in the book, what to look for on the page. */
  tip?: string
}

// ---------------------------------------------------------------------------------------------
// Exam blueprint and the fact question bank (Part 1)
// ---------------------------------------------------------------------------------------------

/**
 * Exam content areas. The ids are ours; titles and question counts come from the exam vendor's
 * bulletin and live in content/blueprint.ts (the only place to change when the bulletin changes).
 */
export type TopicId = string

export type Difficulty = 1 | 2 | 3

/** One exam-style multiple-choice question, written by us (never copied from a vendor's bank). */
export interface Question {
  /** Stable id, `<topic>-<nnn>`; never reused after a question is retired. */
  id: string
  topic: TopicId
  /** The stem as it would read on the test: short, neutral, "According to the NEC, ..." style. */
  stem: string
  /** Exactly four options, A-D. Plain text; numbers carry units. */
  choices: [string, string, string, string]
  /** Index of the correct option. */
  answer: 0 | 1 | 2 | 3
  /** Why the answer is right, in plain words; one to three sentences. Never quotes the code at length. */
  explain: string
  /** Where the answer lives. */
  ref: CodeRef
  difficulty: Difficulty
  /**
   * Editions this question is valid for. A question whose answer changed between editions is two
   * questions (one per edition).
   */
  editions: NecEdition[]
  /** 'lookup': answered by finding a table value; 'rule': a rule or requirement; 'law': Maryland law; 'theory'. */
  kind: 'lookup' | 'rule' | 'law' | 'theory' | 'calc'
  /** Optional per-wrong-option note: why someone picks it and why it is wrong. Keyed by option index. */
  whyNot?: Partial<Record<0 | 1 | 2 | 3, string>>
  /** Who wrote/verified it; kept for the review trail (docs/reviews). */
  provenance?: { draftedBy: string; verifiedBy?: string; note?: string }
}

// ---------------------------------------------------------------------------------------------
// Math coach (Part 2): recipes and worksheets
// ---------------------------------------------------------------------------------------------

/** Units the worksheet knows how to print. `none` for pure counts and factors. */
export type Unit =
  | 'VA' | 'kVA' | 'W' | 'kW' | 'A' | 'V' | 'ohm' | 'ft' | 'ft2' | 'in2' | 'in3' | 'cmil'
  | 'pct' | 'hp' | 'degC' | 'degF' | 'count' | 'factor' | 'awg' | 'trade' | 'none'

/** The calculation families; each has a home screen section and a recipe-card colour. */
export type RecipeFamily =
  | 'basics'       // Ohm's law, power, single- and three-phase current
  | 'dwelling'     // Article 220 dwelling calculations
  | 'commercial'   // Article 220 non-dwelling calculations
  | 'raceway'      // Chapter 9 conduit fill
  | 'box'          // 314.16 box fill, 314.28 pull boxes
  | 'ampacity'     // 310.15/310.16, continuous loads, OCPD sizing
  | 'vdrop'        // voltage drop
  | 'motor'        // Article 430
  | 'transformer'  // Article 450

export type RecipeId = string

/** How the student enters a line. */
export type LineKind =
  /** Read a number out of the word problem (teaches "what did they give me?"). */
  | 'given'
  /** Find a number in the code book (table value, factor, minimum). */
  | 'lookup'
  /** One arithmetic operation on earlier lines or givens. */
  | 'calc'
  /** Pick one of a few options (single- or three-phase? which column? next standard size?). */
  | 'choose'

/** One of the options of a `choose` line. */
export interface LineOption {
  id: string
  label: string
  /** Shown when this option is picked and it is wrong. */
  feedback?: string
  /** Catalog id of the mistake this wrong option stands for (progress counts it). */
  mistake?: string
}

/** A known wrong value for a line and what it means. Checked before the generic detectors. */
export interface MistakeValue {
  value: number
  /** Id from the mistake catalog (calc/mistakes.ts) so progress can count it. */
  mistake: string
  /** Plain-English correction, specific to this line ("You used 120 V; a range runs on 240 V."). */
  message: string
}

/**
 * One numbered line of a worksheet. A recipe produces the same lines in the same order every time;
 * only the numbers change. Every line is ONE lookup or ONE operation.
 */
export interface WorkLine {
  /** Stable within the recipe ('area', 'glVA', 'demand35'), used for references and progress. */
  id: string
  kind: LineKind
  /** Short name of the line, always shown ("General lighting load"). */
  label: string
  /** What to do, in plain words ("Multiply the floor area by 3 VA per square foot"). Faded in later levels. */
  say: string
  /** Why this line exists (Show-me mode, and the "why?" button). */
  why?: string
  /** Where in the book (lookup lines, and calc lines whose factor comes from the book). */
  ref?: CodeRef
  /** The arithmetic with the numbers filled in, as printed: "2,400 × 3". calc lines only. */
  expr?: string
  /** Basic-calculator keystrokes, one key per item: ['2400', '×', '3', '=']. calc lines only. */
  keys?: string[]
  /** Expected numeric value (all kinds except `choose`). */
  value?: number
  unit: Unit
  /** Display of the expected value with unit: "7,200 VA". For `choose` lines: the correct option's label. */
  display: string
  /**
   * Accepted error. `abs` wins when given; otherwise `rel` (default 0.005 = half a percent, enough
   * for a student who rounds an intermediate to whole VA or 0.1 A).
   */
  tol?: { abs?: number; rel?: number }
  /** For `choose` lines. */
  options?: LineOption[]
  /** For `choose` lines: the id of the right option. */
  answerId?: string
  /** Known wrong values (most specific feedback first). */
  mistakes?: MistakeValue[]
  /**
   * Other values that are also right (within half a percent), e.g. the exact amperes of a line whose
   * value is rounded per 220.5(B). Checked after `value` and its tolerance.
   */
  accept?: number[]
  /**
   * The operands of a calc line, so the generic detectors can recognise an inverted operation or a
   * percent typed as a whole number. `op` is the one operation the line asks for.
   */
  operands?: { a: number; b: number; op: '×' | '÷' | '+' | '−' }
  /** A one-line ballpark ("about 3 VA for every square foot") shown after the line is right. */
  sanity?: string
  /** The bucket this line belongs to (ProblemInstance.sections). Lines of one bucket are contiguous. */
  section?: string
  /**
   * Show-me mode asks him to predict this line before revealing it (two options: the right value and
   * its first known mistake). Mark the lines where the rule matters, not plain arithmetic.
   */
  checkpoint?: boolean
}

/**
 * A bucket of lines with one subtotal ("Lighting, small appliances and laundry after demand").
 * In the "paper" stage only bucket totals are asked; a wrong total opens the bucket's lines.
 */
export interface Section {
  id: string
  label: string
  /** The line whose value is this bucket's result. */
  totalLine: string
  /** A letter for the paper mnemonic (L-F-D-R-H-A for a dwelling). */
  letter?: string
}

/** A number the word problem gives, so the `given` lines and the highlighter can find it. */
export interface Given {
  id: string
  label: string
  value: number
  unit: Unit
  /** The exact substring of `story` that states it, for highlighting. */
  phrase: string
}

/** One option of the final multiple-choice question. */
export interface AnswerChoice {
  label: string
  correct: boolean
  /** For a wrong option: the mistake that produces it (catalog id) and a one-line explanation. */
  mistake?: string
  why?: string
}

/** One generated problem: the word problem, its worksheet and its exam-style options. */
export interface ProblemInstance {
  recipeId: RecipeId
  seed: number
  /** The word problem, as it would read on the test. */
  story: string
  givens: Given[]
  /** What is being asked, in plain words ("the minimum service load in amperes"). */
  ask: string
  lines: WorkLine[]
  /** Buckets in order; every line with a `section` belongs to one of these. Optional for short recipes. */
  sections?: Section[]
  /** Id of the line whose value is the final answer. */
  answerLine: string
  /** Four options in display order, exactly one correct. */
  choices: AnswerChoice[]
  /**
   * Optional data for the recipe's picture, picked by `visual.kind` ('raceway', 'box', 'load'); unknown
   * kinds draw nothing. `visual.after = '<lineId>'` says which line the picture waits for (default: the
   * answer line), so it never gives the answer away early.
   */
  visual?: Record<string, unknown>
}

/** The recipe card: the fixed method in words, printed the same way every time. */
export interface RecipeCard {
  /** One sentence: when to use this recipe ("The question gives a house's square footage and its appliances and asks for the service size"). */
  whenToUse: string
  /** The steps, in order, each with its book location. Mirrors the line labels. */
  steps: { label: string; how: string; ref?: CodeRef }[]
  /** Rules of thumb and traps ("Round the number of wires DOWN unless the decimal is .8 or more"). */
  traps: string[]
  /** Formulas in plain notation ("Amps = VA ÷ (Volts × 1.732)"). */
  formulas?: string[]
}

export interface Recipe {
  id: RecipeId
  family: RecipeFamily
  title: string
  /** One plain sentence under the title. */
  blurb: string
  card: RecipeCard
  /** Deterministic: the same seed gives the same problem. Clean numbers by construction. */
  generate: (seed: number) => ProblemInstance
  /** Exam topic this recipe's questions count toward. */
  topic: TopicId
  /** Editions the recipe's line references are valid for. */
  editions: NecEdition[]
}

/**
 * The four ways to work a recipe, from most help to none (DESIGN.md §5):
 *   show   worked example, revealed line by line, with predict-the-next-line checkpoints
 *   coach  every line is a blank; instruction shown (fade 1) or behind a hint (fade 2)
 *   paper  only the bucket totals are blanks, like working on scratch paper; a wrong total opens its bucket
 *   test   exam style: the word problem and four options, optional timer; the worksheet is the explanation
 */
export type CoachMode = 'show' | 'coach' | 'paper' | 'test'

/**
 * Coach-mode fading. 1: label + instruction shown, book location one tap away. 2: label only;
 * the instruction, the book location and the keystrokes are hint rungs.
 */
export type FadeLevel = 1 | 2

// ---------------------------------------------------------------------------------------------
// Checking a line (calc/check.ts)
// ---------------------------------------------------------------------------------------------

export type LineVerdict =
  | { ok: true; note?: string }
  | {
      ok: false
      /** Catalog id of the recognised mistake, or 'unknown'. */
      mistake: string
      /** What to tell him; never just "wrong". */
      message: string
      /** True when the input could not be read as a number. Does not count as an attempt. */
      unreadable?: boolean
    }
