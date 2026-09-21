import { useState } from 'react'
import { projectedHomeValue, type MonthlyBalance, type YearlyBalance } from '../lib/loan'
import { formatCurrency, formatPercent } from '../lib/format'

type Granularity = 'yearly' | 'monthly'

interface Props {
  caption: string
  yearlyBalances: YearlyBalance[]
  monthlyBalances: MonthlyBalance[]
  /** Home value used to show equity alongside the principal owing. Omit or zero to hide the column. */
  homeValue?: number
  /** Assumed annual growth in home value, compounded. */
  homeValueGrowthPercent?: number
}

export function RepaymentsTable({
  caption,
  yearlyBalances,
  monthlyBalances,
  homeValue = 0,
  homeValueGrowthPercent = 0,
}: Props) {
  const [granularity, setGranularity] = useState<Granularity>('yearly')
  const showEquity = homeValue > 0

  const rows =
    granularity === 'yearly'
      ? yearlyBalances.map((row) => ({
          key: row.yearsElapsed,
          remaining: row.yearsRemaining,
          balance: row.balance,
          repayment: row.repayment,
          offsetBalance: row.offsetBalance,
          projectedHomeValue: projectedHomeValue(homeValue, homeValueGrowthPercent, row.yearsElapsed),
        }))
      : monthlyBalances.map((row) => ({
          key: row.monthsElapsed,
          remaining: row.monthsRemaining,
          balance: row.balance,
          repayment: row.repayment,
          offsetBalance: row.offsetBalance,
          projectedHomeValue: projectedHomeValue(
            homeValue,
            homeValueGrowthPercent,
            row.monthsElapsed / 12,
          ),
        }))

  const showOffset = rows.some((row) => row.offsetBalance > 0)

  return (
    <div>
      <div className="chart__header">
        <p className="chart__title">{caption}</p>
        <div className="tabs" role="tablist">
          <GranularityButton
            active={granularity === 'yearly'}
            onClick={() => setGranularity('yearly')}
          >
            Yearly
          </GranularityButton>
          <GranularityButton
            active={granularity === 'monthly'}
            onClick={() => setGranularity('monthly')}
          >
            Monthly
          </GranularityButton>
        </div>
      </div>
      <div className="table-wrap">
      <table className="repayments-table">
        <thead>
          <tr>
            <th scope="col">{granularity === 'yearly' ? 'Years remaining' : 'Months remaining'}</th>
            <th scope="col" className="numeric">
              {granularity === 'yearly' ? 'Paid that year' : 'Paid that month'}
            </th>
            <th scope="col" className="numeric">
              Principal remaining
            </th>
            {showOffset && (
              <th scope="col" className="numeric">
                Offset balance
              </th>
            )}
            {showEquity && (
              <th scope="col" className="numeric">
                Est. home value
              </th>
            )}
            {showEquity && (
              <th scope="col" className="numeric">
                Equity
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td>{row.remaining}</td>
              <td className="numeric">{formatCurrency(row.repayment)}</td>
              <td className="numeric">{formatCurrency(row.balance)}</td>
              {showOffset && (
                <td className="numeric">{formatCurrency(row.offsetBalance)}</td>
              )}
              {showEquity && (
                <td className="numeric">{formatCurrency(row.projectedHomeValue)}</td>
              )}
              {showEquity && (
                <td className="numeric">
                  {formatCurrency(row.projectedHomeValue - row.balance)}
                  <span className="repayments-table__percent">
                    {formatPercent((row.projectedHomeValue - row.balance) / row.projectedHomeValue)}
                  </span>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}

interface GranularityButtonProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}

function GranularityButton({ active, onClick, children }: GranularityButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      className={`tabs__button${active ? ' is-active' : ''}`}
      onClick={onClick}
      aria-selected={active}
    >
      {children}
    </button>
  )
}
