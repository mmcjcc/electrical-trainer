/**
 * The study-aid and trademark notice, at the foot of the exam simulator screens. The full wording, with the
 * reasons, is the Disclaimer on About; this is the short form. No "official", "real exam questions",
 * "guaranteed" or "complete tables" anywhere in the app.
 */
import { Link } from 'react-router-dom'

export function StudyAidNote() {
  return (
    <footer className="border-t border-slate-100 pt-3 text-sm leading-relaxed text-slate">
      <p>
        <strong className="font-semibold">Study aid only.</strong> Practice items written for this app, not items from the PSI exam, and
        not for design or installation work: the code your jurisdiction adopted and your inspector have the last word. Questions cite
        the 2020 National Electrical Code® (NFPA 70®); bring your own copy to the exam.
      </p>
      <p className="mt-1">
        Not affiliated with, sponsored or endorsed by the NFPA, PSI Services LLC or the Maryland State Board of Electricians. NFPA 70®,
        National Electrical Code® and NEC® are registered trademarks of the National Fire Protection Association; PSI® is a registered
        trademark of PSI Services LLC.{' '}
        <Link to="/about" className="font-semibold underline underline-offset-2 hover:text-ink">
          The full disclaimer is on About.
        </Link>
      </p>
    </footer>
  )
}
