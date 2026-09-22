import { StyleSheet, Text, View, type ViewProps } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** The grouped-inset container every section on a screen sits in. */
export function Card({ style, ...rest }: ViewProps) {
  const theme = useTheme();
  return (
    <View
      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line }, style]}
      {...rest}
    />
  );
}

/** Small uppercase heading above a card, the way iOS labels a settings group. */
export function SectionLabel({ children }: { children: string }) {
  const theme = useTheme();
  return <Text style={[styles.sectionLabel, { color: theme.muted }]}>{children.toUpperCase()}</Text>;
}

interface CalloutProps {
  children: React.ReactNode;
  /** Muted callouts explain a caveat rather than highlighting a saving. */
  muted?: boolean;
}

export function Callout({ children, muted }: CalloutProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.callout,
        {
          backgroundColor: muted ? theme.surfaceAlt : theme.accentSoft,
          borderColor: muted ? theme.line : 'transparent',
        },
      ]}>
      <Text style={[styles.calloutText, { color: muted ? theme.inkSoft : theme.ink }]}>
        {children}
      </Text>
    </View>
  );
}

/** A hairline divider between rows inside a card. */
export function Divider({ inset = Spacing.lg }: { inset?: number }) {
  const theme = useTheme();
  return <View style={[styles.divider, { backgroundColor: theme.line, marginLeft: inset }]} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  callout: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
  },
  calloutText: {
    fontSize: 14,
    lineHeight: 20,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
});
