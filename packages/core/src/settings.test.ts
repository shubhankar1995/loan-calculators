import { describe, expect, it } from 'vitest'
import {
  SETTINGS_VERSION,
  homeLoanDefaults,
  houseAndLandDefaults,
  parseHomeLoanSettings,
  parseHouseAndLandSettings,
  serialiseSettings,
} from './settings'

const store = (settings: unknown, version: number = SETTINGS_VERSION) =>
  JSON.stringify({ version, settings })

describe('serialiseSettings', () => {
  it('round-trips a full set of home loan inputs', () => {
    const settings = {
      ...homeLoanDefaults(),
      amount: 640000,
      startDate: '2026-04-01',
      ratePercent: 5.74,
      repaymentType: 'interest-only-3' as const,
      frequency: 'fortnightly' as const,
      extraRepayment: 250,
      monthlyIncome: 11000,
    }

    expect(parseHomeLoanSettings(serialiseSettings(settings))).toEqual(settings)
  })

  it('round-trips a full set of house and land inputs, stages included', () => {
    const settings = {
      ...houseAndLandDefaults(),
      landAmount: 500000,
      constructionMonths: 11,
      stages: [
        { name: 'Slab', percent: 30 },
        { name: 'Handover', percent: 70 },
      ],
    }

    expect(parseHouseAndLandSettings(serialiseSettings(settings))).toEqual(settings)
  })
})

describe('parseHomeLoanSettings', () => {
  it('falls back to the defaults when nothing has been stored', () => {
    expect(parseHomeLoanSettings(null)).toEqual(homeLoanDefaults())
    expect(parseHomeLoanSettings('')).toEqual(homeLoanDefaults())
  })

  it('falls back to the defaults for corrupt or foreign payloads', () => {
    const defaults = homeLoanDefaults()
    expect(parseHomeLoanSettings('{not json')).toEqual(defaults)
    expect(parseHomeLoanSettings('[]')).toEqual(defaults)
    expect(parseHomeLoanSettings(store('a string'))).toEqual(defaults)
  })

  it('discards payloads written by an incompatible version', () => {
    const raw = store({ ...homeLoanDefaults(), amount: 999 }, SETTINGS_VERSION + 1)
    expect(parseHomeLoanSettings(raw).amount).toBe(homeLoanDefaults().amount)
  })

  it('keeps the valid fields and defaults only the invalid ones', () => {
    const parsed = parseHomeLoanSettings(
      store({ amount: 725000, termYears: 'thirty', ratePercent: null }),
    )

    expect(parsed.amount).toBe(725000)
    expect(parsed.termYears).toBe(homeLoanDefaults().termYears)
    expect(parsed.ratePercent).toBe(homeLoanDefaults().ratePercent)
  })

  it('keeps a deliberate zero rather than treating it as missing', () => {
    const parsed = parseHomeLoanSettings(store({ homeValue: 0, extraRepayment: 0 }))

    expect(parsed.homeValue).toBe(0)
    expect(parsed.extraRepayment).toBe(0)
  })

  it('rejects negative amounts and non-finite numbers', () => {
    const defaults = homeLoanDefaults()
    const parsed = parseHomeLoanSettings(store({ amount: -500, monthlyIncome: Infinity }))

    expect(parsed.amount).toBe(defaults.amount)
    expect(parsed.monthlyIncome).toBe(defaults.monthlyIncome)
  })

  it('rejects a start date that is not an ISO day', () => {
    expect(parseHomeLoanSettings(store({ startDate: '01/04/2026' })).startDate).toBe(
      homeLoanDefaults().startDate,
    )
    expect(parseHomeLoanSettings(store({ startDate: '2026-04-01' })).startDate).toBe('2026-04-01')
  })

  it('rejects a repayment type or frequency we no longer offer', () => {
    const defaults = homeLoanDefaults()
    const parsed = parseHomeLoanSettings(
      store({ repaymentType: 'interest-only-9', frequency: 'daily' }),
    )

    expect(parsed.repaymentType).toBe(defaults.repaymentType)
    expect(parsed.frequency).toBe(defaults.frequency)
  })
})

describe('parseHouseAndLandSettings', () => {
  it('falls back to the default stages when the stored ones are unusable', () => {
    const defaults = houseAndLandDefaults()

    expect(parseHouseAndLandSettings(store({ stages: 'slab' })).stages).toEqual(defaults.stages)
    expect(parseHouseAndLandSettings(store({ stages: [] })).stages).toEqual(defaults.stages)
  })

  it('repairs individual stages instead of discarding the whole schedule', () => {
    const parsed = parseHouseAndLandSettings(
      store({ stages: [{ name: 'Slab', percent: 40 }, { percent: 'lots' }, 'nonsense'] }),
    )

    expect(parsed.stages).toEqual([
      { name: 'Slab', percent: 40 },
      { name: 'Stage 2', percent: 0 },
    ])
  })
})
