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
