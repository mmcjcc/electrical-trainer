/**
 * Test-only fixture bank (never imported by the app). UI tests swap the real bank for it with
 *   vi.mock('@/content/bank', async () => (await import('@/components/question/fixtures')).fixtureBankModule())
 * Questions here are placeholders for exercising the screens, not exam content.
 */
import type { NecEdition, Question, TopicId } from '@/shared/types'

function make(id: string, topic: TopicId, kind: Question['kind'], extra: Partial<Question> = {}): Question {
  return {
    id,
    topic,
    stem: `Fixture stem ${id}?`,
    choices: [`${id} option one`, `${id} option two`, `${id} option three`, `${id} option four`],
    answer: 0,
    explain: `Fixture explanation for ${id}.`,
    ref: { book: 'NEC', loc: 'Table 250.66', title: 'Grounding electrode conductor for AC systems' },
    difficulty: 1,
    editions: ['2020', '2023'],
    kind,
    ...extra,
  }
}

export const FIXTURE_QUESTIONS: Question[] = [
  ...Array.from({ length: 12 }, (_, i) => make(`wp-${String(i + 1).padStart(3, '0')}`, 'wiring-protection', 'rule')),
  make('th-001', 'theory', 'theory', { ref: { book: 'THEORY', loc: "Ohm's law: E = I × R" }, answer: 2 }),
  make('th-002', 'theory', 'theory', { ref: { book: 'THEORY', loc: "Ohm's law: E = I × R" }, answer: 1 }),
  make('eq-001', 'equipment', 'rule', { answer: 3, whyNot: { 0: 'Fixture why-not for option one.' } }),
  make('law-001', 'md-law', 'law', { ref: { book: 'MD', loc: 'BOP §6-604' } }),
]

export function fixtureBankModule() {
  const bank = FIXTURE_QUESTIONS
  const allQuestions = (edition?: NecEdition) => (edition ? bank.filter((q) => q.editions.includes(edition)) : [...bank])
  return {
    allQuestions,
    questionsForTopic: (topic: TopicId, edition?: NecEdition) => allQuestions(edition).filter((q) => q.topic === topic),
    getQuestion: (id: string) => bank.find((q) => q.id === id),
  }
}
