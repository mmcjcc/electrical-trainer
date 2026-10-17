/**
 * /math/strategy: exam habits for the calculation questions, taught as a short scannable lesson:
 * three passes, the brain dump, crossing off sizes that do not exist, estimation anchors, pacing,
 * and the on-screen calculator.
 */
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { fmt } from '@/calc'
import { EXAM, isStandardOcpd, STRATEGY_FACTS, topic } from '@/content'
import { BookHint } from '@/components/ui/BookHint'
import { useStore } from '@/store'

function Block({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-6">
      <h2 id={id} className="text-xl font-bold text-ink">
        {title}
      </h2>
      <div className="mt-2 space-y-2 text-ink">{children}</div>
    </section>
  )
}

const EXAMPLE_CHOICES = [67.5, 70, 78, 80]

export default function Strategy() {
  const edition = useStore((s) => s.settings.edition)
  const calc = topic('calculations')
  const theory = topic('theory')
  const minutesEach = EXAM.minutes / EXAM.questions
  const secondsEach = Math.round(minutesEach * 60)
  const { threePhase, sqrt3, k, refs } = STRATEGY_FACTS

  return (
    <div className="mx-auto max-w-3xl">
      <nav aria-label="Breadcrumb" className="mb-1">
        <Link to="/math" className="inline-flex min-h-11 items-center gap-1 font-semibold text-slate hover:text-ink">
          <span aria-hidden="true">←</span> Math
        </Link>
      </nav>
      <h1 className="text-2xl font-bold text-ink">Exam strategy for the math</h1>
      <p className="mt-1 text-ink">
        {calc.questions} of the {EXAM.questions} questions are calculations. A 30-second lookup pays the same point as an 8-minute load
        calculation ({theory.title} questions count double). So the order you work in matters as much as the math.
      </p>

      <Block id="passes" title="1. Three passes through the test">
        <ol className="space-y-3">
          <li className="rounded-xl border border-slate-100 bg-white p-3">
            <p className="font-bold">Pass 1: lookups and one-step math</p>
            <p>Code questions you can find in the book, and one-line math like 40 A × 1.25. About a minute each.</p>
            <p className="text-slate">Many numbers, or more than one table? Do not start it. Guess, mark it, move on.</p>
          </li>
          <li className="rounded-xl border border-slate-100 bg-white p-3">
            <p className="font-bold">Pass 2: one formula, one or two tables</p>
            <p>Conduit fill, box fill, voltage drop, ampacity with correction, a motor branch circuit, transformer protection. Two to three minutes each.</p>
          </li>
          <li className="rounded-xl border border-slate-100 bg-white p-3">
            <p className="font-bold">Pass 3: the full load calculations</p>
            <p>Dwelling, multifamily, commercial. Five to eight minutes each. By now most of your points are banked, so the clock cannot rattle you.</p>
          </li>
        </ol>
        <p className="text-sm text-slate">
          If the test software lets you mark a question to come back to, use it (the tutorial at the start shows how). If not, jot the
          question number down. Always pick a best guess before you move on, so nothing is blank if time runs out.
        </p>
      </Block>

      <Block id="dump" title="2. The brain dump">
        <p>
          Write these down in the first minute, before the first question. The bulletin does not say whether you get scratch paper or a
          board, so ask at check-in.
        </p>
        <div className="tabular rounded-2xl bg-ink p-4 font-mono text-white">
          <p className="mb-2 font-sans text-sm font-semibold text-slate-100">Amps from VA, three-phase</p>
          <ul className="space-y-1">
            {threePhase.map((s) => (
              <li key={s.divisor}>
                {s.volts} V 3φ: ÷ {s.divisor}
                <span className="font-sans text-sm text-slate-100"> ({s.volts} × {fmt(sqrt3)})</span>
              </li>
            ))}
          </ul>
          <p className="mb-1 mt-4 font-sans text-sm font-semibold text-slate-100">Voltage drop</p>
          <p>VD = 2 × K × I × L ÷ CM</p>
          <p className="font-sans text-sm text-slate-100">Three-phase: {fmt(sqrt3)} in place of the 2. L is the one-way length in feet.</p>
          <p className="mt-1">
            K = {fmt(k.cu)} copper, {fmt(k.al)} aluminum
          </p>
          <p className="mb-1 mt-4 font-sans text-sm font-semibold text-slate-100">A dwelling, top to bottom</p>
          <p className="text-lg tracking-widest">L · F · D · R · H · A</p>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="font-bold">L</dt>
          <dd>Lighting, with the small-appliance and laundry circuits</dd>
          <dt className="font-bold">F</dt>
          <dd>Fixed (fastened-in-place) appliances</dd>
          <dt className="font-bold">D</dt>
          <dd>Dryer</dd>
          <dt className="font-bold">R</dt>
          <dd>Range</dd>
          <dt className="font-bold">H</dt>
          <dd>Heat or A/C, whichever is larger</dd>
          <dt className="font-bold">A</dt>
          <dd>Amps: the total VA ÷ the volts</dd>
        </dl>
        <p className="text-sm text-slate">
          CM is the conductor’s area in circular mils, from the conductor properties table. Drill the divisors in{' '}
          <Link to="/math/drills/divisor" className="font-semibold underline decoration-copper decoration-2 underline-offset-4">
            Pick the divisor
          </Link>
          .
        </p>
        <BookHint refTo={refs.conductorProperties} edition={edition} label="Where is the circular-mil table?" />
      </Block>

      <Block id="cross" title="3. Read the four choices first">
        <p>When the question asks for a breaker or fuse size, cross off any choice that is not a standard size before you calculate.</p>
        <ul className="tabular grid grid-cols-2 gap-2 sm:grid-cols-4">
          {EXAMPLE_CHOICES.map((a, i) => {
            const ok = isStandardOcpd(a)
            return (
              <li key={a} className={`rounded-xl border-2 p-2 text-center font-semibold ${ok ? 'border-ink' : 'border-slate-100 text-slate'}`}>
                <span className={ok ? '' : 'line-through decoration-2'}>
                  {'ABCD'[i]}) {fmt(a)} A
                </span>
                <span className="block text-xs font-normal">
                  <span aria-hidden="true">{ok ? '✓ ' : '✗ '}</span>
                  {ok ? 'standard' : 'not a standard size'}
                </span>
              </li>
            )
          })}
        </ul>
        <p>Now it is one of two before you touch the calculator.</p>
        <p>
          The wrong choices are built from the classic slips: the 125% left out, 1.732 used on single-phase. If two choices differ by
          exactly × 1.25 or × 1.732, that step is what the question is testing.
        </p>
        <BookHint refTo={refs.standardOcpd} edition={edition} label="Where is the list of standard sizes?" />
      </Block>

      <Block id="estimate" title="4. Estimate before you punch">
        <ul className="space-y-2">
          <li className="rounded-xl bg-slate-50 p-3">
            <span className="tabular font-bold">2,400 VA ≈ 10 A at 240 V</span> (so 24 kVA ≈ 100 A). A house that eyeballs to 36 kVA is about 150 A.
          </li>
          <li className="rounded-xl bg-slate-50 p-3">
            <span className="tabular font-bold">36 kVA ≈ 100 A at 208 V three-phase</span> (36,000 ÷ 360 = 100).
          </li>
          <li className="rounded-xl bg-slate-50 p-3">
            <span className="tabular font-bold">83 kVA ≈ 100 A at 480 V three-phase</span> (83,100 ÷ 831 = 100).
          </li>
        </ul>
        <p>
          Choices far apart: your estimate picks the answer. Two choices close together: the question is testing a small rule (the 5,000 VA
          dryer, the extra 25% of the largest motor), so work it out.
        </p>
      </Block>

      <Block id="pace" title="5. Pacing">
        <p className="tabular">
          {EXAM.minutes} minutes for {EXAM.questions} questions is about {fmt(minutesEach, 1)} minutes ({Math.floor(secondsEach / 60)} min{' '}
          {secondsEach % 60} s) a question.
        </p>
        <p>Calculations take longer than that, which is why the lookups go first: they buy the time the load calculations need.</p>
        <p>
          The bail-out rule: worked a calculation twice and your number is nowhere near a choice? Pick the closest, mark it, move on.
          Staring at it costs you three easy questions later.
        </p>
        <p className="text-sm text-slate">
          Practise against the clock: turn on the Test-me timer in Settings.
        </p>
      </Block>

      <Block id="calculator" title="6. The calculator">
        <p>{EXAM.calculator}</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Practise on a plain four-function calculator (your phone’s basic one), not a scientific one.</li>
          <li>Never use the % key. Type the multiplier: 125% is × 1.25.</li>
          <li>Press = after every step. Subtract, =, then multiply.</li>
          <li>Fractions: multiply everything on top, =, then divide by the bottom.</li>
        </ul>
      </Block>
    </div>
  )
}
