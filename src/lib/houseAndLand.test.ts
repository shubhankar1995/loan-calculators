import { describe, expect, it } from 'vitest'
import { calculateHouseAndLand, DEFAULT_CONSTRUCTION_STAGES } from './houseAndLand'
import { periodicRepayment } from './loan'

const base = {
  landAmount: 400000,
  constructionAmount: 350000,
  landDepositAmount: 0,
  constructionDepositAmount: 0,
  termYears: 30,
  annualRatePercent: 6,
  constructionMonths: 10,
  stages: DEFAULT_CONSTRUCTION_STAGES,
  homeValue: 0,
  homeValueGrowthPercent: 0,
  startingAccountBalance: 0,
  monthlyIncome: 0,
  monthlyExpenses: 0,
  constructionRent: 0,
} as const

describe('calculateHouseAndLand - construction phase', () => {
  const result = calculateHouseAndLand(base)

  it('charges interest only on the land amount from month one', () => {
    expect(result.balances[0]).toBe(base.landAmount)
    expect(result.landRepayment).toBeCloseTo((base.landAmount * 0.06) / 12, 6)
  })

  it('draws down the construction amount progressively, never exceeding it', () => {
    for (let month = 1; month <= base.constructionMonths; month += 1) {
      const drawn = result.balances[month] - base.landAmount
      expect(drawn).toBeGreaterThanOrEqual(0)
      expect(drawn).toBeLessThanOrEqual(base.constructionAmount + 1e-6)
    }
  })

  it('reaches the full loan amount once every stage has drawn down', () => {
    expect(result.balances[base.constructionMonths]).toBeCloseTo(
      base.landAmount + base.constructionAmount,
      6,
    )
    expect(result.finalConstructionRepayment).toBeCloseTo(
      ((base.landAmount + base.constructionAmount) * 0.06) / 12,
      6,
    )
  })

  it("doesn't repay any principal during construction", () => {
    const drawnBefore = result.balances[3] - base.landAmount
    const drawnAfter = result.balances[4] - base.landAmount
    expect(drawnAfter).toBeGreaterThanOrEqual(drawnBefore)
  })
})

describe('calculateHouseAndLand - post-construction amortisation', () => {
  const result = calculateHouseAndLand(base)
  const totalAmount = base.landAmount + base.constructionAmount

  it('amortises the full amount over the remaining term', () => {
    const remainingMonths = base.termYears * 12 - base.constructionMonths
    expect(result.postConstructionRepayment).toBeCloseTo(
      periodicRepayment(totalAmount, 0.06 / 12, remainingMonths),
      6,
    )
  })

  it('runs the full term and finishes at a zero balance', () => {
    expect(result.balances.at(-1)).toBe(0)
    expect(result.monthlyBalances.at(-1)?.balance).toBe(0)
  })

  it('still repays exactly the amount borrowed', () => {
    expect(Math.round(result.totalRepayments - result.totalInterest)).toBe(Math.round(totalAmount))
  })

  it('produces one table row per year, counting the term down', () => {
    expect(result.yearlyBalances[0]).toMatchObject({ yearsRemaining: 30, balance: base.landAmount })
    expect(result.yearlyBalances.at(-1)).toMatchObject({ yearsRemaining: 0, balance: 0 })
  })
})

describe('calculateHouseAndLand - no construction period', () => {
  it('treats the whole amount as drawn down immediately', () => {
    const result = calculateHouseAndLand({ ...base, constructionMonths: 0 })
    expect(result.balances[0]).toBe(base.landAmount + base.constructionAmount)
  })
})

describe('calculateHouseAndLand - custom stage split', () => {
  it('normalises stage percentages that do not add up to 100', () => {
    const result = calculateHouseAndLand({
      ...base,
      stages: [
        { name: 'Slab', percent: 50 },
        { name: 'Completion', percent: 50 },
      ],
    })
    expect(result.balances[base.constructionMonths]).toBeCloseTo(
      base.landAmount + base.constructionAmount,
      6,
    )
  })
})

describe('calculateHouseAndLand - land deposit', () => {
  it('reduces the land drawdown by the deposit', () => {
    const result = calculateHouseAndLand({ ...base, landDepositAmount: 100000 })
    expect(result.balances[0]).toBe(base.landAmount - 100000)
    expect(result.balances[base.constructionMonths]).toBeCloseTo(
      base.landAmount + base.constructionAmount - 100000,
      6,
    )
  })

  it('never borrows less than zero for the land, even when the deposit exceeds its price', () => {
    const result = calculateHouseAndLand({ ...base, landDepositAmount: 10000000 })
    expect(result.balances[0]).toBe(0)
    expect(result.balances[base.constructionMonths]).toBeCloseTo(base.constructionAmount, 6)
  })
})

describe('calculateHouseAndLand - construction deposit', () => {
  it('reduces the construction drawdown by the deposit, leaving the land untouched', () => {
    const result = calculateHouseAndLand({ ...base, constructionDepositAmount: 50000 })
    expect(result.balances[0]).toBe(base.landAmount)
    expect(result.balances[base.constructionMonths]).toBeCloseTo(
      base.landAmount + base.constructionAmount - 50000,
      6,
    )
  })

  it('never borrows less than zero for construction, even when the deposit exceeds its price', () => {
    const result = calculateHouseAndLand({ ...base, constructionDepositAmount: 10000000 })
    expect(result.balances[base.constructionMonths]).toBeCloseTo(base.landAmount, 6)
  })
})

describe('calculateHouseAndLand - both deposits', () => {
  it('reduces the total amount borrowed by the sum of both deposits', () => {
    const result = calculateHouseAndLand({
      ...base,
      landDepositAmount: 100000,
      constructionDepositAmount: 50000,
    })
    expect(result.totalAmount).toBeCloseTo(
      base.landAmount + base.constructionAmount - 150000,
      6,
    )
    expect(result.totalInterest).toBeGreaterThan(0)
  })

  it('never borrows less than zero, even when deposits cover the whole price', () => {
    const result = calculateHouseAndLand({
      ...base,
      landDepositAmount: 10000000,
      constructionDepositAmount: 10000000,
    })
    expect(result.totalAmount).toBe(0)
    expect(result.totalInterest).toBe(0)
  })
})

describe('calculateHouseAndLand - property value ramp', () => {
  const homeValue = 900000

  it('hides equity when no home value is given', () => {
    const result = calculateHouseAndLand(base)
    expect(result.propertyValues.every((value) => value === 0)).toBe(true)
  })

  it('starts at the land price, not the completed home value, before any building happens', () => {
    const result = calculateHouseAndLand({ ...base, homeValue })
    expect(result.propertyValues[0]).toBeCloseTo(base.landAmount, 6)
  })

  it('ramps up to the completed home value as each stage completes', () => {
    const result = calculateHouseAndLand({ ...base, homeValue })
    for (let month = 1; month < base.constructionMonths; month += 1) {
      expect(result.propertyValues[month]).toBeGreaterThanOrEqual(result.propertyValues[month - 1])
      expect(result.propertyValues[month]).toBeLessThanOrEqual(homeValue)
    }
    expect(result.propertyValues[base.constructionMonths]).toBeCloseTo(homeValue, 6)
  })

  it('compounds growth from the completed value once construction finishes', () => {
    const result = calculateHouseAndLand({ ...base, homeValue, homeValueGrowthPercent: 5 })
    const oneYearAfterCompletion = base.constructionMonths + 12
    expect(result.propertyValues[oneYearAfterCompletion]).toBeCloseTo(homeValue * 1.05, 6)
  })

  it('never gives a false equity spike at the start (land value stays below the loan-free equity)', () => {
    const result = calculateHouseAndLand({ ...base, homeValue })
    const equityAtStart = result.propertyValues[0] - result.balances[0]
    expect(equityAtStart).toBeCloseTo(0, 6)
  })
})

describe('calculateHouseAndLand - offset account', () => {
  it('reduces interest charged and shortens the term', () => {
    const result = calculateHouseAndLand({
      ...base,
      startingAccountBalance: 100000,
      monthlyIncome: 8000,
      monthlyExpenses: 7500,
    })
    const noOffset = calculateHouseAndLand(base)
    expect(result.totalInterest).toBeLessThan(noOffset.totalInterest)
    expect(result.offsetInterestSaved).toBeGreaterThan(0)
    expect(result.offsetMonthsSaved).toBeGreaterThan(0)
  })

  it('still repays exactly the amount borrowed', () => {
    const result = calculateHouseAndLand({ ...base, startingAccountBalance: 100000 })
    const totalAmount = base.landAmount + base.constructionAmount
    expect(Math.round(result.totalRepayments - result.totalInterest)).toBe(Math.round(totalAmount))
  })

  it('reduces interest during construction too, since it is interest-only on the drawn balance', () => {
    const withOffset = calculateHouseAndLand({ ...base, startingAccountBalance: base.landAmount })
    const noOffset = calculateHouseAndLand(base)
    expect(withOffset.balances[0]).toBe(noOffset.balances[0])
    expect(withOffset.monthlyBalances[1].repayment).toBeLessThan(noOffset.monthlyBalances[1].repayment)
  })

  it('does not charge negative interest once the offset exceeds the balance', () => {
    const result = calculateHouseAndLand({
      ...base,
      startingAccountBalance: base.landAmount + base.constructionAmount + 100000,
    })
    expect(result.totalInterest).toBe(0)
  })

  it('sweeps leftover income into the offset, reduced by rent while the build is ongoing', () => {
    const result = calculateHouseAndLand({
      ...base,
      monthlyIncome: 8000,
      monthlyExpenses: 5000,
      constructionRent: 2000,
    })
    expect(result.offsetContributionDuringConstruction).toBeCloseTo(1000, 6)
    expect(result.offsetContributionAfterConstruction).toBeCloseTo(3000, 6)
  })

  it('never contributes a negative amount when expenses and rent outweigh income', () => {
    const result = calculateHouseAndLand({
      ...base,
      monthlyIncome: 3000,
      monthlyExpenses: 2500,
      constructionRent: 2000,
    })
    expect(result.offsetContributionDuringConstruction).toBe(0)
    expect(result.offsetContributionAfterConstruction).toBeGreaterThan(0)
  })
})

describe('calculateHouseAndLand - invalid input', () => {
  it('degrades to zeroes rather than NaN', () => {
    const result = calculateHouseAndLand({ ...base, landAmount: Number.NaN, termYears: 0 })
    expect(result.totalRepayments).toBe(0)
    expect(result.totalInterest).toBe(0)
  })
})
