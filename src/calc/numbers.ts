/**
 * Reading what he types and printing numbers the way an electrician writes them.
 * Pure; no DOM.
 */
import type { Unit } from '@/shared/types'

/** How each unit is printed after a number. Empty string: no unit text. */
export const UNIT_TEXT: Record<Unit, string> = {
  VA: 'VA', kVA: 'kVA', W: 'W', kW: 'kW', A: 'A', V: 'V', ohm: 'Ω', ft: 'ft', ft2: 'ft²', in2: 'in²',
  in3: 'in³', cmil: 'cmil', pct: '%', hp: 'hp', degC: '°C', degF: '°F', count: '', factor: '', awg: 'AWG',
  trade: '', none: '',
}

/** Spoken names for screen readers and for messages ("volt-amperes"). */
export const UNIT_NAME: Record<Unit, string> = {
  VA: 'volt-amperes', kVA: 'kilovolt-amperes', W: 'watts', kW: 'kilowatts', A: 'amperes', V: 'volts',
  ohm: 'ohms', ft: 'feet', ft2: 'square feet', in2: 'square inches', in3: 'cubic inches',
  cmil: 'circular mils', pct: 'percent', hp: 'horsepower', degC: 'degrees Celsius', degF: 'degrees Fahrenheit',
  count: '', factor: '', awg: 'AWG', trade: 'trade size', none: '',
}

/**
 * Prints a number with thousands separators and no float noise.
 * `maxDecimals` caps the decimals; trailing zeros are dropped (7,200 / 77.5 / 0.0133 / 1.25).
 */
export function fmt(v: number, maxDecimals = 4): string {
  if (!Number.isFinite(v)) return String(v)
  const rounded = Number(v.toFixed(maxDecimals))
  const neg = rounded < 0
  const abs = Math.abs(rounded)
  const [intPart = '0', decPart] = abs.toFixed(maxDecimals).split('.')
  const dec = (decPart ?? '').replace(/0+$/, '')
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${neg ? '−' : ''}${withCommas}${dec ? `.${dec}` : ''}`
}

/** "7,200 VA", "77.5 A", "16" (counts), "125%" (pct has no space). */
export function fmtUnit(v: number, unit: Unit, maxDecimals = 4): string {
  const n = fmt(v, maxDecimals)
  const u = UNIT_TEXT[unit]
  if (!u) return n
  if (unit === 'pct' || unit === 'degC' || unit === 'degF') return `${n}${u}`
  return `${n} ${u}`
}

/** A percent written as its multiplier: 125 -> "× 1.25", 35 -> "× 0.35". */
export function pctToMultiplier(pct: number): number {
  return Number((pct / 100).toFixed(6))
}

export type ParsedNumber = { ok: true; value: number } | { ok: false; reason: string }

/**
 * Reads a typed number. Accepts "7,200", "7200 VA", "77.5A", "$1,200", " 16 ", "1/2", "-3", "1.25x",
 * "35%" (read as 35; the line decides what a percent means). Rejects empty input and two numbers.
 */
const VULGAR: Record<string, string> = { '½': ' 1/2', '¼': ' 1/4', '¾': ' 3/4', '⅛': ' 1/8', '⅜': ' 3/8', '⅝': ' 5/8', '⅞': ' 7/8', '⅓': ' 1/3', '⅔': ' 2/3' }

/** Unit words and symbols he may type after the number (longest first). */
const UNIT_SUFFIX = /\s*(kcmil|cmil|awg|kva|kw|va|ft2|ft²|sq\.?\s*ft|in2|in²|in3|in³|cu\.?\s*in|ohms?|hp|amps?|volts?|watts?|a|v|w|ft|in|%|°c|°f|c|f|"|')\.?\s*$/i

export function parseNumberInput(raw: string): ParsedNumber {
  let text = raw.trim().replace(/[−–]/g, '-').replace(/^\+/, '')
  text = text.replace(/[½¼¾⅛⅜⅝⅞⅓⅔]/g, (c) => VULGAR[c] ?? c).trim()
  if (!text) return { ok: false, reason: 'Type a number first.' }
  // Unit words go, then one stray trailing period ("2.5 in." -> "2.5"); "5..." stays unreadable.
  const stripped = (text.replace(UNIT_SUFFIX, '').trim() || text).replace(/(\d)\.$/, '$1')
  // Simple fraction "1/2", "3/4" (trade sizes, fractions of an inch). A big division ("7200/240") is
  // a sum to work, not an answer.
  const frac = /^(-?\d+)\s*\/\s*(\d+)$/.exec(stripped)
  if (frac) {
    const n = Number(frac[1])
    const d = Number(frac[2])
    if (d === 0) return { ok: false, reason: 'A fraction cannot have 0 on the bottom.' }
    if (d > 64 || Math.abs(n) > 10 * d) return { ok: false, reason: 'Type the result, not the sum: work it on the calculator first.' }
    return { ok: true, value: n / d }
  }
  // Mixed number "1-1/4" or "1 1/4" (trade sizes).
  const mixed = /^(-?)(\d+)(?:\s+|-)(\d+)\s*\/\s*(\d+)$/.exec(stripped)
  if (mixed) {
    const d = Number(mixed[4])
    if (d === 0) return { ok: false, reason: 'A fraction cannot have 0 on the bottom.' }
    if (d > 64) return { ok: false, reason: 'That does not read as a number. Type digits like 7200 or 77.5.' }
    const v = Number(mixed[2]) + Number(mixed[3]) / d
    return { ok: true, value: mixed[1] === '-' ? -v : v }
  }
  // A leading $ and the number: digits, commas, one dot (a trailing dot is fine: "5.").
  const m = /^\$?\s*(-?[\d,]*\.?\d+)$/.exec(stripped)
  if (!m || !m[1]) {
    if (/\d.*\s+.*\d/.test(stripped)) return { ok: false, reason: 'Type just one number (the result of this line).' }
    return { ok: false, reason: 'That does not read as a number. Type digits like 7200 or 77.5.' }
  }
  const digits = m[1]
  // Commas must be thousands separators: "7,200" yes, "72,00" no ("1,5" was probably 1.5).
  if (digits.includes(',') && !/^-?\d{1,3}(,\d{3})*(\.\d+)?$/.test(digits)) {
    return { ok: false, reason: 'Use a period for decimals (1.5), and commas only every three digits (7,200).' }
  }
  const value = Number(digits.replace(/,/g, ''))
  if (!Number.isFinite(value)) return { ok: false, reason: 'That number is too large to read.' }
  return { ok: true, value }
}

/**
 * True when `got` is within the tolerance of `want`. Default: half a percent of `want`. The
 * tolerance is relative on purpose: a fixed floor would accept 0.0437 for 0.0366 (two different rows
 * of Chapter 9, Table 5).
 */
export function within(got: number, want: number, tol?: { abs?: number; rel?: number }): boolean {
  if (!Number.isFinite(got) || !Number.isFinite(want)) return false
  if (tol?.abs !== undefined) return Math.abs(got - want) <= tol.abs + 1e-9
  const rel = tol?.rel ?? 0.005
  return Math.abs(got - want) <= Math.abs(want) * rel + 1e-9
}
