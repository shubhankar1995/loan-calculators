import { useMemo, useState } from 'react'
import { HouseAndLandInputs } from './components/HouseAndLandInputs'
import { RepaymentsChart } from './components/RepaymentsChart'
import { RepaymentsTable } from './components/RepaymentsTable'
import {
  DEFAULT_CONSTRUCTION_STAGES,
  calculateHouseAndLand,
  type ConstructionStage,
} from './lib/houseAndLand'
import { describeDuration, formatCurrency, formatRepayment, todayISODate } from './lib/format'
import { PERIODS_PER_YEAR } from './lib/loan'

type View = 'graph' | 'table'

export function HouseAndLandCalculator() {
  const [landAmount, setLandAmount] = useState(780000)
  const [constructionAmount, setConstructionAmount] = useState(501660)
  const [landDepositAmount, setLandDepositAmount] = useState(0)
  const [constructionDepositAmount, setConstructionDepositAmount] = useState(0)
  const [startDate, setStartDate] = useState(() => todayISODate())
  const [termYears, setTermYears] = useState(30)
  const [ratePercent, setRatePercent] = useState(6.29)
  const [constructionMonths, setConstructionMonths] = useState(9)
  const [stages, setStages] = useState<ConstructionStage[]>(DEFAULT_CONSTRUCTION_STAGES)
  const [homeValue, setHomeValue] = useState(1281660)
  const [homeValueGrowthPercent, setHomeValueGrowthPercent] = useState(0)
  const [offsetBalance, setOffsetBalance] = useState(0)
  const [offsetMonthlyContribution, setOffsetMonthlyContribution] = useState(0)
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
        offsetBalance,
        offsetMonthlyContribution,
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
      offsetBalance,
      offsetMonthlyContribution,
    ],
  )

  const caption = `Interest rate ${ratePercent}% p.a., interest only for the ${constructionMonths} month build, then principal and interest of ${formatRepayment(
    result.postConstructionRepayment,
  )} a month`

  const equityLegend = `(ramps from the land value up to the completed home value as construction finishes, then ${
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
            offsetBalance={offsetBalance}
            offsetMonthlyContribution={offsetMonthlyContribution}
            advancedOpen={advancedOpen}
            onLandAmountChange={setLandAmount}
            onConstructionAmountChange={setConstructionAmount}
            onLandDepositAmountChange={setLandDepositAmount}
            onConstructionDepositAmountChange={setConstructionDepositAmount}
            onStartDateChange={setStartDate}
            onTermChange={setTermYears}
            onRateChange={setRatePercent}
            onConstructionMonthsChange={setConstructionMonths}
            onStagesChange={setStages}
            onHomeValueChange={setHomeValue}
            onHomeValueGrowthChange={setHomeValueGrowthPercent}
            onOffsetBalanceChange={setOffsetBalance}
            onOffsetMonthlyContributionChange={setOffsetMonthlyContribution}
            onAdvancedOpenChange={setAdvancedOpen}
          />
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
            {(offsetBalance > 0 || offsetMonthlyContribution > 0) && result.offsetMonthsSaved > 0 && (
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
            equityLegend={equityLegend}
            legend={`Interest only during construction (${constructionMonths} months), then principal and interest`}
          />
        ) : (
          <RepaymentsTable
            caption={caption}
            startDate={startDate}
            yearlyBalances={result.yearlyBalances}
            monthlyBalances={result.monthlyBalances}
            propertyValues={result.propertyValues}
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
