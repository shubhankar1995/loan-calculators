import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  title: string;
  /** Shown to the right of the title when collapsed, e.g. "$500 / month". */
  summary?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/** The mobile stand-in for the web app's `<details>` sections. */
export function Collapsible({ title, summary, defaultOpen = false, children }: Props) {
  const theme = useTheme();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => {
          Haptics.selectionAsync();
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setOpen((previous) => !previous);
        }}
        style={styles.header}>
        <Text style={[styles.title, { color: theme.ink }]}>{title}</Text>
        {summary && !open ? (
          <Text numberOfLines={1} style={[styles.summary, { color: theme.muted }]}>
            {summary}
          </Text>
        ) : null}
        <SymbolView
          name={open ? 'chevron.up' : 'chevron.down'}
          size={12}
          tintColor={theme.muted}
        />
      </Pressable>
      {open ? <View style={{ borderTopColor: theme.line, borderTopWidth: StyleSheet.hairlineWidth }}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  summary: {
    flex: 1,
    fontSize: 14,
    textAlign: 'right',
  },
});
