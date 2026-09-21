import { describe, expect, it } from 'vitest'
import { PERIODS_PER_YEAR, calculateLoan, periodicRepayment } from './loan'

const base = {
  amount: 1128000,
  termYears: 30,
  annualRatePercent: 6.29,
  repaymentType: 'principal-and-interest',
  frequency: 'monthly',
  extraRepayment: 0,
  offsetBalance: 0,
  offsetMonthlyContribution: 0,
} as const

describe('periodicRepayment', () => {
  it('matches the standard amortisation formula', () => {
    expect(periodicRepayment(1128000, 0.0629 / 12, 360)).toBeCloseTo(693.28, 1)
  })

  it('splits the principal evenly when the rate is zero', () => {
    expect(periodicRepayment(12000, 0, 12)).toBe(1000)
  })

  it('returns zero for a zero-length or zero-value loan', () => {
    expect(periodicRepayment(0, 0.005, 360)).toBe(0)
    expect(periodicRepayment(1128000, 0.005, 0)).toBe(0)
  })
})

describe('calculateLoan - principal and interest', () => {
  const result = calculateLoan(base)

  it('quotes the scheduled repayment', () => {
    expect(Math.round(result.scheduledRepayment)).toBe(693)
  })

  it('totals repayments and interest over the full term', () => {
    expect(Math.round(result.totalRepayments)).toBe(890382)
    expect(Math.round(result.totalInterest)).toBe(490382)
    expect(Math.round(result.totalRepayments - result.totalInterest)).toBe(base.amount)
  })

  it('runs the full term and finishes at a zero balance', () => {
    expect(result.periodsToRepay).toBe(360)
    expect(result.balances[0]).toBe(base.amount)
    expect(result.balances.at(-1)).toBe(0)
  })

  it('produces one table row per year, counting the term down', () => {
    expect(result.yearlyBalances).toHaveLength(31)
    expect(result.yearlyBalances[0]).toMatchObject({ yearsRemaining: 30, balance: 1128000 })
    expect(result.yearlyBalances.at(-1)).toMatchObject({ yearsRemaining: 0, balance: 0 })
  })

  it('pays down the principal faster every year', () => {
    const balances = result.yearlyBalances.map((row) => row.balance)
    for (let i = 1; i < balances.length - 1; i += 1) {
      expect(balances[i]).toBeLessThan(balances[i - 1])
    }
  })

  it('produces one table row per month, counting the term down', () => {
    expect(result.monthlyBalances).toHaveLength(361)
    expect(result.monthlyBalances[0]).toMatchObject({ monthsRemaining: 360, balance: 1128000 })
    expect(result.monthlyBalances.at(-1)).toMatchObject({ monthsRemaining: 0, balance: 0 })
  })
})

describe('calculateLoan - interest only for an initial period', () => {
  const result = calculateLoan({ ...base, repaymentType: 'interest-only-5' })

  it('charges interest on the full principal during the interest-only period', () => {
    expect(result.scheduledRepayment).toBeCloseTo((1128000 * 0.0629) / 12, 6)
  })

  it("doesn't reduce the balance during the interest-only period", () => {
    const monthsInterestOnly = 5 * 12
    expect(result.balances[monthsInterestOnly]).toBe(base.amount)
    expect(result.balances[monthsInterestOnly - 1]).toBe(base.amount)
  })

  it('switches to principal and interest for the remaining term', () => {
    expect(result.postInterestOnlyRepayment).toBeCloseTo(
      periodicRepayment(1128000, 0.0629 / 12, 25 * 12),
      6,
    )
    expect(result.periodsToRepay).toBe(360)
    expect(result.balances.at(-1)).toBe(0)
  })

  it('charges more total interest than an equivalent principal and interest loan', () => {
    const principalAndInterest = calculateLoan(base)
    expect(result.totalInterest).toBeGreaterThan(principalAndInterest.totalInterest)
  })
})

describe('calculateLoan - interest only for the whole term', () => {
  const result = calculateLoan({ ...base, termYears: 5, repaymentType: 'interest-only-5' })

  it('leaves the principal owing as a balloon at the end of the term', () => {
    expect(result.postInterestOnlyRepayment).toBeUndefined()
    expect(Math.round(result.totalRepayments - result.totalInterest)).toBe(base.amount)
    expect(Math.round(result.totalInterest)).toBe(125800)
  })
})

describe('calculateLoan - additional repayments', () => {
  const result = calculateLoan({ ...base, extraRepayment: 300 })

  it('shortens the term and saves interest', () => {
    expect(result.periodsToRepay).toBeLessThan(360)
    expect(result.periodsSaved).toBe(360 - result.periodsToRepay)
    expect(result.interestSaved).toBeGreaterThan(0)
    expect(Math.round(result.totalInterest)).toBeLessThan(490382)
  })

  it('still repays exactly the principal borrowed', () => {
    expect(Math.round(result.totalRepayments - result.totalInterest)).toBe(base.amount)
  })

  it('stops the yearly table once the loan is cleared', () => {
    expect(result.yearlyBalances.at(-1)?.balance).toBe(0)
    expect(result.yearlyBalances.filter((row) => row.balance === 0)).toHaveLength(1)
  })

  it('stops the monthly table once the loan is cleared', () => {
    expect(result.monthlyBalances.at(-1)?.balance).toBe(0)
    expect(result.monthlyBalances.filter((row) => row.balance === 0)).toHaveLength(1)
  })

  it('pays down an interest only loan by the extra amount', () => {
    const io = calculateLoan({
      ...base,
      termYears: 5,
      repaymentType: 'interest-only-5',
      extraRepayment: 500,
    })
    const ioNoExtra = calculateLoan({ ...base, termYears: 5, repaymentType: 'interest-only-5' })
    expect(io.balances.at(-1)).toBe(0)
    expect(io.totalInterest).toBeLessThan(ioNoExtra.totalInterest)
  })
})

describe('calculateLoan - offset account', () => {
  const result = calculateLoan({ ...base, offsetBalance: 100000, offsetMonthlyContribution: 500 })

  it('reduces interest charged and shortens the term', () => {
    const noOffset = calculateLoan(base)
    expect(result.totalInterest).toBeLessThan(noOffset.totalInterest)
    expect(result.periodsToRepay).toBeLessThan(noOffset.periodsToRepay)
    expect(result.offsetInterestSaved).toBeGreaterThan(0)
    expect(result.offsetPeriodsSaved).toBeGreaterThan(0)
  })

  it('still repays exactly the principal borrowed', () => {
    expect(Math.round(result.totalRepayments - result.totalInterest)).toBe(base.amount)
  })

  it('does not charge negative interest once the offset exceeds the balance', () => {
    const fullyOffset = calculateLoan({ ...base, offsetBalance: base.amount * 2 })
    expect(fullyOffset.totalInterest).toBe(0)
    expect(fullyOffset.periodsToRepay).toBeLessThan(360)
  })
})

describe('calculateLoan - repayment frequency', () => {
  it('charges slightly less interest when repaying more often', () => {
    const monthly = calculateLoan(base)
    const weekly = calculateLoan({ ...base, frequency: 'weekly' })
    expect(weekly.periodsToRepay).toBe(30 * PERIODS_PER_YEAR.weekly)
    expect(weekly.totalInterest).toBeLessThan(monthly.totalInterest)
  })
})

describe('calculateLoan - invalid input', () => {
  it('degrades to zeroes rather than NaN', () => {
    const result = calculateLoan({ ...base, amount: Number.NaN, termYears: 0 })
    expect(result.scheduledRepayment).toBe(0)
    expect(result.totalRepayments).toBe(0)
    expect(result.totalInterest).toBe(0)
  })
})
