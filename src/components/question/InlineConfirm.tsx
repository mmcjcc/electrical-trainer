/**
 * An "are you sure?" panel that opens in place (no modal to fight on a phone). Focus moves to its
 * title when it opens; Escape or the cancel button closes it.
 */
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { btnPrimary, btnSecondary } from './ui'

export interface InlineConfirmProps {
  title: string
  children?: ReactNode
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
  /** 'danger' paints the confirm button in the warning color. */
  tone?: 'normal' | 'danger'
}

export function InlineConfirm({ title, children, confirmLabel, cancelLabel, onConfirm, onCancel, tone = 'normal' }: InlineConfirmProps) {
  const id = useId()
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => heading.current?.focus(), [])
  return (
    <div
      role="alertdialog"
      aria-labelledby={`${id}-t`}
      aria-describedby={children ? `${id}-d` : undefined}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation()
          onCancel()
        }
      }}
      className="rounded-2xl border-2 border-ink bg-safety-100 p-4"
    >
      <h2 id={`${id}-t`} ref={heading} tabIndex={-1} className="text-lg font-bold text-ink outline-none">
        {title}
      </h2>
      {children && (
        <div id={`${id}-d`} className="mt-1 space-y-1 text-ink">
          {children}
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onConfirm}
          className={tone === 'danger' ? 'inline-flex min-h-11 items-center justify-center rounded-xl bg-bad px-4 font-semibold text-white hover:opacity-90' : btnPrimary}
        >
          {confirmLabel}
        </button>
        <button type="button" onClick={onCancel} className={btnSecondary}>
          {cancelLabel}
        </button>
      </div>
    </div>
  )
}
