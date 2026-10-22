/**
 * About (/about): what the exam is (from docs/research/maryland-exam.md, checked 2026-10-16), how the
 * app works, the sources, the disclaimer (with the trademark notices) and the credits.
 */
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { EXAM, EXAM_TOPICS } from '@/content'
import { card, link, PageHeader } from '@/components/question/ui'
import oflUrl from '@/assets/fonts/inter/OFL.txt?url'

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className={`${card} space-y-3`}>
      <h2 id={id} className="text-xl font-bold text-ink">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={link}>
      {children}
    </a>
  )
}

export default function About() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title="About" lead="The exam, how this app works, where the facts come from. Facts checked October 16, 2026." />

      <Section id="about-exam" title="The exam">
        <ul className="list-disc space-y-1.5 pl-5 text-ink">
          <li>
            The Maryland Master Electrician exam is given for the State Board of Electricians by <strong>PSI Services LLC</strong>, on a
            computer at a test center. You register through PSI.
          </li>
          <li>
            <strong>
              {EXAM.questions} questions worth {EXAM.totalPoints} points, {EXAM.minutes} minutes, {EXAM.passPct}% to pass
            </strong>{' '}
            (the 70% is set by Maryland law). Electrical Theory is ten 2-point items; the other areas appear to be 1 point each (that
            is how the bulletin's numbers add up; it does not say so outright).
          </li>
          <li>
            Multiple choice, one question on the screen at a time, with the time left shown. You can go back and change answers.
            Every sample question in the bulletin has four options. A few unscored trial questions may be added; their time does
            not count.
          </li>
          <li>Pass or fail shows on screen. A failing report breaks the score out by area, and you get 30 minutes to look over the items you missed.</li>
          <li>The fee is $65. {EXAM.retake} (The Labor Department's FAQ mentions 60 days for later retests; check before you book.)</li>
          <li>
            Pass rates are low: in the Board's monthly figures from late 2024 to mid 2026, typically a quarter to a third of master
            candidates passed. Calculations alone is 30 of the 100 points, and Theory another 20.
          </li>
        </ul>

        <h3 className="font-bold text-ink">The blueprint</h3>
        <ul className="divide-y divide-slate-100">
          {EXAM_TOPICS.map((t) => (
            <li key={t.id} className="flex flex-wrap justify-between gap-x-3 py-1.5 text-ink">
              <span className="font-semibold">{t.title}</span>
              <span className="tabular">
                {t.questions} questions{t.points > 1 ? `, ${t.points} points each` : ''} = {t.questions * t.points} points
              </span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-slate">
          PSI's outline calls the Chapter 7 and 8 area “Special Communications”. Maryland licensing law is not on the outline; this
          app has it as a bonus area.
        </p>

        <h3 className="font-bold text-ink">What you may bring</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-ink">
          <li>
            <strong>The 2020 NEC® (NFPA 70®), and nothing else.</strong> You bring your own copy; no study guides.
          </li>
          <li>The book may be indexed, highlighted and underlined. It must not be written in, and it may not hold any added papers, loose or attached.</li>
          <li>
            Tabs: permanent plastic self-adhesive tabs are fine (the bulletin names Avery Swift Tabs and Redi-Tag). Post-it flags are
            not. If the proctor can pull a tab off without tearing the page, it comes off; tabs with paper inserts lose the inserts.
          </li>
          <li>{EXAM.calculator} The bulletin does not list a calculator of your own among the items you may bring.</li>
        </ul>

        <h3 className="font-bold text-ink">Which code edition</h3>
        <p className="text-ink">
          The exam is on the <strong>2020 NEC</strong>; in November 2025 PSI confirmed to the Board that it was still testing on
          2020. The Board looks set to skip the 2023 edition for testing and move to the <strong>2026 NEC</strong>: committee work
          and draft 2026 questions are under way, but <strong>no date has been announced</strong>. At the last change (2017 to
          2020) candidates had a window to choose either version. This app follows the 2020 NEC; switch the edition in{' '}
          <Link to="/settings" className={link}>
            Settings
          </Link>{' '}
          only if your exam uses another one.
        </p>
      </Section>

      <Section id="about-app" title="How this app works">
        <ul className="list-disc space-y-1.5 pl-5 text-ink">
          <li>
            <strong>Code questions:</strong> short four-option questions by exam area, with an optional “Where is it in the book?”
            hint (chapter, then article, then the exact section). Every answer comes with the reason and the reference.
          </li>
          <li>
            <strong>Review:</strong> missed questions come back the same day; right answers move out to 1, 3, 7 and then 16 days.
          </li>
          <li>
            <strong>Find it in the book:</strong> a speed drill for the open-book skill, “where would you look for…?”
          </li>
          <li>
            <strong>Math and load calcs:</strong> every calculation type is a fixed worksheet, one step per line, worked four ways
            from most help to none: Show me, Coach me, Paper, Test me. A wrong entry always gets a reason.
          </li>
          <li>
            <strong>Exam simulator:</strong> the blueprint's mix, the clock, flag and review, then a score by area and every item
            explained.
          </li>
          <li>
            <strong>Your progress stays on this device.</strong> Nothing is sent anywhere. Export and import a backup in Settings to
            move between a phone and a computer.
          </li>
        </ul>
      </Section>

      <Section id="about-sources" title="Sources">
        <ul className="list-disc space-y-1.5 pl-5 text-ink">
          <li>
            PSI, Maryland Master and Journeyperson Electrician Qualification Information Bulletin (updated 9/1/2024):{' '}
            <Ext href="https://test-takers.psiexams.com/mdelec">PSI's Maryland electrician page</Ext>
          </li>
          <li>
            Maryland Department of Labor, State Board of Electricians:{' '}
            <Ext href="https://labor.maryland.gov/license/elec/elecexam.shtml">exam page</Ext>,{' '}
            <Ext href="https://labor.maryland.gov/license/elec/eleclicfaqs.shtml">licensing FAQs</Ext>,{' '}
            <Ext href="https://labor.maryland.gov/license/min/elecmin.shtml">Board minutes</Ext>
          </li>
          <li>
            Maryland Code, Business Occupations and Professions Article, Title 6 (the Maryland Electricians Act), and COMAR 09.09
          </li>
          <li>The code itself: NFPA 70®, National Electrical Code®, 2020 edition. Look everything up in your own copy.</li>
        </ul>
      </Section>

      <Section id="about-disclaimer" title="Disclaimer">
        <ul className="list-disc space-y-1.5 pl-5 text-ink">
          <li>
            <strong>An independent study aid.</strong> Not affiliated with, sponsored or endorsed by the National Fire Protection
            Association (NFPA), PSI Services LLC or the Maryland State Board of Electricians.
          </li>
          <li>
            NFPA 70®, National Electrical Code® and NEC® are registered trademarks of the National Fire Protection Association,
            Quincy, MA. PSI® is a registered trademark of PSI Services LLC.
          </li>
          <li>
            The questions cite sections of the 2020 National Electrical Code® (NFPA 70®); you need your own copy of the code for the
            open-book exam. The questions are original practice items written for this app, not items from the PSI exam, and the
            app does not reproduce code text: explanations are in our own words, and you look the values up in your own book.
          </li>
          <li>
            <strong>Study aid only.</strong> It is not a substitute for the code or for professional judgment, and it is not for
            design or installation work: on the job, the code your jurisdiction adopted and your inspector have the last word.
          </li>
          <li>
            Exam rules change. <strong>Check the current PSI bulletin before you test.</strong>
          </li>
        </ul>
      </Section>

      <Section id="about-credits" title="Credits">
        <ul className="list-disc space-y-1.5 pl-5 text-ink">
          <li>Built with React, React Router and Zustand, under the MIT License.</li>
          <li>
            The Inter typeface by Rasmus Andersson and the Inter Project Authors, under the{' '}
            <a href={oflUrl} target="_blank" rel="noopener noreferrer" className={link}>
              SIL Open Font License 1.1
            </a>
            , bundled with the app.
          </li>
        </ul>
      </Section>
    </div>
  )
}
