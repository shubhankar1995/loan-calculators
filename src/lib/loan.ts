export type RepaymentType =
  | 'principal-and-interest'
  | 'interest-only-1'
  | 'interest-only-2'
  | 'interest-only-3'
  | 'interest-only-4'
  | 'interest-only-5'

export type Frequency = 'weekly' | 'fortnightly' | 'monthly'

export const REPAYMENT_TYPE_LABELS: Record<RepaymentType, string> = {
  'principal-and-interest': 'Principal and interest',
  'interest-only-1': 'Interest only 1 year',
  'interest-only-2': 'Interest only 2 years',
  'interest-only-3': 'Interest only 3 years',
  'interest-only-4': 'Interest only 4 years',
  'interest-only-5': 'Interest only 5 years',
}

/** Number of years an interest-only period lasts before switching to principal and interest, 0 for P&I. */
export function interestOnlyYears(repaymentType: RepaymentType): number {
  if (repaymentType === 'principal-and-interest') return 0
  return Number(repaymentType.split('-').pop())
}

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
  /** Repayment once an interest-only period ends and P&I resumes, undefined when the whole term is interest only. */
  postInterestOnlyRepayment?: number
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
  const ioPeriods = Math.min(
    Math.round(interestOnlyYears(input.repaymentType) * periodsPerYear),
    totalPeriods,
  )
  const amortisingPeriods = totalPeriods - ioPeriods

  const scheduledRepayment =
    ioPeriods > 0 ? amount * periodRate : periodicRepayment(amount, periodRate, amortisingPeriods)
  const postInterestOnlyRepayment =
    ioPeriods > 0 && amortisingPeriods > 0
      ? periodicRepayment(amount, periodRate, amortisingPeriods)
      : undefined

  const withExtra = amortise({
    amount,
    periodRate,
    ioPeriods,
    amortisingPeriods,
    scheduledRepayment,
    postInterestOnlyRepayment,
    extra,
  })

  // Baseline without extra repayments, so we can show what the extra buys.
  const baseline =
    extra > 0
      ? amortise({
          amount,
          periodRate,
          ioPeriods,
          amortisingPeriods,
          scheduledRepayment,
          postInterestOnlyRepayment,
          extra: 0,
        })
      : withExtra

  return {
    scheduledRepayment,
    totalPeriodRepayment: scheduledRepayment + extra,
    postInterestOnlyRepayment,
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
  ioPeriods: number
  amortisingPeriods: number
  scheduledRepayment: number
  postInterestOnlyRepayment?: number
  extra: number
}

function amortise({
  amount,
  periodRate,
  ioPeriods,
  amortisingPeriods,
  scheduledRepayment,
  postInterestOnlyRepayment,
  extra,
}: AmortiseArgs) {
  const balances: number[] = [amount]
  let balance = amount
  let totalInterest = 0
  let totalRepayments = 0
  let periodsToRepay = 0
  const totalPeriods = ioPeriods + amortisingPeriods

  for (let period = 1; period <= totalPeriods && balance > 0; period += 1) {
    const interest = balance * periodRate
    const inInterestOnlyPhase = period <= ioPeriods
    // Interest-only repayments never touch the principal, so only the extra does.
    const target = inInterestOnlyPhase
      ? interest + extra
      : (postInterestOnlyRepayment ?? scheduledRepayment) + extra
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
