import { type ChangeEvent } from 'react'
import { REPAYMENT_TYPE_LABELS, type RepaymentType } from '../lib/loan'
import { formatNumber, parseNumber } from '../lib/format'

interface Props {
  amount: number
  termYears: number
  ratePercent: number
  repaymentType: RepaymentType
  homeValue: number
  onAmountChange: (value: number) => void
  onTermChange: (value: number) => void
  onRateChange: (value: number) => void
  onRepaymentTypeChange: (value: RepaymentType) => void
  onHomeValueChange: (value: number) => void
}

export function LoanInputs({
  amount,
  termYears,
  ratePercent,
  repaymentType,
  homeValue,
  onAmountChange,
  onTermChange,
  onRateChange,
  onRepaymentTypeChange,
  onHomeValueChange,
}: Props) {
  const handleAmount = (event: ChangeEvent<HTMLInputElement>) => {
    onAmountChange(parseNumber(event.target.value))
  }

  const handleHomeValue = (event: ChangeEvent<HTMLInputElement>) => {
    onHomeValueChange(parseNumber(event.target.value))
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
        <label htmlFor="home-value">Home value (for equity)</label>
        <input
          id="home-value"
          className="control"
          inputMode="numeric"
          value={`$${formatNumber(homeValue)}`}
          onChange={handleHomeValue}
        />
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
