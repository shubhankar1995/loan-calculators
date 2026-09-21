import { Fragment, useState } from 'react'
import { type MonthlyBalance } from '../lib/loan'
import { addMonths, formatCurrency, formatMonthYear, parseISODate } from '../lib/format'

interface Row {
  key: number
  date: string
  year: number
  balance: number
  repayment: number
  offsetBalance: number
}

interface YearGroup {
  year: number
  rows: Row[]
}

interface Props {
  caption: string
  /** Date the loan starts, as an "yyyy-MM-dd" string, used to turn elapsed periods into calendar dates. */
  startDate: string
  monthlyBalances: MonthlyBalance[]
}

export function RepaymentsTable({ caption, startDate, monthlyBalances }: Props) {
  const start = parseISODate(startDate)

  const rows: Row[] = monthlyBalances.map((row) => {
    const date = addMonths(start, row.monthsElapsed)
    return {
      key: row.monthsElapsed,
      date: formatMonthYear(date),
      year: date.getFullYear(),
      balance: row.balance,
      repayment: row.repayment,
      offsetBalance: row.offsetBalance,
    }
  })

  const showOffset = rows.some((row) => row.offsetBalance > 0)

  const yearGroups: YearGroup[] = []
  for (const row of rows) {
    const lastGroup = yearGroups[yearGroups.length - 1]
    if (lastGroup && lastGroup.year === row.year) {
      lastGroup.rows.push(row)
    } else {
      yearGroups.push({ year: row.year, rows: [row] })
    }
  }

  const [collapsedYears, setCollapsedYears] = useState<Set<number>>(
    () => new Set(yearGroups.map((group) => group.year)),
  )

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
      </div>
      <div className="table-wrap">
      <table className="repayments-table">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Month</th>
            <th scope="col" className="numeric">
              Paid that month
            </th>
            <th scope="col" className="numeric">
              Principal remaining
            </th>
            {showOffset && (
              <th scope="col" className="numeric">
                Offset balance
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {yearGroups.map((group, groupIndex) => {
                const isCollapsed = collapsedYears.has(group.year)
                const summary = group.rows[group.rows.length - 1]
                const totalRepayment = group.rows.reduce((sum, row) => sum + row.repayment, 0)
                return (
                  <Fragment key={group.year}>
                    <tr
                      className="repayments-table__year-row"
                      onClick={() => toggleYear(group.year)}
                    >
                      <td>{groupIndex + 1}</td>
                      <td className="repayments-table__year-cell">
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
                    </tr>
                    {!isCollapsed &&
                      group.rows.map((row) => (
                        <RepaymentRow
                          key={row.key}
                          number={row.key + 1}
                          row={row}
                          indent
                          showOffset={showOffset}
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
  indent?: boolean
}

function RepaymentRow({ number, row, showOffset, indent }: RepaymentRowProps) {
  return (
    <tr>
      <td>{number}</td>
      <td className={indent ? 'repayments-table__month-cell' : undefined}>{row.date}</td>
      <td className="numeric">{formatCurrency(row.repayment)}</td>
      <td className="numeric">{formatCurrency(row.balance)}</td>
      {showOffset && <td className="numeric">{formatCurrency(row.offsetBalance)}</td>}
    </tr>
  )
}
