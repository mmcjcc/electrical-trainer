/**
 * The fact question bank. One file per topic (`<topic>.ts` exporting `QUESTIONS: Question[]`),
 * registered here. Every question is original, edition-tagged, verified (docs/reviews/bank-*.md) and
 * screened against the web for copies of other banks (docs/reviews/similarity-screen.md).
 */
import type { NecEdition, Question, TopicId } from '@/shared/types'
import { QUESTIONS as EQUIPMENT } from './equipment'
import { QUESTIONS as MD_LAW } from './mdLaw'
import { QUESTIONS as SPECIAL_CONDITIONS } from './specialConditions'
import { QUESTIONS as SPECIAL_EQUIPMENT } from './specialEquipment'
import { QUESTIONS as SPECIAL_OCCUPANCIES } from './specialOccupancies'
import { QUESTIONS as THEORY } from './theory'
import { QUESTIONS as WIRING_METHODS } from './wiringMethods'
import { QUESTIONS as WIRING_PROTECTION } from './wiringProtection'

/** Each topic file exports QUESTIONS; the ARCHITECT adds the import here. */
const BANK: Question[] = [...THEORY, ...WIRING_PROTECTION, ...WIRING_METHODS, ...EQUIPMENT,
  ...SPECIAL_OCCUPANCIES, ...SPECIAL_EQUIPMENT, ...SPECIAL_CONDITIONS, ...MD_LAW,
]

for (const [i, q] of BANK.entries()) {
  if (BANK.findIndex((x) => x.id === q.id) !== i) throw new Error(`duplicate question id ${q.id}`)
}

export function allQuestions(edition?: NecEdition): Question[] {
  return edition ? BANK.filter((q) => q.editions.includes(edition)) : [...BANK]
}

export function questionsForTopic(topic: TopicId, edition?: NecEdition): Question[] {
  return allQuestions(edition).filter((q) => q.topic === topic)
}

export function getQuestion(id: string): Question | undefined {
  return BANK.find((q) => q.id === id)
}
