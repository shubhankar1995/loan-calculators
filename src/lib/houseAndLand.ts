import {
  periodicRepayment,
  projectedHomeValue,
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
  /** Cash paid upfront against the land price, reducing the amount borrowed for the land. */
  landDepositAmount: number
  /** Cash paid upfront against the construction price, reducing the amount drawn down for the build. */
  constructionDepositAmount: number
  /** Loan term in years, counted from the start date (land settlement). */
  termYears: number
  annualRatePercent: number
  /** Months the build takes, over which the construction stages draw down. */
  constructionMonths: number
  stages: ConstructionStage[]
  /** Estimated value of the completed home, used to project equity. Zero hides equity. */
  homeValue: number
  /** Assumed annual growth in home value, compounded, applied once construction completes. */
  homeValueGrowthPercent: number
  /** Starting balance of a linked offset account, reduces the interest-bearing balance. */
  offsetBalance: number
  /** Amount added to the offset account every month. */
  offsetMonthlyContribution: number
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
  /** Months saved thanks to the offset account, holding the loan and build inputs constant. */
  offsetMonthsSaved: number
  /** Interest saved thanks to the offset account. */
  offsetInterestSaved: number
  /** Balance at the end of every month, index 0 being the opening balance. */
  balances: number[]
  /**
   * Estimated property value at the end of every month, aligned with `balances`. Ramps from
   * the land price up to the completed home value as construction progresses (rather than
   * jumping to the completed value on day one), then compounds at the growth rate once built.
   */
  propertyValues: number[]
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
  const landPrice = sanitise(input.landAmount)
  const constructionPrice = sanitise(input.constructionAmount)
  const landDeposit = Math.min(Math.max(input.landDepositAmount, 0) || 0, landPrice)
  const constructionDeposit = Math.min(
    Math.max(input.constructionDepositAmount, 0) || 0,
    constructionPrice,
  )
  const landAmount = landPrice - landDeposit
  const constructionAmount = constructionPrice - constructionDeposit
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

  /** Fraction of the build physically complete by the end of `month`, independent of dollar amounts. */
  const stageProgressByMonth = (month: number): number => {
    if (constructionMonths <= 0) return 1
    let progress = 0
    stages.forEach((stage, index) => {
      const stageMonth = Math.round(((index + 1) / stages.length) * constructionMonths)
      if (month >= stageMonth) progress += Math.max(stage.percent, 0) / totalPercent
    })
    return Math.min(progress, 1)
  }

  const drawnByMonth = (month: number): number => stageProgressByMonth(month) * constructionAmount

  const constructionEndMonth = Math.min(constructionMonths, totalMonths)
  const remainingMonths = Math.max(totalMonths - constructionEndMonth, 0)
  const postConstructionRepayment = periodicRepayment(totalAmount, monthlyRate, remainingMonths)

  /**
   * Runs the full construction-then-amortisation schedule for a given offset account, so the
   * effect of the offset can be measured against a baseline with no offset.
   */
  const simulate = (startingOffset: number, contributionPerMonth: number) => {
    const balances: number[] = [constructionMonths <= 0 ? totalAmount : landAmount]
    const payments: number[] = [0]
    const offsetBalances: number[] = [startingOffset]
    let offset = startingOffset
    let totalInterest = 0
    let totalRepayments = 0
    let monthsToRepay = 0

    for (let month = 1; month <= constructionEndMonth; month += 1) {
      const priorBalance = balances[balances.length - 1]
      const interestBearingBalance = Math.max(priorBalance - offset, 0)
      const interest = interestBearingBalance * monthlyRate
      const balance = landAmount + drawnByMonth(month)
      offset += contributionPerMonth
      totalInterest += interest
      totalRepayments += interest
      monthsToRepay = month
      balances.push(balance)
      payments.push(interest)
      offsetBalances.push(offset)
    }

    let balance = balances[balances.length - 1]
    for (let month = 1; month <= remainingMonths && balance > 0; month += 1) {
      const interestBearingBalance = Math.max(balance - offset, 0)
      const interest = interestBearingBalance * monthlyRate
      const payment = Math.min(postConstructionRepayment, balance + interest)
      balance = balance + interest - payment
      if (balance < 1e-6) balance = 0
      offset += contributionPerMonth
      totalInterest += interest
      totalRepayments += payment
      monthsToRepay = constructionEndMonth + month
      balances.push(balance)
      payments.push(payment)
      offsetBalances.push(offset)
    }

    return { balances, payments, offsetBalances, totalInterest, totalRepayments, monthsToRepay }
  }

  const offsetBalance = sanitise(input.offsetBalance)
  const offsetMonthlyContribution = sanitise(input.offsetMonthlyContribution)
  const withOffset = simulate(offsetBalance, offsetMonthlyContribution)
  const noOffset =
    offsetBalance > 0 || offsetMonthlyContribution > 0 ? simulate(0, 0) : withOffset

  const homeValue = Number.isFinite(input.homeValue) && input.homeValue > 0 ? input.homeValue : 0
  const propertyValueAtMonth = (month: number): number => {
    if (homeValue <= 0) return 0
    if (month >= constructionEndMonth) {
      const yearsPastCompletion = (month - constructionEndMonth) / 12
      return projectedHomeValue(homeValue, input.homeValueGrowthPercent, yearsPastCompletion)
    }
    return landPrice + stageProgressByMonth(month) * (homeValue - landPrice)
  }
  const propertyValues = withOffset.balances.map((_, month) => propertyValueAtMonth(month))

  return {
    landRepayment: landAmount * monthlyRate,
    finalConstructionRepayment: totalAmount * monthlyRate,
    postConstructionRepayment,
    totalAmount,
    totalRepayments: withOffset.totalRepayments,
    totalInterest: withOffset.totalInterest,
    offsetMonthsSaved: noOffset.monthsToRepay - withOffset.monthsToRepay,
    offsetInterestSaved: noOffset.totalInterest - withOffset.totalInterest,
    balances: withOffset.balances,
    propertyValues,
    yearlyBalances: toYearlyBalances(
      withOffset.balances,
      withOffset.payments,
      withOffset.offsetBalances,
      12,
      termYears,
    ),
    monthlyBalances: toMonthlyBalances(
      withOffset.balances,
      withOffset.payments,
      withOffset.offsetBalances,
      12,
      termYears,
    ),
  }
}
