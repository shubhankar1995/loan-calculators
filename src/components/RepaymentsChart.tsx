import { useMemo, useState } from 'react'
import { projectedHomeValue } from '../lib/loan'
import { formatCurrency } from '../lib/format'

interface Props {
  /** Balance at the end of every period, index 0 being the opening balance. */
  balances: number[]
  periodsPerYear: number
  termYears: number
  legend: string
  /** Home value used to plot equity alongside the principal owing. Omit or zero to hide the line. */
  homeValue?: number
  /** Assumed annual growth in home value, compounded. */
  homeValueGrowthPercent?: number
}

const WIDTH = 1000
const HEIGHT = 420
const PADDING = { top: 24, right: 24, bottom: 8, left: 8 }

export function RepaymentsChart({
  balances,
  periodsPerYear,
  termYears,
  legend,
  homeValue = 0,
  homeValueGrowthPercent = 0,
}: Props) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const showEquity = homeValue > 0

  const { points, path, markers, equityPoints, equityPath, equityMarkers, maxValue } = useMemo(() => {
    const equity = showEquity
      ? balances.map(
          (balance, index) =>
            projectedHomeValue(homeValue, homeValueGrowthPercent, index / periodsPerYear) -
            balance,
        )
      : []
    const max = Math.max(...balances, ...equity, 1)
    const lastIndex = Math.max(balances.length - 1, 1)
    const plotWidth = WIDTH - PADDING.left - PADDING.right
    const plotHeight = HEIGHT - PADDING.top - PADDING.bottom

    const toPoint = (value: number, index: number) => ({
      index,
      value,
      x: PADDING.left + (index / lastIndex) * plotWidth,
      y: PADDING.top + (1 - value / max) * plotHeight,
    })

    const mapped = balances.map((balance, index) => toPoint(balance, index))
    const equityMapped = equity.map((value, index) => toPoint(value, index))

    // Eight evenly spaced markers, landing exactly on both endpoints.
    const markerCount = Math.min(8, mapped.length)
    const markerIndexes =
      markerCount < 2
        ? mapped.map((point) => point.index)
        : Array.from({ length: markerCount }, (_, i) =>
            Math.round((i / (markerCount - 1)) * lastIndex),
          )

    const toPath = (mappedPoints: typeof mapped) =>
      mappedPoints.map((point, i) => `${i === 0 ? 'M' : 'L'}${point.x} ${point.y}`).join(' ')

    return {
      points: mapped,
      path: toPath(mapped),
      markers: markerIndexes.map((i) => mapped[i]),
      equityPoints: equityMapped,
      equityPath: toPath(equityMapped),
      equityMarkers: markerIndexes.map((i) => equityMapped[i]),
      maxValue: max,
    }
  }, [balances, homeValue, homeValueGrowthPercent, periodsPerYear, showEquity])

  const hovered = hoverIndex === null ? null : points[hoverIndex]
  const hoveredEquity = hoverIndex === null || !showEquity ? null : equityPoints[hoverIndex]

  const handleMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = (event.clientX - rect.left) / rect.width
    const index = Math.round(ratio * (points.length - 1))
    setHoverIndex(Math.min(Math.max(index, 0), points.length - 1))
  }

  return (
    <div className="chart">
      <p className="chart__max">{formatCurrency(maxValue)}</p>
      <div className="chart__canvas">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={
            showEquity
              ? `Principal remaining and equity over ${termYears} years`
              : `Principal remaining over ${termYears} years`
          }
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <path className="chart__line" d={path} vectorEffect="non-scaling-stroke" />
          {showEquity && (
            <path
              className="chart__line chart__line--equity"
              d={equityPath}
              vectorEffect="non-scaling-stroke"
            />
          )}
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
        {showEquity &&
          equityMarkers.map((marker) => (
            <span
              key={marker.index}
              className="chart__marker chart__marker--equity"
              style={{ left: `${(marker.x / WIDTH) * 100}%`, top: `${(marker.y / HEIGHT) * 100}%` }}
            />
          ))}
        {hovered && (
          <div
            className="chart__tooltip"
            style={{ left: `${(hovered.x / WIDTH) * 100}%`, top: `${(hovered.y / HEIGHT) * 100}%` }}
          >
            <strong>{formatCurrency(hovered.value)}</strong>
            {hoveredEquity && (
              <strong className="chart__tooltip-equity">
                {formatCurrency(hoveredEquity.value)} equity
              </strong>
            )}
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
      {showEquity && (
        <p className="chart__legend">
          <span className="chart__legend-dot chart__legend-dot--equity" />
          Equity{' '}
          {homeValueGrowthPercent > 0
            ? `(assumes the home value grows ${homeValueGrowthPercent}% a year)`
            : '(assumes a constant home value)'}
        </p>
      )}
    </div>
  )
}

function formatYear(index: number, periodsPerYear: number): string {
  const years = index / periodsPerYear
  if (years < 1) return 'Today'
  const whole = Math.round(years * 10) / 10
  return `Year ${Number.isInteger(whole) ? whole : whole.toFixed(1)}`
}
