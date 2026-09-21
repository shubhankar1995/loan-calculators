import { type ChangeEvent } from 'react'
import {
  FREQUENCY_ADVERBS,
  FREQUENCY_LABELS,
  REPAYMENT_TYPE_LABELS,
  type Frequency,
  type RepaymentType,
} from '../lib/loan'
import { formatNumber, parseNumber } from '../lib/format'

interface Props {
  amount: number
  termYears: number
  ratePercent: number
  repaymentType: RepaymentType
  frequency: Frequency
  extraRepayment: number
  homeValue: number
  homeValueGrowthPercent: number
  offsetBalance: number
  offsetMonthlyContribution: number
  advancedOpen: boolean
  onAmountChange: (value: number) => void
  onTermChange: (value: number) => void
  onRateChange: (value: number) => void
  onRepaymentTypeChange: (value: RepaymentType) => void
  onFrequencyChange: (value: Frequency) => void
  onExtraRepaymentChange: (value: number) => void
  onHomeValueChange: (value: number) => void
  onHomeValueGrowthChange: (value: number) => void
  onOffsetBalanceChange: (value: number) => void
  onOffsetMonthlyContributionChange: (value: number) => void
  onAdvancedOpenChange: (open: boolean) => void
}

export function LoanInputs({
  amount,
  termYears,
  ratePercent,
  repaymentType,
  frequency,
  extraRepayment,
  homeValue,
  homeValueGrowthPercent,
  offsetBalance,
  offsetMonthlyContribution,
  advancedOpen,
  onAmountChange,
  onTermChange,
  onRateChange,
  onRepaymentTypeChange,
  onFrequencyChange,
  onExtraRepaymentChange,
  onHomeValueChange,
  onHomeValueGrowthChange,
  onOffsetBalanceChange,
  onOffsetMonthlyContributionChange,
  onAdvancedOpenChange,
}: Props) {
  const handleAmount = (event: ChangeEvent<HTMLInputElement>) => {
    onAmountChange(parseNumber(event.target.value))
  }

  const handleHomeValue = (event: ChangeEvent<HTMLInputElement>) => {
    onHomeValueChange(parseNumber(event.target.value))
  }

  const handleOffsetBalance = (event: ChangeEvent<HTMLInputElement>) => {
    onOffsetBalanceChange(parseNumber(event.target.value))
  }

  const handleOffsetMonthlyContribution = (event: ChangeEvent<HTMLInputElement>) => {
    onOffsetMonthlyContributionChange(parseNumber(event.target.value))
  }

  return (
    <div>
      <div className="form-section">
        <h3 className="form-section__title">Loan</h3>
        <div className="form-grid">
          <div className="field field--full">
            <label htmlFor="loan-amount">Loan amount</label>
            <div className="control control--unit">
              <span className="control__prefix">$</span>
              <input
                id="loan-amount"
                inputMode="numeric"
                value={formatNumber(amount)}
                onChange={handleAmount}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="interest-rate">Interest rate</label>
            <div className="control control--unit">
              <input
                id="interest-rate"
                inputMode="decimal"
                value={ratePercent}
                onChange={(event) => onRateChange(parseNumber(event.target.value))}
              />
              <span className="control__suffix">% p.a.</span>
            </div>
            <a className="field-link" href="#rates">
              Or choose a home loan
            </a>
          </div>

          <div className="field">
            <label htmlFor="loan-term">Loan term</label>
            <div className="control control--unit">
              <input
                id="loan-term"
                inputMode="numeric"
                value={termYears}
                onChange={(event) => onTermChange(parseNumber(event.target.value))}
              />
              <span className="control__suffix">years</span>
            </div>
          </div>

          <div className="field">
            <label htmlFor="repayment-type">Repayment type</label>
            <div className="select-wrap">
              <select
                id="repayment-type"
                className="control"
                value={repaymentType}
                onChange={(event) => onRepaymentTypeChange(event.target.value as RepaymentType)}
              >
                {Object.entries(REPAYMENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="frequency">Repayment frequency</label>
            <div className="select-wrap">
              <select
                id="frequency"
                className="control"
                value={frequency}
                onChange={(event) => onFrequencyChange(event.target.value as Frequency)}
              >
                {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3 className="form-section__title">Property</h3>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="home-value">Home value</label>
            <div className="control control--unit">
              <span className="control__prefix">$</span>
              <input
                id="home-value"
                inputMode="numeric"
                value={formatNumber(homeValue)}
                onChange={handleHomeValue}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="home-value-growth">Est. value growth</label>
            <div className="control control--unit">
              <input
                id="home-value-growth"
                inputMode="decimal"
                value={homeValueGrowthPercent}
                onChange={(event) => onHomeValueGrowthChange(parseNumber(event.target.value))}
              />
              <span className="control__suffix">% p.a.</span>
            </div>
          </div>
        </div>
      </div>

      <details
        className="advanced"
        open={advancedOpen}
        onToggle={(event) => onAdvancedOpenChange(event.currentTarget.open)}
      >
        <summary>Advanced options</summary>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="offset-balance">Offset account balance</label>
            <div className="control control--unit">
              <span className="control__prefix">$</span>
              <input
                id="offset-balance"
                inputMode="numeric"
                value={formatNumber(offsetBalance)}
                onChange={handleOffsetBalance}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="offset-monthly-contribution">Added to offset</label>
            <div className="control control--unit">
              <span className="control__prefix">$</span>
              <input
                id="offset-monthly-contribution"
                inputMode="numeric"
                value={formatNumber(offsetMonthlyContribution)}
                onChange={handleOffsetMonthlyContribution}
              />
              <span className="control__suffix">per month</span>
            </div>
          </div>

          <div className="field field--full">
            <label htmlFor="extra">Additional repayments</label>
            <div className="control control--unit">
              <span className="control__prefix">$</span>
              <input
                id="extra"
                inputMode="numeric"
                value={formatNumber(extraRepayment)}
                onChange={(event) => onExtraRepaymentChange(parseNumber(event.target.value))}
              />
              <span className="control__suffix">per {FREQUENCY_ADVERBS[frequency]} repayment</span>
            </div>
          </div>
        </div>
      </details>
    </div>
  )
}
