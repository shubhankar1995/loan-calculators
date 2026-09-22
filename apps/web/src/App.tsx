import { HomeLoanCalculator } from './HomeLoanCalculator'
import { HouseAndLandCalculator } from './HouseAndLandCalculator'
import { usePersistentState } from './hooks/usePersistentState'

type Calculator = 'home' | 'house-and-land'

const CALCULATOR_KEY = 'repayly:calculator'

/** Stored as the bare tab name, so there is no JSON envelope to read back. */
const parseCalculator = (raw: string | null): Calculator =>
  raw === 'house-and-land' ? 'house-and-land' : 'home'

const serialiseCalculator = (calculator: Calculator) => calculator

export default function App() {
  const [calculator, setCalculator] = usePersistentState(
    CALCULATOR_KEY,
    parseCalculator,
    serialiseCalculator,
  )

  return (
    <div className="page">
      <main className="calculator">
        <div className="site-header">
          <div className="brand">
            <CurveMark />
            <span className="brand__name">
              Repay<span className="brand__name-accent">ly</span>
            </span>
            <span className="brand__tagline">Repayments, modelled properly</span>
          </div>

          <nav className="page-tabs" role="tablist" aria-label="Choose a calculator">
            <PageTabButton
              active={calculator === 'home'}
              onClick={() => setCalculator('home')}
            >
              Home Loan Repayment
            </PageTabButton>
            <PageTabButton
              active={calculator === 'house-and-land'}
              onClick={() => setCalculator('house-and-land')}
            >
              House and Land Package Loan Repayment
            </PageTabButton>
          </nav>
        </div>

        {calculator === 'home' ? <HomeLoanCalculator /> : <HouseAndLandCalculator />}
      </main>
    </div>
  )
}

function CurveMark() {
  return (
    <svg
      className="brand__mark"
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="32" height="32" rx="7" fill="currentColor" />
      <path
        d="M6 25h20"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.45"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M7 7.5C14 10.5 18 15 20.5 21"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <circle cx="21.5" cy="23.2" r="3.1" fill="#ffffff" />
    </svg>
  )
}

interface PageTabButtonProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}

function PageTabButton({ active, onClick, children }: PageTabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      className={`page-tabs__button${active ? ' is-active' : ''}`}
      aria-selected={active}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
