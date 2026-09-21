# Loan repayment calculator

A React + TypeScript loan repayment calculator (Vite). Enter a loan amount, term,
repayment type and interest rate to see the repayment, the total cost of the loan,
and how the principal is paid down — as either a graph or a year-by-year table.

## Running it

```bash
npm install
npm run dev
```

| Script          | What it does                          |
| --------------- | ------------------------------------- |
| `npm run dev`   | Dev server on http://localhost:5173   |
| `npm run build` | Typecheck and build to `dist/`        |
| `npm test`      | Unit tests for the repayment maths    |
| `npm run lint`  | oxlint                                |

## How the numbers are worked out

Repayments use the standard amortisation formula, with the annual rate divided by
the number of repayments per year (weekly 52, fortnightly 26, monthly 12):

```
repayment = P · r · (1 + r)^n / ((1 + r)^n − 1)
```

The schedule is then built period by period — interest is charged on the opening
balance, the rest of the repayment reduces the principal — so totals, the payoff
date and the balance chart all come from one amortisation run rather than from
separate closed-form approximations.

- **Interest only** repayments cover the interest alone, so the principal is still
  owing at the end of the term and is repaid as a balloon. It's included in the
  total repayments figure.
- **Additional repayments** are applied on top of every scheduled repayment,
  clearing the loan early; the app shows the time and interest saved.
- Headline repayments are rounded up to the whole dollar, the way a lender quotes
  them. Totals use the unrounded figures.

The maths lives in [`src/lib/loan.ts`](src/lib/loan.ts) and is covered by
[`src/lib/loan.test.ts`](src/lib/loan.test.ts).
