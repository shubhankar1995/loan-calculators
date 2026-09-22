/** Multipliers, in ascending order, that make for a readable gridline step. */
const NICE_STEPS = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]

export interface AxisScale {
  /** The value the top gridline sits at, always >= the data's maximum. */
  max: number
  /** Tick values from `max` down to 0, one per gridline. */
  ticks: number[]
  step: number
}

/**
 * Rounds a value axis up to the next "nice" step so the gridline labels read as
 * round numbers ($300k, $600k, ...) instead of arbitrary fractions of the data's
 * maximum, and the topmost series is never drawn hard against the plot's edge.
 */
export function axisScale(dataMax: number, steps = 5): AxisScale {
  const safeMax = Number.isFinite(dataMax) && dataMax > 0 ? dataMax : 1
  const magnitude = 10 ** Math.floor(Math.log10(safeMax / steps))
  const step =
    NICE_STEPS.map((multiplier) => multiplier * magnitude).find(
      (candidate) => candidate * steps >= safeMax,
    ) ?? magnitude * 10
  const max = step * steps

  return {
    max,
    step,
    ticks: Array.from({ length: steps + 1 }, (_, index) => max - index * step),
  }
}

/**
 * Year positions to label along a time axis: 0 and `termYears` always, plus
 * interior ticks on a round year interval, capped so the labels can't crowd.
 */
export function axisYearTicks(termYears: number, maxIntervals = 3): number[] {
  const term = Math.max(Math.round(termYears), 1)
  const interval =
    [1, 2, 5, 10, 15, 20, 25].find((candidate) => term / candidate <= maxIntervals) ?? term
  const ticks: number[] = [0]
  for (let year = interval; year < term; year += interval) ticks.push(year)
  ticks.push(term)
  // Drop an interior tick sitting almost on top of the end label.
  return ticks.filter((year, index) => index === 0 || year === term || term - year > interval / 2)
}
