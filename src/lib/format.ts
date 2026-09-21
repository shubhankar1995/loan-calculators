const wholeDollars = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 0,
})

const plainNumber = new Intl.NumberFormat('en-AU', { maximumFractionDigits: 0 })

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

export function describeDuration(periods: number, periodsPerYear: number): string {
  const years = Math.floor(periods / periodsPerYear)
  const remainder = Math.round(periods % periodsPerYear)
  const months = Math.round((remainder / periodsPerYear) * 12)
  const parts: string[] = []
  if (years > 0) parts.push(`${years} year${years === 1 ? '' : 's'}`)
  if (months > 0) parts.push(`${months} month${months === 1 ? '' : 's'}`)
  return parts.length > 0 ? parts.join(' ') : 'less than a month'
}
