/**
 * Exam simulator start (/exam): full (90 items, 240 minutes) or short (30, 80), book hints off by
 * default with a switch, the real exam's rules, and any shortfall of the question bank shown plainly.
 * With an exam in progress it offers to resume or abandon it.
 */
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { randomSeed } from '@/calc'
import { buildExam, EXAM, topic, type ExamPaper } from '@/content'
import { InlineConfirm } from '@/components/question/InlineConfirm'
import { StudyAidNote } from '@/components/ui/StudyAidNote'
import { btnDanger, btnPrimary, btnSecondary, card, fmtDuration, PageHeader, RadioGroup, Switch } from '@/components/question/ui'
import { seenQuestionIds, useStore } from '@/store'

const DAY = 86_400_000
/** The real exam's pace: 240 minutes for 90 items. */
const MIN_PER_ITEM = EXAM.minutes / EXAM.questions

/** Items the blueprint wanted for this paper (what is there plus what the bank could not fill). */
export function wantedItems(paper: ExamPaper): number {
  return paper.items.length + paper.shortfall.reduce((a, s) => a + (s.wanted - s.got), 0)
}

/** A paper the bank could not fill gets the exam's pace for the items it has, not the full time. */
export function timedPaper(paper: ExamPaper): ExamPaper {
  const wanted = wantedItems(paper)
  if (paper.items.length >= wanted) return paper
  return { ...paper, minutes: Math.max(1, Math.round(paper.items.length * MIN_PER_ITEM)) }
}

export default function ExamStart() {
  const exam = useStore((s) => s.exam)
  const settings = useStore((s) => s.settings)
  const lastExam = useStore((s) => s.lastExam)
  const startExam = useStore((s) => s.startExam)
  const abandonExam = useStore((s) => s.abandonExam)
  const navigate = useNavigate()
  const [size, setSize] = useState<'full' | 'short'>('full')
  const [hintsOn, setHintsOn] = useState(settings.examHints)
  const [seed] = useState(() => randomSeed())
  const [abandoning, setAbandoning] = useState(false)

  const paper = useMemo(() => {
    const avoid = seenQuestionIds(useStore.getState().events, Date.now() - 14 * DAY)
    return timedPaper(buildExam(seed, settings.edition, { size, avoid }))
  }, [seed, size, settings.edition])
  const wanted = wantedItems(paper)

  function start() {
    startExam(paper, hintsOn)
    navigate('/exam/run')
  }

  const header = (
    <PageHeader
      title="Exam simulator"
      lead="The real exam's mix of areas, its clock and its rules. No feedback until you submit, just like the test."
      back={{ to: '/facts', label: 'Code questions' }}
    />
  )

  if (exam) {
    const answered = exam.answers.filter((a) => a !== null).length
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        {header}
        <section aria-labelledby="in-progress" className={`${card} space-y-3`}>
          <h2 id="in-progress" className="text-lg font-bold text-ink">
            You have an exam in progress
          </h2>
          <p className="text-ink">
            {answered} of {exam.answers.length} answered, {fmtDuration(exam.elapsedMs)} used of {exam.paper.minutes} minutes. The
            clock only runs while the exam screen is open.
          </p>
          {abandoning ? (
            <InlineConfirm
              title="Abandon this exam?"
              confirmLabel="Yes, throw it away"
              cancelLabel="Keep it"
              tone="danger"
              onConfirm={() => {
                abandonExam()
                setAbandoning(false)
              }}
              onCancel={() => setAbandoning(false)}
            >
              <p>Nothing from it is scored or saved. You can start a fresh one right after.</p>
            </InlineConfirm>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Link to="/exam/run" className={btnPrimary}>
                Resume the exam
              </Link>
              <button type="button" onClick={() => setAbandoning(true)} className={btnDanger}>
                Abandon it…
              </button>
            </div>
          )}
        </section>
        <Rules />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {header}

      <section aria-labelledby="setup" className={`${card} space-y-4`}>
        <h2 id="setup" className="sr-only">
          Set up the exam
        </h2>
        <RadioGroup
          legend="Length"
          value={size}
          onChange={setSize}
          stacked
          options={[
            { value: 'full', label: `Full exam: ${EXAM.questions} questions, ${EXAM.minutes} minutes`, note: 'The real thing: the whole blueprint and the full clock.' },
            { value: 'short', label: `Short exam: ${Math.round(EXAM.questions / 3)} questions, ${Math.round(EXAM.minutes / 3)} minutes`, note: 'A third of the exam, same mix and same pace.' },
          ]}
        />
        <div className="border-t border-slate-100">
          <Switch
            label="Book hints during the exam"
            description="Off is real exam conditions. On adds the “Where is it in the book?” ladder to code questions, for a practice run."
            checked={hintsOn}
            onChange={setHintsOn}
          />
        </div>

        {paper.shortfall.length > 0 && (
          <div className="rounded-xl border-2 border-copper bg-copper-100 p-3 text-ink">
            <p className="font-semibold">
              <span aria-hidden="true">! </span>
              This paper has {paper.items.length} of the {wanted} items the blueprint calls for.
            </p>
            <p className="mt-1 text-sm">
              The question bank is still being written, so these areas are short. Your score counts only the items that are
              there, and the clock is set to the exam's pace for them ({paper.minutes} minutes).
            </p>
            <ul className="mt-2 space-y-0.5 text-sm">
              {paper.shortfall.map((s) => (
                <li key={s.topic}>
                  {topic(s.topic).title}: {s.got} of {s.wanted}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={start} disabled={paper.items.length === 0} className={btnPrimary}>
            Start the exam ({paper.items.length} items, {paper.minutes} minutes)
          </button>
          {lastExam && (
            <Link to="/exam/results" className={btnSecondary}>
              Last exam's results
            </Link>
          )}
        </div>
        {paper.items.length === 0 && <p className="text-ink">There is nothing to put on a paper yet for the {settings.edition} edition.</p>}
      </section>

      <Rules />
      <StudyAidNote />
    </div>
  )
}

function Rules() {
  return (
    <section aria-labelledby="rules" className={`${card} space-y-3`}>
      <h2 id="rules" className="text-lg font-bold text-ink">
        The real exam's rules (PSI bulletin)
      </h2>
      <ul className="list-disc space-y-1.5 pl-5 text-ink">
        <li>
          {EXAM.questions} questions worth {EXAM.totalPoints} points in {EXAM.minutes} minutes; {EXAM.passPct}% passes. Electrical
          Theory items count 2 points each; Calculations is 30 of the 100 points.
        </li>
        <li>One question on the screen at a time, with the time left shown. You can go back and change answers while time remains.</li>
        <li>A few unscored trial questions may be added; their time does not count against you.</li>
        <li>Open book: the 2020 NEC® (NFPA 70®) only, no study guides. Highlighting, underlining and permanent tabs are fine; no writing in the book, no Post-it flags, no loose or attached papers.</li>
        <li>{EXAM.calculator}</li>
        <li>Pass or fail shows on screen. A failing report breaks the score out by area. {EXAM.retake}</li>
      </ul>
      <h3 className="font-bold text-ink">How this simulator works</h3>
      <ul className="list-disc space-y-1.5 pl-5 text-ink">
        <li>Calculation items are fresh problems from the math recipes, so no two exams are alike.</li>
        <li>Flag anything to come back to; the question grid shows what is answered and flagged.</li>
        <li>The clock runs only while the exam screen is open, so a phone call does not cost you. A reload or a closed tab keeps your place.</li>
        <li>After you submit: your score by area against the pass mark, then every item with the right answer, the explanation and where it is in the book.</li>
      </ul>
    </section>
  )
}
