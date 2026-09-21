import { useState } from 'react'
import { HomeLoanCalculator } from './HomeLoanCalculator'
import { HouseAndLandCalculator } from './HouseAndLandCalculator'

type Calculator = 'home' | 'house-and-land'

export default function App() {
  const [calculator, setCalculator] = useState<Calculator>('home')

  return (
    <div className="page">
      <main className="calculator">
        <div className="site-header">
          <div className="brand">
            <FlaskMark />
            <span className="brand__name">
              Loan<span className="brand__name-accent">Lab</span>
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

function FlaskMark() {
  return (
    <svg
      className="brand__mark"
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="32" height="32" rx="7" fill="currentColor" />
      <g
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M13 6v7.6L7.7 23.1A2.2 2.2 0 0 0 9.6 26.4h12.8a2.2 2.2 0 0 0 1.9-3.3L19 13.6V6" />
        <path d="M11.2 18.4h9.6" />
        <path d="M11.5 5.6h9" />
      </g>
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
