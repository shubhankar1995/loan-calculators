import { useState, type ChangeEvent } from 'react'
import type { ConstructionStage } from '../lib/houseAndLand'
import { formatNumber, parseNumber } from '../lib/format'

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
  offsetBalance: number
  offsetMonthlyContribution: number
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
  onOffsetBalanceChange: (value: number) => void
  onOffsetMonthlyContributionChange: (value: number) => void
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
  offsetBalance,
  offsetMonthlyContribution,
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
  onOffsetBalanceChange,
  onOffsetMonthlyContributionChange,
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

  const handleOffsetBalance = (event: ChangeEvent<HTMLInputElement>) => {
    onOffsetBalanceChange(parseNumber(event.target.value))
  }

  const handleOffsetMonthlyContribution = (event: ChangeEvent<HTMLInputElement>) => {
    onOffsetMonthlyContributionChange(parseNumber(event.target.value))
  }

  const handleStagePercent = (index: number, value: number) => {
    onStagesChange(stages.map((stage, i) => (i === index ? { ...stage, percent: value } : stage)))
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
        <div className="form-grid">
          {stages.map((stage, index) => (
            <div className="field" key={stage.name}>
              <label htmlFor={`stage-${stage.name}`}>{stage.name}</label>
              <div className="control control--unit">
                <input
                  id={`stage-${stage.name}`}
                  inputMode="numeric"
                  value={stage.percent}
                  onChange={(event) => handleStagePercent(index, parseNumber(event.target.value))}
                />
                <span className="control__suffix">%</span>
              </div>
            </div>
          ))}
        </div>
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
        </div>
        <p className="form-hint">
          Reduces the interest-bearing balance from day one, including during construction.
        </p>
      </details>
    </div>
  )
}
