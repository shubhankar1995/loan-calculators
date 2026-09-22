import {
  addMonths,
  formatCurrency,
  formatMonthYear,
  parseISODate,
  type MonthlyBalance,
} from '@repayly/core';
import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  /** Date the loan starts, as an "yyyy-MM-dd" string. */
  startDate: string;
  monthlyBalances: MonthlyBalance[];
}

interface Row {
  key: number;
  label: string;
  balance: number;
  repayment: number;
  interest: number;
  principal: number;
  offsetBalance: number;
}

interface YearGroup {
  year: number;
  rows: Row[];
  repayment: number;
  interest: number;
  principal: number;
  balance: number;
  offsetBalance: number;
}

/**
 * The repayment schedule, grouped by calendar year. Years start collapsed —
 * 360 rows at once is unreadable on a phone — and expand to their months.
 */
export function ScheduleList({ startDate, monthlyBalances }: Props) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set());

  const { groups, showOffset } = useMemo(() => {
    const start = parseISODate(startDate);
    const yearGroups: YearGroup[] = [];

    for (const month of monthlyBalances) {
      const date = addMonths(start, month.monthsElapsed);
      const row: Row = {
        key: month.monthsElapsed,
        label: formatMonthYear(date),
        balance: month.balance,
        repayment: month.repayment,
        interest: month.interest,
        principal: month.principal,
        offsetBalance: month.offsetBalance,
      };
      const year = date.getFullYear();
      const last = yearGroups[yearGroups.length - 1];
      if (last && last.year === year) {
        last.rows.push(row);
      } else {
        yearGroups.push({
          year,
          rows: [row],
          repayment: 0,
          interest: 0,
          principal: 0,
          balance: 0,
          offsetBalance: 0,
        });
      }
    }

    for (const group of yearGroups) {
      group.repayment = group.rows.reduce((sum, row) => sum + row.repayment, 0);
      group.interest = group.rows.reduce((sum, row) => sum + row.interest, 0);
      group.principal = group.rows.reduce((sum, row) => sum + row.principal, 0);
      const last = group.rows[group.rows.length - 1];
      group.balance = last.balance;
      group.offsetBalance = last.offsetBalance;
    }

    return {
      groups: yearGroups,
      showOffset: monthlyBalances.some((month) => month.offsetBalance > 0),
    };
  }, [monthlyBalances, startDate]);

  const toggle = (year: number) => {
    Haptics.selectionAsync();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  };

  return (
    <View style={[styles.list, { borderColor: theme.line }]}>
      <View style={[styles.headerRow, { backgroundColor: theme.surfaceAlt }]}>
        <Text style={[styles.headerText, { color: theme.muted }]}>Period</Text>
        <Text style={[styles.headerText, { color: theme.muted }]}>Owing at end</Text>
      </View>

      {groups.map((group, index) => {
        const open = expanded.has(group.year);
        return (
          <View key={group.year}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
              accessibilityLabel={`${group.year}, owing ${formatCurrency(group.balance)}`}
              onPress={() => toggle(group.year)}
              style={[
                styles.yearRow,
                index > 0 && { borderTopColor: theme.line, borderTopWidth: StyleSheet.hairlineWidth },
              ]}>
              <SymbolView
                name={open ? 'chevron.down' : 'chevron.right'}
                size={11}
                tintColor={theme.muted}
                style={styles.chevron}
              />
              <View style={styles.rowMain}>
                <Text style={[styles.yearLabel, { color: theme.ink }]}>{group.year}</Text>
                <Text style={[styles.rowMeta, { color: theme.muted }]}>
                  Paid {formatCurrency(group.repayment)} · Interest{' '}
                  {formatCurrency(group.interest)}
                  {showOffset ? ` · Offset ${formatCurrency(group.offsetBalance)}` : ''}
                </Text>
              </View>
              <Text style={[styles.rowValue, { color: theme.ink }]}>
                {formatCurrency(group.balance)}
              </Text>
            </Pressable>

            {open
              ? group.rows.map((row) => (
                  <View
                    key={row.key}
                    style={[
                      styles.monthRow,
                      { backgroundColor: theme.surfaceAlt, borderTopColor: theme.line },
                    ]}>
                    <View style={styles.rowMain}>
                      <Text style={[styles.monthLabel, { color: theme.inkSoft }]}>{row.label}</Text>
                      <Text style={[styles.rowMeta, { color: theme.muted }]}>
                        Paid {formatCurrency(row.repayment)} · Interest{' '}
                        {formatCurrency(row.interest)} · Principal {formatCurrency(row.principal)}
                      </Text>
                    </View>
                    <Text style={[styles.rowValue, { color: theme.inkSoft }]}>
                      {formatCurrency(row.balance)}
                    </Text>
                  </View>
                ))
              : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  headerText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  chevron: {
    width: 12,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingLeft: Spacing.xl + Spacing.md,
    paddingRight: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rowMain: {
    flex: 1,
    gap: 2,
  },
  yearLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  rowMeta: {
    fontSize: 11,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
