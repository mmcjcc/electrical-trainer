/** Toast host: short status messages from the store's `toast()` action. */
import { useEffect } from 'react'
import { useStore } from '@/store'

export function Toasts() {
  const toasts = useStore((s) => s.toasts)
  const dismiss = useStore((s) => s.dismissToast)
  useEffect(() => {
    if (toasts.length === 0) return
    const timers = toasts.map((t) => window.setTimeout(() => dismiss(t.id), 4000))
    return () => timers.forEach((id) => window.clearTimeout(id))
  }, [toasts, dismiss])
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto max-w-md rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${
            t.tone === 'ok' ? 'bg-ok text-white' : t.tone === 'bad' ? 'bg-bad text-white' : 'bg-ink text-white'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
