import type { YearlyBalance } from '../lib/loan'
import { formatCurrency } from '../lib/format'

interface Props {
  caption: string
  rows: YearlyBalance[]
}

export function RepaymentsTable({ caption, rows }: Props) {
  return (
    <div className="panel">
      <div className="panel__header">{caption}</div>
      <table className="repayments-table">
        <thead>
          <tr>
            <th scope="col">Years remaining</th>
            <th scope="col" className="numeric">
              Principal remaining
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.yearsElapsed}>
              <td>{row.yearsRemaining}</td>
              <td className="numeric">{formatCurrency(row.balance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
