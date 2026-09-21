import { useState } from 'react'
import type { MonthlyBalance, YearlyBalance } from '../lib/loan'
import { formatCurrency } from '../lib/format'

type Granularity = 'yearly' | 'monthly'

interface Props {
  caption: string
  yearlyBalances: YearlyBalance[]
  monthlyBalances: MonthlyBalance[]
  /** Assumed constant home value, used to show equity alongside the principal owing. Omit or zero to hide the column. */
  homeValue?: number
}

export function RepaymentsTable({
  caption,
  yearlyBalances,
  monthlyBalances,
  homeValue = 0,
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
        }))
      : monthlyBalances.map((row) => ({
          key: row.monthsElapsed,
          remaining: row.monthsRemaining,
          balance: row.balance,
          repayment: row.repayment,
        }))

  return (
    <div className="panel">
      <div className="panel__header">{caption}</div>
      <div className="panel__toggle">
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
              {showEquity && (
                <td className="numeric">{formatCurrency(homeValue - row.balance)}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
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
      className={`panel__toggle-button${active ? ' is-active' : ''}`}
      onClick={onClick}
      aria-pressed={active}
    >
      {children}
    </button>
  )
}
