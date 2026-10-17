/**
 * The frame around every page: a slim header (app name, the edition in use, desktop nav) and, on
 * phones, a bottom tab bar with big targets. Five destinations: Home, Code, Math, Progress, Settings.
 * The current tab is marked by a bar and bold type as well as color.
 */
import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useStore } from '@/store'

const TABS: { to: string; label: string; icon: string }[] = [
  { to: '/', label: 'Home', icon: '⌂' },
  { to: '/facts', label: 'Code', icon: '📖' },
  { to: '/math', label: 'Math', icon: '🧮' },
  { to: '/progress', label: 'Progress', icon: '📈' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
]

function active(pathname: string, to: string): boolean {
  if (to === '/') return pathname === '/'
  return pathname === to || pathname.startsWith(`${to}/`) || (to === '/facts' && pathname.startsWith('/exam'))
}

export function Frame({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const edition = useStore((s) => s.settings.edition)
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <header className="border-b border-slate-100 bg-ink text-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-2">
          <Link to="/" className="flex min-h-11 min-w-0 items-center gap-2 font-bold tracking-tight">
            <span aria-hidden="true" className="text-safety">
              ⚡
            </span>
            <span className="truncate">Master Electrician Prep</span>
            <span className="shrink-0 rounded bg-slate-600 px-1.5 py-0.5 text-xs font-semibold">
              MD · NEC {edition}
            </span>
          </Link>
          <nav aria-label="Main" className="hidden md:block">
            <ul className="flex gap-1">
              {TABS.map((t) => {
                const on = active(pathname, t.to)
                return (
                  <li key={t.to}>
                    <Link
                      to={t.to}
                      aria-current={on ? 'page' : undefined}
                      className={`flex min-h-11 items-center rounded-lg border-b-4 px-3 text-sm font-semibold ${
                        on ? 'border-safety bg-slate-600 text-white' : 'border-transparent text-slate-100 hover:bg-slate'
                      }`}
                    >
                      {t.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-5 outline-none md:pb-10">
        {children}
      </main>
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-100 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        <ul className="grid grid-cols-5">
          {TABS.map((t) => {
            const on = active(pathname, t.to)
            return (
              <li key={t.to}>
                <Link
                  to={t.to}
                  aria-current={on ? 'page' : undefined}
                  className={`flex min-h-14 flex-col items-center justify-center border-t-4 text-xs ${
                    on ? 'border-copper font-bold text-copper-700' : 'border-transparent font-semibold text-slate'
                  }`}
                >
                  <span aria-hidden="true" className="text-lg leading-none">
                    {t.icon}
                  </span>
                  {t.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}
