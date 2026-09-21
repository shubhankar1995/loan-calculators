import { type ChangeEvent } from 'react'
import { REPAYMENT_TYPE_LABELS, type RepaymentType } from '../lib/loan'
import { formatNumber, parseNumber } from '../lib/format'

interface Props {
  amount: number
  termYears: number
  ratePercent: number
  repaymentType: RepaymentType
  homeValue: number
  homeValueGrowthPercent: number
  offsetBalance: number
  offsetMonthlyContribution: number
  onAmountChange: (value: number) => void
  onTermChange: (value: number) => void
  onRateChange: (value: number) => void
  onRepaymentTypeChange: (value: RepaymentType) => void
  onHomeValueChange: (value: number) => void
  onHomeValueGrowthChange: (value: number) => void
  onOffsetBalanceChange: (value: number) => void
  onOffsetMonthlyContributionChange: (value: number) => void
}

export function LoanInputs({
  amount,
  termYears,
  ratePercent,
  repaymentType,
  homeValue,
  homeValueGrowthPercent,
  offsetBalance,
  offsetMonthlyContribution,
  onAmountChange,
  onTermChange,
  onRateChange,
  onRepaymentTypeChange,
  onHomeValueChange,
  onHomeValueGrowthChange,
  onOffsetBalanceChange,
  onOffsetMonthlyContributionChange,
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
    <div className="input-bar">
      <div className="field field--amount">
        <label htmlFor="loan-amount">Loan Amount</label>
        <input
          id="loan-amount"
          className="control"
          inputMode="numeric"
          value={`$${formatNumber(amount)}`}
          onChange={handleAmount}
        />
      </div>

      <div className="field field--amount">
        <label htmlFor="offset-balance">Offset account balance</label>
        <input
          id="offset-balance"
          className="control"
          inputMode="numeric"
          value={`$${formatNumber(offsetBalance)}`}
          onChange={handleOffsetBalance}
        />
      </div>

      <div className="field field--amount">
        <label htmlFor="offset-monthly-contribution">Added to offset each month</label>
        <input
          id="offset-monthly-contribution"
          className="control"
          inputMode="numeric"
          value={`$${formatNumber(offsetMonthlyContribution)}`}
          onChange={handleOffsetMonthlyContribution}
        />
      </div>

      <div className="field field--amount">
        <label htmlFor="home-value">Home value (for equity)</label>
        <input
          id="home-value"
          className="control"
          inputMode="numeric"
          value={`$${formatNumber(homeValue)}`}
          onChange={handleHomeValue}
        />
      </div>

      <div className="field field--growth">
        <label htmlFor="home-value-growth">Est. value increase</label>
        <div className="field-row">
          <input
            id="home-value-growth"
            className="control control--narrow"
            inputMode="decimal"
            value={homeValueGrowthPercent}
            onChange={(event) => onHomeValueGrowthChange(parseNumber(event.target.value))}
          />
          <span className="suffix">% a year</span>
        </div>
      </div>

      <div className="field field--term">
        <label htmlFor="loan-term">Term</label>
        <div className="field-row">
          <input
            id="loan-term"
            className="control control--narrow"
            inputMode="numeric"
            value={termYears}
            onChange={(event) => onTermChange(parseNumber(event.target.value))}
          />
          <span className="suffix">years</span>
        </div>
      </div>

      <div className="field field--type">
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

      <div className="field field--rate">
        <label htmlFor="interest-rate">With an interest rate of</label>
        <div className="field-row">
          <input
            id="interest-rate"
            className="control control--narrow"
            inputMode="decimal"
            value={ratePercent}
            onChange={(event) => onRateChange(parseNumber(event.target.value))}
          />
          <span className="suffix">% p.a.</span>
          <span className="suffix suffix--muted">Or</span>
          <a className="link" href="#rates">
            choose a home loan
          </a>
        </div>
      </div>
    </div>
  )
}
