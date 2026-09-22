import { formatCurrency, projectedHomeValue } from '@loanlab/core';
import { useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

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

const HEIGHT = 240;
const PADDING = { top: 16, right: 8, bottom: 16, left: 8 };
const GRIDLINE_STEPS = 4;

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
    const max = Math.max(...balances, ...homeValues, 1);
    const lastIndex = Math.max(balances.length - 1, 1);
    const plotWidth = Math.max(width - PADDING.left - PADDING.right, 1);
    const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;

    const toX = (index: number) => PADDING.left + (index / lastIndex) * plotWidth;
    const toY = (value: number) => PADDING.top + (1 - value / max) * plotHeight;
    const toPath = (values: number[]) =>
      values.map((value, index) => `${index === 0 ? 'M' : 'L'}${toX(index)} ${toY(value)}`).join(' ');

    return {
      max,
      lastIndex,
      toX,
      toY,
      balancePath: toPath(balances),
      homeValuePath: showEquity ? toPath(homeValues) : '',
      equityPath: showEquity ? toPath(equity) : '',
      homeValues,
      equity,
    };
  }, [balances, homeValue, homeValueGrowthPercent, periodsPerYear, propertyValues, showEquity, width]);

  const ticks = Array.from(
    { length: GRIDLINE_STEPS + 1 },
    (_, index) => (chart.max * (GRIDLINE_STEPS - index)) / GRIDLINE_STEPS,
  );

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
    const { width: plotWidth, lastIndex } = scrubState.current;
    if (plotWidth <= 0) return;
    const usable = plotWidth - PADDING.left - PADDING.right;
    const ratio = (event.nativeEvent.locationX - PADDING.left) / usable;
    const index = Math.round(ratio * lastIndex);
    setScrubIndex(Math.min(Math.max(index, 0), lastIndex));
  }

  return (
    <View style={styles.container}>
      <View
        style={[styles.plot, { backgroundColor: theme.surfaceAlt, borderColor: theme.line }]}
        onLayout={onLayout}
        {...responder.panHandlers}>
        {width > 0 ? (
          <Svg width={width} height={HEIGHT}>
            {ticks.map((tick, index) => (
              <Line
                key={index}
                x1={PADDING.left}
                x2={width - PADDING.right}
                y1={chart.toY(tick)}
                y2={chart.toY(tick)}
                stroke={theme.line}
                strokeWidth={StyleSheet.hairlineWidth}
              />
            ))}
            <Path d={chart.balancePath} stroke={theme.accent} strokeWidth={2.5} fill="none" />
            {showEquity ? (
              <Path d={chart.homeValuePath} stroke={theme.homeValue} strokeWidth={2} fill="none" />
            ) : null}
            {showEquity ? (
              <Path d={chart.equityPath} stroke={theme.equity} strokeWidth={2} fill="none" />
            ) : null}
            {scrubIndex !== null ? (
              <>
                <Line
                  x1={chart.toX(scrubIndex)}
                  x2={chart.toX(scrubIndex)}
                  y1={PADDING.top}
                  y2={HEIGHT - PADDING.bottom}
                  stroke={theme.muted}
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                <Circle
                  cx={chart.toX(scrubIndex)}
                  cy={chart.toY(balances[scrubIndex])}
                  r={4}
                  fill={theme.accent}
                  stroke={theme.surface}
                  strokeWidth={2}
                />
                {showEquity ? (
                  <>
                    <Circle
                      cx={chart.toX(scrubIndex)}
                      cy={chart.toY(chart.homeValues[scrubIndex])}
                      r={4}
                      fill={theme.homeValue}
                      stroke={theme.surface}
                      strokeWidth={2}
                    />
                    <Circle
                      cx={chart.toX(scrubIndex)}
                      cy={chart.toY(chart.equity[scrubIndex])}
                      r={4}
                      fill={theme.equity}
                      stroke={theme.surface}
                      strokeWidth={2}
                    />
                  </>
                ) : null}
              </>
            ) : null}
          </Svg>
        ) : null}

        {ticks.slice(0, -1).map((tick, index) => (
          <Text
            key={index}
            style={[styles.tickLabel, { color: theme.muted, top: chart.toY(tick) + 2 }]}>
            {formatCurrency(tick)}
          </Text>
        ))}

        {scrubIndex !== null && width > 0 ? (
          <Tooltip
            x={chart.toX(scrubIndex)}
            width={width}
            year={describeIndex(scrubIndex, periodsPerYear)}
            rows={[
              { color: theme.accent, label: 'Owing', value: formatCurrency(balances[scrubIndex]) },
              ...(showEquity
                ? [
                    {
                      color: theme.homeValue,
                      label: 'Home value',
                      value: formatCurrency(chart.homeValues[scrubIndex]),
                    },
                    {
                      color: theme.equity,
                      label: 'Equity',
                      value: formatCurrency(chart.equity[scrubIndex]),
                    },
                  ]
                : []),
            ]}
          />
        ) : null}
      </View>

      <View style={styles.axis}>
        <Text style={[styles.axisLabel, { color: theme.muted }]}>Today</Text>
        <Text style={[styles.axisLabel, { color: theme.muted }]}>{termYears} years</Text>
      </View>

      <View style={styles.legend}>
        <LegendChip color={theme.accent} label={legend} />
        {showEquity ? (
          <LegendChip
            color={theme.homeValue}
            label={`Est. home value ${
              homeValueLegend ??
              (homeValueGrowthPercent > 0
                ? `(grows ${homeValueGrowthPercent}% a year)`
                : '(assumes a constant home value)')
            }`}
          />
        ) : null}
        {showEquity ? <LegendChip color={theme.equity} label="Equity" /> : null}
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

const TOOLTIP_WIDTH = 168;

function Tooltip({ x, width, year, rows }: TooltipProps) {
  const theme = useTheme();
  // Keep the card inside the plot rather than letting it run off the edge.
  const left = Math.min(Math.max(x - TOOLTIP_WIDTH / 2, Spacing.sm), width - TOOLTIP_WIDTH - Spacing.sm);

  return (
    <View
      pointerEvents="none"
      style={[styles.tooltip, { left, backgroundColor: theme.surface, borderColor: theme.line }]}>
      <Text style={[styles.tooltipYear, { color: theme.muted }]}>{year}</Text>
      {rows.map((row) => (
        <View key={row.label} style={styles.tooltipRow}>
          <View style={[styles.dot, { backgroundColor: row.color }]} />
          <Text style={[styles.tooltipLabel, { color: theme.inkSoft }]}>{row.label}</Text>
          <Text style={[styles.tooltipValue, { color: theme.ink }]}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

function LegendChip({ color, label }: { color: string; label: string }) {
  const theme = useTheme();
  return (
    <View style={styles.legendChip}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.legendText, { color: theme.inkSoft }]}>{label}</Text>
    </View>
  );
}

function describeIndex(index: number, periodsPerYear: number): string {
  const years = index / periodsPerYear;
  if (years < 1) return 'Today';
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
    left: Spacing.sm,
    fontSize: 10,
    fontWeight: '500',
  },
  tooltip: {
    position: 'absolute',
    top: Spacing.sm,
    width: TOOLTIP_WIDTH,
    borderRadius: Radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.sm,
    gap: 2,
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
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  axis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  axisLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  legend: {
    gap: Spacing.xs,
  },
  legendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  legendText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
});
