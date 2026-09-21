import { useMemo, useState } from 'react'
import { LoanInputs } from './components/LoanInputs'
import { RepaymentsChart } from './components/RepaymentsChart'
import { RepaymentsTable } from './components/RepaymentsTable'
import {
  FREQUENCY_ADVERBS,
  FREQUENCY_LABELS,
  PERIODS_PER_YEAR,
  calculateLoan,
  interestOnlyYears,
  type Frequency,
  type RepaymentType,
} from './lib/loan'
import {
  describeDuration,
  formatCurrency,
  formatNumber,
  formatRepayment,
  parseNumber,
} from './lib/format'

type View = 'table' | 'graph'

export default function App() {
  const [amount, setAmount] = useState(1128000)
  const [termYears, setTermYears] = useState(30)
  const [ratePercent, setRatePercent] = useState(6.29)
  const [repaymentType, setRepaymentType] = useState<RepaymentType>('principal-and-interest')
  const [frequency, setFrequency] = useState<Frequency>('monthly')
  const [extraRepayment, setExtraRepayment] = useState(0)
  const [homeValue, setHomeValue] = useState(0)
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
      }),
    [amount, termYears, ratePercent, repaymentType, frequency, extraRepayment],
  )

  const periodsPerYear = PERIODS_PER_YEAR[frequency]
  const ioYears = interestOnlyYears(repaymentType)
  const interestOnly = ioYears > 0
  const repaymentLabel = interestOnly
    ? 'Interest only repayments'
    : 'Principal and interest repayments'
  const caption = `Interest rate ${ratePercent}% with ${FREQUENCY_ADVERBS[frequency]} ${
    interestOnly ? 'interest only' : 'principal and interest'
  } repayments of ${formatRepayment(result.totalPeriodRepayment)}`

  return (
    <div className="page">
      <main className="calculator">
        <h1 className="visually-hidden">Loan repayment calculator</h1>

        <LoanInputs
          amount={amount}
          termYears={termYears}
          ratePercent={ratePercent}
          repaymentType={repaymentType}
          onAmountChange={setAmount}
          onTermChange={setTermYears}
          onRateChange={setRatePercent}
          onRepaymentTypeChange={setRepaymentType}
        />

        <h2 className="section-title">Your {FREQUENCY_ADVERBS[frequency]} repayments</h2>

        <div className="stats">
          <div className="stat stat--hero">
            <p className="stat__label">{repaymentLabel}</p>
            <p className="stat__value">{formatRepayment(result.totalPeriodRepayment)}</p>
          </div>
          <div className="stat stat--hero">
            <p className="stat__label">Interest rate</p>
            <p className="stat__value">
              {ratePercent}
              <span className="stat__unit">% p.a</span>
            </p>
          </div>

          <div className="stat">
            <p className="stat__label">Total loan repayments</p>
            <p className="stat__amount">{formatCurrency(result.totalRepayments)}</p>
          </div>
          <div className="stat">
            <p className="stat__label">Total interest charged</p>
            <p className="stat__amount">{formatCurrency(result.totalInterest)}</p>
          </div>
          {result.postInterestOnlyRepayment !== undefined && (
            <div className="stat">
              <p className="stat__label">
                Repayments after interest only period ({FREQUENCY_ADVERBS[frequency]})
              </p>
              <p className="stat__amount">{formatRepayment(result.postInterestOnlyRepayment)}</p>
            </div>
          )}

          <div className="stat">
            <label className="stat__label" htmlFor="frequency">
              Repayment frequency
            </label>
            <div className="select-wrap">
              <select
                id="frequency"
                className="control"
                value={frequency}
                onChange={(event) => setFrequency(event.target.value as Frequency)}
              >
                {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="stat">
            <label className="stat__label" htmlFor="extra">
              Additional repayments
            </label>
            <div className="control control--prefixed">
              <span className="control__prefix">$</span>
              <input
                id="extra"
                inputMode="numeric"
                value={formatNumber(extraRepayment)}
                onChange={(event) => setExtraRepayment(parseNumber(event.target.value))}
              />
            </div>
          </div>
          <div className="stat">
            <label className="stat__label" htmlFor="home-value">
              Home value (for equity)
            </label>
            <div className="control control--prefixed">
              <span className="control__prefix">$</span>
              <input
                id="home-value"
                inputMode="numeric"
                value={formatNumber(homeValue)}
                onChange={(event) => setHomeValue(parseNumber(event.target.value))}
              />
            </div>
          </div>
        </div>

        {extraRepayment > 0 && result.periodsSaved > 0 && (
          <p className="callout">
            Paying an extra {formatCurrency(extraRepayment)} {FREQUENCY_ADVERBS[frequency]} clears
            the loan {describeDuration(result.periodsSaved, periodsPerYear)} sooner and saves{' '}
            {formatCurrency(result.interestSaved)} in interest.
          </p>
        )}

        {interestOnly && (
          <p className="callout callout--muted">
            Interest only repayments for the first {ioYears} year{ioYears === 1 ? '' : 's'} don't
            reduce the principal.{' '}
            {result.postInterestOnlyRepayment
              ? 'After that, repayments switch to principal and interest for the rest of the term.'
              : `The ${formatCurrency(amount)} borrowed is still owing at the end of the term.`}
          </p>
        )}

        <div className="view-toggle">
          <ToggleLink active={view === 'graph'} onClick={() => setView('graph')}>
            Show repayments graph
          </ToggleLink>
          <span className="view-toggle__divider" aria-hidden="true">
            |
          </span>
          <ToggleLink active={view === 'table'} onClick={() => setView('table')}>
            Show repayments table
          </ToggleLink>
        </div>

        {view === 'graph' ? (
          <RepaymentsChart
            balances={result.balances}
            periodsPerYear={periodsPerYear}
            termYears={termYears}
            legend={
              interestOnly
                ? `Interest only ${ioYears} year${ioYears === 1 ? '' : 's'}, then principal and interest`
                : 'Principal and interest (Fixed)'
            }
          />
        ) : (
          <RepaymentsTable
            caption={caption}
            yearlyBalances={result.yearlyBalances}
            monthlyBalances={result.monthlyBalances}
            homeValue={homeValue}
          />
        )}
      </main>
    </div>
  )
}

interface ToggleLinkProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}

/** The currently shown view is inert and greyed out; the other is a link. */
function ToggleLink({ active, onClick, children }: ToggleLinkProps) {
  return (
    <button
      type="button"
      className={`view-toggle__button${active ? ' is-active' : ''}`}
      onClick={onClick}
      aria-pressed={active}
    >
      {children}
    </button>
  )
}
