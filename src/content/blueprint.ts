/**
 * The Maryland Master Electrician exam as PSI publishes it ("Master and Journeyperson Electrician
 * Qualification Information Bulletin", updated 9/1/2024; checked 2026-10-16). The only file to change
 * when the bulletin changes. Source and details: docs/research/maryland-exam.md.
 */
import type { NecEdition, TopicId } from '@/shared/types'

export interface Topic {
  id: TopicId
  /** The bulletin's name for the area. */
  title: string
  /** Number of questions on the exam. */
  questions: number
  /** Points per question (Electrical Theory items are worth 2). */
  points: number
  /** The bulletin's sub-areas, for the practice picker. */
  covers: string[]
  /** Not on the exam outline (shown in practice, never in the simulator). */
  offExam?: boolean
}

export const EXAM = {
  name: 'Maryland Master Electrician (PSI)',
  questions: 90,
  totalPoints: 100,
  minutes: 240,
  passPct: 70,
  edition: '2020' as NecEdition,
  openBook: 'NFPA 70 (NEC), 2020 edition only. Highlighting, underlining and permanent tabs allowed; no writing in the book, no Post-its, no papers.',
  calculator: 'An on-screen calculator is provided; bring no calculator of your own.',
  retake: 'Wait 30 days to retake.',
} as const

export const TOPICS: Topic[] = [
  {
    id: 'theory', title: 'Electrical Theory', questions: 10, points: 2,
    covers: ['Definitions', "Theory including Ohm's law", 'Techniques', 'Troubleshooting', 'Equipment and devices', 'Instruments', 'Materials', 'Math', 'Conversions', 'Diagrams', 'Symbols'],
  },
  {
    id: 'wiring-protection', title: 'Wiring and Protection', questions: 14, points: 1,
    covers: ['Article 100', 'Article 110', 'Articles 200-210', 'Articles 215-225', 'Article 230', 'Article 240', 'Articles 250-285'],
  },
  {
    id: 'wiring-methods', title: 'Wiring Methods and Materials', questions: 13, points: 1,
    covers: ['Article 300', 'Articles 310-314', 'Articles 320-330', 'Articles 332-356', 'Articles 358-374', 'Articles 376-398'],
  },
  {
    id: 'equipment', title: 'Equipment for General Use', questions: 9, points: 1,
    covers: ['Articles 400-411', 'Articles 422-427', 'Articles 430-450', 'Articles 455-490'],
  },
  {
    id: 'special-occupancies', title: 'Special Occupancies', questions: 8, points: 1,
    covers: ['Articles 500-525', 'Articles 530-547', 'Articles 550-590'],
  },
  {
    id: 'special-equipment', title: 'Special Equipment', questions: 4, points: 1,
    covers: ['Articles 600-675', 'Articles 680-695'],
  },
  {
    // The bulletin calls this area "Special Communications"; it covers Chapter 7 and Chapter 8.
    id: 'special-conditions', title: 'Special Conditions and Communications', questions: 2, points: 1,
    covers: ['Articles 700-708', 'Articles 720-830'],
  },
  {
    id: 'calculations', title: 'Calculations', questions: 30, points: 1,
    covers: ['Load calculations', 'Raceway and box fill', 'Ampacity and overcurrent protection', 'Voltage drop', 'Motors', 'Transformers'],
  },
  {
    id: 'md-law', title: 'Maryland licensing law', questions: 0, points: 1, offExam: true,
    covers: ['Business Occupations and Professions Article, Title 6', 'COMAR 09.09'],
  },
]

export function topic(id: TopicId): Topic {
  const t = TOPICS.find((x) => x.id === id)
  if (!t) throw new Error(`unknown topic ${id}`)
  return t
}

/** Topics that appear on the exam, in bulletin order. */
export const EXAM_TOPICS = TOPICS.filter((t) => !t.offExam)
