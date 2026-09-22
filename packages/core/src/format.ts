const wholeDollars = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 0,
})

const plainNumber = new Intl.NumberFormat('en-AU', { maximumFractionDigits: 0 })

const monthYear = new Intl.DateTimeFormat('en-AU', { month: 'short', year: 'numeric' })

/** Repayments are shown rounded up, the way a lender quotes them. */
export function formatRepayment(value: number): string {
  return wholeDollars.format(Math.ceil(value))
}

export function formatCurrency(value: number): string {
  return wholeDollars.format(Math.round(value))
}

export function formatNumber(value: number): string {
  return plainNumber.format(Math.round(value))
}

/** e.g. 0.256 -> "26%". */
export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

/** Strips anything that isn't a digit or decimal point, e.g. "$400,000" -> 400000. */
export function parseNumber(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, '')
  const parsed = Number.parseFloat(cleaned)
  return Number.isFinite(parsed) ? parsed : 0
}

/** Today's date as an "yyyy-MM-dd" string, suitable as a date input's default value. */
export function todayISODate(): string {
  return toISODate(new Date())
}

export function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Parses an "yyyy-MM-dd" string as a local date, avoiding the UTC shift `new Date(string)` applies. */
export function parseISODate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return new Date()
  return new Date(year, month - 1, day)
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

/** e.g. 2028. */
export function formatYear(date: Date): string {
  return String(date.getFullYear())
}

/** e.g. "Mar 2028". */
export function formatMonthYear(date: Date): string {
  return monthYear.format(date)
}

export function describeDuration(periods: number, periodsPerYear: number): string {
  const years = Math.floor(periods / periodsPerYear)
  const remainder = Math.round(periods % periodsPerYear)
  const months = Math.round((remainder / periodsPerYear) * 12)
  const parts: string[] = []
  if (years > 0) parts.push(`${years} year${years === 1 ? '' : 's'}`)
  if (months > 0) parts.push(`${months} month${months === 1 ? '' : 's'}`)
  return parts.length > 0 ? parts.join(' ') : 'less than a month'
}

/** Drops a trailing ".0"/".00" so compact labels read "1.5m" rather than "1.50m". */
function trimTrailingZeros(value: string): string {
  return value.includes('.') ? value.replace(/\.?0+$/, '') : value
}

/**
 * Axis-friendly currency, e.g. 1_500_000 -> "$1.5m", 320_000 -> "$320k", 0 -> "$0".
 *
 * Hand-rolled rather than using `Intl`'s compact notation, which isn't reliably
 * available on the JS engines the mobile app runs on.
 */
export function formatCompactCurrency(value: number): string {
  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(Math.round(value))
  if (abs < 1_000) return `${sign}$${abs}`
  if (abs < 1_000_000) {
    const thousands = abs / 1_000
    return `${sign}$${trimTrailingZeros(thousands.toFixed(thousands < 10 ? 1 : 0))}k`
  }
  const millions = abs / 1_000_000
  return `${sign}$${trimTrailingZeros(millions.toFixed(millions < 10 ? 2 : 1))}m`
}
