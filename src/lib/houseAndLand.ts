import {
  periodicRepayment,
  sanitise,
  toMonthlyBalances,
  toYearlyBalances,
  type MonthlyBalance,
  type YearlyBalance,
} from './loan'

export interface ConstructionStage {
  name: string
  /** Share of the construction amount drawn down once this stage completes. */
  percent: number
}

/** A typical progress-payment schedule for an Australian house and land package. */
export const DEFAULT_CONSTRUCTION_STAGES: ConstructionStage[] = [
  { name: 'Slab', percent: 20 },
  { name: 'Frame', percent: 25 },
  { name: 'Lock-up', percent: 25 },
  { name: 'Fixing', percent: 25 },
  { name: 'Completion', percent: 5 },
]

export interface HouseAndLandInput {
  /** Cost of the land, settled and drawn down in full at the start date. */
  landAmount: number
  /** Cost of the build, drawn down progressively as each stage completes. */
  constructionAmount: number
  /** Loan term in years, counted from the start date (land settlement). */
  termYears: number
  annualRatePercent: number
  /** Months the build takes, over which the construction stages draw down. */
  constructionMonths: number
  stages: ConstructionStage[]
}

export interface HouseAndLandResult {
  /** Interest-only repayment due right after land settles, before any construction drawdown. */
  landRepayment: number
  /** Interest-only repayment once every stage has drawn and the loan reaches its full amount. */
  finalConstructionRepayment: number
  /** Principal and interest repayment once construction completes and amortisation begins. */
  postConstructionRepayment: number
  /** Land amount plus construction amount. */
  totalAmount: number
  totalRepayments: number
  totalInterest: number
  /** Balance at the end of every month, index 0 being the opening balance. */
  balances: number[]
  yearlyBalances: YearlyBalance[]
  monthlyBalances: MonthlyBalance[]
}

/**
 * Models a house and land package loan: the land is drawn down in full up front, the
 * construction amount draws down progressively as each build stage completes (interest-only
 * on the drawn balance throughout), then the full amount amortises as principal and interest
 * for the rest of the term.
 */
export function calculateHouseAndLand(input: HouseAndLandInput): HouseAndLandResult {
  const landAmount = sanitise(input.landAmount)
  const constructionAmount = sanitise(input.constructionAmount)
  const termYears = sanitise(input.termYears)
  const annualRate = Number.isFinite(input.annualRatePercent)
    ? Math.max(input.annualRatePercent, 0) / 100
    : 0
  const monthlyRate = annualRate / 12
  const constructionMonths = Math.max(Math.round(sanitise(input.constructionMonths)), 0)
  const totalMonths = Math.round(termYears * 12)
  const totalAmount = landAmount + constructionAmount
  const stages = input.stages.length > 0 ? input.stages : DEFAULT_CONSTRUCTION_STAGES
  const totalPercent = stages.reduce((sum, stage) => sum + Math.max(stage.percent, 0), 0) || 100

  const drawnByMonth = (month: number): number => {
    if (constructionMonths <= 0) return constructionAmount
    let drawn = 0
    stages.forEach((stage, index) => {
      const stageMonth = Math.round(((index + 1) / stages.length) * constructionMonths)
      if (month >= stageMonth) drawn += (Math.max(stage.percent, 0) / totalPercent) * constructionAmount
    })
    return Math.min(drawn, constructionAmount)
  }

  const balances: number[] = [constructionMonths <= 0 ? totalAmount : landAmount]
  const payments: number[] = [0]
  let totalInterest = 0
  let totalRepayments = 0

  const constructionEndMonth = Math.min(constructionMonths, totalMonths)
  for (let month = 1; month <= constructionEndMonth; month += 1) {
    const priorBalance = balances[balances.length - 1]
    const interest = priorBalance * monthlyRate
    const balance = landAmount + drawnByMonth(month)
    totalInterest += interest
    totalRepayments += interest
    balances.push(balance)
    payments.push(interest)
  }

  const remainingMonths = Math.max(totalMonths - constructionEndMonth, 0)
  const postConstructionRepayment = periodicRepayment(totalAmount, monthlyRate, remainingMonths)

  let balance = balances[balances.length - 1]
  for (let month = 1; month <= remainingMonths && balance > 0; month += 1) {
    const interest = balance * monthlyRate
    const payment = Math.min(postConstructionRepayment, balance + interest)
    balance = balance + interest - payment
    if (balance < 1e-6) balance = 0
    totalInterest += interest
    totalRepayments += payment
    balances.push(balance)
    payments.push(payment)
  }

  const offsetBalances = balances.map(() => 0)

  return {
    landRepayment: landAmount * monthlyRate,
    finalConstructionRepayment: totalAmount * monthlyRate,
    postConstructionRepayment,
    totalAmount,
    totalRepayments,
    totalInterest,
    balances,
    yearlyBalances: toYearlyBalances(balances, payments, offsetBalances, 12, termYears),
    monthlyBalances: toMonthlyBalances(balances, payments, offsetBalances, 12, termYears),
  }
}
