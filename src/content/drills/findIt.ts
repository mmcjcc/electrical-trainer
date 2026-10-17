/**
 * "Find it in the book": the open-book navigation drill. Each item names what is found somewhere in
 * the code book (a REF entry's title, in our words) and offers four locations. The wrong ones are
 * neighbours from the same part of the book (Table 250.66 vs 250.122 vs 250.102(C)(1) vs 310.16), so
 * the drill trains the tab-and-flip skill, not guessing. Pure and seeded.
 *
 * Locations are printed for the edition he chose (necIndex.locFor). Export: the folder's index.ts
 * (another builder's) should re-export `findItRound`, `FIND_IT_DRILL`, and the types.
 */
import { makeRng } from '@/calc'
import { locFor } from '@/data/necIndex'
import { REF, type RefKey } from '@/data/refs'
import type { CodeRef, NecEdition } from '@/shared/types'

/** The drill id logged with `logDrill`. */
export const FIND_IT_DRILL = 'find-it'

export interface FindItItem {
  /** The REF key the item asks about. */
  key: string
  /** What he is looking for (the REF title). */
  prompt: string
  /** Four locations for the chosen edition, in display order. */
  choices: [string, string, string, string]
  answer: 0 | 1 | 2 | 3
  /** The reference behind each choice (so feedback can say what is at the place he picked). */
  choiceRefs: [CodeRef, CodeRef, CodeRef, CodeRef]
  ref: CodeRef
}

export interface FindItRound {
  seed: number
  edition: NecEdition
  items: FindItItem[]
}

export interface FindItEntry {
  key: string
  ref: CodeRef
}

/**
 * Rows of refs.ts marked `// VERIFY` (still waiting for a second source). They are left out of the
 * drill, both as questions and as wrong options, until they are checked. 2023-only doubts apply to
 * 2023 only. Article 220 waits for the 2023 crosswalk (refs.ts says so), so it is left out for 2023.
 * Keep in step with refs.ts (better: refs.ts exports this list; see the SHELL builder's report).
 */
const UNVERIFIED: Partial<Record<RefKey, 'all' | NecEdition[]>> = {
  annexC_PVC80: 'all',
  annexC_PVC40: 'all',
  motorOcpdTable: ['2023'],
  motorOcpdNextSize: ['2023'],
  floorArea: 'all',
  dwellingLighting: 'all',
  nonDwellingLighting: 'all',
  showWindow: 'all',
  lightingDemand: 'all',
  nonDwellingReceptacles: 'all',
}

function usable(key: string, ref: CodeRef, edition: NecEdition): boolean {
  if (ref.book !== 'NEC' || !ref.title) return false
  const doubt = UNVERIFIED[key as RefKey]
  if (doubt === 'all' || (doubt && doubt.includes(edition))) return false
  if (edition === '2023' && /^(Table )?220\./.test(ref.loc)) return false
  return true
}

/**
 * Titles written for the hint ladder that need their context to stand alone as a question
 * ("Next higher standard size permitted" is also true of 240.4(B)).
 */
const PROMPT: Partial<Record<RefKey, string>> = {
  motorOcpdNextSize: 'Motor branch-circuit fuse or breaker: when the next higher standard size is permitted',
}

/** The NEC entries of REF, in file order (with the prompt overrides applied to their titles). */
export const FIND_IT_POOL: FindItEntry[] = Object.entries(REF).map(([key, ref]) => {
  const prompt = PROMPT[key as RefKey]
  return { key, ref: prompt ? { ...ref, title: prompt } : ref }
})

/** Bucket of the book a location sits in: 'ch9', 'annexC', or the article number. */
export function bucketOf(loc: string): string {
  if (/^Chapter 9/i.test(loc)) return 'ch9'
  if (/^Annex C/i.test(loc)) return 'annexC'
  const m = /(\d{2,3})\.\d/.exec(loc)
  return m?.[1] ?? loc
}

/** Neighbouring articles: wrong options are drawn from the same group first. */
const GROUP: Record<string, string> = {
  ch9: 'raceway', annexC: 'raceway',
  '110': 'ocpd', '210': 'ocpd', '215': 'ocpd', '240': 'ocpd',
  '310': 'sizing', '250': 'sizing',
  '220': 'load', '230': 'load',
  '314': 'box',
  '430': 'motor', '440': 'motor', '450': 'motor',
}

const isTable = (loc: string) => /^Table /.test(loc) || /, Table /.test(loc)

/** '314.16(B)(4)' for 'Table 314.16(B)(4)'; notes and exceptions stay on the end. */
function core(loc: string): string {
  return loc.replace(/^Table /, '').trim()
}

/**
 * True when one location contains the other (314.16 holds 314.16(B)(4); Annex C holds Annex C,
 * Table C.1; 220.54 and Table 220.54 are the same place). Such a pair would make two options right.
 */
export function overlaps(a: string, b: string): boolean {
  const x = core(a)
  const y = core(b)
  if (x === y) return true
  const [short, long] = x.length <= y.length ? [x, y] : [y, x]
  if (!long.startsWith(short)) return false
  const next = long.charAt(short.length)
  return !/\d/.test(next)
}

function similarity(answer: string, other: string): number {
  const ba = bucketOf(answer)
  const bo = bucketOf(other)
  let s = 0
  if (ba === bo) s += 4
  else if (GROUP[ba] && GROUP[ba] === GROUP[bo]) s += 2
  if (isTable(answer) === isTable(other)) s += 1
  return s
}

/** Builds one item for `entry`, or null when there are not three fair wrong options. */
export function findItItem(entry: FindItEntry, pool: readonly FindItEntry[], edition: NecEdition, seed: number): FindItItem | null {
  const rng = makeRng(seed)
  const answerLoc = locFor(entry.ref, edition)
  const prompt = entry.ref.title as string
  const taken: string[] = [answerLoc]
  const candidates = rng
    .shuffle(pool.filter((e) => e.key !== entry.key && usable(e.key, e.ref, edition)))
    .map((e) => ({ e, loc: locFor(e.ref, edition) }))
    .sort((a, b) => similarity(answerLoc, b.loc) - similarity(answerLoc, a.loc))
  const wrong: { e: FindItEntry; loc: string }[] = []
  for (const c of candidates) {
    if (wrong.length === 3) break
    if (taken.some((t) => overlaps(t, c.loc))) continue
    // A wrong option the prompt itself names ("per 430.24") would be a trick, not a lesson.
    if (prompt.includes(core(c.loc))) continue
    wrong.push(c)
    taken.push(c.loc)
  }
  if (wrong.length < 3) return null
  const order = rng.shuffle([0, 1, 2, 3])
  const all = [{ e: entry, loc: answerLoc }, ...wrong]
  const placed = order.map((i) => all[i] as { e: FindItEntry; loc: string })
  return {
    key: entry.key,
    prompt,
    choices: placed.map((p) => p.loc) as FindItItem['choices'],
    answer: order.indexOf(0) as FindItItem['answer'],
    choiceRefs: placed.map((p) => p.e.ref) as FindItItem['choiceRefs'],
    ref: entry.ref,
  }
}

/** A round of `n` (default 10) distinct items for the edition. The same seed gives the same round. */
export function findItRound(seed: number, edition: NecEdition, n = 10, pool: readonly FindItEntry[] = FIND_IT_POOL): FindItRound {
  const rng = makeRng(seed)
  const usablePool = pool.filter((e) => usable(e.key, e.ref, edition))
  // A title that names a section ("demand per Table 220.54") gives its own answer away: not a prompt.
  const prompts = rng.shuffle(usablePool.filter((e) => !/\d{2,3}\.\d/.test(e.ref.title ?? '')))
  const items: FindItItem[] = []
  const seenLoc: string[] = []
  for (const e of prompts) {
    if (items.length >= n) break
    const loc = locFor(e.ref, edition)
    if (seenLoc.includes(loc)) continue
    const item = findItItem(e, usablePool, edition, rng.int(1, 2 ** 30))
    if (!item) continue
    items.push(item)
    seenLoc.push(loc)
  }
  return { seed, edition, items }
}
