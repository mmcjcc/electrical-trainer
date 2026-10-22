import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './assets/fonts/inter/inter.css'
import './index.css'
import App from './App'

// A tab left open across a deploy (old hashed chunks are gone) or past the 7-day sign-in session (the
// chunk request gets the sign-in redirect) cannot load a lazy page. Reload once to pick up the new
// build or the sign-in page, instead of showing a blank screen.
window.addEventListener('vite:preloadError', () => {
  try {
    if (sessionStorage.getItem('et.reloaded') === '1') return
    sessionStorage.setItem('et.reloaded', '1')
  } catch {
    /* storage blocked: reload anyway */
  }
  window.location.reload()
})
window.addEventListener('load', () => {
  try {
    sessionStorage.removeItem('et.reloaded')
  } catch {
    /* ignore */
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
