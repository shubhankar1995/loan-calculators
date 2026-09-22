import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  /** Shown as the navigation bar's large title. */
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

/**
 * Scrolling shell shared by both calculators.
 *
 * The large title and its collapse-on-scroll behaviour come from the native
 * navigation bar, which finds the scroll view by walking the screen's children —
 * so this ScrollView has to stay the screen's first descendant (no wrapper) and
 * keep `contentInsetAdjustmentBehavior="automatic"`. Keyboard avoidance is
 * handled by `automaticallyAdjustKeyboardInsets` rather than a
 * `KeyboardAvoidingView` for the same reason.
 */
export function Screen({ title, subtitle, children }: Props) {
  const theme = useTheme();

  return (
    <>
      <Stack.Screen options={{ title, contentStyle: { backgroundColor: theme.pageBg } }} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled">
        <Text style={[styles.subtitle, { color: theme.inkSoft }]}>{subtitle}</Text>
        {children}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 20,
  },
});
