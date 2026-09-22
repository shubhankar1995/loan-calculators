# Repayly

Repayments, modelled properly.

A loan calculator with two modes, available as a web app and an iOS app:

- **Home Loan Repayment** — enter a loan amount, term, repayment type and interest
  rate to see the repayment, the total cost of the loan, and how the principal is
  paid down, as either a graph or a year-by-year table.
- **House and Land Package** — model a build stage by stage, with progressive
  drawdown, interest-only repayments during construction, and the switch to
  principal and interest at handover.

## Layout

This is an npm workspaces monorepo. The repayment maths lives in one package and
both apps import it, so a fix to the amortisation schedule lands on web and iOS at
the same time.

| Workspace                            | What it is                                        |
| ------------------------------------ | ------------------------------------------------- |
| [`packages/core`](packages/core)      | The repayment maths and formatters, plus its tests |
| [`apps/web`](apps/web)                | React + Vite web app                               |
| [`apps/mobile`](apps/mobile)          | Expo (React Native) iOS app                        |

## Running it

```bash
npm install
```

| Script           | What it does                                    |
| ---------------- | ----------------------------------------------- |
| `npm run dev`    | Web dev server on http://localhost:5173         |
| `npm run build`  | Typecheck and build the web app to `apps/web/dist` |
| `npm run ios`    | Start Metro and open the iOS app in the Simulator |
| `npm test`       | Unit tests for the repayment maths               |
| `npm run lint`   | oxlint over the web app                          |

The iOS app needs Xcode and a compiled build the first time:

```bash
npm run ios --workspace @repayly/mobile
```

See [`apps/mobile/README.md`](apps/mobile/README.md) for the details.

## Saved details

Both apps remember what you typed, so the form is already filled in next time you
open them — `localStorage` on web, `AsyncStorage` on iOS. Each calculator is stored
under its own key, and the web app also remembers which of the two you had open.
There's a "Reset to defaults" control at the foot of each form.

Nothing leaves the device: there is no account, no sync and no server.

The stored shape, its defaults and the parsers live in
[`packages/core/src/settings.ts`](packages/core/src/settings.ts), so both apps agree
on what a saved form looks like. Reads are defensive — a payload that is corrupt,
hand-edited or written by an older build falls back to the defaults field by field
rather than breaking the form. `SETTINGS_VERSION` discards anything written against
an incompatible shape.

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

The maths lives in [`packages/core/src/loan.ts`](packages/core/src/loan.ts) and is
covered by [`packages/core/src/loan.test.ts`](packages/core/src/loan.test.ts).
