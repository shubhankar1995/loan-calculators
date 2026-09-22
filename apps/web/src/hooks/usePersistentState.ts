import { useCallback, useRef, useState } from 'react'
import {
  serialiseSettings,
  type HomeLoanSettings,
  type HouseAndLandSettings,
} from '@repayly/core'

/**
 * React state backed by `localStorage`, so what someone typed last time is
 * already filled in when they come back.
 *
 * Writes happen as the value changes rather than in an effect, so merely
 * opening a second tab can't overwrite what the first one saved.
 *
 * Every storage call is wrapped, because `localStorage` throws rather than
 * returning null when the browser has storage switched off (Safari's private
 * browsing, blocked cookies). In that case this behaves like plain `useState`
 * for the life of the page.
 */
export function usePersistentState<T>(
  key: string,
  /** Turns stored text into a value. Must also handle `null`, which yields the default. */
  parse: (raw: string | null) => T,
  serialise: (value: T) => string,
): [T, (next: T | ((current: T) => T)) => void, () => void] {
  const [value, setValue] = useState<T>(() => parse(readItem(key)))

  // Mirrors the state so a functional update can be resolved and saved in one
  // go, without reading `value` from a stale closure.
  const latest = useRef(value)

  const store = useCallback(
    (next: T | ((current: T) => T)) => {
      const resolved =
        typeof next === 'function' ? (next as (current: T) => T)(latest.current) : next

      latest.current = resolved
      setValue(resolved)
      writeItem(key, serialise(resolved))
    },
    [key, serialise],
  )

  const clear = useCallback(() => {
    const defaults = parse(null)

    latest.current = defaults
    setValue(defaults)
    removeItem(key)
  }, [key, parse])

  return [value, store, clear]
}

interface PersistentSettings<T> {
  settings: T
  /** Merges a partial change, e.g. `update({ amount: 640000 })`. */
  update: (patch: Partial<T>) => void
  /** Forgets the saved details and goes back to the starting figures. */
  reset: () => void
}

/** `usePersistentState` shaped for a calculator's form: patch updates and a reset. */
export function usePersistentSettings<T extends HomeLoanSettings | HouseAndLandSettings>(
  key: string,
  parse: (raw: string | null) => T,
): PersistentSettings<T> {
  const [settings, setSettings, clear] = usePersistentState(key, parse, serialiseSettings)

  const update = useCallback(
    (patch: Partial<T>) => setSettings((current) => ({ ...current, ...patch })),
    [setSettings],
  )

  return { settings, update, reset: clear }
}

function readItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeItem(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Storage unavailable or full; the figures stay in memory for this visit.
  }
}

function removeItem(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Nothing to do — see writeItem.
  }
}
