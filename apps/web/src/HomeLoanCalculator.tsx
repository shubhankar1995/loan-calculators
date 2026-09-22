import { useMemo, useState } from 'react'
import { LoanInputs } from './components/LoanInputs'
import { RepaymentsChart } from './components/RepaymentsChart'
import { RepaymentsTable } from './components/RepaymentsTable'
import {
  FREQUENCY_ADVERBS,
  PERIODS_PER_YEAR,
  calculateLoan,
  describeDuration,
  formatCurrency,
  formatRepayment,
  interestOnlyYears,
  todayISODate,
  type Frequency,
  type RepaymentType,
} from '@repayly/core'

type View = 'graph' | 'table'

export function HomeLoanCalculator() {
  const [amount, setAmount] = useState(1128000)
  const [startDate, setStartDate] = useState(() => todayISODate())
  const [termYears, setTermYears] = useState(30)
  const [ratePercent, setRatePercent] = useState(6.29)
  const [repaymentType, setRepaymentType] = useState<RepaymentType>('principal-and-interest')
  const [frequency, setFrequency] = useState<Frequency>('monthly')
  const [extraRepayment, setExtraRepayment] = useState(0)
  const [homeValue, setHomeValue] = useState(1280000)
  const [homeValueGrowthPercent, setHomeValueGrowthPercent] = useState(0)
  const [offsetBalance, setOffsetBalance] = useState(0)
  const [monthlyIncome, setMonthlyIncome] = useState(0)
  const [monthlyExpenses, setMonthlyExpenses] = useState(0)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [view, setView] = useState<View>('graph')

  const result = useMemo(
    () =>
      calculateLoan({
        amount,
        termYears,
        annualRatePercent: ratePercent,
        repaymentType,
        frequency,
        extraRepayment,
        offsetBalance,
        monthlyIncome,
        monthlyExpenses,
      }),
    [
      amount,
      termYears,
      ratePercent,
      repaymentType,
      frequency,
      extraRepayment,
      offsetBalance,
      monthlyIncome,
      monthlyExpenses,
    ],
  )

  const periodsPerYear = PERIODS_PER_YEAR[frequency]
  const ioYears = interestOnlyYears(repaymentType)
  const interestOnly = ioYears > 0
  const caption = `Interest rate ${ratePercent}% with ${FREQUENCY_ADVERBS[frequency]} ${
    interestOnly ? 'interest only' : 'principal and interest'
  } repayments of ${formatRepayment(result.totalPeriodRepayment)}`

  return (
    <>
      <header className="page-header">
        <h1>Home loan calculator</h1>
        <p>Adjust the details to see your estimated repayments.</p>
      </header>

      <div className="layout">
        <section className="card card--form" aria-label="Loan details">
          <LoanInputs
            amount={amount}
            startDate={startDate}
            termYears={termYears}
            ratePercent={ratePercent}
            repaymentType={repaymentType}
            frequency={frequency}
            extraRepayment={extraRepayment}
            homeValue={homeValue}
            homeValueGrowthPercent={homeValueGrowthPercent}
            offsetBalance={offsetBalance}
            monthlyIncome={monthlyIncome}
            monthlyExpenses={monthlyExpenses}
            advancedOpen={advancedOpen}
            onAmountChange={setAmount}
            onStartDateChange={setStartDate}
            onTermChange={setTermYears}
            onRateChange={setRatePercent}
            onRepaymentTypeChange={setRepaymentType}
            onFrequencyChange={setFrequency}
            onExtraRepaymentChange={setExtraRepayment}
            onHomeValueChange={setHomeValue}
            onHomeValueGrowthChange={setHomeValueGrowthPercent}
            onOffsetBalanceChange={setOffsetBalance}
            onMonthlyIncomeChange={setMonthlyIncome}
            onMonthlyExpensesChange={setMonthlyExpenses}
            onAdvancedOpenChange={setAdvancedOpen}
          />
        </section>

        <aside className="card card--summary" aria-label="Your repayment">
          <div className="summary__hero">
            <p className="summary__hero-label">Your repayment</p>
            <p className="summary__hero-value">
              {formatRepayment(result.totalPeriodRepayment)}
              <span className="summary__hero-unit">/ {FREQUENCY_ADVERBS[frequency]}</span>
            </p>
            <p className="summary__rate">
              <strong>{ratePercent}%</strong> p.a., {termYears} year term
            </p>
          </div>

          <div className="summary__tiles">
            <div className="tile">
              <p className="tile__label">Total repayments</p>
              <p className="tile__value">{formatCurrency(result.totalRepayments)}</p>
            </div>
            <div className="tile">
              <p className="tile__label">Total interest charged</p>
              <p className="tile__value">{formatCurrency(result.totalInterest)}</p>
            </div>
            {result.postInterestOnlyRepayment !== undefined && (
              <div className="tile tile--full">
                <p className="tile__label">
                  Repayments after interest only period ({FREQUENCY_ADVERBS[frequency]})
                </p>
                <p className="tile__value">{formatRepayment(result.postInterestOnlyRepayment)}</p>
              </div>
            )}
          </div>

          <button
            type="button"
            className="summary__cta"
            onClick={() => setAdvancedOpen(true)}
          >
            + Add extra repayments
          </button>

          {(extraRepayment > 0 || offsetBalance > 0 || monthlyIncome > 0 || interestOnly) && (
            <div className="summary__callouts">
              {extraRepayment > 0 && result.periodsSaved > 0 && (
                <p className="callout">
                  Paying an extra {formatCurrency(extraRepayment)} {FREQUENCY_ADVERBS[frequency]}{' '}
                  clears the loan {describeDuration(result.periodsSaved, periodsPerYear)} sooner
                  and saves {formatCurrency(result.interestSaved)} in interest.
                </p>
              )}

              {(offsetBalance > 0 || monthlyIncome > 0) &&
                result.offsetPeriodsSaved > 0 && (
                  <p className="callout">
                    Your offset account clears the loan{' '}
                    {describeDuration(result.offsetPeriodsSaved, periodsPerYear)} sooner and
                    saves {formatCurrency(result.offsetInterestSaved)} in interest.
                  </p>
                )}

              {interestOnly && (
                <p className="callout callout--muted">
                  Interest only repayments for the first {ioYears} year{ioYears === 1 ? '' : 's'}{' '}
                  don't reduce the principal.{' '}
                  {result.postInterestOnlyRepayment
                    ? 'After that, repayments switch to principal and interest for the rest of the term.'
                    : `The ${formatCurrency(amount)} borrowed is still owing at the end of the term.`}
                </p>
              )}
            </div>
          )}
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
            periodsPerYear={periodsPerYear}
            termYears={termYears}
            homeValue={homeValue}
            homeValueGrowthPercent={homeValueGrowthPercent}
            legend={
              interestOnly
                ? `Interest only ${ioYears} year${ioYears === 1 ? '' : 's'}, then principal and interest`
                : 'Principal and interest (Fixed)'
            }
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
