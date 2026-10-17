/**
 * Keyboard for four-option questions: 1-4 or A-D picks, Enter submits (or moves on), and any extra
 * keys the page wants (← → in the exam). Ignored while typing in a text field or with a modifier.
 */
import { useEffect, useRef } from 'react'

export interface ChoiceKeys {
  enabled: boolean
  count: number
  onPick?: (index: number) => void
  onEnter?: () => void
  /** Extra single keys ('ArrowLeft', 'f'), matched case-insensitively. */
  extra?: Record<string, () => void>
}

function typingIn(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true
  if (target instanceof HTMLInputElement) return !['radio', 'checkbox', 'button', 'submit'].includes(target.type)
  return false
}

/** Keys a native control already handles with Enter (activating it a second time would double up). */
function activatesOnEnter(target: EventTarget | null): boolean {
  if (target instanceof HTMLButtonElement || target instanceof HTMLAnchorElement) return true
  return target instanceof HTMLElement && target.tagName === 'SUMMARY'
}

export function useChoiceKeys(keys: ChoiceKeys): void {
  const ref = useRef(keys)
  ref.current = keys
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const k = ref.current
      if (!k.enabled || e.altKey || e.ctrlKey || e.metaKey || typingIn(e.target)) return
      const key = e.key
      if (key === 'Enter') {
        if (!k.onEnter || activatesOnEnter(e.target)) return
        e.preventDefault()
        k.onEnter()
        return
      }
      // Arrow keys on a focused radio move the selection natively; do not also run a page action.
      const onRadio = e.target instanceof HTMLInputElement && e.target.type === 'radio'
      const extra = !(onRadio && key.startsWith('Arrow')) && k.extra && Object.entries(k.extra).find(([name]) => name.toLowerCase() === key.toLowerCase())
      if (extra) {
        e.preventDefault()
        extra[1]()
        return
      }
      if (!k.onPick) return
      let index = -1
      if (/^[1-9]$/.test(key)) index = Number(key) - 1
      else if (/^[a-z]$/i.test(key)) index = key.toLowerCase().charCodeAt(0) - 97
      if (index >= 0 && index < k.count) {
        e.preventDefault()
        k.onPick(index)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
