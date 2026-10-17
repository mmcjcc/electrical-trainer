/** Calculator keystrokes as keycaps: ['2400', '×', '3', '='] → [2400] [×] [3] [=]. */
const SPOKEN: Record<string, string> = { '×': 'times', '÷': 'divided by', '+': 'plus', '−': 'minus', '-': 'minus', '=': 'equals' }

export function Keycaps({ keys, label = 'Calculator keys' }: { keys: string[]; label?: string }) {
  const spoken = keys.map((k) => SPOKEN[k] ?? k).join(' ')
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="mb-2 text-sm font-semibold text-slate">{label}</p>
      <p className="flex flex-wrap items-center gap-1.5" aria-label={`${label}: ${spoken}`} role="img">
        {keys.map((k, i) => (
          <kbd key={i} className="keycap tabular" aria-hidden="true">
            {k}
          </kbd>
        ))}
      </p>
    </div>
  )
}
