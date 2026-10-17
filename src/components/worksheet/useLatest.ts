import { useLayoutEffect, useRef } from 'react'

/** A ref that always holds the latest value, so effects can call a callback prop without re-running. */
export function useLatest<T>(value: T) {
  const ref = useRef(value)
  useLayoutEffect(() => {
    ref.current = value
  })
  return ref
}
