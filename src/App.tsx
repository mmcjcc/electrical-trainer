/**
 * Routes and the frame (header on desktop, bottom tab bar on phones). ARCHITECT owns the route table;
 * the UI builders own the pages. HashRouter: the app is a static site behind the platform's sign-in.
 */
import { lazy, Suspense, type ReactNode } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toasts } from '@/components/ui/Toasts'
import { Frame } from '@/components/shell/Frame'

const Home = lazy(() => import('./pages/Home'))
const FactsHome = lazy(() => import('./pages/facts/FactsHome'))
const Practice = lazy(() => import('./pages/facts/Practice'))
const Review = lazy(() => import('./pages/facts/Review'))
const FindIt = lazy(() => import('./pages/facts/FindIt'))
const ExamStart = lazy(() => import('./pages/exam/ExamStart'))
const ExamRun = lazy(() => import('./pages/exam/ExamRun'))
const ExamResults = lazy(() => import('./pages/exam/ExamResults'))
const MathHome = lazy(() => import('./pages/math/MathHome'))
const RecipePage = lazy(() => import('./pages/math/RecipePage'))
const Worksheet = lazy(() => import('./pages/math/Worksheet'))
const Drills = lazy(() => import('./pages/math/Drills'))
const Strategy = lazy(() => import('./pages/math/Strategy'))
const Progress = lazy(() => import('./pages/Progress'))
const Settings = lazy(() => import('./pages/Settings'))
const About = lazy(() => import('./pages/About'))

function Loading() {
  return (
    <p role="status" className="py-10 text-center text-slate">
      Loading…
    </p>
  )
}

export function AppRoutes(): ReactNode {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/facts" element={<FactsHome />} />
        <Route path="/facts/practice/:topicId" element={<Practice />} />
        <Route path="/facts/review" element={<Review />} />
        <Route path="/facts/find" element={<FindIt />} />
        <Route path="/exam" element={<ExamStart />} />
        <Route path="/exam/run" element={<ExamRun />} />
        <Route path="/exam/results" element={<ExamResults />} />
        <Route path="/math" element={<MathHome />} />
        <Route path="/math/r/:recipeId" element={<RecipePage />} />
        <Route path="/math/r/:recipeId/:mode/:seed" element={<Worksheet />} />
        <Route path="/math/drills" element={<Drills />} />
        <Route path="/math/drills/:drillId" element={<Drills />} />
        <Route path="/math/strategy" element={<Strategy />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

/** Everything inside the router. Tests mount this in a MemoryRouter. */
export function AppShell() {
  return (
    <>
      <Frame>
        <AppRoutes />
      </Frame>
      <Toasts />
    </>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  )
}
