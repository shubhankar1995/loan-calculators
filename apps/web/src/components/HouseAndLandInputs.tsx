import { useState, type ChangeEvent } from 'react'
import { formatNumber, parseNumber, type ConstructionStage } from '@loanlab/core'

interface Props {
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
  advancedOpen: boolean
  onLandAmountChange: (value: number) => void
  onConstructionAmountChange: (value: number) => void
  onLandDepositAmountChange: (value: number) => void
  onConstructionDepositAmountChange: (value: number) => void
  onStartDateChange: (value: string) => void
  onTermChange: (value: number) => void
  onRateChange: (value: number) => void
  onConstructionMonthsChange: (value: number) => void
  onStagesChange: (stages: ConstructionStage[]) => void
  onHomeValueChange: (value: number) => void
  onHomeValueGrowthChange: (value: number) => void
  onStartingAccountBalanceChange: (value: number) => void
  onMonthlyIncomeChange: (value: number) => void
  onMonthlyExpensesChange: (value: number) => void
  onConstructionRentChange: (value: number) => void
  onAdvancedOpenChange: (open: boolean) => void
}

export function HouseAndLandInputs({
  landAmount,
  constructionAmount,
  landDepositAmount,
  constructionDepositAmount,
  startDate,
  termYears,
  ratePercent,
  constructionMonths,
  stages,
  homeValue,
  homeValueGrowthPercent,
  startingAccountBalance,
  monthlyIncome,
  monthlyExpenses,
  constructionRent,
  advancedOpen,
  onLandAmountChange,
  onConstructionAmountChange,
  onLandDepositAmountChange,
  onConstructionDepositAmountChange,
  onStartDateChange,
  onTermChange,
  onRateChange,
  onConstructionMonthsChange,
  onStagesChange,
  onHomeValueChange,
  onHomeValueGrowthChange,
  onStartingAccountBalanceChange,
  onMonthlyIncomeChange,
  onMonthlyExpensesChange,
  onConstructionRentChange,
  onAdvancedOpenChange,
}: Props) {
  const [offsetOpen, setOffsetOpen] = useState(false)

  const handleLandAmount = (event: ChangeEvent<HTMLInputElement>) => {
    onLandAmountChange(parseNumber(event.target.value))
  }

  const handleConstructionAmount = (event: ChangeEvent<HTMLInputElement>) => {
    onConstructionAmountChange(parseNumber(event.target.value))
  }

  const handleLandDepositAmount = (event: ChangeEvent<HTMLInputElement>) => {
    onLandDepositAmountChange(parseNumber(event.target.value))
  }

  const handleConstructionDepositAmount = (event: ChangeEvent<HTMLInputElement>) => {
    onConstructionDepositAmountChange(parseNumber(event.target.value))
  }

  const handleHomeValue = (event: ChangeEvent<HTMLInputElement>) => {
    onHomeValueChange(parseNumber(event.target.value))
  }

  const handleStartingAccountBalance = (event: ChangeEvent<HTMLInputElement>) => {
    onStartingAccountBalanceChange(parseNumber(event.target.value))
  }

  const handleMonthlyIncome = (event: ChangeEvent<HTMLInputElement>) => {
    onMonthlyIncomeChange(parseNumber(event.target.value))
  }

  const handleMonthlyExpenses = (event: ChangeEvent<HTMLInputElement>) => {
    onMonthlyExpensesChange(parseNumber(event.target.value))
  }

  const handleConstructionRent = (event: ChangeEvent<HTMLInputElement>) => {
    onConstructionRentChange(parseNumber(event.target.value))
  }

  const handleStagePercent = (index: number, value: number) => {
    onStagesChange(stages.map((stage, i) => (i === index ? { ...stage, percent: value } : stage)))
  }

  const handleStageName = (index: number, value: string) => {
    onStagesChange(stages.map((stage, i) => (i === index ? { ...stage, name: value } : stage)))
  }

  const handleAddStage = () => {
    onStagesChange([...stages, { name: `Stage ${stages.length + 1}`, percent: 0 }])
  }

  const handleRemoveStage = (index: number) => {
    if (stages.length <= 1) return
    onStagesChange(stages.filter((_, i) => i !== index))
  }

  const stagesTotal = stages.reduce((sum, stage) => sum + stage.percent, 0)

  return (
    <div>
      <div className="form-section">
        <h3 className="form-section__title">Land</h3>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="land-amount">Land price</label>
            <div className="control control--unit">
              <span className="control__prefix">$</span>
              <input
                id="land-amount"
                inputMode="numeric"
                value={formatNumber(landAmount)}
                onChange={handleLandAmount}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="land-deposit-amount">Deposit paid</label>
            <div className="control control--unit">
              <span className="control__prefix">$</span>
              <input
                id="land-deposit-amount"
                inputMode="numeric"
                value={formatNumber(landDepositAmount)}
                onChange={handleLandDepositAmount}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="start-date">Land settlement date</label>
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
            <label htmlFor="construction-months">Construction period</label>
            <div className="control control--unit">
              <input
                id="construction-months"
                inputMode="numeric"
                value={constructionMonths}
                onChange={(event) => onConstructionMonthsChange(parseNumber(event.target.value))}
              />
              <span className="control__suffix">months</span>
            </div>
          </div>
        </div>
        <p className="form-hint">The deposit reduces the amount borrowed for the land.</p>
      </div>

      <div className="form-section">
        <h3 className="form-section__title">Construction</h3>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="construction-amount">Construction price</label>
            <div className="control control--unit">
              <span className="control__prefix">$</span>
              <input
                id="construction-amount"
                inputMode="numeric"
                value={formatNumber(constructionAmount)}
                onChange={handleConstructionAmount}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="construction-deposit-amount">Deposit paid</label>
            <div className="control control--unit">
              <span className="control__prefix">$</span>
              <input
                id="construction-deposit-amount"
                inputMode="numeric"
                value={formatNumber(constructionDepositAmount)}
                onChange={handleConstructionDepositAmount}
              />
            </div>
          </div>
        </div>
        <p className="form-hint">
          The deposit reduces the amount drawn down for the build. The remaining construction
          loan draws down progressively as each build stage completes, interest-only on the
          amount drawn so far, then the full loan switches to principal and interest once
          construction finishes.
        </p>
      </div>

      <div className="form-section">
        <h3 className="form-section__title">Property</h3>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="home-value">Completed home value</label>
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
        <summary>Build stages</summary>
        <div className="stage-list">
          {stages.map((stage, index) => (
            <div className="stage-field" key={index}>
              <input
                className="stage-field__name"
                type="text"
                aria-label="Stage name"
                value={stage.name}
                onChange={(event) => handleStageName(index, event.target.value)}
              />
              <div className="control control--unit stage-field__percent">
                <input
                  aria-label={`${stage.name || 'Stage'} percent`}
                  inputMode="numeric"
                  value={stage.percent}
                  onChange={(event) => handleStagePercent(index, parseNumber(event.target.value))}
                />
                <span className="control__suffix">%</span>
              </div>
              <button
                type="button"
                className="stage-field__remove"
                onClick={() => handleRemoveStage(index)}
                disabled={stages.length <= 1}
                aria-label={`Remove ${stage.name || 'stage'}`}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="summary__cta stage-list__add" onClick={handleAddStage}>
          + Add stage
        </button>
        <p className={`form-hint${stagesTotal === 100 ? '' : ' form-hint--warning'}`}>
          Stages total {stagesTotal}%{stagesTotal !== 100 ? ' — percentages are rescaled to 100% automatically.' : '.'}
        </p>
      </details>

      <details
        className="advanced"
        open={offsetOpen}
        onToggle={(event) => setOffsetOpen(event.currentTarget.open)}
      >
        <summary>Offset account</summary>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="starting-account-balance">Starting account balance</label>
            <div className="control control--unit">
              <span className="control__prefix">$</span>
              <input
                id="starting-account-balance"
                inputMode="numeric"
                value={formatNumber(startingAccountBalance)}
                onChange={handleStartingAccountBalance}
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

          <div className="field">
            <label htmlFor="construction-rent">Rent during construction</label>
            <div className="control control--unit">
              <span className="control__prefix">$</span>
              <input
                id="construction-rent"
                inputMode="numeric"
                value={formatNumber(constructionRent)}
                onChange={handleConstructionRent}
              />
              <span className="control__suffix">per month</span>
            </div>
          </div>
        </div>
        <p className="form-hint">
          Whatever's left of your income after expenses (and rent while the build is underway) is
          swept into the offset account automatically, reducing the interest-bearing balance from
          day one. Rent is assumed to stop once construction finishes and you move in.
        </p>
      </details>
    </div>
  )
}
