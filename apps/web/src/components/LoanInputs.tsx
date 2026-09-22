import { useState, type ChangeEvent } from 'react'
import {
  FREQUENCY_ADVERBS,
  FREQUENCY_LABELS,
  REPAYMENT_TYPE_LABELS,
  formatNumber,
  parseNumber,
  type Frequency,
  type RepaymentType,
} from '@repayly/core'

interface Props {
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
  advancedOpen: boolean
  onAmountChange: (value: number) => void
  onStartDateChange: (value: string) => void
  onTermChange: (value: number) => void
  onRateChange: (value: number) => void
  onRepaymentTypeChange: (value: RepaymentType) => void
  onFrequencyChange: (value: Frequency) => void
  onExtraRepaymentChange: (value: number) => void
  onHomeValueChange: (value: number) => void
  onHomeValueGrowthChange: (value: number) => void
  onOffsetBalanceChange: (value: number) => void
  onMonthlyIncomeChange: (value: number) => void
  onMonthlyExpensesChange: (value: number) => void
  onAdvancedOpenChange: (open: boolean) => void
}

export function LoanInputs({
  amount,
  startDate,
  termYears,
  ratePercent,
  repaymentType,
  frequency,
  extraRepayment,
  homeValue,
  homeValueGrowthPercent,
  offsetBalance,
  monthlyIncome,
  monthlyExpenses,
  advancedOpen,
  onAmountChange,
  onStartDateChange,
  onTermChange,
  onRateChange,
  onRepaymentTypeChange,
  onFrequencyChange,
  onExtraRepaymentChange,
  onHomeValueChange,
  onHomeValueGrowthChange,
  onOffsetBalanceChange,
  onMonthlyIncomeChange,
  onMonthlyExpensesChange,
  onAdvancedOpenChange,
}: Props) {
  const [offsetOpen, setOffsetOpen] = useState(false)

  const handleAmount = (event: ChangeEvent<HTMLInputElement>) => {
    onAmountChange(parseNumber(event.target.value))
  }

  const handleHomeValue = (event: ChangeEvent<HTMLInputElement>) => {
    onHomeValueChange(parseNumber(event.target.value))
  }

  const handleOffsetBalance = (event: ChangeEvent<HTMLInputElement>) => {
    onOffsetBalanceChange(parseNumber(event.target.value))
  }

  const handleMonthlyIncome = (event: ChangeEvent<HTMLInputElement>) => {
    onMonthlyIncomeChange(parseNumber(event.target.value))
  }

  const handleMonthlyExpenses = (event: ChangeEvent<HTMLInputElement>) => {
    onMonthlyExpensesChange(parseNumber(event.target.value))
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
            <label htmlFor="start-date">Start date</label>
            <div className="control control--unit">
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(event) => onStartDateChange(event.target.value)}
              />
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

      <details className="advanced" open={offsetOpen} onToggle={(event) => setOffsetOpen(event.currentTarget.open)}>
        <summary>Offset account</summary>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="offset-balance">Starting account balance</label>
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
            <label htmlFor="monthly-income">Monthly household income</label>
            <div className="control control--unit">
              <span className="control__prefix">$</span>
              <input
                id="monthly-income"
                inputMode="numeric"
                value={formatNumber(monthlyIncome)}
                onChange={handleMonthlyIncome}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="monthly-expenses">Monthly expenses</label>
            <div className="control control--unit">
              <span className="control__prefix">$</span>
              <input
                id="monthly-expenses"
                inputMode="numeric"
                value={formatNumber(monthlyExpenses)}
                onChange={handleMonthlyExpenses}
              />
            </div>
          </div>
        </div>
        <p className="form-hint">
          Whatever's left of your income after expenses is swept into the offset account
          automatically, reducing the interest-bearing balance from day one.
        </p>
      </details>
    </div>
  )
}
