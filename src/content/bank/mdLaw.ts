/**
 * Maryland licensing law: Business Occupations and Professions Article (BOP), Title 6 (the Maryland
 * Electricians Act), and COMAR 09.09. NOT on the PSI exam outline (docs/research/maryland-exam.md §6);
 * offered as background a master needs. Every fact was checked against the statute and regulation text
 * downloaded on 2026-10-16 (mgaleg.maryland.gov, regs.maryland.gov). Written by the architect.
 */
import type { Question } from '@/shared/types'

const ALL: Question['editions'] = ['2020', '2023', '2026']
const prov = { draftedBy: 'claude', verifiedBy: 'claude: BOP Title 6 / COMAR 09.09 text, 2026-10-16' }
const md = (loc: string, title: string) => ({ book: 'MD' as const, loc, title })

export const QUESTIONS: Question[] = [
  {
    id: 'md-law-001', topic: 'md-law', kind: 'law', difficulty: 1, editions: ALL, provenance: prov,
    stem: 'Under Maryland law, an applicant for a master electrician license must have at least how many years of experience providing electrical services under the direction and supervision of a master electrician (or similar)?',
    choices: ['3 years', '4 years', '5 years', '7 years'],
    answer: 3,
    explain: 'Maryland requires at least 7 years of experience for a master license. A journeyperson license requires 4.',
    whyNot: { 1: 'Four years is the journeyperson requirement.' },
    ref: md('BOP § 6-304(b)', 'Master license experience'),
  },
  {
    id: 'md-law-002', topic: 'md-law', kind: 'law', difficulty: 2, editions: ALL, provenance: prov,
    stem: 'Up to how many years of credit toward the master electrician experience requirement may the State Board allow for completed formal training?',
    choices: ['3 years', '4 years', '5 years', '6 years'],
    answer: 0,
    explain: 'The Board may allow up to 3 years of credit toward the experience requirement for formal training it approves.',
    ref: md('BOP § 6-304(b)(2)', 'Credit for training'),
  },
  {
    id: 'md-law-003', topic: 'md-law', kind: 'law', difficulty: 1, editions: ALL, provenance: prov,
    stem: 'What is the passing score on each Maryland electrician licensing examination?',
    choices: ['70%', '75%', '80%', '85%'],
    answer: 0,
    explain: 'The statute sets the passing score for each examination at 70%.',
    ref: md('BOP § 6-306(f)', 'Passing score'),
  },
  {
    id: 'md-law-004', topic: 'md-law', kind: 'law', difficulty: 1, editions: ALL, provenance: prov,
    stem: 'A licensed master electrician who provides electrical services must carry general liability insurance of at least:',
    choices: ['$100,000', '$250,000', '$300,000', '$500,000'],
    answer: 2,
    explain: 'The law requires general liability coverage of at least $300,000, plus property damage coverage of at least $100,000.',
    whyNot: { 0: '$100,000 is the property damage minimum, not general liability.' },
    ref: md('BOP § 6-604', 'Insurance required'),
  },
  {
    id: 'md-law-005', topic: 'md-law', kind: 'law', difficulty: 1, editions: ALL, provenance: prov,
    stem: 'Besides general liability insurance, a master electrician must carry property damage insurance of at least:',
    choices: ['$100,000', '$200,000', '$300,000', '$500,000'],
    answer: 0,
    explain: 'Property damage coverage must be at least $100,000 (general liability at least $300,000).',
    ref: md('BOP § 6-604', 'Insurance required'),
  },
  {
    id: 'md-law-006', topic: 'md-law', kind: 'law', difficulty: 1, editions: ALL, provenance: prov,
    stem: 'Under Maryland law, who must be present at each job site where electrical services are provided?',
    choices: [
      'At least one licensed master electrician or journeyperson electrician',
      'The master electrician who pulled the permit',
      'At least one licensed apprentice for every two workers',
      'A local electrical inspector',
    ],
    answer: 0,
    explain: 'At least one licensed master or journeyperson electrician must be present at each job site.',
    ref: md('BOP § 6-605(b)', 'Licensee present at each job site'),
  },
  {
    id: 'md-law-007', topic: 'md-law', kind: 'law', difficulty: 2, editions: ALL, provenance: prov,
    stem: 'A licensed master electrician must display the State license number (or the local registration number):',
    choices: [
      'Only on invoices',
      'On each vehicle used on the job for providing electrical services',
      'On every panel the company installs',
      'Only at the principal place of business',
    ],
    answer: 1,
    explain: 'The license or registration number goes on each vehicle used on the job. (Separate rules also cover display at the place of business and in advertising.)',
    ref: md('BOP § 6-301(c)', 'License number on vehicles'),
  },
  {
    id: 'md-law-008', topic: 'md-law', kind: 'law', difficulty: 1, editions: ALL, provenance: prov,
    stem: 'How many hours of continuing education are required to renew a Maryland master electrician license?',
    choices: ['5 hours', '8 hours', '10 hours', '16 hours'],
    answer: 2,
    explain: 'A master needs 10 hours of qualifying continuing education per license term, at least 5 of them in a classroom setting. A journeyperson needs 5.',
    whyNot: { 0: 'Five hours is the journeyperson requirement (and the classroom minimum for a master).' },
    ref: md('COMAR 09.09.02.01', 'Continuing education hours'),
  },
  {
    id: 'md-law-009', topic: 'md-law', kind: 'law', difficulty: 2, editions: ALL, provenance: prov,
    stem: 'Of the continuing education hours required to renew a master electrician license, at least how many must be obtained in a classroom setting?',
    choices: ['None', '2 hours', '5 hours', 'All 10 hours'],
    answer: 2,
    explain: 'At least 5 of the 10 required hours must be in a classroom setting.',
    ref: md('COMAR 09.09.02', 'Classroom hours'),
  },
  {
    id: 'md-law-010', topic: 'md-law', kind: 'law', difficulty: 2, editions: ALL, provenance: prov,
    stem: 'The State Board may impose a civil penalty of up to how much for each violation?',
    choices: ['$1,000', '$2,000', '$2,500', '$5,000'],
    answer: 3,
    explain: 'The Board may impose a civil penalty not exceeding $5,000 for each violation, instead of or in addition to a reprimand, suspension or revocation.',
    whyNot: { 0: '$1,000 is the criminal fine limit on a first conviction.' },
    ref: md('BOP § 6-316', 'Civil penalty'),
  },
  {
    id: 'md-law-011', topic: 'md-law', kind: 'law', difficulty: 2, editions: ALL, provenance: prov,
    stem: 'On a first criminal conviction for a violation of the electricians law (other than the insurance section), the fine may not exceed:',
    choices: ['$500', '$1,000', '$2,500', '$5,000'],
    answer: 1,
    explain: 'A first conviction carries a fine of up to $1,000; a second or later conviction up to $5,000.',
    ref: md('BOP § 6-608(b)', 'Criminal penalties'),
  },
  {
    id: 'md-law-012', topic: 'md-law', kind: 'law', difficulty: 2, editions: ALL, provenance: prov,
    stem: 'A licensee who applies for reinstatement more than 2 years after the State license expired must:',
    choices: [
      'Pay only the renewal fee',
      'Pay a late fee and complete 20 hours of continuing education',
      'Be reinstated automatically',
      'Meet the requirements for a new license, including passing the examination',
    ],
    answer: 3,
    explain: 'After more than 2 years, the Board requires the reinstatement fee and that the person meet the full licensing requirements, including the examination.',
    ref: md('BOP § 6-312', 'Reinstatement'),
  },
  {
    id: 'md-law-013', topic: 'md-law', kind: 'law', difficulty: 2, editions: ALL, provenance: prov,
    stem: 'Unless it is renewed for a 2-year term, a State electrician license expires:',
    choices: [
      'On December 31 of the year it was issued',
      'On the licensee’s birthday',
      'On the first June 30 in an odd-numbered year after it takes effect',
      'Three years after it was issued',
    ],
    answer: 2,
    explain: 'A State license expires on the first June 30 that comes after its effective date in an odd-numbered year, unless renewed for a 2-year term.',
    ref: md('BOP § 6-310(a)', 'License term'),
  },
  {
    id: 'md-law-014', topic: 'md-law', kind: 'law', difficulty: 2, editions: ALL, provenance: prov,
    stem: 'Since July 1, 2021, may a Maryland county issue its own master electrician license?',
    choices: [
      'Yes, any county may',
      'Only counties with more than 500,000 residents',
      'No; a local jurisdiction may only register State-licensed electricians',
      'Only if the State Board approves each license',
    ],
    answer: 2,
    explain: 'Beginning July 1, 2021, local jurisdictions may not issue apprentice, journeyperson or master licenses; they may register electricians who hold the State license.',
    ref: md('BOP § 6-103(c)', 'Local jurisdictions'),
  },
  {
    id: 'md-law-015', topic: 'md-law', kind: 'law', difficulty: 2, editions: ALL, provenance: prov,
    stem: 'After receiving a State license, within how many days must an electrician register locally where the local jurisdiction requires it?',
    choices: ['15 days', '30 days', '45 days', '60 days'],
    answer: 3,
    explain: 'Where local registration is required, the electrician registers within 60 days after the State license is issued.',
    ref: md('BOP § 6-601(b)', 'Local registration'),
  },
  {
    id: 'md-law-016', topic: 'md-law', kind: 'law', difficulty: 3, editions: ALL, provenance: prov,
    stem: 'The State Board of Electricians has 9 members. How many of them are consumer members?',
    choices: ['3', '4', '6', '9'],
    answer: 0,
    explain: 'Of the 9 members, 6 are licensed master electricians and 3 are consumer members. Members serve 3-year terms.',
    whyNot: { 2: 'Six is the number of master electrician members.', 3: 'Nine is the whole Board.' },
    ref: md('BOP § 6-202', 'Board composition'),
  },
]
