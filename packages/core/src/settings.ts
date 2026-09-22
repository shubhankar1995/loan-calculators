import { todayISODate } from './format'
import { DEFAULT_CONSTRUCTION_STAGES, type ConstructionStage } from './houseAndLand'
import {
  FREQUENCY_LABELS,
  REPAYMENT_TYPE_LABELS,
  type Frequency,
  type RepaymentType,
} from './loan'

/**
 * The inputs each calculator remembers between visits, plus the codecs used to
 * put them in (and safely get them back out of) whatever key-value store the
 * host platform provides — `localStorage` on web, `AsyncStorage` on mobile.
 *
 * Stored data is untrusted: a user can edit it, an older build can have written
 * it, or it can simply be corrupt. Every parse therefore falls back to the
 * defaults field by field rather than trusting the payload's shape.
 */

/** Bumped when a stored shape changes incompatibly, so old payloads are discarded rather than misread. */
export const SETTINGS_VERSION = 1

export const STORAGE_KEYS = {
  homeLoan: 'repayly:home-loan:v1',
  houseAndLand: 'repayly:house-and-land:v1',
} as const

export interface HomeLoanSettings {
  amount: number
  startDate: string
  termYears: number
  ratePercent: number
  repaymentType: RepaymentType
  frequency: Frequency
  extraRepayment: number
  homeValue: number
  homeValueGrowthPercent: number
  offsetBalance: number
  monthlyIncome: number
  monthlyExpenses: number
}

export interface HouseAndLandSettings {
  landAmount: number
  constructionAmount: number
  landDepositAmount: number
  constructionDepositAmount: number
  startDate: string
  termYears: number
  ratePercent: number
  constructionMonths: number
  stages: ConstructionStage[]
  homeValue: number
  homeValueGrowthPercent: number
  startingAccountBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  constructionRent: number
}

/** A function rather than a constant because the default start date is today. */
export function homeLoanDefaults(): HomeLoanSettings {
  return {
    amount: 1128000,
    startDate: todayISODate(),
    termYears: 30,
    ratePercent: 6.29,
    repaymentType: 'principal-and-interest',
    frequency: 'monthly',
    extraRepayment: 0,
    homeValue: 1280000,
    homeValueGrowthPercent: 0,
    offsetBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
  }
}

export function houseAndLandDefaults(): HouseAndLandSettings {
  return {
    landAmount: 780000,
    constructionAmount: 501660,
    landDepositAmount: 0,
    constructionDepositAmount: 0,
    startDate: todayISODate(),
    termYears: 30,
    ratePercent: 6.29,
    constructionMonths: 9,
    stages: DEFAULT_CONSTRUCTION_STAGES.map((stage) => ({ ...stage })),
    homeValue: 1281660,
    homeValueGrowthPercent: 0,
    startingAccountBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    constructionRent: 0,
  }
}

/** Wraps settings in a versioned envelope, ready to hand to a store. */
export function serialiseSettings(settings: HomeLoanSettings | HouseAndLandSettings): string {
  return JSON.stringify({ version: SETTINGS_VERSION, settings })
}

export function parseHomeLoanSettings(raw: string | null | undefined): HomeLoanSettings {
  const defaults = homeLoanDefaults()
  const stored = unwrap(raw)
  if (!stored) return defaults

  return {
    amount: readNumber(stored.amount, defaults.amount),
    startDate: readISODate(stored.startDate, defaults.startDate),
    termYears: readNumber(stored.termYears, defaults.termYears),
    ratePercent: readNumber(stored.ratePercent, defaults.ratePercent),
    repaymentType: readOption(stored.repaymentType, REPAYMENT_TYPE_LABELS, defaults.repaymentType),
    frequency: readOption(stored.frequency, FREQUENCY_LABELS, defaults.frequency),
    extraRepayment: readNumber(stored.extraRepayment, defaults.extraRepayment),
    homeValue: readNumber(stored.homeValue, defaults.homeValue),
    homeValueGrowthPercent: readNumber(
      stored.homeValueGrowthPercent,
      defaults.homeValueGrowthPercent,
    ),
    offsetBalance: readNumber(stored.offsetBalance, defaults.offsetBalance),
    monthlyIncome: readNumber(stored.monthlyIncome, defaults.monthlyIncome),
    monthlyExpenses: readNumber(stored.monthlyExpenses, defaults.monthlyExpenses),
  }
}

export function parseHouseAndLandSettings(raw: string | null | undefined): HouseAndLandSettings {
  const defaults = houseAndLandDefaults()
  const stored = unwrap(raw)
  if (!stored) return defaults

  return {
    landAmount: readNumber(stored.landAmount, defaults.landAmount),
    constructionAmount: readNumber(stored.constructionAmount, defaults.constructionAmount),
    landDepositAmount: readNumber(stored.landDepositAmount, defaults.landDepositAmount),
    constructionDepositAmount: readNumber(
      stored.constructionDepositAmount,
      defaults.constructionDepositAmount,
    ),
    startDate: readISODate(stored.startDate, defaults.startDate),
    termYears: readNumber(stored.termYears, defaults.termYears),
    ratePercent: readNumber(stored.ratePercent, defaults.ratePercent),
    constructionMonths: readNumber(stored.constructionMonths, defaults.constructionMonths),
    stages: readStages(stored.stages, defaults.stages),
    homeValue: readNumber(stored.homeValue, defaults.homeValue),
    homeValueGrowthPercent: readNumber(
      stored.homeValueGrowthPercent,
      defaults.homeValueGrowthPercent,
    ),
    startingAccountBalance: readNumber(
      stored.startingAccountBalance,
      defaults.startingAccountBalance,
    ),
    monthlyIncome: readNumber(stored.monthlyIncome, defaults.monthlyIncome),
    monthlyExpenses: readNumber(stored.monthlyExpenses, defaults.monthlyExpenses),
    constructionRent: readNumber(stored.constructionRent, defaults.constructionRent),
  }
}

/** Unwraps the versioned envelope, returning null for anything unusable. */
function unwrap(raw: string | null | undefined): Record<string, unknown> | null {
  if (!raw) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  if (!isRecord(parsed)) return null
  if (parsed.version !== SETTINGS_VERSION) return null
  return isRecord(parsed.settings) ? parsed.settings : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Accepts any finite, non-negative number, so a deliberate zero survives a reload. */
function readNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback
}

function readISODate(value: unknown, fallback: string): string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallback
}

/** Keeps a stored choice only while it is still one of the options we offer. */
function readOption<T extends string>(
  value: unknown,
  options: Record<T, string>,
  fallback: T,
): T {
  return typeof value === 'string' && value in options ? (value as T) : fallback
}

function readStages(value: unknown, fallback: ConstructionStage[]): ConstructionStage[] {
  if (!Array.isArray(value)) return fallback

  const stages = value.filter(isRecord).map((stage, index) => ({
    name: typeof stage.name === 'string' ? stage.name : `Stage ${index + 1}`,
    percent: readNumber(stage.percent, 0),
  }))

  return stages.length > 0 ? stages : fallback
}
