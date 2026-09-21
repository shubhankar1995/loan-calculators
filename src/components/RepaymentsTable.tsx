import { Fragment, useState } from 'react'
import { projectedHomeValue, type MonthlyBalance, type YearlyBalance } from '../lib/loan'
import {
  addMonths,
  formatCurrency,
  formatMonthYear,
  formatPercent,
  formatYear,
  parseISODate,
} from '../lib/format'

type Granularity = 'yearly' | 'monthly'

interface Row {
  key: number
  date: string
  year: number
  balance: number
  repayment: number
  offsetBalance: number
  projectedHomeValue: number
}

interface YearGroup {
  year: number
  rows: Row[]
}

interface Props {
  caption: string
  /** Date the loan starts, as an "yyyy-MM-dd" string, used to turn elapsed periods into calendar dates. */
  startDate: string
  yearlyBalances: YearlyBalance[]
  monthlyBalances: MonthlyBalance[]
  /** Home value used to show equity alongside the principal owing. Omit or zero to hide the column. */
  homeValue?: number
  /** Assumed annual growth in home value, compounded. */
  homeValueGrowthPercent?: number
  /**
   * Precomputed property value at each month (index 0 being the opening balance), overriding
   * the homeValue/growth projection — use when the value doesn't simply compound, e.g. ramping
   * up from a land price during construction.
   */
  propertyValues?: number[]
}

export function RepaymentsTable({
  caption,
  startDate,
  yearlyBalances,
  monthlyBalances,
  homeValue = 0,
  homeValueGrowthPercent = 0,
  propertyValues,
}: Props) {
  const [granularity, setGranularity] = useState<Granularity>('yearly')
  const [collapsedYears, setCollapsedYears] = useState<Set<number>>(new Set())
  const showEquity = propertyValues ? propertyValues.some((value) => value > 0) : homeValue > 0
  const start = parseISODate(startDate)

  const valueAt = (monthsElapsed: number): number =>
    propertyValues
      ? propertyValues[monthsElapsed] ?? 0
      : projectedHomeValue(homeValue, homeValueGrowthPercent, monthsElapsed / 12)

  const rows: Row[] =
    granularity === 'yearly'
      ? yearlyBalances.map((row) => {
          const date = addMonths(start, row.yearsElapsed * 12)
          return {
            key: row.yearsElapsed,
            date: formatYear(date),
            year: date.getFullYear(),
            balance: row.balance,
            repayment: row.repayment,
            offsetBalance: row.offsetBalance,
            projectedHomeValue: valueAt(row.yearsElapsed * 12),
          }
        })
      : monthlyBalances.map((row) => {
          const date = addMonths(start, row.monthsElapsed)
          return {
            key: row.monthsElapsed,
            date: formatMonthYear(date),
            year: date.getFullYear(),
            balance: row.balance,
            repayment: row.repayment,
            offsetBalance: row.offsetBalance,
            projectedHomeValue: valueAt(row.monthsElapsed),
          }
        })

  const showOffset = rows.some((row) => row.offsetBalance > 0)

  const yearGroups: YearGroup[] = []
  if (granularity === 'monthly') {
    for (const row of rows) {
      const lastGroup = yearGroups[yearGroups.length - 1]
      if (lastGroup && lastGroup.year === row.year) {
        lastGroup.rows.push(row)
      } else {
        yearGroups.push({ year: row.year, rows: [row] })
      }
    }
  }

  function toggleYear(year: number) {
    setCollapsedYears((prev) => {
      const next = new Set(prev)
      if (next.has(year)) next.delete(year)
      else next.add(year)
      return next
    })
  }

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
            <th scope="col">#</th>
            <th scope="col">{granularity === 'yearly' ? 'Year' : 'Month'}</th>
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
          {granularity === 'yearly'
            ? rows.map((row, index) => (
                <RepaymentRow
                  key={row.key}
                  number={index + 1}
                  row={row}
                  showOffset={showOffset}
                  showEquity={showEquity}
                />
              ))
            : yearGroups.map((group) => {
                const isCollapsed = collapsedYears.has(group.year)
                const summary = group.rows[group.rows.length - 1]
                const totalRepayment = group.rows.reduce((sum, row) => sum + row.repayment, 0)
                return (
                  <Fragment key={group.year}>
                    <tr
                      className="repayments-table__year-row"
                      onClick={() => toggleYear(group.year)}
                    >
                      <td colSpan={2} className="repayments-table__year-cell">
                        <span
                          className={`repayments-table__chevron${isCollapsed ? '' : ' is-expanded'}`}
                          aria-hidden="true"
                        >
                          &#9656;
                        </span>
                        {group.year}
                      </td>
                      <td className="numeric">{formatCurrency(totalRepayment)}</td>
                      <td className="numeric">{formatCurrency(summary.balance)}</td>
                      {showOffset && (
                        <td className="numeric">{formatCurrency(summary.offsetBalance)}</td>
                      )}
                      {showEquity && (
                        <td className="numeric">{formatCurrency(summary.projectedHomeValue)}</td>
                      )}
                      {showEquity && (
                        <td className="numeric">
                          {formatCurrency(summary.projectedHomeValue - summary.balance)}
                          <span className="repayments-table__percent">
                            {formatPercent(
                              (summary.projectedHomeValue - summary.balance) /
                                summary.projectedHomeValue,
                            )}
                          </span>
                        </td>
                      )}
                    </tr>
                    {!isCollapsed &&
                      group.rows.map((row) => (
                        <RepaymentRow
                          key={row.key}
                          number={row.key + 1}
                          row={row}
                          indent
                          showOffset={showOffset}
                          showEquity={showEquity}
                        />
                      ))}
                  </Fragment>
                )
              })}
        </tbody>
      </table>
      </div>
    </div>
  )
}

interface RepaymentRowProps {
  number: number
  row: Row
  showOffset: boolean
  showEquity: boolean
  indent?: boolean
}

function RepaymentRow({ number, row, showOffset, showEquity, indent }: RepaymentRowProps) {
  return (
    <tr>
      <td>{number}</td>
      <td className={indent ? 'repayments-table__month-cell' : undefined}>{row.date}</td>
      <td className="numeric">{formatCurrency(row.repayment)}</td>
      <td className="numeric">{formatCurrency(row.balance)}</td>
      {showOffset && <td className="numeric">{formatCurrency(row.offsetBalance)}</td>}
      {showEquity && <td className="numeric">{formatCurrency(row.projectedHomeValue)}</td>}
      {showEquity && (
        <td className="numeric">
          {formatCurrency(row.projectedHomeValue - row.balance)}
          <span className="repayments-table__percent">
            {formatPercent((row.projectedHomeValue - row.balance) / row.projectedHomeValue)}
          </span>
        </td>
      )}
    </tr>
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
