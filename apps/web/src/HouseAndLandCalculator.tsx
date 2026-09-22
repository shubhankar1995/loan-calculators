import { useMemo, useState } from 'react'
import { HouseAndLandInputs } from './components/HouseAndLandInputs'
import { RepaymentsChart } from './components/RepaymentsChart'
import { RepaymentsTable } from './components/RepaymentsTable'
import { SavedDetailsNote } from './components/SavedDetailsNote'
import { usePersistentSettings } from './hooks/usePersistentState'
import {
  PERIODS_PER_YEAR,
  STORAGE_KEYS,
  calculateHouseAndLand,
  describeDuration,
  formatCurrency,
  formatRepayment,
  parseHouseAndLandSettings,
} from '@repayly/core'

type View = 'graph' | 'table'

export function HouseAndLandCalculator() {
  const { settings, update, reset } = usePersistentSettings(
    STORAGE_KEYS.houseAndLand,
    parseHouseAndLandSettings,
  )
  const {
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
  } = settings

  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [view, setView] = useState<View>('graph')

  const result = useMemo(
    () =>
      calculateHouseAndLand({
        landAmount,
        constructionAmount,
        landDepositAmount,
        constructionDepositAmount,
        termYears,
        annualRatePercent: ratePercent,
        constructionMonths,
        stages,
        homeValue,
        homeValueGrowthPercent,
        startingAccountBalance,
        monthlyIncome,
        monthlyExpenses,
        constructionRent,
      }),
    [
      landAmount,
      constructionAmount,
      landDepositAmount,
      constructionDepositAmount,
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
    ],
  )

  const caption = `Interest rate ${ratePercent}% p.a., interest only for the ${constructionMonths} month build, then principal and interest of ${formatRepayment(
    result.postConstructionRepayment,
  )} a month`

  const homeValueLegend = `(ramps from the land value up to the completed home value as construction finishes, then ${
    homeValueGrowthPercent > 0 ? `grows ${homeValueGrowthPercent}% a year` : 'stays constant'
  })`

  return (
    <>
      <header className="page-header">
        <h1>House and land package calculator</h1>
        <p>See how repayments step up as your build draws down, then settle once it's finished.</p>
      </header>

      <div className="layout">
        <section className="card card--form" aria-label="House and land details">
          <HouseAndLandInputs
            landAmount={landAmount}
            constructionAmount={constructionAmount}
            landDepositAmount={landDepositAmount}
            constructionDepositAmount={constructionDepositAmount}
            startDate={startDate}
            termYears={termYears}
            ratePercent={ratePercent}
            constructionMonths={constructionMonths}
            stages={stages}
            homeValue={homeValue}
            homeValueGrowthPercent={homeValueGrowthPercent}
            startingAccountBalance={startingAccountBalance}
            monthlyIncome={monthlyIncome}
            monthlyExpenses={monthlyExpenses}
            constructionRent={constructionRent}
            advancedOpen={advancedOpen}
            onLandAmountChange={(landAmount) => update({ landAmount })}
            onConstructionAmountChange={(constructionAmount) => update({ constructionAmount })}
            onLandDepositAmountChange={(landDepositAmount) => update({ landDepositAmount })}
            onConstructionDepositAmountChange={(constructionDepositAmount) =>
              update({ constructionDepositAmount })
            }
            onStartDateChange={(startDate) => update({ startDate })}
            onTermChange={(termYears) => update({ termYears })}
            onRateChange={(ratePercent) => update({ ratePercent })}
            onConstructionMonthsChange={(constructionMonths) => update({ constructionMonths })}
            onStagesChange={(stages) => update({ stages })}
            onHomeValueChange={(homeValue) => update({ homeValue })}
            onHomeValueGrowthChange={(homeValueGrowthPercent) =>
              update({ homeValueGrowthPercent })
            }
            onStartingAccountBalanceChange={(startingAccountBalance) =>
              update({ startingAccountBalance })
            }
            onMonthlyIncomeChange={(monthlyIncome) => update({ monthlyIncome })}
            onMonthlyExpensesChange={(monthlyExpenses) => update({ monthlyExpenses })}
            onConstructionRentChange={(constructionRent) => update({ constructionRent })}
            onAdvancedOpenChange={setAdvancedOpen}
          />

          <SavedDetailsNote onReset={reset} />
        </section>

        <aside className="card card--summary" aria-label="Your repayment">
          <div className="summary__hero">
            <p className="summary__hero-label">Repayment during construction</p>
            <p className="summary__hero-value">
              {formatRepayment(result.landRepayment)}
              <span className="summary__hero-unit">/ month</span>
            </p>
            <p className="summary__rate">
              <strong>{ratePercent}%</strong> p.a., {termYears} year term
            </p>
          </div>

          <div className="summary__tiles">
            <div className="tile">
              <p className="tile__label">Once fully drawn down</p>
              <p className="tile__value">{formatRepayment(result.finalConstructionRepayment)}</p>
            </div>
            <div className="tile">
              <p className="tile__label">After construction (P&I)</p>
              <p className="tile__value">{formatRepayment(result.postConstructionRepayment)}</p>
            </div>
            <div className="tile">
              <p className="tile__label">Total repayments</p>
              <p className="tile__value">{formatCurrency(result.totalRepayments)}</p>
            </div>
            <div className="tile">
              <p className="tile__label">Total interest charged</p>
              <p className="tile__value">{formatCurrency(result.totalInterest)}</p>
            </div>
          </div>

          <div className="summary__callouts">
            {result.offsetMonthsSaved > 0 && (
              <p className="callout">
                Your offset account clears the loan{' '}
                {describeDuration(result.offsetMonthsSaved, PERIODS_PER_YEAR.monthly)} sooner and
                saves {formatCurrency(result.offsetInterestSaved)} in interest.
              </p>
            )}

            <p className="callout callout--muted">
              Interest only during the {constructionMonths} month build, charged on the amount
              drawn so far. Once construction completes, the full {formatCurrency(result.totalAmount)}{' '}
              switches to principal and interest for the rest of the term.
            </p>
          </div>
        </aside>
      </div>

      <section className="card outlook" aria-label="Loan outlook">
        <div className="outlook__header">
          <h2>Loan outlook</h2>
          <div className="tabs" role="tablist">
            <TabButton active={view === 'graph'} onClick={() => setView('graph')}>
              Chart
            </TabButton>
            <TabButton active={view === 'table'} onClick={() => setView('table')}>
              Repayment schedule
            </TabButton>
          </div>
        </div>

        {view === 'graph' ? (
          <RepaymentsChart
            balances={result.balances}
            periodsPerYear={12}
            termYears={termYears}
            propertyValues={result.propertyValues}
            homeValueLegend={homeValueLegend}
            legend={`Interest only during construction (${constructionMonths} months), then principal and interest`}
          />
        ) : (
          <RepaymentsTable
            caption={caption}
            startDate={startDate}
            monthlyBalances={result.monthlyBalances}
          />
        )}
      </section>
    </>
  )
}

interface TabButtonProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      className={`tabs__button${active ? ' is-active' : ''}`}
      aria-selected={active}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
