import { useMemo, useState } from 'react'
import { formatCurrency } from '../lib/format'

interface Props {
  /** Balance at the end of every period, index 0 being the opening balance. */
  balances: number[]
  periodsPerYear: number
  termYears: number
  legend: string
}

const WIDTH = 1000
const HEIGHT = 420
const PADDING = { top: 24, right: 24, bottom: 8, left: 8 }

export function RepaymentsChart({ balances, periodsPerYear, termYears, legend }: Props) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const { points, path, markers, maxBalance } = useMemo(() => {
    const max = Math.max(...balances, 1)
    const lastIndex = Math.max(balances.length - 1, 1)
    const plotWidth = WIDTH - PADDING.left - PADDING.right
    const plotHeight = HEIGHT - PADDING.top - PADDING.bottom

    const mapped = balances.map((balance, index) => ({
      index,
      balance,
      x: PADDING.left + (index / lastIndex) * plotWidth,
      y: PADDING.top + (1 - balance / max) * plotHeight,
    }))

    // Eight evenly spaced markers, landing exactly on both endpoints.
    const markerCount = Math.min(8, mapped.length)
    const markerPoints =
      markerCount < 2
        ? mapped
        : Array.from({ length: markerCount }, (_, i) =>
            mapped[Math.round((i / (markerCount - 1)) * lastIndex)],
          )

    return {
      points: mapped,
      path: mapped.map((point, i) => `${i === 0 ? 'M' : 'L'}${point.x} ${point.y}`).join(' '),
      markers: markerPoints,
      maxBalance: max,
    }
  }, [balances])

  const hovered = hoverIndex === null ? null : points[hoverIndex]

  const handleMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = (event.clientX - rect.left) / rect.width
    const index = Math.round(ratio * (points.length - 1))
    setHoverIndex(Math.min(Math.max(index, 0), points.length - 1))
  }

  return (
    <div className="chart">
      <p className="chart__max">{formatCurrency(maxBalance)}</p>
      <div className="chart__canvas">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`Principal remaining over ${termYears} years`}
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <path className="chart__line" d={path} vectorEffect="non-scaling-stroke" />
          {hovered && (
            <line
              className="chart__crosshair"
              x1={hovered.x}
              x2={hovered.x}
              y1={PADDING.top}
              y2={HEIGHT - PADDING.bottom}
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
        {markers.map((marker) => (
          <span
            key={marker.index}
            className="chart__marker"
            style={{ left: `${(marker.x / WIDTH) * 100}%`, top: `${(marker.y / HEIGHT) * 100}%` }}
          />
        ))}
        {hovered && (
          <div
            className="chart__tooltip"
            style={{ left: `${(hovered.x / WIDTH) * 100}%`, top: `${(hovered.y / HEIGHT) * 100}%` }}
          >
            <strong>{formatCurrency(hovered.balance)}</strong>
            <span>{formatYear(hovered.index, periodsPerYear)}</span>
          </div>
        )}
      </div>
      <div className="chart__axis">
        <span>Today</span>
        <span>{termYears} Years</span>
      </div>
      <p className="chart__legend">
        <span className="chart__legend-dot" />
        {legend}
      </p>
    </div>
  )
}

function formatYear(index: number, periodsPerYear: number): string {
  const years = index / periodsPerYear
  if (years < 1) return 'Today'
  const whole = Math.round(years * 10) / 10
  return `Year ${Number.isInteger(whole) ? whole : whole.toFixed(1)}`
}
