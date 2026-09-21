export type RepaymentType = 'principal-and-interest' | 'interest-only'
export type Frequency = 'weekly' | 'fortnightly' | 'monthly'

export const PERIODS_PER_YEAR: Record<Frequency, number> = {
  weekly: 52,
  fortnightly: 26,
  monthly: 12,
}

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  weekly: 'Weekly',
  fortnightly: 'Fortnightly',
  monthly: 'Monthly',
}

/** Adjective used in headings, e.g. "Your monthly repayments". */
export const FREQUENCY_ADVERBS: Record<Frequency, string> = {
  weekly: 'weekly',
  fortnightly: 'fortnightly',
  monthly: 'monthly',
}

export interface LoanInput {
  /** Amount borrowed. */
  amount: number
  /** Loan term in years. */
  termYears: number
  /** Nominal annual interest rate as a percentage, e.g. 6.29. */
  annualRatePercent: number
  repaymentType: RepaymentType
  frequency: Frequency
  /** Voluntary extra paid on top of every scheduled repayment. */
  extraRepayment: number
}

export interface YearlyBalance {
  /** Whole years since the loan started. */
  yearsElapsed: number
  /** Years left of the original term. */
  yearsRemaining: number
  /** Principal still owing at that point. */
  balance: number
}

export interface LoanResult {
  /** The scheduled repayment for one period, before any extra repayment. */
  scheduledRepayment: number
  /** Scheduled repayment plus the voluntary extra. */
  totalPeriodRepayment: number
  totalRepayments: number
  totalInterest: number
  /** Periods actually taken to clear the debt (<= term when paying extra). */
  periodsToRepay: number
  /** Whole periods saved by the extra repayments. */
  periodsSaved: number
  /** Interest saved by the extra repayments. */
  interestSaved: number
  /** Balance at the end of every period, index 0 being the opening balance. */
  balances: number[]
  yearlyBalances: YearlyBalance[]
}

/**
 * Standard amortisation formula. Falls back to straight-line when the rate is
 * zero, where the usual formula divides by zero.
 */
export function periodicRepayment(
  principal: number,
  periodRate: number,
  periods: number,
): number {
  if (principal <= 0 || periods <= 0) return 0
  if (periodRate === 0) return principal / periods
  const growth = Math.pow(1 + periodRate, periods)
  return (principal * periodRate * growth) / (growth - 1)
}

function sanitise(value: number, fallback = 0): number {
  return Number.isFinite(value) && value > 0 ? value : fallback
}

export function calculateLoan(input: LoanInput): LoanResult {
  const amount = sanitise(input.amount)
  const termYears = sanitise(input.termYears)
  const annualRate = Number.isFinite(input.annualRatePercent)
    ? Math.max(input.annualRatePercent, 0) / 100
    : 0
  const extra = sanitise(input.extraRepayment)

  const periodsPerYear = PERIODS_PER_YEAR[input.frequency]
  const totalPeriods = Math.round(termYears * periodsPerYear)
  const periodRate = annualRate / periodsPerYear
  const interestOnly = input.repaymentType === 'interest-only'

  const scheduledRepayment = interestOnly
    ? amount * periodRate
    : periodicRepayment(amount, periodRate, totalPeriods)

  const withExtra = amortise({
    amount,
    periodRate,
    totalPeriods,
    scheduledRepayment,
    extra,
    interestOnly,
  })

  // Baseline without extra repayments, so we can show what the extra buys.
  const baseline =
    extra > 0
      ? amortise({
          amount,
          periodRate,
          totalPeriods,
          scheduledRepayment,
          extra: 0,
          interestOnly,
        })
      : withExtra

  return {
    scheduledRepayment,
    totalPeriodRepayment: scheduledRepayment + extra,
    totalRepayments: withExtra.totalRepayments,
    totalInterest: withExtra.totalInterest,
    periodsToRepay: withExtra.periodsToRepay,
    periodsSaved: baseline.periodsToRepay - withExtra.periodsToRepay,
    interestSaved: baseline.totalInterest - withExtra.totalInterest,
    balances: withExtra.balances,
    yearlyBalances: toYearlyBalances(withExtra.balances, periodsPerYear, termYears),
  }
}

interface AmortiseArgs {
  amount: number
  periodRate: number
  totalPeriods: number
  scheduledRepayment: number
  extra: number
  interestOnly: boolean
}

function amortise({
  amount,
  periodRate,
  totalPeriods,
  scheduledRepayment,
  extra,
  interestOnly,
}: AmortiseArgs) {
  const balances: number[] = [amount]
  let balance = amount
  let totalInterest = 0
  let totalRepayments = 0
  let periodsToRepay = 0

  for (let period = 1; period <= totalPeriods && balance > 0; period += 1) {
    const interest = balance * periodRate
    // Interest-only repayments never touch the principal, so only the extra does.
    const target = interestOnly ? interest + extra : scheduledRepayment + extra
    const payment = Math.min(target, balance + interest)

    balance = balance + interest - payment
    if (balance < 1e-6) balance = 0

    totalInterest += interest
    totalRepayments += payment
    periodsToRepay = period
    balances.push(balance)
  }

  // Interest-only loans leave the principal outstanding as a final balloon.
  if (balance > 0) {
    totalRepayments += balance
    balances[balances.length - 1] = 0
    balance = 0
  }

  return { balances, totalInterest, totalRepayments, periodsToRepay }
}

function toYearlyBalances(
  balances: number[],
  periodsPerYear: number,
  termYears: number,
): YearlyBalance[] {
  const rows: YearlyBalance[] = []
  const lastYear = Math.ceil((balances.length - 1) / periodsPerYear)

  for (let year = 0; year <= lastYear; year += 1) {
    const index = Math.min(year * periodsPerYear, balances.length - 1)
    rows.push({
      yearsElapsed: year,
      yearsRemaining: Math.max(Math.round(termYears) - year, 0),
      balance: balances[index],
    })
    if (balances[index] === 0) break
  }

  return rows
}
