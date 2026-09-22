import { describe, expect, it } from 'vitest'
import { axisScale, axisYearTicks } from './axis'
import { formatCompactCurrency } from './format'

describe('axisScale', () => {
  it('rounds the top gridline up to a readable step', () => {
    const scale = axisScale(1281660)
    expect(scale.step).toBe(300000)
    expect(scale.max).toBe(1500000)
    expect(scale.ticks).toEqual([1500000, 1200000, 900000, 600000, 300000, 0])
  })

  it('keeps the axis tight when the data already lands on a round step', () => {
    expect(axisScale(500000).max).toBe(500000)
  })

  it('leaves at most one step of headroom above the data', () => {
    for (const dataMax of [1, 420, 9500, 83000, 640000, 1281660, 7_400_000]) {
      const { max, step } = axisScale(dataMax)
      expect(max).toBeGreaterThanOrEqual(dataMax)
      expect(max - step).toBeLessThan(dataMax)
    }
  })

  it('falls back to a usable scale for empty or invalid data', () => {
    expect(axisScale(0).max).toBeGreaterThan(0)
    expect(axisScale(Number.NaN).max).toBeGreaterThan(0)
  })
})

describe('axisYearTicks', () => {
  it('labels a 30 year term every decade', () => {
    expect(axisYearTicks(30)).toEqual([0, 10, 20, 30])
  })

  it('always includes both ends', () => {
    for (const term of [1, 3, 7, 12, 25, 30, 40]) {
      const ticks = axisYearTicks(term)
      expect(ticks[0]).toBe(0)
      expect(ticks.at(-1)).toBe(term)
    }
  })

  it('drops an interior tick that would crowd the end label', () => {
    expect(axisYearTicks(25)).toEqual([0, 10, 25])
  })
})

describe('formatCompactCurrency', () => {
  it('abbreviates thousands and millions', () => {
    expect(formatCompactCurrency(0)).toBe('$0')
    expect(formatCompactCurrency(850)).toBe('$850')
    expect(formatCompactCurrency(9500)).toBe('$9.5k')
    expect(formatCompactCurrency(300000)).toBe('$300k')
    expect(formatCompactCurrency(1200000)).toBe('$1.2m')
    expect(formatCompactCurrency(1281660)).toBe('$1.28m')
    expect(formatCompactCurrency(24000000)).toBe('$24m')
  })

  it('keeps the sign on a negative balance', () => {
    expect(formatCompactCurrency(-45000)).toBe('-$45k')
  })
})
