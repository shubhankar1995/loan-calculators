import {
  axisScale,
  axisYearTicks,
  formatCompactCurrency,
  formatCurrency,
  projectedHomeValue,
} from '@repayly/core';
import { useId, useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  /** Balance at the end of every period, index 0 being the opening balance. */
  balances: number[];
  periodsPerYear: number;
  termYears: number;
  legend: string;
  /** Home value used to plot equity alongside the principal owing. Omit or zero to hide the line. */
  homeValue?: number;
  homeValueGrowthPercent?: number;
  /** Precomputed property value per period, overriding the homeValue/growth projection. */
  propertyValues?: number[];
  /** Overrides the auto-generated home value legend caption. */
  homeValueLegend?: string;
}

const HEIGHT = 268;
/** Left gutter reserved for the value labels, so no label ever sits over a line. */
const Y_AXIS_WIDTH = 52;
/** Bottom strip reserved for the year labels. */
const X_AXIS_HEIGHT = 22;
const PLOT_INSET = { top: 18, right: 14 };
const GRIDLINE_STEPS = 5;

export function BalanceChart({
  balances,
  periodsPerYear,
  termYears,
  legend,
  homeValue = 0,
  homeValueGrowthPercent = 0,
  propertyValues,
  homeValueLegend,
}: Props) {
  const theme = useTheme();
  // Gradient ids are global to the SVG renderer, so scope this one to the instance —
  // both calculator tabs can have a chart mounted at once.
  const washId = `owing-wash-${useId()}`;
  const [width, setWidth] = useState(0);
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);
  const showEquity = propertyValues ? propertyValues.some((value) => value > 0) : homeValue > 0;

  const chart = useMemo(() => {
    const homeValues = showEquity
      ? balances.map((_balance, index) =>
          propertyValues
            ? (propertyValues[index] ?? 0)
            : projectedHomeValue(homeValue, homeValueGrowthPercent, index / periodsPerYear),
        )
      : [];
    const equity = homeValues.map((value, index) => value - balances[index]);
    const scale = axisScale(Math.max(...balances, ...homeValues, 1), GRIDLINE_STEPS);
    const lastIndex = Math.max(balances.length - 1, 1);
    const plotLeft = Y_AXIS_WIDTH;
    const plotRight = Math.max(width - PLOT_INSET.right, plotLeft + 1);
    const plotWidth = plotRight - plotLeft;
    const plotBottom = HEIGHT - X_AXIS_HEIGHT;
    const plotHeight = plotBottom - PLOT_INSET.top;

    const toX = (index: number) => plotLeft + (index / lastIndex) * plotWidth;
    const toY = (value: number) => PLOT_INSET.top + (1 - value / scale.max) * plotHeight;
    const toPath = (values: number[]) => {
      const points = dropCollinear(values.map((value, index) => ({ x: toX(index), y: toY(value) })));
      return points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`).join(' ');
    };

    return {
      scale,
      lastIndex,
      plotLeft,
      plotRight,
      plotBottom,
      toX,
      toY,
      balancePath: toPath(balances),
      // Closed back along the baseline so the line can carry a soft wash beneath it.
      balanceArea: `${toPath(balances)} L${toX(lastIndex)} ${toY(0)} L${toX(0)} ${toY(0)} Z`,
      homeValuePath: showEquity ? toPath(homeValues) : '',
      equityPath: showEquity ? toPath(equity) : '',
      homeValues,
      equity,
    };
  }, [
    balances,
    homeValue,
    homeValueGrowthPercent,
    periodsPerYear,
    propertyValues,
    showEquity,
    width,
  ]);

  const yearTicks = useMemo(() => axisYearTicks(termYears), [termYears]);

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  // Keep the latest geometry in a ref: PanResponder is created once, but the
  // handlers need the current width and series length.
  const scrubState = useRef({ width, lastIndex: chart.lastIndex });
  scrubState.current = { width, lastIndex: chart.lastIndex };

  const responder = useRef(
    PanResponder.create({
      // Only claim the gesture once it's clearly horizontal, so a vertical drag
      // over the chart still scrolls the page.
      onMoveShouldSetPanResponder: (_event, gesture) =>
        Math.abs(gesture.dx) > Math.abs(gesture.dy) && Math.abs(gesture.dx) > 4,
      onPanResponderGrant: (event) => scrub(event),
      onPanResponderMove: (event) => scrub(event),
      onPanResponderRelease: () => setScrubIndex(null),
      onPanResponderTerminate: () => setScrubIndex(null),
    }),
  ).current;

  function scrub(event: GestureResponderEvent) {
    const { width: boxWidth, lastIndex } = scrubState.current;
    if (boxWidth <= 0) return;
    const usable = boxWidth - PLOT_INSET.right - Y_AXIS_WIDTH;
    if (usable <= 0) return;
    const ratio = (event.nativeEvent.locationX - Y_AXIS_WIDTH) / usable;
    const index = Math.round(ratio * lastIndex);
    setScrubIndex(Math.min(Math.max(index, 0), lastIndex));
  }

  const series = [
    { key: 'owing', color: theme.seriesOwing, label: 'Owing', values: balances },
    ...(showEquity
      ? [
          {
            key: 'homeValue',
            color: theme.seriesHomeValue,
            label: 'Home value',
            values: chart.homeValues,
          },
          { key: 'equity', color: theme.seriesEquity, label: 'Equity', values: chart.equity },
        ]
      : []),
  ];

  return (
    <View style={styles.container}>
      <View
        style={[styles.plot, { backgroundColor: theme.surfaceAlt, borderColor: theme.lineSoft }]}
        onLayout={onLayout}
        {...responder.panHandlers}>
        {width > 0 ? (
          <Svg width={width} height={HEIGHT}>
            <Defs>
              <LinearGradient id={washId} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={theme.seriesOwing} stopOpacity={0.16} />
                <Stop offset="1" stopColor={theme.seriesOwing} stopOpacity={0} />
              </LinearGradient>
            </Defs>

            {chart.scale.ticks.map((tick) => (
              <Line
                key={tick}
                x1={chart.plotLeft}
                x2={chart.plotRight}
                y1={chart.toY(tick)}
                y2={chart.toY(tick)}
                stroke={tick === 0 ? theme.line : theme.lineSoft}
                strokeWidth={tick === 0 ? 1 : StyleSheet.hairlineWidth}
              />
            ))}

            <Path d={chart.balanceArea} fill={`url(#${washId})`} />

            {showEquity ? (
              <>
                {/* Dashed because it's a projection, not a schedule — and it keeps the
                    line readable against the equity line for colour-blind readers. */}
                <Path
                  d={chart.homeValuePath}
                  stroke={theme.seriesHomeValue}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  strokeLinecap="round"
                  fill="none"
                />
                <Path
                  d={chart.equityPath}
                  stroke={theme.seriesEquity}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  fill="none"
                />
              </>
            ) : null}

            <Path
              d={chart.balancePath}
              stroke={theme.seriesOwing}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
              fill="none"
            />

            {/* End caps, so each line resolves to a point instead of fading into the edge. */}
            {scrubIndex === null
              ? series.map((item) => (
                  <Circle
                    key={item.key}
                    cx={chart.toX(chart.lastIndex)}
                    cy={chart.toY(item.values[chart.lastIndex] ?? 0)}
                    r={4}
                    fill={item.color}
                    stroke={theme.surfaceAlt}
                    strokeWidth={2}
                  />
                ))
              : null}

            {scrubIndex !== null ? (
              <>
                <Line
                  x1={chart.toX(scrubIndex)}
                  x2={chart.toX(scrubIndex)}
                  y1={PLOT_INSET.top}
                  y2={chart.plotBottom}
                  stroke={theme.muted}
                  strokeWidth={1}
                  opacity={0.45}
                />
                {series.map((item) => (
                  <Circle
                    key={item.key}
                    cx={chart.toX(scrubIndex)}
                    cy={chart.toY(item.values[scrubIndex] ?? 0)}
                    r={4.5}
                    fill={item.color}
                    stroke={theme.surfaceAlt}
                    strokeWidth={2}
                  />
                ))}
              </>
            ) : null}
          </Svg>
        ) : null}

        {chart.scale.ticks.map((tick) => (
          <Text
            key={tick}
            numberOfLines={1}
            style={[styles.tickLabel, { color: theme.muted, top: chart.toY(tick) - 7 }]}>
            {formatCompactCurrency(tick)}
          </Text>
        ))}

        {width > 0
          ? yearTicks.map((year, index) => {
              const x = chart.toX((year / Math.max(termYears, 1)) * chart.lastIndex);
              const isFirst = index === 0;
              const isLast = index === yearTicks.length - 1;
              return (
                <Text
                  key={year}
                  numberOfLines={1}
                  style={[
                    styles.yearLabel,
                    {
                      color: theme.muted,
                      // Centre each label on its gridline, but pin the two ends inside
                      // the plot so they can't hang off the edge.
                      left: isFirst ? x : isLast ? undefined : x - YEAR_LABEL_WIDTH / 2,
                      right: isLast ? PLOT_INSET.right : undefined,
                      textAlign: isFirst ? 'left' : isLast ? 'right' : 'center',
                    },
                  ]}>
                  {year === 0 ? 'Today' : `${year} yrs`}
                </Text>
              );
            })
          : null}

        {scrubIndex !== null && width > 0 ? (
          <Tooltip
            x={chart.toX(scrubIndex)}
            width={width}
            year={describeIndex(scrubIndex, periodsPerYear)}
            rows={series.map((item) => ({
              color: item.color,
              label: item.label,
              value: formatCurrency(item.values[scrubIndex] ?? 0),
            }))}
          />
        ) : null}
      </View>

      <View style={styles.legend}>
        <LegendChip color={theme.seriesOwing} label={legend} />
        {showEquity ? (
          <LegendChip
            dashed
            color={theme.seriesHomeValue}
            label={`Est. home value ${
              homeValueLegend ??
              (homeValueGrowthPercent > 0
                ? `(grows ${homeValueGrowthPercent}% a year)`
                : '(assumes a constant home value)')
            }`}
          />
        ) : null}
        {showEquity ? <LegendChip color={theme.seriesEquity} label="Equity" /> : null}
      </View>
    </View>
  );
}

interface TooltipProps {
  x: number;
  width: number;
  year: string;
  rows: { color: string; label: string; value: string }[];
}

const TOOLTIP_WIDTH = 176;
const YEAR_LABEL_WIDTH = 56;

function Tooltip({ x, width, year, rows }: TooltipProps) {
  const theme = useTheme();
  // Keep the card inside the plot rather than letting it run off the edge.
  const left = Math.min(
    Math.max(x - TOOLTIP_WIDTH / 2, Spacing.sm),
    width - TOOLTIP_WIDTH - Spacing.sm,
  );

  return (
    <View
      pointerEvents="none"
      style={[styles.tooltip, { left, backgroundColor: theme.surface, borderColor: theme.line }]}>
      <Text style={[styles.tooltipYear, { color: theme.muted }]}>{year}</Text>
      {rows.map((row) => (
        <View key={row.label} style={styles.tooltipRow}>
          <View style={[styles.lineKey, { backgroundColor: row.color }]} />
          <Text style={[styles.tooltipLabel, { color: theme.inkSoft }]}>{row.label}</Text>
          <Text style={[styles.tooltipValue, { color: theme.ink }]}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

function LegendChip({
  color,
  label,
  dashed = false,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={styles.legendChip}>
      {/* The key mirrors the mark: a stroke for a line, broken when the line is. */}
      {dashed ? (
        <View style={styles.legendKey}>
          <View style={[styles.legendKeySegment, { backgroundColor: color }]} />
          <View style={styles.legendKeyGap} />
          <View style={[styles.legendKeySegment, { backgroundColor: color }]} />
        </View>
      ) : (
        <View style={[styles.legendKey, styles.legendKeySolid, { backgroundColor: color }]} />
      )}
      <Text style={[styles.legendText, { color: theme.inkSoft }]}>{label}</Text>
    </View>
  );
}

interface Point {
  x: number;
  y: number;
}

/**
 * Thins a polyline to the points that actually change its shape on screen. A 30 year
 * monthly series is hundreds of points, nearly all of them redundant at phone width —
 * and a dash pattern spread over hundreds of hairline segments renders as an uneven
 * stipple rather than clean dashes.
 *
 * Every dropped point is guaranteed to sit within `tolerance` pixels of the line that
 * replaces it, measured against the kept anchor rather than its neighbours, so the
 * error can't accumulate and straighten out a gentle curve.
 */
function dropCollinear(points: Point[], tolerance = 0.4): Point[] {
  if (points.length < 3) return points;
  const kept = [points[0]];
  let anchor = 0;

  for (let index = 1; index < points.length - 1; index += 1) {
    if (!chordFits(points, anchor, index + 1, tolerance)) {
      kept.push(points[index]);
      anchor = index;
    }
  }

  kept.push(points[points.length - 1]);
  return kept;
}

/** Whether a straight line from `from` to `to` stays within `tolerance` of every point it skips. */
function chordFits(points: Point[], from: number, to: number, tolerance: number): boolean {
  const start = points[from];
  const end = points[to];
  const span = end.x - start.x;

  for (let index = from + 1; index < to; index += 1) {
    const onLine =
      span === 0
        ? start.y
        : start.y + ((points[index].x - start.x) / span) * (end.y - start.y);
    if (Math.abs(points[index].y - onLine) > tolerance) return false;
  }

  return true;
}

function describeIndex(index: number, periodsPerYear: number): string {
  if (index === 0) return 'Today';
  const months = Math.round((index / periodsPerYear) * 12);
  if (months < 12) return `Month ${months}`;
  const years = index / periodsPerYear;
  const rounded = Math.round(years * 10) / 10;
  return `Year ${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}`;
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  plot: {
    height: HEIGHT,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  tickLabel: {
    position: 'absolute',
    left: 0,
    width: Y_AXIS_WIDTH - Spacing.sm,
    textAlign: 'right',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  yearLabel: {
    position: 'absolute',
    bottom: Spacing.xs,
    width: YEAR_LABEL_WIDTH,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '500',
  },
  tooltip: {
    position: 'absolute',
    top: Spacing.sm,
    width: TOOLTIP_WIDTH,
    borderRadius: Radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.sm,
    gap: 3,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  tooltipYear: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  tooltipLabel: {
    flex: 1,
    fontSize: 11,
  },
  tooltipValue: {
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  lineKey: {
    width: 10,
    height: 2.5,
    borderRadius: 2,
  },
  legend: {
    gap: Spacing.sm,
  },
  legendChip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  legendKey: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    width: 14,
  },
  legendKeySegment: {
    flex: 1,
    height: 2.5,
    borderRadius: 2,
  },
  legendKeySolid: {
    height: 2.5,
    borderRadius: 2,
  },
  legendKeyGap: {
    width: 3,
  },
  legendText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
});
