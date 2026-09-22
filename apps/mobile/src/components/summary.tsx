import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface HeroProps {
  label: string;
  value: string;
  /** Appended to the value in smaller type, e.g. "/ monthly". */
  unit: string;
  caption: string;
}

/** The headline repayment, the first thing on each calculator screen. */
export function SummaryHero({ label, value, unit, caption }: HeroProps) {
  const theme = useTheme();
  return (
    <View style={[styles.hero, { backgroundColor: theme.accent }]}>
      <Text style={styles.heroLabel}>{label}</Text>
      <View style={styles.heroValueRow}>
        <Text
          adjustsFontSizeToFit
          numberOfLines={1}
          minimumFontScale={0.6}
          style={styles.heroValue}>
          {value}
        </Text>
        <Text style={styles.heroUnit}>{unit}</Text>
      </View>
      <Text style={styles.heroCaption}>{caption}</Text>
    </View>
  );
}

export interface TileData {
  label: string;
  value: string;
}

/** Two-up grid of secondary figures under the hero. */
export function TileGrid({ tiles }: { tiles: TileData[] }) {
  const theme = useTheme();
  return (
    <View style={styles.tiles}>
      {tiles.map((tile) => (
        <View
          key={tile.label}
          style={[styles.tile, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          <Text style={[styles.tileLabel, { color: theme.muted }]}>{tile.label}</Text>
          <Text
            adjustsFontSizeToFit
            numberOfLines={1}
            minimumFontScale={0.7}
            style={[styles.tileValue, { color: theme.ink }]}>
            {tile.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    gap: Spacing.xs,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  heroValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
  heroValue: {
    color: '#ffffff',
    flexShrink: 1,
    fontSize: 44,
    fontWeight: '700',
    letterSpacing: -1,
  },
  heroUnit: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 15,
    fontWeight: '600',
  },
  heroCaption: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
  },
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  tile: {
    flexGrow: 1,
    flexBasis: '46%',
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  tileLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  tileValue: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
});
