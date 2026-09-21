import { describe, expect, it } from 'vitest'
import { calculateHouseAndLand, DEFAULT_CONSTRUCTION_STAGES } from './houseAndLand'
import { periodicRepayment } from './loan'

const base = {
  landAmount: 400000,
  constructionAmount: 350000,
  termYears: 30,
  annualRatePercent: 6,
  constructionMonths: 10,
  stages: DEFAULT_CONSTRUCTION_STAGES,
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

describe('calculateHouseAndLand - invalid input', () => {
  it('degrades to zeroes rather than NaN', () => {
    const result = calculateHouseAndLand({ ...base, landAmount: Number.NaN, termYears: 0 })
    expect(result.totalRepayments).toBe(0)
    expect(result.totalInterest).toBe(0)
  })
})
